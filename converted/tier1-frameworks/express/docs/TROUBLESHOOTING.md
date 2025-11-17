# Troubleshooting Guide

> Common issues and solutions for Express on Elide

## Table of Contents

- [Installation Issues](#installation-issues)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)
- [Polyglot Issues](#polyglot-issues)
- [Testing Issues](#testing-issues)
- [Common Error Messages](#common-error-messages)

## Installation Issues

### "elide: command not found"

**Symptom:**
```bash
$ elide --version
bash: elide: command not found
```

**Solution:**

```bash
# Install Elide globally
npm install -g @elide/cli

# Verify installation
which elide
elide --version

# If still not found, check npm global path
npm config get prefix
# Add to PATH if needed
export PATH="$PATH:$(npm config get prefix)/bin"
```

### "GraalVM not found"

**Symptom:**
```
Error: GraalVM is not installed or not in PATH
```

**Solution:**

```bash
# Option 1: Using SDKMAN (recommended)
sdk install java 21.0.1-graal
sdk use java 21.0.1-graal

# Option 2: Manual download
# Download from https://www.graalvm.org/downloads/
# Extract and add to PATH
export GRAALVM_HOME=/path/to/graalvm
export PATH=$GRAALVM_HOME/bin:$PATH

# Verify
java -version  # Should show GraalVM
```

### Module Not Found Errors

**Symptom:**
```
Error: Cannot find module '@elide/express'
```

**Solution:**

```bash
# Check package.json
cat package.json | grep elide

# Install dependencies
npm install

# Clear cache if needed
rm -rf node_modules package-lock.json
npm install

# For development, link locally
cd /path/to/elide-express
npm link
cd /path/to/your-project
npm link @elide/express
```

## Runtime Errors

### Port Already in Use

**Symptom:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

```bash
# Find process using port
lsof -i :3000
# Or
netstat -an | grep 3000

# Kill the process
kill -9 <PID>

# Or use a different port
const PORT = process.env.PORT || 3001;
```

### "ReferenceError: Polyglot is not defined"

**Symptom:**
```typescript
ReferenceError: Polyglot is not defined
```

**Solution:**

This happens when running with Node.js instead of Elide:

```bash
# Don't run with Node.js
node app.ts  # ❌

# Run with Elide
elide run app.ts  # ✓

# Or add fallback in your code
const POLYGLOT_AVAILABLE = typeof Polyglot !== 'undefined';

if (POLYGLOT_AVAILABLE) {
  // Use Polyglot
} else {
  // Fallback for Node.js
  console.warn('Polyglot not available');
}
```

### TypeError: Cannot read property 'params'

**Symptom:**
```
TypeError: Cannot read property 'params' of undefined
```

**Solution:**

Check middleware order:

```typescript
// Wrong order
app.get('/users/:id', (req, res) => {
  console.log(req.params.id);  // ❌ req might be undefined
});
app.use(express.json());  // Too late!

// Correct order
app.use(express.json());  // ✓ Middleware first
app.get('/users/:id', (req, res) => {
  console.log(req.params.id);  // ✓ Works
});
```

### Headers Already Sent

**Symptom:**
```
Error: Cannot set headers after they are sent to the client
```

**Solution:**

You're sending multiple responses:

```typescript
// Don't do this
app.get('/user', (req, res) => {
  res.json({ user: 'John' });
  res.send('Done');  // ❌ Headers already sent
});

// Do this
app.get('/user', (req, res) => {
  res.json({ user: 'John' });
  return;  // ✓ Exit early
});

// Or this (middleware)
app.use((req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send('Unauthorized');  // ✓ Return
  }
  next();
});
```

## Performance Issues

### Slow First Requests

**Symptom:**
```
First 100 requests: 50ms each
After 1000 requests: 5ms each
```

**Solution:**

This is normal! GraalVM JIT needs warm-up:

```typescript
// Add warm-up phase
async function warmup() {
  console.log('Warming up JIT...');

  for (let i = 0; i < 1000; i++) {
    await fetch('http://localhost:3000/health');
  }

  console.log('✓ JIT warm-up complete');
}

app.listen(3000, async () => {
  if (process.env.NODE_ENV === 'production') {
    await warmup();
  }
  console.log('Server ready');
});
```

### Memory Usage Growing

**Symptom:**
```
Memory starts at 50MB, grows to 500MB over time
```

**Solution:**

1. **Check for memory leaks:**

```typescript
// Don't store unbounded data
const cache = {};  // ❌ Will grow forever

app.get('/data/:id', (req, res) => {
  cache[req.params.id] = { /* data */ };  // Memory leak!
});

// Use bounded cache
import LRU from 'lru-cache';
const cache = new LRU({ max: 1000 });  // ✓ Limited size
```

2. **Force garbage collection (development only):**

```bash
elide run --expose-gc app.ts
```

```typescript
if (global.gc && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    global.gc();
    console.log('Memory:', process.memoryUsage());
  }, 60000);
}
```

### Low Throughput

**Symptom:**
```
Expected: 20K rps
Actual: 3K rps
```

**Solution:**

1. **Check system limits:**

```bash
# Increase file descriptors
ulimit -n 10000

# Check current limits
ulimit -a
```

2. **Enable optimizations:**

```bash
# Run with optimizations
elide run --optimize app.ts
```

3. **Profile to find bottlenecks:**

```bash
elide run --profile cpu app.ts
```

4. **Check for blocking operations:**

```typescript
// Don't block event loop
app.get('/slow', (req, res) => {
  const result = heavyComputation();  // ❌ Blocks
  res.json(result);
});

// Use async or workers
app.get('/fast', async (req, res) => {
  const result = await heavyComputationAsync();  // ✓ Non-blocking
  res.json(result);
});
```

## Polyglot Issues

### Python Import Errors

**Symptom:**
```
Python error: ModuleNotFoundError: No module named 'numpy'
```

**Solution:**

```bash
# Install Python support
gu install python

# Install packages with graalpy
graalpy -m pip install numpy pandas

# Or use venv
graalpy -m venv myenv
source myenv/bin/activate
pip install numpy pandas

# Then in code
const np = Polyglot.eval('python', `
import sys
sys.path.append('/path/to/myenv/lib/python3.11/site-packages')
import numpy as np
np
`);
```

### Ruby Gem Errors

**Symptom:**
```
Ruby error: cannot load such file -- activesupport
```

**Solution:**

```bash
# Install Ruby support
gu install ruby

# Install gems
gem install activesupport

# Or use bundler
bundle install

# Then in code
const result = Polyglot.eval('ruby', `
require 'bundler/setup'
require 'active_support/core_ext/string'

->(text) { text.titleize }
`);
```

### Polyglot Type Conversion

**Symptom:**
```
Python returns <foreign object>, can't access properties
```

**Solution:**

Convert foreign objects explicitly:

```typescript
// Python returns foreign object
const pythonDict = pythonFunc();  // { 'key': 'value' }

// Convert to JS object
const jsObject = {};
for (const key of Object.keys(pythonDict)) {
  jsObject[key] = pythonDict[key];
}

// Or use Polyglot API
const jsObject2 = Polyglot.eval('js', 'x => Object.fromEntries(Object.entries(x))')(pythonDict);
```

## Testing Issues

### Tests Timeout

**Symptom:**
```
Test timeout: exceeded 5000ms
```

**Solution:**

Increase timeout for JIT warm-up:

```typescript
// Jest
jest.setTimeout(30000);  // 30 seconds

// Mocha
this.timeout(30000);

// Or in test
it('handles request', async () => {
  // Warm up first
  for (let i = 0; i < 100; i++) {
    await request(app).get('/');
  }

  // Then test
  const res = await request(app).get('/');
  expect(res.status).toBe(200);
}, 30000);  // Timeout
```

### Port Conflicts in Tests

**Symptom:**
```
Test 1 passes
Test 2 fails: EADDRINUSE
```

**Solution:**

Use unique ports for each test:

```typescript
describe('API Tests', () => {
  let server;
  const PORT = 4000 + Math.floor(Math.random() * 1000);

  beforeAll((done) => {
    server = app.listen(PORT, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('works', async () => {
    const res = await request(`http://localhost:${PORT}`).get('/');
    expect(res.status).toBe(200);
  });
});
```

## Common Error Messages

### "Error: middleware must be a function"

**Cause:** Passing non-function to `app.use()`

**Solution:**
```typescript
// Wrong
app.use(myModule);  // ❌ Module object

