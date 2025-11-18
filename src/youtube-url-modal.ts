/**
 * YouTube URL input modal component
 */

import { App, Notice } from 'obsidian';
import { BaseModal } from './base-modal';
import { MESSAGES } from './messages';
import { PROVIDER_MODEL_OPTIONS, AI_MODELS } from './api';
import { ValidationUtils } from './validation';
import { ErrorHandler } from './services/error-handler';
import { OutputFormat, PerformanceMode } from './types/types';

export interface YouTubeUrlModalOptions {
    onProcess: (url: string, format: OutputFormat, provider?: string, model?: string, customPrompt?: string, performanceMode?: PerformanceMode, enableParallel?: boolean, preferMultimodal?: boolean) => Promise<string>; // Return file path
    onOpenFile?: (filePath: string) => Promise<void>;
    initialUrl?: string;
    providers?: string[]; // available provider names
    modelOptions?: Record<string, string[]>; // mapping providerName -> models
    defaultProvider?: string;
    defaultModel?: string;
    fetchModels?: () => Promise<Record<string, string[]>>;
    // Performance settings from plugin settings
    performanceMode?: PerformanceMode;
    enableParallelProcessing?: boolean;
    preferMultimodal?: boolean;
    onPerformanceSettingsChange?: (performanceMode: PerformanceMode, enableParallel: boolean, preferMultimodal: boolean) => Promise<void>;
}

type StepState = 'pending' | 'active' | 'complete' | 'error';

export class YouTubeUrlModal extends BaseModal {
    private url = '';
    private format: OutputFormat = 'executive-summary';
    private headerEl?: HTMLHeadingElement;
    private urlInput?: HTMLInputElement;
    private pasteButton?: HTMLButtonElement;
    private clearButton?: HTMLButtonElement;
    private processButton?: HTMLButtonElement;
    private openButton?: HTMLButtonElement;
    private thumbnailEl?: HTMLImageElement;
    private metadataContainer?: HTMLDivElement;
    private fetchInProgress = false;
    private providerSelect?: HTMLSelectElement;
    private modelSelect?: HTMLSelectElement;
    private refreshSpinner?: HTMLSpanElement;
    private selectedProvider?: string;
    private selectedModel?: string;
    private progressContainer?: HTMLDivElement;
    private progressBar?: HTMLDivElement;
    private progressText?: HTMLDivElement;
    private validationMessage?: HTMLDivElement;
    private progressSteps: { label: string; element: HTMLLIElement }[] = [];
    private currentStepIndex = 0;
    private isProcessing = false;
    private processedFilePath?: string;
    private customPromptInput?: HTMLTextAreaElement;
    private customPromptContainer?: HTMLDivElement;

    // Performance settings
    private performanceMode: PerformanceMode = 'balanced';
    private enableParallelProcessing = false;
    private preferMultimodal = false;
    private performanceModeSelect?: HTMLSelectElement;
    private parallelToggle?: HTMLInputElement;
    private multimodalToggle?: HTMLInputElement;

    // Performance optimization: debounced validation
    private validationTimer?: number;
    private lastValidUrl?: string;
    private lastValidResult?: boolean;

    constructor(
        app: App,
        private options: YouTubeUrlModalOptions
    ) {
        super(app);

        this.url = options.initialUrl || '';

        // Initialize performance settings from options
        this.performanceMode = options.performanceMode || 'balanced';
        this.enableParallelProcessing = options.enableParallelProcessing || false;
        this.preferMultimodal = options.preferMultimodal || false;
    }

    onOpen(): void {
        this.createModalContent();
        this.setupEventHandlers();
        // If an initial URL was provided, validate and focus the appropriate control
        if (this.options.initialUrl) {
            // Prevent cycles - if the URL is already being processed, don't reprocess
            if (this.url.trim() === this.options.initialUrl.trim()) {
                console.debug('YouTubeUrlModal: Same URL already set, preventing cycle');
            } else {
                this.setUrl(this.options.initialUrl);
            }

            this.updateProcessButtonState();
            const isValid = ValidationUtils.isValidYouTubeUrl((this.options.initialUrl || '').trim());
            if (isValid && this.processButton) {
                this.processButton.focus();
                return;
            }
        }
        this.focusUrlInput();
    }

    /**
     * Create modal content
     */
    private createModalContent(): void {
        this.headerEl = this.createHeader(MESSAGES.MODALS.PROCESS_VIDEO);
        this.createUrlInputSection();
        this.createPerformanceSection();
        this.createFormatSelectionSection();
        this.createProviderSelectionSection();
        this.createProgressSection();
        this.createActionButtons();
    }

    /**
     * Create compact performance and speed settings section
     */
    private createPerformanceSection(): void {
        const container = this.contentEl.createDiv();
        container.className = 'ytc-performance-section';
        container.style.marginTop = '12px';
        container.style.padding = '10px';
        container.style.backgroundColor = 'var(--background-secondary)';
        container.style.borderRadius = '6px';
        container.style.border = '1px solid var(--interactive-accent)';

        // Compact header
        const headerContainer = container.createDiv();
        headerContainer.style.display = 'flex';
        headerContainer.style.alignItems = 'center';
        headerContainer.style.justifyContent = 'space-between';
        headerContainer.style.marginBottom = '10px';

        const sectionHeader = headerContainer.createEl('h3');
        sectionHeader.textContent = '⚡ Performance';
        sectionHeader.style.margin = '0';
        sectionHeader.style.fontSize = '0.9rem';
        sectionHeader.style.fontWeight = '600';
        sectionHeader.style.color = 'var(--text-accent)';
        sectionHeader.style.display = 'flex';
        sectionHeader.style.alignItems = 'center';
        sectionHeader.style.gap = '6px';

        // Compact performance mode selection
        const modeContainer = container.createDiv();
        modeContainer.style.marginBottom = '8px';

        this.performanceModeSelect = modeContainer.createEl('select');
        this.performanceModeSelect.style.width = '100%';
        this.performanceModeSelect.style.padding = '6px 8px';
        this.performanceModeSelect.style.borderRadius = '4px';
        this.performanceModeSelect.style.border = '1px solid var(--background-modifier-border)';
        this.performanceModeSelect.style.backgroundColor = 'var(--background-primary)';
        this.performanceModeSelect.style.color = 'var(--text-normal)';
        this.performanceModeSelect.style.fontSize = '0.85rem';
        this.performanceModeSelect.style.cursor = 'pointer';

        // Compact options
        const fastOption = this.performanceModeSelect.createEl('option');
        fastOption.value = 'fast';
        fastOption.textContent = '⚡ Fast (10-30s)';

        const balancedOption = this.performanceModeSelect.createEl('option');
        balancedOption.value = 'balanced';
        balancedOption.textContent = '⚖️ Balanced (30-60s)';

        const qualityOption = this.performanceModeSelect.createEl('option');
        qualityOption.value = 'quality';
        qualityOption.textContent = '🎯 Quality (60-120s)';

        this.performanceModeSelect.value = this.performanceMode;
        this.performanceModeSelect.addEventListener('change', () => {
            this.performanceMode = this.performanceModeSelect!.value as PerformanceMode;
            this.handlePerformanceSettingsChange();
        });

        // Compact toggles
        const togglesContainer = container.createDiv();
        togglesContainer.style.display = 'flex';
        togglesContainer.style.gap = '16px';
        togglesContainer.style.marginTop = '6px';

        // Compact parallel toggle
        const parallelContainer = togglesContainer.createDiv();
        const parallelLabel = parallelContainer.createEl('label');
        parallelLabel.style.display = 'flex';
        parallelLabel.style.alignItems = 'center';
        parallelLabel.style.gap = '4px';
        parallelLabel.style.fontSize = '0.8rem';
        parallelLabel.style.cursor = 'pointer';
        parallelLabel.style.color = 'var(--text-normal)';

        const parallelToggle = parallelLabel.createEl('input');
        parallelToggle.type = 'checkbox';
        parallelToggle.id = 'parallel-toggle';
        parallelToggle.checked = this.enableParallelProcessing;
        parallelToggle.addEventListener('change', () => {
            this.enableParallelProcessing = parallelToggle.checked;
            this.handlePerformanceSettingsChange();
        });

        parallelLabel.appendChild(document.createTextNode('🔄 Parallel'));
        parallelContainer.appendChild(parallelLabel);

        // Compact multimodal toggle
        const multimodalContainer = togglesContainer.createDiv();
        const multimodalLabel = multimodalContainer.createEl('label');
        multimodalLabel.style.display = 'flex';
        multimodalLabel.style.alignItems = 'center';
        multimodalLabel.style.gap = '4px';
        multimodalLabel.style.fontSize = '0.8rem';
        multimodalLabel.style.cursor = 'pointer';
        multimodalLabel.style.color = 'var(--text-normal)';

        const multimodalToggle = multimodalLabel.createEl('input');
        multimodalToggle.type = 'checkbox';
        multimodalToggle.id = 'multimodal-toggle';
        multimodalToggle.checked = this.preferMultimodal;
        multimodalToggle.addEventListener('change', () => {
            this.preferMultimodal = multimodalToggle.checked;
            this.handlePerformanceSettingsChange();
        });

        multimodalLabel.appendChild(document.createTextNode('🎥 Multimodal'));
        multimodalContainer.appendChild(multimodalLabel);
    }

