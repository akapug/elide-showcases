# Mocha Clone - Flexible Testing Framework for Elide

A feature-rich JavaScript test framework running on Elide, making asynchronous testing simple and fun.

## Features

- **🎯 BDD/TDD/Exports**: Multiple interface styles
- **⚡ Async Support**: Promises, async/await, callbacks
- **🎨 Flexible Reporters**: Multiple built-in reporters
- **🔧 Hooks**: Before, after, beforeEach, afterEach
- **🌐 Browser Support**: Run tests in browser or Node
- **⏱️ Timeouts**: Configurable timeouts
- **📊 Code Coverage**: Integration with coverage tools
- **🔁 Test Retry**: Automatic retry for flaky tests
- **TypeScript**: First-class TypeScript support

## Installation

```bash
elide install @elide/mocha-clone
```

## Quick Start

```typescript
import { describe, it } from '@elide/mocha-clone';
import { expect } from 'chai';

describe('Array', () => {
  describe('#indexOf()', () => {
    it('should return -1 when the value is not present', () => {
      expect([1, 2, 3].indexOf(4)).to.equal(-1);
    });
  });
});
```

## Running Tests

```bash
# Run all tests
elide mocha

# Run specific file
elide mocha test/users.test.ts

# Run with reporter
elide mocha --reporter spec

# Run with grep pattern
elide mocha --grep "should"

# Run tests in watch mode
elide mocha --watch
```

## Interfaces

### BDD (Behavior-Driven Development)

```typescript
describe('Feature', () => {
  context('when condition is true', () => {
    it('should do something', () => {
      // Test code
    });

    it('should do something else', () => {
      // Test code
    });
  });

  context('when condition is false', () => {
    it('should handle error', () => {
      // Test code
    });
  });
});
```

### TDD (Test-Driven Development)

```typescript
suite('Array', () => {
  suite('#indexOf()', () => {
    test('should return -1 when not present', () => {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});
```

### Exports

```typescript
export const tests = {
  'Array': {
    '#indexOf()': {
      'should return -1 when not present': function() {
        assert.equal([1, 2, 3].indexOf(4), -1);
      }
    }
  }
};
```

## Hooks

Hooks run in the following order:

```typescript
describe('hooks', () => {
  before(() => {
    // Runs once before all tests in this block
  });

  after(() => {
    // Runs once after all tests in this block
  });

  beforeEach(() => {
    // Runs before each test in this block
  });

  afterEach(() => {
    // Runs after each test in this block
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

### Root-Level Hooks

```typescript
before(() => {
  // Runs before all tests
});

after(() => {
  // Runs after all tests
});

describe('test suite', () => {
  // Tests
});
```

### Async Hooks

```typescript
describe('async hooks', () => {
  before(async () => {
    await setupDatabase();
  });

  after(async () => {
    await teardownDatabase();
  });

  it('test', async () => {
    const user = await findUser(1);
    expect(user).to.exist;
  });
});
```

## Async Tests

### Promises

```typescript
it('should complete async', () => {
  return fetchData().then(data => {
    expect(data).to.exist;
  });
});
```

### Async/Await

```typescript
it('should complete async', async () => {
  const data = await fetchData();
  expect(data).to.exist;
});
```

### Callbacks

```typescript
it('should complete with callback', (done) => {
  fetchData((err, data) => {
    if (err) return done(err);
    expect(data).to.exist;
    done();
  });
});
```

## Test Modifiers

### Exclusive Tests (.only)

Run only specific tests:

```typescript
describe.only('exclusive suite', () => {
  // Only this suite will run
});

it.only('exclusive test', () => {
  // Only this test will run
});
```

### Inclusive Tests (.skip)

Skip tests:

```typescript
describe.skip('skipped suite', () => {
  // This suite will be skipped
});

it.skip('skipped test', () => {
  // This test will be skipped
});
```

### Pending Tests

Tests without a function are marked as pending:

```typescript
it('will be implemented later');
```

## Timeouts

### Global Timeout

```typescript
// mocha.opts or CLI
elide mocha --timeout 5000
```

### Suite Timeout

```typescript
describe('slow suite', function() {
  this.timeout(10000);

  it('slow test', async () => {
    await slowOperation();
  });
});
```

### Test Timeout

```typescript
it('slow test', async function() {
  this.timeout(5000);
  await slowOperation();
});
```

### Disable Timeout

```typescript
it('no timeout', function() {
  this.timeout(0);
  // Runs without timeout
});
```

## Retries

Retry flaky tests automatically:

```typescript
describe('flaky tests', () => {
  // Retry all tests in this suite up to 2 times
  beforeEach(function() {
    this.retries(2);
  });

  it('might fail', () => {
    // Flaky test
  });
});

