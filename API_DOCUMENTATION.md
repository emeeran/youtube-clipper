# 🔌 API Documentation - YouTube Processor

> **Complete API reference for developers integrating with or extending the YouTube Processor plugin**

## Table of Contents

- [Core APIs](#core-apis)
- [AI Provider APIs](#ai-provider-apis)
- [YouTube Data APIs](#youtube-data-apis)
- [Plugin Extension APIs](#plugin-extension-apis)
- [Configuration APIs](#configuration-apis)
- [Event System](#event-system)
- [Error Handling](#error-handling)

---

## Core APIs

### YouTubeProcessor Class

The main plugin class that orchestrates all functionality.

```typescript
export default class YouTubeProcessor extends BasePlugin {
    // Properties
    settings: PluginSettings;
    youtubeService: YouTubeService;
    processor: ContentProcessor;
    promptService: PromptService;

    // Methods
    async onload(): Promise<void>
    async onunload(): Promise<void>
    async loadSettings(): Promise<void>
    async saveSettings(): Promise<void>

    // Command Registration
    registerCommands(): void
    registerCommand(id: string, callback: CommandCallback): void

    // Modals
    showUrlModal(): void
    showHistoryModal(): void
    showFormatModal(options: FormatModalOptions): void
}
```

### ContentProcessor Interface

```typescript
export interface IContentProcessor {
    processVideoContent(
        videoData: VideoData,
        settings: PluginSettings,
        format: OutputFormat,
        options?: ProcessingOptions
    ): Promise<ProcessedContent>;

    selectProvider(settings: PluginSettings, attempt?: number): AIProvider;
    validateVideoUrl(url: string): boolean;
    estimateProcessingTime(videoData: VideoData, format: OutputFormat): number;
}

export interface ProcessedContent {
    content: string;
    metadata: ProcessingMetadata;
    fileName: string;
    outputPath: string;
    processingTime: number;
    tokensUsed: number;
}

export interface ProcessingOptions {
    customPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    modelOverride?: string;
    providerOverride?: string;
}
```

---

## AI Provider APIs

### Base AI Provider Interface

```typescript
export interface AIProvider {
    readonly name: string;
    readonly endpoint: string;
    readonly supportsMultimodal: boolean;
    readonly maxTokens: number;
    readonly defaultModel: string;
    readonly availableModels: string[];

    // Core processing
    process(
        prompt: string,
        settings: ProviderSettings,
        options?: ProcessingOptions
    ): Promise<AIResponse>;

    // Validation and testing
    validateKey(apiKey: string): boolean;
    testConnection(apiKey: string): Promise<boolean>;

    // Model management
    getModels(): Promise<ModelInfo[]>;
    getDefaultModel(): string;
    supportsModel(model: string): boolean;
}

export interface ProviderSettings {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
}

export interface AIResponse {
    content: string;
    model: string;
    provider: string;
    usage: TokenUsage;
    processingTime: number;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
```

### Google Gemini API Implementation

```typescript
export class GeminiService implements AIProvider {
    readonly name = 'gemini';
    readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
    readonly supportsMultimodal = true;
    readonly maxTokens = 8000;
    readonly defaultModel = 'gemini-2.5-pro';
    readonly availableModels = [
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-2.5-pro-tts',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
    ];

    async process(
        prompt: string,
        settings: ProviderSettings,
        options?: ProcessingOptions
    ): Promise<AIResponse> {
        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: options?.temperature ?? settings.temperature,
                maxOutputTokens: options?.maxTokens ?? settings.maxTokens,
                candidateCount: 1,
                topP: 0.8,
                topK: 40
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_NONE"
                }
            ]
        };

        const response = await fetch(
            `${this.endpoint}/${settings.model}:generateContent?key=${settings.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        return this.parseResponse(response);
    }

    validateKey(apiKey: string): boolean {
        return apiKey.startsWith('AIzaSy') && apiKey.length > 35;
    }

    async testConnection(apiKey: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.endpoint}/generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "test" }] }],
                    generationConfig: { maxOutputTokens: 1 }
                })
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}
```

### Groq API Implementation

```typescript
export class GroqService implements AIProvider {
    readonly name = 'groq';
    readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    readonly supportsMultimodal = false;
    readonly maxTokens = 8000;
    readonly defaultModel = 'llama-3.3-70b-versatile';
    readonly availableModels = [
        'llama-4-maverick-17b-128e-instruct',
        'llama-4-scout-17b-16e-instruct',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant'
    ];

