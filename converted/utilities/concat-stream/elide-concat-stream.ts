/**
 * concat-stream - Concatenate Stream Data
 *
 * Collect stream data into a single buffer or string.
 *
 * Package has ~40M+ downloads/week on npm!
 */

interface ConcatStreamOptions {
  encoding?: 'string' | 'buffer' | 'array' | 'uint8array';
}

class ConcatStream {
  private chunks: Uint8Array[] = [];
  private options: ConcatStreamOptions;
  private callback?: (data: any) => void;

  constructor(options: ConcatStreamOptions | ((data: any) => void) = {}) {
    if (typeof options === 'function') {
      this.callback = options;
      this.options = { encoding: 'buffer' };
    } else {
      this.options = options;
    }
  }

  write(chunk: Uint8Array | string): void {
    if (typeof chunk === 'string') {
      this.chunks.push(new TextEncoder().encode(chunk));
    } else {
      this.chunks.push(chunk);
    }
  }

  end(chunk?: Uint8Array | string): any {
    if (chunk) {
      this.write(chunk);
    }

    const totalLength = this.chunks.reduce((sum, c) => sum + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    let finalResult: any = result;
    if (this.options.encoding === 'string') {
      finalResult = new TextDecoder().decode(result);
    } else if (this.options.encoding === 'array') {
      finalResult = Array.from(result);
    }

    if (this.callback) {
      this.callback(finalResult);
    }

    return finalResult;
  }
}

function concatStream(options?: ConcatStreamOptions | ((data: any) => void)): ConcatStream {
  return new ConcatStream(options);
}

export default concatStream;
export { concatStream, ConcatStream };

if (import.meta.url.includes("elide-concat-stream.ts")) {
  console.log("📦 concat-stream - Concatenate Stream Data\n");

  const stream = concatStream({ encoding: 'string' });
  stream.write("Hello, ");
  stream.write("World!");
  const result = stream.end();

  console.log("Concatenated:", result);
  console.log("\n🚀 ~40M+ downloads/week on npm");
}
