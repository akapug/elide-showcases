/**
 * Fetch Mock - Fetch API Mocking
 *
 * Mock fetch() calls for testing.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/fetch-mock (~200K+ downloads/week)
 *
 * Features:
 * - Mock fetch() calls
 * - Request matching
 * - Response customization
 * - Call history
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

interface MockResponse {
  status?: number;
  body?: any;
  headers?: Record<string, string>;
}

class FetchMock {
  private routes: Map<string, MockResponse> = new Map();
  private calls: Array<[string, RequestInit | undefined]> = [];

  mock(url: string | RegExp, response: MockResponse | any): this {
    const key = url instanceof RegExp ? url.source : url;
    this.routes.set(key, typeof response === 'object' && 'status' in response ? response : { status: 200, body: response });
    return this;
  }

  get(url: string, response: any): this {
    return this.mock(url, response);
  }

  post(url: string, response: any): this {
    return this.mock(url, response);
  }

  async mockFetch(url: string, init?: RequestInit): Promise<Response> {
    this.calls.push([url, init]);
    for (const [pattern, response] of this.routes) {
      if (url.includes(pattern) || new RegExp(pattern).test(url)) {
        return new Response(JSON.stringify(response.body), {
          status: response.status || 200,
          headers: response.headers
        });
      }
    }
    throw new Error(\`No mock found for: \${url}\`);
  }

  restore(): void {
    this.routes.clear();
    this.calls = [];
  }

  called(url?: string): boolean {
    if (!url) return this.calls.length > 0;
    return this.calls.some(([u]) => u.includes(url));
  }
}

const fetchMock = new FetchMock();

export default fetchMock;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🌐 Fetch Mock - Mock Fetch API for Elide (POLYGLOT!)\n");
  
  fetchMock.get('https://api.example.com/users', [{ id: 1, name: 'Alice' }]);
  fetchMock.post('https://api.example.com/users', { id: 2, name: 'Bob' });
  
  console.log("Fetch routes mocked");
  console.log("Called?", fetchMock.called());
  
  fetchMock.restore();
  console.log("\n✅ ~200K+ downloads/week on npm!");
}