    /**
     * Create enhanced performance toggle component
     */
    private createPerformanceToggle(container: HTMLElement, id: string, icon: string, label: string, checked: boolean, onChange: (checked: boolean) => void, description: string): void {
        const toggleContainer = container.createDiv();
        toggleContainer.style.padding = '12px';
        toggleContainer.style.backgroundColor = 'var(--background-primary)';
        toggleContainer.style.borderRadius = '6px';
        toggleContainer.style.border = '1px solid var(--background-modifier-border)';
        toggleContainer.style.transition = 'all 0.2s ease';
        toggleContainer.style.cursor = 'pointer';

        const toggleHeader = toggleContainer.createDiv();
        toggleHeader.style.display = 'flex';
        toggleHeader.style.alignItems = 'center';
        toggleHeader.style.justifyContent = 'space-between';
        toggleHeader.style.marginBottom = '4px';

        const labelContainer = toggleHeader.createEl('div');
        labelContainer.style.display = 'flex';
        labelContainer.style.alignItems = 'center';
        labelContainer.style.gap = '8px';

        const iconSpan = labelContainer.createEl('span');
        iconSpan.textContent = icon;
        iconSpan.style.fontSize = '1rem';

        const labelText = labelContainer.createEl('span');
        labelText.textContent = label;
        labelText.style.fontWeight = '500';
        labelText.style.color = 'var(--text-normal)';

        const toggle = toggleContainer.createEl('input');
        toggle.type = 'checkbox';
        toggle.id = id;
        toggle.checked = checked;
        toggle.style.width = '20px';
        toggle.style.height = '20px';
        toggle.style.cursor = 'pointer';

        const descriptionText = toggleContainer.createEl('div');
        descriptionText.textContent = description;
        descriptionText.style.fontSize = '0.8rem';
        descriptionText.style.color = 'var(--text-muted)';
        descriptionText.style.marginTop = '4px';
        descriptionText.style.lineHeight = '1.3';

        // Add hover effects
        toggleContainer.addEventListener('mouseenter', () => {
            toggleContainer.style.backgroundColor = 'var(--background-modifier-hover)';
            toggleContainer.style.borderColor = 'var(--interactive-accent)';
            toggleContainer.style.transform = 'translateY(-2px)';
            toggleContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        });

        toggleContainer.addEventListener('mouseleave', () => {
            toggleContainer.style.backgroundColor = 'var(--background-primary)';
            toggleContainer.style.borderColor = 'var(--background-modifier-border)';
            toggleContainer.style.transform = 'translateY(0)';
            toggleContainer.style.boxShadow = 'none';
        });

        toggle.addEventListener('change', () => onChange(toggle.checked));
    }

    /**
     * Add performance preview with mode descriptions
     */
    private addPerformancePreview(container: HTMLElement): void {
        const previewContainer = container.createDiv();
        previewContainer.style.marginTop = '16px';
        previewContainer.style.padding = '12px';
        previewContainer.style.backgroundColor = 'var(--background-modifier-hover)';
        previewContainer.style.borderRadius = '6px';
        previewContainer.style.border = '1px dashed var(--interactive-accent)';

        const previewTitle = previewContainer.createEl('div');
        previewTitle.textContent = '📋 Current Configuration';
        previewTitle.style.fontWeight = '600';
        previewTitle.style.marginBottom = '8px';
        previewTitle.style.color = 'var(--text-accent)';

        const previewText = previewContainer.createEl('div');
        previewText.className = 'ytc-performance-preview';
        previewText.style.fontSize = '0.85rem';
        previewText.style.lineHeight = '1.4';
        previewText.style.color = 'var(--text-muted)';
        this.updatePerformancePreview(previewText);
    }

    /**
     * Update performance preview text
     */
    private updatePerformancePreview(previewElement: HTMLDivElement): void {
        const modeText = this.performanceMode === 'fast' ? '⚡ Fast Mode' :
                      this.performanceMode === 'balanced' ? '⚖️ Balanced Mode' : '🎯 Quality Mode';
        const parallelText = this.enableParallelProcessing ? '🔄 Enabled' : '⏸️ Disabled';
        const multimodalText = this.preferMultimodal ? '🎥 Enabled' : '📄 Text Only';

        previewElement.innerHTML = `
            <strong>Mode:</strong> ${modeText}<br>
            <strong>Parallel Processing:</strong> ${parallelText}<br>
            <strong>Multimodal Analysis:</strong> ${multimodalText}
        `;
    }

    /**
     * Add subtle animation when performance mode changes
     */
    private addPerformanceModeAnimation(): void {
        const previewElement = document.querySelector('.ytc-performance-preview') as HTMLDivElement;
        if (previewElement) {
            previewElement.style.transition = 'all 0.3s ease';
            previewElement.style.transform = 'scale(1.02)';
            setTimeout(() => {
                previewElement.style.transform = 'scale(1)';
            }, 200);
        }
    }

    /**
     * Handle performance settings change
     */
    private async handlePerformanceSettingsChange(): Promise<void> {
        if (this.options.onPerformanceSettingsChange) {
            await this.options.onPerformanceSettingsChange(
                this.performanceMode,
                this.enableParallelProcessing,
                this.preferMultimodal
            );
        }
    }

