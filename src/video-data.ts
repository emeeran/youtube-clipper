/**
 * YouTube video data extraction service
 */

import { VideoDataService, VideoData, CacheService } from './types/types';
import { API_ENDPOINTS, API_LIMITS } from './api';
import { MESSAGES } from './messages';
import { ValidationUtils } from './validation';
import { ErrorHandler } from './services/error-handler';
import { YouTubeTranscriptService } from './services/transcript-service';
import { VideoOptimizationEngine, VideoAnalysisStrategy } from './video-optimization';

export interface EnhancedVideoData extends VideoData {
    duration?: number;
    hasTranscript?: boolean;
    strategy?: VideoAnalysisStrategy;
    estimatedProcessingTime?: number;
    thumbnail?: string;
    channelName?: string;
}

export class YouTubeVideoService implements VideoDataService {
    private readonly metadataTTL = 1000 * 60 * 30; // 30 minutes
    private readonly descriptionTTL = 1000 * 60 * 30; // 30 minutes
    private transcriptService: YouTubeTranscriptService;

    constructor(private cache?: CacheService) {
        this.transcriptService = new YouTubeTranscriptService(cache);
    }
    /**
     * Extract video ID from YouTube URL
     */
    extractVideoId(url: string): string | null {
        return ValidationUtils.extractVideoId(url);
    }

