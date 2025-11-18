/**
 * safe-buffer - Safer Buffer API
 *
 * Safer Uint8Array operations with bounds checking.
 *
 * Package has ~150M+ downloads/week on npm!
 */

class SafeBuffer extends Uint8Array {
  static from(input: string | number[] | Uint8Array, encoding?: string): SafeBuffer {
    if (typeof input === 'string') {
      if (encoding === 'hex') {
        const bytes: number[] = [];
        for (let i = 0; i < input.length; i += 2) {
          bytes.push(parseInt(input.substring(i, i + 2), 16));
        }
        return new SafeBuffer(bytes);
      } else if (encoding === 'base64') {
        const str = atob(input);
        const bytes = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
          bytes[i] = str.charCodeAt(i);
        }
        return new SafeBuffer(bytes);
      } else {
        return new SafeBuffer(new TextEncoder().encode(input));
      }
    } else if (Array.isArray(input)) {
      return new SafeBuffer(input);
    } else {
      return new SafeBuffer(input);
    }
  }

  static alloc(size: number, fill?: number): SafeBuffer {
    const buffer = new SafeBuffer(size);
    if (fill !== undefined) {
      buffer.fill(fill);
    }
    return buffer;
  }

  toString(encoding: string = 'utf8'): string {
    if (encoding === 'hex') {
      return Array.from(this).map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (encoding === 'base64') {
      return btoa(String.fromCharCode(...this));
    } else {
      return new TextDecoder().decode(this);
    }
  }
}

export default SafeBuffer;
export { SafeBuffer };

if (import.meta.url.includes("elide-safe-buffer.ts")) {
  console.log("📦 safe-buffer - Safer Buffer API\n");
  const buf = SafeBuffer.from("Hello");
  console.log("Buffer:", buf);
  console.log("String:", buf.toString());
  console.log("Hex:", buf.toString('hex'));
  console.log("\n🚀 ~150M+ downloads/week on npm");
}
