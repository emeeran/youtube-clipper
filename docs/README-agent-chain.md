# Agent Chain Runner

A reusable system that chains multiple AI agents for comprehensive code optimization including rebasing, reorganization, and performance improvements.

## 🚀 Features

### 📊 **Three-Phase Optimization**
1. **Code Rebasing** - Restructure and refactor code
2. **Project Reorganization** - Optimize file and directory structure
3. **Performance Optimization** - Speed and memory improvements

### 🔧 **Supported Languages**
- **JavaScript/TypeScript** (`.js`, `.jsx`, `.ts`, `.tsx`)
- **Python** (`.py`)
- **Compiled Languages** (`.java`, `.cs`, `.go`, `.rs`)
- **Styles** (`.css`, `.scss`, `.less`)
- **Web Components** (`.vue`)

### ⚡ **Performance Optimizations**
- Loop optimization and caching
- Array and string operation improvements
- Memory usage reduction
- Async operation optimization
- DOM manipulation batching
- Function memoization

## 📁 Architecture

```
Agent Chain Runner
├── Code Rebasing Agent
│   ├── Import/Export optimization
│   ├── Code style standardization
│   ├── Function/class refactoring
│   └── Dead code removal
├── Code Reorganization Agent
│   ├── Structure analysis
│   ├── Dependency mapping
│   ├── File categorization
│   └── Directory optimization
└── Performance Optimization Agent
    ├── Algorithm optimization
    ├── Memory usage optimization
    ├── I/O performance
    └── Metrics analysis
```

## 🚀 Quick Start

### Installation
```bash
# Clone or download the agent chain files
git clone <repository-url>
cd agent-chain-runner
npm install

# Or copy files to your project
cp agent-chain-runner.js your-project/
cp -r agents your-project/
cp agent-chain-config.json your-project/
```

### Basic Usage
```bash
# Run with default settings
node agent-chain-runner.js

# Dry run (no actual changes)
node agent-chain-runner.js --dry-run

# Parallel processing
node agent-chain-runner.js --parallel

# With custom root directory
node agent-chain-runner.js --root ./src
```

### Advanced Configuration
```javascript
const AgentChainRunner = require('./agent-chain-runner');

const runner = new AgentChainRunner({
    rootPath: './src',
    parallel: true,
    maxConcurrency: 4,
    dryRun: false,
    backup: true,
    fileTypes: ['js', 'ts', 'jsx', 'tsx', 'py'],
    excludeDirs: ['node_modules', '.git', 'dist'],
    excludeFiles: ['*.min.js', '*.cache']
});

await runner.run();
```

## 📋 Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Run without making actual changes | `false` |
| `--no-backup` | Skip creating backup | `false` |
| `--parallel` | Process files in parallel | `false` |
| `--verbose` | Enable verbose logging | `false` |
| `--root <path>` | Root directory to process | Current directory |
| `--output <path>` | Output directory for reports | `./` |
| `--max-concurrency <n>` | Maximum parallel processes | `3` |
| `--help` | Show help information | - |

## 🔧 Configuration

Create a custom `agent-chain-config.json` file:

```json
{
  "name": "Agent Chain Configuration",
  "rootPath": ".",
  "exclude": ["node_modules", ".git", "dist"],
  "fileTypes": ["js", "ts", "jsx", "tsx", "py"],
  "agents": {
    "rebasing": {
      "enabled": true,
      "rules": {
        "imports": { "sort": true, "removeUnused": true },
        "codeStyle": { "removeConsoleLogs": true }
      }
    },
    "reorganization": {
      "enabled": true,
      "targetStructure": {
        "directories": [
          "src/components",
          "src/services",
          "src/utils"
        ]
      }
    },
    "performance": {
      "enabled": true,
      "focus": ["loops", "arrays", "functions"]
    }
  }
}
```

## 📖 Example Usage Scenarios

### 1. Frontend Project Optimization
```javascript
const config = {
    rootPath: './src',
    fileTypes: ['js', 'jsx', 'ts', 'tsx', 'vue', 'css', 'scss'],
    parallel: true,
    maxConcurrency: 4,
    performanceFocus: ['dom', 'memory', 'bundle-size']
};

const runner = new AgentChainRunner(config);
await runner.run();
```

### 2. Python Project Cleanup
```javascript
const config = {
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
};

const runner = new AgentChainRunner(config);
await runner.run();
```

### 3. Just Performance Optimization
```javascript
// Load individual agent
const PerformanceOptimizationAgent = require('./agents/performance-optimization-agent.js');

const config = {
    rootPath: './src',
    fileTypes: ['js', 'ts', 'jsx', 'tsx'],
    parallel: true
};

const optimizer = new PerformanceOptimizationAgent(config);
await optimizer.processFiles(files);
```

### 4. Custom Agent Chain
```javascript
// Use the example script
const { configurations } = require('./example-usage.js');

// Use predefined configurations
const runner = new AgentChainRunner(configurations.frontend);
await runner.run();
```

