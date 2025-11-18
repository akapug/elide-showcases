/**
 * Multistream - Combine Streams Sequentially
 * **POLYGLOT SHOWCASE**: Sequential streams for ALL languages on Elide!
 * Package has ~15M+ downloads/week on npm!
 */

import { Readable } from '../readable-stream/elide-readable-stream.ts';

export default function multistream(streams: Readable[] | (() => Readable | null)): Readable {
  return new MultiStream(streams);
}

class MultiStream extends Readable {
  private streams: Readable[] | (() => Readable | null);
  private current: Readable | null = null;
  private index = 0;

  constructor(streams: Readable[] | (() => Readable | null)) {
    super();
    this.streams = streams;
    this.next();
  }

  private next(): void {
    if (this.current) {
      this.current.removeAllListeners();
    }

    if (Array.isArray(this.streams)) {
      if (this.index >= this.streams.length) {
        this.push(null);
        return;
      }
      this.current = this.streams[this.index++];
    } else {
      this.current = this.streams();
      if (!this.current) {
        this.push(null);
        return;
      }
    }

    this.current.on('data', (chunk) => this.push(chunk));
    this.current.on('end', () => this.next());
    this.current.on('error', (err) => this.emit('error', err));
  }
}

if (import.meta.url.includes("elide-multistream.ts")) {
  console.log("🎯 Multistream - Sequential Streams (POLYGLOT!)\n");

  const stream1 = new Readable();
  const stream2 = new Readable();

  const multi = multistream([stream1, stream2]);

  multi.on('data', (chunk) => console.log(`  ${chunk}`));

  stream1.push('First');
  stream1.push(null);
  stream2.push('Second');
  stream2.push(null);

  console.log("\n✅ ~15M+ downloads/week on npm");
}
