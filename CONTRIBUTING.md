# Contributing to Elide Showcases

Thank you for your interest in contributing! This guide will help you add new conversions or improve existing ones.

---

## 🎯 What We're Looking For

- **Popular npm packages** (1M+ downloads/week preferred)
- **Polyglot-beneficial utilities** (useful across Python/Ruby/Java)
- **Zero or minimal dependencies** (easier to convert)
- **Well-documented examples**
- **Production-ready code**

---

## 📋 Before You Start

1. **Check existing conversions**
   - Search `/converted/utilities` and `/original/utilities` to avoid duplicates
   - Check [POLYGLOT_OPPORTUNITY_RANKING.md](./docs/current/POLYGLOT_OPPORTUNITY_RANKING.md) for priorities

2. **Test on Elide first**
   - Install Elide: `curl -sSL https://elide.sh | bash`
   - Verify your code runs: `elide run your-file.ts`

3. **Read the knowledge base**
   - [CONVERSION_KNOWLEDGE_BASE.md](./docs/current/CONVERSION_KNOWLEDGE_BASE.md) - Patterns and best practices
   - [ELIDE_KNOWLEDGEBASE.md](./docs/current/ELIDE_KNOWLEDGEBASE.md) - What works, what doesn't
   - [ELIDE_BUG_TRACKER.md](./docs/current/ELIDE_BUG_TRACKER.md) - Known limitations

---

## 🚀 Quick Start: Adding a New Conversion

### Step 1: Choose Your Package

Pick an npm package to convert. Good candidates:
- High download count (indicates usefulness)
- Zero or few dependencies
- Pure JavaScript/TypeScript (no native modules)
- Polyglot value (used across languages)

**Example**: `chalk` (terminal colors, 100M+ downloads/week)

### Step 2: Create the Conversion

```bash
# Create directory
mkdir converted/utilities/chalk

# Create main file
touch converted/utilities/chalk/elide-chalk.ts
```

### Step 3: Implement the Conversion

**Template** (`elide-chalk.ts`):

