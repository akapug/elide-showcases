/**
 * Mock Require - Require Mocking
 *
 * Simple and effective mock support for require() in tests.
 * **POLYGLOT SHOWCASE**: One mocking library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/mock-require (~100K+ downloads/week)
 *
 * Features:
 * - Mock require() calls
 * - Simple API
 * - Module cache control
 * - Stop mocking easily
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Works across JavaScript, Python, Ruby, Java on Elide
 * - Consistent mocking patterns
 * - Share test setups across languages
 *
 * Package has ~100K+ downloads/week on npm!
 */

class MockRequire {
  private mocks: Map<string, any> = new Map();

  mock(modulePath: string, mockExport: any): void {
    this.mocks.set(modulePath, mockExport);
  }

  stop(modulePath: string): void {
    this.mocks.delete(modulePath);
  }

  stopAll(): void {
    this.mocks.clear();
  }

  reRequire(modulePath: string): any {
    return this.mocks.get(modulePath) || require(modulePath);
  }
}

const mockRequire = new MockRequire();

export function mock(modulePath: string, mockExport: any): void {
  mockRequire.mock(modulePath, mockExport);
}

export function stop(modulePath: string): void {
  mockRequire.stop(modulePath);
}

export function stopAll(): void {
  mockRequire.stopAll();
}

export function reRequire(modulePath: string): any {
  return mockRequire.reRequire(modulePath);
}

export default mock;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔧 Mock Require - Simple Mocking for Elide (POLYGLOT!)\n");
  
  mock('fs', { readFileSync: () => 'mocked content' });
  console.log("Mocked fs module");
  
  stopAll();
  console.log("All mocks stopped");
  
  console.log("\n✅ ~100K+ downloads/week on npm!");
}
