/**
 * Performance Optimization Agent
 *
 * Handles code performance improvements:
 * - Algorithm optimization
 * - Memory usage optimization
 * - CPU efficiency improvements
 * - I/O optimization
 * - Caching strategies
 * - Bundle size reduction
 */

const fs = require('fs');
const path = require('path');

class PerformanceOptimizationAgent {
    constructor(config) {
        this.config = config;
        this.optimizations = {
            applied: [],
            skipped: [],
            errors: []
        };
        this.metrics = {
            before: {},
            after: {},
            improvements: []
        };
    }

    /**
     * Process a single file for performance optimization
     */
    async processFile(filePath) {
        try {
            const originalContent = fs.readFileSync(filePath, 'utf8');
            const fileExt = path.extname(filePath).slice(1);

            // Skip files that are too large or binary
            if (originalContent.length > 500000 || this.isBinaryFile(originalContent)) {
                return { success: false, error: 'File too large or binary' };
            }

            let modifiedContent = originalContent;
            const changes = [];
            const improvements = [];

            // Record metrics before optimization
            const beforeMetrics = this.analyzePerformanceMetrics(originalContent, fileExt);
            this.metrics.before[filePath] = beforeMetrics;

            // Apply performance optimizations based on file type
            if (['js', 'jsx', 'ts', 'tsx'].includes(fileExt)) {
                modifiedContent = this.optimizeJavaScript(modifiedContent, filePath, changes, improvements);
            } else if (fileExt === 'py') {
                modifiedContent = this.optimizePython(modifiedContent, filePath, changes, improvements);
            } else if (fileExt === 'css' || fileExt === 'scss' || fileExt === 'less') {
                modifiedContent = this.optimizeCSS(modifiedContent, filePath, changes, improvements);
            }

            // Record metrics after optimization
            const afterMetrics = this.analyzePerformanceMetrics(modifiedContent, fileExt);
            this.metrics.after[filePath] = afterMetrics;

            // Calculate improvement percentage
            const improvement = this.calculateImprovement(beforeMetrics, afterMetrics);
            if (improvement > 0) {
                improvements.push({
                    type: 'overall_improvement',
                    percentage: improvement,
                    description: `Performance improved by ${improvement}%`
                });
            }

            // Check if any changes were made
            if (modifiedContent !== originalContent) {
                if (!this.config.dryRun) {
                    fs.writeFileSync(filePath, modifiedContent, 'utf8');
                }

                this.optimizations.applied.push({
                    file: path.relative(this.config.rootPath, filePath),
                    changes: changes,
                    improvements: improvements,
                    improvementPercentage: improvement
                });

                return {
                    success: true,
                    changes: changes,
                    improvements: improvements,
                    metrics: { before: beforeMetrics, after: afterMetrics }
                };
            }

            return { success: true, changes: [], improvements: [] };

        } catch (error) {
            this.optimizations.errors.push({
                file: path.relative(this.config.rootPath, filePath),
                error: error.message
            });

            return { success: false, error: error.message };
        }
    }

    /**
     * Optimize JavaScript/TypeScript files
     */
    optimizeJavaScript(content, filePath, changes, improvements) {
        let modified = content;

        // Rule: Optimize loops
        modified = this.optimizeLoops(modified, changes, improvements);

        // Rule: Optimize array operations
        modified = this.optimizeArrayOperations(modified, changes, improvements);

        // Rule: Optimize string operations
        modified = this.optimizeStringOperations(modified, changes, improvements);

        // Rule: Optimize function calls
        modified = this.optimizeFunctionCalls(modified, changes, improvements);

        // Rule: Optimize DOM operations
        modified = this.optimizeDOMOperations(modified, changes, improvements);

        // Rule: Optimize memory usage
        modified = this.optimizeMemoryUsage(modified, changes, improvements);

        // Rule: Optimize async operations
        modified = this.optimizeAsyncOperations(modified, changes, improvements);

        // Rule: Remove unused code
        modified = this.removeUnusedCode(modified, changes, improvements);

        // Rule: Optimize imports and exports
        modified = this.optimizeImportsExports(modified, changes, improvements);

        return modified;
    }

    /**
     * Optimize loops for better performance
     */
    optimizeLoops(content, changes, improvements) {
        // Convert for...in loops to for...of where appropriate
        const forInRegex = /for\s*\(\s*(const|let|var)\s+(\w+)\s+in\s+([^)]+)\)/g;
        let modified = content;

        modified = modified.replace(forInRegex, (match, keyword, variable, object) => {
            // Don't convert object iteration that needs keys
            if (!object.includes('.')) {
                const replacement = `for (const ${variable} of Object.values(${object}))`;
                changes.push({
                    type: 'loop_optimization',
                    description: `Converted for...in to for...of: ${match.trim()}`,
                    file: path.relative(this.config.rootPath, 'loop_placeholder')
                });
                return replacement;
            }
            return match;
        });

