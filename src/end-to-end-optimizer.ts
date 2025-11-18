/**
 * End-to-End Optimization Workflow
 * Main entry point for running the complete multi-agent optimization system
 */

import { AgentCoordinator, OptimizationGoals } from './agent-coordinator';
import { PerformanceOptimizerAgent } from './performance-optimizer';
import { SecurityHardenerAgent } from './security-hardener';
import { OptimizationReport, Recommendation } from './types/agent-types';

export class EndToEndOptimizer {
    private coordinator: AgentCoordinator;

    constructor(
        private projectRoot: string,
        private goals: OptimizationGoals
    ) {
        this.coordinator = new AgentCoordinator(projectRoot, goals);
        this.setupAgents();
    }

    /**
     * Run complete end-to-end optimization
     */
    async runOptimization(): Promise<OptimizationReport> {
        console.log('🚀 Starting End-to-End Optimization Workflow');
        console.log('Project:', this.projectRoot);
        console.log('Goals:', JSON.stringify(this.goals, null, 2));

        try {
            const startTime = Date.now();

            // Execute the optimization workflow
            const { results, summary, recommendations } = await this.coordinator.runOptimizationWorkflow();

            const duration = Date.now() - startTime;

            // Generate comprehensive report
            // Convert string recommendations to Recommendation objects
            const recommendationObjects: Recommendation[] = (recommendations as string[]).map((rec, index) => ({
                category: 'quality' as const,
                priority: 'medium' as const,
                title: `Recommendation ${index + 1}`,
                description: rec,
                estimatedImpact: 'Improves overall system quality',
                implementationComplexity: 'moderate' as const
            }));

            const report: OptimizationReport = {
                timestamp: new Date(),
                duration,
                agents: results,
                summary,
                recommendations: recommendationObjects,
                nextSteps: this.generateNextSteps(recommendationObjects, summary)
            };

            // Save report
            await this.saveReport(report);

            // Display summary
            this.displaySummary(report);

            return report;

        } catch (error) {
            console.error('❌ End-to-end optimization failed:', error);
            throw error;
        }
    }

    /**
     * Quick optimization for common use cases
     */
    async quickOptimize(type: 'performance' | 'security' | 'quality' | 'full' | 'quick' = 'full'): Promise<void> {
        const quickGoals = this.createQuickGoals(type);
        const quickCoordinator = new AgentCoordinator(this.projectRoot, quickGoals);

        // Register only relevant agents
        if (type === 'performance' || type === 'full') {
            quickCoordinator.registerAgent(new PerformanceOptimizerAgent());
        }

        if (type === 'security' || type === 'full') {
            quickCoordinator.registerAgent(new SecurityHardenerAgent());
        }

        // Run targeted optimization
        const results = await quickCoordinator.runOptimizationWorkflow();

        console.log(`✅ Quick ${type} optimization completed`);
        console.log(`Agents executed: ${results.results.length}`);
        console.log(`Overall score: ${results.summary.overallScore}/100`);
    }

    /**
     * Setup and register all agents
     */
    private setupAgents(): void {
        // Performance optimization agent
        this.coordinator.registerAgent(new PerformanceOptimizerAgent());

        // Security hardening agent
        this.coordinator.registerAgent(new SecurityHardenerAgent());

        // TODO: Add more agents as they're created
        // this.coordinator.registerAgent(new CodeQualityAgent());
        // this.coordinator.registerAgent(new UXOptimizerAgent());
        // this.coordinator.registerAgent(new DocumentationAgent());
        // this.coordinator.registerAgent(new TestingAgent());
    }

    /**
     * Create goals for quick optimization
     */
    private createQuickGoals(type: string): OptimizationGoals {
        const defaultGoals = {
            performance: {
                targetProcessingTime: type === 'performance' ? 10 : 30,
                minCacheHitRate: 80,
                maxMemoryUsage: 100,
                enableParallelProcessing: true
            },
            security: {
                requireSecureApiCalls: true,
                encryptSensitiveData: true,
                validateAllInputs: true,
                sanitizeOutputs: true
            },
            quality: {
                minTestCoverage: type === 'quality' ? 90 : 70,
                maxComplexityScore: type === 'quality' ? 10 : 20,
                enforceCodeStandards: true,
                requireDocumentation: type === 'quality'
            },
            ux: {
                maxLoadingTime: 5,
                minAccessibilityScore: 90,
                requireProgressFeedback: true,
                supportOfflineMode: false
            }
        };

        // Adjust goals based on optimization type
        if (type === 'performance') {
            defaultGoals.performance.targetProcessingTime = 5;
            defaultGoals.performance.enableParallelProcessing = true;
        } else if (type === 'security') {
            defaultGoals.security.requireSecureApiCalls = true;
            defaultGoals.security.encryptSensitiveData = true;
        } else if (type === 'quality') {
            defaultGoals.quality.minTestCoverage = 95;
            defaultGoals.quality.maxComplexityScore = 8;
        }

        return defaultGoals;
    }

