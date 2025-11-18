# zone.js - Execution Context - Elide Polyglot Showcase

> **One execution zone library for ALL languages** - TypeScript, Python, Ruby, and Java

Provides execution context that persists across async tasks with automatic propagation and task interception.

## 🌟 Why This Matters

Different languages handle execution context differently:
- JavaScript loses context across async boundaries
- Python's contextvars require manual setup
- Ruby's binding doesn't work with all async patterns
- Java's ThreadLocal doesn't propagate automatically

**Elide solves this** with ONE zone library that automatically tracks execution context across ALL async operations.

## ✨ Features

- ✅ Execution context zones
- ✅ Async task tracking
- ✅ Automatic context propagation
- ✅ Task interception hooks
- ✅ Error handling boundaries
- ✅ Performance monitoring
- ✅ Fork and child zones
- ✅ Property inheritance
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import Zone from './elide-zone.js.ts';

// Create a zone with properties
const myZone = Zone.root.fork({
  name: 'myZone',
  properties: {
    requestId: 'req-123',
    userId: 'user-456',
  },
});

// Run code in the zone
myZone.run(() => {
  console.log('Zone:', Zone.current.name);
  console.log('Request ID:', Zone.current.get('requestId'));
});
```

### Python
```python
from elide import require
Zone = require('./elide-zone.js.ts')

# Create a zone
my_zone = Zone.root.fork({
    'name': 'myZone',
    'properties': {'requestId': 'req-123'}
})

# Run in zone
def handler():
    print('Zone:', Zone.current.name)
    print('Request ID:', Zone.current.get('requestId'))

my_zone.run(handler)
```

### Ruby
```ruby
Zone = Elide.require('./elide-zone.js.ts')

# Create a zone
my_zone = Zone.root.fork({
  name: 'myZone',
  properties: {requestId: 'req-123'}
})

# Run in zone
my_zone.run do
  puts "Zone: #{Zone.current.name}"
  puts "Request ID: #{Zone.current.get('requestId')}"
end
```

### Java
```java
Value Zone = context.eval("js", "require('./elide-zone.js.ts')");
Value myZone = Zone.getMember("root").invokeMember("fork",
    Map.of("name", "myZone", "properties", Map.of("requestId", "req-123"))
);

myZone.invokeMember("run", (Consumer<Void>) v -> {
    Value current = Zone.getMember("current");
    System.out.println("Zone: " + current.getMember("name"));
    System.out.println("Request ID: " + current.invokeMember("get", "requestId"));
});
```

## 💡 Real-World Use Cases

### HTTP Request Context
```typescript
import Zone from './elide-zone.js.ts';

function handleHTTPRequest(req: any, res: any) {
  const requestZone = Zone.root.fork({
    name: 'http-request',
    properties: {
      requestId: req.headers['x-request-id'],
      method: req.method,
      path: req.path,
      startTime: Date.now(),
    },
  });

  requestZone.run(() => {
    try {
      authenticate();
      processRequest();
      sendResponse(res);
    } catch (error) {
      handleError(error, res);
    }
  });
}

function authenticate() {
  const requestId = Zone.current.get('requestId');
  console.log(`[${requestId}] Authenticating...`);
}

function processRequest() {
  const requestId = Zone.current.get('requestId');
  const method = Zone.current.get('method');
  const path = Zone.current.get('path');
  console.log(`[${requestId}] ${method} ${path}`);
}

function sendResponse(res: any) {
  const requestId = Zone.current.get('requestId');
  const duration = Date.now() - Zone.current.get('startTime');
  console.log(`[${requestId}] Response sent in ${duration}ms`);
  res.send('OK');
}
```

### Error Boundary
```typescript
const errorZone = Zone.root.fork({
  name: 'errorBoundary',
  properties: {
    errors: [] as Error[],
  },
  onHandleError(delegate, current, target, error) {
    const errors = target.get('errors');
    errors.push(error);
    console.error(`[${target.name}] Error caught:`, error.message);
    return false; // Error handled, don't propagate
  },
});

errorZone.runGuarded(() => {
  // Code that might throw
  riskyOperation();
  anotherRiskyOperation();

  // Check if any errors occurred
  const errors = Zone.current.get('errors');
  if (errors.length > 0) {
    console.log(`Caught ${errors.length} errors`);
  }
});

function riskyOperation() {
  throw new Error('Something went wrong');
}

function anotherRiskyOperation() {
  throw new Error('Another error');
}
```

### Performance Profiling
```typescript
const profileZone = Zone.root.fork({
  name: 'profiler',
  properties: {
    operations: new Map<string, { count: number; totalTime: number }>(),
  },
  onInvoke(delegate, current, target, callback, applyThis, applyArgs, source) {
    const startTime = Date.now();
    const result = delegate.invoke(callback, applyThis, applyArgs, source);
    const duration = Date.now() - startTime;

    if (source) {
      const operations = target.get('operations');
      const op = operations.get(source) || { count: 0, totalTime: 0 };
      op.count++;
      op.totalTime += duration;
      operations.set(source, op);
    }

    return result;
  },
});

profileZone.run(() => {
  Zone.current.run(() => performDatabaseQuery(), null, [], 'db-query');
  Zone.current.run(() => callExternalAPI(), null, [], 'api-call');
  Zone.current.run(() => processData(), null, [], 'process');

  const operations = Zone.current.get('operations');
  console.log('\nPerformance Report:');
  operations.forEach((stats, name) => {
    const avgTime = stats.totalTime / stats.count;
    console.log(`${name}: ${stats.count} calls, ${avgTime.toFixed(2)}ms avg`);
  });
});

