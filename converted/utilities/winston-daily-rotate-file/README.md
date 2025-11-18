# Winston Daily Rotate File - Elide Polyglot Showcase

> **Log rotation for ALL languages** - TypeScript, Python, Ruby, and Java

A Winston transport for rotating log files daily with size limits and retention.

## ✨ Features

- ✅ Daily log rotation
- ✅ File size limits
- ✅ Date-based filenames
- ✅ Retention policies
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import DailyRotateFile from './elide-winston-daily-rotate-file.ts';

const transport = new DailyRotateFile({
  filename: 'app-%DATE%.log',
  maxSize: '20m',
  maxFiles: '14d',
});

transport.log('info', 'Application started');
```

## 📝 Package Stats

- **npm downloads**: ~5M/week
- **Use case**: Log file rotation
- **Polyglot score**: 46/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
