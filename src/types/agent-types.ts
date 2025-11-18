/**
 * Type definitions for the multi-agent optimization system
 */

export interface Agent {
    name: string;
    version: string;
    capabilities: AgentCapability[];
    execute(context: AgentContext): Promise<AgentExecutionResult>;
    validate?(context: AgentContext): Promise<boolean>;
}

export interface AgentCapability {
    name: string;
    description: string;
    dependencies: string[];
}

export interface AgentContext {
    projectRoot: string;
    timestamp: Date;
    goals: OptimizationGoals;
    environment: 'development' | 'staging' | 'production';
    cache: Map<string, any>;
    lastAgentResult?: AgentResult;
}

export interface AgentExecutionResult {
    success: boolean;
    changes: CodeChange[];
    metrics: Record<string, number>;
    artifacts: Artifact[];
    message: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
}

export interface AgentResult {
    agent: string;
    success: boolean;
    executionTime: number;
    changes: CodeChange[];
    metrics: Record<string, number>;
    artifacts: Artifact[];
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    error?: Error;
}

export interface OptimizationGoals {
    performance: PerformanceGoals;
    security: SecurityGoals;
    quality: QualityGoals;
    ux: UXGoals;
}

export interface PerformanceGoals {
    targetProcessingTime: number;
    minCacheHitRate: number;
    maxMemoryUsage: number;
    enableParallelProcessing: boolean;
}

export interface SecurityGoals {
    requireSecureApiCalls: boolean;
    encryptSensitiveData: boolean;
    validateAllInputs: boolean;
    sanitizeOutputs: boolean;
}

export interface QualityGoals {
    minTestCoverage: number;
    maxComplexityScore: number;
    enforceCodeStandards: boolean;
    requireDocumentation: boolean;
}

export interface UXGoals {
    maxLoadingTime: number;
    minAccessibilityScore: number;
    requireProgressFeedback: boolean;
    supportOfflineMode: boolean;
}

export interface CodeChange {
    type: 'add' | 'modify' | 'delete' | 'refactor' | 'config' | 'architecture';
    file: string;
    line?: number;
    description: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    automated?: boolean;
}

export interface Artifact {
    type: 'config' | 'test' | 'documentation' | 'analysis' | 'cache';
    name: string;
    path?: string;
    content?: string;
    metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
    processingTime: number;
    memoryUsage: number;
    cacheHitRate: number;
    networkRequests: number;
    bundleSize: number;
    errorRate: number;
}

export interface SecurityMetrics {
    vulnerabilityCount: number;
    securityScore: number;
    encryptionLevel: string;
    authenticationStrength: number;
    complianceLevel: number;
}

export interface QualityMetrics {
    codeQualityScore: number;
    testCoverage: number;
    complexityScore: number;
    maintainabilityIndex: number;
    documentationCoverage: number;
}

export interface UXMetrics {
    loadingTime: number;
    accessibilityScore: number;
    userSatisfactionRating: number;
    errorRecoveryTime: number;
    featureAdoptionRate: number;
}

export interface OptimizationReport {
    timestamp: Date;
    duration: number;
    agents: AgentResult[];
    summary: OptimizationSummary;
    recommendations: Recommendation[];
    nextSteps: ActionItem[];
}

export interface Recommendation {
    category: 'performance' | 'security' | 'quality' | 'ux';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    estimatedImpact: string;
    implementationComplexity: 'simple' | 'moderate' | 'complex';
}

export interface ActionItem {
    id: string;
    title: string;
    description: string;
    assignee?: string;
    dueDate?: Date;
    status: 'pending' | 'in-progress' | 'completed';
    dependencies?: string[];
}

export interface AgentConfig {
    enabled: boolean;
    priority: number;
    timeout: number;
    retryAttempts: number;
    customSettings?: Record<string, any>;
}

