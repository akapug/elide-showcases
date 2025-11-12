# Elide DX - Developer Experience Tools

Production-ready developer experience toolkit for Elide runtime. Comprehensive set of tools for debugging, testing, profiling, and code quality.

## Features

### 🐛 Interactive Debugger
- Chrome DevTools Protocol integration
- Breakpoints (line, conditional, logpoints)
- Step debugging (in, out, over)
- Variable inspection and watch expressions
- Call stack navigation
- Multi-language debugging (TypeScript, Python, Java)
- Source map support
- Remote debugging capabilities

### 💻 REPL (Read-Eval-Print Loop)
- Interactive shell for multiple languages
- Code completion and syntax highlighting
- Command history management
- Multi-line editing support
- Import/require module support
- Async/await support
- Pretty printing of results
- Session history export

### 🔍 Runtime Inspector
- Heap snapshot analysis
- Memory profiling and leak detection
- CPU profiling
- Event loop monitoring
- Network request inspection
- Performance timeline tracking
- Snapshot comparison
- GC analysis

### ⚡ Performance Profiler
- CPU profiling with flame graphs
- Memory allocation tracking
- Event tracing
- Async operation tracking
- Frame timing analysis
- Bundle size analysis
- Startup time profiling
- Profile export (Chrome/Firefox format)

### 🧪 Testing Framework
- Fast, Jest-compatible test runner
- Snapshot testing
- Code coverage reporting
- Watch mode
- Parallel test execution
- Comprehensive mocking utilities
- Multi-language test support

### ✨ Code Quality Tools
- **Linter**: ESLint-compatible linting
- **Formatter**: Prettier-compatible formatting
- **Type Checker**: TypeScript type checking
- Dead code detection
- Complexity analysis

### 📚 Documentation Generator
- Generate docs from JSDoc/TSDoc
- Python docstring support
- Multiple output formats (Markdown, HTML, JSON)
- API reference generation
- Examples extraction

### 🛠️ Unified CLI
Single command-line interface for all tools

## Installation

```bash
npm install -g @elide/dx
```

Or use with npx:

```bash
npx @elide/dx <command>
```

## Quick Start

### Debug Your Application

```bash
# Start debugger
elide debug --port 9229

# Debug with breakpoint on start
elide debug --inspect-brk
```

Then open Chrome DevTools and connect to the debug session.

### Interactive REPL

```bash
# TypeScript REPL
elide repl

# Python REPL
elide repl --language python

# Ruby REPL
elide repl --language ruby
```

REPL Commands:
- `.help` - Show help
- `.clear` - Clear screen
- `.exit` - Exit REPL
- `.history` - Show command history
- `.save <file>` - Save session history

### Runtime Inspection

```bash
# Take heap snapshot
elide inspect --heap

# Profile CPU
elide inspect --cpu

# Profile memory
elide inspect --memory

# Detect memory leaks
elide inspect --leaks
```

### Performance Profiling

```bash
# Profile for 10 seconds
elide profile --duration 10000

# Generate flame graph
elide profile --flame

# Export to Chrome DevTools format
elide profile --format chrome --output profile.json
```

### Run Tests

```bash
# Run all tests
elide test

# Run with coverage
elide test --coverage

# Watch mode
elide test --watch

# Parallel execution
elide test --parallel
```

### Code Quality

```bash
# Lint code
elide lint

# Auto-fix issues
elide lint --fix

# Format code
elide format

# Check formatting without writing
elide format --check

# Type check
elide typecheck
```

### Generate Documentation

```bash
# Generate Markdown docs
elide docs --input src --output docs

# Generate HTML docs
elide docs --format html

# Generate JSON API reference
elide docs --format json
```

## Configuration

### Debugger Configuration

Create `.elide-debug.json`:

```json
{
  "port": 9229,
  "host": "127.0.0.1",
  "sourceMaps": true,
  "pauseOnExceptions": false,
  "pauseOnUncaughtExceptions": true,
  "skipFiles": ["node_modules/**"]
}
```

### Test Configuration

Create `.elide-test.json`:

```json
{
  "testMatch": ["**/*.test.ts", "**/*.spec.ts"],
  "testIgnore": ["**/node_modules/**"],
  "parallel": true,
  "maxWorkers": 4,
  "coverage": true,
  "coverageThreshold": {
    "lines": 80,
    "functions": 80,
    "branches": 80,
    "statements": 80
  }
}
```

### Linter Configuration

Create `.elide-lint.json`:

```json
{
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "no-undef": "error",
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "indent": ["error", 2],
    "no-var": "error",
    "eqeqeq": "error"
  },
  "ignorePatterns": ["dist/**", "node_modules/**"]
}
```

### Formatter Configuration

Create `.elide-format.json`:

