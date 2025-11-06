# Elide Shims and Workarounds

## Overview

This document tracks temporary Node.js shims and workarounds used in Elide showcases while waiting for Elide API maturity. These shims allow the showcases to demonstrate functionality that will eventually be replaced with native Elide APIs.

**Last Updated**: 2025-11-06
**Elide Version**: beta10

---

## Summary Statistics

- **Total Shims**: 11 distinct Node.js module categories
- **Files Affected**: 40+ source files across 9 showcases
- **Showcases Using Shims**: 9/9 (100%)
- **Most Common Shims**: `path` (16 files), `fs` (16 files), `crypto` (6 files), `child_process` (6 files)

---

## Active Shims

### 1. HTTP Server (`http.createServer`)

**Status**: ⚠️ Elide beta10 doesn't support native HTTP server API yet
**Timeline**: Coming this week (as of 2025-11-06)
**Priority**: HIGH - Blocking for production web applications

**Used in**:
- `showcases/ml-api/api/server.ts` - Sentiment analysis API server
- `showcases/ml-api/tests/benchmark.ts` - Performance testing
- `showcases/ml-api/tests/api-test.ts` - Integration tests
- `showcases/devops-tools/dashboard/server.ts` - Dashboard web server
- `showcases/fullstack-template/backend/server.ts` - Full-stack backend (fallback)

**Current Workaround**:
```typescript
import { createServer, IncomingMessage, ServerResponse } from 'http';

const server = createServer((req, res) => {
  // Handle requests
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
```

**Removal Instructions**:
1. Wait for Elide HTTP server API announcement
2. Replace `http.createServer()` with Elide's native `elide.serve()` or similar API
3. Update request/response handling to use Elide's native types
4. Test all HTTP endpoints and WebSocket connections
5. Update documentation to reflect Elide API usage

**Elide Issue**: Expected in upcoming beta release (check Elide changelog)

---

### 2. Crypto (`crypto.createHash`, `crypto.randomBytes`)

**Status**: ⚠️ Not yet implemented in Elide standard library
**Timeline**: Unknown - likely Q1 2025
**Priority**: MEDIUM - Important for security features

**Used in**:
- `showcases/ml-api/api/middleware.ts` - API key hashing, rate limiting
- `showcases/ml-api/api/routes.ts` - Request signature verification
- `showcases/cms-platform/backend/api-server.ts` - Password hashing, session tokens
- `showcases/cms-platform/media/media-manager.ts` - File integrity checksums
- `showcases/deploy-platform/cli/deploy-cli.ts` - Deployment verification
- `showcases/edge-compute/control-plane/function-manager.ts` - Function checksums

**Current Workaround**:
```typescript
import { createHash, randomBytes } from 'crypto';

// Hashing
const hash = createHash('sha256')
  .update(data)
  .digest('hex');

// Random generation
const token = randomBytes(32).toString('hex');
```

**Removal Instructions**:
1. Wait for Elide Crypto API release
2. Replace `crypto.createHash()` with `elide.crypto.hash()` or equivalent
3. Replace `crypto.randomBytes()` with `elide.crypto.randomBytes()` or equivalent
4. Verify hash compatibility for stored passwords/checksums
5. Update security documentation

**Elide Issue**: Track Elide stdlib development for crypto module

---

### 3. File System (`fs`, `fs/promises`, `fs.createReadStream`)

**Status**: ⚠️ Partial support - some APIs missing
**Timeline**: Q1 2025 for comprehensive file API
**Priority**: MEDIUM - Critical for data processing showcases

**Used in**:
- `showcases/data-pipeline/extractors/json-extractor.ts` - Read JSON files, streaming
- `showcases/data-pipeline/extractors/csv-extractor.ts` - Read CSV files, streaming
- `showcases/data-pipeline/orchestrator/pipeline.ts` - Pipeline config, archiving
- `showcases/data-pipeline/loaders/file-loader.ts` - Write processed data
- `showcases/devops-tools/dashboard/server.ts` - Serve static files
- `showcases/devops-tools/deployment/orchestrator.ts` - Read deployment configs
- `showcases/devops-tools/deployment/rollback.ts` - Backup/restore files
- `showcases/devops-tools/log-aggregator/collector.ts` - Read log files
- `showcases/devops-tools/log-aggregator/analyzer.ts` - Process log files
- `showcases/devops-tools/monitoring/alerts.ts` - Alert config files
- `showcases/devops-tools/monitoring/agent.ts` - Metrics storage
- `showcases/deploy-platform/cli/deploy-cli.ts` - Read deployment manifests
- `showcases/edge-compute/control-plane/function-manager.ts` - Function code management
- `showcases/fullstack-template/backend/server.ts` - Static file serving

