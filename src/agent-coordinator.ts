/**
 * Multi-Agent Orchestration System for End-to-End Optimization
 * Coordinates specialized agents for performance, security, and quality optimization
 */

import { Agent, AgentContext, AgentResult } from './types/agent-types';

export interface OptimizationGoals {
    performance: {
        targetProcessingTime: number; // in seconds
        minCacheHitRate: number; // percentage
        maxMemoryUsage: number; // in MB
        enableParallelProcessing: boolean;
    };
    security: {
        requireSecureApiCalls: boolean;
        encryptSensitiveData: boolean;
        validateAllInputs: boolean;
        sanitizeOutputs: boolean;
    };
    quality: {
        minTestCoverage: number; // percentage
        maxComplexityScore: number;
        enforceCodeStandards: boolean;
        requireDocumentation: boolean;
    };
    ux: {
        maxLoadingTime: number; // in seconds
        minAccessibilityScore: number;
        requireProgressFeedback: boolean;
        supportOfflineMode: boolean;
    };
}

export class AgentCoordinator {
    private agents: Map<string, Agent> = new Map();
    private executionHistory: AgentResult[] = [];
    private currentContext: LocalAgentContext;

    constructor(
        private projectRoot: string,
        private optimizationGoals: OptimizationGoals
    ) {
        this.currentContext = {
            projectRoot,
            timestamp: new Date(),
            goals: optimizationGoals,
            environment: this.detectEnvironment(),
            cache: new Map()
        };
    }

    /**
     * Register an agent with the coordinator
     */
    registerAgent(agent: Agent): void {
        this.agents.set(agent.name, agent);
    }

    /**
     * Execute end-to-end optimization workflow
     */
    async runOptimizationWorkflow(): Promise<{
        results: AgentResult[];
        summary: OptimizationSummary;
        recommendations: string[];
    }> {
        console.log('🚀 Starting end-to-end optimization workflow...');

        const workflow: AgentWorkflow = {
            phases: [
                // Phase 1: Analysis and Assessment
                {
                    name: 'analysis',
                    agents: ['performance-analyzer', 'security-scanner', 'quality-analyzer'],
                    parallel: true
                },

                // Phase 2: Optimization Implementation
                {
                    name: 'optimization',
                    agents: ['performance-optimizer', 'security-hardener', 'code-refactorer'],
                    parallel: false,
                    dependencies: ['analysis']
                },

                // Phase 3: Validation and Testing
                {
                    name: 'validation',
                    agents: ['performance-validator', 'security-tester', 'integration-tester'],
                    parallel: true,
                    dependencies: ['optimization']
                },

                // Phase 4: UX Enhancement
                {
                    name: 'enhancement',
                    agents: ['ux-optimizer', 'accessibility-improver', 'performance-monitor'],
                    parallel: false,
                    dependencies: ['validation']
                }
            ]
        };

        const results: AgentResult[] = [];

        // Execute workflow phases
        for (const phase of workflow.phases) {
            console.log(`📋 Executing phase: ${phase.name}`);

            // Check dependencies
            if (phase.dependencies) {
                await this.checkDependencies(phase.dependencies);
            }

            // Execute agents in phase
            const phaseResults = await this.executePhase(phase);
            results.push(...phaseResults);

            // Check for critical failures
            const criticalFailures = phaseResults.filter(r => r.severity === 'critical');
            if (criticalFailures.length > 0) {
                console.error('❌ Critical failures detected, stopping workflow');
                break;
            }
        }

        const summary = this.generateSummary(results);
        const recommendations = this.generateRecommendations(results, summary);

        return { results, summary, recommendations };
    }

    /**
     * Execute a single workflow phase
     */
    private async executePhase(phase: WorkflowPhase): Promise<AgentResult[]> {
        const phaseAgents = phase.agents
            .map(name => this.agents.get(name))
            .filter(Boolean) as Agent[];

        if (phase.parallel) {
            // Execute agents in parallel
            const promises = phaseAgents.map(agent => this.executeAgent(agent));
            const results = await Promise.allSettled(promises);

            return results
                .filter(r => r.status === 'fulfilled')
                .map(r => (r as PromiseFulfilledResult<AgentResult>).value);
        } else {
            // Execute agents sequentially
            const results: AgentResult[] = [];
            for (const agent of phaseAgents) {
                const result = await this.executeAgent(agent);
                results.push(result);

                // Update context with agent results
                this.updateContext(result);

                // Check if agent failed critically
                if (result.severity === 'critical') {
                    break;
                }
            }
            return results;
        }
    }

