# is-url - Elide Polyglot Showcase

> **URL validation for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- URL validation
- Protocol checking (http, https, ftp, etc.)
- Domain validation
- Support for ports, paths, queries, fragments
- Length validation (max 2083 chars)
- **~15M downloads/week on npm**

## Quick Start

```typescript
import isUrl from './elide-is-url.ts';

isUrl('https://www.example.com');           // true
isUrl('http://example.com:8080/path');      // true
isUrl('ftp://files.example.com');           // true
isUrl('example.com');                       // false (no protocol)
isUrl('www.example.com');                   // false (no protocol)
```

## Validation Rules

- Must have valid protocol (http://, https://, ftp://, etc.)
- Valid domain format
- Optional: port, path, query, fragment
- Max length: 2083 characters

## Supported Components

- Protocols: http, https, ftp, ws, wss, etc.
- Authentication: `user:pass@domain`
- Ports: `:8080`
- Paths: `/path/to/resource`
- Query strings: `?key=value&foo=bar`
- Fragments: `#section`

## Links

- [Original npm package](https://www.npmjs.com/package/is-url)

---

**Built with ❤️ for the Elide Polyglot Runtime**
