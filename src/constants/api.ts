/**
 * API endpoints and configuration constants
 */

export const API_ENDPOINTS = {
    GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
    GROQ: 'https://api.groq.com/openai/v1/chat/completions',
    YOUTUBE_OEMBED: 'https://www.youtube.com/oembed',
    CORS_PROXY: 'https://api.allorigins.win/raw'
} as const;

export const AI_MODELS = {
    GEMINI: 'gemini-2.5-pro', // Set Gemini model to gemini-2.5-pro
    GROQ: 'llama-3.3-70b-versatile'
} as const;

// Known model options per provider (used to populate model selector in UI)
export const PROVIDER_MODEL_OPTIONS: Record<string, string[]> = {
    'Google Gemini': [
        'gemini-2.5-pro',
        'gemini-2.1',
        'gemini-1.0'
    ],
    'Groq': [
        'llama-3.3-70b-versatile'
    ]
};

export const API_LIMITS = {
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7,
    DESCRIPTION_MAX_LENGTH: 1000,
    TITLE_MAX_LENGTH: 100
} as const;

export const TIMEOUTS = {
    FILE_CREATION_WAIT: 300,
    MODAL_DELAY: 100,
    FALLBACK_MODAL_CHECK: 500,
    FOCUS_DELAY: 150,
    REPAINT_DELAY: 50
} as const;
