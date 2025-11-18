/**
 * Video analysis optimization strategies and configurations
 */

export interface VideoAnalysisStrategy {
    name: string;
    description: string;
    maxVideoLength: number; // in seconds
    requiresTranscript: boolean;
    chunkProcessing: boolean;
    priorityLevel: number; // 1=fastest, 3=slowest
    estimatedTimeReduction: number; // percentage
}

export const ANALYSIS_STRATEGIES: Record<string, VideoAnalysisStrategy> = {
    'transcript-only': {
        name: 'Transcript Analysis',
        description: 'Use YouTube transcript only (fastest)',
        maxVideoLength: 1800, // 30 minutes
        requiresTranscript: true,
        chunkProcessing: false,
        priorityLevel: 1,
        estimatedTimeReduction: 70
    },
    'metadata-first': {
        name: 'Metadata-First',
        description: 'Analyze title, description, and metadata first',
        maxVideoLength: 300, // 5 minutes
        requiresTranscript: false,
        chunkProcessing: false,
        priorityLevel: 1,
        estimatedTimeReduction: 80
    },
    'sample-based': {
        name: 'Sample-Based Analysis',
        description: 'Analyze key segments (intro, key points, conclusion)',
        maxVideoLength: 600, // 10 minutes
        requiresTranscript: false,
        chunkProcessing: true,
        priorityLevel: 2,
        estimatedTimeReduction: 60
    },
    'chunked-visualization': {
        name: 'Chunked Processing',
        description: 'Process video in 2-minute chunks with key frames',
        maxVideoLength: 1800, // 30 minutes
        requiresTranscript: false,
        chunkProcessing: true,
        priorityLevel: 2,
        estimatedTimeReduction: 50
    },
    'comprehensive': {
        name: 'Comprehensive Analysis',
        description: 'Full video analysis with multimodal processing',
        maxVideoLength: Infinity,
        requiresTranscript: false,
        chunkProcessing: false,
        priorityLevel: 3,
        estimatedTimeReduction: 0
    }
};

export interface VideoChunk {
    startTime: number;
    endTime: number;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

export interface VideoSegment {
    start: number;
    end: number;
    title: string;
    analysisType: 'intro' | 'key-points' | 'demonstration' | 'conclusion';
}

export class VideoOptimizationEngine {

    /**
     * Select optimal analysis strategy based on video characteristics and user preferences
     */
    static selectOptimalStrategy(
        videoLength: number,
        performanceMode: string,
        hasTranscript: boolean,
        format: string
    ): VideoAnalysisStrategy {
        // For very short videos, always use metadata-first
        if (videoLength < 120) {
            return ANALYSIS_STRATEGIES['metadata-first'];
        }

        // For short videos in fast mode
        if (videoLength < 300 && performanceMode === 'fast') {
            return ANALYSIS_STRATEGIES['metadata-first'];
        }

        // For fast mode with available transcript
        if (performanceMode === 'fast' && hasTranscript && videoLength < 1800) {
            return ANALYSIS_STRATEGIES['transcript-only'];
        }

        // For balanced mode with medium-length videos
        if (performanceMode === 'balanced' && videoLength < 600) {
            return ANALYSIS_STRATEGIES['sample-based'];
        }

        // For long videos, always use chunking
        if (videoLength > 1800) {
            return ANALYSIS_STRATEGIES['chunked-visualization'];
        }

        // Default to comprehensive for quality mode
        if (performanceMode === 'quality') {
            return ANALYSIS_STRATEGIES['comprehensive'];
        }

        // Default balanced choice
        return ANALYSIS_STRATEGIES['sample-based'];
    }

