/**
 * Progressive analysis modal with real-time progress updates
 */

import { App, Modal, Setting } from 'obsidian';
import { OptimizedProcessingOptions } from './services/optimized-ai-service';

export interface ProgressStep {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
    duration?: number;
    error?: string;
}

export interface ProgressModalOptions {
    title: string;
    videoUrl: string;
    estimatedTime: { min: number; max: number; strategy: string };
    onComplete: (result: any) => void;
    onError: (error: Error) => void;
}

export class ProgressiveAnalysisModal extends Modal {
    private progressSteps: ProgressStep[] = [];
    private currentStepIndex = 0;
    private startTime = 0;
    private progressEl: HTMLElement;
    private stepsContainerEl: HTMLElement;
    private timeElapsedEl: HTMLElement;
    private strategyInfoEl: HTMLElement;
    private timeUpdateInterval?: NodeJS.Timeout;

    constructor(
        app: App,
        private options: ProgressModalOptions
    ) {
        super(app);
        this.initializeSteps();
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('youtube-clipper-progress-modal');

        // Header
        contentEl.createEl('h2', { text: this.options.title });
        contentEl.createEl('p', { text: `Analyzing: ${this.options.videoUrl}` });

        // Strategy information
        this.strategyInfoEl = contentEl.createDiv('strategy-info');
        this.strategyInfoEl.createEl('strong', { text: 'Analysis Strategy: ' });
        this.strategyInfoEl.createSpan({ text: this.options.estimatedTime.strategy });

        // Progress container
        const progressContainer = contentEl.createDiv('progress-container');

        // Overall progress bar
        this.progressEl = progressContainer.createDiv('progress-bar');
        const progressBar = this.progressEl.createDiv('progress-fill');
        progressBar.style.width = '0%';

        // Steps container
        this.stepsContainerEl = progressContainer.createDiv('steps-container');

        // Time information
        const timeContainer = contentEl.createDiv('time-container');
        this.timeElapsedEl = timeContainer.createDiv('time-elapsed');
        this.timeElapsedEl.textContent = 'Time elapsed: 0:00';

        const estimatedTimeEl = timeContainer.createDiv('time-estimated');
        estimatedTimeEl.textContent = `Estimated: ${this.options.estimatedTime.min}-${this.options.estimatedTime.max} seconds`;

        // Cancel button
        const cancelButton = contentEl.createEl('button', {
            text: 'Cancel Analysis',
            cls: 'mod-cta'
        });
        cancelButton.onclick = () => {
            this.close();
        };

        this.renderSteps();
        this.startTimeTracking();
        this.startAnalysis();
    }

