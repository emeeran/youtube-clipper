/**
 * DOM manipulation utilities to eliminate code duplication
 */

import { MODAL_STYLES, INPUT_STYLES } from './styles';
import { DOMUtilsInterface, StyleObject } from './types/types';

export class DOMUtils implements DOMUtilsInterface {
    /**
     * Apply styles to an HTML element
     */
    static applyStyles(element: HTMLElement, styles: StyleObject): void {
        Object.assign(element.style, styles);
    }

    /**
     * Create a standardized button container
     */
    static createButtonContainer(parent: HTMLElement): HTMLDivElement {
        const container = parent.createDiv();
        this.applyStyles(container, MODAL_STYLES.buttonContainer);
        return container;
    }

    /**
     * Create a styled button with consistent appearance
     */
    static createStyledButton(
        container: HTMLElement,
        text: string,
        isPrimary = false,
        onClick?: () => void
    ): HTMLButtonElement {
        const button = container.createEl('button', { text });
        
        if (isPrimary) {
            button.classList.add('mod-cta');
        }
        
        this.applyStyles(button, MODAL_STYLES.button);
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }

    /**
     * Create a styled input field
     */
    static createStyledInput(
        container: HTMLElement,
        type: string,
        placeholder: string,
        value = ''
    ): HTMLInputElement {
        const input = container.createEl('input', {
            type,
            placeholder,
            value
        });
        
        this.applyStyles(input, INPUT_STYLES);
        return input;
    }

    /**
     * Set up modal base styling for consistency
     */
    static setupModalStyling(modalEl: HTMLElement): void {
        this.applyStyles(modalEl, {
            zIndex: MODAL_STYLES.zIndex,
            display: MODAL_STYLES.display
        });
    }

    /**
     * Create a header element with consistent styling
     */
    static createModalHeader(parent: HTMLElement, text: string): HTMLHeadingElement {
        const header = parent.createEl('h2', { text });
        this.applyStyles(header, MODAL_STYLES.header);
        return header;
    }

    /**
     * Create a message paragraph with consistent styling
     */
    static createModalMessage(parent: HTMLElement, text: string): HTMLParagraphElement {
        const message = parent.createEl('p');
        message.setText(text);
        this.applyStyles(message, MODAL_STYLES.message);
        return message;
    }

    /**
     * Set up keyboard event handlers for modals
     */
    static setupModalKeyHandlers(
        element: HTMLElement,
        onEnter: () => void,
        onEscape?: () => void
    ): void {
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                onEnter();
            }
            if (e.key === 'Escape' && onEscape) {
                e.preventDefault();
                e.stopPropagation();
                onEscape();
            }
        });
    }

    // Instance methods implementing interface
    applyStyles(element: HTMLElement, styles: StyleObject): void {
        DOMUtils.applyStyles(element, styles);
    }

    createButtonContainer(parent: HTMLElement): HTMLDivElement {
        return DOMUtils.createButtonContainer(parent);
    }

    createStyledButton(
        container: HTMLElement,
        text: string,
        isPrimary = false,
        onClick?: () => void
    ): HTMLButtonElement {
        return DOMUtils.createStyledButton(container, text, isPrimary, onClick);
    }
}
