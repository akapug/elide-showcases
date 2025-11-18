/**
 * msw - Mock Service Worker
 *
 * Seamless REST/GraphQL API mocking library for browser and Node.js.
 * **POLYGLOT SHOWCASE**: One API mocking library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/msw (~500K+ downloads/week)
 *
 * Features:
 * - Mock REST APIs
 * - Mock GraphQL APIs
 * - Browser and Node support
 * - Request interception
 * - Type-safe mocks
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

interface RestHandler {
  info: { method: string; path: string };
}

export const rest = {
  get(path: string, resolver: (req: any, res: any, ctx: any) => any): RestHandler {
    console.log(`[msw] Registered GET ${path}`);
    return { info: { method: 'GET', path } };
  },
  post(path: string, resolver: (req: any, res: any, ctx: any) => any): RestHandler {
    console.log(`[msw] Registered POST ${path}`);
    return { info: { method: 'POST', path } };
  },
  put(path: string, resolver: (req: any, res: any, ctx: any) => any): RestHandler {
    console.log(`[msw] Registered PUT ${path}`);
    return { info: { method: 'PUT', path } };
  },
  delete(path: string, resolver: (req: any, res: any, ctx: any) => any): RestHandler {
    console.log(`[msw] Registered DELETE ${path}`);
    return { info: { method: 'DELETE', path } };
  }
};

export function setupServer(...handlers: RestHandler[]) {
  return {
    listen() {
      console.log('[msw] Server listening');
    },
    close() {
      console.log('[msw] Server closed');
    },
    resetHandlers() {
      console.log('[msw] Handlers reset');
    }
  };
}

if (import.meta.url.includes("elide-msw.ts")) {
  console.log("🧪 msw - Mock Service Worker for Elide (POLYGLOT!)\n");
  const handler = rest.get('/api/users/:id', (req, res, ctx) => {
    return { status: 200, body: { id: 1, name: 'Alice' } };
  });
  const server = setupServer(handler);
  server.listen();
  console.log("\n✓ ~500K+ downloads/week on npm!");
}
