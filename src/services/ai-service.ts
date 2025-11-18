/**
 * AI service that manages multiple providers with parallel processing support
 */

import { AIService as IAIService, AIProvider, AIResponse, YouTubePluginSettings, PerformanceMode } from '../types/types';
import { PROVIDER_MODEL_OPTIONS, PROVIDER_MODEL_LIST_URLS, PROVIDER_MODEL_REGEX } from '../api';
import { ErrorHandler } from './error-handler';
import { MESSAGES } from '../messages';
import { PERFORMANCE_PRESETS, PerformanceOptimizer } from '../performance';

export class AIService implements IAIService {
    private providers: AIProvider[] = [];
    private settings: YouTubePluginSettings;

    constructor(providers: AIProvider[], settings: YouTubePluginSettings) {
        if (!providers || providers.length === 0) {
            throw new Error(MESSAGES.ERRORS.MISSING_API_KEYS);
        }
        this.providers = providers;
        this.settings = settings;
        this.applyPerformanceSettings();
    }

    /**
     * Apply performance settings to providers
     */
    private applyPerformanceSettings(): void {
        const preset = PERFORMANCE_PRESETS[this.settings.performanceMode] || PERFORMANCE_PRESETS.balanced;
        const timeouts = this.settings.customTimeouts || preset.timeouts;

        this.providers.forEach(provider => {
            if (provider.name === 'Google Gemini' && provider.setTimeout) {
                provider.setTimeout(timeouts.geminiTimeout);
            } else if (provider.name === 'Groq' && provider.setTimeout) {
                provider.setTimeout(timeouts.groqTimeout);
            }
        });
    }

    /**
     * Update settings and reapply performance configurations
     */
    updateSettings(newSettings: YouTubePluginSettings): void {
        this.settings = newSettings;
        this.applyPerformanceSettings();
    }

    /**
     * Return available model options for a provider name (from constants mapping)
     */
    getProviderModels(providerName: string): string[] {
        const raw = PROVIDER_MODEL_OPTIONS[providerName] || [] as any[];
        // Support both legacy string arrays and the new object shape (ProviderModelEntry)
        return raw.map(r => typeof r === 'string' ? r : (r && r.name ? r.name : String(r)));
    }

    /**
     * Best-effort fetch of latest models for all providers by scraping known provider pages.
     * Returns a mapping providerName -> list of discovered models. Falls back to static mapping.
     */
    async fetchLatestModels(): Promise<Record<string, string[]>> {
        const result: Record<string, string[]> = {};
        const providers = this.getProviderNames();
        for (const p of providers) {
            try {
                const models = await this.fetchLatestModelsForProvider(p);
                result[p] = models.length > 0 ? models : (PROVIDER_MODEL_OPTIONS[p] ? (PROVIDER_MODEL_OPTIONS[p] as any[]).map(m => typeof m === 'string' ? m : m.name) : []);
            } catch (error) {
                result[p] = PROVIDER_MODEL_OPTIONS[p] ? (PROVIDER_MODEL_OPTIONS[p] as any[]).map(m => typeof m === 'string' ? m : m.name) : [];
            }
        }
        return result;
    }

    /**
     * Fetch latest models for a single provider (best-effort scraping).
     */
    async fetchLatestModelsForProvider(providerName: string): Promise<string[]> {
        const url = PROVIDER_MODEL_LIST_URLS[providerName];
        const regex = PROVIDER_MODEL_REGEX[providerName];
        if (!url || !regex) {
            return PROVIDER_MODEL_OPTIONS[providerName] ? (PROVIDER_MODEL_OPTIONS[providerName] as any[]).map(m => typeof m === 'string' ? m : m.name) : [];
        }

        try {
            const resp = await fetch(url, { method: 'GET' });
            if (!resp.ok) {
                return PROVIDER_MODEL_OPTIONS[providerName] ? (PROVIDER_MODEL_OPTIONS[providerName] as any[]).map(m => typeof m === 'string' ? m : m.name) : [];
            }
            const text = await resp.text();
            const matches = text.match(regex) || [];
            // Normalize and dedupe
            const normalized = Array.from(new Set(matches.map(m => m.toLowerCase())));
            return normalized;
        } catch (error) {
            // On any error, return static fallback
            return PROVIDER_MODEL_OPTIONS[providerName] ? (PROVIDER_MODEL_OPTIONS[providerName] as any[]).map(m => typeof m === 'string' ? m : m.name) : [];
        }
    }

