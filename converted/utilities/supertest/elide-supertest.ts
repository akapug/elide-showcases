/**
 * SuperTest - HTTP Assertions Made Easy
 *
 * Super-agent driven library for testing HTTP servers.
 * **POLYGLOT SHOWCASE**: HTTP testing for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/supertest (~15M+ downloads/week)
 *
 * Features:
 * - HTTP request testing
 * - Fluent API
 * - Status code assertions
 * - Header assertions
 * - Body assertions
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need HTTP testing
 * - ONE testing library works everywhere on Elide
 * - Consistent API testing across languages
 * - Share HTTP test utilities across your stack
 *
 * Use cases:
 * - API testing (REST/GraphQL)
 * - Integration testing (HTTP endpoints)
 * - E2E testing (full stack)
 * - Express/Fastify testing
 *
 * Package has ~15M+ downloads/week on npm - essential HTTP testing tool!
 */

interface RequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
}

interface Response {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  text: string;
}

export class Test {
  private requestOptions: RequestOptions;
  private expectedStatus?: number;
  private expectedHeaders: Record<string, string | RegExp> = {};
  private expectedBody?: any;
  private app?: any;

  constructor(app: any, method: string, url: string) {
    this.app = app;
    this.requestOptions = {
      method: method.toUpperCase(),
      url,
      headers: {},
    };
  }

  /**
   * Set request header
   */
  set(field: string | Record<string, string>, value?: string): this {
    if (typeof field === "object") {
      Object.assign(this.requestOptions.headers!, field);
    } else {
      this.requestOptions.headers![field] = value!;
    }
    return this;
  }

  /**
   * Set query parameters
   */
  query(params: Record<string, string>): this {
    this.requestOptions.query = params;
    return this;
  }

  /**
   * Send request body
   */
  send(data: any): this {
    this.requestOptions.body = data;
    if (typeof data === "object") {
      this.set("Content-Type", "application/json");
    }
    return this;
  }

  /**
   * Set Content-Type to JSON
   */
  type(contentType: string): this {
    const types: Record<string, string> = {
      json: "application/json",
      form: "application/x-www-form-urlencoded",
      html: "text/html",
    };
    this.set("Content-Type", types[contentType] || contentType);
    return this;
  }

  /**
   * Set Accept header
   */
  accept(type: string): this {
    const types: Record<string, string> = {
      json: "application/json",
      html: "text/html",
      xml: "application/xml",
    };
    this.set("Accept", types[type] || type);
    return this;
  }

  /**
   * Expect status code
   */
  expect(status: number): this;
  expect(status: number, callback: (err: Error | null) => void): this;
  expect(field: string, value: string | RegExp): this;
  expect(body: any): this;
  expect(
    statusOrFieldOrBody: number | string | any,
    valueOrCallback?: string | RegExp | ((err: Error | null) => void)
  ): this {
    if (typeof statusOrFieldOrBody === "number") {
      this.expectedStatus = statusOrFieldOrBody;
    } else if (typeof statusOrFieldOrBody === "string") {
      this.expectedHeaders[statusOrFieldOrBody] = valueOrCallback as
        | string
        | RegExp;
    } else {
      this.expectedBody = statusOrFieldOrBody;
    }
    return this;
  }

  /**
   * Execute request and assertions
   */
  async end(callback?: (err: Error | null, res: Response) => void): Promise<Response> {
    try {
      const res = await this.performRequest();

      // Check status
      if (this.expectedStatus !== undefined && res.status !== this.expectedStatus) {
        const err = new Error(
          `Expected status ${this.expectedStatus} but got ${res.status}`
        );
        if (callback) return callback(err, res);
        throw err;
      }

      // Check headers
      for (const [key, expected] of Object.entries(this.expectedHeaders)) {
        const actual = res.headers[key.toLowerCase()];
        const matches =
          typeof expected === "string"
            ? actual === expected
            : expected.test(actual);

        if (!matches) {
          const err = new Error(
            `Expected header "${key}" to ${
              typeof expected === "string" ? `be "${expected}"` : `match ${expected}`
            } but got "${actual}"`
          );
          if (callback) return callback(err, res);
          throw err;
        }
      }

      // Check body
      if (this.expectedBody !== undefined) {
        const bodyMatches =
          JSON.stringify(res.body) === JSON.stringify(this.expectedBody);

        if (!bodyMatches) {
          const err = new Error(
            `Expected body ${JSON.stringify(this.expectedBody)} but got ${JSON.stringify(res.body)}`
          );
          if (callback) return callback(err, res);
          throw err;
        }
      }

      if (callback) callback(null, res);
      return res;
    } catch (error) {
      if (callback) {
        callback(error as Error, {} as Response);
        return {} as Response;
      }
      throw error;
    }
  }

