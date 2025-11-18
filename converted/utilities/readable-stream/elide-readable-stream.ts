/**
 * Readable Stream - Node.js Streams
 * **POLYGLOT SHOWCASE**: Node streams for ALL languages on Elide!
 * Package has ~150M+ downloads/week on npm!
 */

import { EventEmitter } from '../events/elide-events.ts';

export class Readable extends EventEmitter {
  private _destroyed = false;
  private _ended = false;
  private _paused = false;
  private _buffer: any[] = [];

  constructor() {
    super();
  }

  push(chunk: any): boolean {
    if (this._ended) return false;
    if (chunk === null) {
      this._ended = true;
      this.emit('end');
      return false;
    }
    if (!this._paused) {
      this.emit('data', chunk);
    } else {
      this._buffer.push(chunk);
    }
    return true;
  }

  pause(): this {
    this._paused = true;
    return this;
  }

  resume(): this {
    this._paused = false;
    while (this._buffer.length > 0 && !this._paused) {
      const chunk = this._buffer.shift();
      this.emit('data', chunk);
    }
    if (this._ended && this._buffer.length === 0) {
      this.emit('end');
    }
    return this;
  }

  pipe<T extends Writable>(destination: T): T {
    this.on('data', (chunk) => {
      if (destination.write(chunk) === false) {
        this.pause();
      }
    });

    this.on('end', () => {
      destination.end();
    });

    destination.on('drain', () => {
      this.resume();
    });

    return destination;
  }

  destroy(error?: Error): this {
    if (this._destroyed) return this;
    this._destroyed = true;
    if (error) this.emit('error', error);
    this.emit('close');
    return this;
  }

  _read(size?: number): void {
    // Override in subclasses
  }
}

export class Writable extends EventEmitter {
  private _buffer: any[] = [];
  private _writing = false;

  write(chunk: any): boolean {
    this._buffer.push(chunk);
    if (!this._writing) {
      this._process();
    }
    return this._buffer.length < 16;
  }

  end(chunk?: any): void {
    if (chunk !== undefined) {
      this.write(chunk);
    }
    this._ended = true;
    if (!this._writing && this._buffer.length === 0) {
      this.emit('finish');
    }
  }

  private _ended = false;

  private _process(): void {
    if (this._buffer.length === 0) {
      if (this._ended) {
        this.emit('finish');
      }
      return;
    }

    this._writing = true;
    const chunk = this._buffer.shift();

    this._write(chunk, (err?: Error) => {
      this._writing = false;
      if (err) {
        this.emit('error', err);
      } else {
        this.emit('drain');
        this._process();
      }
    });
  }

  _write(chunk: any, callback: (error?: Error) => void): void {
    // Override in subclasses
    callback();
  }
}

export class Transform extends Readable {
  private _writable = new Writable();

  write(chunk: any): boolean {
    return this._writable.write(chunk);
  }

  end(chunk?: any): void {
    this._writable.end(chunk);
  }

  _transform(chunk: any, callback: (error?: Error, data?: any) => void): void {
    // Override in subclasses
    callback(undefined, chunk);
  }
}

if (import.meta.url.includes("elide-readable-stream.ts")) {
  console.log("🎯 Readable Stream - Node Streams (POLYGLOT!)\n");

  const stream = new Readable();
  stream.on('data', (chunk) => console.log(`  Data: ${chunk}`));
  stream.on('end', () => console.log("  Stream ended"));

  stream.push('Hello');
  stream.push('World');
  stream.push(null);

  console.log("\n✅ ~150M+ downloads/week on npm");
}