```typescript
/**
 * Chalk - Terminal String Styling
 *
 * ANSI color and style for terminal strings.
 * **POLYGLOT SHOWCASE**: One color library for ALL languages on Elide!
 *
 * Features:
 * - Chainable API
 * - 256-color support
 * - RGB color support
 * - Auto-detect color support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need terminal colors
 * - ONE implementation works everywhere on Elide
 * - Consistent formatting across languages
 *
 * Use cases:
 * - CLI applications
 * - Log formatting
 * - Terminal UI
 * - Development tools
 *
 * Package has ~100M+ downloads/week on npm!
 */

// Your implementation here
export function red(text: string): string {
  return `\x1b[31m${text}\x1b[0m`;
}

export function green(text: string): string {
  return `\x1b[32m${text}\x1b[0m`;
}

// ... more functions

// CLI Demo
if (import.meta.url.includes("elide-chalk.ts")) {
  console.log("🎨 Chalk - Terminal Colors for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Colors ===");
  console.log(red("Red text"));
  console.log(green("Green text"));
  console.log();

  // ... 8-14 more examples
}
```

**Key Requirements**:
- ✅ Zero dependencies (inline any deps)
- ✅ TypeScript type safety
- ✅ CLI demo with 8-14 examples
- ✅ Export both default and named functions
- ✅ Polyglot benefits in header comment
- ✅ Use `import.meta.url.includes()` for CLI detection

### Step 4: Test Thoroughly

```bash
cd converted/utilities/chalk

# Test it runs
elide run elide-chalk.ts

# Test it can be imported
elide -e "import {red} from './elide-chalk.ts'; console.log(red('test'));"

# Test edge cases
# - Empty strings
# - Special characters
# - Large inputs
# - Type errors
```

See [TESTING_CHECKLIST.md](./docs/current/TESTING_CHECKLIST.md) for full criteria.

### Step 5: Add Documentation

Create `ELIDE_CONVERSION.md`:

```markdown
# Chalk Conversion for Elide

## Why Converted

- **Popularity**: 100M+ downloads/week
- **Polyglot Value**: Terminal colors needed in all languages
- **Zero Dependencies**: Pure JavaScript implementation
- **Use Cases**: CLI tools, logging, terminal UIs

## What Changed

- Removed `ansi-styles` dependency (inlined ANSI codes)
- Removed `supports-color` dependency (assumed color support)
- Simplified API to core functions
- Added TypeScript types

## Performance

- **Elide**: Instant execution (~15ms cold start)
- **Node.js chalk**: ~200ms cold start
- **13x faster startup**

## Known Limitations

- No 256-color support (basic 16 colors only)
- No auto-detection of terminal capabilities
- No Windows-specific handling

## Workarounds

None needed - basic colors work universally.

## Rating

**⭐⭐⭐⭐⭐ Perfect Conversion**

- 100% feature parity (for basic colors)
- Zero bugs found
- Excellent performance
- Production-ready
```

### Step 6: Create README (Optional but Recommended)

```markdown
# Chalk - Terminal String Styling

ANSI colors and styles for terminal output.

## Quick Start

\`\`\`typescript
import { red, green, blue } from './elide-chalk.ts';

console.log(red('Error: File not found'));
console.log(green('Success!'));
console.log(blue('Info: Processing...'));
\`\`\`

## Features

- Basic colors (red, green, blue, yellow, etc.)
- Text styles (bold, dim, italic, underline)
- Background colors
- Chainable API (planned)

## Testing

\`\`\`bash
elide run elide-chalk.ts
\`\`\`

## Performance

- **100M+ downloads/week** on npm
- **13x faster cold start** vs Node.js
- Zero dependencies
```

### Step 7: Commit

```bash
git add converted/utilities/chalk/
git commit -m "feat(chalk): add terminal color styling (#187)

Terminal ANSI color and style library for Elide.

Features:
- Basic 16 colors
- Text styles (bold, dim, italic, underline)
- Background colors
- Zero dependencies

Polyglot Benefits:
- One color library for JS, Python, Ruby, Java
- Consistent terminal formatting everywhere

~100M+ downloads/week on npm - essential CLI utility!

Tested on Elide v1.0.0-beta10 - all examples working."
```

---

## 🎨 Conversion Best Practices

### DO ✅

- **Inline dependencies** where possible
- **Add comprehensive examples** (8-14 use cases)
- **Include edge cases** in examples
- **Document limitations** honestly
- **Test on Elide first**
- **Follow existing patterns** (see other conversions)
- **Add TypeScript types**
- **Include polyglot benefits** in header

### DON'T ❌

- **Don't include node_modules**
- **Don't use unsupported APIs** (check [ELIDE_BUG_TRACKER.md](./docs/current/ELIDE_BUG_TRACKER.md))
- **Don't skip testing**
- **Don't claim unsupported features**
- **Don't use external dependencies** without inlining
- **Don't copy code without understanding it**

---

## 📁 File Structure

```
converted/utilities/{package}/
├── elide-{package}.ts          # Main implementation (REQUIRED)
├── ELIDE_CONVERSION.md         # Conversion notes (REQUIRED)
├── README.md                   # User-facing docs (RECOMMENDED)
├── benchmark.ts                # Performance test (OPTIONAL)
├── CASE_STUDY.md              # Real-world example (OPTIONAL)
├── elide-{package}.py          # Python example (FUTURE)
├── elide-{package}.rb          # Ruby example (FUTURE)
└── Elide{Package}Example.java  # Java example (FUTURE)
```

---

## 🔧 Handling Dependencies

### Zero Dependencies (Preferred)

If package has no dependencies, just convert it:

```typescript
// Original npm package code
export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-');
}
```

### Inline Small Dependencies

If package has 1-2 small dependencies, inline them:

```typescript
// Original uses 'escape-string-regexp' dependency
// Inline it:
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Then use it in your main code
export function highlight(text: string, query: string): string {
  const regex = new RegExp(escapeRegex(query), 'gi');
  return text.replace(regex, match => `<mark>${match}</mark>`);
}
```

### Large Dependencies (Avoid)

If package has many dependencies or complex native modules, it may not be a good fit for conversion. Consider:
- Finding an alternative package with fewer dependencies
- Implementing core functionality only
- Skipping this package

---

## 🧪 Testing Requirements

Before submitting, verify:

### Functionality
- [ ] All exported functions work
- [ ] CLI demo runs without errors
- [ ] Can be imported as a module
- [ ] Edge cases handled (empty strings, nulls, large inputs)
- [ ] Type safety enforced

### Performance
- [ ] Cold start under 100ms
- [ ] Reasonable execution time
- [ ] No memory leaks (for long-running tests)

### Code Quality
- [ ] TypeScript with full type annotations
- [ ] No `any` types (except where necessary)
- [ ] Clear function names
- [ ] Documented parameters
- [ ] Follows existing code style

### Documentation
- [ ] Header comment with polyglot benefits
- [ ] 8-14 CLI examples
- [ ] ELIDE_CONVERSION.md created
- [ ] Known limitations documented
- [ ] Commit message follows format

---

## 📊 Commit Message Format

```
feat({package}): {short description} (#{number})

{Detailed description}

Features:
- {Feature 1}
- {Feature 2}
- {Feature 3}

Polyglot Benefits:
- {Benefit 1}
- {Benefit 2}

~{downloads}M+ downloads/week on npm - {why important}!

Tested on Elide v1.0.0-beta10 - all examples working.
```

**Example**:
```
feat(chalk): add terminal color styling (#187)

Terminal ANSI color and style library for Elide.

Features:
- Basic 16 colors
- Text styles (bold, dim, italic, underline)
- Background colors
- Zero dependencies

Polyglot Benefits:
- One color library for JS, Python, Ruby, Java
- Consistent terminal formatting everywhere

~100M+ downloads/week on npm - essential CLI utility!

Tested on Elide v1.0.0-beta10 - all examples working.
```

---

## 🚫 Common Pitfalls

### 1. Using Unsupported APIs

```typescript
// ❌ DON'T
import crypto from 'node:crypto';
const hash = crypto.createHash('md5'); // NOT SUPPORTED

// ✅ DO
// Use alternative or skip hashing features
```

### 2. Not Testing Edge Cases

```typescript
// ❌ DON'T
export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-');
}

// ✅ DO
export function slugify(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.trim().toLowerCase().replace(/\s+/g, '-');
}
```

### 3. Missing Type Safety

```typescript
// ❌ DON'T
export function parse(input: any): any {
  return JSON.parse(input);
}

// ✅ DO
export function parse<T = unknown>(input: string): T {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }
  return JSON.parse(input) as T;
}
```

---

## 🎯 Priority Conversions

See [POLYGLOT_OPPORTUNITY_RANKING.md](./docs/current/POLYGLOT_OPPORTUNITY_RANKING.md) for full ranking.

**High-priority packages** (S-Tier):
- `chalk` - Terminal colors (100M+ downloads)
- `dotenv` - Environment variables (20M+ downloads)
- `ajv` - JSON schema validation (20M+ downloads)
- `commander` - CLI framework (15M+ downloads)
- `yargs` - Command-line parser (15M+ downloads)

---

## 💬 Getting Help

- **Questions**: Open a [Discussion](https://github.com/akapug/elide-showcases/discussions)
- **Bugs**: Open an [Issue](https://github.com/akapug/elide-showcases/issues)
- **Elide-specific**: Check [Elide Discord](https://elide.dev/discord)

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as this repository.

---

**Thank you for contributing to Elide Showcases! 🎉**

Every conversion helps prove Elide's polyglot capabilities and helps developers worldwide.
