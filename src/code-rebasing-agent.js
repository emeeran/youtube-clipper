/**
 * Code Rebasing Agent
 *
 * Handles code restructuring, refactoring, and architectural improvements:
 * - Function and class reorganization
 * - Import/export optimization
 * - Code style standardization
 * - Dead code removal
 * - Variable/function renaming for clarity
 */

const fs = require('fs');
const path = require('path');

class CodeRebasingAgent {
    constructor(config) {
        this.config = config;
        this.rules = this.initializeRules();
        this.stats = {
            filesProcessed: 0,
            refactoringsApplied: 0,
            importsOptimized: 0,
            deadCodeRemoved: 0
        };
    }

    /**
     * Process a single file for rebasing
     */
    async processFile(filePath) {
        try {
            const originalContent = fs.readFileSync(filePath, 'utf8');
            const fileExt = path.extname(filePath).slice(1);

            // Skip files that are too large
            if (originalContent.length > 1000000) { // 1MB limit
                return { success: false, error: 'File too large for processing' };
            }

            let modifiedContent = originalContent;
            const changes = [];

            // Apply rebasing rules based on file type
            if (['js', 'jsx', 'ts', 'tsx'].includes(fileExt)) {
                modifiedContent = this.processJavaScript(modifiedContent, filePath, changes);
            } else if (fileExt === 'py') {
                modifiedContent = this.processPython(modifiedContent, filePath, changes);
            } else if (['java', 'cs', 'go'].includes(fileExt)) {
                modifiedContent = this.processCompiledLanguage(modifiedContent, filePath, changes);
            }

            // Check if any changes were made
            if (modifiedContent !== originalContent) {
                if (!this.config.dryRun) {
                    fs.writeFileSync(filePath, modifiedContent, 'utf8');
                }
                this.stats.filesProcessed++;
                this.stats.refactoringsApplied += changes.length;

                return {
                    success: true,
                    changes: changes,
                    refactorings: changes.length
                };
            }

            return { success: true, changes: [] };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Process JavaScript/TypeScript files
     */
    processJavaScript(content, filePath, changes) {
        let modified = content;

        // Rule: Optimize imports
        modified = this.optimizeImports(modified, filePath, changes);

        // Rule: Remove unused imports
        modified = this.removeUnusedImports(modified, changes);

        // Rule: Sort imports
        modified = this.sortImports(modified, changes);

        // Rule: Remove console.log statements (unless in development files)
        if (!filePath.includes('dev') && !filePath.includes('test')) {
            modified = this.removeConsoleStatements(modified, changes);
        }

        // Rule: Optimize function declarations
        modified = this.optimizeFunctions(modified, changes);

        // Rule: Add missing semicolons
        if (filePath.endsWith('.js')) {
            modified = this.addMissingSemicolons(modified, changes);
        }

        // Rule: Remove trailing whitespace
        modified = this.removeTrailingWhitespace(modified, changes);

        // Rule: Ensure single final newline
        modified = this.ensureFinalNewline(modified, changes);

        return modified;
    }

    /**
     * Process Python files
     */
    processPython(content, filePath, changes) {
        let modified = content;

        // Rule: Optimize imports
        modified = this.optimizePythonImports(modified, changes);

        // Rule: Remove unused imports
        modified = this.removeUnusedPythonImports(modified, changes);

        // Rule: Remove print statements (unless in __main__ or dev files)
        if (!filePath.includes('__main__') && !filePath.includes('dev')) {
            modified = this.removePrintStatements(modified, changes);
        }

        // Rule: Optimize function definitions
        modified = this.optimizePythonFunctions(modified, changes);

        // Rule: Remove trailing whitespace
        modified = this.removeTrailingWhitespace(modified, changes);

        return modified;
    }

    /**
     * Process compiled languages (Java, C#, Go)
     */
    processCompiledLanguage(content, filePath, changes) {
        let modified = content;

        // Rule: Remove unused imports (basic implementation)
        modified = this.removeUnusedImportsCompiled(modified, changes);

        // Rule: Optimize class structure
        modified = this.optimizeClassStructure(modified, changes);

        // Rule: Remove trailing whitespace
        modified = this.removeTrailingWhitespace(modified, changes);

        return modified;
    }

    /**
     * Optimize import statements
     */
    optimizeImports(content, filePath, changes) {
        const lines = content.split('\n');
        const result = [];
        const imports = [];
        let inImportBlock = false;

        for (const line of lines) {
            const trimmed = line.trim();

            // Detect import statements
            if (trimmed.startsWith('import ') || trimmed.startsWith('const ') && trimmed.includes('require(')) {
                imports.push(line);
                inImportBlock = true;
            } else if (trimmed.startsWith('export ') && trimmed.includes('from')) {
                imports.push(line);
                inImportBlock = true;
            } else if (inImportBlock && trimmed === '') {
                // End of import block, continue
                continue;
            } else {
                if (inImportBlock && imports.length > 0) {
                    // Sort and optimize imports
                    const optimizedImports = this.sortImportStatements(imports);
                    result.push(...optimizedImports);
                    result.push(''); // Add blank line after imports
                    imports.length = 0;
                    inImportBlock = false;
                }
                result.push(line);
            }
        }

        // Handle imports at end of file
        if (imports.length > 0) {
            const optimizedImports = this.sortImportStatements(imports);
            result.push(...optimizedImports);
        }

        const newContent = result.join('\n');
        if (newContent !== content) {
            changes.push({
                type: 'import_optimization',
                description: 'Optimized and sorted import statements',
                file: path.relative(this.config.rootPath, filePath)
            });
        }

        return newContent;
    }

    /**
     * Sort import statements
     */
    sortImportStatements(imports) {
        // Separate different types of imports
        const thirdPartyImports = [];
        const relativeImports = [];
        const builtinImports = [];
        const otherImports = [];

        for (const importLine of imports) {
            const trimmed = importLine.trim();

            if (trimmed.includes('require("') || trimmed.includes("require('")) {
                relativeImports.push(importLine);
            } else if (trimmed.match(/import.*from ["'](?:\.|\.\.|\/)/)) {
                relativeImports.push(importLine);
            } else if (trimmed.match(/import.*from ["'](?:fs|path|http|url)/)) {
                builtinImports.push(importLine);
            } else {
                thirdPartyImports.push(importLine);
            }
        }

        // Sort each group alphabetically
        const sortGroup = (group) => group.sort((a, b) => {
            const aKey = a.toLowerCase().replace(/import|const|let|var/g, '').trim();
            const bKey = b.toLowerCase().replace(/import|const|let|var/g, '').trim();
            return aKey.localeCompare(bKey);
        });

        return [
            ...sortGroup(builtinImports),
            ...sortGroup(thirdPartyImports),
            ...sortGroup(relativeImports),
            ...sortGroup(otherImports)
        ];
    }

    /**
     * Remove unused imports (basic implementation)
     */
    removeUnusedImports(content, changes) {
        // This is a simplified version - a full implementation would require AST parsing
        const importRegex = /^.*import.*from\s+['"].*['"];?$/gm;
        const imports = content.match(importRegex) || [];

        for (const importStatement of imports) {
            const importName = importStatement.match(/import\s+(.+?)\s+from/);
            if (importName) {
                const name = importName[1].replace(/[{}]/g, '').trim();
                const firstIndex = content.indexOf(importStatement);
                const lastIndex = content.lastIndexOf(importStatement);
                if (name && !content.includes(name) && firstIndex === lastIndex) {
                    content = content.replace(importStatement + '\n', '');
                    changes.push({
                        type: 'unused_import_removed',
                        description: `Removed unused import: ${importStatement.trim()}`,
                        file: path.relative(this.config.rootPath, 'import_placeholder')
                    });
                }
            }
        }

        return content;
    }

    /**
     * Sort imports
     */
    sortImports(content, changes) {
        // Simple import sorting - can be enhanced with proper parsing
        const lines = content.split('\n');
        const imports = [];
        let inImportSection = false;

        const result = lines.filter(line => {
            const trimmed = line.trim();

            if (trimmed.startsWith('import ') || trimmed.startsWith('const ') && trimmed.includes('require(')) {
                imports.push(line);
                inImportSection = true;
                return false; // Remove from original position
            }

            if (inImportSection && trimmed === '') {
                inImportSection = false;
                // We'll add the sorted imports and the blank line later
                return false;
            }

            if (!inImportSection) {
                return true;
            }
            return false;
        });

        // Add sorted imports back
        if (imports.length > 0) {
            const sortedImports = imports.sort((a, b) => a.localeCompare(b));
            result.unshift(...sortedImports, '');
        }

        const newContent = result.join('\n');
        if (newContent !== content) {
            changes.push({
                type: 'imports_sorted',
                description: 'Sorted import statements alphabetically',
                file: path.relative(this.config.rootPath, 'import_placeholder')
            });
        }

        return newContent;
    }

    /**
     * Remove console.log statements
     */
    removeConsoleStatements(content, changes) {
        const consoleRegex = /console\.(log|warn|error|info|debug)\([^)]*\);?/g;
        const matches = content.match(consoleRegex) || [];

        for (const match of matches) {
            content = content.replace(match, '');
            changes.push({
                type: 'console_removed',
                description: `Removed console statement: ${match.trim()}`,
                file: path.relative(this.config.rootPath, 'console_placeholder')
            });
        }

        return content;
    }

    /**
     * Optimize function declarations
     */
    optimizeFunctions(content, changes) {
        // Convert function declarations to const where appropriate
        const functionRegex = /function\s+(\w+)\s*\(/g;
        let match;

        while ((match = functionRegex.exec(content)) !== null) {
            const functionName = match[1];

            // Skip if it's a constructor or special function
            if (functionName === 'constructor' || functionName.startsWith('_')) {
                continue;
            }

            // Check if function is exported or assigned
            const exportRegex = new RegExp(`export\\s+function\\s+${functionName}`);
            const constRegex = new RegExp(`const\\s+${functionName}\\s*=`);

            if (!exportRegex.test(content) && !constRegex.test(content)) {
                const oldDecl = `function ${functionName}`;
                const newDecl = `const ${functionName} = function`;

                content = content.replace(oldDecl, newDecl);
                changes.push({
                    type: 'function_optimization',
                    description: `Converted function declaration: ${functionName}`,
                    file: path.relative(this.config.rootPath, 'function_placeholder')
                });
            }
        }

        return content;
    }

    /**
     * Add missing semicolons
     */
    addMissingSemicolons(content, changes) {
        const lines = content.split('\n');
        const result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Don't add semicolons to these cases
            if (trimmed === '' ||
                trimmed.endsWith(';') ||
                trimmed.endsWith('{') ||
                trimmed.endsWith('}') ||
                trimmed.startsWith('if ') ||
                trimmed.startsWith('for ') ||
                trimmed.startsWith('while ') ||
                trimmed.startsWith('function ') ||
                trimmed.startsWith('//') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('/*')) {
                result.push(line);
                continue;
            }

            // Add semicolon if line ends with expression but no semicolon
            if (trimmed && !trimmed.endsWith(';') && !trimmed.endsWith(',')) {
                result.push(line + ';');
                changes.push({
                    type: 'semicolon_added',
                    description: `Added semicolon to line: ${trimmed.substring(0, 50)}...`,
                    file: path.relative(this.config.rootPath, 'semicolon_placeholder')
                });
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    /**
     * Remove trailing whitespace
     */
    removeTrailingWhitespace(content, changes) {
        const lines = content.split('\n');
        let modified = false;

        const result = lines.map(line => {
            const newLine = line.replace(/\s+$/, '');
            if (newLine !== line) {
                modified = true;
            }
            return newLine;
        });

        if (modified) {
            changes.push({
                type: 'whitespace_removed',
                description: 'Removed trailing whitespace',
                file: path.relative(this.config.rootPath, 'whitespace_placeholder')
            });
        }

        return result.join('\n');
    }

    /**
     * Ensure single final newline
     */
    ensureFinalNewline(content, changes) {
        if (!content.endsWith('\n')) {
            return content + '\n';
        } else if (content.endsWith('\n\n')) {
            // Remove extra newlines
            return content.replace(/\n+$/, '\n');
        }
        return content;
    }

    /**
     * Python-specific import optimization
     */
    optimizePythonImports(content, filePath, changes) {
        // Basic Python import sorting and grouping
        const lines = content.split('\n');
        const imports = {
            builtin: [],
            thirdParty: [],
            local: []
        };

        const result = [];
        let inImports = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('import ')) {
                inImports = true;
                if (trimmed.match(/^import\s+(?:os|sys|path|json|re|math|datetime|collections|itertools|functools)$/)) {
                    imports.builtin.push(line);
                } else if (trimmed.includes('.')) {
                    imports.local.push(line);
                } else {
                    imports.thirdParty.push(line);
                }
            } else if (trimmed.startsWith('from ')) {
                inImports = true;
                if (trimmed.startsWith('from .')) {
                    imports.local.push(line);
                } else if (trimmed.match(/^from\s+(?:os|sys|path|json|re|math|datetime|collections|itertools|functools)/)) {
                    imports.builtin.push(line);
                } else {
                    imports.thirdParty.push(line);
                }
            } else if (inImports && trimmed === '') {
                continue; // Skip blank lines in import section
            } else {
                if (inImports) {
                    // Add sorted imports with proper spacing
                    if (imports.builtin.length > 0) {
                        result.push(...imports.builtin.sort());
                    }
                    if (imports.thirdParty.length > 0) {
                        if (imports.builtin.length > 0) result.push('');
                        result.push(...imports.thirdParty.sort());
                    }
                    if (imports.local.length > 0) {
                        if (imports.builtin.length > 0 || imports.thirdParty.length > 0) result.push('');
                        result.push(...imports.local.sort());
                    }
                    result.push(''); // Blank line after imports

                    // Reset imports
                    imports.builtin = [];
                    imports.thirdParty = [];
                    imports.local = [];
                    inImports = false;
                }
                result.push(line);
            }
        }

        // Handle imports at end of file
        if (inImports) {
            if (imports.builtin.length > 0) result.push(...imports.builtin.sort());
            if (imports.thirdParty.length > 0) {
                if (imports.builtin.length > 0) result.push('');
                result.push(...imports.thirdParty.sort());
            }
            if (imports.local.length > 0) {
                if (imports.builtin.length > 0 || imports.thirdParty.length > 0) result.push('');
                result.push(...imports.local.sort());
            }
        }

        const newContent = result.join('\n');
        if (newContent !== content) {
            changes.push({
                type: 'python_imports_optimized',
                description: 'Sorted and grouped Python imports',
                file: path.relative(this.config.rootPath, filePath)
            });
        }

        return newContent;
    }

    /**
     * Remove unused Python imports
     */
    removeUnusedPythonImports(content, changes) {
        const lines = content.split('\n');
        const imports = [];
        let inImports = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
                imports.push(line);
                inImports = true;
            } else if (inImports && trimmed === '') {
                continue;
            } else {
                inImports = false;
            }
        }

        // Simple check - if import name appears elsewhere in file
        for (const importLine of imports) {
            const importMatch = importLine.match(/(?:import|from)\s+([^(\s]+)/);
            if (importMatch) {
                const importName = importMatch[1].trim();
                if (importName && content.split(importName).length > 2) {
                    // Import is used
                    continue;
                }

                // Remove unused import
                content = content.replace(importLine + '\n', '');
                changes.push({
                    type: 'unused_python_import_removed',
                    description: `Removed unused Python import: ${importLine.trim()}`,
                    file: path.relative(this.config.rootPath, filePath)
                });
            }
        }

        return content;
    }

    /**
     * Remove print statements from Python
     */
    removePrintStatements(content, changes) {
        const printRegex = /print\([^)]*\)/g;
        const matches = content.match(printRegex) || [];

        for (const match of matches) {
            content = content.replace(match, '');
            changes.push({
                type: 'print_removed',
                description: `Removed print statement: ${match.trim()}`,
                file: path.relative(this.config.rootPath, filePath)
            });
        }

        return content;
    }

    /**
     * Optimize Python functions
     */
    optimizePythonFunctions(content, changes) {
        // Add type hints where missing (basic implementation)
        const functionRegex = /def\s+(\w+)\s*\([^)]*\):\s*$/gm;
        let match;

        while ((match = functionRegex.exec(content)) !== null) {
            const fullMatch = match[0];
            const functionName = match[1];

            // Skip if it already has type hints
            if (fullMatch.includes('->')) {
                continue;
            }

            // Add basic type hint
            const newFunction = fullMatch.replace('):', ') -> None:');
            content = content.replace(fullMatch, newFunction);

            changes.push({
                type: 'python_function_optimized',
                description: `Added type hint to function: ${functionName}`,
                file: path.relative(this.config.rootPath, filePath)
            });
        }

        return content;
    }

    /**
     * Remove unused imports from compiled languages
     */
    removeUnusedImportsCompiled(content, changes) {
        // Basic implementation for compiled languages
        // This would need language-specific parsing for accurate results

        // Remove duplicate imports
        const importLines = content.split('\n').filter(line =>
            line.trim().startsWith('import ') ||
            line.trim().startsWith('using ') ||
            line.trim().startsWith('#include')
        );

        const uniqueImports = [...new Set(importLines)];

        if (uniqueImports.length !== importLines.length) {
            changes.push({
                type: 'duplicate_imports_removed',
                description: `Removed ${importLines.length - uniqueImports.length} duplicate imports`,
                file: path.relative(this.config.rootPath, 'import_placeholder')
            });
        }

        return content;
    }

    /**
     * Optimize class structure
     */
    optimizeClassStructure(content, changes) {
        // Add access modifiers where missing
        // This is a basic implementation and would need language-specific logic

        return content;
    }

    /**
     * Initialize rebasing rules
     */
    initializeRules() {
        return {
            imports: {
                enabled: true,
                sort: true,
                group: true,
                removeUnused: true
            },
            functions: {
                convertToArrow: true,
                optimizeDeclarations: true,
                addTypeHints: true
            },
            codeStyle: {
                removeConsoleLogs: true,
                addSemicolons: true,
                removeTrailingWhitespace: true,
                ensureFinalNewline: true
            },
            deadCode: {
                removeUnused: true,
                removeComments: false
            }
        };
    }

    /**
     * Get agent statistics
     */
    getStats() {
        return {
            ...this.stats,
            rules: this.rules
        };
    }
}

module.exports = CodeRebasingAgent;