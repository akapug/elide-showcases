# Polyglot Testing Framework

A comprehensive, production-ready testing framework that unifies testing across TypeScript, Python, Ruby, and Java with a single test runner, unified assertions, cross-language mocking, and integrated coverage tracking.

## Overview

The Polyglot Testing Framework bridges the gap between different language ecosystems, allowing teams to:

- **Write tests once, run everywhere**: Use a consistent API across all supported languages
- **Cross-language integration testing**: Test interactions between services written in different languages
- **Unified reporting**: Get consolidated test results and coverage reports across your entire stack
- **Parallel execution**: Run tests concurrently across all languages for maximum speed
- **Consistent assertions**: Use the same assertion library syntax regardless of the language
- **Advanced mocking**: Create mocks and stubs that work across language boundaries
- **Performance benchmarking**: Compare test execution times and optimize your test suite

## Features

### Multi-Language Support

- **TypeScript/JavaScript**: Native support with full type checking
- **Python**: Integration with pytest, unittest, and custom test frameworks
- **Ruby**: RSpec and Minitest compatibility
- **Java**: JUnit 5 integration with Gradle and Maven support

### Unified Test Runner

The test runner orchestrates test execution across all languages:

```typescript
import { TestRunner } from './src/test-runner';

const runner = new TestRunner({
  languages: ['typescript', 'python', 'ruby', 'java'],
  parallel: true,
  maxWorkers: 8,
  timeout: 30000,
  coverage: {
    enabled: true,
    threshold: 80,
    reporters: ['html', 'json', 'lcov']
  }
});

await runner.discover();
await runner.run();
```

### Assertion Library

Consistent, fluent assertions across all languages:

```typescript
// TypeScript
expect(value).toBe(42);
expect(array).toContain('item');
expect(async () => fetchData()).toResolve();

# Python
expect(value).to_be(42)
expect(array).to_contain('item')
expect(lambda: fetch_data()).to_resolve()

# Ruby
expect(value).to_be(42)
expect(array).to_contain('item')
expect(-> { fetch_data }).to_resolve

// Java
expect(value).toBe(42);
expect(array).toContain("item");
expect(() -> fetchData()).toResolve();
```

### Cross-Language Mocking

Create mocks that work across language boundaries:

```typescript
import { MockFramework } from './src/mocking/mock-framework';

const mock = MockFramework.createMock({
  target: 'python-service',
  interface: {
    getData: { returns: Promise.resolve({ id: 1 }) },
    saveData: { throws: new Error('Network error') }
  }
});
```

### Coverage Tracking

Unified coverage reporting across all languages:

```typescript
import { CoverageTracker } from './src/coverage/coverage-tracker';

const tracker = new CoverageTracker({
  languages: ['typescript', 'python', 'ruby', 'java'],
  outputDir: './coverage',
  formats: ['html', 'json', 'lcov', 'cobertura']
});

await tracker.collect();
await tracker.merge();
await tracker.report();
```

## Installation

### Prerequisites

- Node.js 18+ (for TypeScript/JavaScript)
- Python 3.9+ (for Python tests)
- Ruby 3.0+ (for Ruby tests)
- Java 17+ (for Java tests)

### Setup

```bash
# Install Node dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Install Ruby dependencies
bundle install

# Install Java dependencies (Gradle)
./gradlew build

# Or with Maven
mvn install
```

## Quick Start

### 1. Create a Test Configuration

Create `test.config.json`:

```json
{
  "languages": {
    "typescript": {
      "enabled": true,
      "testMatch": ["**/*.test.ts", "**/*.spec.ts"],
      "exclude": ["node_modules/**", "dist/**"]
    },
    "python": {
      "enabled": true,
      "testMatch": ["**/test_*.py", "**/*_test.py"],
      "exclude": ["venv/**", ".pytest_cache/**"]
    },
    "ruby": {
      "enabled": true,
      "testMatch": ["**/*_spec.rb"],
      "exclude": ["vendor/**"]
    },
    "java": {
      "enabled": true,
      "testMatch": ["**/Test*.java", "**/*Test.java"],
      "exclude": ["target/**", "build/**"]
    }
  },
  "parallel": {
    "enabled": true,
    "maxWorkers": 4
  },
  "coverage": {
    "enabled": true,
    "threshold": {
      "global": 80,
      "perLanguage": {
        "typescript": 85,
        "python": 80,
        "ruby": 75,
        "java": 80
      }
    }
  },
  "reporters": ["console", "html", "json", "junit"]
}
```