function performDatabaseQuery() {
  // Simulate query
}

function callExternalAPI() {
  // Simulate API call
}

function processData() {
  // Simulate processing
}
```

### Task Tracking
```typescript
const taskZone = Zone.root.fork({
  name: 'taskTracker',
  properties: {
    tasks: [] as string[],
  },
  onScheduleTask(delegate, current, target, task) {
    const tasks = target.get('tasks');
    tasks.push(`${task.type}:${task.source}`);
    console.log(`[${target.name}] Scheduled ${task.type}: ${task.source}`);
    return delegate.scheduleTask(task);
  },
  onInvokeTask(delegate, current, target, task, applyThis, applyArgs) {
    console.log(`[${target.name}] Invoking ${task.type}: ${task.source}`);
    return delegate.invokeTask(task, applyThis, applyArgs);
  },
});

taskZone.run(() => {
  // Schedule various tasks
  Zone.current.scheduleMicroTask('promise', () => {
    console.log('Promise resolved');
  });

  Zone.current.scheduleMacroTask('timeout', () => {
    console.log('Timeout fired');
  });

  Zone.current.scheduleEventTask('click', () => {
    console.log('Click handled');
  });

  const tasks = Zone.current.get('tasks');
  console.log('Total tasks scheduled:', tasks.length);
});
```

### Testing Isolation
```typescript
function runTest(testName: string, testFn: () => void) {
  const testZone = Zone.root.fork({
    name: `test:${testName}`,
    properties: {
      testName,
      assertions: 0,
      failures: [] as string[],
    },
    onHandleError(delegate, current, target, error) {
      const failures = target.get('failures');
      failures.push(error.message);
      return false; // Don't propagate
    },
  });

  testZone.run(() => {
    console.log(`\nRunning test: ${testName}`);
    testFn();

    const assertions = Zone.current.get('assertions');
    const failures = Zone.current.get('failures');

    if (failures.length === 0) {
      console.log(`✓ ${testName} passed (${assertions} assertions)`);
    } else {
      console.log(`✗ ${testName} failed:`);
      failures.forEach((f: string) => console.log(`  - ${f}`));
    }
  });
}

function assert(condition: boolean, message: string) {
  const assertions = Zone.current.get('assertions');
  Zone.current.get('assertions') = assertions + 1;

  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Run tests
runTest('addition', () => {
  assert(1 + 1 === 2, '1 + 1 should equal 2');
  assert(2 + 2 === 4, '2 + 2 should equal 4');
});

runTest('subtraction', () => {
  assert(5 - 3 === 2, '5 - 3 should equal 2');
  assert(10 - 1 === 9, '10 - 1 should equal 9');
});
```

## 🎯 Why Polyglot?

### The Problem
**Before**: Each language has different execution context handling

```
JavaScript: No automatic context propagation
Python: contextvars, manual setup needed
Ruby: binding, limited async support
Java: ThreadLocal, no auto-propagation

Result:
❌ Lost context in async
❌ Manual context passing
❌ Inconsistent behavior
❌ Different APIs per language
```

### The Solution
**After**: One Elide zone.js for all languages

```
┌────────────────────────────────┐
│  Elide zone.js (TypeScript)   │
│  elide-zone.js.ts             │
└────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │ Script │  │Service │
    └────────┘  └────────┘  └────────┘

Benefits:
✅ Automatic context propagation
✅ Consistent zone API
✅ Task interception everywhere
✅ Shared patterns
```

## 📖 API Reference

### Zone Static Properties
- `Zone.current` - Get current zone
- `Zone.root` - Get root zone

### Zone Methods
- `fork(zoneSpec)` - Create child zone
- `run(callback, applyThis?, applyArgs?, source?)` - Run in zone
- `runGuarded(callback, applyThis?, applyArgs?, source?)` - Run with error handling
- `runTask(task, applyThis?, applyArgs?)` - Run a task
- `scheduleTask(task)` - Schedule a task
- `scheduleMicroTask(source, callback, data?, customSchedule?)` - Schedule microtask
- `scheduleMacroTask(source, callback, data?, customSchedule?, customCancel?)` - Schedule macrotask
- `scheduleEventTask(source, callback, data?, customSchedule?, customCancel?)` - Schedule event task
- `cancelTask(task)` - Cancel a task
- `wrap(callback, source?)` - Wrap function to run in zone
- `get(key)` - Get property from zone or parent

### ZoneSpec Hooks
- `onScheduleTask` - Intercept task scheduling
- `onInvokeTask` - Intercept task invocation
- `onCancelTask` - Intercept task cancellation
- `onInvoke` - Intercept function invocation
- `onHandleError` - Handle errors
- `onHasTask` - Track task state changes

## 🧪 Testing

```bash
elide run elide-zone.js.ts
```

## 📂 Files

- `elide-zone.js.ts` - Main implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm zone.js package](https://www.npmjs.com/package/zone.js)
- [Angular Zone.js](https://github.com/angular/angular/tree/main/packages/zone.js)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~25M/week
- **Use case**: Execution context and task tracking
- **Elide advantage**: One zone library for all languages
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One zone to bind them all.*