    /**
     * Execute a single agent
     */
    private async executeAgent(agent: Agent): Promise<AgentResult> {
        console.log(`🤖 Executing agent: ${agent.name}`);

        const startTime = Date.now();

        try {
            const result = await agent.execute(this.currentContext);
            const executionTime = Date.now() - startTime;

            const agentResult: AgentResult = {
                agent: agent.name,
                success: true,
                executionTime,
                changes: result.changes || [],
                metrics: result.metrics || {},
                artifacts: result.artifacts || [],
                severity: result.severity || 'info',
                message: result.message || `${agent.name} completed successfully`
            };

            this.executionHistory.push(agentResult);
            console.log(`✅ ${agent.name} completed in ${executionTime}ms`);

            return agentResult;

        } catch (error) {
            const executionTime = Date.now() - startTime;

            const agentResult: AgentResult = {
                agent: agent.name,
                success: false,
                executionTime,
                changes: [],
                metrics: {},
                artifacts: [],
                severity: 'error',
                message: `${agent.name} failed: ${(error as Error).message}`,
                error: error as Error
            };

            this.executionHistory.push(agentResult);
            console.error(`❌ ${agent.name} failed:`, error);

            return agentResult;
        }
    }

    /**
     * Update context with agent results
     */
    private updateContext(result: AgentResult): void {
        // Store metrics in context cache
        if (result.metrics) {
            Object.entries(result.metrics).forEach(([key, value]) => {
                this.currentContext.cache.set(`${result.agent}_${key}`, value);
            });
        }

        // Update context with changes
        this.currentContext.lastAgentResult = result;
        this.currentContext.timestamp = new Date();
    }

    /**
     * Check workflow dependencies
     */
    private async checkDependencies(dependencies: string[]): Promise<void> {
        for (const dependency of dependencies) {
            const dependencyResults = this.executionHistory.filter(
                r => r.agent === dependency && r.success
            );

            if (dependencyResults.length === 0) {
                throw new Error(`Dependency not satisfied: ${dependency}`);
            }
        }
    }

    /**
     * Generate optimization summary
     */
    private generateSummary(results: AgentResult[]): OptimizationSummary {
        const successful = results.filter(r => r.success).length;
        const failed = results.length - successful;

        const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
        const criticalIssues = results.filter(r => r.severity === 'critical').length;
        const warnings = results.filter(r => r.severity === 'warning').length;

        const performanceImprovements = this.extractPerformanceMetrics(results);
        const securityEnhancements = this.extractSecurityMetrics(results);
        const qualityImprovements = this.extractQualityMetrics(results);

        return {
            totalAgents: results.length,
            successfulAgents: successful,
            failedAgents: failed,
            totalExecutionTime,
            criticalIssues,
            warnings,
            performanceImprovements,
            securityEnhancements,
            qualityImprovements,
            overallScore: this.calculateOverallScore(results)
        };
    }

    /**
     * Generate actionable recommendations
     */
    private generateRecommendations(results: AgentResult[], summary: OptimizationSummary): string[] {
        const recommendations: string[] = [];

        // Performance recommendations
        if (summary.performanceImprovements.processingTimeReduction < 50) {
            recommendations.push('Consider implementing additional caching strategies for better performance');
        }

        // Security recommendations
        if (summary.securityEnhancements.vulnerabilitiesFixed < 5) {
            recommendations.push('Review and implement additional security measures');
        }

        // Quality recommendations
        if (summary.qualityImprovements.codeQualityImprovement < 30) {
            recommendations.push('Focus on code refactoring and testing improvements');
        }

        // Critical issue recommendations
        if (summary.criticalIssues > 0) {
            recommendations.push('Address critical issues immediately before deployment');
        }

        // Agent-specific recommendations
        results.forEach(result => {
            if (!result.success && result.agent === 'performance-analyzer') {
                recommendations.push('Performance analysis failed - check monitoring tools and metrics collection');
            }
        });

        return recommendations;
    }