### 2. Write Your First Test

**TypeScript:**

```typescript
// calculator.test.ts
import { describe, it, expect } from './src/assertion-library';

describe('Calculator', () => {
  it('should add two numbers', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve(10);
    expect(result).toBe(10);
  });
});
```

**Python:**

```python
# test_calculator.py
from pytest_bridge import describe, it, expect

@describe('Calculator')
class TestCalculator:
    @it('should add two numbers')
    def test_addition(self):
        expect(2 + 2).to_be(4)

    @it('should handle async operations')
    async def test_async(self):
        result = await some_async_function()
        expect(result).to_be(10)
```

**Ruby:**

```ruby
# calculator_spec.rb
require_relative '../ruby/rspec_bridge'

describe 'Calculator' do
  it 'should add two numbers' do
    expect(2 + 2).to_be(4)
  end

  it 'should handle async operations' do
    result = async_operation
    expect(result).to_be(10)
  end
end
```

**Java:**

```java
// CalculatorTest.java
import static junit_bridge.Assertions.*;

@TestSuite("Calculator")
public class CalculatorTest {
    @Test("should add two numbers")
    public void testAddition() {
        expect(2 + 2).toBe(4);
    }

    @Test("should handle async operations")
    public void testAsync() throws Exception {
        CompletableFuture<Integer> result = asyncOperation();
        expect(result.get()).toBe(10);
    }
}
```

### 3. Run Tests

```bash
# Run all tests
npm run test

# Run specific language tests
npm run test:typescript
npm run test:python
npm run test:ruby
npm run test:java

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test files
npm run test -- --file="calculator.test.ts"

# Run with custom configuration
npm run test -- --config=custom-test.config.json
```

## Architecture

### Test Discovery

The framework uses intelligent test discovery across all languages:

1. **Pattern Matching**: Configurable glob patterns for each language
2. **AST Analysis**: Parses source files to identify test cases
3. **Metadata Extraction**: Extracts test names, descriptions, and tags
4. **Dependency Resolution**: Identifies test dependencies and execution order

### Test Execution

Tests are executed in isolated environments:

- **TypeScript**: V8 isolates with sandboxed execution
- **Python**: Subprocess execution with virtualenv isolation
- **Ruby**: Separate Ruby processes with bundler isolation
- **Java**: JVM instances with classloader isolation

### Result Aggregation

Results from all languages are normalized and aggregated:

```typescript
interface TestResult {
  suite: string;
  test: string;
  language: Language;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number;
  error?: Error;
  stdout?: string;
  stderr?: string;
  coverage?: CoverageData;
}
```

### Coverage Collection

Coverage is collected using language-specific tools:

- **TypeScript**: Istanbul/NYC
- **Python**: Coverage.py
- **Ruby**: SimpleCov
- **Java**: JaCoCo

Coverage data is normalized to a common format and merged for unified reporting.

## Advanced Usage

### Custom Test Reporters

Create custom reporters to format test results:

```typescript
import { TestReporter } from './src/reporters/base-reporter';

class SlackReporter extends TestReporter {
  async onTestComplete(results: TestResults) {
    await this.sendToSlack({
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      duration: results.duration,
      coverage: results.coverage
    });
  }
}
```

### Cross-Language Test Dependencies

Define dependencies between tests in different languages:

```typescript
// TypeScript test depends on Python test completing first
describe('Integration', () => {
  beforeAll(async () => {
    await waitForTest('python:test_database_setup');
  });

  it('should interact with Python service', async () => {
    const result = await callPythonService();
    expect(result).toBeDefined();
  });
});
```

### Shared Test Fixtures

Share test fixtures across languages:

```typescript
// fixtures/database.ts
export const databaseFixture = {
  setup: async () => {
    // Setup database for all languages
    await setupPostgres();
    await seedTestData();
  },
  teardown: async () => {
    await cleanupDatabase();
  }
};
```

### Performance Optimization

Configure test execution for optimal performance:

```typescript
const runner = new TestRunner({
  optimization: {
    caching: true,
    incrementalTesting: true,
    smartOrdering: true,
    parallelization: {
      strategy: 'adaptive',
      minWorkers: 2,
      maxWorkers: 16
    }
  }
});
```

## Configuration Reference

### Test Runner Options

