/**
 * Groq AI provider implementation
 */

import { API_ENDPOINTS, AI_MODELS, API_LIMITS } from './api';
import { MESSAGES } from './messages';
import { BaseAIProvider } from './base';

export class GroqProvider extends BaseAIProvider {
    readonly name = 'Groq';

    constructor(apiKey: string, model?: string, timeout?: number) {
        super(apiKey, model || AI_MODELS.GROQ, timeout);
    }

    async process(prompt: string): Promise<string> {
        const response = await fetch(API_ENDPOINTS.GROQ, {
            method: 'POST',
            headers: this.createHeaders(),
            body: JSON.stringify(this.createRequestBody(prompt))
        });

        // Handle specific Groq errors
        if (response.status === 404) {
            throw new Error(MESSAGES.ERRORS.GROQ_MODEL_NOT_FOUND);
        }

        if (!response.ok) {
            await this.handleAPIError(response);
        }

        const data = await response.json();
        
        if (!this.validateResponse(data, ['choices', '0', 'message'])) {
            throw new Error('Invalid response format from Groq API');
        }

        return this.extractContent(data);
    }

    protected createHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
    }

    protected createRequestBody(prompt: string): any {
        return {
            model: this.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert content analyzer specializing in extracting practical value and creating actionable guides from video content. Focus on clarity, practicality, and immediate implementability. Even with limited information, provide maximum value through structured analysis and practical recommendations.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: API_LIMITS.MAX_TOKENS,
            temperature: API_LIMITS.TEMPERATURE
        };
    }

    protected extractContent(response: any): string {
        const content = response.choices[0].message.content;
        return content ? content.trim() : '';
    }
}