```json
{
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

## IDE Integration

### VS Code

Install the Elide DX extension:

```bash
code --install-extension elide.elide-dx
```

Features:
- Inline debugging
- REPL integration
- Test runner integration
- Code actions for linting
- Format on save

Configuration in `.vscode/settings.json`:

```json
{
  "elide.debug.autoAttach": true,
  "elide.test.autoRun": true,
  "elide.format.enable": true,
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "elide.elide-dx"
  }
}
```

### IntelliJ IDEA

Install the Elide DX plugin from JetBrains Marketplace.

Features:
- Debug configurations
- Run/Debug test configurations
- Integrated code inspections
- Quick fixes and refactorings

Configuration:
1. Open Settings → Languages & Frameworks → Elide
2. Configure tool paths and options
3. Enable inspections in Settings → Editor → Inspections → Elide

### Vim/Neovim

Install via your plugin manager:

```vim
Plug 'elide/elide-dx.nvim'
```

Configuration:

```lua
require('elide-dx').setup({
  debugger = { enabled = true },
  linter = { enabled = true, auto_fix = true },
  formatter = { enabled = true, format_on_save = true }
})
```

## API Reference

### Debugger API

```typescript
import ElideDebugger from '@elide/dx/debugger';

const debugger = new ElideDebugger({
  port: 9229,
  sourceMaps: true
});

await debugger.connect();

// Set breakpoint
await debugger.setBreakpoint('script_1', 42);

// Set conditional breakpoint
await debugger.setBreakpoint('script_1', 50, 0, 'x > 10');

// Set logpoint
await debugger.setLogpoint('script_1', 60, 'Value: {x}');

// Step debugging
await debugger.stepInto();
await debugger.stepOver();
await debugger.stepOut();

// Evaluate expression
const result = await debugger.evaluate('x + y');

// Watch expression
const watchId = debugger.addWatchExpression('myVariable');
```

### REPL API

```typescript
import ElideREPL from '@elide/dx/repl';

const repl = new ElideREPL({
  language: 'typescript',
  multiline: true
});

await repl.start();

// Evaluate code
const result = await repl.evaluate('2 + 2');

// Get completions
const completions = repl.complete('console.');

// Navigate history
const previous = repl.navigateHistory('up');
```

### Inspector API

```typescript
import ElideInspector from '@elide/dx/inspector';

const inspector = new ElideInspector();
await inspector.start();

// Take heap snapshot
const snapshot = await inspector.takeHeapSnapshot();

// Compare snapshots
const comparison = inspector.compareSnapshots(id1, id2);

// Detect leaks
const leaks = await inspector.detectLeaks();

// Profile memory
await inspector.startMemoryProfiling();
// ... run code ...
const profile = await inspector.stopMemoryProfiling();

// Profile CPU
await inspector.startCPUProfiling();
// ... run code ...
const cpuProfile = await inspector.stopCPUProfiling();
```

### Profiler API

```typescript
import ElideProfiler from '@elide/dx/profiler';

const profiler = new ElideProfiler({
  sampleInterval: 1000,
  trackAllocations: true
});

await profiler.start();
// ... run code to profile ...
const result = await profiler.stop();

// Generate flame graph
const flameGraph = profiler.buildFlameGraph();

// Export profile
const chromeProfile = profiler.exportProfile('chrome');
```

### Test Runner API

```typescript
import ElideTestRunner from '@elide/dx/testing';

const runner = new ElideTestRunner({
  parallel: true,
  coverage: true
});

runner.describe('My Suite', () => {
  runner.beforeAll(async () => {
    // Setup
  });

  runner.test('should work', async () => {
    const result = await someFunction();
    runner.expect(result).toBe(42);
  });

  runner.afterAll(async () => {
    // Cleanup
  });
});

const results = await runner.run();
```

## Performance Tips

### Debugger
- Use conditional breakpoints sparingly (they can slow execution)
- Disable source maps in production for better performance
- Use logpoints instead of console.log statements

### Profiler
- Use appropriate sample intervals (1ms default is good for most cases)
- Profile production builds for accurate results
- Focus on hotspots (>5% of total time)

### Testing
- Use parallel execution for large test suites
- Mock expensive operations (network, file I/O)
- Run tests in watch mode during development
- Use selective test execution (only/skip)

### Code Quality
- Enable fix-on-save in your editor
- Run linting in pre-commit hooks
- Use strict type checking for better code quality
- Configure coverage thresholds to maintain quality

## Troubleshooting

### Debugger won't connect

```bash
# Check if port is available
lsof -i :9229

# Try different port
elide debug --port 9230

# Check firewall settings
```

### REPL history not saving

```bash
# Check file permissions
ls -la .elide_repl_history

# Specify different location
elide repl --history ~/.elide_history
```

### Tests running slowly

```bash
# Increase max workers
elide test --parallel --max-workers 8

# Disable coverage during development
elide test --no-coverage
```

### Memory profiling crashes

```bash
# Reduce sample frequency
elide inspect --memory --interval 100

# Increase heap size
NODE_OPTIONS="--max-old-space-size=4096" elide inspect --memory
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/elide/elide-dx.git
cd elide-dx

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Documentation: https://elide.dev/docs/dx
- Issues: https://github.com/elide/elide-dx/issues
- Discord: https://discord.gg/elide
- Twitter: [@elideframework](https://twitter.com/elideframework)

## Acknowledgments

Inspired by and compatible with:
- Chrome DevTools Protocol
- Jest testing framework
- ESLint linting
- Prettier formatting
- TypeScript compiler

Built with ❤️ for the Elide community.
