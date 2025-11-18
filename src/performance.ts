/**
 * Performance presets and speed/quality configurations
 */

import { PerformancePreset, ModelStrategy, CustomTimeoutSettings } from './types/types';

export const PERFORMANCE_PRESETS: Record<string, PerformancePreset> = {
    fast: {
        name: 'Fast',
        description: 'Maximum speed with optimized models and parallel processing. Best for quick summaries.',
        timeouts: {
            geminiTimeout: 15000,
            groqTimeout: 10000,
            metadataTimeout: 5000
        },
        enableParallel: true,
        preferMultimodal: false,
        modelStrategy: {
            briefFormat: 'llama-3.1-8b-instant',
            executiveSummary: 'llama-3.3-70b-versatile',
            detailedGuide: 'gemini-2.0-flash-lite',
            fallbackModel: 'llama-3.1-8b-instant'
        }
    },
    balanced: {
        name: 'Balanced',
        description: 'Balanced speed and quality with multimodal analysis for detailed content.',
        timeouts: {
            geminiTimeout: 30000,
            groqTimeout: 20000,
            metadataTimeout: 10000
        },
        enableParallel: true,
        preferMultimodal: true,
        modelStrategy: {
            briefFormat: 'llama-3.1-8b-instant',
            executiveSummary: 'gemini-2.0-flash-lite',
            detailedGuide: 'gemini-2.5-flash',
            fallbackModel: 'llama-3.3-70b-versatile'
        }
    },
    quality: {
        name: 'Quality',
        description: 'Maximum quality with comprehensive multimodal analysis. Slower but most detailed.',
        timeouts: {
            geminiTimeout: 60000,
            groqTimeout: 30000,
            metadataTimeout: 15000
        },
        enableParallel: false,
        preferMultimodal: true,
        modelStrategy: {
            briefFormat: 'gemini-2.0-flash-lite',
            executiveSummary: 'gemini-2.5-flash',
            detailedGuide: 'gemini-2.5-pro',
            fallbackModel: 'gemini-2.0-flash'
        }
    }
};

export const DEFAULT_TIMEOUTS: CustomTimeoutSettings = {
    geminiTimeout: 30000,
    groqTimeout: 20000,
    metadataTimeout: 10000
};

export const MODEL_CHARACTERISTICS: Record<string, {
    speed: 'fast' | 'medium' | 'slow';
    quality: 'basic' | 'good' | 'excellent';
    multimodal: boolean;
    provider: string;
    estimatedLatency: number; // in seconds
    maxTokens: number;
}> = {
    // Groq Models (Speed optimized)
    'llama-3.1-8b-instant': {
        speed: 'fast',
        quality: 'basic',
        multimodal: false,
        provider: 'Groq',
        estimatedLatency: 2,
        maxTokens: 2000
    },
    'llama-3.3-70b-versatile': {
        speed: 'fast',
        quality: 'good',
        multimodal: false,
        provider: 'Groq',
        estimatedLatency: 5,
        maxTokens: 4000
    },
    'llama-4-maverick-17b-128e-instruct': {
        speed: 'fast',
        quality: 'excellent',
        multimodal: false,
        provider: 'Groq',
        estimatedLatency: 8,
        maxTokens: 4000
    },
    'llama-4-scout-17b-16e-instruct': {
        speed: 'fast',
        quality: 'good',
        multimodal: false,
        provider: 'Groq',
        estimatedLatency: 6,
        maxTokens: 4000
    },

    // Gemini Flash Models (Balanced)
    'gemini-2.0-flash': {
        speed: 'medium',
        quality: 'good',
        multimodal: true,
        provider: 'Google Gemini',
        estimatedLatency: 10,
        maxTokens: 4000
    },
    'gemini-2.0-flash-lite': {
        speed: 'fast',
        quality: 'good',
        multimodal: true,
        provider: 'Google Gemini',
        estimatedLatency: 6,
        maxTokens: 3000
    },
    'gemini-2.5-flash': {
        speed: 'medium',
        quality: 'excellent',
        multimodal: true,
        provider: 'Google Gemini',
        estimatedLatency: 12,
        maxTokens: 4000
    },
    'gemini-2.5-flash-lite': {
        speed: 'fast',
        quality: 'good',
        multimodal: true,
        provider: 'Google Gemini',
        estimatedLatency: 8,
        maxTokens: 3000
    },

    // Gemini Pro Models (Quality optimized)
    'gemini-1.5-pro': {
        speed: 'slow',
        quality: 'excellent',
        multimodal: true,
        provider: 'Google Gemini',
        estimatedLatency: 20,
        maxTokens: 4000
    },
    'gemini-2.0-pro': {
        speed: 'slow',
        quality: 'excellent',
        multimodal: true,
        provider: 'Google Gemini',
        estimatedLatency: 25,
        maxTokens: 4000
    },
    'gemini-2.5-pro': {
        speed: 'slow',
        quality: 'excellent',
        multimodal: true,
        provider: 'Google Gemini',
        estimatedLatency: 30,
        maxTokens: 4000
    },
    'gemini-2.5-pro-tts': {
        speed: 'slow',
        quality: 'excellent',
        multimodal: true,
        provider: 'Google Gemini',
        estimatedLatency: 35,
        maxTokens: 4000
    }
};

