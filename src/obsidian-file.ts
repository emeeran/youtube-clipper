/**
 * File management service for Obsidian vault operations
 */

import { App, TFile } from 'obsidian';
import { FileService } from './types/types';
import { ValidationUtils } from './validation';
import { ErrorHandler } from './services/error-handler';
import { MESSAGES } from './messages';
import { TIMEOUTS } from './api';
import { FileConflictModal } from './file-conflict-modal';

export class ObsidianFileService implements FileService {
    constructor(private app: App) {}

    /**
     * Save content to a file in the vault
     */
    async saveToFile(title: string, content: string, outputPath: string): Promise<string> {
        try {
            const filename = this.createSafeFilename(title);
            const normalizedBase = this.normalizePath(outputPath);

            await this.ensureDirectoryExists(normalizedBase);

            const dailyFolder = this.getDailyFolderPath(normalizedBase);
            await this.ensureDirectoryExists(dailyFolder);

            const filePath = `${dailyFolder}/${filename}`;
            const finalPath = await this.handleFileConflicts(filePath, content);
            
            return finalPath;
        } catch (error) {
            throw new Error(MESSAGES.ERRORS.SAVE_FILE((error as Error).message));
        }
    }

    /**
     * Open a file with user confirmation
     */
    async openFileWithConfirmation(file: TFile): Promise<void> {
        // Wait for file to be fully created
        await this.waitForFileCreation();
        
        try {
            // Verify file still exists
            const currentFile = this.app.vault.getAbstractFileByPath(file.path);
            if (!(currentFile instanceof TFile)) {
                throw new Error(MESSAGES.ERRORS.FILE_NOT_EXISTS);
            }
            
            // Open the file
            const leaf = this.app.workspace.getLeaf(false);
            await leaf.openFile(currentFile);
            
        } catch (error) {
            throw new Error(MESSAGES.ERRORS.COULD_NOT_OPEN((error as Error).message));
        }
    }

    /**
     * Create a safe filename from title
     */
    private createSafeFilename(title: string): string {
        const sanitized = ValidationUtils.sanitizeFilename(title);
        return `${sanitized}.md`;
    }

    /**
     * Ensure the output directory exists
     */
    private async ensureDirectoryExists(outputPath: string): Promise<void> {
        try {
            await this.app.vault.createFolder(outputPath);
        } catch (error) {
            // Folder might already exist, ignore error
        }
    }

    private getDailyFolderPath(basePath: string): string {
        const trimmedBase = basePath.replace(/\/+$/, '');
        const today = new Date().toISOString().split('T')[0];
        return `${trimmedBase}/${today}`;
    }

    /**
     * Handle file naming conflicts by adding timestamp
     */
    private async handleFileConflicts(filePath: string, content: string): Promise<string> {
        const existingFile = this.app.vault.getAbstractFileByPath(filePath);

        if (existingFile instanceof TFile) {
            const decision = await this.promptConflictResolution(existingFile);

            switch (decision) {
                case 'overwrite':
                    await this.app.vault.modify(existingFile, content);
                    return existingFile.path;
                case 'new-name':
                    return this.createVersionedCopy(existingFile.path, content);
                default:
                    throw new Error('Save cancelled by user');
            }
        }

        await this.app.vault.create(filePath, content);
        return filePath;
    }

    /**
     * Wait for file creation to complete
     */
    private async waitForFileCreation(): Promise<void> {
        return new Promise(resolve => 
            setTimeout(resolve, TIMEOUTS.FILE_CREATION_WAIT)
        );
    }

    /**
     * Get file by path with validation
     */
    getFileByPath(filePath: string): TFile | null {
        const file = this.app.vault.getAbstractFileByPath(filePath);
        return file instanceof TFile ? file : null;
    }

    /**
     * Check if file exists at path
     */
    fileExists(filePath: string): boolean {
        return this.getFileByPath(filePath) !== null;
    }

    /**
     * Create a file with unique naming
     */
    async createUniqueFile(basePath: string, content: string): Promise<string> {
        let counter = 1;
        let filePath = basePath;
        
        while (this.fileExists(filePath)) {
            const pathParts = basePath.split('/');
            const filename = pathParts.pop()!;
            const nameWithoutExt = filename.replace('.md', '');
            const newFilename = `${nameWithoutExt} (${counter}).md`;
            filePath = [...pathParts, newFilename].join('/');
            counter++;
        }
        
        await this.app.vault.create(filePath, content);
        return filePath;
    }

    private async promptConflictResolution(file: TFile): Promise<'overwrite' | 'new-name' | 'cancel'> {
        const modal = new FileConflictModal(this.app, file);
        const decision = await modal.openAndWait();
        return decision;
    }

    private async createVersionedCopy(originalPath: string, content: string): Promise<string> {
        const pathParts = originalPath.split('/');
        const filename = pathParts.pop()!;
        const nameWithoutExt = filename.replace('.md', '');

        let counter = 1;
        let candidatePath: string;

        do {
            candidatePath = [...pathParts, `${nameWithoutExt} (${counter}).md`].join('/');
            counter++;
        } while (this.fileExists(candidatePath));

        await this.app.vault.create(candidatePath, content);
        return candidatePath;
    }

    private normalizePath(path: string): string {
        if (!path) {
            return '';
        }

        let normalized = path.trim();
        if (normalized.startsWith('./')) {
            normalized = normalized.slice(2);
        }
        while (normalized.startsWith('/')) {
            normalized = normalized.slice(1);
        }

            normalized = normalized.replace(/\/+/g, '/');
        return normalized;
    }
}
