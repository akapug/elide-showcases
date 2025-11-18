# cls-hooked - Continuation-Local Storage - Elide Polyglot Showcase

> **One context storage library for ALL languages** - TypeScript, Python, Ruby, and Java

Context management for async operations with automatic context propagation across async boundaries.

## 🌟 Why This Matters

Different languages handle async context differently:
- `contextvars` in Python requires manual context management
- Ruby's thread-local storage doesn't work well with fibers
- Java's ThreadLocal doesn't propagate across async boundaries
- Each language has different context APIs

**Elide solves this** with ONE context library that works in ALL languages with automatic propagation.

## ✨ Features

- ✅ Continuation-local storage
- ✅ Async context tracking
- ✅ Request context isolation
- ✅ Automatic context propagation
- ✅ Namespace management
- ✅ No callback wrapping needed
- ✅ Function binding support
- ✅ Promise support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { createNamespace } from './elide-cls-hooked.ts';

const session = createNamespace('session');

session.run(() => {
  session.set('userId', '12345');
  session.set('requestId', 'abc-123');

  console.log('User ID:', session.get('userId'));
  // Prints: User ID: 12345
});
```

### Python
```python
from elide import require
cls = require('./elide-cls-hooked.ts')

session = cls.createNamespace('session')

def handler():
    session.set('userId', '12345')
    print('User ID:', session.get('userId'))

session.run(handler)
```

### Ruby
```ruby
cls = Elide.require('./elide-cls-hooked.ts')

session = cls.createNamespace('session')

session.run do
  session.set('userId', '12345')
  puts "User ID: #{session.get('userId')}"
end
```

### Java
```java
Value cls = context.eval("js", "require('./elide-cls-hooked.ts')");
Value session = cls.invokeMember("createNamespace", "session");

session.invokeMember("run", (Consumer<Void>) v -> {
    session.invokeMember("set", "userId", "12345");
    Object userId = session.invokeMember("get", "userId");
    System.out.println("User ID: " + userId);
});
```

## 💡 Real-World Use Cases

### Request ID Tracking
```typescript
import { createNamespace } from './elide-cls-hooked.ts';

const request = createNamespace('request');

async function handleHTTPRequest(req: any, res: any) {
  await request.runPromise(async () => {
    // Set request context
    request.set('requestId', req.headers['x-request-id']);
    request.set('userId', req.user?.id);
    request.set('startTime', Date.now());

    // Context automatically available in all async calls
    await authenticate(req);
    await processRequest(req);
    await logRequest();

    res.send('OK');
  });
}

async function authenticate(req: any) {
  const requestId = request.get('requestId');
  console.log(`[${requestId}] Authenticating...`);
}

async function logRequest() {
  const requestId = request.get('requestId');
  const duration = Date.now() - request.get('startTime');
  console.log(`[${requestId}] Request completed in ${duration}ms`);
}
```

### Database Transaction Context
```typescript
const transaction = createNamespace('transaction');

async function executeTransaction(operations: any[]) {
  await transaction.runPromise(async () => {
    const txId = 'tx-' + Date.now();
    transaction.set('txId', txId);
    transaction.set('rollback', false);

    try {
      for (const op of operations) {
        await performOperation(op);
      }
      await commit();
    } catch (error) {
      await rollback();
      throw error;
    }
  });
}

async function performOperation(op: any) {
  const txId = transaction.get('txId');
  console.log(`[${txId}] Performing operation:`, op);

  // Simulate database operation
  if (op.shouldFail) {
    transaction.set('rollback', true);
    throw new Error('Operation failed');
  }
}

async function commit() {
  const txId = transaction.get('txId');
  console.log(`[${txId}] Committing transaction`);
}

async function rollback() {
  const txId = transaction.get('txId');
  console.log(`[${txId}] Rolling back transaction`);
}
```

### Distributed Tracing Context
```typescript
const trace = createNamespace('trace');

async function handleRequest() {
  await trace.runPromise(async () => {
    trace.set('traceId', generateTraceId());
    trace.set('spanId', generateSpanId());

    await serviceA();
  });
}

async function serviceA() {
  const traceId = trace.get('traceId');
  const parentSpanId = trace.get('spanId');
  const spanId = generateSpanId();

  trace.set('spanId', spanId);

  console.log(`[${traceId}][${spanId}] Service A (parent: ${parentSpanId})`);

  await serviceB();
}

async function serviceB() {
  const traceId = trace.get('traceId');
  const parentSpanId = trace.get('spanId');
  const spanId = generateSpanId();

  console.log(`[${traceId}][${spanId}] Service B (parent: ${parentSpanId})`);
}

function generateTraceId() {
  return Math.random().toString(36).substring(7);
}

function generateSpanId() {
  return Math.random().toString(36).substring(7);
}
```

### Logging Context
```typescript
const logging = createNamespace('logging');

function log(level: string, message: string, metadata?: any) {
  const context = {
    requestId: logging.get('requestId'),
    userId: logging.get('userId'),
    timestamp: new Date().toISOString(),
  };

  console.log(`[${level}]`, { ...context, message, ...metadata });
}

async function handleRequest(req: any) {
  await logging.runPromise(async () => {
    logging.set('requestId', req.id);
    logging.set('userId', req.user?.id);

    log('info', 'Request started');

    await processRequest();

    log('info', 'Request completed');
  });
}

async function processRequest() {
  // Context automatically available
  log('debug', 'Processing request');
}
```

## 🎯 Why Polyglot?

### The Problem
**Before**: Each language requires different context management

```
Node.js: cls-hooked, async_hooks
Python: contextvars, manual propagation
Ruby: Thread.current, fiber-local
Java: ThreadLocal, InheritableThreadLocal

Result:
❌ Different APIs
❌ Manual context propagation
❌ Inconsistent behavior
❌ Complex async handling
```

### The Solution
**After**: One Elide context library for all languages

```
┌────────────────────────────────┐
│  Elide cls-hooked (TypeScript)│
│  elide-cls-hooked.ts          │
└────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │ Script │  │Service │
    └────────┘  └────────┘  └────────┘

Benefits:
✅ One context API
✅ Automatic propagation
✅ Consistent behavior
✅ Shared patterns
```

## 📖 API Reference

### `createNamespace(name)`
Create or retrieve a namespace

### `getNamespace(name)`
Get an existing namespace

### `destroyNamespace(name)`
Destroy a namespace

### Namespace Methods
- `run(fn)` - Run function in new context
- `runPromise(fn)` - Run async function in new context
- `bind(fn)` - Bind function to current context
- `get(key)` - Get value from context
- `set(key, value)` - Set value in context
- `enter(context)` - Enter a context
- `exit(context)` - Exit a context

## 🧪 Testing

```bash
elide run elide-cls-hooked.ts
```

## 📂 Files

- `elide-cls-hooked.ts` - Main implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm cls-hooked package](https://www.npmjs.com/package/cls-hooked)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~8M/week
- **Use case**: Continuation-local storage
- **Elide advantage**: One context library for all languages
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One context to bind them all.*
