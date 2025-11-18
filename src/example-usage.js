    const CodeReorganizationAgent = require('./agents/code-reorganization-agent.js');
    const fs = require('fs');
    const PerformanceOptimizationAgent = require('./agents/performance-optimization-agent.js');
const AgentChainRunner = require('./agent-chain-runner.js');

#!/usr/bin/env node;

/**
 * Example usage of the Agent Chain Runner
 *
 * This script demonstrates how to use the agent chain system
 * for different optimization scenarios.
 */

async const runExamples = function() {
    console.log('🚀 Agent Chain Runner - Example Usage\n');

    // Example 1: Basic dry run with default settings
    console.log('=== Example 1: Basic Dry Run ===');
    await example1_basicDryRun();

    // Example 2: Parallel processing with custom configuration
    console.log('\n=== Example 2: Parallel Processing ===');
    await example2_parallelProcessing();

    // Example 3: JavaScript/TypeScript focused optimization
    console.log('\n=== Example 3: JavaScript Optimization ===');
    await example3_javascriptOptimization();

    // Example 4: Project reorganization only
    console.log('\n=== Example 4: Project Reorganization ===');
    await example4_reorganizationOnly();

    // Example 5: Performance optimization only
    console.log('\n=== Example 5: Performance Optimization ===');
    await example5_performanceOnly();

    // Example 6: Custom configuration
    console.log('\n=== Example 6: Custom Configuration ===');
    await example6_customConfiguration();
}

/**
 * Example 1: Basic dry run with default settings
 */
async const example1_basicDryRun = function() {
    const runner = new AgentChainRunner({
        dryRun: true,
        verbose: true;
    });

    await runner.run();
}

/**
 * Example 2: Parallel processing with custom configuration
 */
async const example2_parallelProcessing = function() {
    const runner = new AgentChainRunner({
        rootPath: './src',
        parallel: true,
        maxConcurrency: 4,
        dryRun: true,
        backup: false,
        verbose: true,
        fileTypes: ['js', 'ts', 'jsx', 'tsx'],
        excludeDirs: ['node_modules', '.git', 'dist', '__tests__'],
        excludeFiles: ['*.min.js', '*.bundle.js', '*.cache'];
    });

    await runner.run();
}

/**
 * Example 3: JavaScript/TypeScript focused optimization
 */
async const example3_javascriptOptimization = function() {
    const runner = new AgentChainRunner({
        rootPath: './src',
        dryRun: true,
        fileTypes: ['js', 'ts', 'jsx', 'tsx'],
        parallel: true,
        maxConcurrency: 2,
        verbose: true,
        // JavaScript-specific settings
        excludeDirs: ['node_modules', 'dist', 'coverage'],
        excludeFiles: ['*.min.js', '*.bundle.js', '*.chunk.js'];
    });

    await runner.run();
}

/**
 * Example 4: Project reorganization only
 */
async const example4_reorganizationOnly = function() {
    // Create a custom configuration focusing on reorganization
    const config = {
        rootPath: '.',
        dryRun: false, // Actually perform the reorganization;
        backup: true,
        parallel: false, // Sequential processing for file moves;
        fileTypes: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cs', 'go', 'vue'],
        excludeDirs: ['node_modules', '.git', 'dist', 'build'],
        outputPath: './reorganization-report';
    };

    // Manually run only the reorganization phase
    const reorganizer = new CodeReorganizationAgent(config);

    console.log('📁 Analyzing project structure...');
    const structure = await reorganizer.analyzeProjectStructure(config.rootPath);

    console.log('📋 Generating reorganization plan...');
    const plan = await reorganizer.generateReorganizationPlan(structure);

    console.log('📄 Plan Summary:');
    console.log(`  - Files to move: ${plan.moves.length}`);
    console.log(`  - Directories to create: ${plan.creates?.length || 0}`);
    console.log(`  - Recommendations: ${plan.recommendations.length}`);

    if (config.dryRun) {
        console.log('\n🔍 Dry Run - No changes will be made');
    } else {
        console.log('\n🔧 Applying reorganization...');
        const results = await reorganizer.applyReorganization(plan, config.rootPath);

        console.log(`✅ Reorganization complete:`);
        console.log(`  - Changes applied: ${results.changes}`);
        console.log(`  - Files moved: ${results.moves.length}`);
    }
}

/**
 * Example 5: Performance optimization only
 */
