
---

# **Spec-Driven Workflow: Obsidian YouTube Clipper Plugin**

## **1. Idea → Problem Statement**

Users want to capture structured, high-value insights from YouTube videos directly into Obsidian. Manual note-taking is time-consuming, inconsistent, and often misses key details.

---

## **2. Objectives**

* Automate note creation from YouTube videos.
* Provide two output modes: **Executive Summary** (short, ≤250 words) or **Detailed Guide** (step-by-step tutorial).
* Ensure multimodal analysis (audio + visuals).
* Seamlessly integrate with Obsidian’s note system.

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

* Prompt: *“Note created successfully. Open now?”*
* Options: **Open Note** | **Dismiss**

---

## **5. Acceptance Criteria**

* ✅ Input dialog includes URL + format selection.
* ✅ Summary mode outputs ≤250 words.
* ✅ Guide mode outputs step-by-step tutorial with headings.
* ✅ Note is saved under Obsidian’s vault with correct metadata.
* ✅ User can open the note immediately.
* ✅ Errors are clearly surfaced (invalid link, API failure, empty response).

---

## **6. Edge Cases**

* Invalid YouTube URL → error prompt with retry option.
* API returns incomplete response → fallback message in note.
* Long video (>3 hrs) → provide truncated analysis or notify user.
* Network timeout → graceful retry mechanism.

---

## **7. Versioning Stages**

* **v1.0 (MVP)**: Input URL, executive summary only.
* **v1.1**: Add **Detailed Guide** mode.
* **v1.2**: Add error handling + user options (open note).
* **v2.0**: Multi-language support, bulk URL processing.

---

