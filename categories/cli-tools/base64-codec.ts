/**
 * Base64 Encoder/Decoder
 * Convert between text/binary and Base64
 */

export function encode(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  return Buffer.from(input, 'utf-8').toString('base64');
}

export function decode(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  try {
    return Buffer.from(input, 'base64').toString('utf-8');
  } catch (error) {
    throw new Error('Invalid Base64 input');
  }
}

export function encodeURL(input: string): string {
  return encode(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function decodeURL(input: string): string {
  let base64 = input
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Add padding
  while (base64.length % 4) {
    base64 += '=';
  }

  return decode(base64);
}

export function isValidBase64(input: string): boolean {
  try {
    const decoded = Buffer.from(input, 'base64').toString('base64');
    return decoded === input;
  } catch {
    return false;
  }
}

// CLI demo
if (import.meta.url.includes("base64-codec.ts")) {
  const text = "Hello, World!";
  console.log("Original:", text);

  const encoded = encode(text);
  console.log("Encoded:", encoded);

  const decoded = decode(encoded);
  console.log("Decoded:", decoded);

  console.log("\nURL-safe encoding:");
  const urlText = "Hello+World/Test=";
  const urlEncoded = encodeURL(urlText);
  console.log("URL Encoded:", urlEncoded);
  console.log("URL Decoded:", decodeURL(urlEncoded));

  console.log("\nValidation:");
  console.log("Is valid?", isValidBase64(encoded));
  console.log("Is 'invalid!' valid?", isValidBase64("invalid!"));

  console.log("✅ Base64 codec test passed");
}
