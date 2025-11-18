# Architecture & Design

## System Overview

The YoutubeClipper plugin follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│              UI Layer (Components)                   │
│  - YouTubeUrlModal (input & format selection)       │
│  - SettingsTab (configuration)                      │
│  - Confirmation Modals (file conflicts)             │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│           Service Container (DI)                    │
│  - Manages service lifecycle                        │
│  - Handles settings updates                         │
│  - Provides service instances to components        │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│           Business Logic (Services)                 │
│  - PromptService (AI prompt templating)             │
│  - AIService (provider fallback manager)            │
│  - FileService (Obsidian vault operations)          │
│  - VideoDataService (YouTube metadata)              │
│  - MemoryCache (performance optimization)           │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│          AI Providers (Adapters)                    │
│  - GeminiProvider (Google Gemini API)               │
│  - GroqProvider (Groq API)                          │
│  - BaseProvider (abstract base class)               │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│         External APIs & Resources                   │
│  - Google Gemini API                                │
│  - Groq API                                         │
│  - YouTube oEmbed API                               │
│  - CORS Proxy (optional)                            │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│         Integration Layer (Extensions)              │
│  - Chrome Extension (direct video processing)       │
│  - Obsidian URI Protocol Handler                    │
│  - Clipboard Integration                            │
└─────────────────────────────────────────────────────┘
```

## Core Components

### 1. UI Layer (`src/components/`)

#### YouTubeUrlModal (`modals/youtube-url-modal.ts`)
- **Purpose**: Presents the user with video input and format selection interface
- **Responsibilities**:
  - URL validation and input handling
  - Format selection (Executive, Tutorial, Brief, Custom)
  - Provider and model selection UI
  - Real-time progress display
  - Error handling and user feedback
  
**Key Methods**:
- `onOpen()`: Initializes modal and creates UI
- `processVideo()`: Validates URL, invokes processing, displays results
- `setupEventHandlers()`: Attaches event listeners for validation/selection

#### SettingsTab (`settings/settings-tab.ts`)
- **Purpose**: Configures plugin settings and API credentials
- **Responsibilities**:
  - API key management
  - Default format selection
  - Output path configuration
  - Display of available AI models
  - Custom prompt editing (for session-only custom format)

**Key Methods**:
- `display()`: Renders settings UI
- `validateAndSaveSettings()`: Persists settings to Obsidian

### 2. Service Container (`src/services/service-container.ts`)

Acts as a **Dependency Injection container** and service factory:

```typescript
ServiceContainer.getInstance() // Singleton pattern
  .getAIService()              // Returns configured AIService
  .getFileService()            // Returns FileService
  .getVideoDataService()        // Returns VideoDataService
  .updateSettings(newSettings)  // Resets services with new config
```

**Why**: Centralizes service instantiation and dependency management. When settings change (e.g., API key), all services are reset with the new configuration.

### 3. Business Logic Services (`src/services/`)

#### AIService (`ai/ai-service.ts`)
**Provider Fallback Pattern**: Attempts providers in order, returns first successful response.

```typescript
async process(prompt: string): Promise<string> {
  for (const provider of this.providers) {
    try {
      return await provider.process(prompt);
    } catch (error) {
      // Log error, try next provider
      continue;
    }
  }
  throw new Error("All providers failed");
}
```

**Providers**:
- **Gemini** (Primary): Multimodal video support via Google Gemini 2.0+
- **Groq** (Secondary): Fast text-only fallback

#### PromptService (`prompt-service.ts`)
Generates AI prompts for each output format:

```typescript
// For each format, creates a prompt template with:
// - Clear instructions for the output structure
// - Placeholder variables (__VIDEO_TITLE__, __VIDEO_URL__, etc.)
// - Context about the video and desired analysis depth
getPrompt(format: OutputFormat, videoData: VideoData): string
```

**Output Formats**:
1. **Executive Summary** (≤250 words)
   - Key insights with actionable items
   - For quick reference

2. **Detailed Guide** (Step-by-step)
   - Structured walkthrough for tutorials
   - Includes common pitfalls

3. **Brief** (Bullet points)
   - Concise key points only
   - For fast note-taking

4. **Custom** (Session-only)
   - User-provided prompt for this session
   - Not persisted to settings
   - Allows single-prompt overrides

#### FileService (`file/obsidian-file.ts`)
Handles vault file operations:

```typescript
async saveNote(
  content: string,
  format: OutputFormat,
  videoData: VideoData
): Promise<string>
```

**Responsibilities**:
- Creates date-stamped folders
- Prevents file conflicts
- Applies YAML frontmatter
- Returns file path for display

#### VideoDataService (`youtube/video-data.ts`)
Extracts YouTube metadata:

```typescript
async extractMetadata(url: string): VideoMetadata {
  // Validates URL format
  // Extracts video ID
  // Fetches title/description via YouTube oEmbed
  // Returns structured metadata
}
```

### 4. AI Provider Adapters (`src/services/ai/`)

#### BaseProvider (`base.ts`)
Abstract base class defining provider contract:

```typescript
abstract class BaseProvider {
  abstract readonly name: string;
  abstract model: string;
  abstract process(prompt: string): Promise<string>;
  
