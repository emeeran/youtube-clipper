# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YoutubeClipper is an AI-powered Obsidian plugin that transforms YouTube videos into structured notes using multimodal analysis (audio + visual). It uses Google Gemini 2.0+ for video analysis and Groq as a fallback provider.

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (watch + incremental rebuild)
npm run dev

# Production build (type-check + bundle)
npm run build

# Version bump (updates manifest.json and versions.json)
npm run version
```

## Architecture

### Service-Oriented Architecture with Dependency Injection

```
src/
├── main.ts                    # Plugin entry point, extends Obsidian.Plugin
├── ServiceContainer.ts        # DI container - orchestrates all services
├── components/               # UI layer
│   ├── modals/              # Input, confirmation dialogs
│   └── settings/            # Settings tab interface
├── services/                # Core business logic
│   ├── ai/                 # AI providers (Gemini, Groq)
│   │   ├── base.ts         # Abstract base provider
│   │   ├── gemini.ts       # Google Gemini multimodal
│   │   ├── groq.ts         # Groq text-only provider
│   │   └── ai-service.ts   # Fallback manager
│   ├── cache/              # In-memory caching
│   ├── file/               # Obsidian vault operations
│   ├── youtube/            # YouTube metadata extraction
│   └── prompt-service.ts   # AI prompt generation
├── interfaces/             # TypeScript type definitions
├── constants/              # Messages, API endpoints, models
└── utils/                  # Error handling, validation, DOM
```

### Key Patterns

- **ServiceContainer**: Central DI container that creates and manages service instances
- **AI Provider Fallback**: `AIService` tries providers in sequence until one succeeds
- **Configuration-Driven**: API keys and settings stored in plugin settings
- **Memoization**: URL validation and model lists cached for performance

## Development Rules

### NEVER edit `main.js` directly
- Always modify TypeScript files under `src/`
- Rebuild with `npm run dev` (iterative) or `npm run build` (production)

### Use Existing Constants and Utilities
- **Messages**: All user-facing text in `src/constants/messages.ts`
- **Error Handling**: Use `ErrorHandler` from `src/utils/error-handler.ts`
- **API Endpoints**: Defined in `src/constants/api.ts`
- **Service Access**: Go through `ServiceContainer` instance

### AI Provider Contract
When adding new AI providers:
1. Extend `BaseAIProvider` from `src/services/ai/base.ts`
2. Implement `process(prompt: string): Promise<string>`
3. Expose `name` and `model` properties
4. Follow response parsing pattern: check `response.ok`, use `ErrorHandler.handleAPIError`

### Settings Management
- Settings stored via Obsidian's plugin settings system
- Update through `ServiceContainer.updateSettings(newSettings)`
- This resets dependent services (notably AI providers)

## Integration Points

### External APIs
- **Google Gemini**: Multimodal video analysis using `useAudioVideoTokens`
- **Groq**: High-speed text-only inference
- **YouTube oEmbed**: Video metadata extraction
- **CORS Proxy**: Optional proxy for YouTube API access

### Response Formats
- **Gemini**: `candidates[0].content.parts[0].text`
- **Groq**: `choices[0].message`

## File Naming and Structure

- Components use kebab-case: `youtube-url-modal.ts`
- Services use kebab-case: `prompt-service.ts`
- Types in `interfaces/types.ts`
- Constants separated by domain: `messages.ts`, `api.ts`, `styles.ts`

## Testing in Obsidian

To test changes:
1. Run `npm run build` to generate `main.js`
2. Copy `main.js` and `manifest.json` to your vault's `.obsidian/plugins/youtube-clipper/`
3. Reload Obsidian or restart the app
4. Enable plugin and test functionality

## Build System

- **esbuild.config.mjs**: Bundles TypeScript to single `main.js`
- **Development**: Inline sourcemaps, watch mode
- **Production**: External sourcemaps, minified output
- **TypeScript**: Strict null checks, targets ES2020

## Plugin Lifecycle

1. **onload()**: Register commands, ribbon icon, settings tab
2. **settingsLoaded**: Initialize ServiceContainer with plugin settings
3. **processVideo()**: Main workflow - validate URL → extract metadata → AI processing → create note

## Output Formats

Three supported formats with YAML frontmatter:
- **Executive Summary**: ≤250 words with key insights and action items
- **Detailed Guide**: Step-by-step walkthrough format
- **Brief**: Quick notes with key points

All formats include embedded YouTube video and structured metadata.