export interface AnalysisScope {
    files: string[];
    directories: string[];
    excludePatterns: string[];
    includeTests: boolean;
    includeDependencies: boolean;
}

export interface OptimizationStrategy {
    name: string;
    description: string;
    tactics: OptimizationTactic[];
    expectedOutcomes: string[];
}

export interface OptimizationTactic {
    name: string;
    implementation: string;
    resources: string[];
    risks: string[];
}

// Agent-specific types
export interface PerformanceAnalysisResult {
    bottlenecks: PerformanceBottleneck[];
    optimizations: Optimization[];
    metrics: PerformanceMetrics;
}

export interface PerformanceBottleneck {
    type: 'cpu' | 'memory' | 'network' | 'io' | 'algorithm';
    location: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestions: string[];
}

export interface Optimization {
    type: 'code' | 'config' | 'architecture' | 'algorithm';
    description: string;
    implementation: string;
    estimatedGain: number;
    complexity: 'simple' | 'moderate' | 'complex';
}

export interface SecurityVulnerability {
    type: 'injection' | 'xss' | 'authentication' | 'authorization' | 'crypto' | 'data';
    severity: 'low' | 'medium' | 'high' | 'critical';
    location: string;
    description: string;
    fix: string;
    cve?: string;
}

export interface QualityIssue {
    type: 'complexity' | 'duplication' | 'maintainability' | 'testing' | 'documentation';
    severity: 'low' | 'medium' | 'high';
    location: string;
    description: string;
    suggestion: string;
}

export interface UXIssue {
    type: 'accessibility' | 'performance' | 'usability' | 'navigation' | 'feedback';
    severity: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
    solution: string;
}

// Event system types
export interface AgentEvent {
    type: 'start' | 'progress' | 'complete' | 'error' | 'warning';
    agent: string;
    timestamp: Date;
    data?: any;
    message?: string;
}

export interface EventHandler {
    (event: AgentEvent): void;
}

export interface AgentLogger {
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, error?: Error, data?: any): void;
}

// Monitoring and health check types
export interface HealthCheck {
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    lastChecked: Date;
    metrics: Record<string, number>;
    message?: string;
}

export interface AgentHealthStatus {
    agent: string;
    status: 'online' | 'offline' | 'degraded';
    lastActivity: Date;
    successRate: number;
    averageExecutionTime: number;
    errorCount: number;
    healthChecks: HealthCheck[];
}

// Configuration and deployment types
export interface DeploymentConfig {
    environment: 'development' | 'staging' | 'production';
    agents: Record<string, AgentConfig>;
    workflows: AgentWorkflow[];
    monitoring: MonitoringConfig;
    notifications: NotificationConfig;
}

export interface MonitoringConfig {
    enabled: boolean;
    metrics: string[];
    alerts: AlertConfig[];
    dashboards: DashboardConfig[];
}

export interface AlertConfig {
    name: string;
    condition: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    channels: string[];
}

export interface DashboardConfig {
    name: string;
    widgets: WidgetConfig[];
}

export interface WidgetConfig {
    type: string;
    title: string;
    dataSource: string;
    refreshInterval: number;
}

export interface NotificationConfig {
    channels: NotificationChannel[];
    routing: NotificationRouting[];
}

export interface NotificationChannel {
    name: string;
    type: 'email' | 'slack' | 'webhook' | 'console';
    config: Record<string, any>;
}

export interface NotificationRouting {
    eventType: string;
    severity: string;
    channels: string[];
}

// Missing interfaces
export interface OptimizationSummary {
    overallScore: number;
    totalAgents: number;
    successfulAgents: number;
    failedAgents: number;
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
}

export interface AgentWorkflow {
    id: string;
    name: string;
    description: string;
    phases: WorkflowPhase[];
}

export interface WorkflowPhase {
    name: string;
    description: string;
    agents: string[];
    dependencies?: string[];
    status?: 'pending' | 'running' | 'completed' | 'failed';
}