**Current Workaround**:
```typescript
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';

// Async file operations
const data = await fs.readFile(path, 'utf-8');
await fs.writeFile(path, content);

// Streaming for large files
const stream = createReadStream(path);
```

**Removal Instructions**:
1. Check Elide file API documentation for available methods
2. Replace `fs.readFile()` with `elide.fs.readFile()` or equivalent
3. Replace `fs.writeFile()` with `elide.fs.writeFile()` or equivalent
4. Update streaming operations to use Elide stream APIs
5. Test all file I/O operations, especially large file handling
6. Update error handling for Elide-specific exceptions

**Elide Issue**: Track Elide stdlib file system module development

---

### 4. Path (`path.join`, `path.resolve`, `path.basename`, etc.)

**Status**: ⚠️ Not implemented in Elide standard library
**Timeline**: Q1 2025
**Priority**: LOW - Easy polyfill, mostly for convenience

**Used in**:
- `showcases/data-pipeline/extractors/json-extractor.ts` - File path resolution
- `showcases/data-pipeline/extractors/csv-extractor.ts` - File path resolution
- `showcases/data-pipeline/transformers/enricher.ts` - Config file paths
- `showcases/data-pipeline/orchestrator/pipeline.ts` - Archive paths
- `showcases/data-pipeline/loaders/file-loader.ts` - Output file paths
- `showcases/cms-platform/media/media-manager.ts` - Media file paths
- `showcases/devops-tools/dashboard/server.ts` - Static file paths
- `showcases/devops-tools/deployment/orchestrator.ts` - Deployment paths
- `showcases/devops-tools/deployment/rollback.ts` - Backup paths
- `showcases/devops-tools/log-aggregator/collector.ts` - Log file paths
- `showcases/devops-tools/log-aggregator/analyzer.ts` - Output paths
- `showcases/devops-tools/monitoring/alerts.ts` - Alert config paths
- `showcases/devops-tools/monitoring/agent.ts` - Metrics paths
- `showcases/deploy-platform/cli/deploy-cli.ts` - Manifest paths
- `showcases/edge-compute/control-plane/function-manager.ts` - Function paths
- `showcases/fullstack-template/backend/server.ts` - Frontend dist paths

**Current Workaround**:
```typescript
import * as path from 'path';
import { basename, extname, join } from 'path';

const fullPath = path.join(dir, file);
const filename = path.basename(fullPath);
```

**Removal Instructions**:
1. Option A: Wait for Elide path API
   - Replace `path.join()` with `elide.path.join()` or equivalent
2. Option B: Use string manipulation (cross-platform concerns)
   - Replace `path.join()` with template literals (less robust)
3. Option C: Keep as lightweight polyfill
   - Path module is simple enough to vendor

**Elide Issue**: Low priority - consider vendoring path utilities

---

### 5. Child Process (`child_process.spawn`)

**Status**: ⚠️ Not yet implemented - requires process isolation
**Timeline**: Unknown - complex security implications
**Priority**: MEDIUM - Needed for external tool integration

**Used in**:
- `showcases/data-pipeline/transformers/enricher.ts` - External data enrichment tools
- `showcases/ml-api/api/routes.ts` - Python ML model execution
- `showcases/devops-tools/deployment/orchestrator.ts` - Docker/kubectl commands
- `showcases/devops-tools/log-aggregator/collector.ts` - Log collection scripts
- `showcases/devops-tools/log-aggregator/analyzer.ts` - Log analysis tools
- `showcases/devops-tools/monitoring/agent.ts` - System monitoring commands

**Current Workaround**:
```typescript
import { spawn } from 'child_process';

const proc = spawn('python3', ['model.py', '--input', data]);
proc.stdout.on('data', (data) => {
  // Process output
});
```

**Removal Instructions**:
1. Wait for Elide subprocess API announcement
2. Evaluate security model (sandbox vs. full process access)
3. Replace `spawn()` with Elide's subprocess API
4. Review and update security policies for subprocess execution
5. Test all external tool integrations
6. Consider alternative: Native Elide polyglot calls instead of subprocesses

**Elide Issue**: May require architectural decision on subprocess support

**Alternative**: For Python/Ruby integration, use Elide's native polyglot capabilities instead of spawning processes.

---

### 6. Events (`EventEmitter`)

**Status**: ⚠️ Not in Elide standard library
**Timeline**: Q1 2025
**Priority**: LOW - Can use custom implementation

