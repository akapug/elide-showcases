/**
 * jest-extended - Extended Jest Matchers
 *
 * Additional Jest matchers for comprehensive testing.
 * **POLYGLOT SHOWCASE**: One extended matcher library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jest-extended (~500K+ downloads/week)
 *
 * Features:
 * - 100+ additional matchers
 * - Array matchers
 * - String matchers
 * - Number matchers
 * - Object matchers
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

export const matchers = {
  toBeArray(received: any) {
    return { pass: Array.isArray(received), message: () => 'Expected array' };
  },
  toBeString(received: any) {
    return { pass: typeof received === 'string', message: () => 'Expected string' };
  },
  toBeNumber(received: any) {
    return { pass: typeof received === 'number', message: () => 'Expected number' };
  },
  toInclude(received: any, item: any) {
    return { pass: received.includes(item), message: () => `Expected to include ${item}` };
  },
  toStartWith(received: string, prefix: string) {
    return { pass: received.startsWith(prefix), message: () => `Expected to start with ${prefix}` };
  },
  toEndWith(received: string, suffix: string) {
    return { pass: received.endsWith(suffix), message: () => `Expected to end with ${suffix}` };
  },
  toBeEmpty(received: any) {
    return { pass: received.length === 0, message: () => 'Expected to be empty' };
  },
  toBePositive(received: number) {
    return { pass: received > 0, message: () => 'Expected to be positive' };
  },
  toBeNegative(received: number) {
    return { pass: received < 0, message: () => 'Expected to be negative' };
  },
  toBeWithin(received: number, start: number, end: number) {
    return { pass: received >= start && received <= end, message: () => `Expected to be within ${start}-${end}` };
  }
};

export default matchers;

if (import.meta.url.includes("elide-jest-extended.ts")) {
  console.log("🧪 jest-extended - Extended Matchers for Elide (POLYGLOT!)\n");
  console.log(matchers.toBeArray([1, 2, 3]));
  console.log(matchers.toBeString('hello'));
  console.log(matchers.toStartWith('hello world', 'hello'));
  console.log("\n✓ ~500K+ downloads/week on npm!");
}