    private createProviderSelectionSection(): void {
        const container = this.contentEl.createDiv();
        container.style.marginTop = '10px';
        const label = container.createEl('label', { text: 'AI Provider & Model:' });
        label.setAttribute('for', 'ytc-provider-select');

        const row = container.createDiv();
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.alignItems = 'center';

        // Provider select with accessibility
        this.providerSelect = document.createElement('select');
        this.providerSelect.id = 'ytc-provider-select';
        this.providerSelect.setAttribute('aria-label', 'AI Provider');
        this.providerSelect.style.flex = '1';
        this.providerSelect.style.padding = '6px';
        this.providerSelect.style.borderRadius = '6px';
        this.providerSelect.style.border = '1px solid var(--background-modifier-border)';
        row.appendChild(this.providerSelect);

        // Model select with accessibility
        this.modelSelect = document.createElement('select');
        this.modelSelect.id = 'ytc-model-select';
        this.modelSelect.setAttribute('aria-label', 'AI Model');
        this.modelSelect.style.width = '220px';
        this.modelSelect.style.padding = '6px';
        this.modelSelect.style.borderRadius = '6px';
        this.modelSelect.style.border = '1px solid var(--background-modifier-border)';
        row.appendChild(this.modelSelect);

        // Populate providers if provided via options
        const providers = this.options.providers || [];
        const modelOptions = this.options.modelOptions || {};

        // Add an explicit 'Auto (fallback order)' option
        const autoOpt = document.createElement('option');
        autoOpt.value = '';
        autoOpt.text = 'Auto (fallback)';
        this.providerSelect.appendChild(autoOpt);

        providers.forEach((p) => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.text = p;
            this.providerSelect!.appendChild(opt);
        });

        // Refresh models button
        const refreshBtn = this.createInlineButton(row, 'Refresh models', () => {
            void this.handleRefreshModels();
        });

        // Inline spinner next to refresh button
        this.refreshSpinner = document.createElement('span');
        this.refreshSpinner.style.display = 'none';
        this.refreshSpinner.style.marginLeft = '8px';
        this.refreshSpinner.style.width = '16px';
        this.refreshSpinner.style.height = '16px';
        this.refreshSpinner.style.border = '2px solid var(--background-modifier-border)';
        this.refreshSpinner.style.borderTop = '2px solid var(--interactive-accent)';
        this.refreshSpinner.style.borderRadius = '50%';
        this.refreshSpinner.style.animation = 'ytp-spin 1s linear infinite';
        row.appendChild(this.refreshSpinner);

        // Wire change handler
        this.providerSelect.addEventListener('change', () => {
            this.selectedProvider = this.providerSelect!.value || undefined;
            this.populateModelsForProvider(this.selectedProvider || '', modelOptions, this.options.defaultModel);
        });

        // Set defaults
        if (this.options.defaultProvider) {
            this.providerSelect.value = this.options.defaultProvider;
            this.selectedProvider = this.options.defaultProvider;
        }

