# Troubleshooting Common Issues

**Complete troubleshooting guide for Elide applications**

Find solutions to common problems, error messages, and unexpected behaviors when developing with Elide.

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [Runtime Errors](#runtime-errors)
- [Import Errors](#import-errors)
- [HTTP Server Issues](#http-server-issues)
- [Performance Problems](#performance-problems)
- [Polyglot Issues](#polyglot-issues)
- [Database Connection Issues](#database-connection-issues)
- [Deployment Problems](#deployment-problems)
- [Getting Help](#getting-help)

---

## Installation Issues

### Issue: Command not found after installation

**Symptoms:**
```bash
$ elide --version
bash: elide: command not found
```

**Solution:**

Add Elide to your PATH:

```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$HOME/.elide/bin:$PATH"

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc

# Verify
elide --version
```

**Alternative:** Use full path:
```bash
~/.elide/bin/elide run server.ts
```

---

### Issue: Installation script fails

**Symptoms:**
```bash
curl -sSL https://elide.sh | bash
# Error: Cannot download...
```

**Solutions:**

1. **Check internet connection**:
```bash
ping elide.dev
```

2. **Try alternative installation**:
```bash
# Download specific version
curl -sSL https://elide.sh | bash -s - --install-rev=1.0.0-beta11-rc1
```

3. **Manual installation**:
```bash
# Download binary
wget https://github.com/elide-dev/elide/releases/download/v1.0.0-beta11-rc1/elide-linux-x64

# Make executable
chmod +x elide-linux-x64

# Move to bin
sudo mv elide-linux-x64 /usr/local/bin/elide
```

---

## Runtime Errors

### Issue: Module not found

**Symptoms:**
```
Error: Cannot find module 'express'
```

**Cause:** Trying to use npm packages (Elide doesn't support npm packages)

**Solution:**

Use local imports or inline code:

```typescript
// ❌ Wrong
import express from "express";

// ✅ Correct - Use native HTTP
import { createServer } from "http";

// ✅ Correct - Use local file
import { myFunction } from "./utils.ts";
```

---

### Issue: SyntaxError: Unexpected token

**Symptoms:**
```
SyntaxError: Unexpected token '<'
```

**Causes:**
1. Importing HTML/JSON as JavaScript
2. Missing file extension
3. Invalid JavaScript syntax

**Solutions:**

1. **Add file extension**:
```typescript
// ❌ Wrong
import { fn } from "./module";

// ✅ Correct
import { fn } from "./module.ts";
```

2. **Check file content**:
```bash
# Verify file is valid TypeScript
cat module.ts
```

3. **Validate syntax**:
```bash
elide check module.ts
```

---

### Issue: TypeError: X is not a function

**Symptoms:**
```
TypeError: processData is not a function
```

**Causes:**
1. Incorrect import
2. Function not exported
3. Circular dependency

**Solutions:**

1. **Verify export**:
```typescript
// module.ts
export function processData(data: any) {  // Make sure 'export' is present
  return data;
}
```

2. **Check import**:
```typescript
// ❌ Wrong
import processData from "./module.ts";

// ✅ Correct
import { processData } from "./module.ts";
```

3. **Debug import**:
```typescript
import * as module from "./module.ts";
console.log(module);  // See what's actually exported
```

---

### Issue: Promise rejection not handled

**Symptoms:**
```
UnhandledPromiseRejectionWarning: Error: Something went wrong
```

**Cause:** Async function threw error without try/catch

**Solution:**

Always handle async errors:

```typescript
// ❌ Wrong
async function fetchData() {
  const data = await fetch(url);  // Can throw
  return data;
}

fetchData();  // Fire and forget - bad!

// ✅ Correct
async function fetchData() {
  try {
    const data = await fetch(url);
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
}

// Always await or catch
fetchData().catch(error => {
  console.error("Fatal error:", error);
});
```

---

## Import Errors

### Issue: Cannot resolve polyglot import

**Symptoms:**
```
Error: Cannot resolve import './module.py'
```

**Causes:**
1. File doesn't exist
2. Polyglot not supported for file type
3. File extension missing

**Solutions:**

1. **Verify file exists**:
```bash
ls -la module.py
```

2. **Check file extension**:
```typescript
// ✅ Must include extension
import { fn } from "./module.py";
```

3. **Verify polyglot syntax**:
```python
# module.py - Make sure functions are defined
def my_function():
    return "result"
```

---

### Issue: Circular dependency detected

**Symptoms:**
```
Error: Circular dependency detected: a.ts -> b.ts -> a.ts
```

**Cause:** Files import each other

**Solution:**

Refactor to remove circular dependency:

```typescript
// ❌ Wrong
// a.ts
import { functionB } from "./b.ts";
export function functionA() { return functionB(); }

// b.ts
import { functionA } from "./a.ts";
export function functionB() { return functionA(); }

// ✅ Correct - Extract shared code
// shared.ts
export function sharedFunction() { return "shared"; }

// a.ts
import { sharedFunction } from "./shared.ts";
export function functionA() { return sharedFunction(); }

// b.ts
import { sharedFunction } from "./shared.ts";
export function functionB() { return sharedFunction(); }
```

---

## HTTP Server Issues

### Issue: Port already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Cause:** Another process is using the port

**Solutions:**

1. **Find and kill process**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

2. **Use different port**:
```typescript
const PORT = parseInt(process.env.PORT || "3001");
server.listen(PORT);
```

3. **Check for running instances**:
```bash
ps aux | grep elide
```

---

### Issue: CORS error in browser

**Symptoms:**
```
Access to fetch at 'http://localhost:3000/api/data' from origin 'http://localhost:3001'
has been blocked by CORS policy
```

**Cause:** Missing CORS headers

**Solution:**

Add CORS headers:

```typescript
export default async function fetch(req: Request): Promise<Response> {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  const response = await handleRequest(req);

  // Add CORS to all responses
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
```

---

### Issue: Request body is empty

**Symptoms:**
```typescript
const data = await req.json();  // {}
```

**Causes:**
1. Request already consumed
2. Content-Type mismatch
3. Body not sent

**Solutions:**

1. **Clone request if reading multiple times**:
```typescript
const data1 = await req.clone().json();
const data2 = await req.json();
```

2. **Check Content-Type**:
```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

3. **Debug body**:
```typescript
const text = await req.text();
console.log("Raw body:", text);
```

---

### Issue: Response sent multiple times

**Symptoms:**
```
Error: Cannot send response multiple times
```

**Cause:** Returning response in multiple code paths

**Solution:**

Ensure single return:

```typescript
// ❌ Wrong
export default async function fetch(req: Request): Promise<Response> {
  const response = new Response("OK");

  if (condition) {
    return response;  // Return here
  }

  return response;  // And here - duplicate!
}

// ✅ Correct
export default async function fetch(req: Request): Promise<Response> {
  if (condition) {
    return new Response("Condition met");
  }

  return new Response("Default");
}
```

---

## Performance Problems

### Issue: Slow cold start

**Symptoms:** Server takes > 100ms to start

**Causes:**
1. Expensive module-level code
2. Large imports
3. Unnecessary initialization

**Solutions:**

1. **Lazy initialization**:
```typescript
// ❌ Bad - Runs on module load
const expensiveData = loadLargeFile();

export default async function fetch(req: Request): Promise<Response> {
  return new Response(JSON.stringify(expensiveData));
}

// ✅ Good - Lazy load
let expensiveData: any = null;

export default async function fetch(req: Request): Promise<Response> {
  if (!expensiveData) {
    expensiveData = await loadLargeFile();
  }
  return new Response(JSON.stringify(expensiveData));
}
```

2. **Profile startup**:
```bash
time elide run server.ts
```

---

### Issue: Memory leak

**Symptoms:** Memory usage grows over time

**Causes:**
1. Unbounded caches
2. Event listeners not removed
3. Global variables accumulating data

**Solutions:**

1. **Use LRU cache**:
```typescript
// ❌ Bad - Unbounded
const cache = new Map();
cache.set(key, value);  // Grows forever!

// ✅ Good - LRU cache
class LRUCache {
  private cache = new Map();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  set(key: string, value: any) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

2. **Monitor memory**:
```typescript
setInterval(() => {
  const used = process.memoryUsage();
  console.log({
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`
  });
}, 60000);
```

---

### Issue: Slow response times

**Symptoms:** API requests take > 1 second

**Causes:**
1. Slow database queries
2. N+1 query problem
3. Blocking operations
4. No caching

**Solutions:**

1. **Profile requests**:
```typescript
const start = performance.now();
const result = await slowOperation();
console.log(`Operation took ${performance.now() - start}ms`);
```

2. **Add caching**:
```typescript
const cache = new Map();

async function getData(key: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const data = await fetchData(key);
  cache.set(key, data);
  return data;
}
```

3. **Use batch operations**:
```typescript
// ❌ Bad - N+1 queries
for (const id of ids) {
  await fetchUser(id);
}

// ✅ Good - Batch query
await fetchUsers(ids);
```

---

## Polyglot Issues

### Issue: Python function not found

**Symptoms:**
```
Error: module.pythonFunction is not a function
```

**Causes:**
1. Function not exported
2. Import path wrong
3. Python syntax error

**Solutions:**

1. **Verify Python file**:
```python
# module.py
def my_function():  # Make sure it's defined
    return "result"

# Test Python file directly
if __name__ == "__main__":
    print(my_function())
```

2. **Test import**:
```typescript
import * as module from "./module.py";
console.log(Object.keys(module));  // See what's exported
```

---

### Issue: Type mismatch between languages

**Symptoms:**
```
TypeError: Cannot convert Python dict to JavaScript
```

**Cause:** Complex data types don't translate directly

**Solution:**

Use simple data types:

```python
# ✅ Good - Simple types
def get_data():
    return {
        "name": "Alice",
        "age": 30,
        "tags": ["user", "admin"]
    }

# ❌ Bad - Complex types
import numpy as np
def get_data():
    return np.array([1, 2, 3])  # NumPy array may not convert
```

---

### Issue: Slow cross-language calls

**Symptoms:** Polyglot calls take > 10ms

**Cause:** Overhead in type conversion

**Solution:**

Batch operations:

```typescript
// ❌ Bad - Many small calls
for (const item of items) {
  pythonFunction(item);  // 1000 calls * 1ms = 1000ms
}

// ✅ Good - One batch call
pythonBatchFunction(items);  // 1 call
```

---

## Database Connection Issues

### Issue: Connection refused

**Symptoms:**
```
Error: connect ECONNREFUSED localhost:5432
```

**Causes:**
1. Database not running
2. Wrong host/port
3. Firewall blocking

**Solutions:**

1. **Check database is running**:
```bash
# PostgreSQL
pg_isready -h localhost -p 5432

# Check if port is listening
netstat -an | grep 5432
```

2. **Verify connection string**:
```typescript
const dbUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/mydb";
console.log("Connecting to:", dbUrl);
```

3. **Test connection**:
```bash
# PostgreSQL
psql -h localhost -p 5432 -U user -d mydb

# MySQL
mysql -h localhost -P 3306 -u user -p
```

---

### Issue: Authentication failed

**Symptoms:**
```
Error: authentication failed for user "postgres"
```

**Causes:**
1. Wrong password
2. User doesn't exist
3. Insufficient permissions

**Solutions:**

1. **Verify credentials**:
```bash
# PostgreSQL - try manually
psql -h localhost -U postgres

# Reset password if needed
ALTER USER postgres PASSWORD 'newpassword';
```

2. **Check environment variables**:
```bash
echo $DATABASE_URL
```

3. **Grant permissions**:
```sql
GRANT ALL PRIVILEGES ON DATABASE mydb TO user;
```

---

## Deployment Problems

### Issue: Docker container won't start

**Symptoms:**
```
docker run my-app
Error: ...
Container exits immediately
```

**Solutions:**

1. **Check logs**:
```bash
docker logs <container-id>
```

2. **Run interactively**:
```bash
docker run -it my-app /bin/bash
# Debug inside container
```

3. **Verify Dockerfile**:
```dockerfile
# Make sure CMD is correct
CMD ["elide", "run", "src/server.ts"]
```

---

### Issue: Environment variables not set

**Symptoms:**
```
Error: Missing required environment variable: API_KEY
```

**Solution:**

Pass environment variables:

```bash
# Docker
docker run -e API_KEY=secret my-app

# Docker Compose
# docker-compose.yml
environment:
  - API_KEY=secret

# Kubernetes
# deployment.yaml
env:
- name: API_KEY
  valueFrom:
    secretKeyRef:
      name: app-secrets
      key: api-key
```

---

### Issue: Kubernetes pod crashes

**Symptoms:**
```
kubectl get pods
NAME        READY   STATUS             RESTARTS
my-app-xxx  0/1     CrashLoopBackOff   5
```

**Solutions:**

1. **Check logs**:
```bash
kubectl logs my-app-xxx
kubectl logs my-app-xxx --previous  # Previous crash
```

2. **Describe pod**:
```bash
kubectl describe pod my-app-xxx
```

3. **Check resource limits**:
```yaml
resources:
  limits:
    memory: "512Mi"  # May need more
    cpu: "500m"
```

---

## Getting Help

### Gather Information

When asking for help, provide:

1. **Elide version**:
```bash
elide --version
```

2. **Error message**:
```bash
# Full error with stack trace
elide run server.ts 2>&1 | tee error.log
```

3. **Minimal reproduction**:
```typescript
// Simplest code that reproduces the issue
export default async function fetch(req: Request): Promise<Response> {
  // Problem occurs here
  return new Response("OK");
}
```

4. **Environment**:
```bash
# OS
uname -a

# Node version (if relevant)
node --version

# Environment variables
env | grep -i elide
```

### Support Channels

- **Documentation**: https://elide.dev/docs
- **GitHub Issues**: https://github.com/elide-dev/elide/issues
- **GitHub Discussions**: https://github.com/elide-dev/elide/discussions
- **Discord**: https://elide.dev/discord

### Before Asking

1. ✅ Search existing issues
2. ✅ Check documentation
3. ✅ Try minimal reproduction
4. ✅ Include error messages
5. ✅ Describe what you tried

---

## Quick Reference

### Common Commands

```bash
# Run application
elide run server.ts

# Check syntax
elide check server.ts

# Show version
elide --version

# Get help
elide --help
```

### Debug Environment

```bash
# Enable debug logging
export DEBUG=true
elide run server.ts

# Increase verbosity
export LOG_LEVEL=debug
elide run server.ts

# Check PATH
echo $PATH

# Verify installation
which elide
elide --version
```

### Health Checks

```bash
# Test HTTP server
curl http://localhost:3000/health

# Test with verbose output
curl -v http://localhost:3000/

# Time request
curl -w "@curl-format.txt" http://localhost:3000/

# curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

---

## Next Steps

- **[Debugging Guide](./debugging.md)** - Advanced debugging techniques
- **[Performance Guide](./performance-optimization.md)** - Optimize your app
- **[Testing Guide](./testing.md)** - Write tests to prevent issues
- **[Getting Started](./getting-started.md)** - Review basics

---

## Summary

**Common Issues:**

1. **Installation**: Add to PATH, verify binary
2. **Imports**: Use relative paths with extensions
3. **HTTP**: Add CORS, check ports
4. **Performance**: Profile, optimize, cache
5. **Polyglot**: Simple types, batch operations
6. **Database**: Check connection, credentials
7. **Deployment**: Verify environment variables, logs

**Debugging Process:**

1. Read error message carefully
2. Check documentation
3. Create minimal reproduction
4. Add logging
5. Test in isolation
6. Ask for help with details

**Remember:**
- Most issues have simple solutions
- Error messages are helpful - read them!
- When stuck, start with basics
- Community is here to help

🚀 **Troubleshoot efficiently and keep building!**
