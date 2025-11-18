#!/bin/bash

# ============================================================================
# Obsidian Plugin Enhancement Script
# ============================================================================
# A comprehensive script for rebasing, optimizing, and enhancing Obsidian plugins
# 
# Features:
# - Code rebasing and git management
# - TypeScript/JavaScript optimization
# - Build process enhancement
# - Code quality checks
# - Performance profiling
# - Documentation generation
# - Release preparation
# ============================================================================

set -e  # Exit on error

# ============================================================================
# CONFIGURATION
# ============================================================================

PLUGIN_NAME="${PLUGIN_NAME:-obsidian-plugin}"
PLUGIN_DIR="${PLUGIN_DIR:-.}"
BUILD_DIR="${BUILD_DIR:-dist}"
OBSIDIAN_VAULT="${OBSIDIAN_VAULT:-$HOME/ObsidianVault/.obsidian/plugins/$PLUGIN_NAME}"
NODE_VERSION="${NODE_VERSION:-18}"
ENABLE_TESTS="${ENABLE_TESTS:-true}"
ENABLE_LINT="${ENABLE_LINT:-true}"
ENABLE_TYPECHECK="${ENABLE_TYPECHECK:-true}"
ENABLE_BUNDLE_ANALYSIS="${ENABLE_BUNDLE_ANALYSIS:-false}"
ENABLE_PERFORMANCE_PROFILE="${ENABLE_PERFORMANCE_PROFILE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo -e "\n${MAGENTA}=================================================================================${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${MAGENTA}=================================================================================${NC}\n"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is not installed. Please install it first."
        return 1
    fi
    return 0
}

confirm_action() {
    read -p "$1 (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

check_prerequisites() {
    log_section "Checking Prerequisites"
    
    local missing_deps=0
    
    # Check for required commands
    local required_commands=("git" "node" "npm")
    for cmd in "${required_commands[@]}"; do
        if check_command "$cmd"; then
            log_success "$cmd is installed"
        else
            ((missing_deps++))
        fi
    done
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge "$NODE_VERSION" ]; then
            log_success "Node.js version is sufficient (v$node_version)"
        else
            log_warning "Node.js version is v$node_version, recommended is v$NODE_VERSION or higher"
        fi
    fi
    
    # Check for optional tools
    local optional_commands=("pnpm" "yarn" "eslint" "prettier" "jest" "esbuild" "rollup" "webpack")
    for cmd in "${optional_commands[@]}"; do
        if check_command "$cmd" 2>/dev/null; then
            log_info "$cmd is available"
        fi
    done
    
    if [ $missing_deps -gt 0 ]; then
        log_error "Missing required dependencies. Please install them before continuing."
        exit 1
    fi
}

# ============================================================================
# GIT OPERATIONS
# ============================================================================

git_rebase() {
    log_section "Git Rebase Operations"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        return 1
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_warning "You have uncommitted changes. Please commit or stash them first."
        if confirm_action "Would you like to stash changes?"; then
            git stash push -m "Auto-stash before rebase $(date +%Y-%m-%d_%H:%M:%S)"
            log_success "Changes stashed"
        else
            return 1
        fi
    fi
    
    # Fetch latest changes
    log_info "Fetching latest changes from remote..."
    git fetch --all --prune
    
    # Interactive rebase options
    echo "Select rebase operation:"
    echo "1) Rebase on main/master"
    echo "2) Interactive rebase (last N commits)"
    echo "3) Squash commits"
    echo "4) Clean up commit history"
    echo "5) Skip rebase"
    read -p "Enter choice (1-5): " rebase_choice
    
    case $rebase_choice in
        1)
            local main_branch=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
            log_info "Rebasing on $main_branch..."
            git rebase origin/$main_branch
            ;;
        2)
            read -p "Number of commits to rebase: " num_commits
            git rebase -i HEAD~$num_commits
            ;;
        3)
            read -p "Number of commits to squash: " num_commits
            git reset --soft HEAD~$num_commits
            git commit -m "Squashed $num_commits commits"
            ;;
        4)
            log_info "Starting interactive rebase for cleanup..."
            git rebase -i --root
            ;;
        5)
            log_info "Skipping rebase"
            ;;
        *)
            log_error "Invalid choice"
            return 1
            ;;
    esac
    
    log_success "Git operations completed"
}

# ============================================================================
# DEPENDENCY MANAGEMENT
# ============================================================================