**Used in**:
- `showcases/data-pipeline/orchestrator/pipeline.ts` - Pipeline events
- `showcases/data-pipeline/orchestrator/monitor.ts` - Monitoring events
- `showcases/data-pipeline/orchestrator/scheduler.ts` - Scheduler events
- `showcases/edge-compute/control-plane/deployment-service.ts` - Deployment events

**Current Workaround**:
```typescript
import { EventEmitter } from 'events';

class Pipeline extends EventEmitter {
  run() {
    this.emit('start');
    // ... work
    this.emit('complete', results);
  }
}
```

**Removal Instructions**:
1. Option A: Wait for Elide EventEmitter
   - Replace with `elide.events.EventEmitter`
2. Option B: Vendor a lightweight EventEmitter
   - Copy EventEmitter implementation to shared utilities
   - Remove Node.js dependency
3. Option C: Use native browser EventTarget API
   - May be available in Elide runtime

**Elide Issue**: Low priority - easy to polyfill or vendor

---

### 7. Readline (`readline.createInterface`)

**Status**: ⚠️ Not implemented - TTY/stream specific
**Timeline**: Unknown
**Priority**: LOW - Specific use case for streaming

**Used in**:
- `showcases/data-pipeline/extractors/json-extractor.ts` - Stream JSON Lines files
- `showcases/data-pipeline/extractors/csv-extractor.ts` - Stream CSV files line-by-line

**Current Workaround**:
```typescript
import { createInterface } from 'readline';
import { createReadStream } from 'fs';

const rl = createInterface({
  input: createReadStream(path),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  // Process line
}
```

**Removal Instructions**:
1. Wait for Elide stream utilities
2. Replace with native stream processing APIs
3. Consider using `TextLineStream` if available
4. Test with large files to ensure memory efficiency

**Elide Issue**: Part of broader streaming API strategy

---

### 8. URL (`url.parse`)

**Status**: ⚠️ Node.js legacy API - modern alternatives exist
**Timeline**: Immediate - use Web URL API
**Priority**: LOW - Can use standard URL API

**Used in**:
- `showcases/ml-api/api/server.ts` - Parse request URLs

**Current Workaround**:
```typescript
import { parse as parseUrl } from 'url';

const parsed = parseUrl(req.url || '', true);
const path = parsed.pathname;
const query = parsed.query;
```

**Removal Instructions**:
1. **No waiting needed** - Use Web URL API (likely already supported)
2. Replace Node.js `url.parse()` with standard `new URL()`
   ```typescript
   const url = new URL(req.url, `http://${host}`);
   const path = url.pathname;
   const query = Object.fromEntries(url.searchParams);
   ```
3. Test URL parsing edge cases
4. Remove `url` import

**Elide Issue**: None - use standard Web APIs

---

### 9. OS (`os.cpus`, `os.freemem`, etc.)

**Status**: ⚠️ System info APIs not exposed
**Timeline**: Unknown - requires platform integration
**Priority**: LOW - Nice-to-have for monitoring

**Used in**:
- `showcases/devops-tools/monitoring/agent.ts` - System metrics collection

**Current Workaround**:
```typescript
import * as os from 'os';

const cpuCount = os.cpus().length;
const freeMem = os.freemem();
const totalMem = os.totalmem();
```

**Removal Instructions**:
1. Wait for Elide system info API
2. Replace `os.*` calls with Elide equivalents
3. Update monitoring agent to use Elide metrics
4. Consider: May not be available in sandboxed environments

**Elide Issue**: Depends on security model and platform access

---

### 10. Assert (`assert`, `assert.strict`)

**Status**: ⚠️ Testing utility not in stdlib
**Timeline**: Q1 2025 or use alternative test frameworks
**Priority**: LOW - Test-only dependency

**Used in**:
- `showcases/ml-api/tests/api-test.ts` - API integration tests
- `showcases/devops-tools/tests/integration.test.ts` - Integration tests

**Current Workaround**:
```typescript
import { strict as assert } from 'assert';

assert.strictEqual(actual, expected);
assert.ok(condition);
```

**Removal Instructions**:
1. Option A: Use modern test framework (Vitest, Jest, etc.)
   - Replace assert with framework assertions
2. Option B: Wait for Elide test utilities
   - Replace with `elide.test.assert()` or similar
3. Option C: Vendor simple assertion library
   - Copy lightweight assertion utilities

**Elide Issue**: Consider test framework recommendations

---

### 11. Querystring (`querystring.parse`)

**Status**: ⚠️ Node.js legacy API - modern alternatives exist
**Timeline**: Immediate - use URLSearchParams
**Priority**: LOW - Can use standard Web APIs

**Used in**:
- `showcases/ml-api/api/server.ts` - Parse URL-encoded form data

**Current Workaround**:
```typescript
import { parse as parseQuery } from 'querystring';