    /**
     * Generate optimal chunks for video analysis
     */
    static generateVideoChunks(
        videoLength: number,
        strategy: VideoAnalysisStrategy
    ): VideoChunk[] {
        if (!strategy.chunkProcessing) {
            return [];
        }

        const chunks: VideoChunk[] = [];
        const chunkDuration = 120; // 2 minutes per chunk

        // Always analyze first 2 minutes (high priority)
        chunks.push({
            startTime: 0,
            endTime: Math.min(chunkDuration, videoLength),
            description: 'Introduction and overview',
            priority: 'high'
        });

        // Sample key segments throughout the video
        const numSamples = Math.min(5, Math.ceil(videoLength / chunkDuration));
        for (let i = 1; i < numSamples; i++) {
            const startTime = i * chunkDuration;
            const endTime = Math.min(startTime + chunkDuration, videoLength);

            chunks.push({
                startTime,
                endTime,
                description: `Segment ${i + 1}: ${startTime / 60}-${endTime / 60} minutes`,
                priority: i < 3 ? 'high' : 'medium'
            });
        }

        // Always analyze last 2 minutes (high priority)
        if (videoLength > chunkDuration) {
            chunks.push({
                startTime: Math.max(0, videoLength - chunkDuration),
                endTime: videoLength,
                description: 'Conclusion and summary',
                priority: 'high'
            });
        }

        return chunks;
    }

    /**
     * Create smart video segments for focused analysis
     */
    static createVideoSegments(videoLength: number): VideoSegment[] {
        const segments: VideoSegment[] = [];

        // Introduction segment
        segments.push({
            start: 0,
            end: Math.min(60, videoLength * 0.1),
            title: 'Introduction',
            analysisType: 'intro'
        });

        // Key points in middle sections
        if (videoLength > 180) {
            const midStart = videoLength * 0.3;
            const midEnd = videoLength * 0.7;
            segments.push({
                start: midStart,
                end: midEnd,
                title: 'Main Content',
                analysisType: 'key-points'
            });
        }

        // Conclusion segment
        if (videoLength > 120) {
            segments.push({
                start: Math.max(videoLength - 60, 0),
                end: videoLength,
                title: 'Conclusion',
                analysisType: 'conclusion'
            });
        }

        return segments;
    }

    /**
     * Estimate processing time with optimization
     */
    static estimateOptimizedProcessingTime(
        videoLength: number,
        strategy: VideoAnalysisStrategy,
        baseTime: number
    ): { min: number; max: number; optimized: number } {
        const timeReduction = strategy.estimatedTimeReduction / 100;
        let optimizedTime = baseTime * (1 - timeReduction);

        // Add time for transcript processing if required
        if (strategy.requiresTranscript) {
            const transcriptTime = Math.min(videoLength / 30, 30); // 1s processing per 30s of video
            optimizedTime += transcriptTime;
        }

        // Add overhead for chunk processing
        if (strategy.chunkProcessing && videoLength > 600) {
            const overhead = (videoLength / 600) * 5; // 5s overhead per 10 minutes
            optimizedTime += overhead;
        }

        return {
            min: Math.round(optimizedTime * 0.7),
            max: Math.round(optimizedTime * 1.3),
            optimized: Math.round(optimizedTime)
        };
    }

    /**
     * Generate optimized prompt based on strategy
     */
    static createOptimizedPrompt(
        strategy: VideoAnalysisStrategy,
        videoData: any,
        videoUrl: string,
        format: string
    ): string {
        let basePrompt = '';

        switch (strategy.name) {
            case 'Transcript Analysis':
                basePrompt = `Analyze this YouTube video transcript efficiently:
Title: ${videoData.title}
URL: ${videoUrl}

Focus on extracting key insights from the transcript content. Prioritize accuracy and actionable takeaways.`;
                break;

            case 'Metadata-First':
                basePrompt = `Quick analysis of YouTube video based on title and description:
Title: ${videoData.title}
Description: ${videoData.description}
URL: ${videoUrl}

Extract the main insights and value proposition from the available information. Focus on what viewers can learn.`;
                break;

            case 'Sample-Based Analysis':
                basePrompt = `Analyze key segments of this YouTube video:
Title: ${videoData.title}
URL: ${videoUrl}

Review introduction, main points, and conclusion to provide a comprehensive understanding. Focus on the core message and practical takeaways.`;
                break;

            case 'Chunked Processing':
                basePrompt = `Analyze this YouTube video using chunked processing:
Title: ${videoData.title}
URL: ${videoUrl}

Review key segments (introduction, main content, conclusion) to extract insights. Synthesize information from multiple segments for a complete understanding.`;
                break;

            default:
                basePrompt = `Comprehensive analysis of this YouTube video:
Title: ${videoData.title}
URL: ${videoUrl}
Description: ${videoData.description}

Provide detailed analysis of the video content, including visual and audio elements.`;
        }

        return basePrompt + `\n\nFormat the response according to the ${format} format.`;
    }
}