# Encoding - Data Encoding Schemes

**5 encoding implementations** for various data encoding needs.

## 🎯 What's Included

Common encoding schemes:
- **Base64** - Binary to ASCII encoding
- **URL Encoding** - Percent encoding for URLs
- **HTML Encoding** - Entity encoding for HTML safety
- **Hex Encoding** - Binary to hexadecimal
- **UTF-8 Encoding** - Character encoding utilities

## 📁 Encoders (5 total)

Each encoder provides:
- Encode function (data → encoded string)
- Decode function (encoded string → data)
- Validation (check if string is valid encoding)
- Error handling for malformed input

## 🚀 Quick Start

```bash
cd categories/encoding

# Base64 encoding
elide run base64.ts

# URL encoding
elide run url-encoding.ts

# HTML encoding
elide run html-encoding.ts

# Hex encoding
elide run hex-encoding.ts
```

## 💡 Use Cases

### Base64 - Data Transmission
```typescript
import { encode, decode } from './base64.ts';

// Encode binary data for JSON
const encoded = encode(binaryData);

// Decode back to original
const original = decode(encoded);
```

**Use cases:**
- Image embedding in HTML/CSS
- API authentication tokens
- Email attachments (MIME)
- Binary data in JSON/XML

### URL Encoding - Web Safety
```typescript
import { encodeURL, decodeURL } from './url-encoding.ts';

// Encode query parameters
const safe = encodeURL('Hello World!'); // "Hello%20World%21"

// Decode back
const original = decodeURL(safe); // "Hello World!"
```

**Use cases:**
- Query string parameters
- Path segments with special chars
- Form data encoding
- API request parameters

### HTML Encoding - XSS Prevention
```typescript
import { escapeHTML, unescapeHTML } from './html-encoding.ts';

// Prevent XSS attacks
const safe = escapeHTML('<script>alert("XSS")</script>');
// Output: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
```

**Use cases:**
- User input display
- XSS prevention
- Safely rendering untrusted content
- Template engines

### Hex Encoding - Debug & Display
```typescript
import { toHex, fromHex } from './hex-encoding.ts';

// Convert to hex for debugging
const hex = toHex(buffer); // "48656c6c6f"

// Parse hex string
const bytes = fromHex("48656c6c6f"); // "Hello"
```

**Use cases:**
- Debugging binary data
- Color codes (#RRGGBB)
- Cryptographic hashes
- Low-level data inspection

## ⚡ Performance

All encoders optimized for speed:
- **Base64**: O(n) encoding/decoding
- **URL encoding**: O(n) with minimal overhead
- **HTML encoding**: O(n) entity replacement
- **Hex**: O(n) conversion

With Elide's **~20ms cold start**, encoding operations feel instant.

## 🏆 Highlights

### Most Used:
- **Base64** - Universal encoding standard
- **HTML encoding** - Essential for web security
- **URL encoding** - Required for HTTP

### Most Important:
- **HTML encoding** - Prevents XSS attacks
- **Base64** - Enables binary data in text formats
- **URL encoding** - Web standards compliance

### Best for Learning:
- **Hex encoding** - Simple byte manipulation
- **Base64** - Classic encoding algorithm
- **URL encoding** - Character escaping patterns

## 🎨 Example: Complete Encoding Pipeline

```typescript
// Encode user input for safe storage and transmission

import { escapeHTML } from './html-encoding.ts';
import { encodeURL } from './url-encoding.ts';
import { encode as base64 } from './base64.ts';

// 1. Sanitize HTML (prevent XSS)
const safeHTML = escapeHTML(userInput);

// 2. URL-encode for query params
const urlSafe = encodeURL(safeHTML);

// 3. Base64 encode for transmission
const encoded = base64(urlSafe);

// Reverse the pipeline to decode
const decoded = decode(
  decodeURL(
    unescapeHTML(base64Decode(encoded))
  )
);
```

## 📊 Comparison with Native APIs

| Encoding | Native API | Our Implementation | Benefit |
|----------|-----------|-------------------|---------|
| Base64 | `btoa()`/`atob()` | Full RFC 4648 | URL-safe variant, validation |
| URL | `encodeURIComponent()` | Compatible | Additional utilities |
| HTML | ❌ None | Custom | XSS prevention, entity support |
| Hex | ❌ None | Custom | Clean API, validation |

## 🔧 Advanced Features

### Base64:
- Standard and URL-safe variants
- Data URL support (`data:image/png;base64,...`)
- HTTP Basic Auth helpers
- Validation

### URL Encoding:
- Component vs full URL encoding
- Custom escape sets
- Plus vs percent space encoding
- Query string builder

### HTML Encoding:
- Named entities (&amp;, &lt;, etc.)
- Numeric entities (&#60;)
- Attribute-safe encoding
- Comprehensive entity list

### Hex Encoding:
- Uppercase/lowercase output
- Delimiter support (00:11:22)
- Byte array conversion
- Validation

## 💡 Security Considerations

### HTML Encoding:
- **ALWAYS** encode user input before display
- Encode for context (HTML vs attribute vs JavaScript)
- Don't rely on encoding alone - use CSP too
- Test with known XSS vectors

### Base64:
- NOT encryption (anyone can decode)
- Use for encoding, not security
- Validate before decoding
- Check for padding attacks

### URL Encoding:
- Encode all user-controlled URL parts
- Different rules for path vs query vs fragment
- Beware of double-encoding
- Validate after decoding

---

**5 encoders. Web standards compliant. Production-ready.**
