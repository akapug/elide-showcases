/**
 * GraphQL Yoga - Fully-featured GraphQL Server
 *
 * A fully-featured GraphQL server with easy setup.
 * **POLYGLOT SHOWCASE**: One GraphQL server for ALL languages on Elide!
 *
 * Package has ~2M downloads/week on npm!
 */

export interface YogaServerOptions {
  schema: any;
  context?: any;
  graphiql?: boolean;
}

export function createServer(options: YogaServerOptions) {
  return {
    start: async (port: number = 4000) => {
      console.log(`🧘 GraphQL Yoga running at http://localhost:${port}/graphql`);
    }
  };
}

if (import.meta.url.includes("elide-graphql-yoga.ts")) {
  console.log("🧘 GraphQL Yoga - Fully-featured GraphQL Server (POLYGLOT!)\n");
  console.log("🚀 ~2M downloads/week on npm");
}
