/**
 * Optimized AI service with video analysis strategies
 */

import { AIService, AIResponse, YouTubePluginSettings } from '../types/types';
import { VideoOptimizationEngine, VideoAnalysisStrategy } from '../video-optimization';
import { YouTubeTranscriptService } from './transcript-service';
import { ErrorHandler } from './error-handler';

export interface OptimizedProcessingOptions {
    videoId: string;
    videoLength?: number;
    hasTranscript?: boolean;
    format: string;
    performanceMode: string;
    preferTranscript?: boolean;
}

export class OptimizedAIService {
    constructor(
        private baseAIService: AIService,
        private settings: YouTubePluginSettings,
        private transcriptService: YouTubeTranscriptService
    ) {}

    /**
     * Process video with optimal strategy
     */
    async processOptimized(
        prompt: string,
        options: OptimizedProcessingOptions
    ): Promise<AIResponse> {
        // Select optimal strategy
        const strategy = VideoOptimizationEngine.selectOptimalStrategy(
            options.videoLength || 0,
            options.performanceMode,
            options.hasTranscript || false,
            options.format
        );

        console.log(`Using ${strategy.name} strategy for video analysis`);

        // Process based on strategy
        switch (strategy.name) {
            case 'Transcript Analysis':
                return this.processWithTranscript(prompt, options);

            case 'Metadata-First':
                return this.processWithMetadata(prompt, options);

            case 'Sample-Based Analysis':
                return this.processWithSampling(prompt, options);

            case 'Chunked Processing':
                return this.processWithChunks(prompt, options);

            case 'Comprehensive Analysis':
            default:
                return this.baseAIService.process(prompt);
        }
    }

    /**
     * Fast transcript-based analysis
     */
    private async processWithTranscript(
        basePrompt: string,
        options: OptimizedProcessingOptions
    ): Promise<AIResponse> {
        if (!options.hasTranscript) {
            throw new Error('Transcript analysis requested but no transcript available');
        }

        // Get transcript summary for quick processing
        const transcriptSummary = await this.transcriptService.getTranscriptSummary(
            options.videoId,
            2000 // Limit to 2000 chars for fast processing
        );

        if (!transcriptSummary) {
            // Fallback to standard processing
            return this.baseAIService.process(basePrompt);
        }

        // Create optimized prompt with transcript
        const optimizedPrompt = `${basePrompt}

TRANSCRIPT:
${transcriptSummary}

Focus on extracting key insights from this transcript content. Provide actionable takeaways based on the spoken content.`;

        return this.baseAIService.process(optimizedPrompt);
    }

    /**
     * Metadata-first analysis for very fast processing
     */
    private async processWithMetadata(
        basePrompt: string,
        options: OptimizedProcessingOptions
    ): Promise<AIResponse> {
        // Create a lightweight prompt focused on available metadata
        const optimizedPrompt = VideoOptimizationEngine.createOptimizedPrompt(
            VideoOptimizationEngine.selectOptimalStrategy(
                options.videoLength || 0,
                'fast',
                false,
                options.format
            ),
            { title: 'Video', description: 'Analysis based on available metadata' },
            `https://youtube.com/watch?v=${options.videoId}`,
            options.format
        );

        return this.baseAIService.process(optimizedPrompt);
    }

    /**
     * Sample-based analysis with key moments
     */
    private async processWithSampling(
        basePrompt: string,
        options: OptimizedProcessingOptions
    ): Promise<AIResponse> {
        // Extract key moments from transcript if available
        const keyMoments = options.hasTranscript ?
            await this.transcriptService.extractKeyMoments(options.videoId, 5) :
            null;

        let optimizedPrompt = basePrompt;

        if (keyMoments && keyMoments.length > 0) {
            const keyMomentsText = keyMoments
                .map(moment => `[${Math.floor(moment.time / 60)}:${(moment.time % 60).toString().padStart(2, '0')}] ${moment.text}`)
                .join('\n');

            optimizedPrompt = `${basePrompt}

KEY SEGMENTS:
${keyMomentsText}

Focus on these key segments to provide a comprehensive analysis of the video's main insights.`;
        }

        return this.baseAIService.process(optimizedPrompt);
    }