    async process(
        prompt: string,
        settings: ProviderSettings,
        options?: ProcessingOptions
    ): Promise<AIResponse> {
        const requestBody = {
            model: settings.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful AI assistant specializing in video content analysis and tutorial creation.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: options?.temperature ?? settings.temperature,
            max_tokens: options?.maxTokens ?? settings.maxTokens,
            top_p: 0.8,
            stream: false
        };

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        return this.parseResponse(response);
    }

    validateKey(apiKey: string): boolean {
        return apiKey.startsWith('gsk_') && apiKey.length > 20;
    }
}
```

---

## YouTube Data APIs

### YouTube Service Interface

```typescript
export interface IYouTubeService {
    extractVideoData(url: string): Promise<VideoData>;
    validateUrl(url: string): boolean;
    extractVideoId(url: string): string | null;
    getVideoMetadata(videoId: string): Promise<VideoMetadata>;
    getChannelInfo(channelId: string): Promise<ChannelInfo>;
}

export interface VideoData {
    id: string;
    title: string;
    description: string;
    authorName: string;
    authorUrl: string;
    thumbnailUrl: string;
    duration?: string;
    publishedAt?: string;
    viewCount?: number;
    tags?: string[];
}

export interface VideoMetadata {
    videoId: string;
    title: string;
    description: string;
    duration: string; // ISO 8601 format (PT4M13S)
    publishedAt: string;
    viewCount: number;
    likeCount?: number;
    channel: ChannelInfo;
    thumbnails: ThumbnailInfo[];
    tags: string[];
    category: string;
}

export interface ThumbnailInfo {
    url: string;
    width: number;
    height: number;
    quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres';
}
```

### YouTube Service Implementation

```typescript
export class YouTubeService implements IYouTubeService {
    private readonly oembedEndpoint = 'https://www.youtube.com/oembed';
    private readonly cache = new Map<string, VideoData>();

    async extractVideoData(url: string): Promise<VideoData> {
        // Check cache first
        if (this.cache.has(url)) {
            return this.cache.get(url)!;
        }

        const videoId = this.extractVideoId(url);
        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        // Get basic metadata via oEmbed API (no API key required)
        const oembedUrl = `${this.oembedEndpoint}?url=${encodeURIComponent(url)}&format=json`;
        const oembedResponse = await fetch(oembedUrl);

        if (!oembedResponse.ok) {
            throw new Error(`YouTube oEmbed API error: ${oembedResponse.status}`);
        }

        const oembedData = await oembedResponse.json();

        // Build video data
        const videoData: VideoData = {
            id: videoId,
            title: sanitizeHtml(oembedData.title),
            authorName: sanitizeHtml(oembedData.author_name),
            authorUrl: sanitizeHtml(oembedData.author_url),
            thumbnailUrl: sanitizeHtml(oembedData.thumbnail_url),
            description: '', // Will be enriched if additional APIs are available
        };

        // Cache and return
        this.cache.set(url, videoData);
        return videoData;
    }

    validateUrl(url: string): boolean {
        const patterns = [
            /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
            /^https?:\/\/youtu\.be\/[\w-]+/,
            /^https?:\/\/(www\.)?m\.youtube\.com\/watch\?v=[\w-]+/
        ];

        return patterns.some(pattern => pattern.test(url));
    }

