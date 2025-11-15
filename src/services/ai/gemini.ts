/**
 * Google Gemini AI provider implementation
 */

import { API_ENDPOINTS, AI_MODELS } from '../../constants/api';
import { MESSAGES } from '../../constants/messages';
import { BaseAIProvider } from './base';

export class GeminiProvider extends BaseAIProvider {
    readonly name = 'Google Gemini';

    constructor(apiKey: string, model?: string) {
        super(apiKey, model || AI_MODELS.GEMINI);
    }

    async process(prompt: string): Promise<string> {
        const response = await fetch(`${API_ENDPOINTS.GEMINI}?key=${this.apiKey}`, {
            method: 'POST',
            headers: this.createHeaders(),
            body: JSON.stringify(this.createRequestBody(prompt))
        });

        // Handle specific Gemini errors
        if (response.status === 401) {
            throw new Error(MESSAGES.ERRORS.GEMINI_INVALID_KEY);
        }

        if (!response.ok) {
            await this.handleAPIError(response);
        }

        const data = await response.json();
        
        if (!this.validateResponse(data, ['candidates', '0', 'content', 'parts', '0', 'text'])) {
            throw new Error('Invalid response format from Gemini API');
        }

        return this.extractContent(data);
    }

    protected createHeaders(): Record<string, string> {
        return {
            'Content-Type': 'application/json'
        };
    }

    protected createRequestBody(prompt: string): any {
        // Detect YouTube prompts by scanning for common markers instead of brittle literals
        const normalizedPrompt = prompt.toLowerCase();
        const isVideoAnalysis =
            normalizedPrompt.includes('youtube video') ||
            normalizedPrompt.includes('youtu.be/') ||
            normalizedPrompt.includes('youtube.com/');
        
        const baseConfig = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4000, // Increased for detailed guides
                candidateCount: 1
            },
            // safetySettings: [
            //     {
            //         category: "HARM_CATEGORY_HARASSMENT",
            //         threshold: "BLOCK_MEDIUM_AND_ABOVE"
            //     },
            //     {
            //         category: "HARM_CATEGORY_HATE_SPEECH", 
            //         threshold: "BLOCK_MEDIUM_AND_ABOVE"
            //     }
            // ]
        };

        // Enable multimodal analysis for YouTube videos
        if (isVideoAnalysis) {
            return {
                ...baseConfig,
                // Enable audio and video token processing for comprehensive analysis
                useAudioVideoTokens: true,
                systemInstruction: {
                    parts: [{
                        text: "You are an expert video content analyzer. Use both audio and visual information from videos to provide comprehensive analysis. Pay attention to slides, diagrams, text overlays, speaker gestures, and visual demonstrations in addition to spoken content."
                    }]
                }
            };
        }

        return baseConfig;
    }

    protected extractContent(response: any): string {
        const content = response.candidates[0].content.parts[0].text;
        return content ? content.trim() : '';
    }
}