  // Shared validation/utilities
  protected validateResponse(response: any): void { ... }
}
```

#### GeminiProvider (`gemini.ts`)
**Google Gemini API Adapter**:

```typescript
async process(prompt: string): Promise<string> {
  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': this.apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2048 },
      safetySettings: [...],
    })
  });
  
  // Parse and validate response
  return response.candidates[0].content.parts[0].text;
}
```

**Multimodal Support** (Gemini 2.0+):
- Sets `useAudioVideoTokens: true` for video analysis
- Sends full prompt with video URL context

#### GroqProvider (`groq.ts`)
**Groq API Adapter** (fallback):

```typescript
async process(prompt: string): Promise<string> {
  // Calls Groq API for fast LLM inference
  // Text-only (no multimodal support)
  // Used as fallback if Gemini fails
}
```

### 5. Utilities & Helpers

#### ErrorHandler (`utils/error-handler.ts`)
Centralized error handling:

```typescript
ErrorHandler.handleAPIError(response, provider, fallback)
ErrorHandler.withErrorHandling(fn, context) // Wrapper for async ops
```

#### ValidationUtils (`utils/validation.ts`)
Input validation:

```typescript
ValidationUtils.isValidYouTubeUrl(url)
ValidationUtils.validateYouTubeUrl(url) // Throws if invalid
```

#### MemoryCache (`cache/memory-cache.ts`)
In-memory caching for performance:

```typescript
cache.set('url-validation:xyz', true, 3600) // 1 hour TTL
cache.get('url-validation:xyz') // Returns cached result
```

#### SecureConfigService (`services/secure-config.ts`)
Manages API keys securely via Obsidian plugin data:

```typescript
SecureConfigService.getApiKey(provider) // Retrieves from Obsidian
SecureConfigService.setApiKey(provider, key) // Persists to Obsidian
```

## Data Flow

### Processing a YouTube Video

```
User Input (URL + Format)
        ↓
[YouTubeUrlModal validates URL]
        ↓
[VideoDataService extracts metadata]
        ↓
[PromptService generates AI prompt with video context]
        ↓
[AIService.process(prompt)]
        ├─→ [GeminiProvider.process() - Primary]
        │   ├─→ Success → Return response
        │   └─→ Failure → Next provider
        │
        └─→ [GroqProvider.process() - Fallback]
            ├─→ Success → Return response
            └─→ Failure → Throw error
        ↓
[Response validation and parsing]
        ↓
[FileService.saveNote(content, format, videoData)]
        ├─→ Creates date folder
        ├─→ Checks for conflicts
        ├─→ Writes YAML + Content
        └─→ Returns file path
        ↓
[Modal displays success or auto-opens note]
```

## State Management

### Plugin State Lifecycle

```typescript
// 1. Plugin Initialization
onload(): void {
  // Register commands
  // Register event handlers
  // Load settings
  // Initialize ServiceContainer
  // Create UI ribbon button
  // Register Chrome extension integration (URI protocol handler)
  // Set up temporary note detection (for Chrome extension compatibility)
}

// 2. Settings Updated
onPluginSettingsChanged(settings: YouTubePluginSettings): void {
  ServiceContainer.updateSettings(settings)
  // All services reset with new config
}

// 3. User Triggers Processing
// → Modal opens
// → User provides input
// → Service processes request
// → Note created in vault

