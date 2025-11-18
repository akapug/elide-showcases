# express-useragent - Express UA Middleware - Elide Polyglot Showcase

> **One UA middleware for ALL languages** - TypeScript, Python, Ruby, and Java

Express middleware for parsing User-Agent with detailed device info.

## ✨ Features

- ✅ Express middleware integration
- ✅ Detailed browser, OS, platform detection
- ✅ Mobile, tablet, desktop classification
- ✅ Bot detection
- ✅ Device flags (iPhone, iPad, Android, etc.)
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript (Express)
```typescript
import express from 'express';
import { middleware, parse } from './elide-express-useragent.ts';

const app = express();

// Use as middleware
app.use(middleware());

app.get('/', (req, res) => {
  console.log(req.useragent.isMobile);   // true/false
  console.log(req.useragent.browser);    // 'Chrome'
  console.log(req.useragent.os);         // 'iOS'

  if (req.useragent.isMobile) {
    res.render('mobile/home');
  } else {
    res.render('desktop/home');
  }
});

// Or parse directly
const ua = 'Mozilla/5.0 ... iPhone ...';
const parsed = parse(ua);
console.log(parsed.isiPhone);  // true
```

### Python (Flask)
```python
from elide import require
express_ua = require('./elide-express-useragent.ts')

@app.route('/')
def home():
    ua = request.headers.get('User-Agent', '')
    parsed = express_ua.parse(ua)

    if parsed['isMobile']:
        return render_template('mobile/home.html')
    else:
        return render_template('desktop/home.html')
```

## 💡 Real-World Use Cases

### 1. Mobile Redirect
```typescript
app.get('/', (req, res) => {
  if (req.useragent.isMobile) {
    res.redirect('/mobile');
  } else {
    res.render('desktop/home');
  }
});
```

### 2. Conditional API Response
```typescript
app.get('/api/content', (req, res) => {
  const layout = req.useragent.isMobile ? 'mobile' : 'desktop';

  res.json({
    layout,
    browser: req.useragent.browser,
    version: req.useragent.version,
  });
});
```

### 3. Analytics Tracking
```typescript
app.use((req, res, next) => {
  analytics.track('page_view', {
    is_mobile: req.useragent.isMobile,
    browser: req.useragent.browser,
    os: req.useragent.os,
  });
  next();
});
```

## 📖 API Reference

### `parse(userAgent: string): UserAgentData`

Parse a user agent string.

```typescript
interface UserAgentData {
  // Device type
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isBot: boolean;

  // Browser
  browser: string;    // 'Chrome', 'Firefox', 'Safari', etc.
  version: string;    // '120.0'

  // OS
  os: string;         // 'iOS', 'Android', 'Windows', etc.
  platform: string;   // 'iPhone', 'Android Mobile', etc.

  // Device flags
  isiPhone: boolean;
  isiPad: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;

  // Browser flags
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  isIE: boolean;

  // Source
  source: string;  // Original UA string
}
```

### `middleware(): Function`

Express middleware function.

```typescript
app.use(middleware());

// Access via req.useragent
app.get('/', (req, res) => {
  console.log(req.useragent.isMobile);
});
```

## 📝 Package Stats

- **npm downloads**: ~300K+/week
- **Use case**: Express UA middleware
- **Elide advantage**: Works across all web frameworks

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making UA middleware consistent, everywhere.*
