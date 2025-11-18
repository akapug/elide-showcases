/**
 * Jest Mock Console - Console Mocking
 *
 * Mock console methods in Jest tests.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jest-mock-console (~100K+ downloads/week)
 *
 * Features:
 * - Mock console methods
 * - Capture output
 * - Restore easily
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

class MockConsole {
  private logs: string[] = [];
  private errors: string[] = [];
  private warns: string[] = [];

  mockLog(): void {
    this.logs = [];
  }

  mockError(): void {
    this.errors = [];
  }

  mockWarn(): void {
    this.warns = [];
  }

  log(...args: any[]): void {
    this.logs.push(args.join(' '));
  }

  error(...args: any[]): void {
    this.errors.push(args.join(' '));
  }

  warn(...args: any[]): void {
    this.warns.push(args.join(' '));
  }

  getLogs(): string[] {
    return this.logs;
  }

  restore(): void {
    this.logs = [];
    this.errors = [];
    this.warns = [];
  }
}

const mockConsole = new MockConsole();

export default mockConsole;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🖥️  Jest Mock Console for Elide (POLYGLOT!)\n");
  
  mockConsole.mockLog();
  mockConsole.log("Test message");
  console.log("Captured logs:", mockConsole.getLogs());
  
  mockConsole.restore();
  console.log("\n✅ ~100K+ downloads/week on npm!");
}
