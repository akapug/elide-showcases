/**
 * concat-stream - Concatenate Stream Data
 *
 * Writable stream that concatenates all data and calls callback with result.
 * **POLYGLOT SHOWCASE**: Stream concatenation across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/concat-stream (~3M+ downloads/week)
 *
 * Features:
 * - Concatenate stream data
 * - Buffer or string output
 * - Simple callback API
 * - Zero dependencies
 *
 * Use cases:
 * - Collect stream data
 * - Buffer HTTP responses
 * - File reading
 * - Data accumulation
 *
 * Package has ~3M+ downloads/week on npm!
 */

export class ConcatStream {
  private chunks: Uint8Array[] = [];
  private length: number = 0;
  private callback?: (data: Uint8Array) => void;

  constructor(callback?: (data: Uint8Array) => void) {
    this.callback = callback;
  }

  write(chunk: Uint8Array): void {
    this.chunks.push(chunk);
    this.length += chunk.length;
  }

  end(chunk?: Uint8Array): void {
    if (chunk) this.write(chunk);
    
    const result = new Uint8Array(this.length);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    if (this.callback) {
      this.callback(result);
    }
  }

  getBuffer(): Uint8Array {
    const result = new Uint8Array(this.length);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }
}

export function concatStream(callback?: (data: Uint8Array) => void): ConcatStream {
  return new ConcatStream(callback);
}

export default concatStream;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🌊 concat-stream - Concatenate Streams (POLYGLOT!)\\n");

  console.log("=== Example 1: Basic Usage ===");
  const stream = concatStream((data) => {
    console.log("Received:", new TextDecoder().decode(data));
  });
  stream.write(new TextEncoder().encode("Hello, "));
  stream.write(new TextEncoder().encode("World!"));
  stream.end();
  console.log();

  console.log("🚀 ~3M+ downloads/week on npm!");
}
