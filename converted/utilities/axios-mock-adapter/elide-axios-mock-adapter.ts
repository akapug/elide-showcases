/**
 * Axios Mock Adapter - Mock axios requests for testing
 * Package has ~8M downloads/week on npm!
 */

export class MockAdapter {
  private mocks: Map<string, any> = new Map();

  constructor(private axiosInstance: any) {
    const originalRequest = axiosInstance.request.bind(axiosInstance);

    axiosInstance.request = async (config: any) => {
      const key = `${config.method}:${config.url}`;
      if (this.mocks.has(key)) {
        const mockResponse = this.mocks.get(key);
        return {
          data: mockResponse.data,
          status: mockResponse.status || 200,
          statusText: 'OK',
          headers: mockResponse.headers || {},
          config,
        };
      }
      return originalRequest(config);
    };
  }

  onGet(url: string) {
    return this.on('GET', url);
  }

  onPost(url: string) {
    return this.on('POST', url);
  }

  on(method: string, url: string) {
    const key = `${method}:${url}`;
    return {
      reply: (status: number, data?: any, headers?: any) => {
        this.mocks.set(key, { status, data, headers });
      },
    };
  }

  reset() {
    this.mocks.clear();
  }
}

export default MockAdapter;

if (import.meta.url.includes("elide-axios-mock-adapter.ts")) {
  console.log("🌐 Axios Mock Adapter - Mock requests (POLYGLOT!) | ~8M downloads/week");
}
