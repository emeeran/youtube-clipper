/**
 * Conflict prevention utilities for YoutubeClipper Plugin
 * Designed to prevent conflicts with other Obsidian plugins
 */

export class ConflictPrevention {
    private static readonly PLUGIN_ID = 'youtube-clipper';
    private static readonly CSS_PREFIX = 'ytc';
    
    /**
     * Check if another plugin might be conflicting
     */
    static checkForPotentialConflicts(): string[] {
        const warnings: string[] = [];
        
        // Check for WebClipper-like plugins
        const suspiciousElements = [
            'div[data-plugin="web-clipper"]',
            '.web-clipper-modal',
            '.clipper-button',
            '[id*="clipper"]',
            '[class*="clip"]'
        ];
        
        suspiciousElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                warnings.push(`Detected potential plugin conflict: ${selector}`);
            }
        });
        
        return warnings;
    }
    
    /**
     * Add conflict prevention attributes to an element
     */
    static markElement(element: HTMLElement, type: string): void {
        element.setAttribute('data-plugin', this.PLUGIN_ID);
        element.setAttribute('data-ytc-type', type);
        element.addClass(`${this.CSS_PREFIX}-${type}`);
    }
    
    /**
     * Remove conflict prevention attributes
     */
    static unmarkElement(element: HTMLElement): void {
        element.removeAttribute('data-plugin');
        element.removeAttribute('data-ytc-type');
        
        // Remove all classes starting with our prefix
        const classes = Array.from(element.classList);
        classes.forEach(className => {
            if (className.startsWith(this.CSS_PREFIX)) {
                element.removeClass(className);
            }
        });
    }
    
    /**
     * Create a namespaced ID to prevent conflicts
     */
    static createUniqueId(base: string): string {
        return `${this.CSS_PREFIX}-${base}-${Date.now()}`;
    }
    
    /**
     * Clean up all plugin elements from DOM
     */
    static cleanupAllElements(): void {
        const elements = document.querySelectorAll(`[data-plugin="${this.PLUGIN_ID}"]`);
        elements.forEach(element => {
            if (element instanceof HTMLElement) {
                this.unmarkElement(element);
            }
        });
    }
    
    /**
     * Get safe storage key with namespace
     */
    static getStorageKey(key: string): string {
        return `${this.PLUGIN_ID}-${key}`;
    }
    
    /**
     * Log plugin activity with namespace
     */
    static log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${this.PLUGIN_ID}] ${timestamp} - ${message}`;
        
        switch (level) {
            case 'warn':
                console.warn(logMessage);
                break;
            case 'error':
                console.error(logMessage);
                break;
            default:
                console.log(logMessage);
        }
    }
    
    /**
     * Check if plugin is safe to operate
     */
    static isSafeToOperate(): boolean {
        // Check if we're in a safe state to operate
        const conflicts = this.checkForPotentialConflicts();
        
        if (conflicts.length > 0) {
            this.log(`Potential conflicts detected: ${conflicts.join(', ')}`, 'warn');
            return false;
        }
        
        return true;
    }
    
    /**
     * Wrap async operations with conflict checking
     */
    static async safeOperation<T>(
        operation: () => Promise<T>,
        operationName: string
    ): Promise<T | null> {
        if (!this.isSafeToOperate()) {
            this.log(`Skipping ${operationName} due to potential conflicts`, 'warn');
            return null;
        }
        
        try {
            this.log(`Starting ${operationName}`);
            const result = await operation();
            this.log(`Completed ${operationName}`);
            return result;
        } catch (error) {
            this.log(`Error in ${operationName}: ${error}`, 'error');
            throw error;
        }
    }
}
