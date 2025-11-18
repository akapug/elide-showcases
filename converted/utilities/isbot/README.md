# isbot - Bot Detection Library - Elide Polyglot Showcase

> **One bot detector for ALL languages** - TypeScript, Python, Ruby, and Java

Identify bots, crawlers, and spiders from User-Agent strings with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

Bot traffic can skew analytics and waste resources:
- Googlebot, Bingbot crawling your site
- Social media bots previewing links
- Malicious scrapers stealing content
- Monitoring services pinging endpoints

**Elide isbot solves this** with ONE detector that works in ALL languages.

## ✨ Features

- ✅ Detect 1000+ known bots and crawlers
- ✅ Search engines: Google, Bing, Yahoo, DuckDuckGo
- ✅ Social media: Facebook, Twitter, LinkedIn, Pinterest
- ✅ SEO tools: Ahrefs, Semrush, Moz, Majestic
- ✅ Monitoring: UptimeRobot, Pingdom, StatusCake
- ✅ Headless browsers: Puppeteer, Playwright, PhantomJS
- ✅ HTTP clients: curl, wget, Python requests, axios
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Fast pattern matching
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { isbot, detectBot, getBotCategory } from './elide-isbot.ts';

// Basic detection
const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
console.log(isbot(ua));  // true

// Get bot name
console.log(detectBot(ua));  // 'Googlebot'

// Get category
console.log(getBotCategory(ua));  // 'search'

// Real user
const userUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
console.log(isbot(userUA));  // false
```

### Python
```python
from elide import require
isbot = require('./elide-isbot.ts')

# Basic detection
ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
print(isbot.isbot(ua))  # True

# Get bot name
print(isbot.detectBot(ua))  # 'Googlebot'

# Filter real users
user_agents = [...]
real_users = [ua for ua in user_agents if not isbot.isbot(ua)]
```

### Ruby
```ruby
isbot = Elide.require('./elide-isbot.ts')

# Basic detection
ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
puts isbot.isbot(ua)  # true

# Get bot name
puts isbot.detectBot(ua)  # 'Googlebot'

# Express-style middleware
def bot_filter(request)
  user_agent = request.headers['User-Agent']
  if isbot.isbot(user_agent)
    puts "Bot detected: #{isbot.detectBot(user_agent)}"
  end
end
```

### Java
```java
Value isbot = context.eval("js", "require('./elide-isbot.ts')");

String ua = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
boolean bot = isbot.invokeMember("isbot", ua).asBoolean();  // true

String botName = isbot.invokeMember("detectBot", ua).asString();  // "Googlebot"
String category = isbot.invokeMember("getBotCategory", ua).asString();  // "search"
```

## 💡 Real-World Use Cases

### 1. Analytics Filtering
```typescript
import { isbot } from './elide-isbot.ts';

function trackPageView(req: Request) {
  const userAgent = req.headers['user-agent'];

  if (isbot(userAgent)) {
    return; // Don't count bots in analytics
  }

  analytics.track('page_view', {
    path: req.path,
    user_agent: userAgent
  });
}
```

### 2. Express Middleware
```typescript
import { isbot, detectBot } from './elide-isbot.ts';

app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'];

  if (isbot(userAgent)) {
    req.isBot = true;
    req.botName = detectBot(userAgent);
    console.log(`🤖 Bot: ${req.botName}`);
  }

  next();
});
```

### 3. Serve Cached Pages to Bots
```typescript
import { isbot, isSearchBot } from './elide-isbot.ts';

app.get('/product/:id', async (req, res) => {
  const userAgent = req.headers['user-agent'];

  // Serve cached version to search bots
  if (isSearchBot(userAgent)) {
    const cached = await cache.get(req.path);
    if (cached) return res.send(cached);
  }

  // Serve fresh content to real users
  const product = await db.products.findById(req.params.id);
  res.render('product', { product });
});
```

### 4. Rate Limiting (Different Rules for Bots)
```typescript
import { isbot, getBotCategory } from './elide-isbot.ts';

function getRateLimit(userAgent: string): number {
  if (!isbot(userAgent)) {
    return 100; // 100 req/min for users
  }

  const category = getBotCategory(userAgent);
  if (category === 'search') return 300; // Allow search engines
  if (category === 'monitoring') return 10; // Limit monitoring bots
  return 50; // Default for other bots
}
```

### 5. Block Malicious Crawlers
```typescript
import { isbot, detectBot } from './elide-isbot.ts';

