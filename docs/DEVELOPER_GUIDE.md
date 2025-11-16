# Developer Guide

## Getting Started with Development

### Prerequisites
- **Node.js** 16.x or later
- **npm** or **yarn**
- **TypeScript** knowledge (intermediate)
- **Obsidian** plugin development familiarity

### Environment Setup

```bash
# 1. Clone repository
git clone https://github.com/youtube-clipper/obsidian-plugin.git
cd obsidian-plugin

# 2. Install dependencies
npm install

# 3. Start development server (watch mode)
npm run dev

# 4. Build for production
npm run build

# 5. Version bump (updates manifest.json)
npm run version
```

## Project Structure Explained

```
youtube-clipper/
├── src/                          # TypeScript source code
│   ├── main.ts                  # Plugin entry point
│   ├── components/
│   │   ├── modals/
│   │   │   ├── base-modal.ts           # Base class for all modals
│   │   │   ├── youtube-url-modal.ts    # Main UI for video processing
│   │   │   ├── file-confirm-modal.ts   # File conflict resolution
│   │   │   └── save-confirmation-modal.ts
│   │   └── settings/
│   │       └── settings-tab.ts         # Settings UI
│   ├── services/
│   │   ├── service-container.ts        # Dependency injection container
│   │   ├── prompt-service.ts           # AI prompt generation
│   │   ├── secure-config.ts            # API key management
│   │   ├── ai/
│   │   │   ├── base.ts                 # Abstract provider
│   │   │   ├── ai-service.ts           # Provider fallback manager
│   │   │   ├── gemini.ts               # Google Gemini adapter
│   │   │   └── groq.ts                 # Groq adapter
│   │   ├── cache/
│   │   │   └── memory-cache.ts         # In-memory caching
│   │   ├── file/
│   │   │   └── obsidian-file.ts        # Vault file operations
│   │   └── youtube/
│   │       └── video-data.ts           # YouTube metadata extraction
│   ├── constants/
│   │   ├── api.ts                      # API endpoints & models
│   │   ├── messages.ts                 # User-facing text
│   │   └── styles.ts                   # CSS class names
│   ├── interfaces/
│   │   └── types.ts                    # TypeScript interfaces
│   └── utils/
│       ├── error-handler.ts            # Error management
│       ├── validation.ts               # Input validation
│       ├── conflict-prevention.ts      # CSS namespacing
│       ├── dom.ts                      # DOM utilities
│       └── ...
├── manifest.json                 # Plugin metadata
├── package.json                  # Dependencies & scripts
├── esbuild.config.mjs           # Build configuration
├── tsconfig.json                # TypeScript config
├── README.md                    # User documentation
└── docs/                        # Developer documentation
    ├── ARCHITECTURE.md          # System design
    ├── CONTRIBUTING.md          # Contribution guide
    └── API.md                   # API reference
```

## Development Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes in src/
# The watcher automatically rebuilds main.js

# 3. Test in Obsidian
# - Copy main.js to your vault's plugin directory
# - Reload Obsidian (or restart)
# - Test the feature

# 4. Build for production (runs type-check)
npm run build

# 5. Commit changes
git add -A
git commit -m "feat: add my feature"

# 6. Push and open PR
git push origin feature/my-feature
```

### Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Watch mode (auto-rebuild on changes) |
| `npm run build` | Production build (type-check + bundle) |
| `npm run version` | Bump version in manifest.json |

### Development Tips

1. **Use TypeScript**: Files must end with `.ts`
2. **Follow naming**: `{feature}.ts` for classes, `{feature}-helper.ts` for utilities
3. **Error handling**: Use `ErrorHandler` from utils
4. **Logging**: Prefix with `[YouTubeClipper]` for console visibility
5. **Testing**: Write unit tests for new services

## Adding New Features

### Example: Adding a New Output Format

**Step 1**: Add type to `src/interfaces/types.ts`
```typescript
export type OutputFormat = 'executive-summary' | 'detailed-guide' | 'brief' | 'custom' | 'my-format';
```

**Step 2**: Add prompt template to `src/services/prompt-service.ts`
```typescript
private getMyFormatPrompt(videoData: VideoData): string {
  return `Generate output in my-format style...`;
}