    /**
     * Generate next action items
     */
    private generateNextSteps(recommendations: any[], summary: any): any[] {
        const nextSteps: any[] = [];

        // Add high-priority recommendations as action items
        recommendations
            .filter(r => r.priority === 'critical' || r.priority === 'high')
            .forEach(rec => {
                nextSteps.push({
                    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title: rec.title,
                    description: rec.description,
                    assignee: 'development-team',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
                    status: 'pending',
                    priority: rec.priority
                });
            });

        // Add suggested improvements
        if (summary.overallScore < 80) {
            nextSteps.push({
                id: `improve-${Date.now()}`,
                title: 'Improve overall optimization score',
                description: `Current score is ${summary.overallScore}/100. Aim for 90+ by addressing remaining issues.`,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
                status: 'pending'
            });
        }

        return nextSteps;
    }

    /**
     * Save optimization report
     */
    private async saveReport(report: OptimizationReport): Promise<void> {
        const reportsDir = this.projectRoot + '/optimization-reports';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = `${reportsDir}/optimization-report-${timestamp}.json`;

        try {
            // Create reports directory if it doesn't exist
            await import('fs/promises').then(fs => fs.mkdir(reportsDir, { recursive: true }));

            // Save detailed report
            await import('fs/promises').then(fs =>
                fs.writeFile(reportPath, JSON.stringify(report, null, 2))
            );

            // Save human-readable summary
            const summaryPath = `${reportsDir}/optimization-summary-${timestamp}.md`;
            const summaryContent = this.generateMarkdownSummary(report);
            await import('fs/promises').then(fs => fs.writeFile(summaryPath, summaryContent));

            console.log(`📊 Report saved: ${reportPath}`);
            console.log(`📝 Summary saved: ${summaryPath}`);

        } catch (error) {
            console.warn('Could not save report:', error);
        }
    }

    /**
     * Generate markdown summary
     */
    private generateMarkdownSummary(report: OptimizationReport): string {
        return `# Optimization Report

**Generated:** ${report.timestamp.toISOString()}
**Duration:** ${Math.round(report.duration / 1000)}s
**Overall Score:** ${report.summary.overallScore}/100

## Executive Summary

- **Total Agents:** ${report.summary.totalAgents}
- **Successful:** ${report.summary.successfulAgents}
- **Failed:** ${report.summary.failedAgents}
- **Critical Issues:** ${report.summary.criticalIssues}
- **Warnings:** ${report.summary.warnings}

## Performance Improvements

- **Processing Time Reduction:** ${Math.round(report.summary.performanceImprovements.processingTimeReduction * 100)}%
- **Cache Hit Rate:** ${Math.round(report.summary.performanceImprovements.cacheHitRate * 100)}%
- **Memory Optimization:** ${Math.round(report.summary.performanceImprovements.memoryOptimization * 100)}%

## Security Enhancements

- **Vulnerabilities Fixed:** ${report.summary.securityEnhancements.vulnerabilitiesFixed}
- **Security Score:** ${Math.round(report.summary.securityEnhancements.securityScore * 100)}/100
- **Compliance Level:** ${Math.round(report.summary.securityEnhancements.complianceLevel * 100)}%

## Quality Improvements

- **Code Quality:** ${Math.round(report.summary.qualityImprovements.codeQualityImprovement * 100)}%
- **Test Coverage:** ${Math.round(report.summary.qualityImprovements.testCoverageIncrease * 100)}%
- **Complexity Reduction:** ${Math.round(report.summary.qualityImprovements.complexityReduction * 100)}%

## Top Recommendations

${report.recommendations
    .filter(r => r.priority === 'critical' || r.priority === 'high')
    .slice(0, 5)
    .map(r => `- **${r.title}** (${r.priority}): ${r.description}`)
    .join('\n')}

## Next Steps

${report.nextSteps
    .slice(0, 5)
    .map(s => `- [ ] ${s.title}`)
    .join('\n')}

---

*Generated by YoutubeClipper End-to-End Optimizer*
`;
    }

    /**
     * Display optimization summary
     */
    private displaySummary(report: OptimizationReport): void {
        console.log('\n' + '='.repeat(60));
        console.log('📊 OPTIMIZATION SUMMARY');
        console.log('='.repeat(60));

        console.log(`⏱️  Duration: ${Math.round(report.duration / 1000)}s`);
        console.log(`🎯 Overall Score: ${report.summary.overallScore}/100`);
        console.log(`✅ Successful Agents: ${report.summary.successfulAgents}/${report.summary.totalAgents}`);

        if (report.summary.criticalIssues > 0) {
            console.log(`⚠️  Critical Issues: ${report.summary.criticalIssues}`);
        }

        console.log('\n📈 Key Improvements:');
        console.log(`   • Processing Time: -${Math.round(report.summary.performanceImprovements.processingTimeReduction * 100)}%`);
        console.log(`   • Security Score: ${Math.round(report.summary.securityEnhancements.securityScore * 100)}/100`);
        console.log(`   • Code Quality: +${Math.round(report.summary.qualityImprovements.codeQualityImprovement * 100)}%`);

        console.log('\n🔥 Top Recommendations:');
        report.recommendations
            .filter(r => r.priority === 'critical' || r.priority === 'high')
            .slice(0, 3)
            .forEach(r => {
                console.log(`   • ${r.title} (${r.priority})`);
            });

        console.log('\n' + '='.repeat(60));
    }

