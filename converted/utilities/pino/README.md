# Pino - Fast JSON Logger - Elide Polyglot Showcase

> **One fast JSON logger for ALL languages** - TypeScript, Python, Ruby, and Java

An extremely fast JSON logger designed for Node.js and polyglot applications with low overhead and structured logging.

## 🌟 Why This Matters

Different languages use different JSON logging libraries:
- `json-log` in Python has different API
- `logger` with JSON formatter in Ruby
- `logback` with JSON in Java requires complex config
- Each has different JSON structures

**Elide solves this** with ONE fast JSON logger that works in ALL languages.

## ✨ Features

- ✅ Extremely fast performance
- ✅ JSON structured logging
- ✅ Low overhead
- ✅ Child loggers with bindings
- ✅ Custom serializers
- ✅ Multiple log levels
- ✅ Timestamp support
- ✅ Object and string messages
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import pino from './elide-pino.ts';

const logger = pino();

// Basic logging
logger.info('Application started');
logger.warn('Warning message');
logger.error('Error occurred');

// With objects
logger.info('User login', { userId: 123, ip: '192.168.1.1' });
```

### Python
```python
from elide import require
pino = require('./elide-pino.ts')

logger = pino()
logger.info('Application started')
logger.info('User login', {'userId': 123, 'ip': '192.168.1.1'})
```

### Ruby
```ruby
pino = Elide.require('./elide-pino.ts')

logger = pino.call()
logger.info('Application started')
logger.info('User login', {userId: 123, ip: '192.168.1.1'})
```

### Java
```java
Value pino = context.eval("js", "require('./elide-pino.ts')");
Value logger = pino.execute();

logger.invokeMember("info", "Application started");
Map<String, Object> data = Map.of("userId", 123, "ip", "192.168.1.1");
logger.invokeMember("info", "User login", data);
```

## 💡 Real-World Use Cases

### Production Logging
```typescript
import pino from './elide-pino.ts';

const logger = pino({
  name: 'my-app',
  level: 'info',
});

logger.info('Server started', { port: 3000 });
logger.error('Connection failed', { host: 'db.example.com', error: 'timeout' });
```

### Child Loggers
```typescript
const logger = pino();

// Create child with request context
const requestLogger = logger.child({ requestId: 'abc-123', userId: 456 });
requestLogger.info('Request started');
requestLogger.info('Processing payment');
requestLogger.info('Request completed');
// All logs include requestId and userId
```

### Custom Serializers
```typescript
const logger = pino({
  serializers: {
    user: (user) => ({ id: user.id, email: user.email }),
    error: (err) => ({ message: err.message, stack: err.stack }),
  },
});

logger.info('User action', {
  user: { id: 1, email: 'user@example.com', password: 'secret' },
});
// Password is omitted by serializer
```

## 📖 API Reference

### `pino(options?)`
Create a new pino logger

Options:
- `level`: Minimum log level ('trace', 'debug', 'info', 'warn', 'error', 'fatal')
- `name`: Logger name
- `serializers`: Custom serializers for objects
- `base`: Base object included in all logs
- `timestamp`: Include timestamp (default: true)

### Logger Methods
- `logger.trace(msg, obj?)` - Trace level
- `logger.debug(msg, obj?)` - Debug level
- `logger.info(msg, obj?)` - Info level
- `logger.warn(msg, obj?)` - Warning level
- `logger.error(msg, obj?)` - Error level
- `logger.fatal(msg, obj?)` - Fatal level
- `logger.child(bindings)` - Create child logger

## 🧪 Testing

```bash
elide run elide-pino.ts
```

## 📂 Files

- `elide-pino.ts` - Main implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm pino package](https://www.npmjs.com/package/pino)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~15M/week
- **Use case**: Fast JSON logging
- **Elide advantage**: One fast logger for all languages
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Fast logging everywhere.*
