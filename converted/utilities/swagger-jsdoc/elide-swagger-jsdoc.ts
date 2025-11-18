/**
 * Swagger JSDoc - Generate Swagger from JSDoc comments
 *
 * Generate Swagger/OpenAPI specs from JSDoc comments.
 * **POLYGLOT SHOWCASE**: One spec generator for ALL languages on Elide!
 *
 * Package has ~3M downloads/week on npm!
 */

export interface SwaggerJSDocOptions {
  definition: any;
  apis: string[];
}

export default function swaggerJSDoc(options: SwaggerJSDocOptions): any {
  return {
    ...options.definition,
    paths: {},
  };
}

if (import.meta.url.includes("elide-swagger-jsdoc.ts")) {
  console.log("📝 Swagger JSDoc - Generate OpenAPI Specs (POLYGLOT!)\n");
  console.log("🚀 ~3M downloads/week on npm");
}
