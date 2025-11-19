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
// Each entry is now an object with `name` and optional metadata like `supportsAudioVideo`.
// Models are updated to reflect the latest available versions (Nov 2024 - Nov 2025).
export type ProviderModelEntry = { name: string; supportsAudioVideo?: boolean };
export const PROVIDER_MODEL_OPTIONS: Record<string, ProviderModelEntry[]> = {
    'Google Gemini': [
        // Gemini 2.5 series (latest, all support multimodal video analysis)
        { name: 'gemini-2.5-pro', supportsAudioVideo: true },
        { name: 'gemini-2.5-pro-tts', supportsAudioVideo: true },
        { name: 'gemini-2.5-flash', supportsAudioVideo: true },
        { name: 'gemini-2.5-flash-lite', supportsAudioVideo: true },
        // Gemini 2.0 series (video support via native API, but no explicit multimodal flag)
        { name: 'gemini-2.0-pro', supportsAudioVideo: true },
        { name: 'gemini-2.0-flash' },
        { name: 'gemini-2.0-flash-lite' },
        // Gemini 1.5 series (available, supports video via File API)
        { name: 'gemini-1.5-pro' },
        { name: 'gemini-1.5-flash' }
    ],
    'Groq': [
        // Latest models (Nov 2024 - Nov 2025)
        // Note: Groq models prioritize speed/text; for multimodal video, Gemini is recommended
        { name: 'llama-4-maverick-17b-128e-instruct' },
        { name: 'llama-4-scout-17b-16e-instruct' },
        // Llama 3.x series
        { name: 'llama-3.3-70b-versatile' },
        { name: 'llama-3.1-8b-instant' }
    ]
};

// Optional: provider pages to attempt to scrape for latest model names (best-effort)
export const PROVIDER_MODEL_LIST_URLS: Record<string, string> = {
    'Google Gemini': 'https://developers.generativeai.google/models',
    'Groq': 'https://groq.com'
};

// Simple regex patterns to try to extract model-like tokens from provider pages
export const PROVIDER_MODEL_REGEX: Record<string, RegExp> = {
    'Google Gemini': /gemini[-_\.]?\d+(?:\.\d+)?(?:-[a-z0-9\-]+)?/gi,
    'Groq': /llama[-_\.]?\d+(?:\.\d+)?(?:-[a-z0-9\-]+)?/gi
};

export const API_LIMITS = {
    MAX_TOKENS: 8000,  // Increased from 2000 to handle comprehensive tutorials
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