export class PerformanceOptimizer {
    static getOptimalModel(
        format: string,
        videoDuration?: number,
        performanceMode: string = 'balanced',
        availableModels: string[] = []
    ): string {
        const preset = PERFORMANCE_PRESETS[performanceMode] || PERFORMANCE_PRESETS.balanced;
        const strategy = preset.modelStrategy;

        // Select model based on format
        let selectedModel = strategy.fallbackModel;

        switch (format) {
            case 'brief':
                selectedModel = strategy.briefFormat;
                break;
            case 'executive-summary':
                selectedModel = strategy.executiveSummary;
                break;
            case 'detailed-guide':
                selectedModel = strategy.detailedGuide;
                break;
        }

        // For very short videos in fast mode, prioritize speed
        if (videoDuration && videoDuration < 300 && performanceMode === 'fast') {
            return 'llama-3.1-8b-instant';
        }

        // Check if selected model is available
        if (availableModels.includes(selectedModel)) {
            return selectedModel;
        }

        // Find best available alternative
        const characteristics = MODEL_CHARACTERISTICS[selectedModel];
        if (characteristics) {
            const alternatives = availableModels.filter(model => {
                const alt = MODEL_CHARACTERISTICS[model];
                return alt &&
                       alt.provider === characteristics.provider &&
                       alt.multimodal === characteristics.multimodal;
            });

            if (alternatives.length > 0) {
                // Return fastest alternative
                return alternatives.sort((a, b) =>
                    MODEL_CHARACTERISTICS[a].estimatedLatency - MODEL_CHARACTERISTICS[b].estimatedLatency
                )[0];
            }
        }

        return strategy.fallbackModel;
    }

    static estimateProcessingTime(
        model: string,
        videoDuration?: number,
        format: string = 'detailed-guide'
    ): { min: number; max: number; description: string } {
        const characteristics = MODEL_CHARACTERISTICS[model];
        if (!characteristics) {
            return { min: 15, max: 60, description: 'Unknown model' };
        }

        let baseTime = characteristics.estimatedLatency;

        // Add time for video processing
        if (videoDuration) {
            baseTime += Math.min(videoDuration / 60, 30); // Max 30s for video analysis
        }

        // Format-specific adjustments
        const formatMultipliers = {
            'brief': 0.5,
            'executive-summary': 0.8,
            'detailed-guide': 1.2,
            'custom': 1.0
        };

        const adjustedTime = baseTime * (formatMultipliers[format] || 1.0);

        // Add buffer for network latency
        const min = Math.round(adjustedTime * 0.8);
        const max = Math.round(adjustedTime * 1.5);

        const speed = characteristics.speed;
        const description = speed === 'fast' ? 'Fast processing' :
                           speed === 'medium' ? 'Standard processing' :
                           'Comprehensive processing';

        return { min, max, description };
    }

    static getPerformanceRecommendations(
        currentMode: string,
        videoDuration?: number,
        format: string = 'detailed-guide'
    ): { recommended: string; reason: string; alternative: string } {
        if (!videoDuration || videoDuration < 180) { // < 3 minutes
            return {
                recommended: 'fast',
                reason: 'Short videos don\'t require extensive analysis',
                alternative: 'balanced'
            };
        }

        if (format === 'brief') {
            return {
                recommended: 'fast',
                reason: 'Brief format prioritizes speed over depth',
                alternative: 'balanced'
            };
        }

        if (videoDuration > 1800) { // > 30 minutes
            return {
                recommended: 'quality',
                reason: 'Long videos benefit from comprehensive analysis',
                alternative: 'balanced'
            };
        }

        return {
            recommended: 'balanced',
            reason: 'Good balance of speed and quality for most content',
            alternative: currentMode === 'balanced' ? 'fast' : 'balanced'
        };
    }
}