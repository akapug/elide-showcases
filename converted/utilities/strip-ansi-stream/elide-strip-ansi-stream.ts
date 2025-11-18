/**
 * Strip ANSI Stream - ANSI Code Stripping
 *
 * Strip ANSI escape codes from streams.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/strip-ansi-stream (~50K+ downloads/week)
 *
 * Features:
 * - Strip ANSI codes from streams
 * - Transform stream
 * - Clean output
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

class StripAnsiStream {
  private ansiRegex = /\\x1b\\[[0-9;]*m/g;

  transform(input: string): string {
    return input.replace(this.ansiRegex, '');
  }

  createStream(): any {
    return {
      write: (chunk: string) => this.transform(chunk),
      end: () => {}
    };
  }
}

export function stripAnsiStream(): StripAnsiStream {
  return new StripAnsiStream();
}

export default stripAnsiStream;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🎨 Strip ANSI Stream for Elide (POLYGLOT!)\n");
  
  const stream = stripAnsiStream();
  const colored = "\\x1b[31mRed\\x1b[0m Text";
  const clean = stream.transform(colored);
  
  console.log("Original:", colored);
  console.log("Cleaned:", clean);
  
  console.log("\n✅ ~50K+ downloads/week on npm!");
}