    /**
     * Chunked processing for long videos
     */
    private async processWithChunks(
        basePrompt: string,
        options: OptimizedProcessingOptions
    ): Promise<AIResponse> {
        if (!options.videoLength) {
            return this.baseAIService.process(basePrompt);
        }

        // Generate chunks for analysis
        const strategy = VideoOptimizationEngine.selectOptimalStrategy(
            options.videoLength,
            options.performanceMode,
            false,
            options.format
        );

        const chunks = VideoOptimizationEngine.generateVideoChunks(
            options.videoLength,
            strategy
        );

        if (chunks.length === 0) {
            return this.baseAIService.process(basePrompt);
        }

        try {
            // Process chunks in parallel with limited concurrency
            const chunkResults = await this.processChunksInParallel(
                chunks,
                options,
                Math.min(3, chunks.length) // Process up to 3 chunks in parallel
            );

            // Combine results
            const combinedContent = this.combineChunkResults(chunkResults, options.format);

            return {
                content: combinedContent,
                provider: 'Optimized Processing',
                model: 'Chunked Analysis'
            };

        } catch (error) {
            console.warn('Chunked processing failed, falling back to standard processing:', error);
            return this.baseAIService.process(basePrompt);
        }
    }

    /**
     * Process multiple chunks in parallel with limited concurrency
     */
    private async processChunksInParallel(
        chunks: any[],
        options: OptimizedProcessingOptions,
        concurrency: number
    ): Promise<Array<{ chunk: any; content: string }>> {
        const results: Array<{ chunk: any; content: string }> = [];

        // Process chunks in batches
        for (let i = 0; i < chunks.length; i += concurrency) {
            const batch = chunks.slice(i, i + concurrency);

            const batchPromises = batch.map(async (chunk) => {
                const chunkPrompt = this.createChunkPrompt(chunk, options);
                const response = await this.baseAIService.process(chunkPrompt);
                return {
                    chunk,
                    content: response.content
                };
            });

            const batchResults = await Promise.allSettled(batchPromises);

            // Collect successful results
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.warn(`Chunk ${batch[index].description} failed:`, result.reason);
                }
            });
        }

        return results;
    }

    /**
     * Create prompt for specific chunk analysis
     */
    private createChunkPrompt(chunk: any, options: OptimizedProcessingOptions): string {
        return `Analyze this segment of a YouTube video:

Segment: ${chunk.description}
Time: ${Math.floor(chunk.startTime / 60)}:${(chunk.startTime % 60).toString().padStart(2, '0')} - ${Math.floor(chunk.endTime / 60)}:${(chunk.endTime % 60).toString().padStart(2, '0')}

Video URL: https://youtube.com/watch?v=${options.videoId}

Provide a focused analysis of this segment, highlighting key insights, demonstrations, or important points discussed.

Format the response as part of a ${options.format}. Focus on the specific content from this time segment.`;
    }

    /**
     * Combine results from multiple chunks
     */
    private combineChunkResults(
        chunkResults: Array<{ chunk: any; content: string }>,
        format: string
    ): string {
        // Sort chunks by start time
        chunkResults.sort((a, b) => a.chunk.startTime - b.chunk.startTime);

        // Combine content with proper formatting
        let combinedContent = '';

        chunkResults.forEach((result, index) => {
            if (index === 0) {
                combinedContent += result.content;
            } else {
                // Remove duplicate headers and combine body content
                const lines = result.content.split('\n');
                const bodyLines = lines.filter(line =>
                    !line.startsWith('---') &&
                    !line.startsWith('title:') &&
                    !line.startsWith('source:')
                );
                combinedContent += '\n\n' + bodyLines.join('\n');
            }
        });

        return combinedContent;
    }

    /**
     * Estimate processing time with optimizations
     */
    estimateProcessingTime(options: OptimizedProcessingOptions): {
        min: number;
        max: number;
        strategy: string;
        description: string;
    } {
        const strategy = VideoOptimizationEngine.selectOptimalStrategy(
            options.videoLength || 0,
            options.performanceMode,
            options.hasTranscript || false,
            options.format
        );

        const baseTime = this.estimateBaseProcessingTime(options.videoLength || 0, options.format);
        const optimized = VideoOptimizationEngine.estimateOptimizedProcessingTime(
            options.videoLength || 0,
            strategy,
            baseTime
        );

        return {
            min: optimized.min,
            max: optimized.max,
            strategy: strategy.name,
            description: strategy.description
        };
    }

    /**
     * Estimate base processing time without optimizations
     */
    private estimateBaseProcessingTime(videoLength: number, format: string): number {
        const baseTime = Math.max(15, videoLength / 60); // 1 second per minute, minimum 15s

        const formatMultipliers = {
            'brief': 0.5,
            'executive-summary': 0.8,
            'detailed-guide': 1.2,
            'custom': 1.0
        };

        return baseTime * (formatMultipliers[format] || 1.0);
    }
}