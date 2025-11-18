/**
 * Stream Combiner - Pipe Stream Chain
 * **POLYGLOT SHOWCASE**: Stream piping for ALL languages on Elide!
 * Package has ~15M+ downloads/week on npm!
 */

import { Transform } from '../readable-stream/elide-readable-stream.ts';

export default function streamCombiner(...streams: any[]): any {
  if (streams.length === 0) {
    return new Transform();
  }

  const first = streams[0];
  const last = streams[streams.length - 1];

  for (let i = 0; i < streams.length - 1; i++) {
    streams[i].pipe(streams[i + 1]);
  }

  first.on('error', (err: Error) => last.emit('error', err));

  return first;
}

if (import.meta.url.includes("elide-stream-combiner.ts")) {
  console.log("🎯 Stream Combiner - Pipe Chains (POLYGLOT!)\n");
  console.log("  ✓ Combines streams via pipe");
  console.log("\n✅ ~15M+ downloads/week on npm");
}