// Right
app.use(myModule.middleware);  // ✓ Middleware function
```

### "Cannot GET /path"

**Cause:** No route handler registered

**Solution:**
```typescript
// Make sure route is registered
app.get('/path', (req, res) => {
  res.send('OK');
});

// Check route order
app.get('/users/:id', handler1);  // More specific first
app.get('/users/new', handler2);  // This will never match!

// Fix order
app.get('/users/new', handler2);  // ✓ Specific first
app.get('/users/:id', handler1);
```

### "SyntaxError: Unexpected token"

**Cause:** Using CommonJS in ES module mode

**Solution:**
```typescript
// Don't use CommonJS
const express = require('express');  // ❌
module.exports = app;  // ❌

// Use ES modules
import express from '@elide/express';  // ✓
export default app;  // ✓
```

## Getting More Help

If you're still stuck:

1. **Check Examples:**
   - [examples/](../examples/) - Working examples
   - [tests/](../tests/) - Test cases

2. **Enable Debug Logging:**
   ```bash
   DEBUG=express:* elide run app.ts
   ```

3. **Check GraalVM Compatibility:**
   - https://www.graalvm.org/latest/reference-manual/js/

4. **Ask for Help:**
   - GitHub Issues
   - Stack Overflow (tag: elide, graalvm)
   - Discord/Slack community

5. **Report Bugs:**
   - Include: Elide version, OS, minimal reproduction
   - Run with `--verbose` flag for detailed logs

## Debugging Tips

### Enable Verbose Logging

```bash
elide run --verbose app.ts
```

### Inspect Request/Response

```typescript
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body
  });

  const originalSend = res.send.bind(res);
  res.send = function(data) {
    console.log('Response:', data);
    return originalSend(data);
  };

  next();
});
```

### Check Runtime Environment

```typescript
console.log('Runtime:', {
  isGraalVM: typeof Polyglot !== 'undefined',
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  memory: process.memoryUsage()
});
```

---

**Still having issues?** Open an issue with:
- Elide version (`elide --version`)
- Operating system
- Minimal code reproduction
- Full error message
- What you've tried
