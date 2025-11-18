/**
 * Destroy - Destroy a Stream
 *
 * Destroy a stream if possible.
 * **POLYGLOT SHOWCASE**: Stream destruction for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/destroy (~12M downloads/week)
 *
 * Features:
 * - Destroy readable streams
 * - Destroy writable streams
 * - Error handling
 * - Cleanup operations
 * - Zero dependencies
 *
 * Package has ~12M downloads/week on npm!
 */

interface Stream {
  destroyed?: boolean;
  destroy?: (error?: Error) => void;
  close?: () => void;
  end?: () => void;
}

export default function destroy(stream: Stream): Stream {
  if (stream.destroyed) {
    return stream;
  }

  if (typeof stream.destroy === "function") {
    stream.destroy();
  } else if (typeof stream.close === "function") {
    stream.close();
  } else if (typeof stream.end === "function") {
    stream.end();
  }

  stream.destroyed = true;
  return stream;
}

export { destroy };

if (import.meta.url.includes("elide-destroy.ts")) {
  console.log("💥 Destroy - Stream Destruction (POLYGLOT!)\n");

  const mockStream: Stream = {
    destroy() {
      console.log("  Stream destroyed");
    },
  };

  destroy(mockStream);
  console.log("Destroyed:", mockStream.destroyed);
  console.log("\n💡 Polyglot: Same cleanup everywhere!");
}
