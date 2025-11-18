# API Reference

## Core Interfaces & Types

### YouTubePluginSettings

```typescript
interface YouTubePluginSettings {
  // API Keys
  geminiApiKey: string;           // Google Gemini API key
  groqApiKey: string;             // Groq API key (optional)

  // Vault Configuration
  outputPath: string;             // Path to save generated notes
                                  // e.g., "📥 Inbox/Clippings/YouTube"

  // Environment Variables
  useEnvironmentVariables: boolean; // Load API keys from env vars
  environmentPrefix: string;       // Prefix for env var names

  // Caching & State
  modelOptionsCache?: Record<string, string[]>; // Cached model lists
  customPrompts?: Record<OutputFormat, string>; // Session-only custom prompts

  // Performance Configuration
  performanceMode: PerformanceMode; // 'fast' | 'balanced' | 'quality'
  enableParallelProcessing: boolean; // Enable parallel processing when available
  preferMultimodal: boolean;        // Prefer multimodal models when available
}
```

### PerformanceMode

```typescript
type PerformanceMode = 'fast' | 'balanced' | 'quality';

// Descriptions:
// - 'fast': Prioritize speed over quality (faster models, simpler processing)
// - 'balanced': Optimal balance of speed and quality
// - 'quality': Prioritize quality over speed (more advanced models, detailed processing)
```
```

### OutputFormat

```typescript
type OutputFormat = 'executive-summary' | 'detailed-guide' | 'brief' | 'custom';

// Descriptions:
// - 'executive-summary': Concise overview with key insights (≤250 words)
// - 'detailed-guide': Step-by-step walkthrough for tutorials
// - 'brief': Bullet-point format with key takeaways
// - 'custom': User-provided prompt (session-only, not persisted)
```

### VideoData

```typescript
interface VideoData {
  title: string;              // Video title from YouTube
  description: string;        // Video description from YouTube
  videoId: string;           // Extracted video ID
  url: string;               // Full YouTube URL
  duration?: number;         // Video duration in seconds
  channelTitle?: string;     // Channel name
  publishedAt?: string;      // Publication date (ISO 8601)
}
```

### AIResponse

```typescript
interface AIResponse {
  content: string;           // Generated summary/guide text
  provider: string;          // Provider name (e.g., 'Gemini', 'Groq')
  model: string;            // Model used (e.g., 'gemini-2.0-pro')
}
```

### ProcessingResult

```typescript
interface ProcessingResult {
  success: boolean;
  filePath?: string;         // Path to created note if successful
  error?: string;           // Error message if failed
}
```

## Service APIs

### ServiceContainer (Dependency Injection)

```typescript
// Get singleton instance
const container = ServiceContainer.getInstance();

// Access services
const aiService = container.getAIService();
const fileService = container.getFileService();
const videoDataService = container.getVideoDataService();
const promptService = container.getPromptService();

// Update settings (resets all services)
await container.updateSettings(newSettings);

// Static factory method
static create(app: App, settings: YouTubePluginSettings): ServiceContainer
```

### AIService

```typescript
class AIService {
  // Process a prompt with provider fallback
  async process(prompt: string): Promise<string>
  
  // Get available providers
  getProviders(): AIProvider[]
  
  // Get fallback chain status
  getProviderStatus(): ProviderStatus[]
}

// Usage
const aiService = ServiceContainer.getInstance().getAIService();
const response = await aiService.process('Summarize the video...');
```

### FileService (Obsidian Vault Operations)

```typescript
class FileService {
  // Save generated note to vault
  async saveNote(
    content: string,
    format: OutputFormat,
    videoData: VideoData
  ): Promise<string>  // Returns file path
  
  // Create dated folder structure
  async ensurePath(basePath: string): Promise<TFolder>
  
  // Check for file conflicts
  async checkFileExists(filePath: string): Promise<boolean>
  
  // Get vault base path
  getVaultPath(): string
}

