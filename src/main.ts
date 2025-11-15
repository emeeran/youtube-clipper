import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { ConflictPrevention } from './utils/conflict-prevention';
import { MESSAGES } from './constants/messages';
import { ValidationUtils } from './utils/validation';
import { ErrorHandler } from './utils/error-handler';
import { SaveConfirmationModal } from './components/modals/save-confirmation-modal';
import { YouTubeUrlModal } from './components/modals/youtube-url-modal';
import { YouTubeSettingsTab } from './components/settings/settings-tab';
import { ServiceContainer } from './services/service-container';
import { OutputFormat, YouTubePluginSettings } from './interfaces/types';

const PLUGIN_PREFIX = 'ytp';

const DEFAULT_SETTINGS: YouTubePluginSettings = {
    geminiApiKey: '',
    groqApiKey: '',
    outputPath: 'YouTube/Processed Videos',
    useEnvironmentVariables: false,
    environmentPrefix: 'YTC'
};

export default class YouTubeProcessorPlugin extends Plugin {
    private settings: YouTubePluginSettings = DEFAULT_SETTINGS;
    private serviceContainer?: ServiceContainer;
    private ribbonIcon?: HTMLElement;
    private isUnloading = false;
    private operationCount = 0;

    async onload(): Promise<void> {
        this.logInfo('Initializing YouTube Processor Plugin v1.2.0...');
        const conflicts = ConflictPrevention.checkForPotentialConflicts();
        if (conflicts.length > 0) {
            this.logWarning(`Potential conflicts detected but proceeding: ${conflicts.join(', ')}`);
        }

        try {
            await this.loadSettings();
            await this.initializeServices();
            this.registerUIComponents();
            this.logInfo('YouTube Processor Plugin loaded successfully');
        } catch (error) {
            this.logError('Failed to load plugin', error as Error);
            ErrorHandler.handle(error as Error, 'Plugin initialization');
            new Notice('Failed to load YouTube Processor Plugin. Check console for details.');
        }
    }

    onunload(): void {
        this.logInfo('Unloading YouTube Processor Plugin...');
        this.isUnloading = true;

        try {
            this.serviceContainer?.clearServices();
            this.cleanupUIElements();
            ConflictPrevention.cleanupAllElements();
            this.logInfo('YouTube Processor Plugin unloaded successfully');
        } catch (error) {
            this.logError('Error during plugin unload', error as Error);
        }
    }

    private async initializeServices(): Promise<void> {
        this.serviceContainer = new ServiceContainer(this.settings, this.app);
    }

    private registerUIComponents(): void {
        this.ribbonIcon = this.addRibbonIcon('video', 'Process YouTube Video', () => {
            void this.safeShowUrlModal();
        });

        this.addCommand({
            id: `${PLUGIN_PREFIX}-process-youtube-video`,
            name: 'Process YouTube Video',
            callback: () => {
                void this.safeShowUrlModal();
            }
        });

        this.addSettingTab(new YouTubeSettingsTab(this.app, {
            plugin: this,
            onSettingsChange: this.handleSettingsChange.bind(this)
        }));
    }

    private cleanupUIElements(): void {
        if (this.ribbonIcon) {
            this.ribbonIcon.remove();
            this.ribbonIcon = undefined;
        }
    }

    private async safeShowUrlModal(): Promise<void> {
        await this.safeOperation(async () => {
            this.openYouTubeUrlModal();
        }, 'Show URL Modal');
    }

    private async safeOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T | null> {
        if (this.isUnloading) {
            this.logWarning(`Attempted ${operationName} during plugin unload - skipping`);
            return null;
        }

        const opId = ++this.operationCount;
        this.logInfo(`Starting operation ${opId}: ${operationName}`);

        try {
            const result = await operation();
            this.logInfo(`Completed operation ${opId}: ${operationName}`);
            return result;
        } catch (error) {
            this.logError(`Failed operation ${opId}: ${operationName}`, error as Error);
            ErrorHandler.handle(error as Error, operationName);
            return null;
        }
    }

    private openYouTubeUrlModal(): void {
        if (this.isUnloading) {
            ConflictPrevention.log('Plugin is unloading, ignoring modal request');
            return;
        }

        ConflictPrevention.safeOperation(async () => {
            // Provide available AI providers and model options to the modal for selection
            const aiService = this.serviceContainer?.aiService;
            const providers = aiService ? aiService.getProviderNames() : [];
            const modelOptionsMap: Record<string, string[]> = {};
            if (aiService) {
                for (const p of providers) {
                    modelOptionsMap[p] = aiService.getProviderModels(p) || [];
                }
            }

            new YouTubeUrlModal(this.app, {
                onProcess: this.processYouTubeVideo.bind(this),
                onOpenFile: this.openFileByPath.bind(this),
                providers,
                modelOptions: modelOptionsMap
            }).open();
        }, 'YouTube URL Modal').catch((error) => {
            ErrorHandler.handle(error as Error, 'Opening YouTube URL modal');
        });
    }

