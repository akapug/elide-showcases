# ua-parser-js - User Agent Parser - Elide Polyglot Showcase

> **One UA parser for ALL languages** - TypeScript, Python, Ruby, and Java

Parse User-Agent strings to extract browser, engine, OS, device, and CPU info with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

User-Agent strings contain valuable information:
- Browser: Chrome, Firefox, Safari, Edge
- OS: Windows, macOS, Linux, iOS, Android
- Device: mobile, tablet, desktop
- CPU architecture: x64, arm64

**Elide ua-parser-js solves this** with ONE parser that works in ALL languages.

## ✨ Features

- ✅ Extract browser name and version
- ✅ Detect OS (Windows, macOS, Linux, iOS, Android)
- ✅ Identify device type (mobile, tablet, desktop)
- ✅ Parse engine (WebKit, Blink, Gecko)
- ✅ CPU architecture detection
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Fast regex matching
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { parse, getBrowser, getOS, isMobile } from './elide-ua-parser-js.ts';

// Parse full UA
const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15';
const result = parse(ua);

console.log(result.browser);  // { name: 'Safari', version: '17.1' }
console.log(result.os);       // { name: 'iOS', version: '17.1' }
console.log(result.device);   // { type: 'mobile', vendor: 'Apple', model: 'iPhone' }

// Quick helpers
console.log(getBrowser(ua));  // 'Safari'
console.log(getOS(ua));       // 'iOS'
console.log(isMobile(ua));    // true
```

### Python
```python
from elide import require
ua_parser = require('./elide-ua-parser-js.ts')

# Parse UA
ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
result = ua_parser.parse(ua)

print(result['browser']['name'])  # 'Chrome'
print(result['os']['name'])       # 'Windows'
print(ua_parser.isMobile(ua))     # False
```

### Ruby
```ruby
ua_parser = Elide.require('./elide-ua-parser-js.ts')

# Parse UA
ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X)'
result = ua_parser.parse(ua)

puts result[:browser][:name]  # 'Safari'
puts result[:os][:name]       # 'iOS'
puts ua_parser.isMobile(ua)   # true
```

### Java
```java
Value uaParser = context.eval("js", "require('./elide-ua-parser-js.ts')");

String ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0";
Value result = uaParser.invokeMember("parse", ua);

String browser = result.getMember("browser").getMember("name").asString();  // "Chrome"
String os = result.getMember("os").getMember("name").asString();  // "Windows"
boolean mobile = uaParser.invokeMember("isMobile", ua).asBoolean();  // false
```

## 💡 Real-World Use Cases

### 1. Analytics Dashboard
```typescript
import { parse } from './elide-ua-parser-js.ts';

function trackPageView(req: Request) {
  const ua = req.headers['user-agent'] || '';
  const parsed = parse(ua);

  analytics.track('page_view', {
    browser: parsed.browser.name,
    browser_version: parsed.browser.version,
    os: parsed.os.name,
    device_type: parsed.device.type || 'desktop',
  });
}
```

### 2. Serve Mobile/Desktop Content
```typescript
import { isMobile } from './elide-ua-parser-js.ts';

app.get('/', (req, res) => {
  const ua = req.headers['user-agent'] || '';

  if (isMobile(ua)) {
    res.render('mobile/home');
  } else {
    res.render('desktop/home');
  }
});
```

### 3. Browser Feature Detection
```typescript
import { parse } from './elide-ua-parser-js.ts';

function supportsWebP(ua: string): boolean {
  const parsed = parse(ua);
  const browser = parsed.browser.name;
  const version = parseInt(parsed.browser.version || '0');

  if (browser === 'Chrome') return version >= 23;
  if (browser === 'Firefox') return version >= 65;
  if (browser === 'Safari') return version >= 14;
  if (browser === 'Edge') return version >= 18;

  return false;
}
```

### 4. Responsive Images
```typescript
import { parse } from './elide-ua-parser-js.ts';

app.get('/api/images/:id', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const parsed = parse(ua);

  let imageSize = 'large';
  if (parsed.device.type === 'mobile') imageSize = 'small';
  if (parsed.device.type === 'tablet') imageSize = 'medium';

  const image = getImage(req.params.id, imageSize);
  res.sendFile(image);
});
```

### 5. Browser Compatibility Warning
```typescript
import { parse } from './elide-ua-parser-js.ts';