## 📊 Output and Reporting

The system generates comprehensive reports in JSON format:

```json
{
  "timestamp": "2025-01-18T12:00:00.000Z",
  "summary": {
    "totalProcessed": 45,
    "totalErrors": 2,
    "totalChanges": 23
  },
  "results": {
    "rebasing": {
      "processed": 45,
      "errors": 0,
      "changes": [
        {
          "type": "import_optimization",
          "description": "Optimized imports in component file",
          "file": "src/components/Header.jsx"
        }
      ]
    },
    "reorganization": {
      "processed": 45,
      "errors": 0,
      "changes": [
        {
          "from": "src/component/Header.jsx",
          "to": "src/components/Header.jsx",
          "category": "component"
        }
      ]
    },
    "performance": {
      "processed": 45,
      "errors": 2,
      "improvements": [
        {
          "type": "loop_optimization",
          "description": "Optimized for loop by caching array length",
          "file": "src/utils/arrayHelpers.js"
        }
      ]
    }
  },
  "stats": {
    "filesScanned": 156,
    "filesModified": 23,
    "totalLines": 12450
  }
}
```

## 🎯 Individual Agents

### Code Rebasing Agent
- **Import/Export Optimization**: Sort, group, and remove unused imports
- **Code Style Standardization**: Consistent formatting, semicolons, spacing
- **Function Refactoring**: Convert to arrow functions, optimize declarations
- **Dead Code Removal**: Remove console logs, unused variables, dead functions

### Code Reorganization Agent
- **Structure Analysis**: Analyze directory depth and file distribution
- **Dependency Mapping**: Map internal and external dependencies
- **File Categorization**: Categorize files by type and purpose
- **Directory Optimization**: Suggest and implement improved folder structure

### Performance Optimization Agent
- **Loop Optimization**: Cache array lengths, optimize iterations
- **Array Operations**: Replace inefficient array methods
- **Memory Usage**: Optimize object creation, use weak references
- **Async Operations**: Batch operations, remove unnecessary awaits
- **DOM Operations**: Batch manipulations, cache queries

## 🔧 Advanced Features

### Parallel Processing
- **Concurrency Control**: Configure maximum parallel processes
- **Batch Processing**: Group files for optimal resource usage
- **Error Handling**: Robust error handling with detailed reporting

### Backup and Safety
- **Automatic Backups**: Create timestamped backups before changes
- **Dry Run Mode**: Preview changes without applying them
- **Rollback Capability**: Restore from backup if needed

### Extensibility
- **Modular Agents**: Easy to add new optimization agents
- **Custom Rules**: Define project-specific optimization rules
- **Plugin Architecture**: Add custom analysis and transformation logic

## 🎯 Reusability

The system is designed to be highly reusable across different projects:

### Cross-Language Support
- Works with JavaScript, TypeScript, Python, Java, C#, Go, and Rust
- Language-specific optimizations for each type
- Consistent API across all agents

### Project-Agnostic
- Automatically detects project structure
- Adapts to different coding styles and patterns
- Handles various project sizes and complexities

### Integration Ready
- Easy to integrate into CI/CD pipelines
- Compatible with existing build systems
- Scriptable for custom workflows

## 🐛 Error Handling

The system includes comprehensive error handling:

- **Graceful Degradation**: Continue processing when individual files fail
- **Detailed Logging**: Log errors with file context and details
- **Recovery Mechanisms**: Retry failed operations where appropriate
- **Fallback Options**: Use alternative strategies when primary methods fail

## 📈 Monitoring and Metrics

### Performance Metrics
- Files processed and modified
- Lines of code changed
- Complexity reduction
- Improvement percentages

### Detailed Reporting
- Before/after comparison
- Change categorization
- Recommendation generation
- Statistical summaries

## 🛠️ Best Practices

### Before Running
- **Create backups**: Always backup before major changes
- **Review Changes**: Understand what will be modified
- **Test Incrementally**: Run on small subsets first

### During Processing
- **Monitor Progress**: Watch logs for issues
- **Check Results**: Verify optimizations work as expected
- **Test Thoroughly**: Run tests after changes

### After Processing
- **Review Changes**: Ensure no functionality is broken
- **Performance Testing**: Measure actual performance gains
- **Rollback if Needed**: Use backups if issues arise

## 🤝 Contributing

### Adding New Agents
1. Create a new agent class in the `agents/` directory
2. Implement the required methods: `processFile()`, `getStats()`
3. Add the agent to the main runner configuration
4. Add tests and documentation

### Custom Rules
1. Define rule configurations in the agent class
2. Implement rule detection and application logic
3. Add configuration options to the main config schema
4. Document the rule purpose and usage

### Testing
1. Add unit tests for agent logic
2. Test with various file types and scenarios
3. Verify edge cases and error conditions
4. Integration test with the full agent chain

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests for bug fixes, new features, or improvements.

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check the documentation and examples
- Review existing issues and pull requests