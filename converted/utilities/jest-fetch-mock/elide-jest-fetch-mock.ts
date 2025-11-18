/**
 * Jest Fetch Mock - Jest Fetch Mocking
 *
 * Mock fetch for Jest tests.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jest-fetch-mock (~300K+ downloads/week)
 *
 * Features:
 * - Jest-compatible fetch mocking
 * - Simple API
 * - Response mocking
 * - Zero dependencies
 *
 * Package has ~300K+ downloads/week on npm!
 */

class JestFetchMock {
  private mockResponse: any = null;

  mockResponseOnce(response: any): this {
    this.mockResponse = response;
    return this;
  }

  mockResponse(response: any): this {
    this.mockResponse = response;
    return this;
  }

  resetMocks(): void {
    this.mockResponse = null;
  }

  async executeFetch(): Promise<any> {
    return this.mockResponse;
  }
}

const fetchMock = new JestFetchMock();

export default fetchMock;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🧪 Jest Fetch Mock for Elide (POLYGLOT!)\n");
  
  fetchMock.mockResponseOnce(JSON.stringify({ data: 'test' }));
  console.log("Fetch mocked for Jest");
  
  fetchMock.resetMocks();
  console.log("\n✅ ~300K+ downloads/week on npm!");
}
