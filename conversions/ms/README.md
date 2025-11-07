# MS - Time Duration Parser - Elide Polyglot Showcase

> **One time duration parser for ALL languages** - TypeScript, Python, Ruby, and Java

Parse human-readable time strings (`'2h'`, `'5m'`, `'30s'`) with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

Configuration is **hard to read** when you mix units:
- `setTimeout(fn, 30000)` ← What is this? 30 seconds? 30 minutes?
- `timedelta(seconds=300)` ← Verbose and language-specific
- Different formats = copy-paste errors = production bugs

**Elide solves this** with ONE parser that works in ALL languages: `ms('5m')` → `300000`

## ✨ Features

- ✅ Parse time strings: `'2h'` → `7200000` milliseconds
- ✅ Format milliseconds: `7200000` → `'2h'`
- ✅ Multiple units: years, weeks, days, hours, minutes, seconds, ms
- ✅ Long format: `'1 hour'` or short: `'1h'`
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Human-readable configuration
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import ms from './elide-ms.ts';

const timeout = ms('30s');       // 30000
const delay = ms('5 minutes');   // 300000
const ttl = ms('2h');            // 7200000

console.log(ms(60000));          // "1m"
console.log(ms(3600000, { long: true }));  // "1 hour"
```

### Python
```python
from elide import require
ms = require('./elide-ms.ts')

timeout = ms('30s')       # 30000
delay = ms('5 minutes')   # 300000
ttl = ms('2h')            # 7200000
```

### Ruby
```ruby
ms = Elide.require('./elide-ms.ts')

timeout = ms('30s')       # 30000
delay = ms('5 minutes')   # 300000
ttl = ms('2h')            # 7200000
```

### Java
```java
Value ms = context.eval("js", "require('./elide-ms.ts')");

long timeout = ms.invokeMember("parse", "30s").asLong();  // 30000
long delay = ms.invokeMember("parse", "5m").asLong();      // 300000
```

## 📊 Supported Units

| Format | Example | Milliseconds |
|--------|---------|--------------|
| Years | `'1y'`, `'1 year'` | 31557600000 |
| Weeks | `'2w'`, `'2 weeks'` | 1209600000 |
| Days | `'3d'`, `'3 days'` | 259200000 |
| Hours | `'4h'`, `'4 hours'` | 14400000 |
| Minutes | `'5m'`, `'5 minutes'` | 300000 |
| Seconds | `'30s'`, `'30 seconds'` | 30000 |
| Milliseconds | `'500ms'` | 500 |

## 💡 Real-World Use Cases

### API Timeouts
```typescript
// config.yml
api_timeout: '30s'
db_timeout: '10s'
cache_ttl: '5m'

// Same format in Node.js, Python, Ruby, Java!
const timeout = ms(config.api_timeout);
```

### Rate Limiting
```typescript
// Limit: 100 requests per hour
const window = ms('1h');  // 3600000ms
const limit = 100;
```

### Cache Expiration
```typescript
// Redis TTL
redis.setex('key', ms('5m') / 1000, value);  // 5 minutes
```

### Background Jobs
```python
# Celery delay
task.apply_async(args=[data], countdown=ms('5m') / 1000)
```

## 🎯 Why Polyglot?

### The Problem

**Before**: Each language configures timeouts differently

```
Node.js:  setTimeout(fn, 30000)          ← milliseconds
Python:   time.sleep(30)                 ← seconds
Ruby:     sleep 30                       ← seconds
Java:     TimeUnit.SECONDS.toMillis(30)  ← verbose
```

**Issues**:
- 4 different formats
- Easy to mix up units (30 seconds vs 30000 milliseconds)
- Configuration files are unreadable
- Copy-paste errors

### The Solution

**After**: One Elide implementation for all languages

```
┌─────────────────────────────────────┐
│     Elide MS (TypeScript)          │
│     elide-ms.ts                    │
└─────────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │Workers │  │Sidekiq │
    └────────┘  └────────┘  └────────┘
         ↓
    All use: ms('30s') → 30000
    ✅ Same format everywhere
```

## 📖 API Reference

### `ms(value: string | number, options?: { long?: boolean }): number | string`

**Parse time string to milliseconds**:
```typescript
ms('2h')        // 7200000
ms('5 minutes') // 300000
ms('30s')       // 30000
```

**Format milliseconds to string**:
```typescript
ms(60000)                    // "1m"
ms(3600000, { long: true })  // "1 hour"
```

## 🧪 Testing

### Run the demo
```bash
/tmp/elide-1.0.0-beta10-linux-amd64/elide run elide-ms.ts
```

### Run the benchmark
```bash
/tmp/elide-1.0.0-beta10-linux-amd64/elide run benchmark.ts
```

## 📂 Files in This Showcase

- `elide-ms.ts` - Main TypeScript implementation
- `elide-ms.py` - Python integration example
- `elide-ms.rb` - Ruby integration example
- `ElideMsExample.java` - Java integration example
- `benchmark.ts` - Performance comparison
- `CASE_STUDY.md` - Real-world migration story (FinServ Inc)
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm ms package](https://www.npmjs.com/package/ms) (original, ~40M downloads/week)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~40M/week (original ms package)
- **Use case**: Universal (every language needs time parsing)
- **Elide advantage**: One implementation for all languages
- **Polyglot score**: 47/50 (S-Tier) - Critical polyglot showcase

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making time human-readable, everywhere.*
