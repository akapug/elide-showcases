# Migration Guide - From Node.js to Elide Polyfills

**Complete guide for migrating Node.js applications to Elide runtime**

---

## 🎯 Overview

This guide helps you migrate existing Node.js applications to Elide runtime using our polyfills. Most Node.js code will work with minimal changes.

---

## 📦 Quick Migration Checklist

- [ ] Install Elide 1.0.0-beta11-rc1+
- [ ] Replace `require()` with `import`
- [ ] Update file paths to use polyfills
- [ ] Test all functionality
- [ ] Update TypeScript types (if applicable)
- [ ] Remove Node.js-specific code

---

## 🔄 Import Changes

### Before (Node.js)

```javascript
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');
const os = require('os');
const util = require('util');
const { URL } = require('url');
const querystring = require('querystring');
const assert = require('assert');
```

### After (Elide with Polyfills)

```typescript
import { EventEmitter } from './polyfills/node/events.ts';
import * as path from './polyfills/node/path.ts';
import * as fs from './polyfills/node/fs.ts';
import * as os from './polyfills/node/os.ts';
import * as util from './polyfills/node/util.ts';
import { URL, URLSearchParams } from './polyfills/node/url.ts';
import * as querystring from './polyfills/node/querystring.ts';
import * as assert from './polyfills/node/assert.ts';
```

### With Auto-Inject

```typescript
// One-time setup
import { setupAll } from './polyfills/compat/auto-inject.ts';
await setupAll({ verbose: true });

// Now use APIs directly
const emitter = new EventEmitter();
const fullPath = path.join('/home', 'user', 'file.txt');
```

---

## 🔧 Common Migration Patterns

### 1. EventEmitter Pattern

**Before (Node.js):**
```javascript
const EventEmitter = require('events');

class MyClass extends EventEmitter {
  doSomething() {
    this.emit('data', { value: 42 });
  }
}

const instance = new MyClass();
instance.on('data', (data) => {
  console.log(data);
});
```

**After (Elide):**
```typescript
import { EventEmitter } from './polyfills/node/events.ts';

class MyClass extends EventEmitter {
  doSomething() {
    this.emit('data', { value: 42 });
  }
}

const instance = new MyClass();
instance.on('data', (data) => {
  console.log(data);
});
```

**Changes:** Just the import statement!

---

### 2. File System Operations

**Before (Node.js):**
```javascript
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
```

**After (Elide):**
```typescript
import * as fs from './polyfills/node/fs.ts';
import * as path from './polyfills/node/path.ts';

const configPath = path.join('/app', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
```

**Changes:**
- Import statements
- Replace `__dirname` with explicit path (or use polyfill)

---

### 3. Async/Await with Promises

**Before (Node.js):**
```javascript
const fs = require('fs').promises;
const util = require('util');

async function loadConfig() {
  const data = await fs.readFile('/config.json', 'utf8');
  return JSON.parse(data);
}
```

**After (Elide):**
```typescript
import * as fs from './polyfills/node/fs.ts';

async function loadConfig() {
  const data = await fs.promises.readFile('/config.json', 'utf8');
  return JSON.parse(data);
}
```

**Changes:** Import statements only!

---

### 4. URL Parsing

**Before (Node.js):**
```javascript
const { URL } = require('url');

const url = new URL('https://example.com/path?query=value');
console.log(url.hostname); // example.com
console.log(url.pathname); // /path
```

**After (Elide):**
```typescript
import { URL } from './polyfills/node/url.ts';

const url = new URL('https://example.com/path?query=value');
console.log(url.hostname); // example.com
console.log(url.pathname); // /path
```

**Changes:** Import statement only!

---

### 5. Testing with Assert

**Before (Node.js):**
```javascript
const assert = require('assert');

function test() {
  assert.strictEqual(1 + 1, 2);
  assert.deepStrictEqual({ a: 1 }, { a: 1 });
}
```

**After (Elide):**
```typescript
import * as assert from './polyfills/node/assert.ts';

function test() {
  assert.strictEqual(1 + 1, 2);
  assert.deepStrictEqual({ a: 1 }, { a: 1 });
}
```

**Changes:** Import statement only!

---

## 🌐 Web API Integration

### localStorage

**Before (Browser):**
```javascript
localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme');
```

**After (Elide):**
```typescript
import { localStorage } from './polyfills/web/storage.ts';

localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme');
```

---

### WebSocket

**Before (Browser):**
```javascript
const ws = new WebSocket('wss://example.com');
ws.onopen = () => ws.send('Hello');
ws.onmessage = (event) => console.log(event.data);
```

**After (Elide):**
```typescript
import { WebSocket } from './polyfills/web/websocket.ts';

const ws = new WebSocket('wss://example.com');
ws.onopen = () => ws.send('Hello');
ws.onmessage = (event) => console.log(event.data);
```

---

## ⚠️ Known Limitations

### Not Implemented (Yet)

These Node.js modules are not yet implemented in the polyfills:

