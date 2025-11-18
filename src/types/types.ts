/**
 * Core interfaces and types for the YoutubeClipper plugin
 */

import { App, TFile } from 'obsidian';

export interface YouTubePluginSettings {
    geminiApiKey: string;
    groqApiKey: string;
    outputPath: string;
    useEnvironmentVariables: boolean;
    environmentPrefix: string;
    modelOptionsCache?: Record<string, string[]>;
    customPrompts?: Record<OutputFormat, string>;
    // Speed/Quality balance settings
    performanceMode: PerformanceMode;
    customTimeouts?: CustomTimeoutSettings;
    enableParallelProcessing: boolean;
    preferMultimodal: boolean;
}

export type PerformanceMode = 'fast' | 'balanced' | 'quality';

export interface CustomTimeoutSettings {
    geminiTimeout: number;
    groqTimeout: number;
    metadataTimeout: number;
}

export interface PerformancePreset {
    name: string;
    description: string;
    timeouts: CustomTimeoutSettings;
    enableParallel: boolean;
    preferMultimodal: boolean;
    modelStrategy: ModelStrategy;
}

export interface ModelStrategy {
    briefFormat: string;
    executiveSummary: string;
    detailedGuide: string;
    fallbackModel: string;
}

export type OutputFormat = 'executive-summary' | 'detailed-guide' | 'brief' | 'custom';

export interface ProcessingOptions {
    format: OutputFormat;
    useMultimodal: boolean;
}

export interface VideoData {
    title: string;
    description: string;
}

export interface AIResponse {
    content: string;
    provider: string;
    model: string;
}

export interface ProcessingResult {
    success: boolean;
    filePath?: string;
    error?: string;
}

// Service interfaces
export interface AIProvider {
    readonly name: string;
    model: string;
    process(prompt: string): Promise<string>;
    setModel?(model: string): void;
    setTimeout?(timeout: number): void;
}

export interface VideoDataService {
    extractVideoId(url: string): string | null;
    getVideoData(videoId: string): Promise<VideoData>;
}

export interface FileService {
    saveToFile(title: string, content: string, outputPath: string): Promise<string>;
    openFileWithConfirmation(file: TFile): Promise<void>;
}

export interface CacheService {
    get<T>(key: string): T | null;
    set<T>(key: string, value: T, ttl?: number): void;
    clear(): void;
}

export interface PromptService {
    createAnalysisPrompt(videoData: VideoData, videoUrl: string, format?: OutputFormat, customPrompt?: string): string;
    processAIResponse(content: string, provider: string, model: string, format?: OutputFormat, videoData?: VideoData, videoUrl?: string): string;
}

// Utility types
export type StyleObject = Record<string, string | number>;

export interface DOMUtilsInterface {
    applyStyles(element: HTMLElement, styles: StyleObject): void;
    createButtonContainer(parent: HTMLElement): HTMLDivElement;
    createStyledButton(
        container: HTMLElement, 
        text: string, 
        isPrimary?: boolean, 
        onClick?: () => void
    ): HTMLButtonElement;
}

export interface ErrorHandlerInterface {
    handle(error: Error, context: string, showNotice?: boolean): void;
    withErrorHandling<T>(
        operation: () => Promise<T>,
        context: string
    ): Promise<T | null>;
}

// Configuration types
export interface ServiceContainer {
    aiService: AIService;
    videoService: VideoDataService;
    fileService: FileService;
    cacheService: CacheService;
    promptService: PromptService;
}

export interface AIService {
    process(prompt: string): Promise<AIResponse>;
    processWith(providerName: string, prompt: string, overrideModel?: string): Promise<AIResponse>;
    getProviderNames(): string[];
    getProviderModels(providerName: string): string[];
    fetchLatestModels(): Promise<Record<string, string[]>>;
    fetchLatestModelsForProvider(providerName: string): Promise<string[]>;
}

// Event types
export interface ModalEvents {
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}
