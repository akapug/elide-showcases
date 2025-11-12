# Contributing to Elide Build

Thank you for your interest in contributing to Elide Build! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/elide-dev/elide-showcases.git
cd elide-showcases/tools/elide-build
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

5. Start development mode:
```bash
npm run dev
```

## Project Structure

```
elide-build/
├── bundler/          # Module bundler with tree shaking and code splitting
├── compiler/         # Multi-language compiler (TS, JS, Python, Ruby)
├── optimizer/        # Minification and optimization
├── dev-server/       # Development server with HMR
├── production/       # Production build utilities
├── plugins/          # Plugin system and built-in plugins
├── config/           # Configuration system
├── cli/              # Command-line interface
├── examples/         # Example projects
├── benchmarks/       # Performance benchmarks
└── README.md         # Documentation
```

## Development Workflow

### Making Changes

1. Create a new branch:
```bash
git checkout -b feature/my-feature
```

2. Make your changes following our coding standards

3. Write or update tests

4. Run the test suite:
```bash
npm test
```

5. Lint your code:
```bash
npm run lint
```

6. Format your code:
```bash
npm run format
```

### Commit Messages

Follow the conventional commits specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add support for CSS modules
fix: resolve circular dependency in module graph
docs: update README with new configuration options
perf: optimize tree shaking algorithm
```

### Testing

We use Jest for testing. Write tests for all new features and bug fixes.

**Test structure:**
```typescript
describe('MyFeature', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

**Running tests:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- bundler.test.ts
```

### Benchmarking

Run benchmarks to ensure performance improvements:

```bash
npm run benchmark
```

Compare results before and after your changes.

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Provide type annotations for public APIs
- Use interfaces for object shapes
- Avoid `any` type unless absolutely necessary

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix

# Format code
npm run format
```

**Style guidelines:**
- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Use single quotes for strings
- Add semicolons
- Use arrow functions for callbacks
- Prefer `const` over `let`
- Use template literals for string interpolation

### Documentation

- Add JSDoc comments to public APIs
- Include parameter descriptions and return types
- Provide usage examples
- Update README.md when adding features

**JSDoc example:**
```typescript
/**
 * Compiles TypeScript code to JavaScript
 *
 * @param code - The TypeScript source code
 * @param filename - The filename for source maps
 * @returns Compiled JavaScript code with optional source map
 *
 * @example
 * ```typescript
 * const result = await compiler.compile('const x: number = 5', 'test.ts');
 * console.log(result.code);
 * ```
 */
async compile(code: string, filename: string): Promise<CompileResult>
```

## Pull Request Process

1. **Update documentation** - Update README and other docs as needed

2. **Add tests** - Ensure test coverage for new code

3. **Run checks** - All tests and linting must pass

4. **Update CHANGELOG** - Add entry describing your changes

5. **Create PR** - Submit pull request with clear description

6. **Code review** - Address feedback from reviewers

7. **Merge** - PR will be merged after approval

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] All tests passing
- [ ] Code linted and formatted
```

## Adding New Features

### Adding a New Plugin

1. Create plugin file in `plugins/`:
```typescript
// plugins/my-plugin.ts
import { Plugin } from './index';

export interface MyPluginOptions {
  option1?: string;
}

export function myPlugin(options: MyPluginOptions = {}): Plugin {
  return {
    name: 'my-plugin',

    async setup(build) {
      build.onLoad({ filter: /\.custom$/ }, async (args) => {
        // Plugin logic
        return { contents: '...' };
      });
    },
  };
}
```

2. Export from `plugins/index.ts`:
```typescript
export * from './my-plugin';
```

3. Add tests:
```typescript
// plugins/my-plugin.test.ts
describe('myPlugin', () => {
  it('should process .custom files', async () => {
    // Test implementation
  });
});
```

4. Update documentation:
```markdown
## My Plugin

Description of plugin...

### Usage
```typescript
import { myPlugin } from '@elide/build/plugins';

export default defineConfig({
  plugins: [myPlugin({ option1: 'value' })],
});
\`\`\`
```

### Adding a New Preset

1. Add preset to `config/index.ts`:
```typescript
const presets: Record<string, ElideConfig> = {
  // ... existing presets
  myPreset: {
    bundle: {
      // Configuration
    },
  },
};
```

2. Document the preset in README

3. Create example project using preset

## Performance Guidelines

- **Avoid blocking operations** - Use async/await for I/O
- **Cache aggressively** - Implement caching for expensive operations
- **Parallelize when possible** - Use Promise.all for independent tasks
- **Profile regularly** - Run benchmarks to catch regressions
- **Optimize hot paths** - Focus on code that runs frequently

### Performance Checklist

- [ ] No blocking synchronous operations in hot paths
- [ ] Caching implemented for repeated operations
- [ ] Parallel processing used where applicable
- [ ] Memory usage is reasonable
- [ ] Benchmarks show improvement or no regression

## Documentation

### Writing Good Documentation

- **Be clear and concise** - Use simple language
- **Provide examples** - Show code examples for every feature
- **Use headings** - Organize content with clear hierarchy
- **Link related content** - Cross-reference related documentation
- **Keep it updated** - Update docs when code changes

### Documentation Structure

- **README.md** - Main documentation with quick start and features
- **API.md** - Detailed API reference
- **CONTRIBUTING.md** - This file
- **CHANGELOG.md** - Version history and changes

## Releases

Releases are managed by project maintainers. The process:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm
5. Create GitHub release

## Getting Help

- **Issues** - Report bugs or request features
- **Discussions** - Ask questions or discuss ideas
- **Discord** - Join our community chat
- **Email** - Contact maintainers directly

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## License

By contributing to Elide Build, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Elide Build! 🚀