// Usage
const fileService = ServiceContainer.getInstance().getFileService();
const filePath = await fileService.saveNote(
  '# Generated Note\n\nContent...',
  'executive-summary',
  videoData
);
```

### PromptService

```typescript
class PromptService {
  // Get AI prompt for given format
  getPrompt(
    format: OutputFormat,
    videoData: VideoData,
    customPrompt?: string
  ): string
  
  // Get all available format descriptions
  getFormatDescriptions(): Record<OutputFormat, string>
}

// Usage
const promptService = ServiceContainer.getInstance().getPromptService();
const prompt = promptService.getPrompt('executive-summary', {
  title: 'How to Learn TypeScript',
  description: '...',
  videoId: 'abc123',
  url: 'https://youtube.com/watch?v=abc123'
});
```

### VideoDataService

```typescript
class VideoDataService {
  // Extract video ID from URL
  extractVideoId(url: string): string | null
  
  // Validate YouTube URL format
  isValidUrl(url: string): boolean
  
  // Fetch video metadata from YouTube
  async extractMetadata(url: string): Promise<VideoData>
  
  // Get cached metadata (if available)
  getCachedMetadata(videoId: string): VideoData | null
}

// Usage
const videoService = ServiceContainer.getInstance().getVideoDataService();
const metadata = await videoService.extractMetadata(
  'https://youtube.com/watch?v=abc123'
);
```

### MemoryCache

```typescript
class MemoryCache {
  // Store value with TTL (in seconds)
  set<T>(key: string, value: T, ttlSeconds: number): void
  
  // Retrieve cached value
  get<T>(key: string): T | null
  
  // Delete specific entry
  delete(key: string): void
  
  // Clear all entries
  clear(): void
  
  // Check if key exists and not expired
  has(key: string): boolean
}

// Usage
const cache = new MemoryCache();
cache.set('url-validation:xyz', true, 3600); // 1 hour TTL
const cached = cache.get('url-validation:xyz');
```

## AI Provider Interfaces

### AIProvider (Abstract Base)

```typescript
abstract class BaseProvider implements AIProvider {
  // Provider identifier
  abstract readonly name: string;
  
  // Current model being used
  abstract model: string;
  
  // Process prompt and return response
  abstract async process(prompt: string): Promise<string>
  
  // Optionally set model
  abstract setModel?(model: string): void
}
```

### GeminiProvider

```typescript
class GeminiProvider extends BaseProvider {
  readonly name = 'Gemini';
  model: string; // e.g., 'gemini-2.0-pro'
  
  constructor(apiKey: string);
  
  async process(prompt: string): Promise<string>
  
  // Supports multimodal video analysis
  // Automatically uses audio/video tokens for video URLs
}

// Usage
const gemini = new GeminiProvider(apiKey);
const response = await gemini.process(prompt);
```

### GroqProvider

```typescript
class GroqProvider extends BaseProvider {
  readonly name = 'Groq';
  model: string; // e.g., 'mixtral-8x7b'
  
  constructor(apiKey: string);
  
  async process(prompt: string): Promise<string>
  
  // Fast LLM inference, text-only (no multimodal support)
}

// Usage
const groq = new GroqProvider(apiKey);
const response = await groq.process(prompt);
```

## Utility Functions

### ErrorHandler

```typescript
class ErrorHandler {
  // Handle API errors with context
  static handleAPIError(
    response: Response,
    provider: string,
    fallbackMessage: string
  ): Error
  
  // Handle general errors with logging
  static handleError(
    error: Error | unknown,
    userMessage: string,
    context?: Record<string, any>
  ): void
  
  // Wrapper for async operations
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null>
}

// Usage
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw ErrorHandler.handleAPIError(response, 'Gemini', 'Failed to process');
  }
} catch (error) {
  ErrorHandler.handleError(error, 'Processing failed');
}
```

### ValidationUtils

```typescript
class ValidationUtils {
  // Check if string is valid YouTube URL
  static isValidYouTubeUrl(url: string): boolean
  
  // Extract video ID from URL
  static extractVideoId(url: string): string | null
  
  // Validate and throw on invalid URL
  static validateYouTubeUrl(url: string): void
  
