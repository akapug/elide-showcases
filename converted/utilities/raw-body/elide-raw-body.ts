/**
 * Raw-Body - Get and Validate the Raw Body of a Request
 *
 * Core features:
 * - Request body parsing
 * - Content-Length validation
 * - Encoding support
 * - Size limits
 * - Stream handling
 * - Error handling
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 80M+ downloads/week
 */

export interface RawBodyOptions {
  length?: number | string | null;
  limit?: number | string;
  encoding?: BufferEncoding | string | true | null;
}

export interface RawBodyStream {
  on(event: string, listener: (...args: any[]) => void): any;
  removeListener(event: string, listener: (...args: any[]) => void): any;
}

export class RawBodyError extends Error {
  status: number;
  statusCode: number;
  type: string;
  expected?: number;
  received?: number;
  limit?: number;

  constructor(message: string, type: string, status: number = 400) {
    super(message);
    this.name = 'RawBodyError';
    this.type = type;
    this.status = status;
    this.statusCode = status;
  }
}

function parseLength(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;

  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

function parseLimit(value: number | string | undefined): number {
  if (value == null) return Infinity;
  if (typeof value === 'number') return value;

  const match = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i.exec(value);
  if (!match) return Infinity;

  const num = parseFloat(match[1]);
  const unit = (match[2] || 'b').toLowerCase();

  const multipliers: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  return num * (multipliers[unit] || 1);
}

export async function getRawBody(
  stream: RawBodyStream,
  options: RawBodyOptions | BufferEncoding | string = {}
): Promise<Buffer | string> {
  const opts: RawBodyOptions = typeof options === 'string'
    ? { encoding: options as BufferEncoding }
    : options;

  const length = parseLength(opts.length);
  const limit = parseLimit(opts.limit);
  const encoding = opts.encoding === true ? 'utf8' : opts.encoding;

  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks: Buffer[] = [];

    const onData = (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      received += buffer.length;

      if (limit && received > limit) {
        const err = new RawBodyError(
          `request entity too large`,
          'entity.too.large',
          413
        );
        err.limit = limit;
        err.received = received;
        cleanup();
        reject(err);
        return;
      }

      chunks.push(buffer);
    };

    const onEnd = () => {
      cleanup();

      if (length != null && received !== length) {
        const err = new RawBodyError(
          `request size did not match content length`,
          'request.size.invalid',
          400
        );
        err.expected = length;
        err.received = received;
        reject(err);
        return;
      }

      const body = Buffer.concat(chunks);
      resolve(encoding ? body.toString(encoding as BufferEncoding) : body);
    };

    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onError);
    };

    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onError);
  });
}

export default getRawBody;

if (import.meta.url.includes("raw-body")) {
  console.log("📦 Raw-Body for Elide - Request Body Parser\n");

  // Simple stream implementation for demo
  class SimpleStream {
    private listeners = new Map<string, Set<(...args: any[]) => void>>();
    private chunks: Buffer[];

    constructor(chunks: Buffer[]) {
      this.chunks = chunks;
    }

    on(event: string, listener: (...args: any[]) => void) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(listener);
      return this;
    }

    removeListener(event: string, listener: (...args: any[]) => void) {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(listener);
      }
      return this;
    }

    emit(event: string, ...args: any[]) {
      const listeners = this.listeners.get(event);
      if (listeners) {
        for (const listener of listeners) {
          listener(...args);
        }
      }
    }

    start() {
      setTimeout(() => {
        for (const chunk of this.chunks) {
          this.emit('data', chunk);
        }
        this.emit('end');
      }, 0);
    }
  }

  console.log("=== Basic Usage ===");
  const stream1 = new SimpleStream([Buffer.from('Hello '), Buffer.from('World')]);

  getRawBody(stream1, 'utf8').then((body) => {
    console.log("Body:", body);
  });

  stream1.start();

  console.log("\n=== With Limit ===");
  setTimeout(() => {
    const stream2 = new SimpleStream([Buffer.from('x'.repeat(100))]);

    getRawBody(stream2, { limit: 50, encoding: 'utf8' }).catch((err) => {
      console.log("Error:", err.message);
      console.log("Type:", err.type);
    });

    stream2.start();
  }, 50);

  setTimeout(() => {
    console.log();
    console.log("✅ Use Cases: Body parsing, File uploads, API requests");
    console.log("🚀 80M+ npm downloads/week - Zero dependencies - Polyglot-ready");
  }, 100);
}
