/**
 * User-facing messages and notifications
 */

export const MESSAGES = {
    PROCESSING: 'Processing YouTube video...',
    SUCCESS: (title: string) => `Successfully processed: ${title}`,
    OPENED_FILE: (filename: string) => `Opened: ${filename}`,
    
    ERRORS: {
        INVALID_URL: 'Invalid YouTube URL. Please provide a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)',
        MISSING_API_KEYS: 'No valid Gemini or Groq API key configured. Please set one in plugin settings.',
        GEMINI_INVALID_KEY: 'Gemini API key is invalid or missing. Please check your key.',
        GROQ_MODEL_NOT_FOUND: 'Groq API error: Model not found or you do not have access. Please check your API key and model name.',
        FETCH_VIDEO_DATA: (status: number) => `Failed to fetch video metadata: ${status}`,
        SAVE_FILE: (message: string) => `Failed to save file: ${message}`,
        AI_PROCESSING: (message: string) => `AI processing failed: ${message}`,
        FILE_NOT_EXISTS: 'File no longer exists',
        COULD_NOT_OPEN: (message: string) => `Could not open file: ${message}`,
        ENTER_URL: 'Please enter a YouTube URL',
        VIDEO_ID_EXTRACTION: 'Could not extract video ID from URL. Please check the URL format.',
        NETWORK_ERROR: 'Network error occurred. Please check your internet connection and try again.'
    },
    
    WARNINGS: {
        CORS_RESTRICTIONS: 'Description not available due to CORS restrictions',
        EXTRACTION_FAILED: 'Description extraction failed',
        AUTO_EXTRACTION: 'Video description could not be extracted automatically.'
    },
    
    MODALS: {
        YOUTUBE_PROCESSED: 'YouTube Video Processed',
        CONFIRM_OPEN: (filename: string) => `Successfully processed YouTube video and saved as "${filename}". Would you like to open the note now?`,
        CLOSE_CONFIRMATION: 'Close without opening the note?',
        PROCESS_VIDEO: 'Process YouTube Video',
        YES_OPEN: 'Yes, open note',
        NO_THANKS: 'No, thanks',
        CANCEL: 'Cancel',
        PROCESS: 'Process'
    },
    
    PLACEHOLDERS: {
        YOUTUBE_URL: 'https://www.youtube.com/watch?v=...',
        GEMINI_KEY: 'AIza...',
        GROQ_KEY: 'gsk_...',
        OUTPUT_PATH: 'YouTube/Processed Videos'
    }
} as const;