// 4. Plugin Unload
onunload(): void {
  // Cleanup event handlers
  // Clear caches
}
```

### Settings Persistence

Settings are stored in Obsidian's plugin data directory:
- **Location**: `.obsidian/plugins/youtube-clipper/data.json`
- **Format**: JSON with encrypted API keys (Obsidian handles encryption)
- **Accessibility**: Via `SecureConfigService`

### Chrome Extension Integration

The plugin supports integration with a Chrome extension for seamless YouTube video processing:

**URI Protocol Handler**:
- registers `obsidian://youtube-clipper` protocol
- receives video URLs directly from Chrome extension
- bypasses temporary note creation for faster processing

**Temporary Note Detection**:
- monitors vault for notes containing YouTube URLs
- detects notes created by Chrome extension (marked with `<!-- ytc-extension:youtube-clipper -->`)
- automatically processes detected video URLs
- prevents duplicate processing with file tracking system

**Clipboard Integration**:
- provides command to read YouTube URL from clipboard
- allows manual invocation when Chrome extension isn't available

## Performance Optimizations

### 1. Caching Strategy
- **URL Validation Cache**: 1-hour TTL per URL
- **Model List Cache**: Updated on demand or settings change
- **In-Memory Only**: No disk I/O overhead

### 2. Debouncing
- URL validation debounced during input to avoid excessive API calls
- Prevents checking same URL multiple times in quick succession

### 3. Lazy Loading
- Services instantiated on-demand via ServiceContainer
- AI providers only created if API keys are configured

### 4. Memoization
- Metadata extraction cached per video ID
- Avoids re-fetching for same video in session

### 5. Runtime Performance Configuration
- **Performance Mode**: Configurable between 'fast', 'balanced', 'quality' modes
- **Parallel Processing**: Toggle for concurrent operations where supported
- **Multimodal Preferences**: Option to prefer models that support video/audio analysis

## Error Handling Strategy

### Layered Error Recovery

```
UI Layer
├─→ User-facing error messages
├─→ Retry logic for transient failures
└─→ Clear error context (what went wrong, how to fix)

Service Layer
├─→ Validation errors (malformed input)
├─→ API errors (network, quota, invalid key)
└─→ Fallback to alternate provider

Provider Layer
├─→ Response validation
├─→ Retry on rate limits
└─→ Detailed error logging
```

### Error Categories

| Category | Example | Recovery |
|----------|---------|----------|
| **Validation** | Invalid URL format | Show error, suggest format |
| **Network** | Connection timeout | Retry or show connection status |
| **Auth** | Invalid API key | Redirect to settings |
| **Quota** | Rate limited | Retry with backoff |
| **Provider** | API unavailable | Fallback to next provider |

## Design Patterns Used

### 1. **Adapter Pattern**
- `BaseProvider` abstract class
- `GeminiProvider` and `GroqProvider` implementations
- Allows swapping providers without changing client code

### 2. **Dependency Injection (Service Container)**
- Centralizes service creation
- Makes testing easier (mock ServiceContainer)
- Decouples components from implementation details

### 3. **Observer Pattern**
- Event handlers for settings changes
- Modal callbacks to parent component
- Obsidian event subscriptions

### 4. **Singleton Pattern**
- `ServiceContainer.getInstance()` - Single instance per plugin
- Ensures consistent service references

### 5. **Factory Pattern**
- ServiceContainer acts as factory for services
- Decouples service instantiation from usage

### 6. **Template Method Pattern**
- `BaseProvider.process()` - Template
- Subclasses implement specific API calls

## Security Considerations

### 1. **API Key Management**
- Keys stored in Obsidian's secure plugin data
- Never logged or exposed in console
- Never included in error messages

### 2. **CORS & Network**
- Uses official YouTube oEmbed (no authentication needed)
- Optional CORS proxy for metadata fetching
- Validates all URLs before API calls

### 3. **Content Validation**
- Sanitizes HTML/Markdown output
- Validates JSON responses from APIs
- Prevents code injection

### 4. **File Operations**
- Validates output paths
- Prevents directory traversal
- Creates backups on conflicts

## Testing Architecture

### Unit Tests
- Service tests (mocked dependencies)
- Provider adapter tests (mocked API responses)
- Utility function tests

### Integration Tests
- Modal → Service interaction
- Settings persistence
- File I/O operations

### E2E Tests
- Full workflow: Input URL → Generate Note
- Provider fallback scenarios
- Error recovery paths

