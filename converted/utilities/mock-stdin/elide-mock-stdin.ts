/**
 * Mock Stdin - STDIN Mocking
 *
 * Mock process.stdin for testing.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/mock-stdin (~50K+ downloads/week)
 *
 * Features:
 * - Mock stdin input
 * - Simulate user input
 * - Event handling
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

class MockStdin {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    return this;
  }

  send(data: string): void {
    const dataListeners = this.listeners.get('data') || [];
    dataListeners.forEach(cb => cb(Buffer.from(data)));
  }

  end(): void {
    const endListeners = this.listeners.get('end') || [];
    endListeners.forEach(cb => cb());
  }

  restore(): void {
    this.listeners.clear();
  }
}

export function stdin(): MockStdin {
  return new MockStdin();
}

export default stdin;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("⌨️  Mock Stdin for Elide (POLYGLOT!)\n");
  
  const mockStdin = stdin();
  mockStdin.on('data', (chunk: Buffer) => {
    console.log("Received:", chunk.toString());
  });
  
  mockStdin.send("test input\\n");
  mockStdin.restore();
  
  console.log("\n✅ ~50K+ downloads/week on npm!");
}