it('specific retry', function() {
  // Retry this specific test
  this.retries(3);
});
```

## Reporters

### Built-in Reporters

- **spec** - Hierarchical view (default)
- **dot** - Dot matrix
- **nyan** - Nyan cat!
- **tap** - TAP format
- **landing** - Landing strip
- **list** - Simple list
- **progress** - Progress bar
- **json** - JSON output
- **json-stream** - Streaming JSON
- **min** - Minimal output
- **doc** - HTML documentation

```bash
elide mocha --reporter spec
elide mocha --reporter json > results.json
elide mocha --reporter nyan
```

### Custom Reporter

```typescript
class MyReporter {
  constructor(runner) {
    const tests = 0;
    const passes = 0;
    const failures = 0;

    runner.on('test', (test) => {
      tests++;
    });

    runner.on('pass', (test) => {
      passes++;
    });

    runner.on('fail', (test, err) => {
      failures++;
    });

    runner.on('end', () => {
      console.log(`${passes}/${tests} passed`);
    });
  }
}

export = MyReporter;
```

## Configuration

### mocha.opts

```
--require ts-node/register
--require test/setup.ts
--reporter spec
--ui bdd
--timeout 5000
--recursive
--watch
--watch-files src/**/*.ts,test/**/*.ts
```

### .mocharc.json

```json
{
  "require": ["ts-node/register", "test/setup.ts"],
  "reporter": "spec",
  "ui": "bdd",
  "timeout": 5000,
  "recursive": true,
  "watch": true,
  "watchFiles": ["src/**/*.ts", "test/**/*.ts"],
  "ignore": ["node_modules/**"]
}
```

### .mocharc.js

```javascript
module.exports = {
  require: ['ts-node/register'],
  reporter: 'spec',
  ui: 'bdd',
  timeout: 5000,
  recursive: true,
  spec: ['test/**/*.test.ts']
};
```

## Programmatic API

```typescript
import { Mocha } from '@elide/mocha-clone';

const mocha = new Mocha({
  ui: 'bdd',
  reporter: 'spec',
  timeout: 5000
});

mocha.addFile('test/users.test.ts');
mocha.addFile('test/posts.test.ts');

mocha.run((failures) => {
  process.exitCode = failures ? 1 : 0;
});
```

## Parallel Execution

```bash
# Run tests in parallel
elide mocha --parallel

# Specify worker count
elide mocha --parallel --jobs 4
```

## Grep and Invert

### Grep (Run matching tests)

```bash
# Run tests matching pattern
elide mocha --grep "user"

# Run tests matching regex
elide mocha --grep "/API.*POST/i"
```

### Invert (Exclude matching tests)

```bash
# Run tests NOT matching pattern
elide mocha --grep "integration" --invert
```

## Global Variables

Mocha exposes these globals by default:

- `describe()`, `context()` - Suite definition
- `it()`, `specify()` - Test definition
- `before()`, `after()` - Suite hooks
- `beforeEach()`, `afterEach()` - Test hooks

Disable globals:

```bash
elide mocha --no-globals
```

## Test Structure Best Practices

### Organize by Feature

```typescript
describe('User Management', () => {
  describe('Creating Users', () => {
    it('should create user with valid data', () => {});
    it('should reject invalid email', () => {});
  });

  describe('Updating Users', () => {
    it('should update user profile', () => {});
    it('should not update with invalid data', () => {});
  });
});
```

### Setup and Teardown

```typescript
describe('Database Tests', () => {
  let db;

  before(async () => {
    db = await connectDatabase();
  });

  after(async () => {
    await db.close();
  });

  beforeEach(async () => {
    await db.clear();
    await db.seed();
  });

  it('test 1', () => {});
  it('test 2', () => {});
});
```

### Shared Behaviors

```typescript
function shouldBehaveLikeUser(context) {
  describe('user behavior', () => {
    it('should have name', () => {
      expect(context.user).to.have.property('name');
    });

    it('should have email', () => {
      expect(context.user).to.have.property('email');
    });
  });
}

describe('Admin', () => {
  const context = { user: { name: 'Admin', email: 'admin@example.com' } };
  shouldBehaveLikeUser(context);
});
```

## Performance Tips

1. **Use beforeEach wisely** - Don't recreate expensive objects
2. **Parallelize** - Use --parallel for independent tests
3. **Increase timeout** - For slow operations
4. **Skip slow tests** - In development with .skip
5. **Use .only** - To focus on specific tests during development

## Debugging

```bash
# Run with Node debugger
elide mocha --inspect-brk

# Run specific test
elide mocha --grep "specific test" --inspect-brk
```

## Coverage

Integrate with coverage tools:

```bash
# With nyc (Istanbul)
nyc elide mocha

# Generate reports
nyc --reporter=html --reporter=text elide mocha
```

## Performance Benchmarks

```
Test Execution:
  Simple test: ~1ms
  Async test: ~10ms
  With hooks: ~2ms

Suite Execution:
  10 tests: ~50ms
  100 tests: ~300ms
  1000 tests: ~2s

Parallel Execution:
  4 workers: ~3x faster
```

## Architecture

```
mocha-clone/
├── src/
│   ├── interfaces/     # BDD, TDD, Exports
│   ├── reporters/      # Built-in reporters
│   └── runner/         # Test runner
└── examples/           # Usage examples
```

## Migration from Jest

```typescript
// Jest
describe('test', () => {
  it('works', () => {
    expect(value).toBe(expected);
  });
});

// Mocha (with Chai)
import { expect } from 'chai';

describe('test', () => {
  it('works', () => {
    expect(value).to.equal(expected);
  });
});
```

## License

MIT
