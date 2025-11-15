/**
 * Prompt generation service for AI processing
 */

import { PromptService, VideoData, OutputFormat } from '../interfaces/types';
import { ValidationUtils } from '../utils/validation';

export class AIPromptService implements PromptService {
    // Pre-compiled template fragments for hot paths (performance optimization)
    private static readonly BASE_TEMPLATE = `Analyze this YouTube video using comprehensive multimodal analysis with audio_video_tokens=True:

        VIDEO INFORMATION:
        Title: {{TITLE}}
        URL: {{URL}}
        Description/Context: {{DESCRIPTION}}

        MULTIMODAL ANALYSIS INSTRUCTIONS:
        1. Watch the complete video using both audio and visual analysis capabilities with audio_video_tokens=True
        2. Extract insights from spoken content, music, sound effects, and ambient audio
        3. Analyze visual elements including:
           - Slides, presentations, and text overlays
           - Diagrams, charts, and visual demonstrations
           - Body language, gestures, and facial expressions
           - Screen recordings, code examples, or software demos
           - Any visual aids or props used
        4. Before responding, perform a web search to find relevant insights or highlights about this topic
        5. Use web search results only when they directly enhance the response by adding clarity, depth, or useful context
        6. Focus on practical, action-oriented information that viewers can implement
        7. Maintain accuracy and cite specific examples from the video when relevant
        8. Identify the main value proposition and key learning objectives`;

    /**
     * Create analysis prompt for YouTube video content with format selection (optimized)
     */
    createAnalysisPrompt(videoData: VideoData, videoUrl: string, format: OutputFormat = 'detailed-guide'): string {
        // Fast string replacement instead of template literals (reduced allocations)
        const baseContent = AIPromptService.BASE_TEMPLATE
            .replace('{{TITLE}}', videoData.title)
            .replace('{{URL}}', videoUrl)
            .replace('{{DESCRIPTION}}', videoData.description);

        // Branchless optimization: ternary instead of if/else
        if (format === 'executive-summary') {
            return this.createExecutiveSummaryPrompt(baseContent, videoUrl);
        }

        if (format === 'brief') {
            return this.createBriefPrompt(baseContent, videoUrl);
        }

        return this.createDetailedGuidePrompt(baseContent, videoUrl);
    }

    /**
     * Create a brief prompt: short description plus resources list
     */
    private createBriefPrompt(baseContent: string, videoUrl: string): string {
        const videoId = ValidationUtils.extractVideoId(videoUrl);
        const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : videoUrl;

        return `${baseContent}

        OUTPUT FORMAT - BRIEF DESCRIPTION + RESOURCES:

        Use this EXACT template:

        ---
        title: {Video Title}
        source: ${videoUrl}
        created: "${new Date().toISOString().split('T')[0]}"
        modified: "${new Date().toISOString().split('T')[0]}"
        description: "One short paragraph (3-4 sentences) summarizing the video"
        type: youtube-note
        format: brief
        tags:
          - youtube
          - brief
        status: processed
        duration: "[Extract video duration]"
        channel: "[Extract channel name]"
        video_id: "${videoId || 'unknown'}"
        processing_date: "${new Date().toISOString()}"
    ai_provider: "__AI_PROVIDER__"
    ai_model: "__AI_MODEL__"
        ---

        <iframe width="640" height="360" src="${embedUrl}" title="{Video Title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

        ---

        ## Brief Description
        [Provide a concise 3-4 sentence description that captures the core message of the video]

        ## Resources
        - **Original Video:** [Watch on YouTube](${videoUrl})
        - **Channel:** [Creator's Channel](https://youtube.com/channel/[extract-channel-id])
        - **Top resources mentioned or related (links):**
          - [Resource 1]
          - [Resource 2]
          - [Resource 3]

        IMPORTANT: Keep the Brief Description short and focused. Provide 2-3 high-quality resource links that help the reader explore the topic further.`;
    }

    /**
     * Create executive summary prompt (≤250 words)
     */
    private createExecutiveSummaryPrompt(baseContent: string, videoUrl: string): string {
        const videoId = ValidationUtils.extractVideoId(videoUrl);
        const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : videoUrl;
        
        return `${baseContent}

        OUTPUT FORMAT - EXECUTIVE SUMMARY:
        
        Use this EXACT template:

        ---
        title: {Video Title}
        source: ${videoUrl}
        created: "${new Date().toISOString().split('T')[0]}"
        modified: "${new Date().toISOString().split('T')[0]}"
        description: "Single sentence capturing the core insight"
        type: youtube-note
        format: executive-summary
        tags:
          - youtube
          - executive-summary
          - tag_1
          - tag_2
          - tag_3
        status: processed
        duration: "[Extract video duration]"
        channel: "[Extract channel name]"
        video_id: "${videoId || 'unknown'}"
        processing_date: "${new Date().toISOString()}"
        word_count: 250
    ai_provider: "__AI_PROVIDER__"
    ai_model: "__AI_MODEL__"
        ---

        <iframe width="640" height="360" src="${embedUrl}" title="{Video Title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

        ---

        ## Key Insights
        - [Critical insight 1 with specific detail]
        - [Critical insight 2 with specific detail]
        - [Critical insight 3 with specific detail]

        ## Concise Summary
        [Provide a concise, cohesive summary in exactly two paragraphs, maximum 250 words total. Focus on the core value, main insights, and key actionable takeaways. Make every word count.]

        ## Resources
        - **Original Video:** [Watch on YouTube](${videoUrl})
        - **Channel:** [Creator's Channel](https://youtube.com/channel/[extract-channel-id])
        - **Key Tools/Frameworks:** [List main tools or frameworks mentioned]
        - **Official Documentation:** [Links to official docs for mentioned technologies]
        - **Further Reading:** [1-2 high-quality related articles or resources]

        CRITICAL: Keep the Executive Summary section to exactly 250 words or fewer. Be concise but comprehensive.`;
    }

