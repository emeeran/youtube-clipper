/**
 * Base AI provider interface and abstract implementation
 */

import { AIProvider } from '../../interfaces/types';
import { ErrorHandler } from '../../utils/error-handler';

export abstract class BaseAIProvider implements AIProvider {
    abstract readonly name: string;
    abstract readonly model: string;
    
    protected constructor(protected apiKey: string) {
        if (!apiKey) {
            throw new Error('API key is required for AI provider');
        }
    }

    /**
     * Process a prompt and return the response
     */
    abstract process(prompt: string): Promise<string>;

    /**
     * Validate API response structure
     */
    protected validateResponse(response: any, requiredPath: string[]): boolean {
        let current = response;
        for (const key of requiredPath) {
            if (!current || typeof current !== 'object' || !(key in current)) {
                return false;
            }
            current = current[key];
        }
        return current !== null && current !== undefined;
    }

    /**
     * Handle API errors consistently
     */
    protected async handleAPIError(response: Response): Promise<never> {
        return ErrorHandler.handleAPIError(response, this.name);
    }

    /**
     * Create request headers
     */
    protected abstract createHeaders(): Record<string, string>;

    /**
     * Create request body
     */
    protected abstract createRequestBody(prompt: string): any;

    /**
     * Extract content from API response
     */
    protected abstract extractContent(response: any): string;
}