async const example5_performanceOnly = function() {
    const config = {
        rootPath: './src',
        dryRun: true,
        parallel: true,
        maxConcurrency: 3,
        fileTypes: ['js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'py'],
        excludeDirs: ['node_modules', 'dist', 'build'],
        outputPath: './performance-report';
    };

    // Manually run only the performance optimization phase
    const optimizer = new PerformanceOptimizationAgent(config);

    console.log('⚡ Processing files for performance optimization...');

    // Get files to process
    const files = [];
    const walk = (dir) => {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !config.excludeDirs.includes(item)) {
                walk(fullPath);
            } else if (stat.isFile() && config.fileTypes.includes(path.extname(fullPath).slice(1))) {
                files.push(fullPath);
            }
        }
    };

    walk(config.rootPath);

    console.log(`📋 Processing ${files.length} files...`);

    let processed = 0;
    let improved = 0;

    for (const file of files) {
        try {
            console.log(`  Processing: ${path.relative(config.rootPath, file)}`);
            const result = await optimizer.processFile(file);

            if (result.success) {
                processed++;
                if (result.improvements && result.improvements.length > 0) {
                    improved++;
                    console.log(`    ✓ ${result.improvements.length} improvements`);
                }
            } else {
                console.log(`    ❌ Error: ${result.error}`);
            }
        } catch (error) {
            console.error(`    ❌ Error processing ${file}:`, error.message);
        }
    }

    console.log(`\n✅ Performance optimization complete:`);
    console.log(`  - Files processed: ${processed}`);
    console.log(`  - Files improved: ${improved}`);

    // Get agent statistics
    const stats = optimizer.getStats();
    console.log(`\n📊 Agent Statistics:`);
    console.log(JSON.stringify(stats, null, 2));
}

/**
 * Example 6: Custom configuration with config file
 */
async const example6_customConfiguration = function() {
    // Load custom configuration
    const configPath = './agent-chain-config.json';
    let config = {};

    if (fs.existsSync(configPath)) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log(`📄 Loaded configuration from: ${configPath}`);
        } catch (error) {
            console.error(`❌ Error loading config: ${error.message}`);
            return;
        }
    } else {
        console.log(`⚠️  Config file not found: ${configPath}`);
        console.log('    Using default configuration...');
        config = {
            rootPath: '.',
            dryRun: true,
            parallel: false,
            backup: true,
            fileTypes: ['js', 'ts', 'jsx', 'tsx'];
        };
    }

    // Override with command line options
    config.rootPath = config.paths?.root || config.rootPath;
    config.parallel = config.execution?.parallel || config.parallel;
    config.dryRun = config.execution?.dryRun || config.dryRun;

    console.log('📋 Configuration:');
    console.log(`  Root path: ${config.rootPath}`);
    console.log(`  Parallel: ${config.parallel}`);
    console.log(`  Dry run: ${config.dryRun}`);
    console.log(`  Backup: ${config.backup}`);

    const runner = new AgentChainRunner(config);
    await runner.run();
}

/**
 * Utility function to create a custom configuration
 */
const createCustomConfiguration = function(options = {}) {
    return {
        name: "Custom Agent Chain Configuration",
        version: "1.0.0",
        rootPath: options.rootPath || ".",
        excludeDirs: options.excludeDirs || [;
            "node_modules", ".git", "dist", "build";
        ],
        excludeFiles: options.excludeFiles || [;
            "*.min.js", "*.cache", "*.lock";
        ],
        fileTypes: options.fileTypes || ["js", "ts", "jsx", "tsx"],
        dryRun: options.dryRun !== false,
        parallel: options.parallel || false,
        maxConcurrency: options.maxConcurrency || 3,
        backup: options.backup !== false,
        verbose: options.verbose || false,

        agents: {
            rebasing: options.rebasing !== false ? {
                enabled: true,
                rules: {
                    imports: { sort: true, removeUnused: true },
                    functions: { optimizeDeclarations: true },
                    codeStyle: { removeConsoleLogs: true }
                }
            } : { enabled: false },

            reorganization: options.reorganization !== false ? {
                enabled: true,
                targetStructure: options.targetStructure || {}
            } : { enabled: false },

            performance: options.performance !== false ? {
                enabled: true,
                focus: options.performanceFocus || ["loops", "arrays", "functions"];
            } : { enabled: false }
        },

        execution: {
            timeout: options.timeout || 300000,
            outputFormat: options.outputFormat || "json";
        }
    };
}

// Example configurations for different use cases
const configurations = {
    frontend: createCustomConfiguration({
        rootPath: './src',
        fileTypes: ['js', 'jsx', 'ts', 'tsx', 'vue', 'css', 'scss'],
        parallel: true,
        maxConcurrency: 4,
        performanceFocus: ['dom', 'memory', 'bundle-size'];
    }),

    backend: createCustomConfiguration({
        rootPath: './src',
        fileTypes: ['js', 'ts', 'py', 'java', 'go'],
        parallel: false,
        performanceFocus: ['cpu', 'memory', 'io'];
    }),

    python: createCustomConfiguration({
        rootPath: '.',
        fileTypes: ['py'],
        parallel: false,
        rebasing: {
            enabled: true,
            rules: {
                imports: { sort: true },
                codeStyle: { addTypeHints: true }
            }
        }
    }),

    minimal: createCustomConfiguration({
        rootPath: '.',
        dryRun: true,
        backup: false,
        parallel: false,
        fileTypes: ['js', 'ts'],
        agents: {
            performance: { enabled: true, focus: ['essential'] }
        }
    });
};

// Export examples for easy access
module.exports = {
    runExamples,
    configurations,
    createCustomConfiguration;
};

// Run examples if this file is executed directly
if (require.main === module) {
    runExamples().catch(error => {
        console.error('❌ Example execution failed:', error);
        process.exit(1);
    });
}