        // Populate models for initial provider selection (or empty)
        this.populateModelsForProvider(this.selectedProvider || '', modelOptions, this.options.defaultModel);
    }

    private async handleRefreshModels(): Promise<void> {
        if (!this.options.fetchModels) {
            this.setValidationMessage('Model refresh not available.', 'error');
            return;
        }

        this.setValidationMessage('Refreshing model lists…', 'info');
        // show spinner
        if (this.refreshSpinner) this.refreshSpinner.style.display = 'inline-block';
        // disable refresh to avoid double clicks
        try {
            const map = await this.options.fetchModels();
            // update provider list if changed
            const providers = Object.keys(map);
            if (this.providerSelect) {
                // preserve current selection
                const current = this.providerSelect.value;
                this.providerSelect.innerHTML = '';
                const autoOpt = document.createElement('option');
                autoOpt.value = '';
                autoOpt.text = 'Auto (fallback)';
                this.providerSelect.appendChild(autoOpt);
                providers.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.text = p;
                    this.providerSelect!.appendChild(opt);
                });
                if (current && Array.from(this.providerSelect.options).some(o => o.value === current)) {
                    this.providerSelect.value = current;
                    this.selectedProvider = current;
                }
            }

            // update modelOptions and repopulate for selected provider
            const modelOptions = map;
            this.populateModelsForProvider(this.selectedProvider || '', modelOptions, this.options.defaultModel);
            this.setValidationMessage('Model lists refreshed.', 'success');
        } catch (error) {
            this.setValidationMessage('Failed to refresh models. Using cached options.', 'error');
        } finally {
            if (this.refreshSpinner) this.refreshSpinner.style.display = 'none';
        }
    }

    private populateModelsForProvider(providerName: string, modelOptions: Record<string, string[]>, defaultModel?: string): void {
        if (!this.modelSelect) return;
        // Clear existing
        this.modelSelect.innerHTML = '';

        const models = modelOptions[providerName] || [];
        if (models.length === 0) {
            // Add a single option indicating provider default
            const opt = document.createElement('option');
            opt.value = '';
            opt.text = 'Default model';
            this.modelSelect.appendChild(opt);
            this.selectedModel = '';
            return;
        }

        models.forEach((m) => {
            const opt = document.createElement('option');
            opt.value = m;
            // If we have metadata in PROVIDER_MODEL_OPTIONS, show a small badge
            let label = m;
            try {
                const providerModels = PROVIDER_MODEL_OPTIONS[providerName] || [] as any[];
                const match = providerModels.find(pm => {
                    const name = typeof pm === 'string' ? pm : (pm && pm.name ? pm.name : '');
                    return String(name).toLowerCase() === String(m).toLowerCase();
                }) as any | undefined;
                if (match && match.supportsAudioVideo) {
                    label = `${m}  🎥`; // small camera emoji indicates multimodal-capable
                    opt.title = 'Supports multimodal audio/video tokens';
                }
            } catch (err) {
                // ignore and fall back to plain label
            }
            opt.text = label;
            this.modelSelect!.appendChild(opt);
        });

        if (defaultModel && models.includes(defaultModel)) {
            this.modelSelect.value = defaultModel;
            this.selectedModel = defaultModel;
        } else {
            this.modelSelect.selectedIndex = 0;
            this.selectedModel = this.modelSelect.value;
        }

        this.modelSelect.addEventListener('change', () => {
            this.selectedModel = this.modelSelect!.value;
        });
    }

    /**
     * Create URL input section
     */
    private createUrlInputSection(): void {
        const container = this.contentEl.createDiv();
        const label = container.createEl('label', { text: 'YouTube URL:' });
        label.setAttribute('for', 'ytc-url-input');
        
        const inputRow = container.createDiv();
        inputRow.style.display = 'flex';
        inputRow.style.gap = '8px';
        inputRow.style.alignItems = 'center';
        
        this.urlInput = this.createInput(
            inputRow,
            'url',
            MESSAGES.PLACEHOLDERS.YOUTUBE_URL + ' (Press Enter to process)'
        );
        this.urlInput.id = 'ytc-url-input';
        this.urlInput.setAttribute('aria-label', 'YouTube URL');
        this.urlInput.setAttribute('aria-describedby', 'ytc-url-hint');
        this.urlInput.style.flex = '1';
        this.urlInput.style.transition = 'border-color 0.2s ease, box-shadow 0.2s ease';
        
        this.pasteButton = this.createInlineButton(inputRow, 'Paste', () => {
            void this.handlePasteFromClipboard();
        });
        this.pasteButton.setAttribute('aria-label', 'Paste YouTube URL from clipboard');
        
        this.clearButton = this.createInlineButton(inputRow, 'Clear', () => {
            this.handleClearUrl();
        });
        this.clearButton.setAttribute('aria-label', 'Clear YouTube URL input');
        
        // Set initial value if provided
        if (this.options.initialUrl) {
            this.urlInput.value = this.options.initialUrl;
            this.url = this.options.initialUrl;
        }

        // Update URL state on input
        this.urlInput.addEventListener('input', (e) => {
            this.url = (e.target as HTMLInputElement).value;
            this.updateProcessButtonState();
            this.updateQuickActionsState();
        });

        this.validationMessage = container.createDiv();
        this.validationMessage.id = 'ytc-url-hint';
        this.validationMessage.style.marginTop = '6px';
        this.validationMessage.style.fontSize = '0.85rem';
        this.validationMessage.style.color = 'var(--text-muted)';
        this.validationMessage.setAttribute('role', 'status');
        this.setValidationMessage('Paste a YouTube link to begin processing.', 'info');

    // Preview container (thumbnail + metadata)
    const preview = container.createDiv();
    preview.style.display = 'flex';
    preview.style.gap = '8px';
    preview.style.alignItems = 'center';
    preview.style.marginTop = '6px';

    this.thumbnailEl = preview.createEl('img');
    this.thumbnailEl.setAttribute('aria-label', 'Video thumbnail');
    this.thumbnailEl.style.width = '90px';
    this.thumbnailEl.style.height = '50px';
    this.thumbnailEl.style.objectFit = 'cover';
    this.thumbnailEl.style.borderRadius = '4px';
    this.thumbnailEl.style.display = 'none';

    this.metadataContainer = preview.createDiv();
    this.metadataContainer.setAttribute('aria-label', 'Video metadata');
    this.metadataContainer.style.display = 'none';
    this.metadataContainer.style.fontSize = '0.9rem';
    this.metadataContainer.style.color = 'var(--text-normal)';
    this.metadataContainer.createDiv({ cls: 'yt-preview-title' });
    this.metadataContainer.createDiv({ cls: 'yt-preview-channel' });

        this.setUrlInputState('idle');
        this.updateQuickActionsState();
    }

    /**
     * Create compact format selection section
     */
    private createFormatSelectionSection(): void {
        const container = this.contentEl.createDiv();
        container.className = 'ytc-format-section';
        container.style.marginTop = '12px';
        container.style.padding = '8px';
        container.style.backgroundColor = 'var(--background-secondary)';
        container.style.borderRadius = '6px';
        container.style.border = '1px solid var(--background-modifier-border)';

        const label = container.createEl('label', { text: '📝 Format' });
        label.id = 'format-group-label';
        label.style.display = 'block';
        label.style.marginBottom = '8px';
        label.style.fontSize = '0.9rem';
        label.style.fontWeight = '600';
        label.style.color = 'var(--text-normal)';

        const radioContainer = container.createDiv();
        radioContainer.setAttribute('role', 'group');
        radioContainer.setAttribute('aria-labelledby', 'format-group-label');
        radioContainer.style.display = 'grid';
        radioContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
        radioContainer.style.gap = '8px';
        
        // Compact radio button creation
        try {
            this.createCompactFormatRadio(radioContainer, 'executive-radio', 'executive-summary', 'Executive', '', this.format === 'executive-summary');
            this.createCompactFormatRadio(radioContainer, 'tutorial-radio', 'detailed-guide', 'Tutorial', '', this.format === 'detailed-guide');
            this.createCompactFormatRadio(radioContainer, 'brief-radio', 'brief', 'Brief', '', this.format === 'brief');
            this.createCompactFormatRadio(radioContainer, 'custom-radio', 'custom', 'Custom', '', this.format === 'custom');
        } catch (error) {
            console.error('Error creating compact format radio buttons:', error);
            // Fallback to old method if compact method fails
            this.createFormatRadio(radioContainer, 'executive-radio', 'executive-summary', 'Executive', 'Quick insights with action items', this.format === 'executive-summary');
            this.createFormatRadio(radioContainer, 'tutorial-radio', 'detailed-guide', 'Tutorial', '📚 Step-by-step walkthrough', this.format === 'detailed-guide');
            this.createFormatRadio(radioContainer, 'brief-radio', 'brief', 'Brief', '📋 Key points and takeaways', this.format === 'brief');
            this.createFormatRadio(radioContainer, 'custom-radio', 'custom', 'Custom', '✏️ Your custom analysis', this.format === 'custom');
        }

        // Create custom prompt textarea container (initially hidden)
        this.customPromptContainer = container.createDiv();
        this.customPromptContainer.style.marginTop = '12px';
        this.customPromptContainer.style.padding = '12px';
        this.customPromptContainer.style.backgroundColor = 'var(--background-modifier-hover)';
        this.customPromptContainer.style.borderRadius = '4px';
        this.customPromptContainer.style.display = 'none';
        
        const customPromptLabel = this.customPromptContainer.createEl('label', {
            text: 'Custom Prompt (this session only):'
        });
        customPromptLabel.setAttribute('for', 'custom-prompt-input');
        customPromptLabel.style.display = 'block';
        customPromptLabel.style.marginBottom = '6px';
        customPromptLabel.style.fontWeight = '600';
        customPromptLabel.style.fontSize = '0.95rem';

        this.customPromptInput = this.customPromptContainer.createEl('textarea');
        this.customPromptInput.id = 'custom-prompt-input';
        this.customPromptInput.setAttribute('aria-label', 'Custom AI prompt');
        this.customPromptInput.setAttribute('placeholder', 'Enter your custom prompt here. Available placeholders: __VIDEO_TITLE__, __VIDEO_DESCRIPTION__, __VIDEO_URL__');
        this.customPromptInput.style.width = '100%';
        this.customPromptInput.style.height = '100px';
        this.customPromptInput.style.padding = '8px';
        this.customPromptInput.style.fontFamily = 'monospace';
        this.customPromptInput.style.fontSize = '12px';
        this.customPromptInput.style.border = '1px solid var(--background-modifier-border)';
        this.customPromptInput.style.borderRadius = '4px';
        this.customPromptInput.style.resize = 'vertical';
        this.customPromptInput.style.marginBottom = '6px';

        const helpText = this.customPromptContainer.createEl('small');
        helpText.textContent = 'Placeholders: __VIDEO_TITLE__, __VIDEO_DESCRIPTION__, __VIDEO_URL__, __VIDEO_ID__, __EMBED_URL__, __DATE__, __TIMESTAMP__';
        helpText.style.display = 'block';
        helpText.style.marginTop = '4px';
        helpText.style.color = 'var(--text-muted)';
        helpText.style.fontSize = '11px';
    }

    /**
     * Create enhanced format radio button
     */
    private createFormatRadio(container: HTMLElement, id: string, value: string, title: string, description: string, isChecked: boolean): void {
        const radioContainer = container.createDiv();
        radioContainer.style.padding = '12px';
        radioContainer.style.border = '2px solid var(--background-modifier-border)';
        radioContainer.style.borderRadius = '8px';
        radioContainer.style.backgroundColor = 'var(--background-primary)';
        radioContainer.style.cursor = 'pointer';
        radioContainer.style.transition = 'all 0.2s ease';
        radioContainer.style.textAlign = 'center';

        const radio = radioContainer.createEl('input');
        radio.type = 'radio';
        radio.name = 'outputFormat';
        radio.value = value;
        radio.id = id;
        radio.checked = isChecked;
        radio.style.marginBottom = '8px';

        const icon = radioContainer.createEl('div');
        icon.style.fontSize = '1.5rem';
        icon.style.marginBottom = '4px';

        // Set icon based on format type
        if (value === 'executive-summary') {
            icon.textContent = '🎯';
        } else if (value === 'detailed-guide') {
            icon.textContent = '📚';
        } else if (value === 'brief') {
            icon.textContent = '📋';
        } else if (value === 'custom') {
            icon.textContent = '✏️';
        }

        const titleElement = radioContainer.createEl('div');
        titleElement.textContent = title;
        titleElement.style.fontWeight = '600';
        titleElement.style.fontSize = '0.9rem';
        titleElement.style.marginBottom = '2px';

        const descElement = radioContainer.createEl('div');
        descElement.textContent = description;
        descElement.style.fontSize = '0.75rem';
        descElement.style.color = 'var(--text-muted)';

        // Add hover and selection effects
        if (isChecked) {
            radioContainer.style.borderColor = 'var(--interactive-accent)';
            radioContainer.style.backgroundColor = 'var(--interactive-accent-hover)';
        }

        radioContainer.addEventListener('mouseenter', () => {
            radioContainer.style.borderColor = 'var(--interactive-accent)';
            radioContainer.style.transform = 'translateY(-2px)';
            radioContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        });

        radioContainer.addEventListener('mouseleave', () => {
            if (!radio.checked) {
                radioContainer.style.borderColor = 'var(--background-modifier-border)';
                radioContainer.style.transform = 'translateY(0)';
                radioContainer.style.boxShadow = 'none';
            }
        });

        radio.addEventListener('change', (e) => {
            if ((e.target as HTMLInputElement).checked) {
                this.format = value as OutputFormat;

                // Update all radio containers
                const allContainers = container.querySelectorAll('div');
                allContainers.forEach((containerEl: Element) => {
                    const divEl = containerEl as HTMLDivElement;
                    divEl.style.borderColor = 'var(--background-modifier-border)';
                    divEl.style.backgroundColor = 'var(--background-primary)';
                });

                radioContainer.style.borderColor = 'var(--interactive-accent)';
                radioContainer.style.backgroundColor = 'var(--interactive-accent-hover)';

                // Handle custom prompt visibility
                if (this.customPromptContainer) {
                    if (value === 'custom') {
                        this.customPromptContainer.style.display = 'block';
                        this.customPromptInput?.focus();
                    } else {
                        this.customPromptContainer.style.display = 'none';
                    }
                }
            }
        });

        // Click container to select radio
        radioContainer.addEventListener('click', () => {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        });
    }

    /**
     * Create compact format radio button
     */
    private createCompactFormatRadio(container: HTMLElement, id: string, value: string, title: string, icon: string, isChecked: boolean): void {
        const radioContainer = container.createDiv();
        radioContainer.style.padding = '8px 4px';
        radioContainer.style.border = '1px solid var(--background-modifier-border)';
        radioContainer.style.borderRadius = '4px';
        radioContainer.style.backgroundColor = 'var(--background-primary)';
        radioContainer.style.cursor = 'pointer';
        radioContainer.style.transition = 'all 0.2s ease';
        radioContainer.style.textAlign = 'center';

        const radio = radioContainer.createEl('input');
        radio.type = 'radio';
        radio.name = 'outputFormat';
        radio.value = value;
        radio.id = id;
        radio.checked = isChecked;
        radio.style.marginBottom = '4px';

        // Only show icon if it exists
        if (icon) {
            const iconEl = radioContainer.createEl('div');
            iconEl.textContent = icon;
            iconEl.style.fontSize = '1.2rem';
            iconEl.style.marginBottom = '2px';
        }

        const titleElement = radioContainer.createEl('div');
        titleElement.textContent = title;
        titleElement.style.fontWeight = '500';
        titleElement.style.fontSize = '0.8rem';

        // Add hover and selection effects
        if (isChecked) {
            radioContainer.style.borderColor = 'var(--interactive-accent)';
            radioContainer.style.backgroundColor = 'var(--interactive-accent-hover)';
        }

        radioContainer.addEventListener('mouseenter', () => {
            radioContainer.style.borderColor = 'var(--interactive-accent)';
            radioContainer.style.transform = 'translateY(-1px)';
        });

        radioContainer.addEventListener('mouseleave', () => {
            if (!radio.checked) {
                radioContainer.style.borderColor = 'var(--background-modifier-border)';
                radioContainer.style.transform = 'translateY(0)';
            }
        });

        radio.addEventListener('change', (e) => {
            if ((e.target as HTMLInputElement).checked) {
                this.format = value as OutputFormat;

                // Update all radio containers
                const allContainers = container.querySelectorAll('div');
                allContainers.forEach((containerEl: Element) => {
                    const divEl = containerEl as HTMLDivElement;
                    divEl.style.borderColor = 'var(--background-modifier-border)';
                    divEl.style.backgroundColor = 'var(--background-primary)';
                });

                radioContainer.style.borderColor = 'var(--interactive-accent)';
                radioContainer.style.backgroundColor = 'var(--interactive-accent-hover)';

                // Handle custom prompt visibility
                if (this.customPromptContainer) {
                    if (value === 'custom') {
                        this.customPromptContainer.style.display = 'block';
                        this.customPromptInput?.focus();
                    } else {
                        this.customPromptContainer.style.display = 'none';
                    }
                }
            }
        });

        // Click container to select radio
        radioContainer.addEventListener('click', () => {
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        });
    }

    
    
    /**
     * Create progress section
     */
    private createProgressSection(): void {
        // Clean up existing progress container if it exists
        if (this.progressContainer) {
            this.progressContainer.remove();
            this.progressSteps = [];
        }

        this.progressContainer = this.contentEl.createDiv();
        this.progressContainer.setAttribute('role', 'region');
        this.progressContainer.setAttribute('aria-label', 'Processing progress');
        this.progressContainer.setAttribute('aria-live', 'polite');
        this.progressContainer.style.marginTop = '16px';
        this.progressContainer.style.display = 'none';
        
        // Progress text
        this.progressText = this.progressContainer.createDiv();
        this.progressText.id = 'progress-text';
        this.progressText.style.marginBottom = '8px';
        this.progressText.style.fontWeight = '500';
        this.progressText.style.color = 'var(--text-accent)';
        this.progressText.textContent = 'Processing video...';
        
        // Progress bar container
        const progressBarContainer = this.progressContainer.createDiv();
        progressBarContainer.setAttribute('role', 'progressbar');
        progressBarContainer.setAttribute('aria-valuenow', '0');
        progressBarContainer.setAttribute('aria-valuemin', '0');
        progressBarContainer.setAttribute('aria-valuemax', '100');
        progressBarContainer.setAttribute('aria-labelledby', 'progress-text');
        progressBarContainer.style.width = '100%';
        progressBarContainer.style.height = '6px';
        progressBarContainer.style.backgroundColor = 'var(--background-modifier-border)';
        progressBarContainer.style.borderRadius = '3px';
        progressBarContainer.style.overflow = 'hidden';
        
        // Progress bar
        this.progressBar = progressBarContainer.createDiv();
        this.progressBar.style.height = '100%';
        this.progressBar.style.backgroundColor = 'var(--text-accent)';
        this.progressBar.style.borderRadius = '3px';
        this.progressBar.style.width = '0%';
        this.progressBar.style.transition = 'width 0.3s ease';

        const stepList = this.progressContainer.createEl('ol');
        stepList.setAttribute('aria-label', 'Processing steps');
        stepList.style.marginTop = '12px';
        stepList.style.paddingLeft = '20px';
        stepList.style.fontSize = '0.9rem';
        stepList.style.color = 'var(--text-normal)';

        const labels = [
            'Validate URL',
            'Fetch video info',
            'Run AI analysis',
            'Save note'
        ];

        this.progressSteps = labels.map((label, index) => {
            const item = stepList.createEl('li');
            item.setAttribute('role', 'status');
            item.style.marginBottom = '4px';
            item.textContent = `○ ${label}`;
            return { label, element: item };
        });
    }

    /**
     * Create action buttons with accessibility
     */
    private createActionButtons(): void {
        const container = this.createButtonContainer();

        // Cancel button
        const cancelBtn = this.createButton(
            container,
            MESSAGES.MODALS.CANCEL,
            false,
            () => this.close()
        );
        cancelBtn.setAttribute('aria-label', 'Cancel video processing');

        // Process button
        this.processButton = this.createButton(
            container,
            MESSAGES.MODALS.PROCESS,
            true,
            () => this.handleProcess()
        );
        this.processButton.setAttribute('aria-label', 'Process YouTube video');

        // Open button (hidden initially)
        this.openButton = this.createButton(
            container,
            'Open Note',
            true,
            () => this.handleOpenFile()
        );
        this.openButton.setAttribute('aria-label', 'Open the processed note');
        this.openButton.style.display = 'none';

        this.updateProcessButtonState();
    }

    /**
     * Set up event handlers
     */
    private setupEventHandlers(): void {
        this.setupKeyHandlers(
            () => this.handleProcess(),
            () => this.close()
        );
    }

    /**
     * Focus on URL input
     */
    private focusUrlInput(): void {
        if (this.urlInput) {
            this.focusElement(this.urlInput);
        }
    }

    /**
     * Update process button enabled state (optimized with debouncing and memoization)
     */
    private updateProcessButtonState(): void {
        if (!this.processButton) return;

        if (this.isProcessing) {
            return;
        }

        const trimmedUrl = this.url.trim();

        if (this.processButton && this.processButton.textContent !== MESSAGES.MODALS.PROCESS && trimmedUrl.length >= 0) {
            this.processButton.textContent = MESSAGES.MODALS.PROCESS;
        }
        
        // Memoize validation result for same URL (avoid repeated expensive validation)
        if (trimmedUrl === this.lastValidUrl) {
            const isValid = this.lastValidResult!;
            this.processButton.disabled = !isValid;
            this.processButton.style.opacity = isValid ? '1' : '0.5';
            if (trimmedUrl.length === 0) {
                this.setValidationMessage('Paste a YouTube link to begin processing.', 'info');
                this.setUrlInputState('idle');
            } else {
                this.setValidationMessage(
                    isValid ? 'Ready to process this video.' : 'Enter a valid YouTube video URL.',
                    isValid ? 'success' : 'error'
                );
                this.setUrlInputState(isValid ? 'valid' : 'invalid');
            }
            this.updateQuickActionsState();
            return;
        }
        
        // Debounced validation for better UX and performance
        if (this.validationTimer) {
            clearTimeout(this.validationTimer);
        }
        
        this.validationTimer = window.setTimeout(() => {
            const isValid = ValidationUtils.isValidYouTubeUrl(trimmedUrl);
            this.lastValidUrl = trimmedUrl;
            this.lastValidResult = isValid;
            
            this.processButton!.disabled = !isValid;
            this.processButton!.style.opacity = isValid ? '1' : '0.5';

            if (trimmedUrl.length === 0) {
                this.setValidationMessage('Paste a YouTube link to begin processing.', 'info');
                this.setUrlInputState('idle');
            } else {
                this.setValidationMessage(
                    isValid ? 'Ready to process this video.' : 'Enter a valid YouTube video URL.',
                    isValid ? 'success' : 'error'
                );
                this.setUrlInputState(isValid ? 'valid' : 'invalid');
            }
            this.updateQuickActionsState();
                // If URL is valid, fetch a lightweight preview (thumbnail + title)
                if (isValid) {
                    void this.maybeFetchPreview(trimmedUrl);
                } else {
                    this.clearPreview();
                }
        }, 300); // 300ms debounce
    }

    /**
     * Validate URL input (simplified - used by debounced handler)
     */
    private isUrlValid(): boolean {
        return ValidationUtils.isValidYouTubeUrl(this.url.trim());
    }

    /**
     * Handle process button click
     */
    private async handleProcess(): Promise<void> {
        const trimmedUrl = this.url.trim();
        
        if (!trimmedUrl) {
            new Notice(MESSAGES.ERRORS.ENTER_URL);
            this.focusUrlInput();
            return;
        }

        if (!this.isUrlValid()) {
            new Notice(MESSAGES.ERRORS.INVALID_URL);
            this.focusUrlInput();
            return;
        }

        try {
            // If user explicitly selected Google Gemini and chose a model that
            // does not support multimodal audio/video tokens, but the URL is a
            // YouTube video, suggest switching to a multimodal-capable model.
            if (this.selectedProvider === 'Google Gemini' && this.selectedModel && this.isUrlValid()) {
                try {
                    const models = PROVIDER_MODEL_OPTIONS['Google Gemini'] || [] as any[];
                    const match = models.find(m => {
                        const name = typeof m === 'string' ? m : (m && m.name ? m.name : '');
                        return String(name).toLowerCase() === String(this.selectedModel || '').toLowerCase();
                    }) as any | undefined;

                    const supportsAudioVideo = !!(match && match.supportsAudioVideo);
                    if (!supportsAudioVideo) {
                        // Recommend a multimodal-capable model (prefer configured default)
                        const recommended = (models.find(m => (m && m.supportsAudioVideo)) || { name: AI_MODELS.GEMINI }).name;
                        // Use custom styled confirmation modal instead of native confirm()
                        const shouldSwitch = await this.showConfirmationModal(
                            'Multimodal Model Recommended',
                            `The selected model (${this.selectedModel}) may not support multimodal analysis.\n\nWould you like to switch to a multimodal-capable model (${recommended}) for better video analysis?`,
                            'Switch to Multimodal',
                            'Keep Current Model',
                            false
                        );
                        if (shouldSwitch) {
                            // Ensure the recommended model exists in the current modelSelect; if not, add it
                            if (this.modelSelect) {
                                const exists = Array.from(this.modelSelect.options).some(o => o.value === recommended);
                                if (!exists) {
                                    const opt = document.createElement('option');
                                    opt.value = recommended;
                                    opt.text = recommended;
                                    this.modelSelect.appendChild(opt);
                                }
                                this.modelSelect.value = recommended;
                                this.selectedModel = recommended;
                            } else {
                                this.selectedModel = recommended;
                            }
                        }
                    }
                } catch (err) {
                    // Non-fatal: fall back to default behavior
                    console.warn('[YouTubeUrlModal] model recommendation failed', err);
                }
            }
            this.showProcessingState();
            this.setStepState(0, 'active');
            
            // Start processing with progress updates
            this.updateProgress(20, 'Validating YouTube URL...');
            await new Promise(resolve => setTimeout(resolve, 500));
            this.setStepState(0, 'complete');
            this.setStepState(1, 'active');
            
            this.updateProgress(40, 'Extracting video data...');
            await new Promise(resolve => setTimeout(resolve, 500));
            this.setStepState(1, 'complete');
            this.setStepState(2, 'active');
            
            this.updateProgress(60, 'Analyzing video content...');
            
            // Call the actual processing function (pass provider/model selection and performance settings)
            const customPrompt = this.format === 'custom' ? this.customPromptInput?.value : undefined;
            const filePath = await this.options.onProcess(
                trimmedUrl,
                this.format,
                this.selectedProvider,
                this.selectedModel,
                customPrompt,
                this.performanceMode,
                this.enableParallelProcessing,
                this.preferMultimodal
            );
            this.setStepState(2, 'complete');
            this.setStepState(3, 'active');
            
            this.updateProgress(80, 'Generating note...');
            await new Promise(resolve => setTimeout(resolve, 300));
            
            this.updateProgress(100, 'Complete!');
            this.setStepState(3, 'complete');
            
            // Store the file path and show completion state
            this.processedFilePath = filePath;
            this.showCompletionState();
            
        } catch (error) {
            this.flagActiveStepAsError();
            this.showErrorState(error as Error);
            ErrorHandler.handle(error as Error, 'YouTube URL processing');
        }
    }

    /**
     * Handle open file button click
     */
    private async handleOpenFile(): Promise<void> {
        if (this.processedFilePath && this.options.onOpenFile) {
            try {
                await this.options.onOpenFile(this.processedFilePath);
                this.close();
            } catch (error) {
                ErrorHandler.handle(error as Error, 'Opening file');
            }
        }
    }

    /**
     * Show processing state
     */
    private showProcessingState(): void {
        this.isProcessing = true;
        this.setValidationMessage('Processing video. This may take a moment...', 'info');
        this.resetProgressSteps();
        
        // Show progress section
        if (this.progressContainer) {
            this.progressContainer.style.display = 'block';
        }
        
        // Disable inputs and process button
        if (this.urlInput) {
            this.urlInput.disabled = true;
        }
        if (this.processButton) {
            this.processButton.disabled = true;
            this.processButton.textContent = 'Processing...';
        }
        if (this.openButton) {
            this.openButton.style.display = 'none';
        }

        this.setUrlInputState('idle');
        this.updateQuickActionsState();
    }

    /**
     * Show completion state
     */
    private showCompletionState(): void {
        this.isProcessing = false;

        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
        }

        if (this.urlInput) {
            this.urlInput.disabled = false;
            // Clear the URL to prepare for next video and prevent cycles
            this.urlInput.value = '';
            this.url = '';
        }
        if (this.processButton) {
            this.processButton.disabled = false;
            this.processButton.textContent = 'Process Another';
            this.processButton.style.display = 'inline-block';
            this.processButton.style.opacity = '1';
        }
        if (this.openButton) {
            this.openButton.style.display = 'inline-block';
        }

        if (this.headerEl) {
            this.headerEl.textContent = '✅ Video Processed Successfully!';
        }

        this.setValidationMessage("Note saved to today's folder. You can open it now or process another video.", 'success');
        this.focusUrlInput();
        this.updateQuickActionsState();
        this.setUrlInputState('idle'); // Reset to idle since we cleared the URL
    }

    /**
     * Show error state
     */
    private showErrorState(error: Error): void {
        this.isProcessing = false;
        
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
        }

        if (this.urlInput) {
            this.urlInput.disabled = false;
        }
        if (this.processButton) {
            this.processButton.disabled = false;
            this.processButton.textContent = MESSAGES.MODALS.PROCESS;
            this.processButton.style.display = 'inline-block';
        }
        if (this.openButton) {
            this.openButton.style.display = 'none';
        }

        if (this.headerEl) {
            this.headerEl.textContent = '❌ Processing Failed';
        }

        this.setValidationMessage(error.message, 'error');
        this.updateQuickActionsState();
        this.setUrlInputState(this.url.trim().length > 0 ? 'invalid' : 'idle');
    }

    /**
     * Update progress bar and text
     */
    private updateProgress(percent: number, text: string): void {
        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = text;
        }
    }

    /**
     * Set initial URL value
     */
    setUrl(url: string): void {
        // Prevent cycles - don't set the same URL again
        if (this.url.trim() === url.trim()) {
            console.debug('YouTubeUrlModal: setUrl called with same URL, preventing cycle');
            return;
        }

        this.url = url;
        if (this.urlInput) {
            this.urlInput.value = url;
            this.updateProcessButtonState();
            this.updateQuickActionsState();
            const trimmed = url.trim();
            if (trimmed.length === 0) {
                this.setUrlInputState('idle');
            } else {
                this.setUrlInputState(ValidationUtils.isValidYouTubeUrl(trimmed) ? 'valid' : 'invalid');
            }
        }
    }

    /**
     * Clean up resources when modal is closed
     */
    onClose(): void {
        // Clean up validation timer
        if (this.validationTimer) {
            clearTimeout(this.validationTimer);
            this.validationTimer = undefined;
        }

        // Clean up progress container and steps
        if (this.progressContainer) {
            this.progressContainer.remove();
            this.progressContainer = undefined;
        }
        this.progressSteps = [];

        // Call parent cleanup
        super.onClose();
    }

    /**
     * Get current URL value
     */
    getUrl(): string {
        return this.url;
    }

    private resetProgressSteps(): void {
        this.currentStepIndex = 0;
        if (this.progressSteps.length === 0) {
            return;
        }

        this.progressSteps.forEach((step) => {
            step.element.textContent = `○ ${step.label}`;
        });
    }

    private setStepState(index: number, state: StepState): void {
        const target = this.progressSteps[index];
        if (!target) {
            return;
        }

        const prefix = this.getStepPrefix(state);
        target.element.textContent = `${prefix} ${target.label}`;

        if (state === 'active') {
            this.currentStepIndex = index;
        } else if (state === 'complete' && this.currentStepIndex === index) {
            this.currentStepIndex = Math.min(index + 1, this.progressSteps.length - 1);
        }
    }

    private flagActiveStepAsError(): void {
        if (this.progressSteps.length === 0) {
            return;
        }

        this.setStepState(this.currentStepIndex, 'error');
    }

    private getStepPrefix(state: StepState): string {
        switch (state) {
            case 'active':
                return '●';
            case 'complete':
                return '✔';
            case 'error':
                return '⚠';
            default:
                return '○';
        }
    }

    private createInlineButton(container: HTMLElement, label: string, onClick: () => void): HTMLButtonElement {
        const button = container.createEl('button', { text: label });
        button.style.padding = '6px 12px';
        button.style.fontSize = '0.85rem';
        button.style.borderRadius = '6px';
        button.style.border = '1px solid var(--background-modifier-border)';
        button.style.backgroundColor = 'var(--background-primary)';
        button.style.color = 'var(--text-normal)';
        button.style.cursor = 'pointer';
        button.style.transition = 'background-color 0.2s ease';
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'var(--background-modifier-hover)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'var(--background-primary)';
        });
        button.addEventListener('click', onClick);
        return button;
    }

    private async handlePasteFromClipboard(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        if (!navigator.clipboard || !navigator.clipboard.readText) {
            this.setValidationMessage('Clipboard access is not available in this environment.', 'error');
            new Notice('Clipboard access is not available.');
            return;
        }

        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                this.setValidationMessage('Clipboard is empty. Copy a YouTube URL first.', 'info');
                return;
            }

            const trimmed = text.trim();
            this.url = trimmed;
            if (this.urlInput) {
                this.urlInput.value = trimmed;
            }
            this.lastValidUrl = undefined;
            this.updateProcessButtonState();
            this.updateQuickActionsState();

            const isValid = ValidationUtils.isValidYouTubeUrl(trimmed);
            this.setValidationMessage(
                isValid ? 'Ready to process this video.' : 'Enter a valid YouTube video URL.',
                isValid ? 'success' : 'error'
            );
            this.setUrlInputState(isValid ? 'valid' : 'invalid');
            if (this.processButton && !this.isProcessing && isValid) {
                this.processButton.focus();
            } else {
                this.focusUrlInput();
            }
        } catch (error) {
            ErrorHandler.handle(error as Error, 'Reading clipboard', false);
            this.setValidationMessage('Could not read from clipboard. Paste manually instead.', 'error');
            new Notice('Could not read from clipboard.');
        }
    }

    private handleClearUrl(): void {
        if (this.isProcessing) {
            return;
        }

        this.url = '';
        if (this.urlInput) {
            this.urlInput.value = '';
        }
        this.lastValidUrl = undefined;
        this.updateProcessButtonState();
        this.updateQuickActionsState();
        this.setValidationMessage('Paste a YouTube link to begin processing.', 'info');
        this.setUrlInputState('idle');
        this.focusUrlInput();
    }

    private updateQuickActionsState(): void {
        const hasUrl = this.url.trim().length > 0;
        if (this.clearButton) {
            this.clearButton.disabled = !hasUrl || this.isProcessing;
            this.clearButton.style.opacity = this.clearButton.disabled ? '0.5' : '1';
        }
        if (this.pasteButton) {
            this.pasteButton.disabled = this.isProcessing;
            this.pasteButton.style.opacity = this.pasteButton.disabled ? '0.5' : '1';
        }
    }

    private setUrlInputState(state: 'idle' | 'valid' | 'invalid'): void {
        if (!this.urlInput) {
            return;
        }

        let borderColor = 'var(--background-modifier-border)';
        let boxShadow = 'none';

        if (state === 'valid') {
            borderColor = 'var(--text-accent)';
            boxShadow = '0 0 0 1px var(--text-accent)';
        } else if (state === 'invalid') {
            borderColor = 'var(--text-error)';
            boxShadow = '0 0 0 1px var(--text-error)';
        }

        this.urlInput.style.borderColor = borderColor;
        this.urlInput.style.boxShadow = boxShadow;
    }

    private setValidationMessage(message: string, type: 'info' | 'error' | 'success'): void {
        if (!this.validationMessage) {
            return;
        }

        this.validationMessage.textContent = message;

        let color = 'var(--text-muted)';
        if (type === 'error') {
            color = 'var(--text-error)';
        } else if (type === 'success') {
            color = 'var(--text-accent)';
        } else {
            color = 'var(--text-muted)';
        }

        this.validationMessage.style.color = color;
    }

    /**
     * Try to fetch a lightweight preview for the provided YouTube URL using oEmbed.
     */
    private async maybeFetchPreview(url: string): Promise<void> {
        if (this.fetchInProgress) return;
        if (!url) return;
        if (this.lastValidUrl === url && this.thumbnailEl && this.thumbnailEl.style.display === 'block') {
            return; // already fetched for this URL
        }

        this.setFetchingState(true);
        try {
            const meta = await this.fetchVideoPreview(url);
            if (meta) {
                this.showPreview(meta);
            } else {
                this.clearPreview();
            }
        } catch (error) {
            // silently clear preview on failure, keep UX responsive
            this.clearPreview();
        } finally {
            this.setFetchingState(false);
        }
    }

    private setFetchingState(isFetching: boolean): void {
        this.fetchInProgress = isFetching;
        if (this.processButton) {
            // disable processing while fetching preview
            this.processButton.disabled = isFetching || !(this.lastValidResult ?? false);
            this.processButton.style.opacity = this.processButton.disabled ? '0.5' : '1';
        }
        if (this.validationMessage) {
            if (isFetching) this.setValidationMessage('Fetching preview...', 'info');
            else if (this.lastValidResult) this.setValidationMessage('Ready to process this video.', 'success');
            else this.setValidationMessage('Enter a valid YouTube video URL.', 'error');
        }
    }

    private async fetchVideoPreview(url: string): Promise<{ title: string; author: string; thumbnail: string } | null> {
        try {
            const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            const res = await fetch(oembed);
            if (!res.ok) return null;
            const data = await res.json();
            return {
                title: data.title || '',
                author: data.author_name || '',
                thumbnail: data.thumbnail_url || ''
            };
        } catch (error) {
            return null;
        }
    }

    private showPreview(meta: { title: string; author: string; thumbnail: string }): void {
        if (!this.thumbnailEl || !this.metadataContainer) return;
        if (meta.thumbnail) {
            this.thumbnailEl.src = meta.thumbnail;
            this.thumbnailEl.style.display = 'block';
        } else {
            this.thumbnailEl.style.display = 'none';
        }

        // populate metadata fields (structure created earlier)
        const titleEl = this.metadataContainer.querySelector('.yt-preview-title') as HTMLDivElement;
        const channelEl = this.metadataContainer.querySelector('.yt-preview-channel') as HTMLDivElement;
        if (titleEl) {
            titleEl.textContent = meta.title;
            titleEl.style.fontWeight = '600';
            titleEl.style.marginBottom = '4px';
        }
        if (channelEl) {
            channelEl.textContent = meta.author;
            channelEl.style.color = 'var(--text-muted)';
            channelEl.style.fontSize = '0.85rem';
        }

        this.metadataContainer.style.display = 'block';
    }

    private clearPreview(): void {
        if (this.thumbnailEl) {
            this.thumbnailEl.src = '';
            this.thumbnailEl.style.display = 'none';
        }
        if (this.metadataContainer) {
            const titleEl = this.metadataContainer.querySelector('.yt-preview-title') as HTMLDivElement;
            const channelEl = this.metadataContainer.querySelector('.yt-preview-channel') as HTMLDivElement;
            if (titleEl) titleEl.textContent = '';
            if (channelEl) channelEl.textContent = '';
            this.metadataContainer.style.display = 'none';
        }
    }
}