const params = parseQuery(body);
```

**Removal Instructions**:
1. **No waiting needed** - Use Web URLSearchParams API
2. Replace with standard API:
   ```typescript
   const params = Object.fromEntries(new URLSearchParams(body));
   ```
3. Test form data parsing
4. Remove `querystring` import

**Elide Issue**: None - use standard Web APIs

---

## Migration Priority

### Immediate (No Elide API needed)
1. ✅ **URL** - Use standard Web URL API
2. ✅ **Querystring** - Use standard URLSearchParams API

### High Priority (Blocking)
3. 🔴 **HTTP Server** - Coming this week - critical for web apps
4. 🔴 **Crypto** - Important for security - needed soon

### Medium Priority (Important)
5. 🟡 **File System** - Critical for data processing apps
6. 🟡 **Child Process** - May have polyglot alternative

### Low Priority (Can work around)
7. 🟢 **Path** - Easy to polyfill or vendor
8. 🟢 **Events** - Easy to polyfill or vendor
9. 🟢 **Readline** - Specific use case
10. 🟢 **OS** - Monitoring only
11. 🟢 **Assert** - Test-only, use modern frameworks

---

## Testing Strategy

When removing shims:

1. **Before Migration**:
   - Document all current behavior
   - Create comprehensive test cases
   - Benchmark performance metrics

2. **During Migration**:
   - Migrate one module at a time
   - Run full test suite after each change
   - Compare performance with baseline

3. **After Migration**:
   - Verify all showcases still work
   - Update documentation
   - Remove unused Node.js imports
   - Update package.json dependencies

---

## Showcase-Specific Notes

### api-gateway
- **Shims**: None! Pure Elide implementation
- **Status**: ✅ Ready for native Elide (uses abstract server interface)

### nanochat-lite
- **Shims**: None in server code (uses abstract interface)
- **Status**: ✅ Waiting for HTTP server API

### realtime-dashboard
- **Shims**: None in server code (uses abstract interface)
- **Status**: ✅ Waiting for HTTP server API + WebSocket support

### fullstack-template
- **Shims**: `fs`, `path`, `http` (fallback)
- **Status**: ⚠️ Has Bun.serve() as primary, http fallback

### ecommerce-platform
- **Shims**: None in server code
- **Status**: ✅ Ready for native Elide

### cms-platform
- **Shims**: `crypto`, `path`
- **Status**: ⚠️ Needs crypto API for password hashing

### devops-tools
- **Shims**: `http`, `fs`, `path`, `child_process`, `os`
- **Status**: ⚠️ Heavy Node.js usage - complex migration

### data-pipeline
- **Shims**: `fs`, `path`, `events`, `readline`, `child_process`
- **Status**: ⚠️ Heavy Node.js usage - needs stream APIs

### ml-api
- **Shims**: `http`, `crypto`, `url`, `querystring`, `assert`, `child_process`
- **Status**: ⚠️ Moderate Node.js usage

---

## Future Improvements

Once Elide APIs are mature:

1. **Create Migration Guide** - Step-by-step for each shim
2. **Automated Detection** - Script to find remaining Node.js imports
3. **Compatibility Layer** - Optional Node.js compatibility for gradual migration
4. **Performance Benchmarks** - Compare Node.js vs. native Elide APIs
5. **Best Practices** - Document idiomatic Elide patterns

---

## Questions for Elide Team

1. **HTTP Server Timeline**: Confirmed for this week?
2. **Crypto API**: Any ETA on hash functions and random generation?
3. **File System**: Which APIs will be available in next release?
4. **Child Process**: Is subprocess support planned, or should we use polyglot calls?
5. **Streams**: What's the streaming story for large file processing?
6. **WebSocket**: Native support or third-party library?
7. **Testing**: Recommended test framework for Elide projects?

---

## Contributing

When adding new showcases:

- ⚠️ **Minimize Node.js dependencies** - Only use if absolutely necessary
- 📝 **Document new shims** - Update this file with any new Node.js modules
- 🎯 **Use abstractions** - Design for easy migration to native Elide APIs
- ✅ **Test migration path** - Ensure shims can be cleanly removed later

---

**For questions or updates, contact the Elide showcases team.**
