/**
 * Get Stdin - Read from Standard Input
 *
 * Read input from stdin.
 * **POLYGLOT SHOWCASE**: Stdin reading for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/get-stdin (~3M+ downloads/week)
 *
 * Features:
 * - Read from stdin
 * - Promise-based API
 * - Buffer support
 * - Encoding options
 * - Zero dependencies
 *
 * Package has ~3M+ downloads/week on npm!
 */

export async function getStdin(encoding: BufferEncoding = 'utf8'): Promise<string> {
  if (process.stdin.isTTY) {
    return '';
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];

    process.stdin.on('data', (chunk) => {
      chunks.push(chunk);
    });

    process.stdin.on('end', () => {
      resolve(Buffer.concat(chunks).toString(encoding));
    });

    process.stdin.resume();
  });
}

export default getStdin;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📥 Get Stdin - Read Input (POLYGLOT!)\n");

  if (process.stdin.isTTY) {
    console.log("No piped input detected.");
    console.log("Try: echo 'hello' | node elide-get-stdin.ts");
  } else {
    (async () => {
      const input = await getStdin();
      console.log("Received:", input);
    })();
  }

  console.log("\n🚀 ~3M+ downloads/week on npm!");
}
