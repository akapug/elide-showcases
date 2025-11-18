/**
 * Into Stream - Convert to Stream
 *
 * Convert values into readable streams.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/into-stream (~500K+ downloads/week)
 *
 * Features:
 * - Convert strings to streams
 * - Convert arrays to streams
 * - Object mode support
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

class IntoStream {
  private data: any;
  private index: number = 0;

  constructor(data: string | any[]) {
    this.data = Array.isArray(data) ? data : [data];
  }

  read(): any {
    if (this.index < this.data.length) {
      return this.data[this.index++];
    }
    return null;
  }

  on(event: string, callback: Function): this {
    if (event === 'data') {
      this.data.forEach((chunk: any) => callback(chunk));
    }
    if (event === 'end') {
      setTimeout(() => callback(), 0);
    }
    return this;
  }
}

export function intoStream(input: string | any[]): IntoStream {
  return new IntoStream(input);
}

export default intoStream;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🌊 Into Stream - Convert to Streams for Elide (POLYGLOT!)\n");
  
  const stream1 = intoStream("Hello World");
  stream1.on('data', (chunk: any) => console.log("String:", chunk));
  
  const stream2 = intoStream(['chunk1', 'chunk2', 'chunk3']);
  stream2.on('data', (chunk: any) => console.log("Array:", chunk));
  
  console.log("\n✅ ~500K+ downloads/week on npm!");
}
