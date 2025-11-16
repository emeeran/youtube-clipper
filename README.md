# YoutubeClipper for Obsidian

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/youtube-clipper/obsidian-plugin)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)](https://obsidian.md/)

An AI-powered Obsidian plugin that transforms YouTube videos into structured, actionable notes using advanced multimodal analysis. Extract key insights from both audio and visual content, generating comprehensive summaries or detailed step-by-step guides.

## ✨ Features

- **🎥 Multimodal Analysis**: Analyzes both audio and visual content using Google Gemini 2.0+ — native multimodal video support (no special request flags)
- **📝 Three Output Formats**: 
  - Executive Summary (≤250 words)
  - Detailed Guide (step-by-step)
  - Brief Format (quick notes)
- **🔍 Visual Content Recognition**: Extracts insights from slides, diagrams, code examples, and visual demonstrations
- **🎵 Audio Analysis**: Processes spoken content, music, sound effects, and ambient audio
- **📋 Obsidian Properties**: Native YAML frontmatter with searchable metadata
- **🖼️ Embedded Videos**: Automatically embeds YouTube videos in generated notes
- **🚀 Performance Optimized**: Memoization, caching, and debounced validation for smooth operation
- **🛡️ Conflict Prevention**: Designed to work alongside other Obsidian plugins without interference
- **📚 Resource Links**: Automatically generates related resources section
- **♿ Accessibility First**: Full keyboard navigation, ARIA labels, and screen reader support

## 🎯 Use Cases

- **📚 Educational Content**: Convert tutorials and lectures into structured study notes
- **💼 Professional Development**: Extract actionable insights from training videos
- **🔬 Research**: Document methodology and findings from research presentations
- **🎨 Creative Learning**: Capture design techniques and artistic processes
- **💻 Technical Learning**: Transform coding tutorials into step-by-step guides

## 🚀 Quick Start

### Prerequisites

- Obsidian 0.15.0 or later
- Google Gemini API key (get one at [Google AI Studio](https://makersuite.google.com/app/apikey))
- For multimodal video analysis: Google Gemini 2.0 Pro or Gemini 2.5 Pro

### Installation

#### Option 1: Manual Installation (Recommended for Testing)

1. Download the latest release from [GitHub Releases](https://github.com/youtube-clipper/obsidian-plugin/releases)
2. Extract the files (`main.js`, `manifest.json`, `styles.css`) to your vault:
   ```
   your-vault/.obsidian/plugins/youtube-clipper/
   ```
3. Reload Obsidian (or restart the app)
4. Go to Settings → Community Plugins → Installed Plugins
5. Enable "YouTubeClipper"

#### Option 2: From Obsidian Community Store (Coming Soon)

Once published:
1. Open Obsidian Settings → Community Plugins
2. Search for "YouTubeClipper"
3. Click Install
4. Enable the plugin

### Initial Setup

1. Open **Obsidian Settings** → **YouTubeClipper**
2. Enter your **Google Gemini API key**
3. (Optional) Configure default output format
4. (Optional) Enable auto-open for generated notes
5. Save settings

## 📖 Usage

### Basic Workflow

1. **Trigger the Plugin**:
   - Command Palette: `Ctrl/Cmd + P` → "Process YouTube Video"
   - Or use the ribbon icon (if visible in left sidebar)

2. **Enter Video URL**:
   - Paste a YouTube URL (supports `youtube.com` and `youtu.be`)
   - Plugin validates URL and displays video metadata (thumbnail, title)
   - Use Quick Actions: **Paste** (from clipboard) or **Clear**

3. **Select Output Format**:
   - **Executive Summary**: Concise overview (≤250 words) with key insights and action items
   - **Detailed Guide**: Step-by-step walkthrough for tutorials and how-to content
   - **Brief**: Quick notes with key points only

4. **Select Provider & Model** (Optional):
   - Default: Auto (fallback) — uses configured Gemini key
   - Advanced: Choose specific provider (Gemini / Groq) and model
   - **Tip**: Gemini 2.0+ models support multimodal video; Groq is text-only (fast)

5. **Processing**:
   - Plugin validates URL and extracts video metadata
   - Sends multimodal analysis request to AI provider
   - Shows progress steps in real-time
   - Estimated time: 15–60 seconds depending on video length

6. **Note Creation**:
   - Automatically creates dated folder in `📥 Inbox/Clippings/YouTube/`
   - Saves note with generated content (YAML frontmatter + structured sections)
   - Option to automatically open the generated note

### Output Formats

#### Executive Summary Format

```yaml
---
title: Video Title
source: https://youtube.com/watch?v=...
created: "2025-11-16"
description: "Single sentence capturing the core insight"
tags: 
  - video
  - summary
status: "processed"
---

[Embedded YouTube Video]

## Key Insights
- Critical insight 1 with specific details
- Critical insight 2 with actionable information
- Critical insight 3 with practical application

## Action Items
- [ ] Immediate action based on video content
- [ ] Follow-up research or implementation
- [ ] Key concept to remember or apply

## Resources
- [Related Resource 1](URL) - Brief description
- [Related Resource 2](URL) - Brief description
```

#### Detailed Guide Format

```yaml
---
title: Video Title
source: https://youtube.com/watch?v=...
created: "2025-11-16"
description: "Single sentence capturing the core insight"
tags: 
  - tutorial
  - step_by_step
status: "processed"
---

[Embedded YouTube Video]

## Overview
[Concise 1–2 sentence summary of the video's core value]

## Step-by-Step Implementation Guide

### Step 1: [Action Title]
- Detailed instruction 1
- Detailed instruction 2
- Key considerations or tips

### Step 2: [Action Title]
- Detailed instruction 1
- Detailed instruction 2
- Troubleshooting notes

[Additional sections as needed]

## Common Pitfalls
- Pitfall 1: How to avoid it
- Pitfall 2: Best practice to prevent it

## Resources
- [Official Documentation](URL) - Primary reference
- [Tutorial Repository](URL) - Code examples
- [Community Discussion](URL) - Q&A and support
```

#### Brief Format

```yaml
---
title: Video Title
source: https://youtube.com/watch?v=...
created: "2025-11-16"
tags: 
  - brief
status: "processed"
---

[Embedded YouTube Video]

## Key Points
- Point 1
- Point 2
- Point 3

## Takeaways
- Takeaway 1
- Takeaway 2
```

## ⚙️ Configuration

### Settings Overview

| Setting | Description | Default |
|---------|-------------|---------|
| **Gemini API Key** | Your Google Gemini API key | (required) |
| **Default Output Format** | Executive Summary, Detailed Guide, or Brief | Executive Summary |
| **Auto-Open Notes** | Automatically open generated notes | ✓ Enabled |
| **Model Refresh** | Fetch latest available models from providers | Button in settings |

### Advanced Configuration

The plugin supports several runtime behaviors:

- **Conflict Prevention**: Automatic CSS class namespacing to prevent style conflicts
- **Caching**: URL validation and model lists cached in-memory for performance
- **Error Recovery**: Automatic retry on transient network failures
- **Provider Fallback**: If primary provider fails, automatically attempts secondary provider

## 🛠️ Development

### Prerequisites

- Node.js 16.x or later
- npm or yarn
- TypeScript 4.7+

### Setup

```bash
# Clone the repository
git clone https://github.com/youtube-clipper/obsidian-plugin
cd obsidian-plugin

# Install dependencies
npm install

# Start development mode (watch + rebuild)
npm run dev

# Build for production
npm run build
```

### Project Structure

```
src/
├── components/          # UI components and modals
│   ├── modals/         # Input, confirmation, and file conflict dialogs
│   └── settings/       # Settings tab interface
├── services/           # Core business logic
│   ├── ai/            # AI service providers (Gemini, Groq)
│   ├── cache/         # In-memory caching
│   ├── file/          # Obsidian vault file operations
│   ├── youtube/       # YouTube video metadata extraction
│   └── prompt-service.ts # AI prompt generation & templating
├── constants/         # API endpoints, models, messages
├── interfaces/        # TypeScript type definitions
└── utils/             # Utilities (error handling, validation, DOM)
```

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test in Obsidian
4. Run: `npm run build` (type-check + bundle)
5. Commit: `git commit -m "feat: describe your feature"`
6. Push and open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 🐛 Troubleshooting

### Common Issues

**Plugin not appearing after installation**
- Check that files are in: `.obsidian/plugins/youtube-clipper/`
- Verify you have `main.js`, `manifest.json`, and `styles.css`
- Restart Obsidian completely

**"API Key Invalid" error**
- Verify your Gemini API key is correct in settings
- Check your Google Cloud Console quota and billing
- Ensure the API key has access to the Gemini API

**Video processing fails with error**
- Verify the YouTube URL is publicly accessible
- Try a different, shorter video (< 5 minutes) first
- Check your internet connection
- Review Obsidian console logs for detailed error info (DevTools → Console)

**"Model not available" or 400 errors**
- Click "Refresh Models" in the plugin settings to fetch latest available models
- Ensure you've selected a model your API key supports
- Try "Auto" (fallback) to use your default configured API key

**Performance issues or slow processing**
- Clear the plugin cache (Settings → YouTubeClipper → Clear Cache)
- Restart Obsidian
- Verify your system has sufficient memory and disk space
- Try with a shorter video

### Debug Mode

To enable detailed logging:

1. Open Obsidian DevTools: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
2. Go to **Console** tab
3. Look for messages prefixed with `[YouTubeClipper]`

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Obsidian](https://obsidian.md/) for the excellent plugin platform
- [Google Gemini](https://deepmind.google/technologies/gemini/) for multimodal AI capabilities
- [Groq](https://groq.com/) for high-speed LLM inference
- The Obsidian community for feedback, feature requests, and support

## 📞 Support & Community

- **GitHub Issues**: [Report bugs](https://github.com/youtube-clipper/obsidian-plugin/issues)
- **GitHub Discussions**: [Ask questions & share ideas](https://github.com/youtube-clipper/obsidian-plugin/discussions)
- **Obsidian Discord**: [Community chat](https://discord.gg/obsidianmd)
- **Documentation**: Full user manual in `local/README.md`

---

Made with ❤️ for the Obsidian community
