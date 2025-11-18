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
    environmentPrefix: 'YTC',
    // Performance settings with smart defaults
    performanceMode: 'balanced',
    enableParallelProcessing: true,
    preferMultimodal: true
};

export default class YoutubeClipperPlugin extends Plugin {
    private settings: YouTubePluginSettings = DEFAULT_SETTINGS;
    private serviceContainer?: ServiceContainer;
    private ribbonIcon?: HTMLElement;
    private isUnloading = false;
    private operationCount = 0;
    // Track temp notes we've already handled to avoid duplicate modal opens
    private handledTempFiles: Set<string> = new Set();

    async onload(): Promise<void> {
        this.logInfo('Initializing YoutubeClipper Plugin v1.2.0...');
        const conflicts = ConflictPrevention.checkForPotentialConflicts();
        if (conflicts.length > 0) {
            this.logWarning(`Potential conflicts detected but proceeding: ${conflicts.join(', ')}`);
        }

        try {
            await this.loadSettings();
            await this.initializeServices();
            this.registerUIComponents();

            // Listen for notes created via Obsidian URI. The extension appends a
            // hidden marker to created notes so we can reliably detect them.
            const NOTE_MARKER = '<!-- ytc-extension:youtube-clipper -->';
            this.registerEvent(this.app.vault.on('create', async (file) => {
                try {
                    if (!(file instanceof TFile)) return;
                    const content = await this.app.vault.read(file as TFile);

                    // Heuristics to detect temporary notes created by the Chrome extension:
                    // - Contains the hidden marker, OR
                    // - File name starts with the known prefix, OR
                    // - The entire file content is a single YouTube URL (common when Obsidian
                    //   opens an existing file or strips comments).
                    let url: string | null = null;

                    if (content && content.includes(NOTE_MARKER)) {
                        url = content.replace(NOTE_MARKER, '').trim();
                    } else {
                        // Try to find the first YouTube URL anywhere in the content
                        const maybe = (content || '').trim();
                        // Regex to capture common YouTube watch URLs and youtu.be links
                        const ytRegex = /(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]{6,}|https?:\/\/(?:www\.)?youtu\.be\/[A-Za-z0-9_-]{6,})/i;
                        const m = maybe.match(ytRegex);
                        if (m && m[1]) {
                            url = m[1].trim();
                        } else if (file.name && file.name.startsWith('YouTube Clip -')) {
                            // fallback: if filename matches and content is a single token possibly URL
                            const single = maybe.split('\n').map(s => s.trim()).find(Boolean) || '';
                            if (ValidationUtils.isValidYouTubeUrl(single)) url = single;
                        }
                    }

                    if (!url) {
                        console.debug('YouTubeClipper: create handler - no url extracted for', file.path);
                        return;
                    }

                    console.debug('YouTubeClipper: detected temp note', { path: file.path, url });

                    // Defer slightly so the UI settles, then open the modal with the URL
                    setTimeout(() => {
                        console.debug('YouTubeClipper: opening modal for', url);
                        void this.safeShowUrlModal(url!);
                        // Keep the temporary note for debugging. Do not delete it here.
                    }, 300);
                } catch (e) {
                    // swallow; non-critical
                }
            }));

            // Also listen for when a file becomes active (opened). Some Obsidian
            // URL flows create the file and immediately open it; detecting the
            // active leaf ensures we catch notes created without firing a create
            // event in time for our handler.
            this.registerEvent(this.app.workspace.on('active-leaf-change', async () => {
                try {
                    const file = this.app.workspace.getActiveFile();
                    if (!file || !(file instanceof TFile)) return;
                    if (this.handledTempFiles.has(file.path)) return;

                    const content = await this.app.vault.read(file as TFile);

                    // Attempt same URL extraction logic as create handler
                    let url: string | null = null;
                    if (content && content.includes(NOTE_MARKER)) {
                        url = content.replace(NOTE_MARKER, '').trim();
                    } else {
                        const maybe = (content || '').trim();
                        const ytRegex = /(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]{6,}|https?:\/\/(?:www\.)?youtu\.be\/[A-Za-z0-9_-]{6,})/i;
                        const m = maybe.match(ytRegex);
                        if (m && m[1]) {
                            url = m[1].trim();
                        } else if (file.name && file.name.startsWith('YouTube Clip -')) {
                            const single = maybe.split('\n').map(s => s.trim()).find(Boolean) || '';
                            if (ValidationUtils.isValidYouTubeUrl(single)) url = single;
                        }
                    }

                    if (!url) {
                        console.debug('YouTubeClipper: active-leaf-change - no url for', file.path);
                        return;
                    }

                    console.debug('YouTubeClipper: active-leaf-change detected temp note', { path: file.path, url });
                    this.handledTempFiles.add(file.path);

                    // Open modal (don't delete the temp note automatically)
                    setTimeout(() => {
                        console.debug('YouTubeClipper: opening modal (active-leaf) for', url);
                        void this.safeShowUrlModal(url!);
                    }, 250);
                } catch (e) {
                    // ignore
                }
            }));

