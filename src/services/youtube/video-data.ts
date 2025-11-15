/**
 * YouTube video data extraction service
 */

import { VideoDataService, VideoData, CacheService } from '../../interfaces/types';
import { API_ENDPOINTS, API_LIMITS } from '../../constants/api';
import { MESSAGES } from '../../constants/messages';
import { ValidationUtils } from '../../utils/validation';
import { ErrorHandler } from '../../utils/error-handler';

export class YouTubeVideoService implements VideoDataService {
    private readonly metadataTTL = 1000 * 60 * 30; // 30 minutes
    private readonly descriptionTTL = 1000 * 60 * 30; // 30 minutes

    constructor(private cache?: CacheService) {}
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
            // Get metadata and description in parallel
            const [metadata, description] = await Promise.all([
                this.getVideoMetadata(videoId),
                this.getVideoDescription(videoId)
            ]);

            const result: VideoData = {
                title: metadata.title || 'Unknown Title',
                description: description || 'No description available'
            };

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
    private async getVideoMetadata(videoId: string): Promise<{ title: string }> {
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
                    'User-Agent': 'Obsidian YouTube Processor Plugin'
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
            const metadata = {
                title: data.title || 'Unknown Title'
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
