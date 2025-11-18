# YouTubeClipper - AI-Powered YouTube Video Processor

**Automatically extract key insights and generate structured, actionable notes from YouTube videos**

![Version](https://img.shields.io/badge/version-1.3.5-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Obsidian](https://img.shields.io/badge/obsidian-%3E%3D0.15.0-orange)

YouTubeClipper is an Obsidian plugin that uses AI to process YouTube videos and generate structured notes with key insights, actionable items, and comprehensive summaries.

## 🚀 Features

### Key Capabilities
- **AI-Powered Analysis**: Extract insights using Google Gemini or Groq AI models
- **Multiple Output Formats**:
  - Executive Summary (≤250 words)
  - Detailed Guide (Step-by-step)
  - Brief (Bullet points)
  - Custom (User-defined format)
- **Smart File Management**: Date-stamped folders and conflict prevention
- **Performance Optimization**: Configurable processing modes
- **Chrome Extension Integration**: Direct processing from YouTube

### Processing Options
- **Multimodal Processing**: Use video audio/video tokens for deeper analysis (when supported)
- **Parallel Processing**: Enable faster processing when available
- **Provider Fallback**: Automatic fallback between AI providers
- **Custom Prompts**: Session-specific prompt customization

## ⚙️ Installation

1. **Install via Obsidian**:
   - Open Obsidian Settings → Community Plugins
   - Search for "YouTubeClipper"
   - Click "Install"

2. **Install via BRAT** (for beta versions):
   - Install "BRAT" plugin
   - Add `youtube-clipper/obsidian-plugin` to BRAT settings
   - Enable the installed plugin

3. **Manual Installation**:
   - Download `main.js` and `manifest.json` from releases
   - Place in your vault's `.obsidian/plugins/youtube-clipper/` folder

## 🔐 Configuration

### 1. API Keys
**Required**: At least one AI provider API key
- **Google Gemini**: Get from [Google AI Studio](https://aistudio.google.com/)
- **Groq**: Get from [Groq Cloud](https://console.groq.com/)

### 2. Settings
- **Output Path**: Where to save generated notes (e.g., `YouTube/Processed Videos`)
- **Performance Mode**: Choose between speed and quality
- **Processing Options**: Enable parallel processing and prefer multimodal analysis

## 📋 Usage

### Quick Start
1. **Open the Modal**:
   - Ribbon icon (film icon)
   - Command palette: "Process YouTube Video"
   - Chrome extension button

2. **Enter YouTube URL**:
   - Full YouTube URL (e.g., `https://www.youtube.com/watch?v=...`)
   - Shortened URL (e.g., `https://youtu.be/...`)

3. **Select Options**:
   - **Format**: Executive Summary, Detailed Guide, Brief, or Custom
   - **AI Provider**: Auto-select or specific provider
   - **Model**: Specific model if desired
   - **Performance**: Adjust based on your needs

4. **Process**: Click "Process" to generate notes

### Chrome Extension
Install the YouTube Clipper Chrome extension to:
- Process videos directly from YouTube
- Right-click context menu option
- One-click processing with Obsidian URI protocol

### Advanced Usage
- **Custom Prompts**: Use session-specific custom prompts for specialized analysis
- **Performance Modes**: Balance between processing speed and AI model capabilities
- **Parallel Processing**: Enable when processing multiple videos

## 🎨 Output Format

Generated notes include:
- **YAML Frontmatter** with video metadata
- **Structured content** based on selected format
- **Timestamps** when available
- **Actionable insights** and key takeaways
- **Video reference** for context

### Sample Frontmatter
```yaml
title: "Video Title"
source-url: "https://youtube.com/watch?v=..."
source-type: "YouTube Video"
created-date: "2024-01-01"
ai-model: "gemini-2.0-pro"
ai-provider: "Gemini"
video-duration: "15:42"
channel: "Channel Name"
```

## ⚡ Performance Options

- **Performance Mode**: Choose between 'fast', 'balanced', or 'quality'
- **Parallel Processing**: Enable for faster batch processing
- **Prefer Multimodal**: Use video-aware models when available

## 🔧 Troubleshooting

### Common Issues
1. **"Invalid API Key"**: Verify API key format and ensure correct provider is configured
2. **"Video Not Found"**: Check YouTube URL format and ensure video is public
3. **Processing Timeout**: Try with different AI provider or model

### Chrome Extension Issues
- Ensure URI protocol handler is working (check Obsidian settings)
- Extension should appear in Chrome extensions list

## 🤝 Contributing

Contributions are welcome! Check out:
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) - Contribution guidelines
- [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) - Development setup
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for better video content processing in Obsidian
- Thanks to the Obsidian community for feedback and support
- AI providers (Google Gemini, Groq) for enabling this functionality

---

**Ready to get started?** Install the plugin and process your first YouTube video today! 🚀

For detailed documentation, visit the [documentation index](docs/INDEX.md).