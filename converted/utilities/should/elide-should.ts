/**
 * should - BDD assertion library
 *
 * Behavior-driven development style assertions.
 * **POLYGLOT SHOWCASE**: BDD assertions for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/should (~5M+ downloads/week)
 *
 * Features:
 * - Expressive BDD syntax
 * - Chainable assertions
 * - Property assertions
 * - Type checking
 * - Zero dependencies
 *
 * Use cases:
 * - BDD testing
 * - Readable assertions
 * - Test specifications
 *
 * Package has ~5M+ downloads/week on npm!
 */

class Should<T> {
  constructor(private value: T) {}

  get be(): this { return this; }
  get have(): this { return this; }
  get a(): this { return this; }
  get an(): this { return this; }

  equal(expected: T): void {
    if (JSON.stringify(this.value) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(this.value)} to equal ${JSON.stringify(expected)}`);
    }
  }

  exactly(expected: T): void {
    if (this.value !== expected) {
      throw new Error(`Expected ${this.value} to exactly equal ${expected}`);
    }
  }

  type(expected: string): void {
    const actualType = typeof this.value;
    if (actualType !== expected) {
      throw new Error(`Expected type ${actualType} to be ${expected}`);
    }
  }

  get ok(): void {
    if (!this.value) {
      throw new Error(`Expected ${this.value} to be truthy`);
    }
  }

  get true(): void {
    if (this.value !== true) {
      throw new Error(`Expected ${this.value} to be true`);
    }
  }

  get false(): void {
    if (this.value !== false) {
      throw new Error(`Expected ${this.value} to be false`);
    }
  }

  get null(): void {
    if (this.value !== null) {
      throw new Error(`Expected ${this.value} to be null`);
    }
  }

  length(n: number): void {
    const len = (this.value as any).length;
    if (len !== n) {
      throw new Error(`Expected length ${len} to equal ${n}`);
    }
  }

  match(pattern: RegExp): void {
    if (!pattern.test(String(this.value))) {
      throw new Error(`Expected "${this.value}" to match ${pattern}`);
    }
  }

  containEql(item: any): void {
    const contains = Array.isArray(this.value)
      ? (this.value as any[]).some(v => JSON.stringify(v) === JSON.stringify(item))
      : false;
    if (!contains) {
      throw new Error(`Expected ${JSON.stringify(this.value)} to contain ${JSON.stringify(item)}`);
    }
  }

  property(key: string, value?: any): void {
    if (!(key in (this.value as any))) {
      throw new Error(`Expected object to have property "${key}"`);
    }
    if (value !== undefined && (this.value as any)[key] !== value) {
      throw new Error(`Expected property "${key}" to equal ${value}`);
    }
  }

  throw(pattern?: string | RegExp): void {
    let threw = false;
    try {
      (this.value as any)();
    } catch (e) {
      threw = true;
      if (pattern) {
        const msg = (e as Error).message;
        const matches = typeof pattern === 'string' ? msg.includes(pattern) : pattern.test(msg);
        if (!matches) {
          throw new Error(`Expected error "${msg}" to match ${pattern}`);
        }
      }
    }
    if (!threw) {
      throw new Error('Expected function to throw');
    }
  }
}

function should<T>(value: T): Should<T> {
  return new Should(value);
}

// Extend Object prototype (optional)
should.extend = () => {
  Object.defineProperty(Object.prototype, 'should', {
    get() { return should(this); },
    configurable: true,
  });
};

export default should;

// CLI Demo
if (import.meta.url.includes('elide-should.ts')) {
  console.log('✅ should - BDD Assertions for Elide (POLYGLOT!)\n');

  console.log('Example 1: Basic Assertions\n');
  should(2 + 2).equal(4);
  should('test').be.a.type('string');
  console.log('✓ Basic assertions work');

  console.log('\nExample 2: Boolean Values\n');
  should(true).be.true;
  should(false).be.false;
  console.log('✓ Boolean checks work');

  console.log('\nExample 3: Arrays\n');
  should([1, 2, 3]).have.length(3);
  should([1, 2, 3]).containEql(2);
  console.log('✓ Array assertions work');

  console.log('\n✅ All assertions passed!');
  console.log('🚀 ~5M+ downloads/week on npm!');
  console.log('💡 Expressive BDD-style testing!');
}
