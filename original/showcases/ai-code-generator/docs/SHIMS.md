# Required Shims for Elide

This document lists any Node.js APIs that may need shims when running with Elide.

## HTTP Server

The application uses the standard Node.js `http` module for the server.

### Status: ✅ Works with Elide

Elide provides native support for Node.js HTTP APIs. The server can be run directly:

```bash
elide backend/server.ts
```

### Potential Shims (if needed)

If you encounter issues with certain HTTP features, you may need:

```typescript
// Shim for http module (if needed)
import { createServer } from 'elide:http';
```

## File System

The application uses `fs` for reading templates and static files.

### Status: ✅ Works with Elide

Elide supports Node.js filesystem APIs. No shim required.

### Usage

```typescript
import * as fs from 'fs';
import * as path from 'path';
```

## URL Parsing

The application uses the `url` module for parsing request URLs.

### Status: ✅ Works with Elide

Elide supports URL parsing. No shim required.

### Usage

```typescript
import * as url from 'url';
```

## Crypto

The application uses `crypto` for generating preview IDs.

### Status: ✅ Works with Elide

Elide supports crypto APIs. No shim required.

### Usage

```typescript
import * as crypto from 'crypto';

const id = crypto.randomBytes(16).toString('hex');
```

## Fetch API

The AI clients use `fetch` for HTTP requests to AI providers.

### Status: ✅ Native in Elide

Elide provides native `fetch` support. No shim required.

### Usage

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

## Process APIs

The application uses `process.env` for configuration.

### Status: ✅ Works with Elide

Elide supports `process.env` and other process APIs.

### Usage

```typescript
const PORT = parseInt(process.env.PORT || '3000', 10);
const apiKey = process.env.OPENAI_API_KEY;
```

## Streams

The export functionality uses streams for file generation.

### Status: ⚠️ May need adaptation

Elide supports streams, but complex stream operations might need testing.

### Current Usage

```typescript
import { PassThrough } from 'stream';

const passThrough = new PassThrough();
archive.pipe(passThrough);
passThrough.pipe(res);
```

### Alternative (if needed)

For simple cases, buffer the entire archive in memory:

```typescript
// Instead of streaming
const buffer = await createArchiveBuffer(files);
res.end(buffer);
```

## Archive Creation

The application currently has a mock archiver implementation.

### Status: ⚠️ Simplified Implementation

The current implementation is a simplified mock. For production, consider:

1. **Option 1**: Use a pure-JS archive library
   - `archiver` or similar
   - May need polyfills

2. **Option 2**: Create archives manually
   - Implement ZIP format
   - More control, no dependencies

3. **Option 3**: Use external tool
   - Shell out to `zip` command
   - Platform-dependent

### Current Implementation

```typescript
// Simplified mock in exportRoute.ts
function createMockZip(files: any[]): Buffer {
  const content = files.map(f => `${f.name}:\n${f.content}\n\n`).join('');
  return Buffer.from(content);
}
```

### Production Implementation (recommended)

```typescript
import * as JSZip from 'jszip';

async function createZip(files: any[]): Promise<Buffer> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.name, file.content);
  }

  return await zip.generateAsync({ type: 'nodebuffer' });
}
```

## Summary of Shims Needed

| Feature | Status | Shim Required | Notes |
|---------|--------|---------------|-------|
| HTTP Server | ✅ | No | Native support |
| File System | ✅ | No | Native support |
| URL Parsing | ✅ | No | Native support |
| Crypto | ✅ | No | Native support |
| Fetch API | ✅ | No | Native support |
| Process | ✅ | No | Native support |
| Streams | ⚠️ | Maybe | Test complex operations |
| Archives | ⚠️ | Recommended | Use JSZip or implement manually |

## Testing Shims

To test if shims are needed:

```bash
# Try running directly with Elide
elide backend/server.ts

# If you see errors about missing modules:
# 1. Check if the module is in the shims list above
# 2. Implement the recommended shim
# 3. Test again
```

## Adding Custom Shims

If you need to add a custom shim:

```typescript
// Create shims/http.ts
export function createServer(handler: Function) {
  // Custom implementation
  return {
    listen(port: number, callback: Function) {
      // Implementation
    }
  };
}

// Use in server.ts
import { createServer } from './shims/http';
```

## Performance Considerations

Shims may have performance implications:

1. **Native APIs**: Always prefer Elide's native APIs
2. **Polyfills**: Only use when necessary
3. **Fallbacks**: Provide graceful degradation

## Future Improvements

As Elide evolves, fewer shims may be needed:

- [ ] Native archive support
- [ ] Enhanced stream APIs
- [ ] More comprehensive Node.js compatibility

## Getting Help

If you encounter issues with shims:

1. Check Elide documentation
2. Search Elide GitHub issues
3. Ask in Elide Discord/community
4. File a bug report

## License

MIT License - see LICENSE file for details.
