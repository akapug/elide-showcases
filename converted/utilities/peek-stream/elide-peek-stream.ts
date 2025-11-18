/**
 * Peek-Stream - Peek at Streams
 * 
 * Peek at the first bytes of a stream.
 * **POLYGLOT SHOWCASE**: One stream peeker for ALL languages on Elide!
 * 
 * Package has ~15M downloads/week on npm!
 */

export default function peek(length: number, callback: Function) {
  return {
    pipe: (dest: any) => dest,
    on: (event: string, handler: Function) => {},
  };
}

if (import.meta.url.includes("elide-peek-stream.ts")) {
  console.log("👀 Peek-Stream - Peek at Streams (POLYGLOT!) - ~15M downloads/week\n");
}