    /**
     * Detect current environment
     */
    private detectEnvironment(): 'development' | 'staging' | 'production' {
        if (process.env.NODE_ENV === 'production') return 'production';
        if (process.env.NODE_ENV === 'staging') return 'staging';
        return 'development';
    }

    /**
     * Extract performance metrics from results
     */
    private extractPerformanceMetrics(results: AgentResult[]) {
        const perfResults = results.filter(r => r.agent.includes('performance'));
        return {
            processingTimeReduction: this.getAverageMetric(perfResults, 'processingTimeReduction') || 0,
            cacheHitRate: this.getAverageMetric(perfResults, 'cacheHitRate') || 0,
            memoryOptimization: this.getAverageMetric(perfResults, 'memoryOptimization') || 0
        };
    }

    /**
     * Extract security metrics from results
     */
    private extractSecurityMetrics(results: AgentResult[]) {
        const secResults = results.filter(r => r.agent.includes('security'));
        return {
            vulnerabilitiesFixed: this.getSumMetric(secResults, 'vulnerabilitiesFixed') || 0,
            securityScore: this.getAverageMetric(secResults, 'securityScore') || 0,
            complianceLevel: this.getAverageMetric(secResults, 'complianceLevel') || 0
        };
    }

    /**
     * Extract quality metrics from results
     */
    private extractQualityMetrics(results: AgentResult[]) {
        const qualResults = results.filter(r => r.agent.includes('quality') || r.agent.includes('refactor'));
        return {
            codeQualityImprovement: this.getAverageMetric(qualResults, 'codeQualityImprovement') || 0,
            testCoverageIncrease: this.getAverageMetric(qualResults, 'testCoverageIncrease') || 0,
            complexityReduction: this.getAverageMetric(qualResults, 'complexityReduction') || 0
        };
    }

    /**
     * Calculate overall optimization score
     */
    private calculateOverallScore(results: AgentResult[]): number {
        const successRate = results.filter(r => r.success).length / results.length;
        const avgSeverity = this.calculateAverageSeverity(results);

        return Math.round((successRate * 60) + (avgSeverity * 40));
    }

    /**
     * Calculate average severity score
     */
    private calculateAverageSeverity(results: AgentResult[]): number {
        const severityScores = {
            info: 1.0,
            warning: 0.7,
            error: 0.3,
            critical: 0.0
        };

        const totalScore = results.reduce((sum, result) => {
            return sum + (severityScores[result.severity] || 0.5);
        }, 0);

        return totalScore / results.length;
    }

    /**
     * Helper to get average metric value
     */
    private getAverageMetric(results: AgentResult[], metricName: string): number | undefined {
        const values = results
            .map(r => r.metrics[metricName])
            .filter(v => typeof v === 'number') as number[];

        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : undefined;
    }

    /**
     * Helper to get sum metric value
     */
    private getSumMetric(results: AgentResult[], metricName: string): number | undefined {
        const sum = results.reduce((total, result) => {
            const value = result.metrics[metricName];
            return total + (typeof value === 'number' ? value : 0);
        }, 0);

        return sum > 0 ? sum : undefined;
    }
}

// Type definitions
interface LocalAgentContext {
    projectRoot: string;
    timestamp: Date;
    goals: OptimizationGoals;
    environment: 'development' | 'staging' | 'production';
    cache: Map<string, any>;
    lastAgentResult?: AgentResult;
}

interface AgentWorkflow {
    phases: WorkflowPhase[];
}

interface WorkflowPhase {
    name: string;
    agents: string[];
    parallel: boolean;
    dependencies?: string[];
}

interface OptimizationSummary {
    totalAgents: number;
    successfulAgents: number;
    failedAgents: number;
    totalExecutionTime: number;
    criticalIssues: number;
    warnings: number;
    performanceImprovements: {
        processingTimeReduction: number;
        cacheHitRate: number;
        memoryOptimization: number;
    };
    securityEnhancements: {
        vulnerabilitiesFixed: number;
        securityScore: number;
        complianceLevel: number;
    };
    qualityImprovements: {
        codeQualityImprovement: number;
        testCoverageIncrease: number;
        complexityReduction: number;
    };
    overallScore: number; // 0-100
}