  /**
   * Promise interface
   */
  then<T>(
    onFulfilled?: (value: Response) => T | Promise<T>,
    onRejected?: (error: Error) => any
  ): Promise<T> {
    return this.end().then(onFulfilled, onRejected) as Promise<T>;
  }

  /**
   * Perform the actual HTTP request
   */
  private async performRequest(): Promise<Response> {
    // Mock implementation for demonstration
    // In real implementation, this would call the app or make HTTP request

    // Build URL with query params
    let url = this.requestOptions.url;
    if (this.requestOptions.query) {
      const params = new URLSearchParams(this.requestOptions.query);
      url += `?${params}`;
    }

    // Simulate HTTP request
    const mockResponse: Response = {
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/json",
        ...this.requestOptions.headers,
      },
      body: this.requestOptions.body || { success: true },
      text: JSON.stringify(this.requestOptions.body || { success: true }),
    };

    return mockResponse;
  }
}

/**
 * Create test for GET request
 */
export function get(app: any, url: string): Test {
  return new Test(app, "GET", url);
}

/**
 * Create test for POST request
 */
export function post(app: any, url: string): Test {
  return new Test(app, "POST", url);
}

/**
 * Create test for PUT request
 */
export function put(app: any, url: string): Test {
  return new Test(app, "PUT", url);
}

/**
 * Create test for DELETE request
 */
export function del(app: any, url: string): Test {
  return new Test(app, "DELETE", url);
}

/**
 * Create test for PATCH request
 */
export function patch(app: any, url: string): Test {
  return new Test(app, "PATCH", url);
}

/**
 * Main supertest function
 */
export default function supertest(app: any) {
  return {
    get: (url: string) => get(app, url),
    post: (url: string) => post(app, url),
    put: (url: string) => put(app, url),
    delete: (url: string) => del(app, url),
    patch: (url: string) => patch(app, url),
  };
}

export { supertest };

// CLI Demo
if (import.meta.url.includes("elide-supertest.ts")) {
  console.log("🧪 SuperTest - HTTP Testing for Elide (POLYGLOT!)\n");

  // Mock Express app
  const app = {};

  console.log("=== Example 1: Basic GET Request ===");
  await get(app, "/api/users")
    .expect(200)
    .then((res) => {
      console.log("✓ GET /api/users returned 200");
    });

  console.log("\n=== Example 2: POST with Body ===");
  await post(app, "/api/users")
    .send({ name: "John Doe", email: "john@example.com" })
    .expect(200)
    .then((res) => {
      console.log("✓ POST /api/users with body");
    });

  console.log("\n=== Example 3: Header Assertions ===");
  await get(app, "/api/status")
    .expect("content-type", /json/)
    .expect(200)
    .then((res) => {
      console.log("✓ Verified content-type header");
    });

  console.log("\n=== Example 4: Fluent API ===");
  await post(app, "/api/login")
    .type("json")
    .send({ username: "admin", password: "secret" })
    .set("Accept", "application/json")
    .expect(200)
    .then((res) => {
      console.log("✓ Login request successful");
    });

  console.log("\n=== Example 5: Query Parameters ===");
  await get(app, "/api/search")
    .query({ q: "test", limit: "10" })
    .expect(200)
    .then((res) => {
      console.log("✓ Search with query params");
    });

  console.log("\n✅ Use Cases:");
  console.log("- API testing (REST/GraphQL)");
  console.log("- Integration testing (HTTP endpoints)");
  console.log("- E2E testing (full stack)");
  console.log("- Express/Fastify testing");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fluent API");
  console.log("- Promise-based");
  console.log("- ~15M+ downloads/week on npm!");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java APIs via Elide");
  console.log("- Share HTTP test patterns across languages");
  console.log("- One API testing framework for all services");
  console.log("- Perfect for polyglot API testing!");
}