const BLOCKED_BOTS = ['Scrapy', 'Screaming Frog'];

app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'];
  const botName = detectBot(userAgent);

  if (botName && BLOCKED_BOTS.includes(botName)) {
    return res.status(403).send('Forbidden');
  }

  next();
});
```

## 📖 API Reference

### `isbot(userAgent: string): boolean`

Check if a user agent string represents a bot.

```typescript
isbot('Mozilla/5.0 (compatible; Googlebot/2.1)')  // true
isbot('Mozilla/5.0 (Windows NT 10.0) Chrome/120')  // false
```

### `detectBot(userAgent: string): string | null`

Get the bot name/type if it's a bot.

```typescript
detectBot('Mozilla/5.0 (compatible; Googlebot/2.1)')  // 'Googlebot'
detectBot('facebookexternalhit/1.1')  // 'Facebook Bot'
detectBot('UptimeRobot/2.0')  // 'UptimeRobot'
detectBot('Mozilla/5.0 (Windows NT 10.0)')  // null
```

### `getBotCategory(userAgent: string): string | null`

Get the bot category.

Categories: `'search'`, `'social'`, `'seo'`, `'monitoring'`, `'headless'`, `'http-client'`, `'other'`

```typescript
getBotCategory('Googlebot/2.1')  // 'search'
getBotCategory('Twitterbot/1.0')  // 'social'
getBotCategory('AhrefsBot/7.0')  // 'seo'
getBotCategory('UptimeRobot/2.0')  // 'monitoring'
```

### `isSearchBot(userAgent: string): boolean`

Check if user agent is a search engine bot.

```typescript
isSearchBot('Googlebot/2.1')  // true
isSearchBot('bingbot/2.0')  // true
```

### `isSocialBot(userAgent: string): boolean`

Check if user agent is a social media bot.

```typescript
isSocialBot('facebookexternalhit/1.1')  // true
isSocialBot('Twitterbot/1.0')  // true
```

### `isMonitoringBot(userAgent: string): boolean`

Check if user agent is a monitoring service.

```typescript
isMonitoringBot('UptimeRobot/2.0')  // true
isMonitoringBot('Pingdom.com_bot')  // true
```

## 🧪 Testing

### Run the demo
```bash
elide run elide-isbot.ts
```

Expected output:
```
🤖 isbot - Bot Detection for Elide (POLYGLOT!)

=== Example 1: Basic Bot Detection ===
👤 USER: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0
🤖 BOT : Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google...)
🤖 BOT : Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com...)

=== Example 2: Detect Bot Names ===
Googlebot: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/b...
Bingbot: Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingb...
```

## 🎯 Why Polyglot?

### The Problem

**Before**: Each language has different bot detection

```
Node.js:  isbot package (500K+/week)
Python:   user-agents library
Ruby:     browser gem
Java:     UserAgentUtils
```

**Issues**:
- Different bot lists = inconsistent filtering
- Update one service, others out of sync
- Bots detected in Node.js but not in Python

### The Solution

**After**: One Elide implementation for all languages

```
┌─────────────────────────────────────┐
│     Elide isbot (TypeScript)       │
│     elide-isbot.ts                 │
└─────────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │Workers │  │  Rails │
    └────────┘  └────────┘  └────────┘

    ✅ Same bot detection everywhere
```

## 🤖 Detected Bots

### Search Engines
- Googlebot, Bingbot, Yahoo Slurp
- DuckDuckBot, Baiduspider, YandexBot

### Social Media
- Facebook Bot, Twitter Bot, LinkedIn Bot
- Pinterest Bot, Slack Bot, Telegram Bot

### SEO Tools
- AhrefsBot, SemrushBot, DotBot
- Moz RogerBot, Majestic Bot, Screaming Frog

### Monitoring Services
- UptimeRobot, Pingdom, StatusCake
- Site24x7, New Relic Pinger

### Headless Browsers
- Headless Chrome, PhantomJS
- Puppeteer, Playwright, Selenium

### HTTP Clients
- curl, wget, Python requests
- axios, node-fetch, Go HTTP client

## 📝 Package Stats

- **npm downloads**: ~500K+/week (isbot package)
- **Use case**: Bot detection for analytics, security, and content serving
- **Elide advantage**: One implementation for all languages
- **1000+ bot patterns** included

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making bot detection consistent, everywhere.*
