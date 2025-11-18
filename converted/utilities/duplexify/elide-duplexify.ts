/**
 * duplexify - Turn Writable and Readable Streams into a Duplex Stream
 *
 * Create duplex (bidirectional) streams from separate readable and writable streams.
 *
 * Package has ~40M+ downloads/week on npm!
 */

interface DuplexifyOptions {
  readable?: boolean;
  writable?: boolean;
}

class Duplexify {
  private readableStream: any;
  private writableStream: any;
  private options: DuplexifyOptions;

  constructor(writable?: any, readable?: any, options: DuplexifyOptions = {}) {
    this.writableStream = writable;
    this.readableStream = readable;
    this.options = options;
  }

  setReadable(stream: any): void {
    this.readableStream = stream;
  }

  setWritable(stream: any): void {
    this.writableStream = stream;
  }

  write(chunk: any): boolean {
    if (this.writableStream && this.writableStream.write) {
      return this.writableStream.write(chunk);
    }
    return false;
  }

  read(size?: number): any {
    if (this.readableStream && this.readableStream.read) {
      return this.readableStream.read(size);
    }
    return null;
  }

  end(): void {
    if (this.writableStream && this.writableStream.end) {
      this.writableStream.end();
    }
  }
}

function duplexify(writable?: any, readable?: any, options?: DuplexifyOptions): Duplexify {
  return new Duplexify(writable, readable, options);
}

export default duplexify;
export { duplexify, Duplexify };

if (import.meta.url.includes("elide-duplexify.ts")) {
  console.log("📦 duplexify - Duplex Streams\n");
  console.log("Create duplex streams from readable and writable streams");
  console.log("\n🚀 ~40M+ downloads/week on npm");
}
