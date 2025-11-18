/**
 * Range Parser - HTTP Range Header Parser
 *
 * Parse HTTP Range header.
 * **POLYGLOT SHOWCASE**: Range parsing for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/range-parser (~20M downloads/week)
 *
 * Features:
 * - Parse Range header
 * - Support multiple ranges
 * - Validate ranges
 * - Handle suffix ranges
 * - Zero dependencies
 *
 * Use cases:
 * - Partial content delivery
 * - Video streaming
 * - Large file downloads
 * - Resume support
 *
 * Package has ~20M downloads/week on npm!
 */

export interface Range {
  start: number;
  end: number;
}

export type Ranges = Range[] & { type: string };

/**
 * Parse Range header
 */
export default function rangeParser(size: number, str: string, options?: { combine?: boolean }): Ranges | number {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }

  const match = str.match(/^bytes=(.+)$/);
  if (!match) {
    return -2; // malformed
  }

  const rangeSpecs = match[1].split(",");
  const ranges: Range[] = [];

  for (const spec of rangeSpecs) {
    const parts = spec.trim().split("-");
    let start = parseInt(parts[0], 10);
    let end = parseInt(parts[1], 10);

    if (isNaN(start)) {
      // Suffix range
      start = size - end;
      end = size - 1;
    } else if (isNaN(end)) {
      // Open-ended range
      end = size - 1;
    }

    if (start < 0 || start >= size || end < 0 || end >= size || start > end) {
      return -1; // unsatisfiable
    }

    ranges.push({ start, end });
  }

  if (options?.combine) {
    // Combine overlapping ranges
    ranges.sort((a, b) => a.start - b.start);
    const combined: Range[] = [ranges[0]];

    for (let i = 1; i < ranges.length; i++) {
      const last = combined[combined.length - 1];
      const current = ranges[i];

      if (current.start <= last.end + 1) {
        last.end = Math.max(last.end, current.end);
      } else {
        combined.push(current);
      }
    }

    const result = combined as Ranges;
    result.type = "bytes";
    return result;
  }

  const result = ranges as Ranges;
  result.type = "bytes";
  return result;
}

export { rangeParser };

// CLI Demo
if (import.meta.url.includes("elide-range-parser.ts")) {
  console.log("📏 Range Parser - HTTP Range Header (POLYGLOT!)\n");

  const fileSize = 1000;

  console.log("=== Example 1: Simple Range ===");
  const range1 = rangeParser(fileSize, "bytes=0-499");
  console.log(`Range: bytes=0-499`);
  console.log(`Result:`, range1);
  console.log();

  console.log("=== Example 2: Open-ended Range ===");
  const range2 = rangeParser(fileSize, "bytes=500-");
  console.log(`Range: bytes=500-`);
  console.log(`Result:`, range2);
  console.log();

  console.log("=== Example 3: Suffix Range ===");
  const range3 = rangeParser(fileSize, "bytes=-500");
  console.log(`Range: bytes=-500`);
  console.log(`Result:`, range3);
  console.log();

  console.log("=== Example 4: Multiple Ranges ===");
  const range4 = rangeParser(fileSize, "bytes=0-199,500-699");
  console.log(`Range: bytes=0-199,500-699`);
  console.log(`Result:`, range4);
  console.log();

  console.log("=== Example 5: Combine Overlapping ===");
  const range5 = rangeParser(fileSize, "bytes=0-199,100-299", { combine: true });
  console.log(`Range: bytes=0-199,100-299 (combined)`);
  console.log(`Result:`, range5);
  console.log();

  console.log("=== Example 6: Invalid Range ===");
  const range6 = rangeParser(fileSize, "bytes=2000-3000");
  console.log(`Range: bytes=2000-3000`);
  console.log(`Result: ${range6 === -1 ? "Unsatisfiable" : range6}`);
  console.log();

  console.log("=== Example 7: Video Streaming ===");
  function streamVideo(rangeHeader: string | undefined, videoSize: number) {
    if (!rangeHeader) {
      return { status: 200, start: 0, end: videoSize - 1 };
    }

    const ranges = rangeParser(videoSize, rangeHeader);
    if (ranges === -1) {
      return { status: 416, error: "Range not satisfiable" };
    }
    if (ranges === -2) {
      return { status: 400, error: "Invalid range" };
    }

    const range = (ranges as Ranges)[0];
    return { status: 206, start: range.start, end: range.end };
  }

  const video = streamVideo("bytes=0-1023", 10000);
  console.log("Streaming:", video);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Partial content delivery");
  console.log("- Video streaming");
  console.log("- Large file downloads");
  console.log("- Resume support");
  console.log();

  console.log("💡 Polyglot: Same range logic across all languages!");
}
