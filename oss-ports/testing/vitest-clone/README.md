# Vitest Clone - Vite-Native Testing Framework

A blazing fast, Vite-native testing framework for Elide with first-class TypeScript and ESM support.

## Features

- **⚡ Lightning Fast**: Powered by Elide's high-performance runtime
- **🔥 Vite-Native**: Seamless integration with Vite's config and plugins
- **📦 ESM First**: Native ES modules support out of the box
- **🎯 Jest Compatible**: Use familiar Jest APIs
- **🎨 UI Mode**: Beautiful web-based test UI
- **👀 Watch Mode**: Smart and fast file watching
- **📸 Snapshot Testing**: Built-in snapshot support
- **🔍 In-Source Testing**: Write tests next to your code
- **⚙️ TypeScript**: First-class TypeScript support with zero config
- **🌐 Browser Mode**: Run tests in actual browsers

## Installation

```bash
elide install @elide/vitest-clone
```

## Quick Start

```typescript
// sum.ts
export function sum(a: number, b: number): number {
  return a + b;
}
```

```typescript
// sum.test.ts
import { describe, it, expect } from '@elide/vitest-clone';
import { sum } from './sum';

describe('sum', () => {
  it('adds two numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
```

## Running Tests

```bash
# Run all tests
elide vitest

# Run in watch mode
elide vitest --watch

# Run with UI
elide vitest --ui

# Run specific file
elide vitest src/sum.test.ts

# Run in browser mode
elide vitest --browser
```

## Configuration

Create a `vitest.config.ts` file:

```typescript
import { defineConfig } from '@elide/vitest-clone';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'jsdom', 'happy-dom'
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts']
    },
    testTimeout: 5000,
    hookTimeout: 10000,
    threads: true,
    maxThreads: 4,
    minThreads: 1
  }
});
```

## Vite Integration

Vitest Clone shares your Vite configuration:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    // Vitest config here
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  plugins: [
    // Your Vite plugins work in tests too!
  ]
});
```

## API

### Test Definition

```typescript
import { describe, it, test, expect } from '@elide/vitest-clone';

describe('test suite', () => {
  it('test case', () => {
    expect(1 + 1).toBe(2);
  });

  test('another test', () => {
    expect(true).toBeTruthy();
  });

  it.skip('skipped test', () => {
    // This won't run
  });

  it.only('focused test', () => {
    // Only this test will run
  });

  it.todo('write this test later');
});
```

### Hooks

```typescript
import { beforeAll, beforeEach, afterEach, afterAll } from '@elide/vitest-clone';

beforeAll(async () => {
  // Runs once before all tests
  await setupDatabase();
});

beforeEach(() => {
  // Runs before each test
  mockClear();
});

afterEach(() => {
  // Runs after each test
  cleanupMocks();
});

afterAll(async () => {
  // Runs once after all tests
  await teardownDatabase();
});
```

### Matchers

```typescript
// Equality
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toStrictEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeGreaterThanOrEqual(3);
expect(number).toBeLessThan(5);
expect(number).toBeLessThanOrEqual(5);
expect(number).toBeCloseTo(0.3, 2);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(array).toContainEqual(obj);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Errors
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(error);
```

### Mocking

```typescript
import { vi } from '@elide/vitest-clone';

// Mock functions
const fn = vi.fn();
fn('arg');
expect(fn).toHaveBeenCalledWith('arg');

// Mock implementations
const multiply = vi.fn((a, b) => a * b);
expect(multiply(2, 3)).toBe(6);

// Mock return values
fn.mockReturnValue(42);
fn.mockReturnValueOnce(1).mockReturnValueOnce(2);

// Mock resolved/rejected values
fn.mockResolvedValue(result);
fn.mockRejectedValue(error);

// Spy on objects
const spy = vi.spyOn(object, 'method');
spy.mockImplementation(() => 'mocked');

// Mock modules
vi.mock('./module', () => ({
  default: vi.fn(),
  namedExport: vi.fn()
}));

