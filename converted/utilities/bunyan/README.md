# Bunyan - JSON Logging Library - Elide Polyglot Showcase

> **One JSON logger for ALL languages** - TypeScript, Python, Ruby, and Java

A simple and fast JSON logging library for Node.js services with structured logging support.

## ✨ Features

- ✅ Structured JSON logging
- ✅ Multiple log levels (trace, debug, info, warn, error, fatal)
- ✅ Child loggers with context
- ✅ Custom serializers
- ✅ Request ID tracking
- ✅ Error serialization
- ✅ Simple API
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { createLogger } from './elide-bunyan.ts';

const logger = createLogger({ name: 'my-app' });

logger.info('Application started');
logger.warn({ userId: 123 }, 'User action');
logger.error(new Error('Failed'), 'Operation error');
```

## 📖 API Reference

### `createLogger(options)`
Create logger with name and optional level, serializers

### Logger Methods
- `trace/debug/info/warn/error/fatal(msg)` - Log message
- `trace/debug/info/warn/error/fatal(obj, msg)` - Log with object
- `child(fields)` - Create child logger

## 📝 Package Stats

- **npm downloads**: ~8M/week
- **Use case**: JSON logging for services
- **Elide advantage**: One JSON logger for all languages
- **Polyglot score**: 48/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
