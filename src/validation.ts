/**
 * Input validation utilities
 */

import { MESSAGES } from './messages';

export class ValidationUtils {
    /**
     * YouTube URL patterns for validation (ordered by frequency for performance)
     * Enhanced patterns to handle various YouTube URL formats
     */
    private static readonly URL_PATTERNS = [
        // Standard youtube.com/watch?v= format (most common)
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&.*)?$/,
        // youtu.be short format (second most common)
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
        // youtube.com/embed format
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
        // youtube.com/v format
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
        // Mobile youtube.com format
        /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&.*)?$/
    ];

    // Memoized regex for video ID validation (hot path optimization)
    private static readonly VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
    private static readonly URL_CACHE = new Map<string, string | null>();

    /**
     * Clean and normalize YouTube URL
     */
    static cleanYouTubeUrl(url: string): string {
        if (!url || typeof url !== 'string') {
            return '';
        }

        // Remove extra whitespace and normalize
        let cleanUrl = url.trim();
        
        // Handle URLs that might have been copy-pasted with extra characters
        cleanUrl = cleanUrl.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters
        
        // Add https:// if missing protocol
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }

        // Convert http to https for YouTube
        if (cleanUrl.startsWith('http://youtube.com') || cleanUrl.startsWith('http://www.youtube.com')) {
            cleanUrl = cleanUrl.replace('http://', 'https://');
        }

        return cleanUrl;
    }

    /**
     * Extract YouTube video ID from URL (memoized for performance)
     * Enhanced extraction with better error handling
     */
    static extractVideoId(url: string): string | null {
        if (!url || typeof url !== 'string') return null;
        
        // Check cache first (O(1) for repeated URLs)
        if (this.URL_CACHE.has(url)) {
            return this.URL_CACHE.get(url)!;
        }

        const cleanUrl = this.cleanYouTubeUrl(url);
        let result: string | null = null;

        // Direct index access for most common pattern first (micro-optimization)
        let match = cleanUrl.match(this.URL_PATTERNS[0]); // Most common pattern first
        if (match?.[1] && this.VIDEO_ID_REGEX.test(match[1])) {
            result = match[1];
        } else {
            // Fallback to remaining patterns
            for (let i = 1; i < this.URL_PATTERNS.length && !result; i++) {
                match = cleanUrl.match(this.URL_PATTERNS[i]);
                if (match?.[1] && this.VIDEO_ID_REGEX.test(match[1])) {
                    result = match[1];
                }
            }
        }

        // Cache result with simple LRU eviction
        if (this.URL_CACHE.size > 100) {
            this.URL_CACHE.clear(); // Simple LRU by clearing when full
        }
        this.URL_CACHE.set(url, result);

        if (!result) {
            console.warn('Failed to extract video ID from URL:', url);
        }

        return result;
    }

    /**
     * Validate YouTube URL format
     */
    static isValidYouTubeUrl(url: string): boolean {
        return this.extractVideoId(url) !== null;
    }

    /**
     * Sanitize filename for file system compatibility
     */
    static sanitizeFilename(filename: string, maxLength = 100): string {
        return filename
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, maxLength);
    }

    /**
     * Validate API key format
     */
    static isValidAPIKey(key: string, provider: 'gemini' | 'groq'): boolean {
        if (!key || typeof key !== 'string') {
            return false;
        }

        switch (provider) {
            case 'gemini':
                return key.startsWith('AIza') && key.length > 10;
            case 'groq':
                return key.startsWith('gsk_') && key.length > 10;
            default:
                return false;
        }
    }

    /**
     * Validate settings configuration
     */
    static validateSettings(settings: any): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        const usingEnv = Boolean(settings.useEnvironmentVariables);
        const hasDirectKey = this.isNonEmptyString(settings.geminiApiKey) || this.isNonEmptyString(settings.groqApiKey);

        if (!hasDirectKey && !usingEnv) {
            errors.push(MESSAGES.ERRORS.MISSING_API_KEYS);
        }

        if (this.isNonEmptyString(settings.geminiApiKey) && !this.isValidAPIKey(settings.geminiApiKey, 'gemini')) {
            errors.push('Invalid Gemini API key format');
        }

        if (this.isNonEmptyString(settings.groqApiKey) && !this.isValidAPIKey(settings.groqApiKey, 'groq')) {
            errors.push('Invalid Groq API key format');
        }

        if (usingEnv && !this.isNonEmptyString(settings.environmentPrefix)) {
            errors.push('Environment variable prefix is required when using environment variables');
        }

        if (!settings.outputPath || typeof settings.outputPath !== 'string') {
            errors.push('Output path is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate file path
     */
    static isValidPath(path: string): boolean {
        return typeof path === 'string' && path.trim().length > 0;
    }

    /**
     * Validate that a string is not empty
     */
    static isNonEmptyString(value: any): value is string {
        return typeof value === 'string' && value.trim().length > 0;
    }

    /**
     * Truncate text to specified length with ellipsis
     */
    static truncateText(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Clean HTML entities and escape sequences from text
     */
    static cleanText(text: string): string {
        return text
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => 
                String.fromCharCode(parseInt(code, 16))
            );
    }
}
