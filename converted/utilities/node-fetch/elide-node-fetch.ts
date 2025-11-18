/**
 * Node-Fetch - Fetch API for Node.js
 *
 * A light-weight module that brings window.fetch to Node.js
 * **POLYGLOT SHOWCASE**: One fetch implementation for ALL languages on Elide!
 *
 * Features:
 * - Standard Fetch API
 * - Promise-based
 * - Request and Response objects
 * - Headers API
 * - Stream support
 * - Redirect handling
 * - Timeout support
 * - JSON/Text/Blob responses
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need fetch API
 * - ONE implementation works everywhere on Elide
 * - Consistent fetch behavior across languages
 * - No need for language-specific fetch libs
 *
 * Use cases:
 * - HTTP requests
 * - API calls
 * - Web scraping
 * - Data fetching
 * - File downloads
 *
 * Package has ~80M downloads/week on npm!
 */

export interface FetchInit extends RequestInit {
  timeout?: number;
  follow?: number;
  compress?: boolean;
}

/**
 * Fetch implementation with extended options
 */
export async function fetch(url: string | Request, init?: FetchInit): Promise<Response> {
  const {
    timeout = 0,
    follow = 20,
    compress = true,
    signal,
    ...fetchOptions
  } = init || {};

  // Handle timeout
  if (timeout > 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await globalThis.fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`network timeout at: ${url}`);
      }
      throw error;
    }
  }

  return globalThis.fetch(url, fetchOptions);
}

/**
 * Convenient methods for common HTTP verbs
 */
export const get = async (url: string, init?: FetchInit) =>
  fetch(url, { ...init, method: 'GET' });

export const post = async (url: string, body?: any, init?: FetchInit) =>
  fetch(url, { ...init, method: 'POST', body: JSON.stringify(body) });

export const put = async (url: string, body?: any, init?: FetchInit) =>
  fetch(url, { ...init, method: 'PUT', body: JSON.stringify(body) });

export const del = async (url: string, init?: FetchInit) =>
  fetch(url, { ...init, method: 'DELETE' });

export default fetch;

// CLI Demo
if (import.meta.url.includes("elide-node-fetch.ts")) {
  console.log("🌐 Node-Fetch - Fetch API for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic GET ===");
  console.log("const response = await fetch('https://api.example.com/users');");
  console.log("const data = await response.json();");
  console.log();

  console.log("=== Example 2: POST with JSON ===");
  console.log("const response = await fetch('https://api.example.com/users', {");
  console.log("  method: 'POST',");
  console.log("  headers: { 'Content-Type': 'application/json' },");
  console.log("  body: JSON.stringify({ name: 'John' })");
  console.log("});");
  console.log();

  console.log("=== Example 3: With Timeout ===");
  console.log("const response = await fetch('https://api.example.com/data', {");
  console.log("  timeout: 5000  // 5 seconds");
  console.log("});");
  console.log();

  console.log("=== Example 4: Custom Headers ===");
  console.log("const response = await fetch('https://api.example.com/data', {");
  console.log("  headers: {");
  console.log("    'Authorization': 'Bearer token',");
  console.log("    'Accept': 'application/json'");
  console.log("  }");
  console.log("});");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- HTTP requests");
  console.log("- API calls");
  console.log("- Web scraping");
  console.log("- Data fetching");
  console.log("- File downloads");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Built on native fetch");
  console.log("- ~80M downloads/week on npm");
  console.log();
}
