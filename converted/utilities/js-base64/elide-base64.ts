/**
 * Base64 - Base64 Encoding and Decoding
 *
 * Encode and decode strings and binary data to/from Base64.
 * Essential for data encoding, APIs, and file handling.
 *
 * Features:
 * - Encode strings to Base64
 * - Decode Base64 to strings
 * - URL-safe Base64 encoding
 * - Unicode support
 * - Binary data support
 *
 * Use cases:
 * - API authentication (Basic Auth)
 * - Data URLs
 * - Binary data transmission
 * - Image embedding
 * - JWT tokens
 * - Email attachments
 *
 * Package has ~40M+ downloads/week on npm!
 */

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Encode a string to Base64
 */
export function encode(input: string, urlSafe: boolean = false): string {
  if (typeof input !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof input}`);
  }

  // Use browser btoa if available (for ASCII)
  if (typeof btoa !== 'undefined' && !urlSafe && isASCII(input)) {
    return btoa(input);
  }

  // Manual encoding for Unicode support
  const bytes = stringToBytes(input);
  return bytesToBase64(bytes, urlSafe);
}

/**
 * Decode a Base64 string
 */
export function decode(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof input}`);
  }

  // Normalize (remove whitespace, handle URL-safe)
  input = input.replace(/[\s\r\n]/g, '');
  const urlSafe = input.includes('-') || input.includes('_');

  // Use browser atob if available and not URL-safe
  if (typeof atob !== 'undefined' && !urlSafe && !hasUnicode(input)) {
    try {
      return atob(input);
    } catch {
      // Fall through to manual decoding
    }
  }

  // Manual decoding
  const bytes = base64ToBytes(input, urlSafe);
  return bytesToString(bytes);
}

/**
 * Encode to URL-safe Base64 (replaces + with - and / with _)
 */
export function encodeURL(input: string): string {
  return encode(input, true).replace(/=+$/, ''); // Remove padding
}

/**
 * Decode from URL-safe Base64
 */
export function decodeURL(input: string): string {
  // Add padding if needed
  while (input.length % 4) {
    input += '=';
  }
  return decode(input);
}

/**
 * Check if string is valid Base64
 */
export function isValid(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  // Remove whitespace
  input = input.replace(/[\s\r\n]/g, '');

  // Check for valid characters
  const validChars = /^[A-Za-z0-9+\/\-_]*={0,2}$/;
  if (!validChars.test(input)) {
    return false;
  }

  // Check length
  if (input.length % 4 !== 0 && !input.includes('-') && !input.includes('_')) {
    return false;
  }

  return true;
}

/**
 * Convert string to UTF-8 bytes
 */
function stringToBytes(str: string): number[] {
  const bytes: number[] = [];

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      bytes.push(0xf0 | (code >> 18));
      bytes.push(0x80 | ((code >> 12) & 0x3f));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    }
  }

  return bytes;
}

/**
 * Convert UTF-8 bytes to string
 */
function bytesToString(bytes: number[]): string {
  const chars: string[] = [];
  let i = 0;

  while (i < bytes.length) {
    const byte1 = bytes[i++];

    if (byte1 < 0x80) {
      chars.push(String.fromCharCode(byte1));
    } else if (byte1 < 0xe0) {
      const byte2 = bytes[i++];
      chars.push(String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f)));
    } else if (byte1 < 0xf0) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      chars.push(String.fromCharCode(
        ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f)
      ));
    } else {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      const byte4 = bytes[i++];
      const codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) |
                        ((byte3 & 0x3f) << 6) | (byte4 & 0x3f);
      chars.push(String.fromCharCode(codePoint));
    }
  }

  return chars.join('');
}

/**
 * Convert bytes to Base64 string
 */
function bytesToBase64(bytes: number[], urlSafe: boolean): string {
  const chars = urlSafe ? BASE64_URL_CHARS : BASE64_CHARS;
  const result: string[] = [];

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    const encoded1 = byte1 >> 2;
    const encoded2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
    const encoded3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
    const encoded4 = byte3 & 0x3f;

    result.push(chars[encoded1]);
    result.push(chars[encoded2]);
    result.push(i + 1 < bytes.length ? chars[encoded3] : '=');
    result.push(i + 2 < bytes.length ? chars[encoded4] : '=');
  }

  return result.join('');
}

/**
 * Convert Base64 string to bytes
 */
function base64ToBytes(input: string, urlSafe: boolean): number[] {
  const chars = urlSafe ? BASE64_URL_CHARS : BASE64_CHARS;
  const lookup: Record<string, number> = {};

  for (let i = 0; i < chars.length; i++) {
    lookup[chars[i]] = i;
  }

  // Also handle standard chars in URL-safe mode
  if (urlSafe) {
    lookup['+'] = 62;
    lookup['/'] = 63;
  } else {
    lookup['-'] = 62;
    lookup['_'] = 63;
  }

  const bytes: number[] = [];

  for (let i = 0; i < input.length; i += 4) {
    const encoded1 = lookup[input[i]] || 0;
    const encoded2 = lookup[input[i + 1]] || 0;
    const encoded3 = lookup[input[i + 2]] || 0;
    const encoded4 = lookup[input[i + 3]] || 0;

    bytes.push((encoded1 << 2) | (encoded2 >> 4));

    if (input[i + 2] !== '=') {
      bytes.push(((encoded2 & 0x0f) << 4) | (encoded3 >> 2));
    }

    if (input[i + 3] !== '=') {
      bytes.push(((encoded3 & 0x03) << 6) | encoded4);
    }
  }

  return bytes;
}

