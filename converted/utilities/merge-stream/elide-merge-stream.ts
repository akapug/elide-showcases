/**
 * Merge Stream - Merge Multiple Streams
 * **POLYGLOT SHOWCASE**: Merge streams for ALL languages on Elide!
 * Package has ~80M+ downloads/week on npm!
 */

import { Readable } from '../readable-stream/elide-readable-stream.ts';

export default function mergeStream(...streams: Readable[]): Readable {
  const merged = new MergedStream();
  streams.forEach(s => merged.add(s));
  return merged;
}

class MergedStream extends Readable {
  private _sources: Readable[] = [];
  private _endCount = 0;

  add(stream: Readable): this {
    this._sources.push(stream);

    stream.on('data', (chunk) => {
      this.push(chunk);
    });

    stream.on('end', () => {
      this._endCount++;
      if (this._endCount === this._sources.length) {
        this.push(null);
      }
    });

    stream.on('error', (err) => {
      this.emit('error', err);
    });

    return this;
  }

  isEmpty(): boolean {
    return this._sources.length === 0;
  }
}

if (import.meta.url.includes("elide-merge-stream.ts")) {
  console.log("🎯 Merge Stream - Combine Streams (POLYGLOT!)\n");

  const stream1 = new Readable();
  const stream2 = new Readable();

  const merged = mergeStream(stream1, stream2);

  merged.on('data', (chunk) => console.log(`  ${chunk}`));

  stream1.push('Stream 1');
  stream2.push('Stream 2');
  stream1.push(null);
  stream2.push(null);

  console.log("\n✅ ~80M+ downloads/week on npm");
}