  // Validate API key format
  static isValidApiKey(key: string): boolean
}

// Usage
if (ValidationUtils.isValidYouTubeUrl(url)) {
  const videoId = ValidationUtils.extractVideoId(url);
}
```

### DOMUtils

```typescript
class DOMUtils {
  // Create styled container
  static createStyledContainer(
    parent: HTMLElement,
    className: string,
    styles?: Record<string, string>
  ): HTMLElement
  
  // Create accessible button
  static createAccessibleButton(
    parent: HTMLElement,
    label: string,
    onclick: () => void
  ): HTMLButtonElement
  
  // Show loading spinner
  static showSpinner(container: HTMLElement): HTMLElement
  
  // Clear container
  static clear(element: HTMLElement): void
}

// Usage
const container = DOMUtils.createStyledContainer(
  parentEl,
  'my-container',
  { padding: '12px', borderRadius: '4px' }
);
```

## Component APIs

### YouTubeUrlModal

```typescript
interface YouTubeUrlModalOptions {
  onProcess: (
    url: string,
    format: OutputFormat,
    provider?: string,
    model?: string,
    customPrompt?: string,
    performanceMode?: PerformanceMode,
    enableParallel?: boolean,
    preferMultimodal?: boolean
  ) => Promise<string>;  // Return file path

  onOpenFile?: (filePath: string) => Promise<void>;
  initialUrl?: string;
  providers?: string[];
  modelOptions?: Record<string, string[]>;
  defaultProvider?: string;
  defaultModel?: string;
  fetchModels?: () => Promise<Record<string, string[]>>;
  performanceMode?: PerformanceMode;
  enableParallelProcessing?: boolean;
  preferMultimodal?: boolean;
  onPerformanceSettingsChange?: (performanceMode: PerformanceMode, enableParallel: boolean, preferMultimodal: boolean) => Promise<void>;
}

class YouTubeUrlModal extends BaseModal {
  constructor(app: App, options: YouTubeUrlModalOptions);
  
  onOpen(): void           // Called when modal opens
  onClose(): void          // Called when modal closes
  
  // Set initial URL
  setUrl(url: string): void
}

// Usage
new YouTubeUrlModal(this.app, {
  onProcess: async (url, format, provider, model, customPrompt, performanceMode, enableParallel, preferMultimodal) => {
    // Process video and return file path
    return '/path/to/created/note';
  },
  onOpenFile: async (filePath) => {
    // Open file in editor
  },
  performanceMode: 'balanced',
  enableParallelProcessing: true,
  preferMultimodal: true,
  onPerformanceSettingsChange: async (performanceMode, enableParallel, preferMultimodal) => {
    // Update plugin settings when changed
  }
}).open();
```

### Core Plugin Functions

```typescript
// Main video processing function
async function processYouTubeVideo(
  url: string,
  format: OutputFormat = 'detailed-guide',
  providerName?: string,
  model?: string,
  customPrompt?: string,
  performanceMode?: PerformanceMode,
  enableParallel?: boolean,
  preferMultimodal?: boolean
): Promise<string>  // Returns file path of created note

// Usage in plugin
const filePath = await processYouTubeVideo(
  'https://youtube.com/watch?v=abc123',
  'executive-summary',
  'Gemini',
  'gemini-2.0-pro',
  'Custom prompt here...',
  'balanced',
  true,
  true
);
```

### SettingsTab

```typescript
class SettingsTab extends PluginSettingTab {
  constructor(app: App, plugin: Plugin);
  
  display(): void          // Render settings UI
  
