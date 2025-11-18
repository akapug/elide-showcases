/**
 * Quoted Printable - Quoted-Printable Encoding
 *
 * Encode/decode quoted-printable strings.
 * **POLYGLOT SHOWCASE**: One QP encoder for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/quoted-printable (~200K+ downloads/week)
 */

export function encode(str: string): string {
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = char.charCodeAt(0);

    if (code > 126 || code < 32 || char === '=' || code === 61) {
      result += '=' + code.toString(16).toUpperCase().padStart(2, '0');
    } else {
      result += char;
    }
  }

  return result;
}

export function decode(str: string): string {
  return str.replace(/=([0-9A-F]{2})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  }).replace(/=\r?\n/g, '');
}

export default { encode, decode };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📝 Quoted Printable - QP Encoding for Elide (POLYGLOT!)\n");

  const original = "Hello, World! Ñoño";
  const encoded = encode(original);
  const decoded = decode(encoded);

  console.log("Original:", original);
  console.log("Encoded:", encoded);
  console.log("Decoded:", decoded);

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
