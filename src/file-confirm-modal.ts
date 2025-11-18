/**
 * File opening confirmation modal component
 */

import { App, Notice, TFile } from 'obsidian';
import { BaseModal } from './base-modal';
import { MESSAGES } from './messages';
import { ErrorHandler } from './services/error-handler';

export interface FileConfirmModalOptions {
    file: TFile;
    onConfirm?: () => Promise<void>;
    onCancel?: () => void;
}

export class FileConfirmModal extends BaseModal {
    private yesButton?: HTMLButtonElement;

    constructor(
        app: App,
        private options: FileConfirmModalOptions
    ) {
        super(app);
        this.setupEscapePrevention();
    }

    onOpen(): void {
        console.log('FileConfirmModal opened for file:', this.options.file.name);
        console.log('File path:', this.options.file.path);
        
        this.createModalContent();
        this.setupEventHandlers();
        this.focusYesButton();
        this.forceVisible();
    }

    /**
     * Prevent accidental closing with Escape, but allow intentional close
     */
    private setupEscapePrevention(): void {
        this.scope.register([], 'Escape', (evt) => {
            evt.preventDefault();
            this.handleEscapeKey();
            return false;
        });
    }

    /**
     * Create modal content
     */
    private createModalContent(): void {
        this.createHeader(MESSAGES.MODALS.YOUTUBE_PROCESSED);
        this.createConfirmationMessage();
        this.createActionButtons();
    }

    /**
     * Create confirmation message
     */
    private createConfirmationMessage(): void {
        const message = MESSAGES.MODALS.CONFIRM_OPEN(this.options.file.name);
        this.createMessage(message);
    }

    /**
     * Create action buttons
     */
    private createActionButtons(): void {
        const container = this.createButtonContainer();

        // No button
        this.createButton(
            container,
            MESSAGES.MODALS.NO_THANKS,
            false,
            () => this.handleCancel()
        );

        // Yes button (primary)
        this.yesButton = this.createButton(
            container,
            MESSAGES.MODALS.YES_OPEN,
            true,
            () => this.handleConfirm()
        );
    }

    /**
     * Set up event handlers
     */
    private setupEventHandlers(): void {
        this.setupKeyHandlers(
            () => this.handleConfirm(),
            () => this.handleEscapeKey()
        );
    }

    /**
     * Focus on Yes button by default
     */
    private focusYesButton(): void {
        if (this.yesButton) {
            this.focusElement(this.yesButton);
            console.log('Yes button focused');
        }
    }

    /**
     * Handle confirmation (Yes button)
     */
    private async handleConfirm(): Promise<void> {
        console.log('User clicked Yes - attempting to open file');
        
        try {
            await this.openFile();
            
            // Call external onConfirm callback if provided
            if (this.options.onConfirm) {
                await this.options.onConfirm();
            }
            
        } catch (error) {
            ErrorHandler.handle(error as Error, 'File opening');
            new Notice(MESSAGES.ERRORS.COULD_NOT_OPEN((error as Error).message));
        } finally {
            // Always close the modal
            this.close();
        }
    }

    /**
     * Handle cancellation (No button)
     */
    private handleCancel(): void {
        console.log('User clicked No - closing modal');
        
        try {
            if (this.options.onCancel) {
                this.options.onCancel();
            }
        } catch (error) {
            console.error('Error in onCancel callback:', error);
        } finally {
            // Always close the modal
            this.close();
        }
    }

    /**
     * Handle Escape key with confirmation
     */
    private handleEscapeKey(): void {
        // Allow easier escape - don't require confirmation for better UX
        console.log('User pressed Escape - closing modal');
        this.handleCancel();
    }

    /**
     * Open the file in Obsidian
     */
    private async openFile(): Promise<void> {
        // Verify file still exists
        const currentFile = this.app.vault.getAbstractFileByPath(this.options.file.path);
        if (!(currentFile instanceof TFile)) {
            throw new Error(MESSAGES.ERRORS.FILE_NOT_EXISTS);
        }

        // Open the file
        const leaf = this.app.workspace.getLeaf(false);
        console.log('Opening file in leaf:', leaf);
        
        await leaf.openFile(currentFile);
        console.log('File opened successfully');
        
        new Notice(MESSAGES.OPENED_FILE(currentFile.name));
    }

    /**
     * Get the file being processed
     */
    getFile(): TFile {
        return this.options.file;
    }

    /**
     * Clean up modal and ensure proper disposal
     */
    onClose(): void {
        console.log('FileConfirmModal closing - cleaning up');
        
        // Clear any button references
        this.yesButton = undefined;
        
        // Call parent cleanup
        super.onClose();
        
        console.log('FileConfirmModal cleanup complete');
    }
}
