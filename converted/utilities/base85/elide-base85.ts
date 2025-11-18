/**
 * base85 - Base85 Encoding
 *
 * Base85 (ASCII85) encoding for compact binary representation.
 * **POLYGLOT SHOWCASE**: Base85 across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/base85 (~50K+ downloads/week)
 *
 * Package has ~50K+ downloads/week on npm!
 */

export function encode(data: Uint8Array): string {
  let result = '';
  
  for (let i = 0; i < data.length; i += 4) {
    let value = 0;
    const bytes = Math.min(4, data.length - i);
    
    for (let j = 0; j < bytes; j++) {
      value = (value << 8) | data[i + j];
    }
    
    if (bytes < 4) {
      value <<= 8 * (4 - bytes);
    }
    
    if (value === 0 && bytes === 4) {
      result += 'z';
    } else {
      const chars = [];
      for (let j = 0; j < 5; j++) {
        chars.unshift(String.fromCharCode(33 + (value % 85)));
        value = Math.floor(value / 85);
      }
      result += chars.slice(0, bytes + 1).join('');
    }
  }
  
  return result;
}

export function decode(str: string): Uint8Array {
  const result: number[] = [];
  
  for (let i = 0; i < str.length;) {
    if (str[i] === 'z') {
      result.push(0, 0, 0, 0);
      i++;
      continue;
    }
    
    let value = 0;
    let chars = 0;
    
    while (chars < 5 && i < str.length && str[i] !== 'z') {
      value = value * 85 + (str.charCodeAt(i) - 33);
      chars++;
      i++;
    }
    
    for (let j = 0; j < chars - 1; j++) {
      result.push((value >> (24 - j * 8)) & 0xff);
    }
  }
  
  return new Uint8Array(result);
}

export default { encode, decode };

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔢 base85 (POLYGLOT!)\\n");
  const data = new TextEncoder().encode("Hello");
  const encoded = encode(data);
  console.log("Encoded:", encoded);
  console.log("Decoded:", new TextDecoder().decode(decode(encoded)));
  console.log("\\n🚀 ~50K+ downloads/week on npm!");
}