update_dependencies() {
    log_section "Updating Dependencies"
    
    cd "$PLUGIN_DIR"
    
    # Detect package manager
    if [ -f "pnpm-lock.yaml" ]; then
        PKG_MANAGER="pnpm"
    elif [ -f "yarn.lock" ]; then
        PKG_MANAGER="yarn"
    else
        PKG_MANAGER="npm"
    fi
    
    log_info "Using package manager: $PKG_MANAGER"
    
    # Check for outdated packages
    log_info "Checking for outdated packages..."
    case $PKG_MANAGER in
        pnpm)
            pnpm outdated
            ;;
        yarn)
            yarn outdated
            ;;
        npm)
            npm outdated
            ;;
    esac
    
    if confirm_action "Update dependencies?"; then
        case $PKG_MANAGER in
            pnpm)
                pnpm update
                ;;
            yarn)
                yarn upgrade
                ;;
            npm)
                npm update
                ;;
        esac
        log_success "Dependencies updated"
    fi
    
    # Security audit
    log_info "Running security audit..."
    case $PKG_MANAGER in
        pnpm)
            pnpm audit
            ;;
        yarn)
            yarn audit
            ;;
        npm)
            npm audit
            ;;
    esac
    
    if confirm_action "Fix security vulnerabilities?"; then
        case $PKG_MANAGER in
            pnpm)
                pnpm audit --fix
                ;;
            yarn)
                yarn audit --fix
                ;;
            npm)
                npm audit fix
                ;;
        esac
    fi
}

# ============================================================================
# CODE OPTIMIZATION
# ============================================================================

optimize_code() {
    log_section "Code Optimization"
    
    cd "$PLUGIN_DIR"
    
    # TypeScript configuration optimization
    if [ -f "tsconfig.json" ]; then
        log_info "Optimizing TypeScript configuration..."
        
        # Create optimized tsconfig if it doesn't exist
        if [ ! -f "tsconfig.prod.json" ]; then
            cat > tsconfig.prod.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": false,
    "declaration": false,
    "declarationMap": false,
    "removeComments": true,
    "noEmitOnError": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "**/*.test.ts", "**/*.spec.ts", "tests/**/*"]
}
EOF
            log_success "Created optimized TypeScript configuration"
        fi
    fi
    
    # ESLint configuration
    if [ "$ENABLE_LINT" = "true" ] && [ -f ".eslintrc.js" -o -f ".eslintrc.json" -o -f ".eslintrc.yml" ]; then
        log_info "Running ESLint..."
        npx eslint . --fix --ext .ts,.tsx,.js,.jsx
        log_success "ESLint fixes applied"
    fi
    
    # Prettier formatting
    if [ -f ".prettierrc" -o -f ".prettierrc.js" -o -f ".prettierrc.json" ]; then
        log_info "Running Prettier..."
        npx prettier --write "**/*.{ts,tsx,js,jsx,json,md,css,scss}"
        log_success "Code formatted with Prettier"
    fi
    
    # Dead code elimination
    log_info "Checking for unused exports..."
    if command -v ts-prune &> /dev/null; then
        npx ts-prune
    else
        log_info "Installing ts-prune for dead code detection..."
        npm install -D ts-prune
        npx ts-prune
    fi
}

# ============================================================================
# BUILD OPTIMIZATION
# ============================================================================

