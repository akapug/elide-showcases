/**
 * Through - Transform Stream
 * **POLYGLOT SHOWCASE**: Transform streams for ALL languages on Elide!
 * Package has ~80M+ downloads/week on npm!
 */

import { EventEmitter } from '../events/elide-events.ts';

export default function through(
  write?: (data: any) => void,
  end?: () => void
): Stream {
  const stream = new Stream();

  if (write) {
    stream.write = function(data: any) {
      write.call(stream, data);
      return true;
    };
  }

  if (end) {
    stream.end = function() {
      end.call(stream);
      stream.emit('end');
    };
  }

  return stream;
}

class Stream extends EventEmitter {
  writable = true;
  readable = true;
  paused = false;
  ended = false;

  write(data: any): boolean {
    this.emit('data', data);
    return true;
  }

  end(data?: any): void {
    if (data !== undefined) {
      this.write(data);
    }
    this.ended = true;
    this.emit('end');
  }

  pause(): this {
    this.paused = true;
    this.emit('pause');
    return this;
  }

  resume(): this {
    this.paused = false;
    this.emit('resume');
    return this;
  }

  pipe<T extends any>(dest: T & { write: Function; end: Function }): T {
    this.on('data', (data) => {
      if (dest.write(data) === false) {
        this.pause();
      }
    });

    this.on('end', () => {
      dest.end();
    });

    return dest;
  }

  queue(data: any): this {
    this.write(data);
    return this;
  }

  destroy(): void {
    this.ended = true;
    this.emit('close');
  }
}

if (import.meta.url.includes("elide-through.ts")) {
  console.log("🎯 Through - Transform Streams (POLYGLOT!)\n");

  const stream = through(
    function(data) {
      this.queue(data.toString().toUpperCase());
    },
    function() {
      this.queue('END');
    }
  );

  stream.on('data', (data) => console.log(`  ${data}`));

  stream.write('hello');
  stream.write('world');
  stream.end();

  console.log("\n✅ ~80M+ downloads/week on npm");
}