- `child_process` - Process spawning
- `cluster` - Multi-process clustering
- `stream` - Stream APIs (partial support)
- `crypto` - Cryptographic functions (use Web Crypto)
- `http` - HTTP server (use Elide's native HTTP in beta11)
- `https` - HTTPS server
- `net` - TCP networking
- `dgram` - UDP networking

### Workarounds

1. **HTTP Server**: Use Elide beta11's native HTTP support
   ```typescript
   // Use native Elide beta11 HTTP
   export default async function fetch(req: Request): Promise<Response> {
     return new Response('Hello!');
   }
   ```

2. **Crypto**: Use Web Crypto API (available in Elide)
   ```typescript
   const subtle = crypto.subtle;
   const hash = await subtle.digest('SHA-256', data);
   ```

3. **Streams**: Use Web Streams API
   ```typescript
   const stream = new ReadableStream({
     start(controller) {
       controller.enqueue(data);
       controller.close();
     }
   });
   ```

---

## 🚀 Performance Tips

### 1. Use Async APIs

**Slower:**
```typescript
const data = fs.readFileSync('/large-file.txt', 'utf8');
```

**Faster:**
```typescript
const data = await fs.promises.readFile('/large-file.txt', 'utf8');
```

### 2. Batch File Operations

**Slower:**
```typescript
for (const file of files) {
  fs.writeFileSync(file, data);
}
```

**Faster:**
```typescript
await Promise.all(
  files.map(file => fs.promises.writeFile(file, data))
);
```

### 3. Reuse Instances

**Slower:**
```typescript
function process() {
  const emitter = new EventEmitter();
  // ...
}
```

**Faster:**
```typescript
const emitter = new EventEmitter(); // Reuse

function process() {
  // Use emitter
}
```

---

## 🔍 Debugging Tips

### Enable Verbose Logging

```typescript
import { setupAll } from './polyfills/compat/auto-inject.ts';

await setupAll({
  verbose: true,  // Log all injections
  nodeAPIs: true,
  webAPIs: true
});
```

### Check Feature Availability

```typescript
import { features } from './polyfills/compat/auto-inject.ts';

console.log('Has EventEmitter:', features.hasEventEmitter);
console.log('Has WebSocket:', features.hasWebSocket);
console.log('Is Elide:', features.isElide);
```

### Test Individual Modules

```bash
# Test each polyfill individually
elide run polyfills/node/events.ts
elide run polyfills/node/path.ts
elide run polyfills/node/fs.ts
```

---

## 📊 Migration Examples

### Express.js-style Router

**Before (Node.js + Express):**
```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello' });
});

app.listen(3000);
```

**After (Elide beta11):**
```typescript
export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === '/' && req.method === 'GET') {
    return new Response(JSON.stringify({ message: 'Hello' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', { status: 404 });
}
```

---

### Configuration Loader

**Before (Node.js):**
```javascript
const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  const data = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(data);
}
```

**After (Elide):**
```typescript
import * as fs from './polyfills/node/fs.ts';
import * as path from './polyfills/node/path.ts';

function loadConfig() {
  const configPath = path.join('/app', 'config.json');
  const data = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(data);
}
```

---

### Event-Driven Service

**Before (Node.js):**
```javascript
const EventEmitter = require('events');

class DataService extends EventEmitter {
  async fetchData() {
    const data = await fetch('https://api.example.com/data');
    this.emit('data', await data.json());
  }
}

const service = new DataService();
service.on('data', (data) => {
  console.log('Received:', data);
});
```

**After (Elide):**
```typescript
import { EventEmitter } from './polyfills/node/events.ts';

class DataService extends EventEmitter {
  async fetchData() {
    const data = await fetch('https://api.example.com/data');
    this.emit('data', await data.json());
  }
}

const service = new DataService();
service.on('data', (data) => {
  console.log('Received:', data);
});
```

---

## ✅ Testing Migrated Code

### Unit Tests

```typescript
import * as assert from './polyfills/node/assert.ts';

function testMigration() {
  // Test path operations
  const result = path.join('/home', 'user', 'file.txt');
  assert.strictEqual(result, '/home/user/file.txt');

  // Test file operations
  fs.writeFileSync('/test.txt', 'content');
  const content = fs.readFileSync('/test.txt', 'utf8');
  assert.strictEqual(content, 'content');

  console.log('✓ All migration tests passed');
}
```

### Integration Tests

```typescript
async function testIntegration() {
  // Load config
  const config = JSON.parse(
    fs.readFileSync('/config.json', 'utf8')
  );

  // Process data
  const service = new DataService(config);
  await service.start();

  // Verify results
  assert.strictEqual(service.isRunning(), true);
}
```

---

## 🎓 Best Practices

1. **Use TypeScript** - Get full type safety
2. **Test thoroughly** - Test all migrated functionality
3. **Use async/await** - Prefer promises over callbacks
4. **Handle errors** - Add proper error handling
5. **Monitor performance** - Check performance on Elide
6. **Document changes** - Note any behavioral differences
7. **Keep updated** - Use latest polyfill versions

---

## 📚 Additional Resources

- **Elide Documentation**: https://elide.dev/docs
- **Node.js API Reference**: https://nodejs.org/api/
- **Polyfills README**: ../README.md
- **Type Definitions**: ../types/index.d.ts
- **Test Examples**: ../tests/README.md

---

## 🤝 Need Help?

- **GitHub Issues**: Report issues or ask questions
- **Documentation**: Check API documentation
- **Examples**: See built-in examples in each module

---

**Migration is straightforward - most code works with just import changes! 🚀**
