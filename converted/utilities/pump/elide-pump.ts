/**
 * Pump - Pipe Streams with Error Handling
 *
 * Pipe streams together and handle errors properly.
 * **POLYGLOT SHOWCASE**: One stream utility for ALL languages on Elide!
 *
 * Features:
 * - Pipe multiple streams
 * - Automatic error handling
 * - Cleanup on errors
 * - Callback on completion
 * - Destroy all streams on error
 * - Simple API
 * - No memory leaks
 * - Promise support
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need stream piping
 * - ONE implementation works everywhere on Elide
 * - Consistent stream handling
 * - Unified error handling
 *
 * Use cases:
 * - File processing pipelines
 * - Stream transformations
 * - Data processing
 * - Error-safe piping
 * - Resource cleanup
 *
 * Package has ~120M downloads/week on npm!
 */

export interface Stream {
  pipe?(dest: Stream): Stream;
  on?(event: string, handler: Function): void;
  destroy?(): void;
  end?(): void;
}

export type Callback = (error?: Error) => void;

/**
 * Pump streams together with error handling
 */
export function pump(...args: any[]): Stream | Promise<void> {
  const streams: Stream[] = [];
  let callback: Callback | undefined;

  // Parse arguments
  for (const arg of args) {
    if (typeof arg === 'function') {
      callback = arg as Callback;
    } else if (arg && typeof arg === 'object') {
      streams.push(arg as Stream);
    }
  }

  if (streams.length === 0) {
    throw new Error('pump requires at least one stream');
  }

  let destroyed = false;

  const cleanup = (err?: Error) => {
    if (destroyed) return;
    destroyed = true;

    // Destroy all streams
    for (const stream of streams) {
      if (stream.destroy) {
        try {
          stream.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }

    if (callback) {
      callback(err);
    }
  };

  // Pipe streams together
  for (let i = 0; i < streams.length - 1; i++) {
    const current = streams[i];
    const next = streams[i + 1];

    if (current.pipe) {
      current.pipe(next);
    }

    // Handle errors
    if (current.on) {
      current.on('error', (err: Error) => {
        cleanup(err);
      });
    }
  }

  // Handle last stream
  const lastStream = streams[streams.length - 1];
  if (lastStream.on) {
    lastStream.on('error', (err: Error) => {
      cleanup(err);
    });
    lastStream.on('finish', () => {
      cleanup();
    });
    lastStream.on('end', () => {
      cleanup();
    });
  }

  // Return promise if no callback
  if (!callback) {
    return new Promise<void>((resolve, reject) => {
      callback = (err) => {
        if (err) reject(err);
        else resolve();
      };
    });
  }

  return streams[0];
}

export default pump;

// CLI Demo
if (import.meta.url.includes("elide-pump.ts")) {
  console.log("🚰 Pump - Stream Piping for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Piping ===");
  console.log("import pump from './elide-pump.ts';");
  console.log("");
  console.log("pump(");
  console.log("  fs.createReadStream('input.txt'),");
  console.log("  transform(),");
  console.log("  fs.createWriteStream('output.txt'),");
  console.log("  (err) => {");
  console.log("    if (err) console.error('Pipeline failed', err);");
  console.log("    else console.log('Pipeline succeeded');");
  console.log("  }");
  console.log(");");
  console.log();

  console.log("=== Example 2: Error Handling ===");
  console.log("// Automatically cleans up on errors");
  console.log("pump(source, transform, dest, (err) => {");
  console.log("  // All streams destroyed if error occurs");
  console.log("  if (err) handleError(err);");
  console.log("});");
  console.log();

  console.log("=== Example 3: Promise API ===");
  console.log("try {");
  console.log("  await pump(source, transform, dest);");
  console.log("  console.log('Done!');");
  console.log("} catch (err) {");
  console.log("  console.error('Failed:', err);");
  console.log("}");
  console.log();

  console.log("=== Example 4: Multiple Transforms ===");
  console.log("pump(");
  console.log("  source,");
  console.log("  compress(),");
  console.log("  encrypt(),");
  console.log("  upload(),");
  console.log("  callback");
  console.log(");");
  console.log();

  console.log("=== Example 5: POLYGLOT Use Case ===");
  console.log("🌐 Stream piping in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Safe error handling");
  console.log("  ✓ Automatic cleanup");
  console.log("  ✓ No memory leaks");
  console.log("  ✓ Simple API");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- File processing pipelines");
  console.log("- Stream transformations");
  console.log("- Data compression pipelines");
  console.log("- Error-safe processing");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Efficient stream handling");
  console.log("- Automatic cleanup");
  console.log("- Zero dependencies");
  console.log("- ~120M downloads/week on npm");
}
