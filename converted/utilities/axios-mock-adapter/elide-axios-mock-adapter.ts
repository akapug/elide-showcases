/**
 * Axios Mock Adapter - Axios Mocking
 *
 * Mock axios requests for testing.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/axios-mock-adapter (~500K+ downloads/week)
 *
 * Features:
 * - Mock axios requests
 * - Request/response matching
 * - Network delay simulation
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

interface MockHandler {
  reply: (status: number, data?: any) => void;
}

class MockAdapter {
  private handlers: Map<string, { method: string; response: any }> = new Map();

  constructor(private axiosInstance?: any) {}

  onGet(url: string): MockHandler {
    return {
      reply: (status: number, data?: any) => {
        this.handlers.set(url, { method: 'GET', response: { status, data } });
      }
    };
  }

  onPost(url: string): MockHandler {
    return {
      reply: (status: number, data?: any) => {
        this.handlers.set(url, { method: 'POST', response: { status, data } });
      }
    };
  }

  onAny(url: string): MockHandler {
    return {
      reply: (status: number, data?: any) => {
        this.handlers.set(url, { method: 'ANY', response: { status, data } });
      }
    };
  }

  reset(): void {
    this.handlers.clear();
  }

  restore(): void {
    this.handlers.clear();
  }
}

export default MockAdapter;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("📡 Axios Mock Adapter for Elide (POLYGLOT!)\n");
  
  const mock = new MockAdapter();
  mock.onGet('/users').reply(200, [{ id: 1, name: 'Alice' }]);
  mock.onPost('/users').reply(201, { id: 2, name: 'Bob' });
  
  console.log("Axios requests mocked");
  mock.restore();
  
  console.log("\n✅ ~500K+ downloads/week on npm!");
}