    /**
     * Create detailed guide prompt
     */
    private createDetailedGuidePrompt(baseContent: string, videoUrl: string): string {
        const videoId = ValidationUtils.extractVideoId(videoUrl);
        const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : videoUrl;
        
        return `${baseContent}

        OUTPUT FORMAT - COMPREHENSIVE TUTORIAL:

        Use this EXACT template:

        ---
        title: {Video Title}
        source: ${videoUrl}
        created: "${new Date().toISOString().split('T')[0]}"
        modified: "${new Date().toISOString().split('T')[0]}"
        description: "Single sentence capturing the core insight"
        type: youtube-note
        format: detailed-tutorial
        tags:
          - youtube
          - tutorial
          - step-by-step
          - tag_1
          - tag_2
          - tag_3
        status: processed
        duration: "[Extract video duration]"
        channel: "[Extract channel name]"
        video_id: "${videoId || 'unknown'}"
        processing_date: "${new Date().toISOString()}"
        word_count: "[estimated word count]"
    ai_provider: "__AI_PROVIDER__"
    ai_model: "__AI_MODEL__"
        difficulty: "[beginner/intermediate/advanced]"
        estimated_time: "[time to complete]"
        ---

        <iframe width="640" height="360" src="${embedUrl}" title="{Video Title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

        ---

        ## Comprehensive Tutorial

        ### Concise Summary

        [Two-part response: a concise summary under 150 words that captures the video's core value and main insights]

        ## Step-by-Step Implementation Guide
        ### Step 1: [Action Title]
        - Detailed instruction 1
        - Detailed instruction 2
        - Key considerations or tips
        
        ### Step 2: [Action Title]
        - Detailed instruction 1
        - Detailed instruction 2
        - Key considerations or tips

        [Continue with additional steps as needed - provide comprehensive coverage]

        ## Resources
        - **Original Video:** [Watch on YouTube](${videoUrl})
        - **Channel:** [Creator's Channel](https://youtube.com/channel/[extract-channel-id])
        - **Related Documentation:** [If any tools/frameworks mentioned, provide official docs links]
        - **Additional Learning:** [Suggest 2-3 related high-quality resources]
        - **Tools & Software:** [List any tools mentioned with download/setup links]
        - **Community:** [Relevant forums, Discord servers, or communities]

        IMPORTANT: Provide detailed, actionable steps that someone could follow to implement the concepts from the video.`;
    }

    /**
     * Process AI response and inject provider information
     */
    processAIResponse(content: string, provider: string, model: string, format?: OutputFormat): string {
        if (!content) {
            return content;
        }

        const providerValue = provider || 'unknown';
        const modelValue = model || 'unknown';

        let updatedContent = content
            .replace(/__AI_PROVIDER__/g, providerValue)
            .replace(/__AI_MODEL__/g, modelValue);

        updatedContent = this.ensureFrontMatterValue(updatedContent, 'ai_provider', providerValue);
        updatedContent = this.ensureFrontMatterValue(updatedContent, 'ai_model', modelValue);

        return updatedContent;
    }

    private ensureFrontMatterValue(content: string, key: string, value: string): string {
        const pattern = new RegExp(`(${key}\\s*:\\s*)(["'])?([^"'\\n]*)(["'])?`, 'i');
        if (pattern.test(content)) {
            return content.replace(pattern, (_, prefix: string, openingQuote?: string, _existing?: string, closingQuote?: string) => {
                const quote = openingQuote || closingQuote ? '"' : '';
                return `${prefix}${quote}${value}${quote}`;
            });
        }

        if (content.startsWith('---')) {
            return content.replace(/^---\s*\n/, `---\n${key}: "${value}"\n`);
        }

        return content;
    }

    /**
     * Create a summary prompt for shorter content
     */
    createSummaryPrompt(videoData: VideoData, videoUrl: string): string {
        return `Create a concise summary for this YouTube video:

        Title: ${videoData.title}
        URL: ${videoUrl}
        Description: ${videoData.description}

        Please provide:
        1. A 2-paragraph summary (max 250 words)
        2. 3-5 key takeaways
        3. Main actionable insights

        Format as markdown with clear headings.`;
    }

    /**
     * Validate prompt length and content
     */
    validatePrompt(prompt: string): boolean {
        return Boolean(prompt) && 
               typeof prompt === 'string' && 
               prompt.trim().length > 10 && 
               prompt.length < 50000; // Reasonable upper limit
    }
}
