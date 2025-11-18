/**
 * Pascal Case - Convert strings to PascalCase
 *
 * Convert any string to PascalCase (also known as UpperCamelCase).
 * Handles various input formats including kebab-case, snake_case, camelCase, and spaces.
 *
 * Features:
 * - Converts to PascalCase format
 * - Handles multiple input formats
 * - Preserves word boundaries
 * - Zero dependencies
 * - Type-safe TypeScript
 *
 * Use cases:
 * - Class name generation
 * - Component naming
 * - Type definitions
 * - API contract generation
 * - Code generation
 *
 * Package has ~8M+ downloads/week on npm!
 */

export default function pascalCase(str: string): string {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof str}`);
  }

  return str
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_, chr) => chr ? chr.toUpperCase() : '')
    .replace(/^(.)/, (_, chr) => chr.toUpperCase());
}

// CLI Demo
if (import.meta.url.includes("pascal-case")) {
  console.log("🔤 Pascal Case Converter for Elide\n");

  console.log("=== Example 1: Basic Conversions ===");
  console.log("foo-bar →", pascalCase("foo-bar"));
  console.log("hello_world →", pascalCase("hello_world"));
  console.log("test case →", pascalCase("test case"));
  console.log("camelCase →", pascalCase("camelCase"));
  console.log();

  console.log("=== Example 2: Class Names ===");
  console.log("user-service →", pascalCase("user-service"));
  console.log("http_client →", pascalCase("http_client"));
  console.log("data provider →", pascalCase("data provider"));
  console.log("api-controller →", pascalCase("api-controller"));
  console.log();

  console.log("=== Example 3: Component Names ===");
  console.log("my-component →", pascalCase("my-component"));
  console.log("user_profile →", pascalCase("user_profile"));
  console.log("login form →", pascalCase("login form"));
  console.log();

  console.log("=== Example 4: Multiple Delimiters ===");
  console.log("foo-bar_baz qux →", pascalCase("foo-bar_baz qux"));
  console.log("hello__world--test →", pascalCase("hello__world--test"));
  console.log();

  console.log("=== Example 5: Numbers ===");
  console.log("model-3d →", pascalCase("model-3d"));
  console.log("test_123_case →", pascalCase("test_123_case"));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Class name generation");
  console.log("- React/Vue component naming");
  console.log("- TypeScript interface names");
  console.log("- API contract generation");
  console.log("- Code scaffolding tools");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Pure TypeScript implementation");
  console.log("- ~8M+ downloads/week on npm");
  console.log("- Instant execution on Elide runtime");
}
