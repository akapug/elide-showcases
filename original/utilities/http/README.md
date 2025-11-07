# HTTP Utilities - Web Request Helpers

**5 HTTP utilities** for working with web requests and responses.

## 🎯 What's Included

Tools for HTTP operations:
- **URL Parsing** - Parse and manipulate URLs
- **Query String** - Parse and build query parameters
- **Headers** - HTTP header utilities
- **Cookies** - Cookie parsing and serialization
- **MIME Types** - Content-Type detection and mapping

## 📁 Utilities (5 total)

Each utility handles:
- Parsing from string format
- Building/serializing to string
- Validation and edge cases
- Web standards compliance

## 🚀 Quick Start

```bash
cd categories/http

# URL parser
elide run url-parser.ts

# Query string handler
elide run query-string.ts

# Header utilities
elide run headers.ts

# Cookie handler
elide run cookies.ts

# MIME type detector
elide run mime-types.ts
```

## 💡 Use Cases

### URL Parsing - Request Routing
```typescript
import { parseURL } from './url-parser.ts';

const url = parseURL('https://api.example.com/users/123?active=true');

console.log(url.protocol); // "https:"
console.log(url.hostname); // "api.example.com"
console.log(url.pathname); // "/users/123"
console.log(url.search);   // "?active=true"
```

**Use cases:**
- Request routing
- API endpoint parsing
- Redirect handling
- Link validation

### Query String - Parameter Handling
```typescript
import { parse, stringify } from './query-string.ts';

// Parse query params
const params = parse('?foo=bar&baz=qux&arr=1&arr=2');
// { foo: 'bar', baz: 'qux', arr: ['1', '2'] }

// Build query string
const qs = stringify({ foo: 'bar', baz: 'qux' });
// "foo=bar&baz=qux"
```

**Use cases:**
- API request parameters
- Form data handling
- Search functionality
- Filter/sort parameters

### Headers - HTTP Metadata
```typescript
import { parseHeaders, formatHeaders } from './headers.ts';

// Parse header string
const headers = parseHeaders('Content-Type: application/json\r\nAuthorization: Bearer token');

// Format for HTTP
const headerString = formatHeaders({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer token'
});
```

**Use cases:**
- HTTP client/server
- Content negotiation
- Authentication
- CORS handling

### Cookies - Session Management
```typescript
import { parseCookies, serializeCookie } from './cookies.ts';

// Parse Cookie header
const cookies = parseCookies('session=abc123; user=john');
// { session: 'abc123', user: 'john' }

// Create Set-Cookie header
const setCookie = serializeCookie('session', 'abc123', {
  httpOnly: true,
  secure: true,
  maxAge: 3600
});
// "session=abc123; HttpOnly; Secure; Max-Age=3600"
```

**Use cases:**
- Session management
- Authentication tokens
- User preferences
- Tracking (with consent!)

### MIME Types - Content Detection
```typescript
import { getMimeType, getExtension } from './mime-types.ts';

// Get MIME type from filename
const mimeType = getMimeType('document.pdf');
// "application/pdf"

// Get extension from MIME type
const ext = getExtension('image/png');
// ".png"
```

**Use cases:**
- File upload handling
- Content-Type headers
- Download responses
- Static file serving

## ⚡ Performance

All utilities optimized for common cases:
- **URL parsing**: O(n) single pass
- **Query string**: O(n) parsing and building
- **Headers**: O(n) parsing, O(1) lookups
- **Cookies**: O(n) parsing and serialization
- **MIME types**: O(1) map lookups

Perfect for high-throughput HTTP handling.

## 🏆 Highlights

### Most Essential:
- **Query String** - Required for almost all APIs
- **URL Parsing** - Foundation of web requests
- **Headers** - HTTP metadata handling

### Most Secure:
- **Cookie handling** - Proper security flags
- **Header validation** - Prevent injection attacks
- **URL validation** - Avoid SSRF

### Best for Learning:
- **Query string** - String parsing patterns
- **MIME types** - Map-based lookups
- **URL parsing** - Complex string handling

## 🎨 Example: Complete HTTP Handler

```typescript
// Build a complete HTTP request handler

import { parseURL } from './url-parser.ts';
import { parse as parseQuery } from './query-string.ts';
import { parseHeaders } from './headers.ts';
import { parseCookies } from './cookies.ts';
import { getMimeType } from './mime-types.ts';

function handleRequest(request: string) {
  const [requestLine, ...headerLines] = request.split('\r\n');
  const [method, url] = requestLine.split(' ');

  // Parse URL and query string
  const parsedURL = parseURL(url);
  const query = parseQuery(parsedURL.search);

  // Parse headers
  const headers = parseHeaders(headerLines.join('\r\n'));

  // Parse cookies
  const cookies = parseCookies(headers['cookie'] || '');

  // Determine content type
  const contentType = getMimeType(parsedURL.pathname);

  return {
    method,
    path: parsedURL.pathname,
    query,
    headers,
    cookies,
    contentType
  };
}
```

## 📊 Web Standards Compliance

All utilities follow relevant RFCs:
- **URL**: RFC 3986 (URI Generic Syntax)
- **Query String**: WHATWG URL Standard
- **Headers**: RFC 7230 (HTTP/1.1 Message Syntax)
- **Cookies**: RFC 6265 (HTTP State Management)
- **MIME**: RFC 2045 (Media Types)

## 🔧 Advanced Features

### URL Parser:
- Absolute and relative URLs
- IPv4/IPv6 support
- Port handling
- Fragment identifiers
- URL normalization

### Query String:
- Array parameters (`foo[]=1&foo[]=2`)
- Nested objects (`user[name]=John`)
- Custom delimiters
- Encoding options
- Empty value handling

### Headers:
- Case-insensitive lookup
- Multi-value headers
- Header folding (obsolete but supported)
- Cookie header special handling
- Header validation

### Cookies:
- All standard attributes (HttpOnly, Secure, SameSite, etc.)
- Expiration vs Max-Age
- Domain and Path scoping
- Encoding special characters
- Validation

### MIME Types:
- 200+ common types
- Custom type registration
- Charset handling
- Compression detection
- Default fallbacks

## 💡 Security Best Practices

### URL Parsing:
- Validate before redirecting (avoid open redirects)
- Check protocol (prevent JavaScript: URLs)
- Sanitize path (prevent directory traversal)
- Validate domain (prevent SSRF)

### Headers:
- Validate header names (prevent injection)
- Sanitize header values
- Limit header count/size
- Check for dangerous headers

### Cookies:
- Always set HttpOnly for session cookies
- Use Secure flag in production
- Set appropriate SameSite
- Use short Max-Age for sensitive cookies
- Validate cookie values

---

**5 HTTP utilities. Standards-compliant. Production-ready.**
