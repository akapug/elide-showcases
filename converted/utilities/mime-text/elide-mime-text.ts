/**
 * MIME Text - MIME Text Encoding/Decoding
 *
 * Encode and decode MIME text headers.
 * **POLYGLOT SHOWCASE**: One MIME text handler for ALL languages on Elide!
 */

export function encode(text: string, encoding: 'Q' | 'B' = 'Q'): string {
  if (encoding === 'B') {
    return `=?UTF-8?B?${Buffer.from(text).toString('base64')}?=`;
  }

  // Quoted-printable
  let encoded = '';
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code > 126 || code < 32 || '=?_'.includes(char)) {
      encoded += '=' + code.toString(16).toUpperCase().padStart(2, '0');
    } else if (char === ' ') {
      encoded += '_';
    } else {
      encoded += char;
    }
  }
  return `=?UTF-8?Q?${encoded}?=`;
}

export function decode(encoded: string): string {
  const match = encoded.match(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/i);
  if (!match) return encoded;

  const [, , encoding, content] = match;

  if (encoding === 'B') {
    return Buffer.from(content, 'base64').toString('utf-8');
  }

  // Quoted-printable
  return content
    .replace(/_/g, ' ')
    .replace(/=([0-9A-F]{2})/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export default { encode, decode };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📝 MIME Text - MIME Text Encoding for Elide (POLYGLOT!)\n");

  const text = "Hello, Ñoño!";
  const encodedQ = encode(text, 'Q');
  const encodedB = encode(text, 'B');

  console.log("Original:", text);
  console.log("Q-encoded:", encodedQ);
  console.log("B-encoded:", encodedB);
  console.log("Decoded Q:", decode(encodedQ));
  console.log("Decoded B:", decode(encodedB));

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
