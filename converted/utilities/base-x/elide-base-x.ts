/**
 * base-x - Base-X Encoding
 *
 * Fast base encoding/decoding for any alphabet.
 * **POLYGLOT SHOWCASE**: Base-X encoding across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/base-x (~2M+ downloads/week)
 *
 * Package has ~2M+ downloads/week on npm!
 */

export function baseX(alphabet: string) {
  const base = alphabet.length;
  const lookup = new Uint8Array(256).fill(255);
  
  for (let i = 0; i < alphabet.length; i++) {
    lookup[alphabet.charCodeAt(i)] = i;
  }

  return {
    encode: (source: Uint8Array): string => {
      if (source.length === 0) return '';
      const digits = [0];
      for (let i = 0; i < source.length; i++) {
        let carry = source[i];
        for (let j = 0; j < digits.length; j++) {
          carry += digits[j] << 8;
          digits[j] = carry % base;
          carry = (carry / base) | 0;
        }
        while (carry > 0) {
          digits.push(carry % base);
          carry = (carry / base) | 0;
        }
      }
      let result = '';
      for (let i = 0; source[i] === 0 && i < source.length - 1; i++) {
        result += alphabet[0];
      }
      for (let i = digits.length - 1; i >= 0; i--) {
        result += alphabet[digits[i]];
      }
      return result;
    },
    
    decode: (source: string): Uint8Array => {
      if (source.length === 0) return new Uint8Array(0);
      const bytes = [0];
      for (let i = 0; i < source.length; i++) {
        const value = lookup[source.charCodeAt(i)];
        if (value === 255) throw new Error('Invalid character');
        let carry = value;
        for (let j = 0; j < bytes.length; j++) {
          carry += bytes[j] * base;
          bytes[j] = carry & 0xff;
          carry >>= 8;
        }
        while (carry > 0) {
          bytes.push(carry & 0xff);
          carry >>= 8;
        }
      }
      for (let i = 0; source[i] === alphabet[0] && i < source.length - 1; i++) {
        bytes.push(0);
      }
      return new Uint8Array(bytes.reverse());
    }
  };
}

export default baseX;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔢 base-x - Base-X Encoding (POLYGLOT!)\\n");
  const base58 = baseX('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
  const data = new Uint8Array([1, 2, 3, 4, 5]);
  const encoded = base58.encode(data);
  console.log("Encoded:", encoded);
  console.log("Decoded:", base58.decode(encoded));
  console.log("\\n🚀 ~2M+ downloads/week on npm!");
}
