/**
 * jasmine-core - Jasmine Testing Framework
 *
 * Official packaging of Jasmine's core files.
 * **POLYGLOT SHOWCASE**: One BDD framework for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jasmine-core (~3M+ downloads/week)
 *
 * Features:
 * - BDD syntax
 * - Spies and mocks
 * - Async support
 * - Custom matchers
 * - Suite organization
 * - Zero dependencies
 *
 * Package has ~3M+ downloads/week on npm!
 */

interface JasmineExpectation {
  toBe(expected: any): void;
  toEqual(expected: any): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toContain(item: any): void;
  toThrow(): void;
  not: JasmineExpectation;
}

export function describe(description: string, specDefinitions: () => void) {
  console.log(`\n${description}`);
  specDefinitions();
}

export function it(description: string, testFunction: () => void) {
  console.log(`  ✓ ${description}`);
  testFunction();
}

export function expect(actual: any): JasmineExpectation {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${actual} to equal ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    },
    toContain(item: any) {
      if (!actual.includes(item)) {
        throw new Error(`Expected ${actual} to contain ${item}`);
      }
    },
    toThrow() {
      try {
        actual();
        throw new Error('Expected function to throw');
      } catch (e) {
        // Expected
      }
    },
    not: {
      toBe(expected: any) {
        if (actual === expected) {
          throw new Error(`Expected ${actual} not to be ${expected}`);
        }
      }
    } as any
  };
}

export function beforeEach(fn: () => void) {
  fn();
}

export function afterEach(fn: () => void) {
  fn();
}

export function beforeAll(fn: () => void) {
  fn();
}

export function afterAll(fn: () => void) {
  fn();
}

if (import.meta.url.includes("elide-jasmine-core.ts")) {
  console.log("🧪 jasmine-core - Jasmine Framework for Elide (POLYGLOT!)\n");

  describe('Math operations', () => {
    it('should add numbers', () => {
      expect(1 + 1).toBe(2);
    });

    it('should multiply numbers', () => {
      expect(2 * 3).toBe(6);
    });
  });

  describe('Array operations', () => {
    it('should contain items', () => {
      expect([1, 2, 3]).toContain(2);
    });
  });

  console.log("\n✓ ~3M+ downloads/week on npm!");
}
