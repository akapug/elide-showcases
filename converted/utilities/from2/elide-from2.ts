/**
 * From2 - Create Readable Stream
 * **POLYGLOT SHOWCASE**: Stream creation for ALL languages on Elide!
 * Package has ~40M+ downloads/week on npm!
 */

import { Readable } from '../readable-stream/elide-readable-stream.ts';

export default function from2(read: (size: number, next: Function) => void): Readable {
  const stream = new From2Stream();
  stream._read = function(size?: number) {
    read.call(this, size || 0, (err?: Error, data?: any) => {
      if (err) return stream.destroy(err);
      stream.push(data === undefined ? null : data);
    });
  };
  return stream;
}

class From2Stream extends Readable {}

export function obj(read: (size: number, next: Function) => void): Readable {
  return from2(read);
}

if (import.meta.url.includes("elide-from2.ts")) {
  console.log("🎯 From2 - Create Readable Streams (POLYGLOT!)\n");

  let count = 0;
  const stream = from2(function(size, next) {
    if (count++ < 3) {
      next(null, `Item ${count}`);
    } else {
      next(null, null);
    }
  });

  stream.on('data', (data) => console.log(`  ${data}`));

  console.log("\n✅ ~40M+ downloads/week on npm");
}