    onClose() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
        }
    }

    private initializeSteps() {
        this.progressSteps = [
            {
                id: 'metadata',
                name: 'Extract Video Metadata',
                description: 'Fetching video title, description, and duration',
                status: 'pending'
            },
            {
                id: 'transcript-check',
                name: 'Check for Transcript',
                description: 'Looking for available transcript for faster analysis',
                status: 'pending'
            },
            {
                id: 'strategy-selection',
                name: 'Select Analysis Strategy',
                description: 'Choosing optimal processing method based on video characteristics',
                status: 'pending'
            },
            {
                id: 'ai-processing',
                name: 'AI Processing',
                description: 'Analyzing content with optimized strategy',
                status: 'pending'
            },
            {
                id: 'content-formatting',
                name: 'Format Content',
                description: 'Generating structured note with YAML frontmatter',
                status: 'pending'
            },
            {
                id: 'file-creation',
                name: 'Save Note',
                description: 'Creating and saving the generated note',
                status: 'pending'
            }
        ];
    }

    private renderSteps() {
        this.stepsContainerEl.empty();

        this.progressSteps.forEach((step, index) => {
            const stepEl = this.stepsContainerEl.createDiv('progress-step');
            stepEl.setAttribute('data-status', step.status);
            stepEl.setAttribute('data-step', step.id);

            // Step icon
            const iconEl = stepEl.createDiv('step-icon');
            iconEl.innerHTML = this.getStepIcon(step.status);

            // Step content
            const contentEl = stepEl.createDiv('step-content');
            contentEl.createEl('div', { cls: 'step-name', text: step.name });
            contentEl.createEl('div', { cls: 'step-description', text: step.description });

            // Step status
            if (step.duration) {
                const durationEl = stepEl.createDiv('step-duration');
                durationEl.textContent = ` (${step.duration}ms)`;
            }

            if (step.error) {
                const errorEl = stepEl.createDiv('step-error');
                errorEl.textContent = step.error;
            }
        });
    }

    private getStepIcon(status: ProgressStep['status']): string {
        switch (status) {
            case 'pending':
                return '⏸️';
            case 'in-progress':
                return '⏳';
            case 'completed':
                return '✅';
            case 'error':
                return '❌';
            default:
                return '⏸️';
        }
    }

    private updateProgress(stepId: string, status: ProgressStep['status'], error?: string, duration?: number) {
        const step = this.progressSteps.find(s => s.id === stepId);
        if (step) {
            step.status = status;
            if (error) step.error = error;
            if (duration) step.duration = duration;

            this.renderSteps();
            this.updateProgressBar();
        }
    }

    private updateProgressBar() {
        const completedSteps = this.progressSteps.filter(s => s.status === 'completed').length;
        const totalSteps = this.progressSteps.length;
        const progressPercentage = (completedSteps / totalSteps) * 100;

        const progressFill = this.progressEl.querySelector('.progress-fill') as HTMLElement;
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }
    }

    private startTimeTracking() {
        this.startTime = Date.now();
        this.timeUpdateInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.timeElapsedEl.textContent = `Time elapsed: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    private async startAnalysis() {
        try {
            // Step 1: Extract metadata
            this.updateProgress('metadata', 'in-progress');
            const metadataStartTime = Date.now();

            // Simulate metadata extraction (replace with actual implementation)
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.updateProgress('metadata', 'completed', undefined, Date.now() - metadataStartTime);

            // Step 2: Check transcript
            this.updateProgress('transcript-check', 'in-progress');
            const transcriptStartTime = Date.now();

            // Simulate transcript check (replace with actual implementation)
            await new Promise(resolve => setTimeout(resolve, 500));

            this.updateProgress('transcript-check', 'completed', undefined, Date.now() - transcriptStartTime);

            // Step 3: Strategy selection
            this.updateProgress('strategy-selection', 'in-progress');
            const strategyStartTime = Date.now();

            // Simulate strategy selection (replace with actual implementation)
            await new Promise(resolve => setTimeout(resolve, 200));

            this.updateProgress('strategy-selection', 'completed', undefined, Date.now() - strategyStartTime);

            // Step 4: AI Processing (this will be the longest step)
            this.updateProgress('ai-processing', 'in-progress');
            const aiStartTime = Date.now();

            // Simulate AI processing time based on strategy
            const processingTime = this.options.estimatedTime.min * 1000;
            await new Promise(resolve => setTimeout(resolve, processingTime));

            this.updateProgress('ai-processing', 'completed', undefined, Date.now() - aiStartTime);

            // Step 5: Content formatting
            this.updateProgress('content-formatting', 'in-progress');
            const formatStartTime = Date.now();

            await new Promise(resolve => setTimeout(resolve, 300));

            this.updateProgress('content-formatting', 'completed', undefined, Date.now() - formatStartTime);

            // Step 6: File creation
            this.updateProgress('file-creation', 'in-progress');
            const fileStartTime = Date.now();

            await new Promise(resolve => setTimeout(resolve, 200));

            this.updateProgress('file-creation', 'completed', undefined, Date.now() - fileStartTime);

            // Complete
            setTimeout(() => {
                this.options.onComplete({ success: true });
                this.close();
            }, 500);

        } catch (error) {
            const currentStep = this.progressSteps[this.currentStepIndex];
            this.updateProgress(currentStep.id, 'error', (error as Error).message);
            this.options.onError(error as Error);
        }
    }

    /**
     * Static method to create and show the modal
     */
    static show(app: App, options: ProgressModalOptions): ProgressiveAnalysisModal {
        const modal = new ProgressiveAnalysisModal(app, options);
        modal.open();
        return modal;
    }
}