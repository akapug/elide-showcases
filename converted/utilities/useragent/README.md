# useragent - Advanced User Agent Parser - Elide Polyglot Showcase

> **One UA analyzer for ALL languages** - TypeScript, Python, Ruby, and Java

Parse and analyze User-Agent strings with versioning support for feature gating and browser compatibility.

## ✨ Features

- ✅ Detailed browser detection with version comparisons
- ✅ OS family and version parsing
- ✅ Device type classification
- ✅ Browser family grouping (Chromium, Gecko, WebKit)
- ✅ Version comparison utilities (>=, >, <=, <)
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { parse, getBrowserFamily, isModernBrowser } from './elide-useragent.ts';

// Parse UA
const ua = 'Mozilla/5.0 ... Chrome/120.0.0.0 ...';
const parsed = parse(ua);

console.log(parsed.browser.toString());  // 'Chrome 120.0.0'
console.log(parsed.os.toString());       // 'Windows 10.0'
console.log(parsed.device.toString());   // 'Desktop'

// Version comparison
console.log(parsed.browser.satisfies('>=100'));  // true
console.log(parsed.browser.satisfies('>=130'));  // false

// Browser family
console.log(getBrowserFamily(ua));  // 'Chromium'

// Modern browser check
console.log(isModernBrowser(ua));  // true
```

### Python
```python
from elide import require
useragent = require('./elide-useragent.ts')

ua = 'Mozilla/5.0 ... Chrome/120.0.0.0 ...'
parsed = useragent.parse(ua)

print(parsed['browser'].toString())  # 'Chrome 120.0.0'
print(parsed['browser'].satisfies('>=100'))  # True
```

### Ruby
```ruby
useragent = Elide.require('./elide-useragent.ts')

ua = 'Mozilla/5.0 ... Chrome/120.0.0.0 ...'
parsed = useragent.parse(ua)

puts parsed[:browser].toString()  # 'Chrome 120.0.0'
puts useragent.isModernBrowser(ua)  # true
```

### Java
```java
Value useragent = context.eval("js", "require('./elide-useragent.ts')");

String ua = "Mozilla/5.0 ... Chrome/120.0.0.0 ...";
Value parsed = useragent.invokeMember("parse", ua);

String browser = parsed.getMember("browser").invokeMember("toString").asString();
boolean modern = useragent.invokeMember("isModernBrowser", ua).asBoolean();
```

## 💡 Real-World Use Cases

### 1. Feature Gating
```typescript
import { parse } from './elide-useragent.ts';

function canUseWebP(ua: string): boolean {
  const parsed = parse(ua);

  if (parsed.browser.family === 'Chrome') return parsed.browser.satisfies('>=23');
  if (parsed.browser.family === 'Firefox') return parsed.browser.satisfies('>=65');
  if (parsed.browser.family === 'Safari') return parsed.browser.satisfies('>=14');

  return false;
}

app.get('/images/:id', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const format = canUseWebP(ua) ? 'webp' : 'jpg';
  res.sendFile(`/images/${req.params.id}.${format}`);
});
```

### 2. Browser Compatibility Warnings
```typescript
import { parse, isModernBrowser } from './elide-useragent.ts';

app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';

  if (!isModernBrowser(ua)) {
    req.showBrowserWarning = true;
  }

  next();
});
```

### 3. A/B Testing by Browser Family
```typescript
import { getBrowserFamily } from './elide-useragent.ts';

function getExperimentVariant(ua: string): 'A' | 'B' {
  const family = getBrowserFamily(ua);

  // Show new design to Chromium browsers
  if (family === 'Chromium') return 'B';

  return 'A';
}
```

## 📖 API Reference

### `parse(userAgent: string): ParsedUA`

Parse a user agent string.

```typescript
interface ParsedUA {
  browser: UserAgent;  // { family, major, minor, patch, toString(), satisfies() }
  os: OS;              // { family, major, minor, patch, toString() }
  device: Device;      // { family, toString() }
}
```

### `UserAgent.satisfies(range: string): boolean`

Check if browser version satisfies a range.

Supported operators: `>=`, `>`, `<=`, `<`, exact version

```typescript
browser.satisfies('>=100')    // true if version >= 100
browser.satisfies('>100')     // true if version > 100
browser.satisfies('100.0.0')  // true if exact match
```

### `getBrowserFamily(ua: string): string`

Get browser family for grouping.

Returns: `'Chromium'`, `'Gecko'`, `'WebKit'`, `'Trident'`, `'Other'`

### `isModernBrowser(ua: string): boolean`

Check if browser supports ES6+.

Criteria:
- Chrome >= 51
- Firefox >= 54
- Safari >= 10
- Edge >= 15

## 📝 Package Stats

- **npm downloads**: ~500K+/week
- **Use case**: Feature gating and browser compatibility
- **Elide advantage**: Consistent versioning across all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making UA parsing advanced, everywhere.*
