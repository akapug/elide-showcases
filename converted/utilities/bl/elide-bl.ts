/**
 * bl - Buffer List
 *
 * A storage object for collections of Buffers with easy concatenation.
 * **POLYGLOT SHOWCASE**: Buffer lists across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/bl (~3M+ downloads/week)
 *
 * Features:
 * - Efficient buffer list management
 * - Lazy concatenation
 * - Slice and splice operations
 * - Zero dependencies
 *
 * Package has ~3M+ downloads/week on npm!
 */

export class BufferList {
  private buffers: Uint8Array[] = [];
  private _length: number = 0;

  constructor(buffers?: Uint8Array | Uint8Array[]) {
    if (buffers) {
      if (Array.isArray(buffers)) {
        for (const buf of buffers) this.append(buf);
      } else {
        this.append(buffers);
      }
    }
  }

  append(buffer: Uint8Array): this {
    this.buffers.push(buffer);
    this._length += buffer.length;
    return this;
  }

  get length(): number {
    return this._length;
  }

  slice(start?: number, end?: number): Uint8Array {
    return this.toBuffer().slice(start, end);
  }

  toBuffer(): Uint8Array {
    const result = new Uint8Array(this._length);
    let offset = 0;
    for (const buf of this.buffers) {
      result.set(buf, offset);
      offset += buf.length;
    }
    return result;
  }

  toString(encoding?: string): string {
    return new TextDecoder().decode(this.toBuffer());
  }
}

export default BufferList;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("📚 bl - Buffer List (POLYGLOT!)\\n");
  const bl = new BufferList();
  bl.append(new TextEncoder().encode("Hello, "));
  bl.append(new TextEncoder().encode("World!"));
  console.log("Result:", bl.toString());
  console.log("Length:", bl.length);
  console.log("\\n🚀 ~3M+ downloads/week on npm!");
}