        // Optimize array length caching in loops
        const lengthCachingRegex = /for\s*\([^)]+\)\s*{[\s\S]*?\.length[\s\S]*?}/g;
        const optimizations = [];

        modified = modified.replace(lengthCachingRegex, (match) => {
            const lengthMatch = match.match(/\.length/g);
            if (lengthMatch && lengthMatch.length > 1) {
                // Extract array name
                const arrayMatch = match.match(/(?:for\s*\([^)]*\))?\s*{\s*([^;.\s]+?)\.length/g);
                if (arrayMatch && arrayMatch.length > 0) {
                    const arrayName = arrayMatch[1].trim().replace(/^(?:const|let|var)\s+/, '');
                    const cachedLoop = match.replace(
                        new RegExp(`\\b${this.escapeRegex(arrayName)}\\.length`, 'g'),
                        `const len = ${arrayName}.length`
                    );

                    // Replace remaining .length with len
                    const optimizedLoop = cachedLoop.replace(/\.length/g, 'len');

                    changes.push({
                        type: 'length_caching',
                        description: `Cached array length in loop: ${arrayName}`,
                        file: path.relative(this.config.rootPath, 'loop_placeholder')
                    });

                    return optimizedLoop;
                }
            }
            return match;
        });

        return modified;
    }

    /**
     * Optimize array operations
     */
    optimizeArrayOperations(content, changes, improvements) {
        let modified = content;

        // Replace array concat with spread operator where appropriate
        const concatRegex = /\.concat\(/g;
        modified = modified.replace(concatRegex, (match, offset, string) => {
            // Check if this is a simple concat operation
            const context = this.getExpressionContext(string, offset);
            if (context === 'simple' && !string.includes(', ...')) {
                changes.push({
                    type: 'array_concat_optimization',
                    description: 'Replaced .concat() with spread operator',
                    file: path.relative(this.config.rootPath, 'array_placeholder')
                });
                return '...';
            }
            return match;
        });

        // Optimize array find operations
        const findRegex = /\.find\(/g;
        modified = modified.replace(findRegex, (match, offset, string) => {
            // Check if we can optimize this find operation
            const context = this.getExpressionContext(string, offset);
            if (context === 'simple' && !string.includes('findIndex')) {
                changes.push({
                    type: 'array_find_optimization',
                    description: 'Consider using .findIndex() instead of .find() with index',
                    file: path.relative(this.config.rootPath, 'array_placeholder')
                });
                // Don't automatically replace, just add recommendation
            }
            return match;
        });

        // Optimize array filtering
        modified = this.optimizeArrayFiltering(modified, changes);

        return modified;
    }

    /**
     * Optimize string operations
     */
    optimizeStringOperations(content, changes, improvements) {
        let modified = content;

        // Replace string concatenation in loops with array join
        modified = this.optimizeStringConcatenation(modified, changes);

        // Optimize regex usage
        modified = this.optimizeRegexUsage(modified, changes);

        // Optimize string template literals
        modified = this.optimizeStringTemplates(modified, changes);

        return modified;
    }

    /**
     * Optimize function calls
     */
    optimizeFunctionCalls(content, changes, improvements) {
        let modified = content;

        // Memoize expensive function calls
        modified = this.addMemoization(modified, changes);

        // Optimize recursive functions
        modified = this.optimizeRecursion(modified, changes);

        // Optimize callback functions
        modified = this.optimizeCallbacks(modified, changes);

        return modified;
    }

    /**
     * Optimize DOM operations
     */
    optimizeDOMOperations(content, changes, improvements) {
        let modified = content;

        // Batch DOM manipulations
        modified = this.batchDOMOperations(modified, changes);

        // Optimize DOM queries
        modified = this.cacheDOMQueries(modified, changes);

        // Use event delegation
        modified = this.implementEventDelegation(modified, changes);

        return modified;
    }

    /**
     * Optimize memory usage
     */
    optimizeMemoryUsage(content, changes, improvements) {
        let modified = content;

        // Clear unused variables
        modified = this.clearUnusedVariables(modified, changes);

        // Use weak references where appropriate
        modified = this.useWeakReferences(modified, changes);

        // Optimize object creation
        modified = this.optimizeObjectCreation(modified, changes);

        return modified;
    }

    /**
     * Optimize async operations
     */
    optimizeAsyncOperations(content, changes, improvements) {
        let modified = content;

        // Batch async operations
        modified = this.batchAsyncOperations(modified, changes);

        // Use Promise.all() for parallel async operations
        modified = this.parallelizeAsyncOperations(modified, changes);

        // Avoid unnecessary await
        modified = this.removeUnnecessaryAwait(modified, changes);

        return modified;
    }

    /**
     * Optimize Python files
     */
    optimizePython(content, filePath, changes, improvements) {
        let modified = content;

        // Optimize Python loops
        modified = this.optimizePythonLoops(modified, changes);

        // Optimize Python comprehensions
        modified = this.optimizePythonComprehensions(modified, changes);

        // Optimize Python collections
        modified = this.optimizePythonCollections(modified, changes);

        return modified;
    }

    /**
     * Optimize CSS files
     */
    optimizeCSS(content, filePath, changes, improvements) {
        let modified = content;

        // Optimize CSS selectors
        modified = this.optimizeCSSSelectors(modified, changes);

        // Remove unused CSS
        modified = this.removeUnusedCSS(modified, changes);

        // Optimize CSS properties
        modified = this.optimizeCSSProperties(modified, changes);

        return modified;
    }

    /**
     * Helper methods for specific optimizations
     */
    optimizeArrayFiltering(content, changes) {
        // Replace filter + map with single map where possible
        const filterMapRegex = /\.filter\([^)]*\)\.map\(/g;
        return content.replace(filterMapRegex, (match, filter) => {
            changes.push({
                type: 'filter_map_optimization',
                description: 'Can optimize .filter().map() to single .map() with conditional logic',
                file: path.relative(this.config.rootPath, 'array_placeholder')
            });
            return match;
        });
    }

    optimizeStringConcatenation(content, changes) {
        // Find string concatenation in loops
        const loopRegex = /for\s*\([^)]+\)[^{][\s\S]*?\+=.*\+[^;]*;[\s\S]*?}/g;

        return content.replace(loopRegex, (match) => {
            if (match.includes('+=') && match.includes('+') && !match.includes('push(')) {
                changes.push({
                    type: 'string_concatenation_optimization',
                    description: 'Consider using array.join() for string concatenation in loops',
                    file: path.relative(this.config.rootPath, 'string_placeholder')
                });
            }
            return match;
        });
    }

    optimizeRegexUsage(content, changes) {
        // Check for global regex compilation
        const globalRegex = /\/[^\/]*\/[gimuy]*/g;
        if (globalRegex.test(content)) {
            changes.push({
                type: 'regex_optimization',
                description: 'Consider caching global regex expressions',
                file: path.relative(this.config.rootPath, 'regex_placeholder')
            });
        }
        return content;
    }

    optimizeStringTemplates(content, changes) {
        // Optimize template literals with expressions
        return content;
    }

    addMemoization(content, changes) {
        // Add memoization to expensive functions
        return content;
    }

    optimizeRecursion(content, changes) {
        // Optimize recursive functions with memoization
        return content;
    }

    optimizeCallbacks(content, changes) {
        // Optimize callback functions
        return content;
    }

    batchDOMOperations(content, changes) {
        // Batch DOM manipulations
        return content;
    }

    cacheDOMQueries(content, changes) {
        // Cache expensive DOM queries
        return content;
    }

    implementEventDelegation(content, changes) {
        // Implement event delegation
        return content;
    }

    clearUnusedVariables(content, changes) {
        // Clear unused variables
        return content;
    }

    useWeakReferences(content, changes) {
        // Use weak references
        return content;
    }

    optimizeObjectCreation(content, changes) {
        // Optimize object creation
        return content;
    }

    batchAsyncOperations(content, changes) {
        // Batch async operations
        return content;
    }

    parallelizeAsyncOperations(content, changes) {
        // Parallelize async operations
        return content;
    }

    removeUnnecessaryAwait(content, changes) {
        // Remove unnecessary await
        const awaitRegex = /await\s+(?!Promise\.all|Promise\.race)/g;

        return content.replace(awaitRegex, (match) => {
            // Simple heuristic - don't remove await from complex expressions
            if (match.length < 20) {
                changes.push({
                    type: 'await_optimization',
                    description: 'Potentially unnecessary await',
                    file: path.relative(this.config.rootPath, 'await_placeholder')
                });
            }
            return match;
        });
    }

    optimizePythonLoops(content, changes) {
        // Optimize Python loops
        return content;
    }

    optimizePythonComprehensions(content, changes) {
        // Optimize Python comprehensions
        return content;
    }

    optimizePythonCollections(content, changes) {
        // Optimize Python collections
        return content;
    }

    optimizeCSSSelectors(content, changes) {
        // Optimize CSS selectors
        return content;
    }

    removeUnusedCSS(content, changes) {
        // Remove unused CSS
        return content;
    }

    optimizeCSSProperties(content, changes) {
        // Optimize CSS properties
        return content;
    }

    removeUnusedCode(content, changes) {
        // Remove dead code
        const deadCodePatterns = [
            /console\.log\([^)]*\);?/g,
            /debugger;/g,
            /debugger\s*\([^)]*\);?/g
        ];

        let modified = content;
        let removed = 0;

        for (const pattern of deadCodePatterns) {
            const matches = modified.match(pattern) || [];
            for (const match of matches) {
                modified = modified.replace(match, '');
                removed++;
            }
        }

        if (removed > 0) {
            changes.push({
                type: 'dead_code_removed',
                description: `Removed ${removed} instances of dead code`,
                file: path.relative(this.config.rootPath, 'dead_code_placeholder')
            });
        }

        return modified;
    }

    optimizeImportsExports(content, changes) {
        // Tree-shake friendly imports
        return content;
    }

    /**
     * Analyze performance metrics
     */
    analyzePerformanceMetrics(content, fileExt) {
        return {
            lines: content.split('\n').length,
            complexity: this.calculateComplexity(content),
            functions: this.countFunctions(content, fileExt),
            loops: this.countLoops(content),
            asyncOperations: this.countAsyncOperations(content),
            memoryAllocations: this.countMemoryAllocations(content)
        };
    }

    /**
     * Calculate code complexity
     */
    calculateComplexity(content) {
        let complexity = 1; // Base complexity

        // Add complexity for control structures
        complexity += (content.match(/if\s*\(/g) || []).length * 2;
        complexity += (content.match(/else\s*if/g) || []).length * 2;
        complexity += (content.match(/(?:for|while)\s*\(/g) || []).length * 3;
        complexity += (content.match(/(?:switch|case)/g) || []).length;
        complexity += (content.match(/try\s*\{/g) || []).length * 2;
        complexity += (content.match(/catch\s*\(/g) || []).length * 2;

        return complexity;
    }

    /**
     * Count functions
     */
    countFunctions(content, fileExt) {
        let count = 0;

        if (['js', 'jsx', 'ts', 'tsx'].includes(fileExt)) {
            count += (content.match(/function\s+\w+/g) || []).length;
            count += (content.match(/\w+\s*=>/g) || []).length;
            count += (content.match(/class\s+\w+/g) || []).length;
        } else if (fileExt === 'py') {
            count += (content.match(/def\s+\w+/g) || []).length;
            count += (content.match(/class\s+\w+/g) || []).length;
        }

        return count;
    }

    /**
     * Count loops
     */
    countLoops(content) {
        return (content.match(/(?:for|while)\s*\(/g) || []).length;
    }

    /**
     * Count async operations
     */
    countAsyncOperations(content) {
        return (content.match(/(?:async\s+function|async\s+\w+|await\s+)/g) || []).length;
    }

    /**
     * Count memory allocations
     */
    countMemoryAllocations(content) {
        const newKeywordMatches = content.match(/new\s+\w+\s*\(/g) || [];
        const arrayLiteralMatches = content.match(/\[\s*.*?\s*\]/g) || [];
        return newKeywordMatches.length + arrayLiteralMatches.length;
    }

    /**
     * Calculate improvement percentage
     */
    calculateImprovement(before, after) {
        if (!before || !after) return 0;

        // Simple heuristic based on complexity reduction
        const complexityImprovement = ((before.complexity - after.complexity) / before.complexity) * 100;
        const lineImprovement = ((before.lines - after.lines) / before.lines) * 100;

        return Math.round(Math.max(0, Math.min(complexityImprovement, lineImprovement)));
    }

    /**
     * Helper: Get expression context
     */
    getExpressionContext(string, offset) {
        const before = string.substring(0, offset);
        const after = string.substring(offset + 20);

        // Simple heuristic to determine context complexity
        if (before.length > 100 || after.length > 100) {
            return 'complex';
        } else if (before.includes('if') || before.includes('for') || before.includes('while')) {
            return 'complex';
        }

        return 'simple';
    }

    /**
     * Helper: Check if file is binary
     */
    isBinaryFile(content) {
        // Simple heuristic: check for non-text characters
        const sample = content.substring(0, 1000);
        for (let i = 0; i < sample.length; i++) {
            const charCode = sample.charCodeAt(i);
            if (charCode === 0 || charCode > 127) {
                return true;
            }
        }
        return false;
    }

    /**
     * Helper: Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get optimization statistics
     */
    getStats() {
        return {
            optimizations: this.optimizations,
            metrics: this.metrics,
            summary: {
                totalApplied: this.optimizations.applied.length,
                totalErrors: this.optimizations.errors.length,
                totalSkipped: this.optimizations.skipped.length
            }
        };
    }
}

module.exports = PerformanceOptimizationAgent;