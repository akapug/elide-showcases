/**
 * Split - Split a Text Stream into a Line Stream
 *
 * Core features:
 * - Split streams by delimiter
 * - Line-based splitting
 * - Custom matchers
 * - Newline handling
 * - Buffer management
 * - Transform stream
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 15M+ downloads/week
 */

export interface SplitOptions {
  matcher?: RegExp;
  mapper?: (line: string) => any;
  encoding?: BufferEncoding;
  maxLength?: number;
}

export class Split {
  private buffer: string = '';
  private matcher: RegExp;
  private mapper?: (line: string) => any;
  private encoding: BufferEncoding;
  private maxLength: number;
  private chunks: any[] = [];
  private ended: boolean = false;

  constructor(matcher?: RegExp | string, mapper?: (line: string) => any, options?: SplitOptions) {
    if (typeof matcher === 'string') {
      this.matcher = new RegExp(matcher.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
    } else if (matcher instanceof RegExp) {
      this.matcher = matcher;
    } else if (typeof matcher === 'function') {
      this.mapper = mapper as any;
      this.matcher = /\r?\n/;
    } else {
      this.matcher = options?.matcher || /\r?\n/;
    }

    if (typeof mapper === 'function') {
      this.mapper = mapper;
    } else if (typeof mapper === 'object') {
      options = mapper as SplitOptions;
    }

    this.encoding = options?.encoding || 'utf8';
    this.maxLength = options?.maxLength || Infinity;
    if (options?.mapper) this.mapper = options.mapper;
  }

  write(chunk: Buffer | string): void {
    if (this.ended) return;

    const str = typeof chunk === 'string' ? chunk : chunk.toString(this.encoding);
    this.buffer += str;

    const parts = this.buffer.split(this.matcher);
    this.buffer = parts.pop() || '';

    for (const part of parts) {
      if (part.length <= this.maxLength) {
        const line = this.mapper ? this.mapper(part) : part;
        if (line !== undefined) {
          this.chunks.push(line);
        }
      }
    }
  }

  end(chunk?: Buffer | string): void {
    if (chunk) this.write(chunk);

    if (this.buffer.length > 0) {
      const line = this.mapper ? this.mapper(this.buffer) : this.buffer;
      if (line !== undefined) {
        this.chunks.push(line);
      }
    }

    this.ended = true;
  }

  read(): any[] {
    const result = this.chunks;
    this.chunks = [];
    return result;
  }

  readAll(): any[] {
    return [...this.chunks];
  }

  get isEnded(): boolean {
    return this.ended;
  }
}

// Factory function
export function split(matcher?: RegExp | string, mapper?: (line: string) => any, options?: SplitOptions): Split {
  return new Split(matcher, mapper, options);
}

if (import.meta.url.includes("split")) {
  console.log("📝 Split for Elide - Text Stream Splitter\n");

  const splitter = new Split();

  console.log("=== Basic Line Splitting ===");
  splitter.write("line1\nline2\nline3");
  splitter.end();
  console.log("Lines:", splitter.read());

  console.log("\n=== Custom Delimiter ===");
  const csvSplitter = new Split(',');
  csvSplitter.write("a,b,c,d");
  csvSplitter.end();
  console.log("CSV Parts:", csvSplitter.read());

  console.log("\n=== With Mapper ===");
  const uppercaseSplitter = new Split(/\r?\n/, (line) => line.toUpperCase());
  uppercaseSplitter.write("hello\nworld");
  uppercaseSplitter.end();
  console.log("Uppercase Lines:", uppercaseSplitter.read());

  console.log();
  console.log("✅ Use Cases: Log parsing, CSV processing, Stream transformation");
  console.log("🚀 15M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default split;