    private async processYouTubeVideo(url: string, format: OutputFormat = 'detailed-guide', providerName?: string, model?: string): Promise<string> {
        if (this.isUnloading) {
            ConflictPrevention.log('Plugin is unloading, cancelling video processing');
            throw new Error('Plugin is shutting down');
        }

        const result = await ConflictPrevention.safeOperation(async () => {
            new Notice(MESSAGES.PROCESSING);

            const validation = ValidationUtils.validateSettings(this.settings);
            if (!validation.isValid) {
                throw new Error(`Configuration invalid: ${validation.errors.join(', ')}`);
            }

            const youtubeService = this.serviceContainer!.videoService;
            const aiService = this.serviceContainer!.aiService;
            const fileService = this.serviceContainer!.fileService;
            const promptService = this.serviceContainer!.promptService;

            const videoId = youtubeService.extractVideoId(url);
            if (!videoId) {
                throw new Error(MESSAGES.ERRORS.VIDEO_ID_EXTRACTION);
            }

            const videoData = await youtubeService.getVideoData(videoId);
            const prompt = promptService.createAnalysisPrompt(videoData, url, format);
            let aiResponse;
            if (providerName) {
                // Use selected provider and optional model override
                aiResponse = await (aiService as any).processWith(providerName, prompt, model);
            } else {
                aiResponse = await aiService.process(prompt);
            }
            const formattedContent = promptService.processAIResponse(
                aiResponse.content,
                aiResponse.provider,
                aiResponse.model,
                format,
                videoData,
                url
            );

            const filePath = await fileService.saveToFile(
                videoData.title,
                formattedContent,
                this.settings.outputPath
            );

            new Notice(MESSAGES.SUCCESS(videoData.title));
            return filePath;
        }, 'YouTube Video Processing');

        if (!result) {
            throw new Error('Failed to process YouTube video');
        }

        return result;
    }

    private async openFileByPath(filePath: string): Promise<void> {
        try {
            await new Promise((resolve) => setTimeout(resolve, 300));
            const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
            const file = this.app.vault.getAbstractFileByPath(cleanPath);

            if (!file || !(file instanceof TFile)) {
                throw new Error(`File not found at path: ${cleanPath}`);
            }

            await this.openFileInNewTab(file);
        } catch (error) {
            ErrorHandler.handle(error as Error, 'Opening file by path');
            throw error;
        }
    }

    private async openFileInNewTab(file: TFile): Promise<void> {
        try {
            const leaf = this.app.workspace.getLeaf('tab') as WorkspaceLeaf;
            await leaf.openFile(file);
            this.app.workspace.setActiveLeaf(leaf);
            new Notice(`📂 Opened: ${file.name}`);
        } catch (error) {
            try {
                const currentLeaf = this.app.workspace.getLeaf(false);
                await currentLeaf.openFile(file);
                new Notice(`📂 Opened: ${file.name}`);
            } catch (fallbackError) {
                ErrorHandler.handle(fallbackError as Error, 'Opening file in current tab');
                new Notice(`Note saved as "${file.name}" but could not auto-open. Please open manually.`);
            }
        }
    }

    private showPersistentSaveConfirmation(file: TFile): void {
        try {
            const modal = new SaveConfirmationModal(this.app, file, (shouldOpen) => {
                if (shouldOpen) {
                    void this.openFileInNewTab(file);
                }
            });
            modal.open();
        } catch (error) {
            ErrorHandler.handle(error as Error, 'Showing save confirmation');
            new Notice(`File saved: ${file.name}. Click to open.`, 0).noticeEl.onclick = () => {
                void this.openFileInNewTab(file);
            };
        }
    }

    private async handleSettingsChange(newSettings: YouTubePluginSettings): Promise<void> {
        try {
            this.settings = { ...newSettings };
            await this.saveSettings();
            await this.serviceContainer?.updateSettings(this.settings);
        } catch (error) {
            ErrorHandler.handle(error as Error, 'Settings update');
            throw error;
        }
    }

    private async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    private async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    getServiceContainer(): ServiceContainer | undefined {
        return this.serviceContainer;
    }

    private logInfo(message: string): void {
        ConflictPrevention.log(`[INFO] ${message}`);
    }

    private logWarning(message: string): void {
        ConflictPrevention.log(`[WARN] ${message}`, 'warn');
    }

    private logError(message: string, error: Error): void {
        ConflictPrevention.log(`[ERROR] ${message}: ${error.message}`, 'error');
    }
}
