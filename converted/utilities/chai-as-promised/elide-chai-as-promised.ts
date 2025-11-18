/**
 * chai-as-promised - Promise assertions
 *
 * Assertions for async/promise-based code.
 * **POLYGLOT SHOWCASE**: Async assertions for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/chai-as-promised (~10M+ downloads/week)
 *
 * Features:
 * - Promise assertions
 * - Async/await support
 * - Rejection testing
 * - Fulfillment testing
 * - Zero dependencies
 *
 * Use cases:
 * - Async testing
 * - Promise validation
 * - API testing
 *
 * Package has ~10M+ downloads/week on npm!
 */

class PromiseAssertion<T> {
  constructor(private promise: Promise<T>) {}

  async toBeRejected(): Promise<void> {
    let rejected = false;
    try {
      await this.promise;
    } catch (e) {
      rejected = true;
    }
    if (!rejected) {
      throw new Error('Expected promise to be rejected');
    }
  }

  async toBeFulfilled(): Promise<void> {
    try {
      await this.promise;
    } catch (e) {
      throw new Error(`Expected promise to be fulfilled, but it was rejected: ${(e as Error).message}`);
    }
  }

  async toBeRejectedWith(pattern: string | RegExp): Promise<void> {
    let rejected = false;
    let error: Error | undefined;
    try {
      await this.promise;
    } catch (e) {
      rejected = true;
      error = e as Error;
    }
    if (!rejected) {
      throw new Error('Expected promise to be rejected');
    }
    if (pattern) {
      const msg = error!.message;
      const matches = typeof pattern === 'string' ? msg.includes(pattern) : pattern.test(msg);
      if (!matches) {
        throw new Error(`Expected rejection "${msg}" to match ${pattern}`);
      }
    }
  }

  async toEventuallyEqual(expected: T): Promise<void> {
    const result = await this.promise;
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(result)} to equal ${JSON.stringify(expected)}`);
    }
  }

  async toEventuallyBe(expected: T): Promise<void> {
    const result = await this.promise;
    if (result !== expected) {
      throw new Error(`Expected ${result} to be ${expected}`);
    }
  }

  async toEventuallyHaveProperty(key: string, value?: any): Promise<void> {
    const result: any = await this.promise;
    if (!(key in result)) {
      throw new Error(`Expected object to have property "${key}"`);
    }
    if (value !== undefined && result[key] !== value) {
      throw new Error(`Expected property "${key}" to equal ${value}`);
    }
  }

  async toEventuallyContain(item: any): Promise<void> {
    const result: any = await this.promise;
    const contains = Array.isArray(result) ? result.includes(item) : String(result).includes(item);
    if (!contains) {
      throw new Error(`Expected ${result} to contain ${item}`);
    }
  }
}

export function expectPromise<T>(promise: Promise<T>): PromiseAssertion<T> {
  return new PromiseAssertion(promise);
}

export default expectPromise;

// CLI Demo
if (import.meta.url.includes('elide-chai-as-promised.ts')) {
  console.log('🔮 chai-as-promised - Async Assertions for Elide (POLYGLOT!)\n');

  async function runExamples() {
    console.log('Example 1: Fulfilled Promise\n');
    await expectPromise(Promise.resolve(42)).toBeFulfilled();
    console.log('✓ Fulfilled assertion works');

    console.log('\nExample 2: Rejected Promise\n');
    await expectPromise(Promise.reject(new Error('failed'))).toBeRejected();
    console.log('✓ Rejection assertion works');

    console.log('\nExample 3: Rejected With Pattern\n');
    await expectPromise(Promise.reject(new Error('not found'))).toBeRejectedWith('not found');
    console.log('✓ Rejection pattern matching works');

    console.log('\nExample 4: Eventually Equal\n');
    await expectPromise(Promise.resolve({ a: 1 })).toEventuallyEqual({ a: 1 });
    console.log('✓ Eventually equal works');

    console.log('\nExample 5: Eventually Contains\n');
    await expectPromise(Promise.resolve([1, 2, 3])).toEventuallyContain(2);
    console.log('✓ Eventually contains works');

    console.log('\n✅ All async assertions passed!');
    console.log('🚀 ~10M+ downloads/week on npm!');
    console.log('💡 Perfect for async/await testing!');
  }

  runExamples().catch(console.error);
}
