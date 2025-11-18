/**
 * Combine Streams - Stream Combiner
 * **POLYGLOT SHOWCASE**: Combine streams for ALL languages on Elide!
 * Package has ~5M+ downloads/week on npm!
 */

import { Readable } from '../readable-stream/elide-readable-stream.ts';

export default function combineStreams(streams: Readable[]): Readable {
  const combined = new CombinedStream();

  for (const stream of streams) {
    stream.on('data', (chunk) => combined.push(chunk));
    stream.on('error', (err) => combined.emit('error', err));
  }

  let endedCount = 0;
  for (const stream of streams) {
    stream.on('end', () => {
      endedCount++;
      if (endedCount === streams.length) {
        combined.push(null);
      }
    });
  }

  return combined;
}

class CombinedStream extends Readable {}

if (import.meta.url.includes("elide-combine-streams.ts")) {
  console.log("🎯 Combine Streams - Stream Combiner (POLYGLOT!)\n");

  const stream1 = new Readable();
  const stream2 = new Readable();

  const combined = combineStreams([stream1, stream2]);

  combined.on('data', (chunk) => console.log(`  ${chunk}`));

  stream1.push('A');
  stream2.push('B');
  stream1.push(null);
  stream2.push(null);

  console.log("\n✅ ~5M+ downloads/week on npm");
}
