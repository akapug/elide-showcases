/**
 * buffer-from - Create Buffers (Uint8Array) from Various Inputs
 *
 * Create Uint8Array buffers from strings, arrays, and other inputs.
 *
 * Package has ~80M+ downloads/week on npm!
 */

function bufferFrom(input: string | number[] | Uint8Array, encoding?: string): Uint8Array {
  if (typeof input === 'string') {
    if (encoding === 'hex') {
      const bytes: number[] = [];
      for (let i = 0; i < input.length; i += 2) {
        bytes.push(parseInt(input.substring(i, i + 2), 16));
      }
      return new Uint8Array(bytes);
    } else if (encoding === 'base64') {
      const str = atob(input);
      const bytes = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
      }
      return bytes;
    } else {
      return new TextEncoder().encode(input);
    }
  } else if (Array.isArray(input)) {
    return new Uint8Array(input);
  } else {
    return new Uint8Array(input);
  }
}

export default bufferFrom;
export { bufferFrom };

if (import.meta.url.includes("elide-buffer-from.ts")) {
  console.log("📦 buffer-from - Create Buffers\n");
  console.log("From string:", bufferFrom("Hello"));
  console.log("From hex:", bufferFrom("48656c6c6f", "hex"));
  console.log("From array:", bufferFrom([72, 101, 108, 108, 111]));
  console.log("\n🚀 ~80M+ downloads/week on npm");
}
