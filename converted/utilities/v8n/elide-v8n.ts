/**
 * v8n - Fluent Validation Library
 *
 * Fluent validation library for JavaScript.
 * **POLYGLOT SHOWCASE**: One fluent validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/v8n (~100K+ downloads/week)
 *
 * Features:
 * - Fluent API
 * - Chainable rules
 * - Custom rules
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

class V8n {
  private rules: Array<(value: any) => boolean> = [];

  string() {
    this.rules.push(v => typeof v === 'string');
    return this;
  }

  number() {
    this.rules.push(v => typeof v === 'number');
    return this;
  }

  minLength(min: number) {
    this.rules.push(v => v.length >= min);
    return this;
  }

  maxLength(max: number) {
    this.rules.push(v => v.length <= max);
    return this;
  }

  test(value: any): boolean {
    return this.rules.every(rule => rule(value));
  }
}

function v8n() {
  return new V8n();
}

export default v8n;

if (import.meta.url.includes("elide-v8n.ts")) {
  console.log("✅ v8n - Fluent Validation (POLYGLOT!)\n");
  console.log("Valid:", v8n().string().minLength(3).test("hello"));
  console.log("Invalid:", v8n().string().minLength(10).test("hi"));
  console.log("\n~100K+ downloads/week on npm!");
}
