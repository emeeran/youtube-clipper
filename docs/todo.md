---

# **Spec-Driven Workflow: Obsidian YouTube Clipper Plugin**

## **1. Idea → Problem Statement**

Users want to capture structured, high-value insights from YouTube videos directly into Obsidian. Manual note-taking is time-consuming, inconsistent, and often misses key details.

---

## **2. Objectives**

* Automate note creation from YouTube videos.
* Provide two output modes: **Executive Summary** (short, ≤250 words) or **Detailed Guide** (step-by-step tutorial).
* Ensure multimodal analysis (audio + visuals).
* Seamlessly integrate with Obsidian's note system.

---

## **3. User Stories**

* **As a user**, I want to input a YouTube URL and select whether I need an **executive summary** or a **detailed guide**, so I can capture content in my preferred format.
* **As a user**, I want the plugin to analyze both audio and video so that non-verbal cues (slides, diagrams, visuals) are included.
* **As a user**, I want the notes to be clear, concise, and immediately accessible.
* **As a user**, I want the option to open the generated note directly after creation.
* **As a user**, I want errors (invalid URLs, API failures) to be reported gracefully.

---

## **4. Workflow**

### **Step 1: Input**

* User triggers the plugin.
* URL dialog box opens with fields:

  * **YouTube URL** (required)
  * **Output Format**:

    * Executive Summary (≤250 words)
    * Detailed Step-by-Step Guide

### **Step 2: Processing**

* Validate URL.
* Send request to Google Gemini API with `use_audio_video_tokens=True`.
* Parse and extract insights from both audio and visual tracks.

### **Step 3: Content Transformation**

* If **Executive Summary** selected → compress into cohesive ≤250-word summary.
* If **Detailed Guide** selected → synthesize into structured, step-by-step tutorial.

### **Step 4: Note Creation**

* Save the processed content into a **new note** in Obsidian.
* Auto-title note using the video title or extracted core theme.

### **Step 5: User Options**

* Prompt: *"Note created successfully. Open now?"*
* Options: **Open Note** | **Dismiss**

---

## **5. Acceptance Criteria**

* ✅ **COMPLETED** - Input dialog includes URL + format selection.
* ✅ **COMPLETED** - Summary mode outputs ≤250 words.
* ✅ **COMPLETED** - Guide mode outputs step-by-step tutorial with headings.
* ✅ **COMPLETED** - Note is saved under Obsidian's vault with correct metadata.
* ✅ **COMPLETED** - User can open the note immediately.
* ✅ **COMPLETED** - Errors are clearly surfaced (invalid link, API failure, empty response).

---

## **6. Edge Cases**

* ✅ **IMPLEMENTED** - Invalid YouTube URL → error prompt with retry option.
* ✅ **IMPLEMENTED** - API returns incomplete response → fallback message in note.
* ✅ **IMPLEMENTED** - Long video (>3 hrs) → provide truncated analysis or notify user.
* ✅ **IMPLEMENTED** - Network timeout → graceful retry mechanism.

---

## **7. Versioning Stages**

* ✅ **COMPLETED** - **v1.0 (MVP)**: Input URL, executive summary only.
* ✅ **COMPLETED** - **v1.1**: Add **Detailed Guide** mode.
* ✅ **COMPLETED** - **v1.2**: Add error handling + user options (open note).
* 🔄 **IN PROGRESS** - **v2.0**: Multi-language support, bulk URL processing.

---

## **8. Implementation Status** 

### ✅ **FULLY IMPLEMENTED FEATURES:**

1. **YouTube URL Input Modal** (`src/components/modals/youtube-url-modal.ts`)
   - URL input field with validation
   - Output format selection (Executive Summary / Detailed Guide)
   - Real-time URL validation
   - Error handling and user feedback

2. **Multimodal AI Analysis** (`src/services/ai/gemini.ts`)
   - Google Gemini 2.5 Pro integration
   - Enhanced multimodal analysis with `useAudioVideoTokens: true`
   - Comprehensive visual and audio content extraction
   - System instructions for expert video analysis

3. **Two Output Formats** (`src/services/prompt-service.ts`)
   - **Executive Summary**: ≤250 words, concise insights
   - **Detailed Guide**: Step-by-step tutorial with comprehensive coverage
   - Format-specific prompt engineering
   - Metadata injection with provider/model info

4. **Video Data Extraction** (`src/services/youtube/video-data.ts`)
   - YouTube URL parsing and video ID extraction
   - oEmbed API integration for metadata
   - Video description scraping with fallbacks
   - Robust error handling for private/deleted videos

5. **File Management** (`src/services/file/obsidian-file.ts`)
   - Automatic note creation in specified vault directory
   - Auto-titling using video title
   - Conflict prevention with existing files
   - Proper Obsidian file integration

6. **User Interaction Flow** (`src/components/modals/save-confirmation-modal.ts`)
   - Post-processing confirmation modal
   - "Open Note" / "Dismiss" options
   - Automatic file opening in new tab
   - Graceful fallback handling

7. **Settings Management** (`src/components/settings/settings-tab.ts`)
   - API key configuration (Gemini, Groq)
   - Output path customization
   - Settings validation and persistence

8. **Error Handling & Recovery** (`src/utils/error-handler.ts`)
   - Comprehensive error classification
   - User-friendly error messages
   - Automatic retry mechanisms
   - Network timeout handling

9. **Conflict Prevention** (`src/utils/conflict-prevention.ts`)
   - Plugin namespace isolation
   - UI element cleanup
   - Safe operation wrappers
   - Resource management

### 🎯 **CORE WORKFLOW VERIFICATION:**

**Step 1: Input** ✅
- [x] User triggers plugin via ribbon icon or command palette
- [x] URL dialog opens with YouTube URL field
- [x] Format selection dropdown (Executive Summary / Detailed Guide)

**Step 2: Processing** ✅
- [x] URL validation using regex patterns
- [x] Video ID extraction from various YouTube URL formats
- [x] Gemini API request with multimodal analysis enabled
- [x] Audio + visual content analysis

**Step 3: Content Transformation** ✅
- [x] Executive Summary → ≤250 word cohesive summary
- [x] Detailed Guide → structured step-by-step tutorial
- [x] Proper markdown formatting with metadata

**Step 4: Note Creation** ✅
- [x] File saved to configured output directory
- [x] Auto-titled using video title
- [x] Tagged with #youtube_note
- [x] Includes source URL and processing metadata

**Step 5: User Options** ✅
- [x] Success confirmation modal appears
- [x] "Open Note" button opens file in new tab
- [x] "Dismiss" option closes modal
- [x] Fallback handling if auto-open fails

### 🚀 **PRODUCTION READY:**
The YouTube Clipper Plugin is **fully functional** and meets all specifications from the todo.md requirements. The implementation includes:

- ✅ Robust error handling
- ✅ Production-grade logging  
- ✅ Resource cleanup
- ✅ User-friendly interfaces
- ✅ Comprehensive validation
- ✅ Multimodal AI analysis
- ✅ Two output formats
- ✅ File management integration

---
