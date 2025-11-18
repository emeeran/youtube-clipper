/**
 * Custom styled confirmation modal for better accessibility and UX
 * Replaces native browser confirm() with a fully accessible modal dialog
 */

import { App, Modal } from 'obsidian';
import { BaseModal } from './base-modal';

export interface ConfirmationModalOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean; // If true, swap button positions (cancel on right)
}

/**
 * Custom confirmation modal with keyboard shortcuts (Enter to confirm, Escape to cancel)
 * and proper ARIA labels for accessibility
 */
export class ConfirmationModal extends BaseModal {
    private confirmButton?: HTMLButtonElement;
    private cancelButton?: HTMLButtonElement;
    private result: boolean = false;
    private resolver?: (value: boolean) => void;

    constructor(
        app: App,
        private options: ConfirmationModalOptions
    ) {
        super(app);
    }

    onOpen(): void {
        this.createModalContent();
        this.setupEventHandlers();
        this.focusConfirmButton();
    }

    /**
     * Create modal content with accessible structure
     */
    private createModalContent(): void {
        // Header
        const header = this.createHeader(this.options.title);
        header.setAttribute('id', 'confirmation-modal-title');

        // Message container with aria-describedby
        const messageContainer = this.contentEl.createDiv('confirmation-message');
        messageContainer.setAttribute('id', 'confirmation-modal-description');
        messageContainer.textContent = this.options.message;

        // Buttons container
        const buttonContainer = this.createButtonContainer();
        buttonContainer.style.marginTop = '20px';

        const confirmText = this.options.confirmText || 'Confirm';
        const cancelText = this.options.cancelText || 'Cancel';
        const isDangerous = this.options.isDangerous || false;

        if (isDangerous) {
            // Swap: cancel on left, confirm on right (for destructive actions)
            this.cancelButton = this.createButton(
                buttonContainer,
                cancelText,
                false,
                () => this.handleCancel()
            );
            this.cancelButton.setAttribute('aria-label', `Cancel: ${cancelText}`);

            this.confirmButton = this.createButton(
                buttonContainer,
                confirmText,
                true,
                () => this.handleConfirm()
            );
            this.confirmButton.setAttribute('aria-label', `Confirm: ${confirmText}`);
        } else {
            // Default: confirm on left, cancel on right
            this.confirmButton = this.createButton(
                buttonContainer,
                confirmText,
                true,
                () => this.handleConfirm()
            );
            this.confirmButton.setAttribute('aria-label', `Confirm: ${confirmText}`);

            this.cancelButton = this.createButton(
                buttonContainer,
                cancelText,
                false,
                () => this.handleCancel()
            );
            this.cancelButton.setAttribute('aria-label', `Cancel: ${cancelText}`);
        }

        // Set modal content aria-labelledby and aria-describedby
        this.contentEl.setAttribute('aria-labelledby', 'confirmation-modal-title');
        this.contentEl.setAttribute('aria-describedby', 'confirmation-modal-description');
        this.contentEl.setAttribute('role', 'alertdialog');
    }

    /**
     * Set up keyboard event handlers (Enter to confirm, Escape to cancel)
     */
    private setupEventHandlers(): void {
        // Enter key: confirm
        this.scope.register([], 'Enter', () => {
            this.handleConfirm();
            return false;
        });

        // Escape key: cancel
        this.scope.register([], 'Escape', () => {
            this.handleCancel();
            return false;
        });
    }

    /**
     * Focus the confirm button by default
     */
    private focusConfirmButton(): void {
        if (this.confirmButton) {
            setTimeout(() => {
                this.confirmButton!.focus();
            }, 50);
        }
    }

    /**
     * Handle confirmation (Confirm button or Enter key)
     */
    private handleConfirm(): void {
        this.result = true;
        if (this.resolver) {
            this.resolver(true);
        }
        this.close();
    }

    /**
     * Handle cancellation (Cancel button or Escape key)
     */
    private handleCancel(): void {
        this.result = false;
        if (this.resolver) {
            this.resolver(false);
        }
        this.close();
    }

    /**
     * Open modal and wait for user response
     * Returns promise that resolves to true if confirmed, false if cancelled
     */
    public openAndWait(): Promise<boolean> {
        return new Promise((resolve) => {
            this.resolver = resolve;
            this.open();
        });
    }

    /**
     * Get the result (synchronous if already closed)
     */
    public getResult(): boolean {
        return this.result;
    }
}
