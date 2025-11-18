/**
 * base64-arraybuffer - Base64 ArrayBuffer Encoding
 *
 * Encode/decode ArrayBuffer to/from Base64.
 * **POLYGLOT SHOWCASE**: Base64 ArrayBuffer across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/base64-arraybuffer (~200K+ downloads/week)
 *
 * Package has ~200K+ downloads/week on npm!
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encode(ab: ArrayBuffer): string {
  const bytes = new Uint8Array(ab);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    result += CHARS[bytes[i] >> 2];
    result += CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += i + 1 < bytes.length ? CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)] : '=';
    result += i + 2 < bytes.length ? CHARS[bytes[i + 2] & 63] : '=';
  }
  return result;
}

export function decode(b64: string): ArrayBuffer {
  const len = b64.length;
  let validLen = len;
  while (b64[validLen - 1] === '=') validLen--;
  
  const arr = new Uint8Array((validLen * 3) >> 2);
  let j = 0;
  
  for (let i = 0; i < validLen; i += 4) {
    const a = CHARS.indexOf(b64[i]);
    const b = CHARS.indexOf(b64[i + 1]);
    const c = i + 2 < validLen ? CHARS.indexOf(b64[i + 2]) : 0;
    const d = i + 3 < validLen ? CHARS.indexOf(b64[i + 3]) : 0;
    
    arr[j++] = (a << 2) | (b >> 4);
    if (i + 2 < validLen) arr[j++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < validLen) arr[j++] = ((c & 3) << 6) | d;
  }
  
  return arr.buffer;
}

export default { encode, decode };

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔤 base64-arraybuffer (POLYGLOT!)\\n");
  const ab = new Uint8Array([72, 101, 108, 108, 111]).buffer;
  const encoded = encode(ab);
  console.log("Encoded:", encoded);
  console.log("Decoded:", new TextDecoder().decode(decode(encoded)));
  console.log("\\n🚀 ~200K+ downloads/week on npm!");
}