    /**
     * Get current optimization status
     */
    async getStatus(): Promise<{
        projectRoot: string;
        lastOptimization?: Date;
        currentGoals: OptimizationGoals;
        recommendations: Recommendation[];
    }> {
        return {
            projectRoot: this.projectRoot,
            currentGoals: this.goals,
            recommendations: this.generateQuickRecommendations()
        };
    }

    /**
     * Generate quick recommendations
     */
    private generateQuickRecommendations(): Recommendation[] {
        const recommendations: Recommendation[] = [];

        if (this.goals.performance.targetProcessingTime > 15) {
            recommendations.push({
                category: 'performance',
                priority: 'medium',
                title: 'Optimize Performance',
                description: 'Consider more aggressive performance optimization for better speed',
                estimatedImpact: 'Reduces processing time by 20-30%',
                implementationComplexity: 'moderate'
            });
        }

        if (!this.goals.security.requireSecureApiCalls) {
            recommendations.push({
                category: 'security',
                priority: 'high',
                title: 'Enable Secure API Calls',
                description: 'Enable secure API calls for better security',
                estimatedImpact: 'Significantly improves security posture',
                implementationComplexity: 'simple'
            });
        }

        if (this.goals.quality.minTestCoverage < 80) {
            recommendations.push({
                category: 'quality',
                priority: 'medium',
                title: 'Increase Test Coverage',
                description: 'Increase test coverage for better code quality',
                estimatedImpact: 'Improves code reliability and maintainability',
                implementationComplexity: 'moderate'
            });
        }

        if (!this.goals.ux.requireProgressFeedback) {
            recommendations.push({
                category: 'ux',
                priority: 'low',
                title: 'Add Progress Feedback',
                description: 'Add progress feedback for better user experience',
                estimatedImpact: 'Improves user satisfaction and perceived performance',
                implementationComplexity: 'simple'
            });
        }

        return recommendations;
    }
}

// Convenience function for quick usage
export async function optimizeProject(
    projectRoot: string = process.cwd(),
    options: {
        type?: 'performance' | 'security' | 'quality' | 'full' | 'quick';
        goals?: Partial<OptimizationGoals>;
        quick?: boolean;
    } = {}
): Promise<OptimizationReport | void> {
    const goals: OptimizationGoals = {
        performance: {
            targetProcessingTime: 15,
            minCacheHitRate: 80,
            maxMemoryUsage: 100,
            enableParallelProcessing: true,
            ...options.goals?.performance
        },
        security: {
            requireSecureApiCalls: true,
            encryptSensitiveData: true,
            validateAllInputs: true,
            sanitizeOutputs: true,
            ...options.goals?.security
        },
        quality: {
            minTestCoverage: 75,
            maxComplexityScore: 15,
            enforceCodeStandards: true,
            requireDocumentation: false,
            ...options.goals?.quality
        },
        ux: {
            maxLoadingTime: 10,
            minAccessibilityScore: 85,
            requireProgressFeedback: true,
            supportOfflineMode: false,
            ...options.goals?.ux
        }
    };

    const optimizer = new EndToEndOptimizer(projectRoot, goals);

    if (options.quick) {
        return optimizer.quickOptimize(options.type);
    } else {
        return optimizer.runOptimization();
    }
}

// CLI-ready function
export async function runOptimizationCLI(): Promise<void> {
    const args = process.argv.slice(2);
    const type = args.includes('--performance') ? 'performance' :
                 args.includes('--security') ? 'security' :
                 args.includes('--quality') ? 'quality' :
                 args.includes('--quick') ? 'quick' :
                 'full';

    const quick = args.includes('--quick');

    try {
        console.log('🚀 YoutubeClipper End-to-End Optimizer');
        console.log('=====================================\n');

        if (quick) {
            await optimizeProject(process.cwd(), { type, quick });
        } else {
            const report = await optimizeProject(process.cwd(), { type });
            console.log('\n✅ Optimization completed successfully!');
        }

    } catch (error) {
        console.error('\n❌ Optimization failed:', error);
        process.exit(1);
    }
}

// Export for programmatic use
export { EndToEndOptimizer as default };
export { AgentCoordinator, PerformanceOptimizerAgent, SecurityHardenerAgent };