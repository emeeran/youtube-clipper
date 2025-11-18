/**
 * Video preview modal with metadata display and quick analysis info
 */

import { App, Modal, Notice, Setting } from 'obsidian';
import { EnhancedVideoData } from './video-data';
import { VideoOptimizationEngine } from './video-optimization';
import { OptimizedAIService } from './services/optimized-ai-service';

export interface VideoPreviewOptions {
    videoData: EnhancedVideoData;
    videoUrl: string;
    performanceMode: string;
    format: string;
    onAnalyze: (options: any) => void;
    onCancel: () => void;
}

export class VideoPreviewModal extends Modal {
    private videoData: EnhancedVideoData;
    private videoUrl: string;
    private performanceMode: string;
    private format: string;
    private optimizedService: OptimizedAIService;

    constructor(
        app: App,
        private options: VideoPreviewOptions
    ) {
        super(app);
        this.videoData = options.videoData;
        this.videoUrl = options.videoUrl;
        this.performanceMode = options.performanceMode;
        this.format = options.format;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('youtube-clipper-preview-modal');

        // Header with video info
        this.createHeader(contentEl);

        // Video preview section
        this.createVideoPreview(contentEl);

        // Video metadata
        this.createMetadataSection(contentEl);

        // Analysis strategy info
        this.createStrategySection(contentEl);

        // Action buttons
        this.createActionButtons(contentEl);
    }

    onClose() {
        // Cleanup if needed
    }

    private createHeader(container: HTMLElement) {
        const headerEl = container.createDiv('preview-header');

        // Title
        headerEl.createEl('h2', {
            text: this.videoData.title || 'YouTube Video',
            cls: 'video-title'
        });

        // Duration and other quick info
        const infoEl = headerEl.createDiv('video-info');

        if (this.videoData.duration) {
            const duration = this.videoData.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            infoEl.createSpan({
                text: `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`,
                cls: 'duration'
            });
        }

        if (this.videoData.hasTranscript) {
            infoEl.createSpan({
                text: '📝 Transcript Available',
                cls: 'transcript-badge'
            });
        }

        if (this.videoData.channelName) {
            infoEl.createSpan({
                text: `📺 ${this.videoData.channelName}`,
                cls: 'channel'
            });
        }
    }

    private createVideoPreview(container: HTMLElement) {
        const previewEl = container.createDiv('video-preview');

        // Thumbnail
        if (this.videoData.thumbnail) {
            const thumbnailEl = previewEl.createEl('img', {
                cls: 'video-thumbnail'
            });
            thumbnailEl.src = this.videoData.thumbnail;
            thumbnailEl.alt = this.videoData.title || 'Video thumbnail';
            thumbnailEl.onclick = () => {
                // Open video in new tab
                window.open(this.videoUrl, '_blank');
            };
            thumbnailEl.style.cursor = 'pointer';
        }

        // Embed player (small preview)
        const embedContainer = previewEl.createDiv('embed-container');
        embedContainer.innerHTML = `
            <iframe
                width="280"
                height="157"
                src="https://www.youtube.com/embed/${this.extractVideoId()}"
                title="${this.videoData.title || 'YouTube video player'}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
        `;
    }

    private createMetadataSection(container: HTMLElement) {
        const metadataEl = container.createDiv('metadata-section');
        metadataEl.createEl('h3', { text: 'Video Details' });

        // Description preview
        if (this.videoData.description) {
            const descEl = metadataEl.createDiv('description-preview');
            descEl.createEl('h4', { text: 'Description' });

            const descText = this.videoData.description.length > 300 ?
                this.videoData.description.substring(0, 300) + '...' :
                this.videoData.description;

            descEl.createEl('p', { text: descText });
        }

        // Video statistics
        const statsEl = metadataEl.createDiv('video-stats');
        statsEl.createEl('h4', { text: 'Analysis Information' });

        const statsList = statsEl.createEl('ul');

        if (this.videoData.duration) {
            const duration = this.videoData.duration;
            let durationCategory = 'Short';
            if (duration > 600) durationCategory = 'Medium';
            if (duration > 1800) durationCategory = 'Long';

            statsList.createEl('li', { text: `Duration: ${durationCategory} (${Math.floor(duration / 60)}m ${duration % 60}s)` });
        }

        if (this.videoData.hasTranscript) {
            statsList.createEl('li', { text: '🚀 Fast transcript analysis available' });
        }

        // Add transcript availability check in background
        this.checkTranscriptAvailability();
    }