    extractVideoId(url: string): string | null {
        const patterns = [
            /youtube\.com\/watch\?v=([^&]+)/,
            /youtube\.com\/embed\/([^?]+)/,
            /youtu\.be\/([^?]+)/,
            /m\.youtube\.com\/watch\?v=([^&]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }
}
```

---

## Plugin Extension APIs

### Custom Prompt Template API

```typescript
export interface CustomPromptTemplate {
    id: string;
    name: string;
    description: string;
    format: OutputFormat;
    template: string;
    variables: TemplateVariable[];
    metadata: TemplateMetadata;
}

export interface TemplateVariable {
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    required: boolean;
    defaultValue?: any;
}

export interface TemplateMetadata {
    author: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    category: string;
}

// Template Manager API
export interface ITemplateManager {
    // Template CRUD operations
    createTemplate(template: CustomPromptTemplate): Promise<string>;
    getTemplate(id: string): Promise<CustomPromptTemplate | null>;
    updateTemplate(id: string, updates: Partial<CustomPromptTemplate>): Promise<boolean>;
    deleteTemplate(id: string): Promise<boolean>;

    // Template discovery
    listTemplates(format?: OutputFormat): Promise<CustomPromptTemplate[]>;
    searchTemplates(query: string): Promise<CustomPromptTemplate[]>;
    getTemplatesByCategory(category: string): Promise<CustomPromptTemplate[]>;

    // Template processing
    processTemplate(templateId: string, variables: Record<string, any>): Promise<string>;
    validateTemplate(template: CustomPromptTemplate): ValidationResult;
}

// Usage example
const customTemplate: CustomPromptTemplate = {
    id: 'tech-deep-dive',
    name: 'Technical Deep Dive Analysis',
    description: 'Comprehensive technical analysis for developer audience',
    format: 'executive',
    template: `
        Analyze this YouTube video from a technical perspective:

        Title: {{title}}
        Description: {{description}}

        Focus on:
        - Technical concepts and implementation details
        - Code examples and best practices
        - Architecture patterns and design decisions
        - Performance considerations and optimization

        Create a detailed technical analysis with actionable insights.
    `,
    variables: [
        { name: 'title', description: 'Video title', type: 'string', required: true },
        { name: 'description', description: 'Video description', type: 'string', required: true }
    ],
    metadata: {
        author: 'Your Name',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['technical', 'development', 'code'],
        category: 'Development'
    }
};
```

### Processing History API

```typescript
export interface IProcessingHistory {
    // History management
    addEntry(entry: ProcessingEntry): Promise<string>;
    getEntry(id: string): Promise<ProcessingEntry | null>;
    updateEntry(id: string, updates: Partial<ProcessingEntry>): Promise<boolean>;
    deleteEntry(id: string): Promise<boolean>;
    clearHistory(): Promise<void>;

    // History queries
    getEntries(limit?: number, offset?: number): Promise<ProcessingEntry[]>;
    getEntriesByDateRange(startDate: Date, endDate: Date): Promise<ProcessingEntry[]>;
    getEntriesByFormat(format: OutputFormat): Promise<ProcessingEntry[]>;
    getEntriesByProvider(provider: string): Promise<ProcessingEntry[]>;
    searchEntries(query: string): Promise<ProcessingEntry[]>;

    // Statistics
    getStatistics(): Promise<ProcessingStatistics>;
    exportData(format: 'json' | 'csv'): Promise<string>;
}

export interface ProcessingStatistics {
    totalProcessed: number;
    successfulProcesses: number;
    failedProcesses: number;
    averageProcessingTime: number;
    totalTokensUsed: number;
    mostUsedProvider: string;
    mostUsedFormat: OutputFormat;
    processingTrend: DailyStats[];
}

export interface DailyStats {
    date: string;
    count: number;
    successRate: number;
    averageTokens: number;
    averageTime: number;
}
```

---

## Configuration APIs

### Settings Management

```typescript
export interface ISettingsManager {
    // Core settings operations
    getSettings(): Promise<PluginSettings>;
    updateSettings(updates: Partial<PluginSettings>): Promise<void>;
    resetSettings(): Promise<void>;
    exportSettings(): Promise<string>;
    importSettings(settingsJson: string): Promise<void>;

    // Validation
    validateSettings(settings: PluginSettings): ValidationResult;
    validateApiKey(provider: string, apiKey: string): Promise<boolean>;

    // Configuration profiles
    saveProfile(name: string, settings: Partial<PluginSettings>): Promise<void>;
    loadProfile(name: string): Promise<Partial<PluginSettings>>;
    deleteProfile(name: string): Promise<void>;
    listProfiles(): Promise<string[]>;
}

// Settings schema with validation
export const SettingsSchema: JoiSchema = {
    // API Configuration
    geminiApiKey: Joi.string().optional(),
    groqApiKey: Joi.string().optional(),
    openaiApiKey: Joi.string().optional(),

    // Processing Preferences
    outputPath: Joi.string().default('YouTube/Processed Videos'),
    performanceMode: Joi.string().valid('speed', 'quality', 'balanced').default('balanced'),
    preferMultimodal: Joi.boolean().default(true),
    enableParallelProcessing: Joi.boolean().default(true),

    // Security Settings
    useEnvironmentVariables: Joi.boolean().default(false),
    environmentPrefix: Joi.string().default('YTC'),

    // UI Preferences
    showThumbnails: Joi.boolean().default(true),
    autoCloseModals: Joi.boolean().default(false),
    confirmBeforeProcessing: Joi.boolean().default(true),
    theme: Joi.string().valid('light', 'dark', 'auto').default('auto')
};
```

### Environment Variable Support

```typescript
export interface IEnvironmentConfig {
    // Load settings from environment variables
    loadFromEnvironment(): Partial<PluginSettings>;

    // Validate environment variables
    validateEnvironment(): ValidationResult;

    // Get environment variable
    getEnvVar(key: string, defaultValue?: string): string | undefined;
}

// Environment variable mapping
export const ENV_VAR_MAPPING = {
    'YTC_GEMINI_API_KEY': 'geminiApiKey',
    'YTC_GROQ_API_KEY': 'groqApiKey',
    'YTC_OPENAI_API_KEY': 'openaiApiKey',
    'YTC_OUTPUT_PATH': 'outputPath',
    'YTC_PERFORMANCE_MODE': 'performanceMode',
    'YTC_PREFER_MULTIMODAL': 'preferMultimodal',
    'YTC_ENABLE_PARALLEL': 'enableParallelProcessing'
};

// Usage example
const envConfig = new EnvironmentConfig(process.env);
const envSettings = envConfig.loadFromEnvironment();
const plugin = new YouTubeProcessor();
await plugin.loadSettings();
await plugin.updateSettings(envSettings);
```

---

## Event System

### Plugin Events

```typescript
export interface IEventManager {
    // Event registration
    on(event: PluginEvent, callback: EventCallback): string;
    off(event: PluginEvent, callbackOrId: EventCallback | string): void;
    once(event: PluginEvent, callback: EventCallback): string;

    // Event emission
    emit(event: PluginEvent, data?: any): void;

    // Event management
    removeAllListeners(event?: PluginEvent): void;
    listenerCount(event: PluginEvent): number;
    eventNames(): PluginEvent[];
}

export type PluginEvent =
    // Processing events
    | 'processing:started'
    | 'processing:progress'
    | 'processing:completed'
    | 'processing:failed'
    | 'processing:cancelled'

    // Video events
    | 'video:metadata-loaded'
    | 'video:thumbnail-loaded'
    | 'video:validation-failed'

    // UI events
    | 'modal:opened'
    | 'modal:closed'
    | 'settings:changed'
    | 'theme:changed'

    // History events
    | 'history:entry-added'
    | 'history:entry-updated'
    | 'history:entry-deleted'

    // Provider events
    | 'provider:selected'
    | 'provider:connected'
    | 'provider:disconnected'
    | 'provider:error';

export interface EventData {
    'processing:started': { videoId: string; format: OutputFormat };
    'processing:progress': { progress: number; message: string };
    'processing:completed': { result: ProcessedContent };
    'processing:failed': { error: Error };
    'processing:cancelled': { videoId: string };
    'video:metadata-loaded': { videoData: VideoData };
    'video:thumbnail-loaded': { url: string };
    'video:validation-failed': { url: string; error: string };
    'modal:opened': { type: string };
    'modal:closed': { type: string };
    'settings:changed': { key: string; oldValue: any; newValue: any };
    'theme:changed': { theme: string };
    'history:entry-added': { entry: ProcessingEntry };
    'history:entry-updated': { id: string; changes: Partial<ProcessingEntry> };
    'history:entry-deleted': { id: string };
    'provider:selected': { provider: string };
    'provider:connected': { provider: string };
    'provider:disconnected': { provider: string };
    'provider:error': { provider: string; error: Error };
}

// Event listener usage
const plugin = new YouTubeProcessor();

// Listen to processing events
plugin.on('processing:started', (data) => {
    console.log(`Started processing video ${data.videoId}`);
});

plugin.on('processing:progress', (data) => {
    console.log(`Progress: ${data.progress}% - ${data.message}`);
});

plugin.on('processing:completed', (data) => {
    console.log(`Processing completed! File: ${data.result.fileName}`);
});

plugin.on('processing:failed', (data) => {
    console.error(`Processing failed: ${data.error.message}`);
});
```

### Custom Event Support

```typescript
// Custom plugin events for extensions
export interface IExtensionEvent extends IEventManager {
    // Extension-specific events
    registerExtensionEvent(eventName: string, schema?: JoiSchema): void;
    emitExtensionEvent(eventName: string, data?: any): void;
    getExtensionEvents(): string[];
}

// Extension example
const extension = new YouTubeProcessorExtension(plugin);

// Register custom event
extension.registerExtensionEvent('tutorial:step-completed', {
    stepIndex: Joi.number().required(),
    stepTitle: Joi.string().required(),
    timeSpent: Joi.number().required()
});

// Emit custom event
extension.emitExtensionEvent('tutorial:step-completed', {
    stepIndex: 1,
    stepTitle: 'Set up development environment',
    timeSpent: 30000 // 30 seconds
});
```

---

## Error Handling

### Error Types and Hierarchy

```typescript
// Base error class
export abstract class YouTubeProcessorError extends Error {
    abstract readonly code: string;
    abstract readonly category: ErrorCategory;

    constructor(
        message: string,
        public readonly details?: any,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}

export enum ErrorCategory {
    VALIDATION = 'validation',
    NETWORK = 'network',
    API = 'api',
    PROCESSING = 'processing',
    FILESYSTEM = 'filesystem',
    CONFIGURATION = 'configuration'
}

// Specific error types
export class ValidationError extends YouTubeProcessorError {
    readonly code = 'VALIDATION_ERROR';
    readonly category = ErrorCategory.VALIDATION;
}

export class NetworkError extends YouTubeProcessorError {
    readonly code = 'NETWORK_ERROR';
    readonly category = ErrorCategory.NETWORK;
}

export class APIError extends YouTubeProcessorError {
    readonly code = 'API_ERROR';
    readonly category = ErrorCategory.API;

    constructor(
        message: string,
        public readonly provider: string,
        public readonly statusCode?: number,
        details?: any,
        cause?: Error
    ) {
        super(message, details, cause);
    }
}

export class ProcessingError extends YouTubeProcessorError {
    readonly code = 'PROCESSING_ERROR';
    readonly category = ErrorCategory.PROCESSING;

    constructor(
        message: string,
        public readonly videoId: string,
        public readonly format: OutputFormat,
        details?: any,
        cause?: Error
    ) {
        super(message, details, cause);
    }
}

export class FilesystemError extends YouTubeProcessorError {
    readonly code = 'FILESYSTEM_ERROR';
    readonly category = ErrorCategory.FILESYSTEM;

    constructor(
        message: string,
        public readonly path: string,
        public readonly operation: string,
        details?: any,
        cause?: Error
    ) {
        super(message, details, cause);
    }
}
```

### Error Handling Middleware

```typescript
export interface IErrorHandler {
    // Error handling
    handleError(error: Error, context?: ErrorContext): Promise<void>;

    // Error reporting
    reportError(error: YouTubeProcessorError): Promise<void>;

    // Error recovery
    attemptRecovery(error: YouTubeProcessorError): Promise<boolean>;

    // Error logging
    logError(error: Error, level: LogLevel = 'error'): void;
}

export interface ErrorContext {
    operation: string;
    videoId?: string;
    provider?: string;
    settings?: Partial<PluginSettings>;
    userAgent?: string;
    timestamp: Date;
}

// Error handler implementation
export class DefaultErrorHandler implements IErrorHandler {
    constructor(
        private logger: ILogger,
        private telemetry: ITelemetryService
    ) {}

    async handleError(error: Error, context?: ErrorContext): Promise<void> {
        // Log the error
        this.logError(error, 'error');

        // Categorize and handle
        if (error instanceof YouTubeProcessorError) {
            await this.handleKnownError(error, context);
        } else {
            await this.handleUnknownError(error, context);
        }
    }

    private async handleKnownError(
        error: YouTubeProcessorError,
        context?: ErrorContext
    ): Promise<void> {
        switch (error.category) {
            case ErrorCategory.NETWORK:
                await this.handleNetworkError(error, context);
                break;
            case ErrorCategory.API:
                await this.handleAPIError(error, context);
                break;
            case ErrorCategory.PROCESSING:
                await this.handleProcessingError(error, context);
                break;
            // ... other categories
        }
    }

    private async handleNetworkError(
        error: NetworkError,
        context?: ErrorContext
    ): Promise<void> {
        // Attempt retry with exponential backoff
        if (await this.attemptRecovery(error)) {
            this.logger.info('Network error recovered successfully');
        } else {
            this.notifyUser('Network connection failed. Please check your internet connection.');
        }
    }

    private async handleAPIError(
        error: APIError,
        context?: ErrorContext
    ): Promise<void> {
        if (error.statusCode === 401) {
            this.notifyUser(`API authentication failed for ${error.provider}. Please check your API key.`);
        } else if (error.statusCode === 429) {
            this.notifyUser('API rate limit exceeded. Please try again later.');
        } else {
            this.notifyUser(`API error from ${error.provider}: ${error.message}`);
        }
    }
}
```

### Error Recovery Strategies

```typescript
export interface IRecoveryStrategy {
    canRecover(error: YouTubeProcessorError): boolean;
    recover(error: YouTubeProcessorError, context?: ErrorContext): Promise<boolean>;
}

export class RetryStrategy implements IRecoveryStrategy {
    constructor(
        private maxRetries: number = 3,
        private baseDelay: number = 1000,
        private maxDelay: number = 30000
    ) {}

    canRecover(error: YouTubeProcessorError): boolean {
        return error.category === ErrorCategory.NETWORK ||
               (error.category === ErrorCategory.API &&
                (error.statusCode === 429 || error.statusCode === 503));
    }

    async recover(
        error: YouTubeProcessorError,
        context?: ErrorContext
    ): Promise<boolean> {
        const retryCount = context?.retryCount ?? 0;

        if (retryCount >= this.maxRetries) {
            return false;
        }

        // Exponential backoff with jitter
        const delay = Math.min(
            this.baseDelay * Math.pow(2, retryCount) + Math.random() * 1000,
            this.maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        return true;
    }
}

export class FallbackProviderStrategy implements IRecoveryStrategy {
    canRecover(error: YouTubeProcessorError): boolean {
        return error.category === ErrorCategory.API &&
               error instanceof APIError &&
               this.hasAlternateProvider(error.provider);
    }

    async recover(
        error: APIError,
        context?: ErrorContext
    ): Promise<boolean> {
        const alternateProvider = this.getAlternateProvider(error.provider);

        if (alternateProvider && context?.settings) {
            context.settings.preferredProvider = alternateProvider;
            return true;
        }

        return false;
    }

    private hasAlternateProvider(provider: string): boolean {
        const availableProviders = ['gemini', 'groq', 'openai'];
        return availableProviders.some(p => p !== provider && this.hasApiKey(p));
    }
}
```

---

## Usage Examples

### Basic Video Processing

```typescript
import YouTubeProcessor from './src/main';

const plugin = new YouTubeProcessor();

// Initialize plugin
await plugin.onload();

// Process a video
try {
    const videoData = await plugin.youtubeService.extractVideoData(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );

    const result = await plugin.processor.processVideoContent(
        videoData,
        plugin.settings,
        'executive'
    );

    console.log('Processing completed:', result.fileName);
} catch (error) {
    console.error('Processing failed:', error.message);
}
```

### Custom Provider Implementation

```typescript
import { AIProvider, ProviderSettings, AIResponse } from './src/types';

export class CustomAIProvider implements AIProvider {
    readonly name = 'custom-provider';
    readonly endpoint = 'https://api.custom-provider.com/v1/generate';
    readonly supportsMultimodal = false;
    readonly maxTokens = 8000;
    readonly defaultModel = 'custom-model-v1';
    readonly availableModels = ['custom-model-v1', 'custom-model-v2'];

    async process(
        prompt: string,
        settings: ProviderSettings
    ): Promise<AIResponse> {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.apiKey}`,
                'Content-Type': 'application/json',
                'X-Custom-Header': 'youtube-processor'
            },
            body: JSON.stringify({
                prompt,
                model: settings.model,
                max_tokens: settings.maxTokens,
                temperature: settings.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`Custom provider error: ${response.status}`);
        }

        const data = await response.json();

        return {
            content: data.text,
            model: settings.model,
            provider: this.name,
            usage: {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens
            },
            processingTime: data.processing_time_ms
        };
    }

    validateKey(apiKey: string): boolean {
        return apiKey.startsWith('cp_') && apiKey.length > 30;
    }
}

// Register the custom provider
plugin.registerProvider(new CustomAIProvider());
```

### Event-Driven Processing

```typescript
// Set up event listeners
plugin.on('processing:started', (data) => {
    console.log(`Processing started for video ${data.videoId}`);
    showLoadingIndicator();
});

plugin.on('processing:progress', (data) => {
    updateProgressBar(data.progress);
    setStatusMessage(data.message);
});

plugin.on('processing:completed', (data) => {
    console.log(`Processing completed: ${data.result.fileName}`);
    hideLoadingIndicator();
    showSuccessNotification();
});

plugin.on('processing:failed', (data) => {
    console.error(`Processing failed: ${data.error.message}`);
    hideLoadingIndicator();
    showErrorNotification(data.error.message);
});

// Process video with automatic progress tracking
async function processVideoWithProgress(url: string) {
    try {
        const videoData = await plugin.youtubeService.extractVideoData(url);
        await plugin.processor.processVideoContent(videoData, plugin.settings, 'tutorial');
    } catch (error) {
        console.error('Processing failed:', error);
    }
}
```

---

*This comprehensive API documentation provides everything needed to integrate with, extend, or build upon the YouTube Processor plugin. All APIs are designed with TypeScript type safety and include comprehensive error handling.* 🚀