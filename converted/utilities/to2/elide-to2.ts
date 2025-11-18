/**
 * To2 - Create Writable Stream
 * **POLYGLOT SHOWCASE**: Writable stream creation for ALL languages on Elide!
 * Package has ~8M+ downloads/week on npm!
 */

import { Writable } from '../readable-stream/elide-readable-stream.ts';

export default function to2(write: (chunk: any, next: Function) => void, flush?: (next: Function) => void): Writable {
  const stream = new To2Stream();

  stream._write = function(chunk: any, callback: Function) {
    write.call(this, chunk, callback);
  };

  if (flush) {
    (stream as any)._flush = function(callback: Function) {
      flush.call(this, callback);
    };
  }

  return stream;
}

class To2Stream extends Writable {}

export function obj(write: (chunk: any, next: Function) => void, flush?: (next: Function) => void): Writable {
  return to2(write, flush);
}

if (import.meta.url.includes("elide-to2.ts")) {
  console.log("🎯 To2 - Create Writable Streams (POLYGLOT!)\n");

  const stream = to2(function(chunk, next) {
    console.log(`  Writing: ${chunk}`);
    next();
  });

  stream.write('Hello');
  stream.write('World');
  stream.end();

  console.log("\n✅ ~8M+ downloads/week on npm");
}
