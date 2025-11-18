/**
 * Modal prompting user when a file conflict is detected.
 */

import { App, TFile } from 'obsidian';
import { BaseModal } from './base-modal';

export type ConflictResolution = 'overwrite' | 'new-name' | 'cancel';

const COPY_WARNING = 'A note with this title already exists. Choose how to proceed.';

export class FileConflictModal extends BaseModal {
    private resolve?: (value: ConflictResolution) => void;
    private decision: ConflictResolution = 'cancel';

    constructor(app: App, private file: TFile) {
        super(app);
    }

    onOpen(): void {
        this.createHeader('Note Already Exists');
        this.createMessage(`${COPY_WARNING}\n\nExisting note: ${this.file.path}`);
        this.createButtons();
    }

    openAndWait(): Promise<ConflictResolution> {
        return new Promise<ConflictResolution>((resolve) => {
            this.resolve = resolve;
            // Ensure modal is visible and on top when opened from another modal
            this.forceVisible();
            this.open();
        });
    }

    onClose(): void {
        if (this.resolve) {
            this.resolve(this.decision);
        }
        super.onClose();
    }

    private createButtons(): void {
        const container = this.createButtonContainer();

        this.createButton(container, 'Cancel', false, () => {
            this.closeWithDecision('cancel');
        });

        this.createButton(container, 'Save as Numbered Copy', false, () => {
            this.closeWithDecision('new-name');
        });

        this.createButton(container, 'Overwrite Existing', true, () => {
            this.closeWithDecision('overwrite');
        });
    }

    private closeWithDecision(decision: ConflictResolution): void {
        this.decision = decision;
        this.close();
    }
}