    private async checkTranscriptAvailability() {
        if (this.videoData.hasTranscript === undefined) {
            // This would be implemented with the actual transcript service
            // For now, simulate the check
            setTimeout(() => {
                this.videoData.hasTranscript = Math.random() > 0.3; // 70% chance of transcript
                this.createStrategySection(document.querySelector('.strategy-section') as HTMLElement);
            }, 1000);
        }
    }

    private createStrategySection(container: HTMLElement) {
        // Clear existing content if any
        container.empty();
        container.addClass('strategy-section');

        container.createEl('h3', { text: 'Analysis Strategy' });

        const strategy = VideoOptimizationEngine.selectOptimalStrategy(
            this.videoData.duration || 0,
            this.performanceMode,
            this.videoData.hasTranscript || false,
            this.format
        );

        // Strategy info
        const strategyInfoEl = container.createDiv('strategy-info');
        strategyInfoEl.createEl('div', {
            text: strategy.name,
            cls: 'strategy-name'
        });
        strategyInfoEl.createEl('p', {
            text: strategy.description,
            cls: 'strategy-description'
        });

        // Estimated processing time
        const timeEl = container.createDiv('processing-time');
        timeEl.createEl('h4', { text: 'Estimated Processing Time' });

        // Simulate processing time calculation
        const baseTime = Math.max(10, (this.videoData.duration || 300) / 30);
        const optimized = VideoOptimizationEngine.estimateOptimizedProcessingTime(
            this.videoData.duration || 0,
            strategy,
            baseTime
        );

        const timeInfoEl = timeEl.createDiv('time-estimate');
        timeInfoEl.createSpan({
            text: `⏱️ ${optimized.min}-${optimized.max} seconds`,
            cls: 'time-range'
        });
        timeInfoEl.createSpan({
            text: ` (${strategy.estimatedTimeReduction}% faster than standard)`,
            cls: 'time-improvement'
        });

        // Speed indicators
        const indicatorsEl = container.createDiv('speed-indicators');

        if (this.videoData.hasTranscript) {
            indicatorsEl.createDiv({
                text: '⚡ Transcript-based processing',
                cls: 'indicator fast'
            });
        }

        if (this.performanceMode === 'fast') {
            indicatorsEl.createDiv({
                text: '🚀 Fast mode enabled',
                cls: 'indicator fast'
            });
        }

        if (strategy.chunkProcessing) {
            indicatorsEl.createDiv({
                text: '🔧 Chunked processing',
                cls: 'indicator medium'
            });
        }
    }

    private createActionButtons(container: HTMLElement) {
        const actionsEl = container.createDiv('action-buttons');

        // Main analyze button
        const analyzeBtn = actionsEl.createEl('button', {
            text: '🚀 Analyze Video',
            cls: 'mod-cta primary-action'
        });

        analyzeBtn.onclick = () => {
            this.options.onAnalyze({
                videoData: this.videoData,
                videoUrl: this.videoUrl,
                performanceMode: this.performanceMode,
                format: this.format
            });
            this.close();
        };

        // Alternative analysis options
        const alternativesEl = actionsEl.createDiv('alternative-actions');

        // Fast analysis
        const fastBtn = alternativesEl.createEl('button', {
            text: '⚡ Quick Analysis',
            cls: 'mod-cta secondary-action'
        });

        fastBtn.onclick = () => {
            this.options.onAnalyze({
                videoData: this.videoData,
                videoUrl: this.videoUrl,
                performanceMode: 'fast',
                format: 'brief'
            });
            this.close();
        };

        // Cancel button
        const cancelBtn = actionsEl.createEl('button', {
            text: 'Cancel',
            cls: 'mod-cancel'
        });

        cancelBtn.onclick = () => {
            this.options.onCancel();
            this.close();
        };
    }

    private extractVideoId(): string {
        const match = this.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
        return match ? match[1] : '';
    }

    /**
     * Static method to create and show the modal
     */
    static show(app: App, options: VideoPreviewOptions): VideoPreviewModal {
        const modal = new VideoPreviewModal(app, options);
        modal.open();
        return modal;
    }
}