  // Private methods for sections
  private createApiKeySection(): void
  private createFormatSection(): void
  private createCustomPromptSection(): void
}
```

## Constants

### API Endpoints

```typescript
const API_ENDPOINTS = {
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models',
  GROQ: 'https://api.groq.com/openai/v1/chat/completions',
  YOUTUBE_OEMBED: 'https://www.youtube.com/oembed',
  CORS_PROXY: 'https://cors-proxy.fringe.zone'
};
```

### Model Options

```typescript
const PROVIDER_MODEL_OPTIONS = {
  'Gemini': [
    { name: 'gemini-2.0-pro', supportsAudioVideo: true },
    { name: 'gemini-1.5-pro', supportsAudioVideo: true },
    { name: 'gemini-pro', supportsAudioVideo: false }
  ],
  'Groq': [
    'mixtral-8x7b',
    'llama2-70b',
    'neural-chat-7b'
  ]
};
```

### UI Constants

```typescript
const STYLES = {
  CONTAINER: 'ytc-container',           // Main container class
  MODAL: 'ytc-modal',                   // Modal dialog class
  BUTTON: 'ytc-button',                 // Button class
  INPUT: 'ytc-input',                   // Input field class
  ERROR: 'ytc-error',                   // Error message class
  SUCCESS: 'ytc-success'                // Success message class
};

const MESSAGES = {
  MODALS: {
    PROCESS_VIDEO: 'Process YouTube Video',
    INVALID_URL: 'Please enter a valid YouTube URL',
    PROCESSING: 'Processing video...',
    SUCCESS: 'Note created successfully!'
  },
  // ... more messages
};
```

## Event Handling

### Plugin Events

```typescript
// Register command
this.addCommand({
  id: 'process-youtube-video',
  name: 'Process YouTube Video',
  callback: () => {
    // Open modal
    new YouTubeUrlModal(this.app, options).open();
  }
});

// Register settings change
this.registerEvent(
  this.app.vault.on('create', (file) => {
    // Handle file creation
  })
);

// Custom events
this.on('video-processed', (data) => {
  // Handle custom event
});
```

## Error Types

### Common Errors

```typescript
// URL Validation
class InvalidURLError extends Error {
  constructor(url: string) {
    super(`Invalid YouTube URL: ${url}`);
  }
}

// API Errors
class APIError extends Error {
  constructor(
    provider: string,
    statusCode: number,
    message: string
  ) {
    super(`${provider} API error (${statusCode}): ${message}`);
  }
}

// Authentication Errors
class AuthenticationError extends Error {
  constructor(provider: string) {
    super(`Authentication failed for ${provider}. Check API key.`);
  }
}

// File I/O Errors
class FileIOError extends Error {
  constructor(operation: string, path: string) {
    super(`File I/O error during ${operation}: ${path}`);
  }
}
```

## Response Formats

### API Response Structure

```typescript
// Gemini API Response
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// Groq API Response
interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// YouTube oEmbed Response
interface YouTubeOembedResponse {
  title: string;
  author_name: string;
  author_url: string;
  type: 'video';
  height: number;
  width: number;
  version: '1.0';
  provider_name: 'YouTube';
  provider_url: 'https://www.youtube.com/';
  thumbnail_height: number;
  thumbnail_width: number;
  thumbnail_url: string;
  html: string;
}
```

## Configuration Examples

### Initialize ServiceContainer

```typescript
import { ServiceContainer } from './services/service-container';
import { YouTubePluginSettings } from './interfaces/types';

const settings: YouTubePluginSettings = {
  geminiApiKey: 'your-api-key',
  groqApiKey: '',
  outputPath: '📥 Inbox/Clippings/YouTube',
  useEnvironmentVariables: false,
  environmentPrefix: 'YT_PROCESSOR_'
};

const container = ServiceContainer.create(this.app, settings);
```

### Process Video End-to-End

```typescript
async function processVideo(
  url: string,
  format: 'executive-summary' | 'brief'
): Promise<string> {
  const container = ServiceContainer.getInstance();
  
  // 1. Extract metadata
  const videoData = await container
    .getVideoDataService()
    .extractMetadata(url);
  
  // 2. Generate prompt
  const prompt = container
    .getPromptService()
    .getPrompt(format, videoData);
  
  // 3. Get AI response
  const content = await container
    .getAIService()
    .process(prompt);
  
  // 4. Save to vault
  const filePath = await container
    .getFileService()
    .saveNote(content, format, videoData);
  
  return filePath;
}
```

