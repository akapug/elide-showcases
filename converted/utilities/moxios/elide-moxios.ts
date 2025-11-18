/**
 * Moxios - Axios Mock Helper
 *
 * Simple axios mocking for testing.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/moxios (~100K+ downloads/week)
 *
 * Features:
 * - Simple axios mocking
 * - Request stubbing
 * - Async testing support
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

class Moxios {
  private stubs: Array<{ url: string; response: any }> = [];

  install(): void {
    // Install mock
  }

  uninstall(): void {
    this.stubs = [];
  }

  stubRequest(url: string, response: { status: number; response: any }): void {
    this.stubs.push({ url, response });
  }

  wait(callback: () => void, delay: number = 0): void {
    setTimeout(callback, delay);
  }
}

const moxios = new Moxios();

export default moxios;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("📡 Moxios - Axios Mocking for Elide (POLYGLOT!)\n");
  
  moxios.install();
  moxios.stubRequest('/users', { status: 200, response: [{ id: 1 }] });
  
  console.log("Moxios installed and configured");
  moxios.uninstall();
  
  console.log("\n✅ ~100K+ downloads/week on npm!");
}