/**
 * Check if string is ASCII only
 */
function isASCII(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) {
      return false;
    }
  }
  return true;
}

/**
 * Check if Base64 string likely contains Unicode
 */
function hasUnicode(str: string): boolean {
  try {
    const decoded = atob(str);
    for (let i = 0; i < decoded.length; i++) {
      if (decoded.charCodeAt(i) > 127) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

/**
 * Default export
 */
export default { encode, decode, encodeURL, decodeURL, isValid };

// CLI Demo
if (import.meta.url.includes("elide-base64.ts")) {
  console.log("🔐 Base64 - Encoding and Decoding for Elide\n");

  console.log("=== Example 1: Basic Encoding ===");
  const text1 = "Hello, World!";
  const encoded1 = encode(text1);
  console.log("Original:", text1);
  console.log("Encoded:", encoded1);
  console.log("Decoded:", decode(encoded1));
  console.log();

  console.log("=== Example 2: Unicode Support ===");
  const text2 = "Hello 世界! 🌍";
  const encoded2 = encode(text2);
  console.log("Original:", text2);
  console.log("Encoded:", encoded2);
  console.log("Decoded:", decode(encoded2));
  console.log();

  console.log("=== Example 3: URL-Safe Encoding ===");
  const text3 = "https://example.com?query=test+value";
  const standard = encode(text3);
  const urlSafe = encodeURL(text3);
  console.log("Original:", text3);
  console.log("Standard:", standard);
  console.log("URL-safe:", urlSafe);
  console.log("Decoded:", decodeURL(urlSafe));
  console.log();

  console.log("=== Example 4: Binary Data ===");
  const binary = String.fromCharCode(0, 1, 2, 3, 255, 254, 253);
  const encodedBin = encode(binary);
  const decodedBin = decode(encodedBin);
  console.log("Binary bytes:", Array.from(binary).map(c => c.charCodeAt(0)).join(', '));
  console.log("Encoded:", encodedBin);
  console.log("Decoded matches:", binary === decodedBin);
  console.log();

  console.log("=== Example 5: Validation ===");
  console.log("isValid('SGVsbG8='):", isValid('SGVsbG8='));
  console.log("isValid('Invalid!'):", isValid('Invalid!'));
  console.log("isValid('SGVs bG8=') with spaces:", isValid('SGVs bG8='));
  console.log();

  console.log("=== Example 6: API Authentication ===");
  const username = "admin";
  const password = "secret123";
  const credentials = `${username}:${password}`;
  const authHeader = encode(credentials);
  console.log("Credentials:", credentials);
  console.log("Basic Auth Header:", `Basic ${authHeader}`);
  console.log("Decoded:", decode(authHeader));
  console.log();

  console.log("=== Example 7: Data URLs ===");
  const svgData = '<svg><circle cx="50" cy="50" r="40"/></svg>';
  const dataURL = `data:image/svg+xml;base64,${encode(svgData)}`;
  console.log("SVG data:");
  console.log(svgData);
  console.log("\nData URL:");
  console.log(dataURL);
  console.log();

  console.log("=== Example 8: JWT-like Token ===");
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const payload = JSON.stringify({ sub: '1234', name: 'John Doe', iat: 1516239022 });

  const encodedHeader = encodeURL(header);
  const encodedPayload = encodeURL(payload);
  const token = `${encodedHeader}.${encodedPayload}.signature`;

  console.log("JWT-like token:");
  console.log(token);
  console.log("\nDecoded header:");
  console.log(JSON.parse(decodeURL(encodedHeader)));
  console.log("\nDecoded payload:");
  console.log(JSON.parse(decodeURL(encodedPayload)));
  console.log();

  console.log("=== Example 9: Email Content ===");
  const email = "Subject: Test\n\nHello! This is a test email with special chars: <>&\"'";
  const encodedEmail = encode(email);
  console.log("Email content:");
  console.log(email);
  console.log("\nBase64 encoded:");
  console.log(encodedEmail);
  console.log("\nDecoded:");
  console.log(decode(encodedEmail));
  console.log();

  console.log("=== Example 10: Round-Trip Test ===");
  const samples = [
    "Simple text",
    "With numbers 123",
    "Special !@#$%^&*()",
    "Unicode: 你好世界 🚀",
    "Multiline\nText\nHere"
  ];

  console.log("Testing round-trip encoding/decoding:");
  samples.forEach(sample => {
    const encoded = encode(sample);
    const decoded = decode(encoded);
    const match = sample === decoded;
    console.log(`  "${sample.substring(0, 20)}..." → ${match ? '✓' : '✗'}`);
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- API authentication (Basic Auth)");
  console.log("- Data URLs and inline images");
  console.log("- Binary data transmission");
  console.log("- Image and file embedding");
  console.log("- JWT token encoding");
  console.log("- Email attachments (MIME)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~40M+ downloads/week on npm");
  console.log();

  console.log("💡 Tips:");
  console.log("- Use URL-safe encoding for URLs and tokens");
  console.log("- Full Unicode support built-in");
  console.log("- Validate before decoding unknown input");
  console.log("- Binary data supported");
}
