/**
 * base85 - Base85 Encoding/Decoding
 *
 * Base85 (Ascii85) encoding/decoding.
 *
 * Package has ~500K+ downloads/week on npm!
 */

function encode(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let result = '';

  for (let i = 0; i < bytes.length; i += 4) {
    let value = 0;
    const chunkSize = Math.min(4, bytes.length - i);

    for (let j = 0; j < chunkSize; j++) {
      value = value * 256 + (bytes[i + j] || 0);
    }

    if (chunkSize < 4) {
      value *= Math.pow(256, 4 - chunkSize);
    }

    const chars: string[] = [];
    for (let k = 0; k < 5; k++) {
      chars.unshift(String.fromCharCode(33 + (value % 85)));
      value = Math.floor(value / 85);
    }

    result += chars.slice(0, chunkSize + 1).join('');
  }

  return result;
}

function decode(input: string): Uint8Array {
  const output: number[] = [];

  for (let i = 0; i < input.length; i += 5) {
    let value = 0;
    const chunkSize = Math.min(5, input.length - i);

    for (let j = 0; j < chunkSize; j++) {
      value = value * 85 + (input.charCodeAt(i + j) - 33);
    }

    const bytes: number[] = [];
    for (let k = 0; k < 4; k++) {
      bytes.unshift(value % 256);
      value = Math.floor(value / 256);
    }

    output.push(...bytes.slice(0, chunkSize - 1));
  }

  return new Uint8Array(output);
}

export default { encode, decode };
export { encode, decode };

if (import.meta.url.includes("elide-base85.ts")) {
  console.log("🔤 base85 - Base85 Encoding\n");
  const text = "Hello!";
  const encoded = encode(text);
  const decoded = new TextDecoder().decode(decode(encoded));
  console.log("Original:", text);
  console.log("Base85:", encoded);
  console.log("Decoded:", decoded);
  console.log("\n🚀 ~500K+ downloads/week on npm");
}
