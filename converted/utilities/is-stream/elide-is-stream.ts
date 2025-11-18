// is-stream - Stream validation for Elide/TypeScript
// Original: https://github.com/sindresorhus/is-stream
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is a Stream (Node.js or Web Streams API).
 *
 * @param value - Value to test
 * @returns True if value is a stream
 *
 * @example
 * ```typescript
 * isStream(fs.createReadStream('file.txt'))  // true (Node.js)
 * isStream(new ReadableStream())             // true (Web)
 * isStream({})                               // false
 * isStream(null)                             // false
 * ```
 */
export default function isStream(value: any): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    (typeof value.pipe === 'function' ||
      value instanceof ReadableStream ||
      value instanceof WritableStream ||
      value instanceof TransformStream)
  );
}

/**
 * Check if value is a readable stream
 */
export function isReadableStream(value: any): boolean {
  return (
    isStream(value) &&
    (typeof value._read === 'function' ||
      value instanceof ReadableStream ||
      typeof value.getReader === 'function')
  );
}

/**
 * Check if value is a writable stream
 */
export function isWritableStream(value: any): boolean {
  return (
    isStream(value) &&
    (typeof value._write === 'function' ||
      value instanceof WritableStream ||
      typeof value.getWriter === 'function')
  );
}

// CLI usage
if (import.meta.url.includes("elide-is-stream.ts")) {
  console.log("🌊 is-stream - Stream Detection on Elide\n");

  console.log("=== Web Streams API ===");
  console.log(`isStream(new ReadableStream())    = ${isStream(new ReadableStream())}`);
  console.log(`isStream(new WritableStream())    = ${isStream(new WritableStream())}`);
  console.log();

  console.log("=== Non-Streams ===");
  console.log(`isStream({})                      = ${isStream({})}`);
  console.log(`isStream(null)                    = ${isStream(null)}`);
  console.log(`isStream({pipe: 'not-fn'})        = ${isStream({ pipe: 'not-fn' })}`);
  console.log();

  console.log("=== Type-Specific Checks ===");
  const readable = new ReadableStream();
  const writable = new WritableStream();
  console.log(`isReadableStream(ReadableStream)  = ${isReadableStream(readable)}`);
  console.log(`isWritableStream(WritableStream)  = ${isWritableStream(writable)}`);
  console.log();

  console.log("✅ 80M+ downloads/week on npm");
}
