/**
 * Code Reorganization Agent
 *
 * Handles project structure optimization:
 * - File and directory organization
 * - Module dependency analysis
 * - Code grouping and categorization
 * - Folder structure optimization
 * - Cross-file relationship management
 */

const fs = require('fs');
const path = require('path');

class CodeReorganizationAgent {
    constructor(config) {
        this.config = config;
        this.analysis = {
            structure: {},
            dependencies: {},
            metrics: {},
            recommendations: []
        };
    }

    /**
     * Analyze project structure
     */
    async analyzeProjectStructure(rootPath) {
        console.log('🔍 Analyzing project structure...');

        const structure = {
            directories: [],
            files: [],
            dependencies: {},
            metrics: {
                totalFiles: 0,
                totalDirectories: 0,
                maxDepth: 0,
                avgDepth: 0
            }
        };

        this.walkDirectory(rootPath, structure, 0);

        structure.metrics.avgDepth = this.calculateAverageDepth(structure);
        structure.dependencies = await this.analyzeDependencies(rootPath);

        this.analysis.structure = structure;
        return structure;
    }

    /**
     * Walk through directory structure
     */
    walkDirectory(dir, structure, depth) {
        try {
            const items = fs.readdirSync(dir);
            structure.metrics.maxDepth = Math.max(structure.metrics.maxDepth, depth);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (!this.shouldExcludeDir(fullPath)) {
                        structure.directories.push({
                            path: fullPath,
                            name: item,
                            depth: depth,
                            children: []
                        });
                        structure.metrics.totalDirectories++;
                        this.walkDirectory(fullPath, structure, depth + 1);
                    }
                } else if (stat.isFile()) {
                    if (!this.shouldExcludeFile(fullPath)) {
                        const fileInfo = this.analyzeFile(fullPath, dir, item);
                        structure.files.push(fileInfo);
                        structure.metrics.totalFiles++;
                    }
                }
            }
        } catch (error) {
            console.warn(`Warning: Could not read directory ${dir}:`, error.message);
        }
    }

    /**
     * Analyze individual file
     */
    analyzeFile(fullPath, dir, name) {
        const stats = fs.statSync(fullPath);
        const ext = path.extname(name);
        const relativePath = path.relative(this.config.rootPath, fullPath);

        let content = '';
        let imports = [];
        let exports = [];
        let lines = 0;

        try {
            content = fs.readFileSync(fullPath, 'utf8');
            lines = content.split('\n').length;

            if (['.js', '.jsx', '.ts', '.tsx', '.vue', '.py', '.java', '.cs'].includes(ext)) {
                imports = this.extractImports(content);
                exports = this.extractExports(content);
            }
        } catch (error) {
            // Skip files that can't be read
        }

        return {
            path: fullPath,
            relativePath,
            name,
            extension: ext,
            size: stats.size,
            lines,
            imports,
            exports,
            lastModified: stats.mtime,
            category: this.categorizeFile(name, ext, relativePath)
        };
    }

    /**
     * Extract imports from file content
     */
    extractImports(content) {
        const imports = [];

        // JavaScript/TypeScript imports
        const jsImportRegex = /(?:import|require)\s+(['"]?.*?['"]?)/g;
        let match;
        while ((match = jsImportRegex.exec(content)) !== null) {
            imports.push(match[0]);
        }

        // Python imports
        const pyImportRegex = /(?:import|from)\s+[\w.*]/g;
        while ((match = pyImportRegex.exec(content)) !== null) {
            imports.push(match[0]);
        }

        // Java/C# imports
        const javaImportRegex = /(?:import|using)\s+[\w.*];/g;
        while ((match = javaImportRegex.exec(content)) !== null) {
            imports.push(match[0]);
        }

        return imports;
    }

    /**
     * Extract exports from file content
     */
    extractExports(content) {
        const exports = [];

        // JavaScript/TypeScript exports
        const jsExportRegex = /(?:export|module\.exports)\s+[\w{}.,\s]+/g;
        let match;
        while ((match = jsExportRegex.exec(content)) !== null) {
            exports.push(match[0]);
        }

        // Python exports (if any)
        const pyExportRegex = /__all__\s*=\s*\[.*?\]/g;
        while ((match = pyExportRegex.exec(content)) !== null) {
            exports.push(match[0]);
        }

        return exports;
    }

    /**
     * Categorize file based on name and location
     */
    categorizeFile(name, ext, relativePath) {
        const nameLower = name.toLowerCase();
        const pathLower = relativePath.toLowerCase();

        // Configuration files
        if (['.json', '.yaml', '.yml', '.toml', '.env', '.ini'].includes(ext)) {
            return 'config';
        }

        // Documentation
        if (['.md', '.txt', '.rst', '.doc'].includes(ext) || nameLower.includes('readme')) {
            return 'documentation';
        }

        // Tests
        if (pathLower.includes('test') || pathLower.includes('spec') || nameLower.includes('test')) {
            return 'test';
        }

        // Components
        if (['.jsx', '.tsx', '.vue'].includes(ext) || nameLower.includes('component')) {
            return 'component';
        }

        // Services
        if (nameLower.includes('service') || nameLower.includes('controller') || nameLower.includes('handler')) {
            return 'service';
        }

        // Utils
        if (nameLower.includes('util') || nameLower.includes('helper') || nameLower.includes('common')) {
            return 'utility';
        }

        // Types/Interfaces
        if (['.d.ts', '.h', '.hpp'].includes(ext) || nameLower.includes('type') || nameLower.includes('interface')) {
            return 'type';
        }

        // Config/Setup files
        if (pathLower.includes('config') || pathLower.includes('setup') || nameLower.includes('config')) {
            return 'configuration';
        }

        // Assets
        if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.scss', '.less'].includes(ext)) {
            return 'asset';
        }

        // Scripts
        if (ext === '.sh' || ext === '.bat' || nameLower.includes('script')) {
            return 'script';
        }

        // Default to source
        return 'source';
    }

    /**
     * Analyze dependencies between files
     */
    async analyzeDependencies(rootPath) {
        console.log('🔗 Analyzing dependencies...');

        const dependencies = {};
        const files = await this.getAllFiles(rootPath);

        for (const file of files) {
            if (['.js', '.jsx', '.ts', '.tsx', '.vue', '.py', '.java', '.cs'].includes(file.extension)) {
                try {
                    const content = fs.readFileSync(file.path, 'utf8');
                    const fileDeps = this.extractDependencies(content, file);
                    dependencies[file.relativePath] = fileDeps;
                } catch (error) {
                    // Skip files that can't be read
                }
            }
        }

        return dependencies;
    }

    /**
     * Extract dependencies from file content
     */
    extractDependencies(content, file) {
        const deps = {
            internal: [],
            external: [],
            system: []
        };

        // Extract imports/requires
        const importRegex = /(?:import|require|from)\s+(['"])([^'"]+)\1/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            const depPath = match[2];

            if (depPath.startsWith('.')) {
                // Internal dependency
                const resolvedPath = this.resolveInternalDependency(depPath, file.relativePath);
                if (resolvedPath) {
                    deps.internal.push({
                        path: depPath,
                        resolved: resolvedPath
                    });
                }
            } else if (depPath.startsWith('/') || depPath.includes('://')) {
                // System or external URL
                deps.system.push(depPath);
            } else {
                // External package
                deps.external.push(depPath);
            }
        }

        return deps;
    }

    /**
     * Resolve internal dependency path
     */
    resolveInternalDependency(depPath, filePath) {
        const currentDir = path.dirname(filePath);
        const resolved = path.normalize(path.join(currentDir, depPath));

        // Remove extension to handle different import styles
        const withoutExt = resolved.replace(/\.(js|jsx|ts|tsx|vue)$/, '');

        return withoutExt;
    }

    /**
     * Get all files in the project
     */
    async getAllFiles(rootPath) {
        const files = [];

        const walk = (dir) => {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !this.shouldExcludeDir(fullPath)) {
                    walk(fullPath);
                } else if (stat.isFile() && !this.shouldExcludeFile(fullPath)) {
                    const ext = path.extname(fullPath);
                    files.push({
                        path: fullPath,
                        relativePath: path.relative(rootPath, fullPath),
                        extension: ext
                    });
                }
            }
        };

        walk(rootPath);
        return files;
    }

    /**
     * Generate reorganization plan
     */
    async generateReorganizationPlan(structure) {
        console.log('📋 Generating reorganization plan...');

        const plan = {
            targetStructure: this.generateOptimalStructure(structure),
            moves: [],
            creates: [],
            removes: [],
            recommendations: []
        };

        // Analyze current structure and suggest improvements
        plan.recommendations = this.generateRecommendations(structure);
        plan.moves = this.calculateFileMoves(structure, plan.targetStructure);

        return plan;
    }

    /**
     * Generate optimal target structure
     */
    generateOptimalStructure(structure) {
        const targetStructure = {
            directories: [
                'src',
                'src/components',
                'src/services',
                'src/utils',
                'src/types',
                'src/hooks',
                'src/constants',
                'src/assets',
                'tests',
                'tests/unit',
                'tests/integration',
                'tests/e2e',
                'docs',
                'scripts',
                'config',
                'assets',
                'assets/images',
                'assets/styles'
            ]
        };

        return targetStructure;
    }

    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(structure) {
        const recommendations = [];

        // Analyze directory depth
        if (structure.metrics.maxDepth > 6) {
            recommendations.push({
                type: 'depth_optimization',
                priority: 'high',
                description: 'Reduce directory nesting depth (current: ' + structure.metrics.maxDepth + ')',
                action: 'Consolidate deeply nested directories'
            });
        }

        // Analyze file distribution
        const fileCategories = this.analyzeFileDistribution(structure.files);

        if (fileCategories.source === 0) {
            recommendations.push({
                type: 'missing_source',
                priority: 'high',
                description: 'No source files found in project',
                action: 'Verify project structure and add source files'
            });
        }

        // Check for common issues
        const commonIssues = this.identifyCommonIssues(structure);
        recommendations.push(...commonIssues);

        return recommendations;
    }

    /**
     * Analyze file distribution by category
     */
    analyzeFileDistribution(files) {
        const distribution = {};

        for (const file of files) {
            distribution[file.category] = (distribution[file.category] || 0) + 1;
        }

        return distribution;
    }

    /**
     * Identify common structural issues
     */
    identifyCommonIssues(structure) {
        const issues = [];

        // Check for JavaScript files in root
        const jsFilesInRoot = structure.files.filter(f =>
            ['.js', '.jsx', '.ts', '.tsx'].includes(f.extension) &&
            !f.relativePath.includes('/')
        );

        if (jsFilesInRoot.length > 0) {
            issues.push({
                type: 'root_level_files',
                priority: 'medium',
                description: `${jsFilesInRoot.length} JavaScript/TypeScript files in root directory`,
                action: 'Move source files to src/ directory'
            });
        }

        // Check for missing standard directories
        const expectedDirs = ['src', 'tests', 'docs'];
        const existingDirs = structure.directories.map(d => path.basename(d.path));

        for (const expectedDir of expectedDirs) {
            if (!existingDirs.includes(expectedDir)) {
                issues.push({
                    type: 'missing_standard_dir',
                    priority: 'low',
                    description: `Missing standard directory: ${expectedDir}`,
                    action: `Create ${expectedDir} directory`
                });
            }
        }

        return issues;
    }

    /**
     * Calculate file moves needed
     */
    calculateFileMoves(structure, targetStructure) {
        const moves = [];

        for (const file of structure.files) {
            const currentDir = path.dirname(file.relativePath);
            const targetDir = this.determineTargetDirectory(file, targetStructure);

            if (currentDir !== targetDir) {
                moves.push({
                    from: file.relativePath,
                    to: path.join(targetDir, file.name),
                    category: file.category,
                    reason: `Move ${file.category} file to appropriate directory`
                });
            }
        }

        return moves;
    }

    /**
     * Determine target directory for a file
     */
    determineTargetDirectory(file, targetStructure) {
        const category = file.category;
        const name = file.name.toLowerCase();

        switch (category) {
            case 'component':
                return 'src/components';
            case 'service':
                return 'src/services';
            case 'utility':
                return 'src/utils';
            case 'type':
                return 'src/types';
            case 'test':
                return 'tests';
            case 'documentation':
                return 'docs';
            case 'config':
                return 'config';
            case 'script':
                return 'scripts';
            case 'asset':
                if (file.extension.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
                    return 'assets/images';
                } else if (file.extension.match(/\.(css|scss|less)$/)) {
                    return 'assets/styles';
                }
                return 'assets';
            default:
                return 'src';
        }
    }

    /**
     * Apply reorganization plan
     */
    async applyReorganization(plan, rootPath) {
        console.log('🔧 Applying reorganization...');

        if (this.config.dryRun) {
            console.log('📄 Dry run - no changes will be made');
            return { changes: plan.moves.length, moves: plan.moves };
        }

        const results = {
            changes: 0,
            moves: [],
            errors: []
        };

        // Create target directories
        for (const dir of plan.targetStructure.directories) {
            try {
                const fullPath = path.join(rootPath, dir);
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath, { recursive: true });
                    console.log(`  Created directory: ${dir}`);
                }
            } catch (error) {
                results.errors.push(`Failed to create directory ${dir}: ${error.message}`);
            }
        }

        // Move files
        for (const move of plan.moves) {
            try {
                const fromPath = path.join(rootPath, move.from);
                const toPath = path.join(rootPath, move.to);

                // Ensure target directory exists
                const targetDir = path.dirname(toPath);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }

                // Handle file name conflicts
                let finalToPath = toPath;
                let counter = 1;
                while (fs.existsSync(finalToPath)) {
                    const nameParts = path.basename(toPath, path.extname(toPath));
                    const ext = path.extname(toPath);
                    finalToPath = path.join(targetDir, `${nameParts}_${counter}${ext}`);
                    counter++;
                }

                // Move the file
                if (fromPath !== finalToPath) {
                    fs.renameSync(fromPath, finalToPath);
                    results.moves.push({
                        from: move.from,
                        to: path.relative(rootPath, finalToPath),
                        category: move.category
                    });
                    results.changes++;
                    console.log(`  Moved: ${move.from} → ${path.relative(rootPath, finalToPath)}`);
                }

            } catch (error) {
                results.errors.push(`Failed to move ${move.from}: ${error.message}`);
            }
        }

        // Update import paths in files
        await this.updateImportPaths(results.moves, rootPath);

        return results;
    }

    /**
     * Update import paths after file moves
     */
    async updateImportPaths(moves, rootPath) {
        console.log('🔄 Updating import paths...');

        const sourceFiles = await this.getAllSourceFiles(rootPath);
        let updatedFiles = 0;

        for (const file of sourceFiles) {
            try {
                let content = fs.readFileSync(file.path, 'utf8');
                let modified = false;

                for (const move of moves) {
                    const oldPath = this.normalizeImportPath(move.from);
                    const newPath = this.normalizeImportPath(move.to);

                    // Update relative import paths
                    const relativePath = path.relative(path.dirname(file.relativePath), move.from);
                    const newRelativePath = path.relative(path.dirname(file.relativePath), move.to);

                    const oldImport = relativePath.replace(/\.(js|jsx|ts|tsx|vue)$/, '');
                    const newImport = newRelativePath.replace(/\.(js|jsx|ts|tsx|vue)$/, '');

                    if (oldImport !== newImport) {
                        // Update import statements
                        const importRegex = new RegExp(this.escapeRegex(oldImport), 'g');
                        if (importRegex.test(content)) {
                            content = content.replace(importRegex, newImport);
                            modified = true;
                        }
                    }
                }

                if (modified) {
                    fs.writeFileSync(file.path, content, 'utf8');
                    updatedFiles++;
                }

            } catch (error) {
                console.warn(`  Warning: Could not update imports in ${file.relativePath}: ${error.message}`);
            }
        }

        if (updatedFiles > 0) {
            console.log(`  Updated import paths in ${updatedFiles} files`);
        }
    }

    /**
     * Get all source files
     */
    async getAllSourceFiles(rootPath) {
        const files = [];
        const sourceExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.py', '.java', '.cs'];

        const walk = (dir) => {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !this.shouldExcludeDir(fullPath)) {
                    walk(fullPath);
                } else if (stat.isFile() && sourceExtensions.includes(path.extname(fullPath))) {
                    files.push({
                        path: fullPath,
                        relativePath: path.relative(rootPath, fullPath)
                    });
                }
            }
        };

        walk(rootPath);
        return files;
    }

    /**
     * Normalize import path
     */
    normalizeImportPath(filePath) {
        return filePath.replace(/\\/g, '/').replace(/\.(js|jsx|ts|tsx|vue)$/, '');
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Check if directory should be excluded
     */
    shouldExcludeDir(dirPath) {
        const dirName = path.basename(dirPath);
        return this.config.excludeDirs.includes(dirName) ||
               dirPath.includes('node_modules') ||
               dirPath.includes('.git') ||
               dirPath.includes('dist') ||
               dirPath.includes('build');
    }

    /**
     * Check if file should be excluded
     */
    shouldExcludeFile(filePath) {
        const fileName = path.basename(filePath);
        return this.config.excludeFiles.some(pattern => fileName.match(pattern.replace('*', '.*')));
    }

    /**
     * Calculate average directory depth
     */
    calculateAverageDepth(structure) {
        if (structure.directories.length === 0) return 0;

        const totalDepth = structure.directories.reduce((sum, dir) => sum + dir.depth, 0);
        return Math.round(totalDepth / structure.directories.length);
    }
}

module.exports = CodeReorganizationAgent;