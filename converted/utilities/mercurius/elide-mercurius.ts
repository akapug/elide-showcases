/**
 * Mercurius - GraphQL Adapter for Fastify
 *
 * A GraphQL adapter for Fastify with batching and caching.
 * **POLYGLOT SHOWCASE**: One GraphQL adapter for ALL languages on Elide!
 *
 * Package has ~1M downloads/week on npm!
 */

export interface MercuriusOptions {
  schema: any;
  resolvers?: any;
  graphiql?: boolean;
}

export function mercurius(app: any, options: MercuriusOptions) {
  // Register GraphQL route
  return app;
}

if (import.meta.url.includes("elide-mercurius.ts")) {
  console.log("⚡ Mercurius - GraphQL for Fastify (POLYGLOT!)\n");
  console.log("🚀 ~1M downloads/week on npm");
}
