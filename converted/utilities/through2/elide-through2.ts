/**
 * Through2 - Transform Stream (Stream2 Compatible)
 * **POLYGLOT SHOWCASE**: Transform streams for ALL languages on Elide!
 * Package has ~120M+ downloads/week on npm!
 */

import { Transform } from '../readable-stream/elide-readable-stream.ts';

export default function through2(
  transform?: (chunk: any, enc: string, cb: Function) => void,
  flush?: (cb: Function) => void
): Transform {
  const stream = new Through2Stream();

  if (transform) {
    stream._transform = function(chunk, callback) {
      transform.call(this, chunk, 'utf8', (err?: Error, data?: any) => {
        if (err) return callback(err);
        if (data !== undefined) this.push(data);
        callback();
      });
    };
  }

  if (flush) {
    stream._flush = function(callback) {
      flush.call(this, callback);
    };
  }

  return stream;
}

class Through2Stream extends Transform {
  _flush(callback: (error?: Error) => void): void {
    callback();
  }
}

export function obj(
  transform?: (chunk: any, enc: string, cb: Function) => void,
  flush?: (cb: Function) => void
): Transform {
  return through2(transform, flush);
}

if (import.meta.url.includes("elide-through2.ts")) {
  console.log("🎯 Through2 - Transform Streams (POLYGLOT!)\n");

  const stream = through2(function(chunk, enc, cb) {
    this.push(chunk.toString().toUpperCase());
    cb();
  });

  stream.on('data', (data) => console.log(`  ${data}`));

  stream.write('hello');
  stream.write('world');
  stream.end();

  console.log("\n✅ ~120M+ downloads/week on npm");
}