    /**
     * Process prompt with fallback support (original sequential method)
     */
    async process(prompt: string): Promise<AIResponse> {
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Valid prompt is required');
        }

        // Use parallel processing if enabled
        if (this.settings.enableParallelProcessing) {
            return this.processParallel(prompt);
        }

        return this.processSequential(prompt);
    }

    /**
     * Process prompt with sequential fallback (original method)
     */
    private async processSequential(prompt: string): Promise<AIResponse> {
        let lastError: Error | null = null;

        // Try each provider in order
        for (const provider of this.providers) {
            try {
                console.log(`Attempting to process with ${provider.name}...`);
                const content = await provider.process(prompt);

                if (content && content.trim().length > 0) {
                    return {
                        content,
                        provider: provider.name,
                        model: provider.model
                    };
                } else {
                    throw new Error('Empty response from AI provider');
                }
            } catch (error) {
                lastError = error as Error;
                console.warn(`${provider.name} failed:`, error);

                // Continue to next provider unless this is the last one
                if (provider === this.providers[this.providers.length - 1]) {
                    break;
                }
            }
        }

        // All providers failed
        const errorMessage = lastError
            ? MESSAGES.ERRORS.AI_PROCESSING(lastError.message)
            : 'All AI providers failed to process the request';

        throw new Error(errorMessage);
    }

    /**
     * Process prompt with parallel provider racing for maximum speed
     */
    private async processParallel(prompt: string): Promise<AIResponse> {
        console.log('Starting parallel provider racing...');

        const providerPromises = this.providers.map(async (provider) => {
            try {
                const content = await (provider as any).processWithTimeout(prompt);

                if (content && content.trim().length > 0) {
                    return {
                        content,
                        provider: provider.name,
                        model: provider.model,
                        success: true,
                        responseTime: Date.now()
                    };
                } else {
                    throw new Error('Empty response from AI provider');
                }
            } catch (error) {
                console.warn(`${provider.name} failed in parallel race:`, error);
                return {
                    error: (error as Error).message,
                    provider: provider.name,
                    model: provider.model,
                    success: false,
                    responseTime: Date.now()
                };
            }
        });

        // Wait for first successful response or all to complete
        const results = await Promise.allSettled(providerPromises);

        // Find first successful response
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value.success) {
                console.log(`Parallel winner: ${result.value.provider} (${Date.now() - result.value.responseTime}ms)`);
                return {
                    content: result.value.content,
                    provider: result.value.provider,
                    model: result.value.model
                };
            }
        }

        // All providers failed - collect errors
        const errors = results
            .filter(r => r.status === 'fulfilled' && !r.value.success)
            .map(r => (r as any).value.error);

        const errorMessage = errors.length > 0
            ? MESSAGES.ERRORS.AI_PROCESSING(errors.join('; '))
            : 'All AI providers failed to process the request';

        throw new Error(errorMessage);
    }

    /**
     * Process prompt using a specific provider name. Optionally override the model if supported.
     */
    async processWith(providerName: string, prompt: string, overrideModel?: string): Promise<AIResponse> {
        const provider = this.providers.find(p => p.name === providerName);
        if (!provider) {
            throw new Error(`AI provider not found: ${providerName}`);
        }

        // If provider supports setModel, apply override
        try {
            if (overrideModel && typeof (provider as any).setModel === 'function') {
                (provider as any).setModel(overrideModel);
            }

            const content = await provider.process(prompt);
            if (content && content.trim().length > 0) {
                return { content, provider: provider.name, model: provider.model };
            }

            throw new Error('Empty response from AI provider');
        } catch (error) {
            throw new Error(MESSAGES.ERRORS.AI_PROCESSING((error as Error).message));
        }
    }

    /**
     * Check if any providers are available
     */
    hasAvailableProviders(): boolean {
        return this.providers.length > 0;
    }

    /**
     * Get list of available provider names
     */
    getProviderNames(): string[] {
        return this.providers.map(p => p.name);
    }

    /**
     * Add a new provider
     */
    addProvider(provider: AIProvider): void {
        this.providers.push(provider);
    }

    /**
     * Remove a provider by name
     */
    removeProvider(providerName: string): boolean {
        const index = this.providers.findIndex(p => p.name === providerName);
        if (index !== -1) {
            this.providers.splice(index, 1);
            return true;
        }
        return false;
    }
}