public getPrompt(format: OutputFormat, videoData: VideoData): string {
  switch (format) {
    case 'my-format':
      return this.getMyFormatPrompt(videoData);
    // ... other cases
  }
}
```

**Step 3**: Add radio button to `src/components/modals/youtube-url-modal.ts`
```typescript
private createFormatSelectionSection(): void {
  // ... existing code ...
  
  const myFormatContainer = radioContainer.createDiv();
  // ... create radio button ...
  
  myFormatRadio.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).checked) {
      this.format = 'my-format';
    }
  });
}
```

**Step 4**: Update settings UI in `src/components/settings/settings-tab.ts`
```typescript
private formatDisplayName(format: OutputFormat): string {
  switch (format) {
    case 'my-format':
      return '✨ My Custom Format';
    // ... other cases
  }
}
```

**Step 5**: Add constants to `src/constants/messages.ts` (user-facing text)
```typescript
export const MESSAGES = {
  // ... existing messages ...
  MY_FORMAT: {
    DESCRIPTION: 'My custom format for special use cases',
  }
};
```

### Example: Adding a New AI Provider

**Step 1**: Create new provider class in `src/services/ai/myprovider.ts`
```typescript
import { BaseProvider } from './base';

export class MyProvider extends BaseProvider {
  readonly name = 'myprovider';
  model: string = 'my-model-v1';

  constructor(private apiKey: string) {
    super();
  }

  async process(prompt: string): Promise<string> {
    const response = await fetch('https://api.myprovider.com/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 2048,
      })
    });

    if (!response.ok) {
      throw ErrorHandler.handleAPIError(response, this.name, 'Failed to generate text');
    }

    const data = await response.json();
    return data.result.text;
  }
}
```

**Step 2**: Register in `src/services/service-container.ts`
```typescript
private createAIService(): AIService {
  const providers: AIProvider[] = [];

  if (this.settings.geminiApiKey) {
    providers.push(new GeminiProvider(this.settings.geminiApiKey));
  }

  if (this.settings.myProviderApiKey) {
    providers.push(new MyProvider(this.settings.myProviderApiKey));
  }

  if (this.settings.groqApiKey) {
    providers.push(new GroqProvider(this.settings.groqApiKey));
  }

  return new AIService(providers);
}
```

**Step 3**: Add settings input in `src/components/settings/settings-tab.ts`
```typescript
new Setting(containerEl)
  .setName('MyProvider API Key')
  .setDesc('Get your key from https://myprovider.com/settings/keys')
  .addText(text => text
    .setPlaceholder('Enter API key')
    .setValue(this.settings.myProviderApiKey || '')
    .onChange(async (value) => {
      this.settings.myProviderApiKey = value;
      await this.validateAndSaveSettings();
    })
  );
```

## Testing

### Writing Unit Tests

Test services in isolation:

```typescript
// tests/services/ai-service.test.ts
describe('AIService', () => {
  let service: AIService;
  let mockProvider: jest.Mocked<AIProvider>;

  beforeEach(() => {
    mockProvider = {
      name: 'mock',
      model: 'test-v1',
      process: jest.fn().mockResolvedValue('AI response'),
    };
    service = new AIService([mockProvider]);
  });

  it('should call provider and return response', async () => {
    const result = await service.process('test prompt');
    expect(result).toBe('AI response');
    expect(mockProvider.process).toHaveBeenCalledWith('test prompt');
  });

  it('should fallback to next provider on failure', async () => {
    const mockProvider2 = { ...mockProvider };
    mockProvider.process.mockRejectedValue(new Error('Failed'));
    mockProvider2.process.mockResolvedValue('Fallback response');

    service = new AIService([mockProvider, mockProvider2]);
    const result = await service.process('test prompt');

    expect(result).toBe('Fallback response');
  });
});
```

### Testing in Obsidian

1. **Copy built files** to test vault:
   ```bash
   cp main.js .obsidian/plugins/youtube-clipper/
   cp manifest.json .obsidian/plugins/youtube-clipper/
   ```

2. **Reload plugin**: Settings → Community Plugins → Reload

3. **Test in console**: `Ctrl+Shift+I` (DevTools), check Console for logs

## Common Patterns

### Error Handling Pattern

```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  const context = {
    operation: 'riskyOperation',
    additionalContext: 'useful info'
  };
  
  ErrorHandler.handleError(
    error,
    'Operation failed - try again',
    context
  );
  
  throw error; // Re-throw if caller needs to handle
}
```

### Service Initialization Pattern

```typescript
export class MyService {
  private cache: MemoryCache;
  
  constructor(
    private settings: YouTubePluginSettings,
    private app: App
  ) {
    this.cache = new MemoryCache();
  }

  // Make static for easy instantiation in ServiceContainer
  static create(
    settings: YouTubePluginSettings,
    app: App
  ): MyService {
    return new MyService(settings, app);
  }

  async doSomething(): Promise<string> {
    const cached = this.cache.get('key');
    if (cached) return cached;

    const result = await this.computeExpensive();
    this.cache.set('key', result, 3600); // 1 hour TTL
    return result;
  }
}
```

### Modal Callback Pattern

```typescript
// In parent component
new YouTubeUrlModal(this.app, {
  onProcess: async (url, format, provider, model, customPrompt) => {
    // Handle the processing
    const result = await this.serviceContainer
      .getProcessingService()
      .process(url, format, provider, model, customPrompt);
    
    return result.filePath;
  },
  onOpenFile: async (filePath) => {
    // Handle file opening
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }
}).open();
```

## Code Style Guidelines

### TypeScript Style

```typescript
// ✓ Good: Clear names, type annotations
interface VideoAnalysisRequest {
  videoId: string;
  format: OutputFormat;
  customPrompt?: string;
}