```typescript
interface TestRunnerConfig {
  languages: Language[];
  parallel: boolean;
  maxWorkers: number;
  timeout: number;
  retries: number;
  bail: boolean;
  verbose: boolean;
  silent: boolean;
  coverage: CoverageConfig;
  reporters: ReporterConfig[];
  setupFiles: string[];
  globalSetup: string;
  globalTeardown: string;
}
```

### Coverage Configuration

```typescript
interface CoverageConfig {
  enabled: boolean;
  threshold: {
    global: number;
    perLanguage: Record<Language, number>;
    perFile: number;
  };
  include: string[];
  exclude: string[];
  reporters: CoverageReporter[];
  collectFrom: Language[];
}
```

### Assertion Options

```typescript
interface AssertionConfig {
  timeout: number;
  strict: boolean;
  customMatchers: Record<string, Matcher>;
  asyncTimeout: number;
  errorFormat: 'short' | 'verbose';
}
```

## API Reference

### TestRunner

```typescript
class TestRunner {
  constructor(config: TestRunnerConfig);

  async discover(): Promise<TestSuite[]>;
  async run(filter?: TestFilter): Promise<TestResults>;
  async watch(options?: WatchOptions): Promise<void>;
  async debug(testPath: string): Promise<void>;

  on(event: TestEvent, handler: EventHandler): void;
  off(event: TestEvent, handler: EventHandler): void;
}
```

### AssertionLibrary

```typescript
function expect<T>(actual: T): Assertion<T>;

interface Assertion<T> {
  toBe(expected: T): void;
  toEqual(expected: T): void;
  toBeGreaterThan(value: number): void;
  toContain(item: any): void;
  toThrow(error?: Error | string): void;
  toResolve(): Promise<void>;
  toReject(error?: Error | string): Promise<void>;
  not: Assertion<T>;
}
```

### MockFramework

```typescript
class MockFramework {
  static createMock<T>(options: MockOptions): Mock<T>;
  static createSpy<T>(target: T, method: string): Spy;
  static createStub<T>(implementation: T): Stub<T>;

  static verify(mock: Mock<any>): void;
  static reset(mock: Mock<any>): void;
  static restore(): void;
}
```

### CoverageTracker

```typescript
class CoverageTracker {
  constructor(config: CoverageConfig);

  async collect(language?: Language): Promise<Coverage>;
  async merge(coverages: Coverage[]): Promise<MergedCoverage>;
  async report(formats?: CoverageFormat[]): Promise<void>;
  async checkThresholds(): Promise<ThresholdResult>;
}
```

## Examples

See the `examples/` directory for comprehensive examples:

- `cross-language-tests.ts`: Testing interactions between different languages
- `integration-tests.ts`: Full integration test scenarios
- `performance-tests.ts`: Performance and load testing
- `mock-examples.ts`: Advanced mocking scenarios

## Benchmarks

Performance benchmarks are available in `benchmarks/`:

```bash
npm run benchmark

# Results
Test Execution (1000 tests):
  TypeScript: 2.3s
  Python: 4.1s
  Ruby: 3.7s
  Java: 5.2s
  Parallel (all): 6.1s

Coverage Collection:
  TypeScript: 0.8s
  Python: 1.2s
  Ruby: 1.0s
  Java: 1.5s
  Merged: 0.3s
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Polyglot Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
      - uses: actions/setup-java@v3
        with:
          java-version: '17'

      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/merged/lcov.info
```

### GitLab CI

```yaml
test:
  image: polyglot-testing:latest
  script:
    - npm install
    - npm run test:coverage
  coverage: '/Merged Coverage: (\d+\.\d+)%/'
  artifacts:
    reports:
      junit: coverage/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura.xml
```

## Troubleshooting

### Common Issues

**Tests not discovered:**
- Check test file naming patterns in configuration
- Verify file permissions
- Ensure language runtimes are properly installed

**Coverage thresholds not met:**
- Review coverage reports in `coverage/html/index.html`
- Identify untested code paths
- Add tests for uncovered branches

**Parallel execution failures:**
- Reduce `maxWorkers` setting
- Check for test interdependencies
- Ensure tests are isolated and stateless

**Cross-language mocking issues:**
- Verify network connectivity between language bridges
- Check mock server ports are available
- Review mock interface definitions

## Contributing

We welcome contributions! Please see CONTRIBUTING.md for guidelines.

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: https://polyglot-testing.dev
- Issues: https://github.com/polyglot-testing/framework/issues
- Discussions: https://github.com/polyglot-testing/framework/discussions
- Chat: https://discord.gg/polyglot-testing