            this.logInfo('YoutubeClipper Plugin loaded successfully');
            // Register a custom protocol handler so external apps (or the
            // Chrome extension) can open an URI like:
            // obsidian://youtube-clipper?vault=VAULT&url=<videoUrl>
            try {
                // `registerObsidianProtocolHandler` is available in Obsidian's
                // Plugin API. It gives us a clean way to receive a URL directly
                // from the extension without creating temporary notes.
                // The handler receives a params object with query parameters.
                // Example invocation: obsidian://youtube-clipper?vault=MyVault&url=<encoded>
                // We'll open the modal with the provided URL.
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.registerObsidianProtocolHandler?.('youtube-clipper', (params: Record<string, string>) => {
                    try {
                        const url = params.url || params.content || params.path || '';
                        if (url && ValidationUtils.isValidYouTubeUrl(url)) {
                            // Defer into the plugin main loop
                            setTimeout(() => {
                                void this.safeShowUrlModal(url);
                            }, 200);
                        } else {
                            console.debug('YouTubeClipper: protocol handler received no valid url', params);
                        }
                    } catch (e) {
                        console.warn('YouTubeClipper: protocol handler error', e);
                    }
                });
            } catch (e) {
                // Not fatal if API missing
            }
        } catch (error) {
            this.logError('Failed to load plugin', error as Error);
            ErrorHandler.handle(error as Error, 'Plugin initialization');
            new Notice('Failed to load YoutubeClipper Plugin. Check console for details.');
        }
    }

    onunload(): void {
        this.logInfo('Unloading YoutubeClipper Plugin...');
        this.isUnloading = true;

        try {
            this.serviceContainer?.clearServices();
            this.cleanupUIElements();
            ConflictPrevention.cleanupAllElements();
            this.logInfo('YoutubeClipper Plugin unloaded successfully');
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

        // Command used by Advanced URI or other external callers. This command
        // reads the clipboard (the Chrome extension copies the URL there) and
        // opens the YouTube URL modal with that URL. This allows the extension
        // to invoke the command without passing args.
        this.addCommand({
            id: `${PLUGIN_PREFIX}-open-url-from-clipboard`,
            name: 'YouTube Clipper: Open URL Modal (from clipboard)',
            callback: async () => {
                try {
                    // Try clipboard first
                    let text = '';
                    try {
                        // navigator.clipboard may not be available in all hosts
                        // (but usually is in Obsidian renderer).
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        if (navigator && navigator.clipboard && navigator.clipboard.readText) {
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            text = (await navigator.clipboard.readText()) || '';
                        }
                    } catch (e) {
                        text = '';
                    }

                    if (text && ValidationUtils.isValidYouTubeUrl(text.trim())) {
                        void this.safeShowUrlModal(text.trim());
                        return;
                    }

                    // No valid URL on clipboard — prompt the user to paste one.
                    // Use a simple prompt since this is a fallback path.
                    // eslint-disable-next-line no-alert
                    const manual = window.prompt('Paste YouTube URL to open in YouTube Clipper:');
                    if (manual && ValidationUtils.isValidYouTubeUrl(manual.trim())) {
                        void this.safeShowUrlModal(manual.trim());
                    } else {
                        new Notice('No valid YouTube URL provided.');
                    }
                } catch (error) {
                    ErrorHandler.handle(error as Error, 'Open URL from clipboard');
                }
            }
        });
    }

    private cleanupUIElements(): void {
        if (this.ribbonIcon) {
            this.ribbonIcon.remove();
            this.ribbonIcon = undefined;
        }
    }

    private async safeShowUrlModal(initialUrl?: string): Promise<void> {
        await this.safeOperation(async () => {
            this.openYouTubeUrlModal(initialUrl);
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

    private openYouTubeUrlModal(initialUrl?: string): void {
        if (this.isUnloading) {
            ConflictPrevention.log('Plugin is unloading, ignoring modal request');
            return;
        }

        ConflictPrevention.safeOperation(async () => {
            // Provide available AI providers and model options to the modal for selection
            const aiService = this.serviceContainer?.aiService;
            const providers = aiService ? aiService.getProviderNames() : [];
            // Prefer cached model options from settings if available
            const modelOptionsMap: Record<string, string[]> = this.settings.modelOptionsCache || {};
            if (aiService && (!this.settings.modelOptionsCache || Object.keys(this.settings.modelOptionsCache).length === 0)) {
                for (const p of providers) {
                    modelOptionsMap[p] = aiService.getProviderModels(p) || [];
                }
            }

            new YouTubeUrlModal(this.app, {
                onProcess: this.processYouTubeVideo.bind(this),
                onOpenFile: this.openFileByPath.bind(this),
                initialUrl: initialUrl,
                providers,
                modelOptions: modelOptionsMap,
                fetchModels: async () => {
                    // Ask the aiService to try to fetch latest models for all providers
                    try {
                        const map = await (this.serviceContainer!.aiService as any).fetchLatestModels();
                        // Persist to settings so future modal opens use cached lists
                        this.settings.modelOptionsCache = map;
                        await this.saveSettings();
                        return map;
                    } catch (error) {
                        return modelOptionsMap;
                    }
                }
            }).open();
        }, 'YouTube URL Modal').catch((error) => {
            ErrorHandler.handle(error as Error, 'Opening YouTube URL modal');
        });
    }

    private async processYouTubeVideo(url: string, format: OutputFormat = 'detailed-guide', providerName?: string, model?: string, customPrompt?: string): Promise<string> {
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
            // For 'custom' format, use the provided custom prompt; otherwise check settings
            let promptToUse: string | undefined;
            if (format === 'custom') {
                promptToUse = customPrompt;
            } else {
                promptToUse = this.settings.customPrompts?.[format];
            }
            const prompt = promptService.createAnalysisPrompt(videoData, url, format, promptToUse);
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
