/**
 * Base modal class with shared functionality and consistent styling
 * Designed to prevent conflicts with other plugin modals
 */

import { App, Modal } from 'obsidian';
import { DOMUtils } from './dom';
import { MODAL_STYLES, INPUT_STYLES } from './styles';
import { TIMEOUTS } from './api';
import { ModalEvents } from './types/types';

// Unique CSS classes to prevent conflicts
const MODAL_CSS_CLASSES = {
    modal: 'ytc-modal',
    header: 'ytc-modal-header',
    content: 'ytc-modal-content',
    button: 'ytc-modal-button',
    input: 'ytc-modal-input'
} as const;

export abstract class BaseModal extends Modal {
    protected events: Partial<ModalEvents> = {};
    private isDisposed = false;

    constructor(app: App) {
        super(app);
        this.setupModalStyling();
        this.setupConflictPrevention();
    }

    /**
     * Set up base modal styling for consistency
     */
    private setupModalStyling(): void {
        DOMUtils.setupModalStyling(this.modalEl);
        
        // Add unique CSS class to prevent conflicts
        this.modalEl.addClass(MODAL_CSS_CLASSES.modal);
        this.contentEl.addClass(MODAL_CSS_CLASSES.content);
    }

    /**
     * Set up conflict prevention measures
     */
    private setupConflictPrevention(): void {
        // Add unique attribute for identification
        this.modalEl.setAttribute('data-plugin', 'youtube-clipper');
        
        // Ensure modal has high z-index but not conflicting
        this.modalEl.style.zIndex = '9999';
    }

    /**
     * Create standardized modal header with conflict prevention
     */
    protected createHeader(text: string): HTMLHeadingElement {
        const header = DOMUtils.createModalHeader(this.contentEl, text);
        header.addClass(MODAL_CSS_CLASSES.header);
        return header;
    }

    /**
     * Create standardized modal message
     */
    protected createMessage(text: string): HTMLParagraphElement {
        return DOMUtils.createModalMessage(this.contentEl, text);
    }

    /**
     * Create standardized button container
     */
    protected createButtonContainer(): HTMLDivElement {
        return DOMUtils.createButtonContainer(this.contentEl);
    }

        /**
     * Create standardized button with conflict prevention and accessibility
     */
    protected createButton(
        container: HTMLElement,
        text: string,
        isPrimary = false,
        onClick?: () => void
    ): HTMLButtonElement {
        const button = DOMUtils.createStyledButton(container, text, isPrimary, onClick);
        button.addClass(MODAL_CSS_CLASSES.button);
        
        // Add unique data attribute
        button.setAttribute('data-plugin', 'youtube-clipper');
        
        // Accessibility: add role and aria-label
        button.setAttribute('role', 'button');
        if (!button.getAttribute('aria-label')) {
            button.setAttribute('aria-label', text);
        }
        
        return button;
    }

    /**
     * Create standardized input with conflict prevention and accessibility
     */
    protected createInput(
        container: HTMLElement,
        type: string,
        placeholder?: string
    ): HTMLInputElement {
        const input = container.createEl('input', {
            type,
            placeholder
        });
        
        // Apply styles and add unique class
        DOMUtils.applyStyles(input, INPUT_STYLES);
        input.addClass(MODAL_CSS_CLASSES.input);
        input.setAttribute('data-plugin', 'youtube-clipper');
        
        // Accessibility: add ARIA labels if placeholder exists
        if (placeholder) {
            input.setAttribute('aria-label', placeholder);
        }
        
        return input;
    }

    /**
     * Set up keyboard event handlers
     */
    protected setupKeyHandlers(
        onEnter: () => void | Promise<void>,
        onEscape?: () => void | Promise<void>
    ): void {
        const wrappedOnEnter = async () => {
            try {
                await onEnter();
            } catch (error) {
                console.error('Enter key handler error:', error);
            }
        };

        const wrappedOnEscape = onEscape ? async () => {
            try {
                await onEscape();
            } catch (error) {
                console.error('Escape key handler error:', error);
            }
        } : undefined;

        DOMUtils.setupModalKeyHandlers(this.contentEl, wrappedOnEnter, wrappedOnEscape);
    }

    /**
     * Focus element with delay for better UX
     */
    protected focusElement(element: HTMLElement, delay = TIMEOUTS.FOCUS_DELAY): void {
        setTimeout(() => {
            element.focus();
        }, delay);
    }

    /**
     * Set up event handlers
     */
    protected setEvents(events: Partial<ModalEvents>): void {
        this.events = events;
    }

    /**
     * Show custom styled confirmation dialog before closing
     * This uses our custom ConfirmationModal instead of the native browser confirm()
     * for better accessibility and UX.
     * 
     * Note: This is now synchronous for backwards compatibility with existing callers,
     * but returns a boolean immediately. For async confirmation with proper modal,
     * use showConfirmationModal() instead.
     */
    protected confirmClose(message: string): boolean {
        // For backward compatibility, return a synchronous value.
        // However, in practice, you should use showConfirmationModal() for the full async experience.
        // This fallback uses native confirm() only if needed.
        return confirm(message);
    }

    /**
     * Show a custom accessible confirmation modal and wait for user response.
     * Preferred method for confirmation dialogs (async, fully accessible).
     */
    protected async showConfirmationModal(
        title: string,
        message: string,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        isDangerous = false
    ): Promise<boolean> {
        const { ConfirmationModal } = await import('./confirmation-modal');
        const modal = new ConfirmationModal(this.app, {
            title,
            message,
            confirmText,
            cancelText,
            isDangerous
        });
        return modal.openAndWait();
    }

    /**
     * Force modal visibility (for stubborn modals)
     */
    protected forceVisible(): void {
        setTimeout(() => {
            DOMUtils.setupModalStyling(this.modalEl);
        }, TIMEOUTS.REPAINT_DELAY);
    }

    /**
     * Clean up on close with proper disposal
     */
    onClose(): void {
        if (this.isDisposed) {
            return;
        }
        
        console.log('[youtube-clipper] Cleaning up modal');
        
        // Mark as disposed to prevent double cleanup
        this.isDisposed = true;
        
        // Clear content
        const { contentEl } = this;
        contentEl.empty();
        
        // Remove unique classes and attributes
        this.modalEl.removeClass(MODAL_CSS_CLASSES.modal);
        this.modalEl.removeAttribute('data-plugin');
        
        console.log('[youtube-clipper] Modal cleanup complete');
    }

    /**
     * Abstract method for modal content creation
     */
    abstract onOpen(): void;
}
