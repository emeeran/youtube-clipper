# YouTubeClipper for Obsidian

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/youtube-clipper/obsidian-plugin)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple.svg)](https://obsidian.md/)

An AI-powered Obsidian plugin that transforms YouTube videos into structured, actionable notes using advanced multimodal analysis. Extract key insights from both audio and visual content, generating comprehensive summaries or detailed step-by-step guides.

## ✨ Features

- **🎥 Multimodal Analysis**: Analyzes both audio and visual content using Google Gemini 2.5 Pro with `audio_video_tokens=True`
 - **🎥 Multimodal Analysis**: Analyzes both audio and visual content using Google Gemini 2.5 Pro — Gemini 2.0+ models handle multimodal video natively (no special request flags needed)
- **📝 Dual Output Formats**: Choose between Executive Summary (≤250 words) or Comprehensive Tutorial format
- **🔍 Visual Content Recognition**: Extracts insights from slides, diagrams, code examples, and visual demonstrations
- **🎵 Audio Analysis**: Processes spoken content, music, sound effects, and ambient audio
- **📋 Obsidian Properties**: Native YAML frontmatter with searchable metadata
- **🖼️ Embedded Videos**: Automatically embeds YouTube videos in generated notes
- **🚀 Performance Optimized**: Memoization, caching, and debounced validation for smooth operation
- **🛡️ Conflict Prevention**: Designed to work alongside other Obsidian plugins without interference
- **📚 Resource Links**: Automatically generates related resources section

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

### Installation

1. **Manual Installation** (recommended for now):
   - Download the latest release
   - Extract to your vault's `.obsidian/plugins/youtube-clipper/` directory
   - Enable the plugin in Obsidian Settings → Community Plugins

2. **From Obsidian Community Store** (coming soon):
   - Search for "YouTubeClipper"
   - Install and enable

### Initial Setup

1. Open Obsidian Settings → YouTubeClipper
2. Enter your Google Gemini API key
3. Configure default output format (optional)
4. Save settings

## 📖 Usage

### Basic Workflow

1. **Trigger the Plugin**:
   - Use Command Palette: `Ctrl/Cmd + P` → "Process YouTube Video"
   - Or use the ribbon icon (if enabled)

2. **Enter Video Information**:
   - Paste YouTube URL
   - Select output format:
     - **Executive Summary**: Concise overview (≤250 words)
     - **Comprehensive Tutorial**: Detailed step-by-step guide

3. **Processing**:
   - Plugin validates URL and extracts video information
   - Sends multimodal analysis request to Google Gemini
   - Processes both audio and visual content

4. **Note Creation**:
   - Automatically creates a new note with structured content
   - Includes Obsidian properties, embedded video, and insights
   - Option to open the generated note immediately

### Output Formats

#### Executive Summary Format
```yaml
---
title: Video Title
source: https://youtube.com/watch?v=...
created: "2025-09-12"
description: "Single sentence capturing the core insight"
tags: 
  - relevant_tag
  - topic_tag
  - format_tag
status: 
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

#### Comprehensive Tutorial Format
```yaml
---
title: Video Title
source: https://youtube.com/watch?v=...
created: "2025-09-12"
description: "Single sentence capturing the core insight"
tags: 
  - tutorial
  - step_by_step
  - comprehensive
status: 
---

[Embedded YouTube Video]

## Comprehensive Tutorial

### Concise Summary
[Two-part response: concise summary under 150 words capturing core value]

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

## Resources
- [Official Documentation](URL) - Primary reference
- [Tutorial Repository](URL) - Code examples
- [Community Discussion](URL) - Q&A and support
```

## ⚙️ Configuration

### Settings Overview

| Setting | Description | Default |
|---------|-------------|---------|
| **Gemini API Key** | Your Google Gemini API key | Required |
| **Default Output Format** | Executive Summary or Comprehensive Tutorial | Executive Summary |
| **Auto-open Notes** | Automatically open generated notes | true |
| **Cache Duration** | How long to cache API responses (minutes) | 60 |

### Advanced Configuration

The plugin includes several advanced features that can be configured:

- **Conflict Prevention**: Automatic CSS class namespacing
- **Performance Optimization**: Memoization and caching settings
- **Error Handling**: Retry mechanisms and timeout configurations

## 🔧 Technical Details

### Architecture

The plugin follows a modular service-oriented architecture:

```
src/
├── components/          # UI components and modals
│   ├── modals/         # Input and confirmation dialogs
│   └── settings/       # Settings interface
├── services/           # Core business logic
│   ├── ai/            # AI service providers
│   ├── cache/         # Caching implementation
│   ├── file/          # File operations
│   └── youtube/       # YouTube data extraction
├── utils/             # Utility functions
└── interfaces/        # TypeScript type definitions
```

### Performance Optimizations

- **Memoized URL Validation**: Caches validation results for repeated URLs
- **Pre-compiled Templates**: Optimized prompt generation
- **Debounced Input Validation**: Smooth UI interactions
- **Lazy Cache Cleanup**: Efficient memory management

### Multimodal Analysis

The plugin leverages Google Gemini 2.5 Pro's multimodal capabilities:

- **Audio Analysis**: Spoken content, music, sound effects
- **Visual Analysis**: Slides, diagrams, code examples, demonstrations
- **Combined Insights**: Correlates audio and visual information
- **Context Awareness**: Understands relationships between different media types

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

# Start development mode
npm run dev

# Build for production
npm run build
```

### Testing

```bash
# Run TypeScript checks
npm run build

# Lint code
npm run lint

# Test in Obsidian
# Copy main.js, manifest.json, and styles.css to your test vault
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Run code quality checks: `npm run build`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Plugin not appearing in settings**
- Ensure the plugin folder is in `.obsidian/plugins/youtube-clipper/`
- Check that all required files (main.js, manifest.json) are present
- Restart Obsidian

**API key errors**
- Verify your Gemini API key is correct
- Check API quota and billing settings in Google Cloud Console
- Ensure the API key has access to Gemini 2.5 Pro

**Video processing failures**
- Verify the YouTube URL is accessible
- Check your internet connection
- Try with a shorter video first
- Review console logs for detailed error information

**Performance issues**
- Clear the plugin cache in settings
- Restart Obsidian
- Check available memory and CPU resources

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Obsidian](https://obsidian.md/) for the excellent platform
- [Google Gemini](https://deepmind.google/technologies/gemini/) for multimodal AI capabilities
- The Obsidian community for feedback and support

## 📞 Support

- **Documentation**: [User Manual](USER_MANUAL.md)
- **Issues**: [GitHub Issues](https://github.com/youtube-clipper/obsidian-plugin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/youtube-clipper/obsidian-plugin/discussions)
- **Community**: [Obsidian Discord](https://discord.gg/obsidianmd)

---

Made with ❤️ for the Obsidian community