async function analyzeVideo(request: VideoAnalysisRequest): Promise<string> {
  if (!request.videoId) {
    throw new Error('videoId is required');
  }
  // ...
}

// ✗ Bad: Unclear names, missing types
async function process(req: any): Promise<any> {
  // ...
}
```

### Naming Conventions

- **Classes**: PascalCase (`YouTubeUrlModal`)
- **Interfaces**: PascalCase, prefix with `I` if abstract (`IProvider`)
- **Variables/Constants**: camelCase for variables, UPPER_SNAKE_CASE for constants
- **Methods**: camelCase (`processVideo`)
- **Files**: kebab-case (`youtube-url-modal.ts`)

### Comments

```typescript
/**
 * Process a YouTube video and generate structured notes
 * 
 * @param url - YouTube URL to process
 * @param format - Output format (executive-summary, detailed-guide, etc.)
 * @returns Path to created note file
 * @throws Error if URL is invalid or processing fails
 */
async function processYouTubeVideo(
  url: string,
  format: OutputFormat
): Promise<string> {
  // ...
}
```

## Debugging Tips

### Enable Debug Logging

1. Open DevTools: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
2. Go to Console tab
3. Look for messages prefixed with `[YouTubeClipper]`

### Add Debug Logs

```typescript
// In any service/component
console.log('[YouTubeClipper] Processing video:', url);
console.error('[YouTubeClipper] Error:', error);
```

### Use Debugger Breakpoints

1. Open DevTools Sources tab
2. Find your source file (main.js is bundled, so use debugger statements)
3. Add breakpoint or `debugger;` statement
4. Reload plugin and trigger code path

### Check Obsidian Console

```javascript
// In Obsidian console (DevTools):
window.app.plugins.plugins['youtube-clipper']
  .app.vault.getFiles().length // See all files
```

## Performance Optimization

### Adding Caching

```typescript
private cache = new MemoryCache();

async fetchExpensiveData(key: string): Promise<Data> {
  // Check cache first (TTL: 3600 seconds = 1 hour)
  const cached = this.cache.get<Data>(key);
  if (cached) {
    console.log('[YouTubeClipper] Cache hit:', key);
    return cached;
  }

  // Fetch and cache
  const data = await this.expensiveOperation();
  this.cache.set(key, data, 3600);
  return data;
}
```

### Debouncing

```typescript
import { debounce } from 'lodash'; // or implement simple version

private debouncedValidation = debounce((url: string) => {
  this.validateUrl(url);
}, 500); // Wait 500ms after user stops typing

onUrlInputChange(url: string): void {
  this.debouncedValidation(url);
}
```

### Async Operations

```typescript
// ✓ Good: Handles multiple async operations efficiently
async function processBatch(urls: string[]): Promise<string[]> {
  const results = await Promise.all(
    urls.map(url => processYouTubeVideo(url, 'brief'))
  );
  return results;
}

// ✗ Bad: Sequential processing (slow)
async function processBatchSlow(urls: string[]): Promise<string[]> {
  const results = [];
  for (const url of urls) {
    results.push(await processYouTubeVideo(url, 'brief'));
  }
  return results;
}
```

## Release Process

### Preparing a Release

```bash
# 1. Update version
npm run version
# This updates manifest.json, versions.json, and creates git commit

# 2. Review changes
git show

# 3. Push to main
git push origin main

# 4. Create GitHub release
# - Go to https://github.com/youtube-clipper/obsidian-plugin/releases
# - Click "Draft a new release"
# - Tag: v1.x.x (matching manifest.json version)
# - Title: Version 1.x.x - Brief description
# - Describe changes in release notes
# - Upload main.js and manifest.json
# - Publish
```

## Troubleshooting Development

| Issue | Solution |
|-------|----------|
| **Build fails with "Cannot find module"** | Run `npm install` |
| **Changes not appearing** | Check that dev watcher is running (`npm run dev`) |
| **Plugin not visible in Obsidian** | Copy main.js and manifest.json to `.obsidian/plugins/youtube-clipper/` |
| **"Not authenticated" error** | Check API key in settings, verify key is valid |
| **TypeScript errors** | Run `npm run build` to see full errors |
| **Import errors** | Check file paths are correct, verify tsconfig.json includes src/ |

## Contributing Guidelines

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to submit PRs
- Code review process
- Testing requirements
- Documentation standards

