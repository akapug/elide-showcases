# Winston - Universal Logging Library - Elide Polyglot Showcase

> **One logging library for ALL languages** - TypeScript, Python, Ruby, and Java

A versatile logging library designed for simplicity and universal compatibility with multiple transports and log levels.

## 🌟 Why This Matters

Different languages use different logging libraries with inconsistent formats:
- `logging` in Python has different API than winston
- `logger` in Ruby requires different setup
- `log4j` in Java is complex and verbose
- Each language has its own log format and levels

**Elide solves this** with ONE logging library that works in ALL languages with a consistent API.

## ✨ Features

- ✅ Multiple log levels (error, warn, info, debug, verbose)
- ✅ Custom transports (console, file, etc.)
- ✅ Formatted output
- ✅ Metadata support
- ✅ Multiple loggers
- ✅ Child loggers with inherited metadata
- ✅ Timestamp support
- ✅ Colored console output
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { createLogger } from './elide-winston.ts';

const logger = createLogger();

// Basic logging
logger.error('Critical error occurred');
logger.warn('Warning message');
logger.info('Information message');
logger.debug('Debug message');

// With metadata
logger.info('User login', { userId: 123, ip: '192.168.1.1' });
```

### Python
```python
from elide import require
winston = require('./elide-winston.ts')

logger = winston.createLogger()

# Basic logging
logger.error('Critical error occurred')
logger.info('User login', {'userId': 123, 'ip': '192.168.1.1'})
```

### Ruby
```ruby
winston = Elide.require('./elide-winston.ts')

logger = winston.createLogger()

# Basic logging
logger.error('Critical error occurred')
logger.info('User login', {userId: 123, ip: '192.168.1.1'})
```

### Java
```java
Value winston = context.eval("js", "require('./elide-winston.ts')");
Value logger = winston.invokeMember("createLogger");

// Basic logging
logger.invokeMember("error", "Critical error occurred");
Map<String, Object> meta = Map.of("userId", 123, "ip", "192.168.1.1");
logger.invokeMember("info", "User login", meta);
```

## 💡 Real-World Use Cases

### Application Logging
```typescript
import { createLogger, ConsoleTransport, FileTransport } from './elide-winston.ts';

const logger = createLogger({
  level: 'info',
  transports: [
    new ConsoleTransport(),
    new FileTransport('app.log'),
  ],
  defaultMeta: { service: 'api' },
});

logger.info('Application started');
logger.error('Database connection failed', { error: 'timeout' });
```

### Child Loggers
```typescript
const logger = createLogger();

// Create child logger with request context
const requestLogger = logger.child({ requestId: 'abc-123' });
requestLogger.info('Request started');
requestLogger.info('Processing payment');
requestLogger.info('Request completed');
// All logs include requestId
```

### Microservice Logging
```typescript
const logger = createLogger({
  defaultMeta: {
    service: 'user-service',
    version: '1.0.0',
    environment: 'production',
  },
});

logger.info('User created', { userId: 456 });
logger.warn('Rate limit approaching', { current: 95, limit: 100 });
```

## 🎯 Why Polyglot?

### The Problem
**Before**: Each language requires different logging libraries

```
Node.js: winston, pino, bunyan
Python: logging, loguru, structlog
Ruby: logger, logging, semantic_logger
Java: log4j, slf4j, logback

Result:
❌ Different log formats
❌ Inconsistent metadata
❌ Complex log aggregation
❌ Different APIs to learn
```

### The Solution
**After**: One Elide logging library for all languages

```
┌────────────────────────────────┐
│  Elide Winston (TypeScript)   │
│  elide-winston.ts             │
└────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │ Script │  │Service │
    └────────┘  └────────┘  └────────┘

Benefits:
✅ One logging standard
✅ Consistent log format
✅ Easy log aggregation
✅ Shared configuration
```

## 📖 API Reference

### `createLogger(options?)`
Create a new logger instance

Options:
- `level`: Minimum log level to output
- `format`: Custom format function
- `transports`: Array of transports
- `defaultMeta`: Default metadata for all logs

### Logger Methods
- `logger.error(message, metadata?)` - Log error
- `logger.warn(message, metadata?)` - Log warning
- `logger.info(message, metadata?)` - Log info
- `logger.http(message, metadata?)` - Log HTTP request
- `logger.verbose(message, metadata?)` - Log verbose
- `logger.debug(message, metadata?)` - Log debug
- `logger.silly(message, metadata?)` - Log silly
- `logger.child(metadata)` - Create child logger

### Transports
- `ConsoleTransport` - Log to console with colors
- `FileTransport(filename)` - Log to file

## 🧪 Testing

```bash
elide run elide-winston.ts
```

## 📂 Files

- `elide-winston.ts` - Main implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm winston package](https://www.npmjs.com/package/winston)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~40M/week
- **Use case**: Universal logging library
- **Elide advantage**: One logger for all languages
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One logger to rule them all.*
