/**
 * AI service that manages multiple providers with fallback support
 */

import { AIService as IAIService, AIProvider, AIResponse } from '../../interfaces/types';
import { ErrorHandler } from '../../utils/error-handler';
import { MESSAGES } from '../../constants/messages';

export class AIService implements IAIService {
    private providers: AIProvider[] = [];

    constructor(providers: AIProvider[]) {
        if (!providers || providers.length === 0) {
            throw new Error(MESSAGES.ERRORS.MISSING_API_KEYS);
        }
        this.providers = providers;
    }

    /**
     * Process prompt with fallback support
     */
    async process(prompt: string): Promise<AIResponse> {
        if (!prompt || typeof prompt !== 'string') {
            throw new Error('Valid prompt is required');
        }

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