app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  const parsed = parse(ua);

  if (parsed.browser.name === 'IE') {
    res.render('unsupported-browser');
    return;
  }

  next();
});
```

## 📖 API Reference

### `parse(userAgent: string): UAResult`

Parse a user agent string and return all information.

```typescript
interface UAResult {
  browser: { name: string | null; version: string | null };
  engine: { name: string | null; version: string | null };
  os: { name: string | null; version: string | null };
  device: { type: string | null; vendor: string | null; model: string | null };
  cpu: { architecture: string | null };
}
```

### `getBrowser(userAgent: string): string | null`

Get browser name.

```typescript
getBrowser('Mozilla/5.0 ... Chrome/120.0.0.0')  // 'Chrome'
getBrowser('Mozilla/5.0 ... Firefox/121.0')     // 'Firefox'
getBrowser('Mozilla/5.0 ... Safari/605.1.15')   // 'Safari'
```

### `getOS(userAgent: string): string | null`

Get OS name.

```typescript
getOS('Mozilla/5.0 (Windows NT 10.0; ...)')  // 'Windows'
getOS('Mozilla/5.0 (Macintosh; ...')         // 'macOS'
getOS('Mozilla/5.0 (iPhone; ...')            // 'iOS'
getOS('Mozilla/5.0 (Linux; Android ...')     // 'Android'
```

### `getDevice(userAgent: string): string | null`

Get device type.

```typescript
getDevice('Mozilla/5.0 (iPhone; ...')   // 'mobile'
getDevice('Mozilla/5.0 (iPad; ...')     // 'tablet'
getDevice('Mozilla/5.0 (Windows ...')   // null (desktop)
```

### `isMobile(userAgent: string): boolean`

Check if user agent is a mobile or tablet device.

```typescript
isMobile('Mozilla/5.0 (iPhone; ...)')   // true
isMobile('Mozilla/5.0 (iPad; ...)')     // true
isMobile('Mozilla/5.0 (Android; Mobile ...)')  // true
isMobile('Mozilla/5.0 (Windows NT ...)')  // false
```

## 🧪 Testing

### Run the demo
```bash
elide run elide-ua-parser-js.ts
```

Expected output:
```
🔍 ua-parser-js - User Agent Parser for Elide (POLYGLOT!)

=== Example 1: Parse User Agents ===
Browser: Chrome 120.0
OS: Windows 10/11
Device: desktop

Browser: Chrome 120.0
OS: macOS 10.15
Device: desktop

=== Example 2: Browser Distribution ===
Chrome: 6 (75%)
Firefox: 1 (12%)
Safari: 1 (12%)
```

## 🎯 Why Polyglot?

### The Problem

**Before**: Each language has different UA parsers

```
Node.js:  ua-parser-js (5M+/week)
Python:   user-agents library
Ruby:     browser gem
Java:     UserAgentUtils
```

**Issues**:
- Different parsing logic = inconsistent results
- Different device classifications
- Hard to maintain across services

### The Solution

**After**: One Elide implementation for all languages

```
┌─────────────────────────────────────┐
│  Elide ua-parser-js (TypeScript)   │
│  elide-ua-parser-js.ts             │
└─────────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │Workers │  │  Rails │
    └────────┘  └────────┘  └────────┘

    ✅ Same parsing everywhere
```

## 📊 Supported Browsers

- Chrome, Edge, Opera
- Firefox
- Safari
- Internet Explorer

## 📊 Supported Operating Systems

- Windows (7, 8, 10, 11)
- macOS (10.x, 11.x, 12.x, 13.x)
- iOS (all versions)
- Android (all versions)
- Linux

## 📝 Package Stats

- **npm downloads**: ~5M+/week (ua-parser-js package)
- **Use case**: Device detection for analytics, responsive design, and feature detection
- **Elide advantage**: One implementation for all languages
- **Comprehensive parsing** for all major browsers and devices

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making UA parsing consistent, everywhere.*