    /**
     * Get video metadata and description
     */
    async getVideoData(videoId: string): Promise<VideoData> {
        if (!videoId) {
            throw new Error('Video ID is required');
        }

        const cacheKey = this.getCacheKey('video-data', videoId);
        const cached = this.cache?.get<VideoData>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // Get basic metadata first
            const metadata = await this.getVideoMetadata(videoId);

            // Enhanced video data with optimization info
            const result: EnhancedVideoData = {
                title: metadata.title || 'Unknown Title',
                description: metadata.description || 'No description available',
                duration: metadata.duration,
                thumbnail: metadata.thumbnail,
                channelName: metadata.channelName
            };

            // Check for transcript availability in background
            if (result.duration && result.duration < 1800) { // Only check for videos < 30 mins
                this.checkTranscriptAvailability(videoId).then(hasTranscript => {
                    result.hasTranscript = hasTranscript;
                    // Cache the enhanced data
                    this.cache?.set(cacheKey, result, this.metadataTTL);
                });
            }

            this.cache?.set(cacheKey, result, this.metadataTTL);
            return result;
        } catch (error) {
            throw ErrorHandler.createUserFriendlyError(
                error as Error, 
                'fetch video data'
            );
        }
    }

    /**
     * Get video metadata using YouTube oEmbed API
     */
    private async getVideoMetadata(videoId: string): Promise<{
        title: string;
        description?: string;
        duration?: number;
        thumbnail?: string;
        channelName?: string;
    }> {
        const cacheKey = this.getCacheKey('metadata', videoId);
        const cached = this.cache?.get<{ title: string }>(cacheKey);
        if (cached) {
            return cached;
        }

        const oembedUrl = `${API_ENDPOINTS.YOUTUBE_OEMBED}?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        
        try {
            // Create timeout controller for the request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(oembedUrl, {
                headers: {
                    'User-Agent': 'Obsidian YoutubeClipper Plugin'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId); // Clear timeout if request completes
            
            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error(`Invalid YouTube video ID: ${videoId}. Please check the URL and try again.`);
                } else if (response.status === 404) {
                    throw new Error(`YouTube video not found: ${videoId}. The video may be private, deleted, or the ID is incorrect.`);
                } else if (response.status === 403) {
                    throw new Error(`Access denied to YouTube video: ${videoId}. The video may be private or restricted.`);
                } else {
                    throw new Error(MESSAGES.ERRORS.FETCH_VIDEO_DATA(response.status));
                }
            }

            const data = await response.json();

            // Get additional metadata by scraping video page
            let enhancedData: any = {
                title: data.title || 'Unknown Title',
                thumbnail: data.thumbnail_url,
                author_name: data.author_name
            };

            // Try to get duration and description from page scraping
            try {
                const pageData = await this.scrapeAdditionalMetadata(videoId);
                enhancedData = { ...enhancedData, ...pageData };
            } catch (error) {
                // Ignore scraping errors, proceed with oEmbed data
                console.debug('Could not scrape additional metadata:', error);
            }

            const metadata = {
                title: enhancedData.title,
                description: enhancedData.description,
                duration: enhancedData.duration,
                thumbnail: enhancedData.thumbnail,
                channelName: enhancedData.author_name
            };

            this.cache?.set(cacheKey, metadata, this.metadataTTL);
            return metadata;
        } catch (error) {
            // Handle different types of errors
            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your internet connection and try again.');
            } else if (error instanceof TypeError) {
                // Network error
                throw new Error(MESSAGES.ERRORS.NETWORK_ERROR);
            } else if (error instanceof Error && error.message.includes('JSON')) {
                throw new Error('Failed to parse YouTube response. The service may be temporarily unavailable.');
            }
            throw error; // Re-throw other errors
        }
    }

    /**
     * Scrape additional metadata from YouTube page
     */
    private async scrapeAdditionalMetadata(videoId: string): Promise<{
        description?: string;
        duration?: number;
    }> {
        try {
            const html = await this.fetchVideoPageHTML(videoId);

            // Extract duration
            const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
            const duration = durationMatch ? parseInt(durationMatch[1]) : undefined;

            // Extract description
            const descriptionMatch = html.match(/"shortDescription":"([^"]+)"/);
            const description = descriptionMatch ?
                descriptionMatch[1].replace(/\\u0026/g, '&').replace(/\\n/g, '\n') :
                undefined;

            return { description, duration };
        } catch (error) {
            return {};
        }
    }

    /**
     * Check if transcript is available for this video
     */
    private async checkTranscriptAvailability(videoId: string): Promise<boolean> {
        try {
            return await this.transcriptService.isTranscriptAvailable(videoId);
        } catch (error) {
            return false;
        }
    }

    /**
     * Get video description by scraping the YouTube page
     */
    private async getVideoDescription(videoId: string): Promise<string> {
        const cacheKey = this.getCacheKey('description', videoId);
        const cached = this.cache?.get<string>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const html = await this.fetchVideoPageHTML(videoId);
            const description = this.extractDescriptionFromHTML(html);
            this.cache?.set(cacheKey, description, this.descriptionTTL);
            return description;
        } catch (error) {
            console.warn('Failed to scrape video page:', error);
            const fallback = MESSAGES.WARNINGS.EXTRACTION_FAILED;
            this.cache?.set(cacheKey, fallback, this.descriptionTTL);
            return fallback;
        }
    }

    /**
     * Fetch YouTube page HTML using CORS proxy
     */
    private async fetchVideoPageHTML(videoId: string): Promise<string> {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const proxyUrl = `${API_ENDPOINTS.CORS_PROXY}?url=${encodeURIComponent(videoUrl)}`;
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(MESSAGES.WARNINGS.CORS_RESTRICTIONS);
        }

        return response.text();
    }

    /**
     * Extract description from YouTube page HTML
     */
    private extractDescriptionFromHTML(html: string): string {
        const patterns = [
            /"shortDescription":"([^"]*?)"/,
            /"description":{"simpleText":"([^"]*?)"}/,
            /<meta name="description" content="([^"]*?)">/,
            /<meta property="og:description" content="([^"]*?)">/
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                const cleanedText = ValidationUtils.cleanText(match[1]);
                return ValidationUtils.truncateText(cleanedText, API_LIMITS.DESCRIPTION_MAX_LENGTH);
            }
        }

        return MESSAGES.WARNINGS.AUTO_EXTRACTION;
    }

    /**
     * Validate YouTube URL and extract video ID
     */
    validateAndExtractVideoId(url: string): string {
        if (!ValidationUtils.isValidYouTubeUrl(url)) {
            throw new Error(MESSAGES.ERRORS.INVALID_URL);
        }

        const videoId = this.extractVideoId(url);
        if (!videoId) {
            throw new Error(MESSAGES.ERRORS.INVALID_URL);
        }

        return videoId;
    }

    private getCacheKey(namespace: string, videoId: string): string {
        return `youtube-video-service:${namespace}:${videoId}`;
    }
}
