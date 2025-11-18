/**
 * Centralized error handling to eliminate code duplication
 */

import { Notice } from 'obsidian';
import { ErrorHandlerInterface } from '../types/types';

export class ErrorHandler implements ErrorHandlerInterface {
    /**
     * Handle errors with consistent logging and user feedback
     */
    static handle(error: Error, context: string, showNotice = true): void {
        const errorMessage = `${context}: ${error.message}`;
        console.error(errorMessage, error);
        
        if (showNotice) {
            new Notice(`Error: ${error.message}`);
        }
    }

    /**
     * Execute an operation with automatic error handling
     */
    static async withErrorHandling<T>(
        operation: () => Promise<T>,
        context: string,
        showNotice = true
    ): Promise<T | null> {
        try {
            return await operation();
        } catch (error) {
            this.handle(error as Error, context, showNotice);
            return null;
        }
    }

    /**
     * Execute a synchronous operation with error handling
     */
    static withSyncErrorHandling<T>(
        operation: () => T,
        context: string,
        showNotice = true
    ): T | null {
        try {
            return operation();
        } catch (error) {
            this.handle(error as Error, context, showNotice);
            return null;
        }
    }

    /**
     * Create a standardized error for API responses
     */
    static createAPIError(
        provider: string,
        status: number,
        statusText: string,
        details?: string
    ): Error {
        const message = `${provider} API error: ${status} ${statusText}${details ? `. ${details}` : ''}`;
        return new Error(message);
    }

    /**
     * Handle API response errors with consistent format
     */
    static async handleAPIError(
        response: Response,
        provider: string,
        fallbackMessage?: string
    ): Promise<never> {
        let errorDetails = fallbackMessage || '';
        
        try {
            const errorData = await response.json();
            errorDetails = errorData.error?.message || errorData.message || fallbackMessage || '';
        } catch {
            // Ignore JSON parsing errors
        }
        
        throw this.createAPIError(provider, response.status, response.statusText, errorDetails);
    }

    /**
     * Validate required configuration and throw descriptive errors
     */
    static validateConfiguration(config: Record<string, any>, requiredFields: string[]): void {
        const missing = requiredFields.filter(field => !config[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }
    }

    /**
     * Create a user-friendly error message for common scenarios
     */
    static createUserFriendlyError(error: Error, operation: string): Error {
        const message = `Failed to ${operation}: ${error.message}`;
        return new Error(message);
    }

    // Instance methods implementing interface
    handle(error: Error, context: string, showNotice = true): void {
        ErrorHandler.handle(error, context, showNotice);
    }

    async withErrorHandling<T>(
        operation: () => Promise<T>,
        context: string
    ): Promise<T | null> {
        return ErrorHandler.withErrorHandling(operation, context);
    }
}
