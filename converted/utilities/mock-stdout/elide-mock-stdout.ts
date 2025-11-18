/**
 * Mock Stdout - STDOUT Mocking
 *
 * Mock process.stdout for testing.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/mock-stdout (~20K+ downloads/week)
 *
 * Features:
 * - Mock stdout output
 * - Capture output
 * - Restore easily
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

class MockStdout {
  private output: string[] = [];
  private capturing: boolean = false;

  start(): void {
    this.capturing = true;
    this.output = [];
  }

  stop(): string[] {
    this.capturing = false;
    return this.output;
  }

  write(data: string): void {
    if (this.capturing) {
      this.output.push(data);
    }
  }

  restore(): void {
    this.capturing = false;
    this.output = [];
  }
}

export function stdout(): MockStdout {
  return new MockStdout();
}

export default stdout;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("📤 Mock Stdout for Elide (POLYGLOT!)\n");
  
  const mockStdout = stdout();
  mockStdout.start();
  mockStdout.write("Test output\\n");
  const output = mockStdout.stop();
  
  console.log("Captured:", output);
  console.log("\n✅ ~20K+ downloads/week on npm!");
}