// Timer mocks
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.runAllTimers();
vi.useRealTimers();
```

## In-Source Testing

Write tests directly in your source files:

```typescript
// src/utils.ts
export function multiply(a: number, b: number): number {
  return a * b;
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it('multiplies numbers', () => {
    expect(multiply(2, 3)).toBe(6);
  });
}
```

Enable in config:

```typescript
export default defineConfig({
  test: {
    includeSource: ['src/**/*.ts']
  }
});
```

## Browser Mode

Run tests in real browsers:

```bash
elide vitest --browser
```

```typescript
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: 'chrome', // or 'firefox', 'safari', 'edge'
      headless: true
    }
  }
});
```

## UI Mode

Launch the interactive test UI:

```bash
elide vitest --ui
```

Features:
- Visual test runner with real-time updates
- Filter and search tests
- View test output and errors
- Coverage visualization
- Watch mode integration

## Coverage

```bash
# Collect coverage
elide vitest --coverage

# Configure coverage
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts'],
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
});
```

## Snapshot Testing

```typescript
it('matches snapshot', () => {
  const data = { name: 'John', age: 30 };
  expect(data).toMatchSnapshot();
});

// Update snapshots
elide vitest -u
```

## Concurrent Tests

```typescript
import { describe, it } from '@elide/vitest-clone';

describe.concurrent('parallel suite', () => {
  it.concurrent('test 1', async () => {
    // Runs in parallel with other concurrent tests
  });

  it.concurrent('test 2', async () => {
    // Runs in parallel
  });
});
```

## Benchmarking

```typescript
import { bench, describe } from '@elide/vitest-clone';

describe('performance', () => {
  bench('sort', () => {
    const arr = Array.from({ length: 1000 }, () => Math.random());
    arr.sort();
  });

  bench('filter + map', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    arr.filter(x => x % 2 === 0).map(x => x * 2);
  });
});
```

## TypeScript

Zero configuration TypeScript support:

```typescript
// No need for ts-node or babel
import { describe, it, expect } from '@elide/vitest-clone';

describe('TypeScript support', () => {
  it('works out of the box', () => {
    const typed: number = 42;
    expect(typed).toBe(42);
  });
});
```

## Performance Benchmarks

```
Test Execution:
  1,000 tests: ~300ms
  10,000 tests: ~1.5s

Watch Mode:
  File change detection: <5ms
  Incremental re-run: ~100ms

Startup Time:
  Cold start: ~50ms
  Warm start: ~10ms
```

## Comparison with Jest

| Feature | Vitest | Jest |
|---------|--------|------|
| Startup Time | 🚀 Fast | ⏱️ Slower |
| Watch Mode | ⚡ Instant | 🐢 Slow |
| ESM Support | ✅ Native | ⚠️ Experimental |
| Config | 📝 Shared with Vite | 📝 Separate |
| UI Mode | ✅ Built-in | ❌ None |
| Browser Testing | ✅ Built-in | ⚠️ External |

## Migration from Jest

Vitest is largely compatible with Jest:

```diff
- import { test, expect } from '@jest/globals';
+ import { test, expect } from '@elide/vitest-clone';

- jest.fn()
+ vi.fn()

- jest.mock()
+ vi.mock()

- jest.useFakeTimers()
+ vi.useFakeTimers()
```

## Architecture

```
vitest-clone/
├── src/
│   ├── core/           # Test runner and execution
│   ├── matchers/       # Assertion library
│   ├── mocking/        # Mock system (vi object)
│   ├── reporters/      # Test reporters
│   ├── watch/          # Watch mode
│   ├── browser/        # Browser mode
│   └── cli/            # Command-line interface
├── examples/           # Usage examples
└── benchmarks/         # Performance tests
```

## Contributing

Contributions welcome! See our contributing guide.

## License

MIT License

## Links

- [Vitest Documentation](https://vitest.dev)
- [Vite Documentation](https://vitejs.dev)
- [Elide Documentation](https://docs.elide.dev)
