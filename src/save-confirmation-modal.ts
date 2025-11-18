/**
 * Save Confirmation Modal
 * Shows a persistent confirmation dialog when a file has been saved
 */

import { App, Modal, TFile, Setting } from 'obsidian';

export class SaveConfirmationModal extends Modal {
    private file: TFile;
    private onConfirm: (shouldOpen: boolean) => void;

    constructor(app: App, file: TFile, onConfirm: (shouldOpen: boolean) => void) {
        super(app);
        this.file = file;
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        try {
            // EXACT specification from tasks_1.md Step 5
            contentEl.createEl('h2', { text: 'Note created successfully. Open now?' });

            // Add buttons container
            const buttonContainer = contentEl.createDiv('save-confirmation-buttons');
            
            // Add buttons as per specification: "Open Note" | "Dismiss"
            new Setting(buttonContainer)
                .addButton(btn => btn
                    .setButtonText('Open Note')
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onConfirm(true); // User wants to open the file
                    }))
                .addButton(btn => btn
                    .setButtonText('Dismiss')
                    .onClick(() => {
                        this.close();
                        this.onConfirm(false); // User dismisses
                    }));

            // Focus the Open Note button for better UX
            setTimeout(() => {
                const openButton = buttonContainer.querySelector('button');
                if (openButton) {
                    (openButton as HTMLElement).focus();
                }
            }, 100);
            
        } catch (error) {
            console.error('[SaveConfirmationModal] Error in onOpen:', error);
            // Fallback content
            contentEl.createEl('h2', { text: 'File Saved' });
            contentEl.createEl('p', { text: `File "${this.file.name}" has been saved successfully.` });
            contentEl.createEl('button', { text: 'OK' }).onclick = () => this.close();
        }
    }

    /**
     * Get human-readable file size
     */
    private getFileSize(): string {
        try {
            const stat = this.app.vault.adapter.stat(this.file.path);
            if (stat && typeof stat === 'object' && 'size' in stat) {
                const bytes = (stat as any).size;
                if (bytes < 1024) return `${bytes} bytes`;
                if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
            }
        } catch (error) {
            // File size not available
        }
        return '';
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    /**
     * Add custom styles for the modal
     */
    private addStyles() {
        const { contentEl } = this;
        
        // Add CSS classes for styling
        contentEl.addClass('ytp-save-confirmation-modal');
        
        // Add inline styles if needed
        const style = document.createElement('style');
        style.textContent = `
            .ytp-save-confirmation-modal {
                min-width: 450px;
                max-width: 650px;
            }
            
            .save-confirmation-message {
                margin: 20px 0 30px 0;
                text-align: left;
                line-height: 1.6;
            }
            
            .save-confirmation-filename {
                font-weight: bold;
                font-size: 1.1em;
                margin-bottom: 15px;
                color: var(--text-accent);
                text-align: center;
            }
            
            .save-confirmation-location-container,
            .save-confirmation-size-container {
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .save-confirmation-location {
                font-family: var(--font-monospace);
                background: var(--background-secondary);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.9em;
                word-break: break-all;
                color: var(--text-muted);
                flex: 1;
            }
            
            .save-confirmation-size {
                font-family: var(--font-monospace);
                background: var(--background-modifier-success);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.9em;
                color: var(--text-on-accent);
            }
            
            .save-confirmation-buttons {
                text-align: center;
                margin-top: 20px;
                display: flex;
                justify-content: center;
                gap: 15px;
            }
            
            .save-confirmation-buttons .setting-item {
                border: none;
                padding: 0;
                margin: 0;
                display: flex;
                gap: 10px;
            }
            
            .save-confirmation-buttons button {
                min-width: 100px;
                padding: 8px 20px;
                font-size: 1em;
            }
            
            .save-confirmation-buttons button:first-child {
                /* Open File button - primary action */
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
            }
            
            .save-confirmation-buttons button:last-child {
                /* OK button - secondary action */
                background-color: var(--background-modifier-border);
                color: var(--text-normal);
            }
        `;
        
        document.head.appendChild(style);
        
        // Store reference to clean up later
        this.modalEl?.setAttribute('data-style-id', 'ytp-save-confirmation-style');
    }
}