optimize_build() {
    log_section "Build Optimization"
    
    cd "$PLUGIN_DIR"
    
    # Create optimized build configuration
    log_info "Creating optimized build configuration..."
    
    # Check for esbuild
    if [ -f "esbuild.config.mjs" -o -f "esbuild.config.js" ]; then
        log_info "Optimizing esbuild configuration..."
        
        # Create optimized esbuild config
        cat > esbuild.config.prod.mjs << 'EOF'
import esbuild from "esbuild";
import process from "process";

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
If you want to view the source, visit the plugin's github repository
*/`;

const prod = process.argv[2] === "production";

const context = await esbuild.context({
    banner: {
        js: banner,
    },
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
    ],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    minify: prod,
    minifyWhitespace: prod,
    minifyIdentifiers: prod,
    minifySyntax: prod,
    keepNames: false,
    outfile: "main.js",
    metafile: true,
    pure: prod ? ["console.log", "console.debug"] : [],
    drop: prod ? ["console", "debugger"] : [],
});

if (prod) {
    await context.rebuild();
    console.log("Build complete");
    
    // Output bundle size analysis
    const result = await context.rebuild();
    const text = await esbuild.analyzeMetafile(result.metafile);
    console.log(text);
    
    process.exit(0);
} else {
    await context.watch();
}
EOF
        log_success "Created optimized esbuild configuration"
    fi
    
    # Rollup optimization
    if [ -f "rollup.config.js" ]; then
        log_info "Optimizing Rollup configuration..."
        
        cat > rollup.config.prod.js << 'EOF'
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import analyze from "rollup-plugin-analyzer";

export default {
    input: "src/main.ts",
    output: {
        dir: ".",
        sourcemap: false,
        sourcemapExcludeSources: true,
        format: "cjs",
        exports: "default",
    },
    external: ["obsidian"],
    plugins: [
        typescript({
            tsconfig: "./tsconfig.prod.json",
        }),
        nodeResolve({
            browser: true,
        }),
        commonjs(),
        terser({
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ["console.log", "console.debug"],
                passes: 2,
            },
            mangle: {
                properties: {
                    regex: /^_/,
                },
            },
            format: {
                comments: false,
            },
        }),
        analyze({
            summaryOnly: true,
            limit: 10,
        }),
    ],
};
EOF
        log_success "Created optimized Rollup configuration"
    fi
    
    # Build the plugin
    log_info "Building optimized plugin..."
    npm run build
    
    log_success "Build optimization complete"
}

# ============================================================================
# PERFORMANCE PROFILING
# ============================================================================

profile_performance() {
    log_section "Performance Profiling"
    
    cd "$PLUGIN_DIR"
    
    # Create performance test
    log_info "Creating performance benchmarks..."
    
    mkdir -p tests/performance
    
    cat > tests/performance/benchmark.js << 'EOF'
// Performance benchmark for Obsidian plugin
const { performance } = require('perf_hooks');

class PerformanceProfiler {
    constructor(pluginName) {
        this.pluginName = pluginName;
        this.measurements = [];
    }

    measure(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        this.measurements.push({
            name,
            duration: end - start,
            timestamp: new Date().toISOString()
        });
        
        return result;
    }

    async measureAsync(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        this.measurements.push({
            name,
            duration: end - start,
            timestamp: new Date().toISOString()
        });
        
        return result;
    }

    generateReport() {
        console.log('\n=== Performance Report ===\n');
        console.log(`Plugin: ${this.pluginName}`);
        console.log(`Total measurements: ${this.measurements.length}`);
        
        const totalTime = this.measurements.reduce((sum, m) => sum + m.duration, 0);
        console.log(`Total time: ${totalTime.toFixed(2)}ms`);
        
        console.log('\nDetailed measurements:');
        this.measurements.forEach(m => {
            console.log(`  ${m.name}: ${m.duration.toFixed(2)}ms`);
        });
        
        // Find slowest operations
        const sorted = [...this.measurements].sort((a, b) => b.duration - a.duration);
        console.log('\nSlowest operations:');
        sorted.slice(0, 5).forEach(m => {
            console.log(`  ${m.name}: ${m.duration.toFixed(2)}ms`);
        });
    }
}

// Export for use in tests
if (typeof module !== 'undefined') {
    module.exports = { PerformanceProfiler };
}
EOF
    
    log_success "Performance profiling setup complete"
}

# ============================================================================
# CODE QUALITY CHECKS
# ============================================================================

check_code_quality() {
    log_section "Code Quality Checks"
    
    cd "$PLUGIN_DIR"
    
    local quality_score=100
    local issues_found=0
    
    # TypeScript type checking
    if [ "$ENABLE_TYPECHECK" = "true" ] && [ -f "tsconfig.json" ]; then
        log_info "Running TypeScript type checking..."
        if npx tsc --noEmit; then
            log_success "TypeScript: No type errors found"
        else
            log_warning "TypeScript: Type errors found"
            ((quality_score -= 10))
            ((issues_found++))
        fi
    fi
    
    # ESLint checking
    if [ "$ENABLE_LINT" = "true" ] && command -v eslint &> /dev/null; then
        log_info "Running ESLint..."
        if npx eslint . --ext .ts,.tsx,.js,.jsx; then
            log_success "ESLint: No issues found"
        else
            log_warning "ESLint: Issues found"
            ((quality_score -= 5))
            ((issues_found++))
        fi
    fi
    
    # Check for console.log statements
    log_info "Checking for console.log statements..."
    console_count=$(grep -r "console\.\(log\|debug\|info\|warn\|error\)" src/ --include="*.ts" --include="*.js" | wc -l)
    if [ "$console_count" -gt 0 ]; then
        log_warning "Found $console_count console statements"
        ((quality_score -= 5))
        ((issues_found++))
    else
        log_success "No console statements found"
    fi
    
    # Check for TODO/FIXME comments
    log_info "Checking for TODO/FIXME comments..."
    todo_count=$(grep -r "TODO\|FIXME\|XXX\|HACK" src/ --include="*.ts" --include="*.js" | wc -l)
    if [ "$todo_count" -gt 0 ]; then
        log_warning "Found $todo_count TODO/FIXME comments"
        ((quality_score -= 3))
    else
        log_success "No TODO/FIXME comments found"
    fi
    
    # Check for proper error handling
    log_info "Checking error handling..."
    try_catch_count=$(grep -r "try\s*{" src/ --include="*.ts" --include="*.js" | wc -l)
    if [ "$try_catch_count" -lt 1 ]; then
        log_warning "Limited error handling found (only $try_catch_count try-catch blocks)"
        ((quality_score -= 5))
        ((issues_found++))
    else
        log_success "Found $try_catch_count try-catch blocks"
    fi
    
    # Check bundle size
    if [ -f "main.js" ]; then
        log_info "Checking bundle size..."
        bundle_size=$(du -h main.js | cut -f1)
        log_info "Bundle size: $bundle_size"
        
        # Check if bundle is too large (>1MB)
        size_in_bytes=$(stat -f%z "main.js" 2>/dev/null || stat -c%s "main.js" 2>/dev/null || echo "0")
        if [ "$size_in_bytes" -gt 1048576 ]; then
            log_warning "Bundle size is large (>1MB). Consider code splitting or removing unused dependencies."
            ((quality_score -= 10))
            ((issues_found++))
        fi
    fi
    
    # Calculate final score
    log_info "Code Quality Score: $quality_score/100"
    if [ $quality_score -ge 90 ]; then
        log_success "Excellent code quality!"
    elif [ $quality_score -ge 75 ]; then
        log_success "Good code quality"
    elif [ $quality_score -ge 60 ]; then
        log_warning "Fair code quality - consider addressing issues"
    else
        log_error "Poor code quality - significant improvements needed"
    fi
    
    echo "Issues found: $issues_found"
}

# ============================================================================
# TESTING
# ============================================================================

run_tests() {
    log_section "Running Tests"
    
    cd "$PLUGIN_DIR"
    
    if [ "$ENABLE_TESTS" != "true" ]; then
        log_info "Tests disabled"
        return 0
    fi
    
    # Check for test framework
    if [ -f "jest.config.js" ] || [ -f "jest.config.json" ]; then
        log_info "Running Jest tests..."
        npm test
    elif [ -f "vitest.config.js" ] || [ -f "vitest.config.ts" ]; then
        log_info "Running Vitest tests..."
        npx vitest run
    elif [ -f ".mocharc.js" ] || [ -f ".mocharc.json" ]; then
        log_info "Running Mocha tests..."
        npx mocha
    else
        log_warning "No test framework detected"
        
        # Create basic test setup
        if confirm_action "Would you like to set up Jest for testing?"; then
            log_info "Installing Jest..."
            npm install --save-dev jest @types/jest ts-jest
            
            # Create Jest config
            cat > jest.config.js << 'EOF'
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts',
        '!src/**/*.spec.ts'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html']
};
EOF
            
            # Create sample test
            mkdir -p tests
            cat > tests/sample.test.ts << 'EOF'
describe('Obsidian Plugin Tests', () => {
    test('should pass basic test', () => {
        expect(true).toBe(true);
    });
});
EOF
            
            # Update package.json
            npm pkg set scripts.test="jest"
            npm pkg set scripts.test:watch="jest --watch"
            npm pkg set scripts.test:coverage="jest --coverage"
            
            log_success "Jest setup complete"
        fi
    fi
}

# ============================================================================
# DOCUMENTATION
# ============================================================================

generate_documentation() {
    log_section "Generating Documentation"
    
    cd "$PLUGIN_DIR"
    
    # Generate API documentation with TypeDoc
    if command -v typedoc &> /dev/null || npm list typedoc &> /dev/null; then
        log_info "Generating API documentation with TypeDoc..."
        npx typedoc --out docs src/main.ts
    else
        if confirm_action "Install TypeDoc for API documentation?"; then
            npm install --save-dev typedoc
            npx typedoc --out docs src/main.ts
        fi
    fi
    
    # Update README
    log_info "Checking README.md..."
    if [ ! -f "README.md" ]; then
        log_warning "README.md not found. Creating template..."
        cat > README.md << EOF
# $PLUGIN_NAME

## Description
[Add your plugin description here]

## Features
- Feature 1
- Feature 2
- Feature 3

## Installation
1. Download the latest release from the [Releases](../../releases) page
2. Extract the files into your vault's \`.obsidian/plugins/$PLUGIN_NAME\` folder
3. Reload Obsidian
4. Enable the plugin in Settings > Community plugins

## Usage
[Add usage instructions here]

## Development
\`\`\`bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Run tests
npm test

# Run development build with file watcher
npm run dev
\`\`\`

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
EOF
        log_success "Created README.md template"
    fi
    
    # Generate CHANGELOG if it doesn't exist
    if [ ! -f "CHANGELOG.md" ]; then
        log_info "Creating CHANGELOG.md..."
        cat > CHANGELOG.md << EOF
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release

### Changed

### Deprecated

### Removed

### Fixed

### Security
EOF
        log_success "Created CHANGELOG.md"
    fi
}

# ============================================================================
# RELEASE PREPARATION
# ============================================================================

prepare_release() {
    log_section "Preparing Release"
    
    cd "$PLUGIN_DIR"
    
    # Check manifest
    if [ ! -f "manifest.json" ]; then
        log_error "manifest.json not found"
        return 1
    fi
    
    # Read current version
    current_version=$(grep '"version"' manifest.json | sed 's/.*"version": "\(.*\)".*/\1/')
    log_info "Current version: $current_version"
    
    # Ask for new version
    read -p "Enter new version (or press Enter to keep $current_version): " new_version
    if [ -z "$new_version" ]; then
        new_version=$current_version
    fi
    
    # Update versions
    if [ "$new_version" != "$current_version" ]; then
        log_info "Updating version to $new_version..."
        
        # Update manifest.json
        sed -i.bak "s/\"version\": \".*\"/\"version\": \"$new_version\"/" manifest.json
        
        # Update package.json if it exists
        if [ -f "package.json" ]; then
            sed -i.bak "s/\"version\": \".*\"/\"version\": \"$new_version\"/" package.json
        fi
        
        # Update versions.json if it exists
        if [ -f "versions.json" ]; then
            # Add new version to versions.json
            jq ". + {\"$new_version\": \"0.15.0\"}" versions.json > versions.tmp.json
            mv versions.tmp.json versions.json
        fi
        
        log_success "Version updated to $new_version"
    fi
    
    # Build production version
    log_info "Building production version..."
    NODE_ENV=production npm run build
    
    # Create release directory
    release_dir="releases/v$new_version"
    mkdir -p "$release_dir"
    
    # Copy release files
    log_info "Preparing release files..."
    cp manifest.json "$release_dir/"
    cp main.js "$release_dir/"
    if [ -f "styles.css" ]; then
        cp styles.css "$release_dir/"
    fi
    
    # Create release archive
    log_info "Creating release archive..."
    cd releases
    zip -r "$PLUGIN_NAME-$new_version.zip" "v$new_version"
    cd ..
    
    log_success "Release prepared: releases/$PLUGIN_NAME-$new_version.zip"
    
    # Git operations for release
    if confirm_action "Create git tag for release?"; then
        git add .
        git commit -m "Release v$new_version"
        git tag -a "v$new_version" -m "Release version $new_version"
        log_success "Git tag created: v$new_version"
        
        if confirm_action "Push to remote?"; then
            git push origin main
            git push origin "v$new_version"
            log_success "Pushed to remote repository"
        fi
    fi
}

# ============================================================================
# DEVELOPMENT MODE
# ============================================================================

setup_dev_environment() {
    log_section "Setting Up Development Environment"
    
    cd "$PLUGIN_DIR"
    
    # Create hot-reload script
    log_info "Setting up hot-reload for development..."
    
    cat > dev.sh << 'EOF'
#!/bin/bash
# Development script with hot-reload

VAULT_PATH="${1:-$HOME/ObsidianVault}"
PLUGIN_NAME=$(grep '"id"' manifest.json | sed 's/.*"id": "\(.*\)".*/\1/')
PLUGIN_PATH="$VAULT_PATH/.obsidian/plugins/$PLUGIN_NAME"

echo "Setting up development environment..."
echo "Plugin: $PLUGIN_NAME"
echo "Vault: $VAULT_PATH"
echo "Plugin path: $PLUGIN_PATH"

# Create plugin directory if it doesn't exist
mkdir -p "$PLUGIN_PATH"

# Copy initial files
cp manifest.json "$PLUGIN_PATH/"
if [ -f "styles.css" ]; then
    cp styles.css "$PLUGIN_PATH/"
fi

# Watch and build
echo "Starting development build with hot-reload..."
npm run dev &
DEV_PID=$!

# Watch for changes and copy to vault
fswatch -o main.js styles.css 2>/dev/null | while read change; do
    echo "Changes detected, copying to vault..."
    cp main.js "$PLUGIN_PATH/" 2>/dev/null
    [ -f "styles.css" ] && cp styles.css "$PLUGIN_PATH/" 2>/dev/null
    echo "Files copied. Reload Obsidian to see changes."
done &
WATCH_PID=$!

# Cleanup on exit
trap "kill $DEV_PID $WATCH_PID 2>/dev/null; exit" INT TERM

echo "Development environment is running. Press Ctrl+C to stop."
wait
EOF
    
    chmod +x dev.sh
    log_success "Development environment setup complete"
    
    # Create VS Code debug configuration
    if [ ! -d ".vscode" ]; then
        mkdir .vscode
        cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Build Plugin",
            "skipFiles": ["<node_internals>/**"],
            "program": "${workspaceFolder}/node_modules/.bin/esbuild",
            "args": [
                "${workspaceFolder}/src/main.ts",
                "--bundle",
                "--outfile=${workspaceFolder}/main.js",
                "--external:obsidian",
                "--format=cjs",
                "--watch",
                "--sourcemap=inline"
            ],
            "console": "integratedTerminal",
            "internalConsoleOptions": "neverOpen"
        }
    ]
}
EOF
        log_success "Created VS Code debug configuration"
    fi
}

# ============================================================================
# MAIN MENU
# ============================================================================

show_menu() {
    echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║          Obsidian Plugin Enhancement Script                  ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  1) Full Enhancement Pipeline (Recommended)                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  2) Git Rebase & Cleanup                                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  3) Update Dependencies                                      ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  4) Optimize Code                                           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  5) Optimize Build                                          ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  6) Run Tests                                               ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  7) Check Code Quality                                      ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  8) Profile Performance                                     ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  9) Generate Documentation                                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} 10) Prepare Release                                         ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC} 11) Setup Development Environment                           ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  0) Exit                                                    ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    read -p "Select an option: " choice
}

run_full_pipeline() {
    log_section "Running Full Enhancement Pipeline"
    
    check_prerequisites
    git_rebase
    update_dependencies
    optimize_code
    optimize_build
    run_tests
    check_code_quality
    profile_performance
    generate_documentation
    
    log_success "Full enhancement pipeline complete!"
    
    if confirm_action "Prepare release?"; then
        prepare_release
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --plugin-dir)
                PLUGIN_DIR="$2"
                shift 2
                ;;
            --plugin-name)
                PLUGIN_NAME="$2"
                shift 2
                ;;
            --vault)
                OBSIDIAN_VAULT="$2"
                shift 2
                ;;
            --no-tests)
                ENABLE_TESTS=false
                shift
                ;;
            --no-lint)
                ENABLE_LINT=false
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --plugin-dir PATH    Path to plugin directory (default: current directory)"
                echo "  --plugin-name NAME   Name of the plugin"
                echo "  --vault PATH         Path to Obsidian vault"
                echo "  --no-tests           Disable test running"
                echo "  --no-lint            Disable linting"
                echo "  --help              Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Interactive mode
    while true; do
        show_menu
        
        case $choice in
            1) run_full_pipeline ;;
            2) check_prerequisites && git_rebase ;;
            3) check_prerequisites && update_dependencies ;;
            4) check_prerequisites && optimize_code ;;
            5) check_prerequisites && optimize_build ;;
            6) check_prerequisites && run_tests ;;
            7) check_prerequisites && check_code_quality ;;
            8) check_prerequisites && profile_performance ;;
            9) check_prerequisites && generate_documentation ;;
            10) check_prerequisites && prepare_release ;;
            11) check_prerequisites && setup_dev_environment ;;
            0)
                log_info "Exiting..."
                exit 0
                ;;
            *)
                log_error "Invalid option"
                ;;
        esac
        
        echo
        read -p "Press Enter to continue..."
    done
}

# Run main function
main "$@"