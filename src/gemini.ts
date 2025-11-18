/**
 * Google Gemini AI provider implementation
 */

import { API_ENDPOINTS, AI_MODELS, PROVIDER_MODEL_OPTIONS } from './api';
import { MESSAGES } from './messages';
import { BaseAIProvider } from './base';

export class GeminiProvider extends BaseAIProvider {
    readonly name = 'Google Gemini';

    constructor(apiKey: string, model?: string, timeout?: number) {
        super(apiKey, model || AI_MODELS.GEMINI, timeout);
    }

    async process(prompt: string): Promise<string> {
        try {
            // Validate inputs
            if (!this.apiKey || this.apiKey.trim().length === 0) {
                throw new Error(MESSAGES.ERRORS.GEMINI_INVALID_KEY);
            }

            const response = await fetch(`${API_ENDPOINTS.GEMINI}?key=${this.apiKey}`, {
                method: 'POST',
                headers: this.createHeaders(),
                body: JSON.stringify(this.createRequestBody(prompt))
            });

            // Handle specific Gemini errors with better messages
            if (response.status === 400) {
                const errorData = await this.safeJsonParse(response);
                const errorMessage = errorData?.error?.message || 'Bad request';
                throw new Error(`Gemini API error: ${errorMessage}. Try checking the model configuration.`);
            }

            if (response.status === 401) {
                throw new Error(MESSAGES.ERRORS.GEMINI_INVALID_KEY);
            }

            if (response.status === 403) {
                throw new Error('Gemini API access forbidden. Check API key permissions and billing.');
            }

            if (response.status === 429) {
                throw new Error('Gemini API rate limit exceeded. Please wait and try again.');
            }

            if (!response.ok) {
                await this.handleAPIError(response);
            }

            const data = await response.json();

            // Enhanced response validation
            if (!data.candidates || !data.candidates.length) {
                throw new Error('No response candidates returned from Gemini API');
            }

            if (data.candidates[0].finishReason === 'SAFETY') {
                throw new Error('Response blocked by Gemini safety filters. Try rephrasing.');
            }

            if (!this.validateResponse(data, ['candidates', '0', 'content', 'parts', '0', 'text'])) {
                throw new Error('Invalid response format from Gemini API');
            }

            return this.extractContent(data);
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Gemini processing failed: ${error}`);
        }
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

        // Enable multimodal analysis for YouTube videos only when the chosen Gemini model
        // is known to support audio/video tokens. Sending the `useAudioVideoTokens` flag
        // to models that don't support it causes a 400 from the Gemini API (unknown field).
        // Conservative check: only enable for newer 2.5-series models.
        if (isVideoAnalysis) {
            // Lookup the model entry in PROVIDER_MODEL_OPTIONS to see if it explicitly
            // supports audio/video tokens. This is more reliable than a name heuristic.
            const providerModels = PROVIDER_MODEL_OPTIONS['Google Gemini'] || [] as any[];
            const currentModelName = String(this.model || '').toLowerCase();
            const matched = providerModels.find(m => {
                const name = (typeof m === 'string') ? m : (m && m.name ? m.name : '');
                return String(name).toLowerCase() === currentModelName;
            }) as any | undefined;

            const supportsAudioVideo = matched && matched.supportsAudioVideo === true;

            // Gemini automatically processes YouTube URLs and extracts both audio
            // and video streams. Per Google's official docs, there is no special
            // `useAudioVideoTokens` or similar parameter needed. The multimodal
            // analysis is built-in behavior. We rely on a strong system instruction
            // to guide comprehensive analysis of both visual and audio content.
            const videoConfig: any = {
                ...baseConfig,
                systemInstruction: {
                    parts: [{
                        text: `You are an expert video content analyzer. Provide comprehensive, multimodal analysis using:
• AUDIO STREAM: Transcribe all spoken content, identify speakers, capture tone/emphasis/emotion
• VIDEO STREAM: Analyze visual elements, text overlays, diagrams, slides, gestures, scene changes, and visual demonstrations
• INTEGRATED INSIGHTS: Synthesize audio and visual data to provide complete understanding

For best results:
- Prioritize accuracy in transcription and speaker identification
- Extract and explain key concepts shown visually
- Note timing relationships between audio and visual elements
- Identify visual cues that reinforce or clarify spoken content`
                    }]
                }
            };

            // If the prompt contains a Google Cloud Storage URI (gs://...), attach it
            // as a FileData part for additional video analysis capability.
            const gcsMatch = prompt.match(/(gs:\/\/[\w\-\.\/]+\.(?:mp4|mov|mkv|webm))/i);
            if (gcsMatch && gcsMatch[1]) {
                const gcsUri = gcsMatch[1];
                // Append a FileData part to contents so Gemini can process the video file
                videoConfig.contents = videoConfig.contents || [];
                videoConfig.contents.push({
                    parts: [{ fileData: { fileUri: gcsUri, mimeType: 'video/mp4' } }]
                });
            }

            // Historically we attempted to send `useAudioVideoTokens` for
            // multimodal-capable models. That flag has caused 400 errors
            // for some accounts / model deployments. To be safe and avoid
            // breaking requests, we no longer send that flag. The
            // `systemInstruction` above still guides the model to consider
            // video/audio context when available.

            return videoConfig;
        }

        return baseConfig;
    }

    protected extractContent(response: any): string {
        const content = response.candidates[0].content.parts[0].text;
        return content ? content.trim() : '';
    }
}
