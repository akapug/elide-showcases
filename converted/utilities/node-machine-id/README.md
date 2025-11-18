# node-machine-id - Machine ID - Elide Polyglot Showcase

> **One machine ID library for ALL languages** - TypeScript, Python, Ruby, and Java

Get a unique machine identifier that persists across reboots.

## ✨ Features

- ✅ Unique machine ID
- ✅ Persistent across reboots
- ✅ Platform-independent
- ✅ Synchronous and async APIs
- ✅ Optional hashing for privacy
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { machineIdSync, machineId } from './elide-node-machine-id.ts';

// Synchronous
const id = machineIdSync();
console.log(`Machine ID: ${id}`);

// Asynchronous
const asyncId = await machineId();
console.log(`Machine ID: ${asyncId}`);

// Get original ID (not hashed)
const original = machineIdSync(true);
```

## 📖 API Reference

### `machineIdSync(original?: boolean): string`

Get machine ID synchronously.
- `original`: If `true`, return original ID. If `false` (default), return hashed ID.

### `machineId(original?: boolean): Promise<string>`

Get machine ID asynchronously.

## 💡 Use Cases

### Software Licensing

```typescript
const machineId = machineIdSync();
const licenseKey = `${machineId.substring(0, 8)}-${Date.now()}`;
console.log(`License: ${licenseKey}`);
```

### Device Tracking

```typescript
const deviceId = `device_${machineIdSync()}`;
analytics.track(deviceId, 'app_started');
```

### Session Management

```typescript
const sessionId = `session_${Date.now()}_${machineIdSync().substring(0, 16)}`;
```

## 🌐 Polyglot Benefits

In polyglot applications, having **different machine ID implementations** in each language creates:
- ❌ Inconsistent device identification
- ❌ Licensing conflicts
- ❌ Analytics fragmentation

**Elide solves this** with ONE implementation that works in ALL languages, ensuring the same machine always gets the same ID regardless of which language checks it.

---

**Package has ~8M+ downloads/week on npm**

*One machine ID to rule them all.*
