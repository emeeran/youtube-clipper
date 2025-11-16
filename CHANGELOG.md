# Changelog

All notable changes to the YouTubeClipper plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-11-16

### Added
- **Accessibility Features (WCAG 2.1 AA compliant)**
  - Full keyboard navigation support (Enter to confirm, Esc to close)
  - ARIA labels and descriptions on all modal elements and buttons
  - Screen reader support with proper semantic HTML roles
  - Custom styled ConfirmationModal replacing native browser confirm() dialogs
  - Focus management and focus trap for modal interactions
  - Visual focus indicators for keyboard navigation

- **Custom Styled Confirmation Modal**
  - Replaced native confirm() with accessible ConfirmationModal component
  - Enhanced visual hierarchy with styled buttons
  - Keyboard shortcuts (Enter/Esc) with full accessibility support
  - Better error message presentation with alert roles

- **Model Updates**
  - Curated latest production-ready models for Gemini and Groq
  - Gemini 2.5-series (Pro, Flash, Flash-Lite) all marked with multimodal support
  - Gemini 2.0-series included with documented video support
  - Added Groq Llama 4 Scout/Maverick preview models for high-speed text processing
  - Simplified model list for clarity and stability

### Changed
- **Documentation Improvements**
  - Clarified Gemini multimodal behavior (native video support, no special flags needed)
  - Updated README with Groq information and provider selection details
  - Removed outdated `audio_video_tokens=True` parameter references
  - Enhanced troubleshooting section with provider-specific guidance
  - Added accessibility features to feature list

- **Code Quality**
  - Enhanced system instruction for comprehensive multimodal analysis
  - Improved error handling and user-facing messages
  - Better context preservation in multimodal analysis requests
  - Added optional GCS FileData support for advanced video processing

### Fixed
- Removed non-existent `useAudioVideoTokens` API flag that caused 400 errors
- Corrected multimodal capabilities metadata for accurate model selection
- Improved in-modal suggestion flow for switching to multimodal models
- Fixed issue where non-multimodal models were selected without user awareness

## [1.2.0] - 2025-11-01

### Added
- **Provider & Model Selection UI**
  - Runtime provider selection (Gemini vs Groq) in modal
  - Dynamic model selection per provider
  - "Auto" mode for automatic provider fallback
  - Model refresh button with best-effort scraping of latest models
  - Spinner UI during model refresh for better UX feedback

- **Model Metadata & Persistence**
  - Explicit `supportsAudioVideo` metadata per model
  - Persistence of fetched model lists to plugin settings cache
  - Automatic use of cached models on subsequent plugin opens
  - Camera emoji (🎥) badges for multimodal-capable models in dropdown

- **In-Modal Suggestion Flow**
  - Automatic suggestion when non-multimodal Gemini model + YouTube URL detected
  - User confirmation to switch to recommended multimodal model
  - Improved user awareness of model capabilities

- **Brief Output Format**
  - New ultra-concise output format for quick takeaways
  - Template with Key Takeaways and Quick Links sections
  - Reduces cognitive load for fast reference notes

- **UI/UX Enhancements**
  - Spinner element on refresh button with CSS animation
  - Progress steps with clear visual indicators
  - Improved quick action buttons (Paste URL, Clear)
  - Better debounced URL validation (300ms) for smooth interactions

### Changed
- Enhanced prompt templates with provider/model placeholder injection
- Improved error messages with better context and guidance
- Refactored AIService for runtime provider selection via `processWith()`

### Fixed
- Better Gemini provider detection logic
- Improved path normalization for file saving
- Cache invalidation when settings change

## [1.1.0] - 2025-10-15

### Added
- **File Conflict Resolution**
  - Persistent FileConflictModal for handling duplicate note names
  - Options: Overwrite existing note or save numbered copy
  - Better user control over file operations

- **Daily Dated Folders**
  - Automatic creation of `./📥 Inbox/Clippings/YouTube/YYYY-MM-DD/` structure
  - Organized note storage by date
  - Improved note discoverability and organization

- **Comprehensive Output Formats**
  - Executive Summary format (≤250 words, key insights + action items)
  - Comprehensive Tutorial format (detailed step-by-step guide)
  - YAML frontmatter with metadata (title, source, tags, status)
  - Embedded YouTube video in generated notes

- **Performance Optimizations**
  - Memoized URL validation for repeated URLs
  - In-memory caching with TTL for API responses
  - Debounced input validation for smooth UI
  - Pre-compiled prompt templates

### Changed
- Improved file saving logic with better error handling
- Enhanced conflict prevention with CSS namespacing
- Refactored service container for better DI management

### Fixed
- Resolved race conditions in file operations
- Fixed CSS class conflicts with other plugins
- Improved error recovery in API calls

## [1.0.0] - 2025-09-12

### Added
- Initial release of YouTubeClipper for Obsidian
- AI-powered YouTube video analysis using Google Gemini API
- Extract key insights and generate structured notes
- Multimodal analysis of audio and visual content
- Obsidian native YAML properties integration
- Settings UI for API key configuration
- Modal interface for YouTube URL input and processing
- Automatic metadata extraction from YouTube videos
- Generate executive summaries or detailed guides
- Embedded video display in generated notes
- Resource links extraction from analyzed content
- Error handling and user notifications
- Performance optimization with caching and memoization

### Features
- ✨ Multimodal Analysis: Analyzes both audio and visual content
- 📝 Multiple Output Formats: Executive Summary or Comprehensive Tutorial
- 🔍 Visual Content Recognition: Extracts insights from slides and diagrams
- 🎵 Audio Analysis: Processes spoken content and audio tracks
- 📋 Obsidian Properties: Native YAML frontmatter support
- 🖼️ Embedded Videos: Automatically embeds YouTube videos in notes
- 🚀 Performance Optimized: Memoization and caching
- 🛡️ Conflict Prevention: CSS namespacing for plugin compatibility

---

## Release Process

When preparing a new release:

1. Update version in `package.json` and `manifest.json`
2. Update `versions.json` with the new version and minAppVersion
3. Add release notes to this CHANGELOG.md
4. Commit changes: `git commit -m "chore(release): prepare v1.X.X"`
5. Create git tag: `git tag -a v1.X.X -m "Release version 1.X.X"`
6. Push changes and tags: `git push origin main && git push origin --tags`
7. Create GitHub Release with CHANGELOG entries

---

**Last Updated**: 2025-11-16
**Maintained By**: YouTubeClipper Team
