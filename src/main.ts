import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { ConflictPrevention } from './conflict-prevention';
import { MESSAGES } from './messages';
import { ValidationUtils } from './validation';
import { ErrorHandler } from './services/error-handler';
import { SaveConfirmationModal } from './save-confirmation-modal';
import { YouTubeUrlModal } from './youtube-url-modal';
import { YouTubeSettingsTab } from './settings-tab';
import { ServiceContainer } from './services/service-container';
import { OutputFormat, YouTubePluginSettings, PerformanceMode } from './types/types';

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
    // Track modal instances to prevent double opening
    private isModalOpen = false;
    private pendingModalUrl?: string;

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

            // Create a debounced URL handler to prevent cycles
            const pendingUrls = new Map<string, NodeJS.Timeout>();
            const URL_HANDLER_DELAY = 500;

            const isTempFile = (file: TFile, content: string): boolean => {
                // Check if this is a temporary file created by the Chrome extension
                // Be very strict to avoid treating processed video files as temp files

                // 1. Contains the hidden marker (most reliable) - ALWAYS accept
                if (content && content.includes(NOTE_MARKER)) {
                    return true;
                }

                // 2. File name matches the Chrome extension pattern EXACTLY
                if (file.name && file.name.startsWith('YouTube Clip -')) {
                    return true;
                }

                // 3. Content is ONLY a YouTube URL and file is very new/small AND NOT in output path
                const trimmedContent = content.trim();
                const lines = trimmedContent.split('\n').filter(line => line.trim().length > 0);
                const isUrlOnly = lines.length === 1 && ValidationUtils.isValidYouTubeUrl(lines[0]);

                if (isUrlOnly && content.length < 200) { // very small file
                    const fileAge = Date.now() - file.stat.ctime;
                    const isInOutputPath = file.path.includes(this.settings.outputPath);

                    // Only consider as temp file if:
                    // - Very recent (within 5 seconds for immediate detection)
                    // - AND NOT in the output path (to avoid processed video files)
                    if (fileAge < 5000 && !isInOutputPath) {
                        return true;
                    }
                }

                return false;
            };

            const handleUrlSafely = (url: string, source: string, filePath?: string, file?: TFile, content?: string) => {
                console.log(`YouTubeClipper: ${source} - handleUrlSafely called for URL:`, url, 'file:', filePath);

                // Additional safety check: only process if this appears to be a temp file
                if (file && content && !isTempFile(file, content)) {
                    console.warn(`YouTubeClipper: ${source} - REJECTING URL in non-temp file: ${filePath}`);

                    // Add specific reasons for rejection
                    const fileAge = Date.now() - file.stat.ctime;
                    const isInOutputPath = filePath?.includes(this.settings.outputPath);
                    const hasMarker = content.includes(NOTE_MARKER);
                    const hasClipPrefix = file.name?.startsWith('YouTube Clip -');

                    console.warn(`YouTubeClipper: ${source} - Rejection details: age=${fileAge}ms, inOutputPath=${isInOutputPath}, hasMarker=${hasMarker}, hasClipPrefix=${hasClipPrefix}`);
                    return;
                }

                if (this.handledTempFiles.has(url)) {
                    console.log(`YouTubeClipper: ${source} - URL already handled: ${url}, skipping`);
                    return;
                }

                // Cancel any pending handler for this URL
                if (pendingUrls.has(url)) {
                    console.log(`YouTubeClipper: ${source} - cancelling pending handler for URL:`, url);
                    clearTimeout(pendingUrls.get(url)!);
                }

                // Mark as handled immediately to prevent duplicates
                this.handledTempFiles.add(url);
                if (filePath) {
                    this.handledTempFiles.add(filePath);
                }
                console.log(`YouTubeClipper: ${source} - marked URL as handled:`, url);

                // Debounce to handle rapid-fire events
                const timeout = setTimeout(() => {
                    console.log(`YouTubeClipper: ${source} - DEBOUNCED: opening modal for URL: ${url}`);
                    console.log(`YouTubeClipper: ${source} - pendingUrls size before:`, pendingUrls.size);
                    console.log(`YouTubeClipper: ${source} - handledTempFiles size:`, this.handledTempFiles.size);

                    void this.safeShowUrlModal(url);
                    pendingUrls.delete(url);

                    console.log(`YouTubeClipper: ${source} - pendingUrls size after:`, pendingUrls.size);

                    // Clean up old entries to prevent memory leaks
                    if (this.handledTempFiles.size > 100) {
                        const entries = Array.from(this.handledTempFiles);
                        // Keep only the most recent 50 entries
                        this.handledTempFiles.clear();
                        entries.slice(-50).forEach(entry => this.handledTempFiles.add(entry));
                        console.log(`YouTubeClipper: ${source} - cleaned up handledTempFiles, new size:`, this.handledTempFiles.size);
                    }
                }, URL_HANDLER_DELAY);

                pendingUrls.set(url, timeout);
                console.log(`YouTubeClipper: ${source} - set timeout for URL:`, url, 'delay:', URL_HANDLER_DELAY);
            };

            this.registerEvent(this.app.vault.on('create', async (file) => {
                try {
                    if (!(file instanceof TFile)) return;
                    const content = await this.app.vault.read(file as TFile);

                    // First check: Is this a temporary file?
                    if (!isTempFile(file, content)) {
                        console.debug('YouTubeClipper: create handler - ignoring existing file:', file.path);
                        return;
                    }

                    // Extract URL from temporary file
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
                        console.debug('YouTubeClipper: create handler - no url extracted for temp file:', file.path);
                        return;
                    }

                    console.log('YouTubeClipper: CREATE EVENT - detected temp note', { path: file.path, url });
                    handleUrlSafely(url, 'create-handler', file.path, file, content);
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

                    // First check: Is this a temporary file?
                    if (!isTempFile(file, content)) {
                        console.debug('YouTubeClipper: active-leaf-change - ignoring existing file:', file.path);
                        return;
                    }

                    // Attempt URL extraction from temporary file
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
                        console.debug('YouTubeClipper: active-leaf-change - no url for temp file:', file.path);
                        return;
                    }

                    console.log('YouTubeClipper: ACTIVE-LEAF-CHANGE EVENT - detected temp note', { path: file.path, url });
                    handleUrlSafely(url, 'active-leaf-handler', file.path, file, content);
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
            // Reset modal state to prevent issues during unload
            this.isModalOpen = false;
            this.pendingModalUrl = undefined;

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
        // Use a reliable icon ID that should be available in Obsidian
        // Commonly available icons: 'video', 'play', 'film', 'monitor', 'globe', 'play-circle'
        this.ribbonIcon = this.addRibbonIcon('film', 'Process YouTube Video', () => {
            void this.safeShowUrlModal();
        });

        // Log that icon has been set for debugging
        console.log('YouTubeClipper: Ribbon icon set successfully');

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
        const callId = Math.random().toString(36).substr(2, 9);
        console.log(`YouTubeClipper [${callId}]: safeShowUrlModal called with URL:`, initialUrl);
        console.log(`YouTubeClipper [${callId}]: Current modal state - isModalOpen:`, this.isModalOpen, 'pendingModalUrl:', this.pendingModalUrl);

        await this.safeOperation(async () => {
            // Strong modal deduplication - prevent multiple modals from opening
            if (this.isModalOpen) {
                console.warn(`YouTubeClipper [${callId}]: MODAL ALREADY OPEN - IGNORING request for:`, initialUrl);
                console.warn(`YouTubeClipper [${callId}]: Current pending URL:`, this.pendingModalUrl);

                // If this is a different URL than the pending one, update it
                if (initialUrl && initialUrl !== this.pendingModalUrl) {
                    console.warn(`YouTubeClipper [${callId}]: Updating pending modal URL from:`, this.pendingModalUrl, 'to:', initialUrl);
                    this.pendingModalUrl = initialUrl;
                } else {
                    console.warn(`YouTubeClipper [${callId}]: Same URL as pending, completely ignoring`);
                }
                return;
            }

            // Mark that we're opening a modal
            console.log(`YouTubeClipper [${callId}]: Setting isModalOpen = true for URL:`, initialUrl);
            this.isModalOpen = true;
            this.pendingModalUrl = initialUrl;

            console.log(`YouTubeClipper [${callId}]: About to open YouTubeUrlModal for URL:`, initialUrl);
            this.openYouTubeUrlModal(initialUrl);

            // Add a check to see if modal state changes immediately
            setTimeout(() => {
                console.log(`YouTubeClipper [${callId}]: Modal state after 100ms - isModalOpen:`, this.isModalOpen);
            }, 100);
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

            const modal = new YouTubeUrlModal(this.app, {
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
                },
                // Performance settings from plugin settings
                performanceMode: this.settings.performanceMode || 'balanced',
                enableParallelProcessing: this.settings.enableParallelProcessing || false,
                preferMultimodal: this.settings.preferMultimodal || false,
                onPerformanceSettingsChange: async (performanceMode: any, enableParallel: boolean, preferMultimodal: boolean) => {
                    // Update plugin settings when changed in modal
                    this.settings.performanceMode = performanceMode;
                    this.settings.enableParallelProcessing = enableParallel;
                    this.settings.preferMultimodal = preferMultimodal;
                    await this.saveSettings();
                    // Reinitialize service container to apply new settings
                    this.serviceContainer = new ServiceContainer(this.settings, this.app);
                }
            });

            // Handle modal close to reset the modal state
            modal.onClose = () => {
                try {
                    console.log(`YouTubeClipper: Modal onClose triggered for URL:`, initialUrl);
                    console.log(`YouTubeClipper: Modal state before close - isModalOpen:`, this.isModalOpen, 'pendingModalUrl:', this.pendingModalUrl);

                    this.isModalOpen = false;
                    this.pendingModalUrl = undefined;

                    console.log(`YouTubeClipper: Modal state after close - isModalOpen:`, this.isModalOpen, 'pendingModalUrl:', this.pendingModalUrl);
                } catch (error) {
                    console.warn('YouTubeClipper: Error resetting modal state:', error);
                    // Force reset even if there's an error
                    this.isModalOpen = false;
                    this.pendingModalUrl = undefined;
                    console.log(`YouTubeClipper: Force reset modal state after error - isModalOpen:`, this.isModalOpen);
                }
            };

            // Fallback: Reset modal state after 10 seconds as a safety net
            setTimeout(() => {
                if (this.isModalOpen && this.pendingModalUrl === initialUrl) {
                    console.warn('YouTubeClipper: Fallback modal state reset triggered for URL:', initialUrl);
                    this.isModalOpen = false;
                    this.pendingModalUrl = undefined;
                    console.log('YouTubeClipper: Modal state after fallback reset - isModalOpen:', this.isModalOpen);
                }
            }, 10000);

            modal.open();
        }, 'YouTube URL Modal').catch((error) => {
            ErrorHandler.handle(error as Error, 'Opening YouTube URL modal');
        });
    }

    private async processYouTubeVideo(url: string, format: OutputFormat = 'detailed-guide', providerName?: string, model?: string, customPrompt?: string, performanceMode?: PerformanceMode, enableParallel?: boolean, preferMultimodal?: boolean): Promise<string> {
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

            console.log('AI Processing Debug:');
            console.log('- Provider selected:', providerName || 'Auto');
            console.log('- Model override:', model || 'Default');
            console.log('- Providers available:', aiService.getProviderNames());

            let aiResponse;
            try {
                if (providerName) {
                    // Use selected provider and optional model override
                    console.log(`Processing with provider: ${providerName}, model: ${model || 'default'}`);
                    aiResponse = await (aiService as any).processWith(providerName, prompt, model);
                } else {
                    console.log('Processing with auto-selected provider');
                    aiResponse = await aiService.process(prompt);
                }
                console.log('AI Response received:', {
                    provider: aiResponse.provider,
                    model: aiResponse.model,
                    contentLength: aiResponse.content?.length || 0
                });
            } catch (error) {
                console.error('AI Processing failed:', error);
                throw error;
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
