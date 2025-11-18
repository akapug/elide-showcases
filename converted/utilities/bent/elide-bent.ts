/**
 * Bent - Functional HTTP Client
 *
 * Functional HTTP client library for Node.js with a simple API.
 * **POLYGLOT SHOWCASE**: One HTTP client for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/bent (~100K+ downloads/week)
 *
 * Features:
 * - Functional programming style
 * - Promise-based
 * - Automatic JSON parsing
 * - Response type validation
 * - Status code handling
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need HTTP clients
 * - ONE implementation works everywhere on Elide
 * - Functional style works across languages
 * - Share HTTP logic across your stack
 *
 * Use cases:
 * - API clients (functional approach)
 * - Microservices communication
 * - Testing HTTP endpoints
 * - Data fetching
 *
 * Package has ~100K+ downloads/week on npm!
 */

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
type StatusCode = number | 'json' | 'string' | 'buffer';

/**
 * Create a bent request function
 */
export function bent(...args: any[]): Function {
  let baseUrl = '';
  let method: Method = 'GET';
  let headers: Record<string, string> = {};
  let expectedStatus: number[] | null = null;
  let responseType: 'json' | 'string' | 'buffer' = 'json';

  // Parse arguments
  for (const arg of args) {
    if (typeof arg === 'string') {
      if (arg.startsWith('http://') || arg.startsWith('https://')) {
        baseUrl = arg;
      } else if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(arg)) {
        method = arg as Method;
      } else if (arg === 'json' || arg === 'string' || arg === 'buffer') {
        responseType = arg;
      }
    } else if (typeof arg === 'number') {
      if (!expectedStatus) expectedStatus = [];
      expectedStatus.push(arg);
    } else if (typeof arg === 'object') {
      headers = { ...headers, ...arg };
    }
  }

  // Return request function
  return async (url: string, body?: any, extraHeaders?: Record<string, string>) => {
    const fullUrl = baseUrl ? new URL(url, baseUrl).toString() : url;
    const requestHeaders = { ...headers, ...extraHeaders };

    if (body && !requestHeaders['content-type']) {
      requestHeaders['content-type'] = 'application/json';
    }

    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
    });

    // Check status code
    if (expectedStatus && !expectedStatus.includes(response.status)) {
      throw new Error(\`Unexpected status code: \${response.status}\`);
    }

    // Parse response based on type
    if (responseType === 'json') {
      return await response.json();
    } else if (responseType === 'string') {
      return await response.text();
    } else {
      return await response.arrayBuffer();
    }
  };
}

// Convenience exports
export const get = bent('GET', 'json');
export const post = bent('POST', 'json');
export const put = bent('PUT', 'json');
export const del = bent('DELETE', 'json');
export const patch = bent('PATCH', 'json');

export default bent;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🎯 Bent - Functional HTTP Client for Elide (POLYGLOT!)\\n");

  (async () => {
    console.log("=== Example 1: Simple GET Request ===");
    try {
      const getJSON = bent('json');
      const data = await getJSON('https://jsonplaceholder.typicode.com/posts/1');
      console.log("Data:", data);
    } catch (err) {
      console.log("Error:", (err as Error).message);
    }
    console.log();

    console.log("=== Example 2: POST Request ===");
    try {
      const postJSON = bent('POST', 'json', 201);
      const created = await postJSON('https://jsonplaceholder.typicode.com/posts', {
        title: 'Test Post',
        body: 'This is a test',
        userId: 1
      });
      console.log("Created:", created);
    } catch (err) {
      console.log("Error:", (err as Error).message);
    }
    console.log();

    console.log("=== Example 3: Base URL ===");
    try {
      const api = bent('https://jsonplaceholder.typicode.com', 'json');
      const users = await api('/users/1');
      console.log("User:", users);
    } catch (err) {
      console.log("Error:", (err as Error).message);
    }
    console.log();

    console.log("=== Example 4: Custom Headers ===");
    try {
      const getWithAuth = bent('json', { 'Authorization': 'Bearer token123' });
      const data = await getWithAuth('https://httpbin.org/headers');
      console.log("Headers sent:", data);
    } catch (err) {
      console.log("Error:", (err as Error).message);
    }
    console.log();

    console.log("=== Example 5: POLYGLOT Use Case ===");
    console.log("🌐 Same bent library works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log();
    console.log("Benefits:");
    console.log("  ✓ Functional programming style");
    console.log("  ✓ Works across all languages");
    console.log("  ✓ ~100K+ downloads/week on npm!");
    console.log();
  })();
}
