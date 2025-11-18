/**
 * Base AI provider interface and abstract implementation
 */

import { AIProvider } from './types/types';
import { ErrorHandler } from './services/error-handler';
import { CustomTimeoutSettings } from './types/types';

export abstract class BaseAIProvider implements AIProvider {
    abstract readonly name: string;
    protected _model: string;
    protected _timeout: number = 30000; // Default 30s timeout

    get model(): string {
        return this._model;
    }

    get timeout(): number {
        return this._timeout;
    }

    setModel(model: string): void {
        this._model = model;
    }

    setTimeout(timeout: number): void {
        this._timeout = timeout;
    }

    protected constructor(protected apiKey: string, initialModel?: string, timeout?: number) {
        if (!apiKey) {
            throw new Error('API key is required for AI provider');
        }
        this._model = initialModel || '';
        if (timeout) {
            this._timeout = timeout;
        }
    }

    /**
     * Process a prompt and return the response
     */
    abstract process(prompt: string): Promise<string>;

    /**
     * Process with timeout support
     */
    async processWithTimeout(prompt: string, customTimeout?: number): Promise<string> {
        const timeoutMs = customTimeout || this._timeout;

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`${this.name} request timed out after ${timeoutMs}ms`));
            }, timeoutMs);
        });

        const processPromise = this.process(prompt);

        return Promise.race([processPromise, timeoutPromise]);
    }

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
     * Safely parse JSON response without throwing
     */
    protected async safeJsonParse(response: Response): Promise<any> {
        try {
            return await response.json();
        } catch {
            return null;
        }
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
