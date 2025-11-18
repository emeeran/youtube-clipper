#!/usr/bin/env node

/**
 * Agent Chain Runner - Reusable Code Optimization System
 *
 * Chains multiple AI agents for:
 * - Code rebasing and restructuring
 * - File and directory reorganization
 * - Performance and speed optimization
 *
 * Usage: node agent-chain-runner.js [options]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import agents
const CodeRebasingAgent = require('./code-rebasing-agent.js');
const CodeReorganizationAgent = require('./code-reorganization-agent.js');
const PerformanceOptimizationAgent = require('./performance-optimization-agent.js');

class AgentChainRunner {
    constructor(options = {}) {
        this.config = {
            rootPath: options.rootPath || process.cwd(),
            excludeDirs: options.excludeDirs || [
                'node_modules', '.git', 'dist', 'build', 'coverage',
                '.obsidian', '.vscode', '.idea'
            ],
            excludeFiles: options.excludeFiles || [
                '*.min.js', '*.bundle.js', '*.cache', '*.lock',
                'package-lock.json', 'yarn.lock'
            ],
            fileTypes: options.fileTypes || ['js', 'ts', 'jsx', 'tsx', 'vue', 'py', 'java', 'cs', 'go', 'rs'],
            dryRun: options.dryRun || false,
            backup: options.backup !== false, // Default to true
            parallel: options.parallel || false,
            maxConcurrency: options.maxConcurrency || 3,
            verbose: options.verbose || false,
            outputPath: options.outputPath || null
        };

        this.results = {
            rebasing: { processed: 0, errors: 0, changes: [] },
            reorganization: { processed: 0, errors: 0, changes: [] },
            optimization: { processed: 0, errors: 0, improvements: [] }
        };

        this.stats = {
            startTime: Date.now(),
            filesScanned: 0,
            filesModified: 0,
            totalLines: 0
        };
    }

    /**
     * Main execution method
     */
    async run() {
        console.log('🚀 Starting Agent Chain Runner...');
        console.log(`📁 Target: ${this.config.rootPath}`);
        console.log(`🔧 Dry Run: ${this.config.dryRun ? 'YES' : 'NO'}`);
        console.log(`💾 Backup: ${this.config.backup ? 'YES' : 'NO'}`);

        try {
            // Create backup if enabled
            if (this.config.backup && !this.config.dryRun) {
                await this.createBackup();
            }

            // Phase 1: Rebase and restructure code
            console.log('\n🔗 Phase 1: Code Rebasing');
            await this.runRebasingAgent();

            // Phase 2: Reorganize file structure
            console.log('\n📁 Phase 2: Code Reorganization');
            await this.runReorganizationAgent();

            // Phase 3: Performance optimization
            console.log('\n⚡ Phase 3: Performance Optimization');
            await this.runOptimizationAgent();

            // Generate final report
            await this.generateReport();

            const duration = ((Date.now() - this.stats.startTime) / 1000).toFixed(2);
            console.log(`\n✅ Agent Chain completed in ${duration}s`);
            console.log(`📊 Files scanned: ${this.stats.filesScanned}`);
            console.log(`📝 Files modified: ${this.stats.filesModified}`);

        } catch (error) {
            console.error('❌ Agent Chain failed:', error.message);
            throw error;
        }
    }

    /**
     * Create backup of the codebase
     */
    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.config.rootPath, '..', `codebase-backup-${timestamp}`);

        console.log(`💾 Creating backup: ${backupPath}`);
        execSync(`cp -r "${this.config.rootPath}" "${backupPath}"`, { stdio: 'inherit' });
        console.log('✅ Backup created');
    }

    /**
     * Phase 1: Code Rebasing Agent
     */
    async runRebasingAgent() {
        const agent = new CodeRebasingAgent(this.config);
        const files = await this.getRelevantFiles();

        console.log(`📋 Processing ${files.length} files for rebasing...`);

        if (this.config.parallel) {
            await this.processFilesInParallel(files, agent, 'rebasing');
        } else {
            await this.processFilesSequentially(files, agent, 'rebasing');
        }

        console.log(`✅ Rebasing complete - ${this.results.rebasing.processed} files processed`);
    }

    /**
     * Phase 2: Code Reorganization Agent
     */
    async runReorganizationAgent() {
        const agent = new CodeReorganizationAgent(this.config);

        console.log('🔍 Analyzing project structure...');
        const structure = await agent.analyzeProjectStructure(this.config.rootPath);

        console.log('📋 Generating reorganization plan...');
        const plan = await agent.generateReorganizationPlan(structure);

        if (this.config.dryRun) {
            console.log('📄 Reorganization Plan:');
            console.log(JSON.stringify(plan, null, 2));
            return;
        }

        console.log('🔧 Applying reorganization...');
        const results = await agent.applyReorganization(plan, this.config.rootPath);

        this.results.reorganization.changes = results.changes;
        console.log(`✅ Reorganization complete - ${results.changes.length} changes applied`);
    }

    /**
     * Phase 3: Performance Optimization Agent
     */
    async runOptimizationAgent() {
        const agent = new PerformanceOptimizationAgent(this.config);
        const files = await this.getRelevantFiles();

        console.log(`📋 Processing ${files.length} files for optimization...`);

        if (this.config.parallel) {
            await this.processFilesInParallel(files, agent, 'optimization');
        } else {
            await this.processFilesSequentially(files, agent, 'optimization');
        }

        console.log(`✅ Optimization complete - ${this.results.optimization.processed} files processed`);
    }

    /**
     * Get all relevant source files
     */
    async getRelevantFiles() {
        const files = [];

        const walk = (dir) => {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // Skip excluded directories
                    if (this.config.excludeDirs.some(exclude => fullPath.includes(exclude))) {
                        continue;
                    }
                    walk(fullPath);
                } else if (stat.isFile()) {
                    // Check file extension
                    const ext = path.extname(item).slice(1);
                    if (this.config.fileTypes.includes(ext)) {
                        // Skip excluded files
                        if (this.config.excludeFiles.some(pattern =>
                            item.match(pattern.replace('*', '.*')))) {
                            continue;
                        }
                        files.push(fullPath);
                        this.stats.filesScanned++;

                        // Count lines
                        try {
                            const content = fs.readFileSync(fullPath, 'utf8');
                            this.stats.totalLines += content.split('\n').length;
                        } catch (e) {
                            // Skip files that can't be read
                        }
                    }
                }
            }
        };

        walk(this.config.rootPath);
        return files;
    }

    /**
     * Process files sequentially
     */
    async processFilesSequentially(files, agent, phase) {
        for (const file of files) {
            try {
                console.log(`  Processing: ${path.relative(this.config.rootPath, file)}`);
                const result = await agent.processFile(file);

                if (result.success) {
                    this.results[phase].processed++;
                    if (result.changes) {
                        this.results[phase].changes.push(...result.changes);
                        if (!this.config.dryRun) {
                            this.stats.filesModified++;
                        }
                    }
                } else {
                    this.results[phase].errors++;
                    console.error(`    ❌ Error: ${result.error}`);
                }
            } catch (error) {
                this.results[phase].errors++;
                console.error(`    ❌ Error processing ${file}:`, error.message);
            }
        }
    }

    /**
     * Process files in parallel batches
     */
    async processFilesInParallel(files, agent, phase) {
        const chunks = [];
        const chunkSize = this.config.maxConcurrency;

        for (let i = 0; i < files.length; i += chunkSize) {
            chunks.push(files.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
            const promises = chunk.map(async (file) => {
                try {
                    console.log(`  Processing: ${path.relative(this.config.rootPath, file)}`);
                    const result = await agent.processFile(file);

                    if (result.success) {
                        this.results[phase].processed++;
                        if (result.changes) {
                            this.results[phase].changes.push(...result.changes);
                            if (!this.config.dryRun) {
                                this.stats.filesModified++;
                            }
                        }
                    } else {
                        this.results[phase].errors++;
                        console.error(`    ❌ Error: ${result.error}`);
                    }

                    return result;
                } catch (error) {
                    this.results[phase].errors++;
                    console.error(`    ❌ Error processing ${file}:`, error.message);
                    return { success: false, error: error.message };
                }
            });

            await Promise.all(promises);
        }
    }

    /**
     * Generate comprehensive report
     */
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            config: this.config,
            stats: this.stats,
            results: this.results,
            duration: ((Date.now() - this.stats.startTime) / 1000).toFixed(2),
            summary: {
                totalProcessed: this.results.rebasing.processed +
                              this.results.reorganization.processed +
                              this.results.optimization.processed,
                totalErrors: this.results.rebasing.errors +
                             this.results.reorganization.errors +
                             this.results.optimization.errors,
                totalChanges: this.results.rebasing.changes.length +
                             this.results.reorganization.changes.length +
                             this.results.optimization.improvements.length
            }
        };

        const reportPath = path.join(this.config.rootPath, 'agent-chain-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`\n📊 Report generated: ${reportPath}`);
        console.log(`📈 Summary: ${report.summary.totalProcessed} files processed`);
        console.log(`⚠️  Errors: ${report.summary.totalErrors}`);
        console.log(`🔄 Changes: ${report.summary.totalChanges}`);

        return report;
    }
}

// Export for use as module
module.exports = AgentChainRunner;

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--no-backup':
                options.backup = false;
                break;
            case '--parallel':
                options.parallel = true;
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--root':
                options.rootPath = args[++i];
                break;
            case '--output':
                options.outputPath = args[++i];
                break;
            case '--max-concurrency':
                options.maxConcurrency = parseInt(args[++i]);
                break;
            case '--help':
                console.log(`
Agent Chain Runner - Code Optimization System

Usage: node agent-chain-runner.js [options]

Options:
  --dry-run              Run without making actual changes
  --no-backup            Skip creating backup
  --parallel             Process files in parallel
  --verbose              Enable verbose logging
  --root <path>          Root directory to process (default: current directory)
  --output <path>        Output directory for reports
  --max-concurrency <n>  Maximum parallel processes (default: 3)
  --help                 Show this help message

Examples:
  node agent-chain-runner.js --dry-run
  node agent-chain-runner.js --root ./src --parallel
  node agent-chain-runner.js --verbose --max-concurrency 5
                `);
                process.exit(0);
        }
    }

    // Run the agent chain
    const runner = new AgentChainRunner(options);
    runner.run().catch(error => {
        console.error('Agent Chain failed:', error);
        process.exit(1);
    });
}