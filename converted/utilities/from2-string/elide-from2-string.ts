/**
 * From2 String - String to Stream
 *
 * Create readable stream from string.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/from2-string (~100K+ downloads/week)
 *
 * Features:
 * - String to stream conversion
 * - Readable stream API
 * - Simple interface
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

class From2String {
  private content: string;
  private position: number = 0;

  constructor(str: string) {
    this.content = str;
  }

  read(size?: number): string | null {
    if (this.position >= this.content.length) return null;
    const chunk = this.content.slice(this.position, size ? this.position + size : undefined);
    this.position += chunk.length;
    return chunk;
  }

  on(event: string, callback: Function): this {
    if (event === 'data') {
      callback(this.content);
    }
    if (event === 'end') {
      setTimeout(() => callback(), 0);
    }
    return this;
  }
}

export function from2String(str: string): From2String {
  return new From2String(str);
}

export default from2String;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("📝 From2 String - String to Stream for Elide (POLYGLOT!)\n");
  
  const stream = from2String("Hello from stream!");
  stream.on('data', (chunk: any) => {
    console.log("Received:", chunk);
  });
  
  console.log("\n✅ ~100K+ downloads/week on npm!");
}
