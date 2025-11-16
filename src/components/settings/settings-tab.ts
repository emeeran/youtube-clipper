/**
 * Plugin settings tab component
 * Designed to prevent conflicts with other plugin settings
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import { YouTubePluginSettings, OutputFormat } from '../../interfaces/types';
import { MESSAGES } from '../../constants/messages';
import { ValidationUtils } from '../../utils/validation';
import { ErrorHandler } from '../../utils/error-handler';
import { SecureConfigService } from '../../services/secure-config';

// Unique CSS classes to prevent conflicts
const SETTINGS_CSS_CLASSES = {
    container: 'ytc-settings-container',
    section: 'ytc-settings-section',
    header: 'ytc-settings-header',
    validation: 'ytc-settings-validation'
} as const;

export interface SettingsTabOptions {
    plugin: any; // Plugin instance
    onSettingsChange: (settings: YouTubePluginSettings) => Promise<void>;
}

export class YouTubeSettingsTab extends PluginSettingTab {
    private settings: YouTubePluginSettings;
    private validationErrors: string[] = [];
    private secureConfig: SecureConfigService;

    constructor(
        app: App,
        private options: SettingsTabOptions
    ) {
        super(app, options.plugin);
        this.settings = { ...options.plugin.settings };
        this.secureConfig = new SecureConfigService(this.settings);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        
        // Add unique CSS class for conflict prevention
        containerEl.addClass(SETTINGS_CSS_CLASSES.container);
        containerEl.setAttribute('data-plugin', 'youtube-clipper');

        this.createHeader();
        this.createAPISettings();
        this.createSecuritySettings();
        this.createCustomPromptsSettings();
        this.createFileSettings();
        this.createValidationStatus();
        this.createUsageInstructions();
    }

    /**
     * Create header with version information
     */
    private createHeader(): void {
        const headerEl = this.containerEl.createDiv(SETTINGS_CSS_CLASSES.header);
        headerEl.createEl('h2', { text: 'YouTubeClipper Settings' });
        
        // Version info
        const versionEl = headerEl.createDiv('ytc-version-info');
        versionEl.createEl('span', { 
            text: 'v1.2.0 - Production Ready',
            cls: 'ytc-version-badge'
        });
        
        // Quick status check
        const statusEl = headerEl.createDiv('ytc-status-info');
        const hasValidConfig = this.validateConfiguration();
        statusEl.createEl('span', {
            text: hasValidConfig ? '✅ Ready to use' : '⚠️ Configuration needed',
            cls: hasValidConfig ? 'ytc-status-good' : 'ytc-status-warning'
        });
        
        // Documentation link
        const docsEl = headerEl.createDiv('ytc-docs-link');
        docsEl.createEl('a', {
            text: '📖 View Documentation',
            href: '#',
            cls: 'ytc-docs-button'
        }).addEventListener('click', (e) => {
            e.preventDefault();
            this.showDocumentation();
        });
    }

    /**
     * Validate entire configuration
     */
    private validateConfiguration(): boolean {
        const hasApiKey = this.settings.geminiApiKey?.trim() || this.settings.groqApiKey?.trim();
        const hasValidPath = ValidationUtils.isValidPath(this.settings.outputPath);
        return Boolean(hasApiKey && hasValidPath);
    }

    /**
     * Show inline documentation
     */
    private showDocumentation(): void {
        window.open('https://github.com/youtube-clipper/obsidian-plugin#readme', '_blank');
    }    /**
     * Create API configuration settings
     */
    private createAPISettings(): void {
        const { containerEl } = this;
        
        // API Keys section
        containerEl.createEl('h3', { text: 'API Configuration' });

        // Security Notice
        const securityNotice = containerEl.createDiv('ytc-security-notice');
        securityNotice.style.padding = '12px';
        securityNotice.style.marginBottom = '16px';
        securityNotice.style.backgroundColor = 'var(--background-modifier-hover)';
        securityNotice.style.borderLeft = '4px solid var(--text-accent)';
        securityNotice.style.borderRadius = '4px';
        
        const noticeTitle = securityNotice.createEl('strong');
        noticeTitle.textContent = '🔒 Security Notice: ';
        
        const noticeText = securityNotice.createEl('span');
        noticeText.textContent = 'API keys are encrypted and stored securely by Obsidian. Never share your keys or commit them to version control.';
        noticeText.style.display = 'block';
        noticeText.style.marginTop = '4px';
        noticeText.style.fontSize = '0.9em';
        noticeText.style.color = 'var(--text-muted)';

        // Gemini API Key (password field)
        const geminiSetting = new Setting(containerEl)
            .setName('Gemini API Key')
            .setDesc('Your Google Gemini API key for content processing (password field - secured)')
            .addText(text => {
                // Use password-like input
                const inputEl = text
                    .setPlaceholder('sk-... (your key is encrypted)')
                    .onChange(async (value) => {
                        await this.updateSetting('geminiApiKey', value);
                    })
                    .inputEl;
                
                // Make it password field
                inputEl.type = 'password';
                
                // Add toggle to show/hide
                inputEl.style.fontFamily = 'monospace';
                inputEl.style.letterSpacing = '0.1em';
                
                return text;
            });
        
        // Add show/hide toggle for Gemini key
        this.addKeyToggle(geminiSetting, this.settings.geminiApiKey);

        // Groq API Key (password field)
        const groqSetting = new Setting(containerEl)
            .setName('Groq API Key')
            .setDesc('Your Groq API key for fallback processing (password field - secured)')
            .addText(text => {
                // Use password-like input
                const inputEl = text
                    .setPlaceholder('gsk_... (your key is encrypted)')
                    .onChange(async (value) => {
                        await this.updateSetting('groqApiKey', value);
                    })
                    .inputEl;
                
                // Make it password field
                inputEl.type = 'password';
                
                // Add visual feedback
                inputEl.style.fontFamily = 'monospace';
                inputEl.style.letterSpacing = '0.1em';
                
                return text;
            });
        
        // Add show/hide toggle for Groq key
        this.addKeyToggle(groqSetting, this.settings.groqApiKey);

        // Test Connectivity
        const testSection = containerEl.createDiv('ytc-test-connection');
        testSection.style.marginTop = '16px';
        testSection.style.paddingTop = '12px';
        testSection.style.borderTop = '1px solid var(--background-modifier-border)';
        
        new Setting(testSection)
            .setName('Test API Connection')
            .setDesc('Verify your API keys are valid')
            .addButton(btn => btn
                .setButtonText('Test Keys')
                .onClick(async () => {
                    btn.setDisabled(true);
                    btn.setButtonText('Testing...');
                    try {
                        await this.testAPIKeys();
                        btn.setButtonText('✓ Success!');
                        setTimeout(() => {
                            btn.setButtonText('Test Keys');
                            btn.setDisabled(false);
                        }, 2000);
                    } catch (error) {
                        btn.setButtonText('✗ Failed');
                        ErrorHandler.handle(error as Error, 'API key test failed', true);
                        setTimeout(() => {
                            btn.setButtonText('Test Keys');
                            btn.setDisabled(false);
                        }, 2000);
                    }
                }));
    }

    /**
     * Add show/hide toggle for sensitive API keys
     */
    private addKeyToggle(setting: Setting, keyValue: string): void {
        if (!keyValue) return;

        const toggleBtn = setting.addButton(btn => btn
            .setButtonText('👁️ Show')
            .setTooltip('Toggle key visibility')
            .onClick((e) => {
                const inputs = setting.settingEl.querySelectorAll('input[type="password"], input[type="text"]');
                if (inputs.length === 0) return;

                const input = inputs[0] as HTMLInputElement;
                const isPassword = input.type === 'password';

                input.type = isPassword ? 'text' : 'password';
                btn.setButtonText(isPassword ? '👁️‍🗨️ Hide' : '👁️ Show');
            }));
    }

    /**
     * Test API keys for validity
     */
    private async testAPIKeys(): Promise<void> {
        const errors: string[] = [];

        if (this.settings.geminiApiKey) {
            try {
                const response = await fetch(
                    'https://generativelanguage.googleapis.com/v1beta/models?key=' + this.settings.geminiApiKey
                );
                if (!response.ok) {
                    errors.push(`Gemini API key invalid (${response.status})`);
                }
            } catch (error) {
                errors.push('Gemini API key test failed (network error)');
            }
        } else {
            errors.push('Gemini API key not configured');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('\n'));
        }
    }

    /**
     * Create security configuration settings
     */
    private createSecuritySettings(): void {
        const { containerEl } = this;
        
        // Security Settings section
        containerEl.createEl('h3', { text: 'Security Configuration' });

        // Use Environment Variables
        new Setting(containerEl)
            .setName('Use Environment Variables')
            .setDesc('Load API keys from environment variables instead of storing them in configuration')
            .addToggle(toggle => toggle
                .setValue(this.settings.useEnvironmentVariables || false)
                .onChange(async (value) => {
                    await this.updateSetting('useEnvironmentVariables', value);
                    this.display(); // Refresh display to show/hide relevant settings
                }));

        // Environment Variable Prefix
        if (this.settings.useEnvironmentVariables) {
            new Setting(containerEl)
                .setName('Environment Variable Prefix')
                .setDesc('Prefix for environment variable names (e.g., YTC_GEMINI_API_KEY)')
                .addText(text => text
                    .setPlaceholder('YTC')
                    .setValue(this.settings.environmentPrefix || 'YTC')
                    .onChange(async (value) => {
                        await this.updateSetting('environmentPrefix', value || 'YTC');
                    }));

            // Environment Template
            const envTemplate = this.secureConfig.getEnvironmentTemplate();
            const envSection = containerEl.createDiv('ytc-env-template');
            envSection.createEl('h4', { text: 'Environment Variables Template' });
            envSection.createEl('p', { 
                text: 'Copy these environment variables to your shell profile:',
                cls: 'setting-item-description'
            });
            
            const preEl = envSection.createEl('pre');
            preEl.createEl('code', { text: envTemplate });
            
            // Copy button
            new Setting(envSection)
                .setName('Copy Template')
                .setDesc('Copy the environment variables template to clipboard')
                .addButton(button => button
                    .setButtonText('Copy to Clipboard')
                    .onClick(() => {
                        navigator.clipboard.writeText(envTemplate);
                        button.setButtonText('Copied!');
                        setTimeout(() => button.setButtonText('Copy to Clipboard'), 2000);
                    }));
        }

        // Security Validation
        const validation = this.secureConfig.validateSecurityConfiguration();
        if (!validation.isSecure) {
            const warningEl = containerEl.createDiv('ytc-security-warnings');
            warningEl.createEl('h4', { text: '⚠️ Security Warnings', cls: 'ytc-warning-header' });
            validation.warnings.forEach(warning => {
                warningEl.createEl('p', { text: warning, cls: 'ytc-warning-text' });
            });
        }
    }

    /**
     * Create custom prompts settings
     */
    private createCustomPromptsSettings(): void {
        const { containerEl } = this;
        
        // Custom Prompts section
        containerEl.createEl('h3', { text: 'Custom Output Formats' });
        
        const promptsDesc = containerEl.createDiv('ytc-prompts-description');
        promptsDesc.createEl('p', {
            text: 'Customize AI prompts for each output format. Use placeholders: __VIDEO_TITLE__, __VIDEO_DESCRIPTION__, __VIDEO_URL__',
            cls: 'setting-item-description'
        });
        
        // Initialize custom prompts if not present
        if (!this.settings.customPrompts) {
            this.settings.customPrompts = {} as Record<OutputFormat, string>;
        }
        
        // For each output format
        const formats: Array<OutputFormat> = [
            'executive-summary',
            'detailed-guide',
            'brief',
            'custom'
        ];
        
        formats.forEach(format => {
            const currentPrompt = this.settings.customPrompts?.[format] || '';
            
            // Format header with reset button
            const formatHeader = containerEl.createDiv('ytc-format-header');
            formatHeader.style.display = 'flex';
            formatHeader.style.justifyContent = 'space-between';
            formatHeader.style.alignItems = 'center';
            formatHeader.style.marginTop = '15px';
            formatHeader.style.marginBottom = '10px';
            
            formatHeader.createEl('h4', {
                text: this.formatDisplayName(format),
                attr: { style: 'margin: 0;' }
            });
            
            // Reset button
            const resetBtn = formatHeader.createEl('button', {
                text: 'Reset to Default',
                attr: {
                    style: 'padding: 4px 12px; font-size: 12px; cursor: pointer;'
                },
                cls: 'ytc-reset-prompt-btn'
            });
            
            resetBtn.addEventListener('click', () => {
                if (this.settings.customPrompts) {
                    delete this.settings.customPrompts[format];
                    this.validateAndSaveSettings();
                }
            });
            
            // Textarea for custom prompt
            const textareaContainer = containerEl.createDiv('ytc-prompt-textarea-container');
            textareaContainer.style.marginBottom = '10px';
            
            const textarea = textareaContainer.createEl('textarea', {
                attr: {
                    placeholder: `Enter custom prompt for ${this.formatDisplayName(format)}...`,
                    style: 'width: 100%; height: 120px; padding: 8px; font-family: monospace; font-size: 12px; border: 1px solid var(--background-modifier-border); border-radius: 4px; resize: vertical;'
                }
            }) as HTMLTextAreaElement;
            
            textarea.value = currentPrompt;
            
            textarea.addEventListener('change', async () => {
                if (textarea.value.trim()) {
                    if (!this.settings.customPrompts) {
                        this.settings.customPrompts = {} as Record<OutputFormat, string>;
                    }
                    this.settings.customPrompts[format] = textarea.value;
                } else if (this.settings.customPrompts) {
                    delete this.settings.customPrompts[format];
                }
                await this.validateAndSaveSettings();
            });
            
            // Help text with placeholders
            const helpText = textareaContainer.createEl('small', {
                text: `Available placeholders: __VIDEO_TITLE__, __VIDEO_DESCRIPTION__, __VIDEO_URL__, __AI_PROVIDER__, __AI_MODEL__`,
                attr: {
                    style: 'display: block; margin-top: 6px; color: var(--text-muted); font-size: 11px;'
                }
            });
        });
    }

    /**
     * Convert format key to display name
     */
    private formatDisplayName(format: OutputFormat): string {
        switch (format) {
            case 'executive-summary':
                return '📋 Executive Summary';
            case 'detailed-guide':
                return '📚 Comprehensive Tutorial';
            case 'brief':
                return '⚡ Brief Format';
            case 'custom':
                return '✨ Custom Prompt (Session Only)';
            default:
                return format;
        }
    }

    /**
     * Create file configuration settings
     */
    private createFileSettings(): void {
        const { containerEl } = this;
        
        // File Settings section
        containerEl.createEl('h3', { text: 'File Configuration' });

        // Output Path
        new Setting(containerEl)
            .setName('Output Path')
            .setDesc('Directory path where processed videos will be saved (relative to vault root)')
            .addText(text => text
                .setPlaceholder(MESSAGES.PLACEHOLDERS.OUTPUT_PATH)
                .setValue(this.settings.outputPath)
                .onChange(async (value) => {
                    await this.updateSetting('outputPath', value);
                }));
    }

    /**
     * Create validation status display
     */
    private createValidationStatus(): void {
        const { containerEl } = this;
        
        if (this.validationErrors.length > 0) {
            const errorSection = containerEl.createDiv();
            errorSection.style.marginTop = '20px';
            errorSection.style.padding = '10px';
            errorSection.style.backgroundColor = 'var(--background-modifier-error)';
            errorSection.style.borderRadius = '4px';
            
            errorSection.createEl('h4', { 
                text: '⚠️ Configuration Issues',
                attr: { style: 'color: var(--text-error); margin-top: 0;' }
            });
            
            const errorList = errorSection.createEl('ul');
            this.validationErrors.forEach(error => {
                errorList.createEl('li', { text: error });
            });
        } else {
            const successSection = containerEl.createDiv();
            successSection.style.marginTop = '20px';
            successSection.style.padding = '10px';
            successSection.style.backgroundColor = 'var(--background-modifier-success)';
            successSection.style.borderRadius = '4px';
            
            successSection.createEl('h4', { 
                text: '✅ Configuration Valid',
                attr: { style: 'color: var(--text-success); margin-top: 0;' }
            });
        }
    }

    /**
     * Create usage instructions
     */
    private createUsageInstructions(): void {
        const { containerEl } = this;
        
        containerEl.createEl('h3', { text: 'Usage Instructions' });
        
        const instructions = containerEl.createDiv();
        instructions.innerHTML = `
            <p><strong>How to use:</strong></p>
            <ol>
                <li>Set your Gemini or Groq API key above</li>
                <li>Configure your preferred output directory</li>
                <li>Click the video icon in the ribbon or use the command palette</li>
                <li>Paste a YouTube URL and click Process</li>
                <li>The plugin will analyze the video and create a structured note</li>
            </ol>
            
            <p><strong>API Key Information:</strong></p>
            <ul>
                <li><strong>Gemini API:</strong> Get your key from <a href="https://aistudio.google.com/app/apikey">Google AI Studio</a></li>
                <li><strong>Groq API:</strong> Get your key from <a href="https://console.groq.com/keys">Groq Console</a></li>
                <li>At least one API key is required for the plugin to function</li>
            </ul>
            
            <p><strong>Note:</strong> This plugin requires an active internet connection and a valid API key.</p>
            <p><strong>Limitations:</strong> Due to CORS restrictions, full transcript extraction may be limited. The plugin works with available metadata and descriptions.</p>
        `;
    }

    /**
     * Update a setting value
     */
    private async updateSetting(
        key: keyof YouTubePluginSettings, 
        value: string | boolean
    ): Promise<void> {
        try {
            (this.settings as any)[key] = value;
            await this.validateAndSaveSettings();
        } catch (error) {
            ErrorHandler.handle(error as Error, `Settings update for ${key}`);
        }
    }

    /**
     * Validate and save settings
     */
    private async validateAndSaveSettings(): Promise<void> {
        const validation = ValidationUtils.validateSettings(this.settings);
        this.validationErrors = validation.errors;
        
        if (validation.isValid) {
            await this.options.onSettingsChange(this.settings);
        }
        
        // Refresh display to show validation status
        this.display();
    }

    /**
     * Get current settings
     */
    getSettings(): YouTubePluginSettings {
        return { ...this.settings };
    }

    /**
     * Update settings from external source
     */
    updateSettings(newSettings: YouTubePluginSettings): void {
        this.settings = { ...newSettings };
        this.display();
    }
}
