/**
 * jest-mock - Mock function utilities
 *
 * Create and manage mock functions for testing.
 * **POLYGLOT SHOWCASE**: Mocking for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jest-mock (~45M+ downloads/week)
 *
 * Features:
 * - Mock function creation
 * - Call tracking
 * - Return value mocking
 * - Implementation mocking
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need mocks
 * - ONE mocking API works everywhere on Elide
 * - Share mock utilities across languages
 * - Consistent test doubles
 *
 * Use cases:
 * - Unit test isolation
 * - Dependency injection
 * - Spy on function calls
 * - Stub return values
 *
 * Package has ~45M+ downloads/week on npm!
 */

export interface MockCall<T extends any[] = any[]> {
  args: T;
  result: MockResult;
  timestamp: number;
}

export interface MockResult {
  type: 'return' | 'throw' | 'incomplete';
  value?: any;
}

export interface MockContext<T extends (...args: any[]) => any> {
  calls: Array<Parameters<T>>;
  results: MockResult[];
  instances: any[];
  invocationCallOrder: number[];
  lastCall?: Parameters<T>;
}

export interface MockFn<T extends (...args: any[]) => any = any> {
  (...args: Parameters<T>): ReturnType<T>;
  _isMockFunction: true;
  mock: MockContext<T>;

  // Mock configuration methods
  mockReturnValue(value: ReturnType<T>): this;
  mockReturnValueOnce(value: ReturnType<T>): this;
  mockResolvedValue(value: any): this;
  mockResolvedValueOnce(value: any): this;
  mockRejectedValue(value: any): this;
  mockRejectedValueOnce(value: any): this;
  mockImplementation(fn: T): this;
  mockImplementationOnce(fn: T): this;
  mockReturnThis(): this;
  mockName(name: string): this;

  // Mock inspection methods
  getMockName(): string;
  mockClear(): this;
  mockReset(): this;
  mockRestore(): this;
}

let mockCounter = 0;
const invocationCallOrder: number[] = [];

/**
 * Create a mock function
 */
export function fn<T extends (...args: any[]) => any>(
  implementation?: T
): MockFn<T> {
  const calls: Array<Parameters<T>> = [];
  const results: MockResult[] = [];
  const instances: any[] = [];
  const mockInvocationCallOrder: number[] = [];

  let mockImpl = implementation;
  let mockName = `jest.fn(${mockCounter++})`;
  const onceImplementations: T[] = [];
  const onceReturnValues: Array<ReturnType<T>> = [];

  const mockFn = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    // Track call
    calls.push(args);
    instances.push(this);
    const callOrder = invocationCallOrder.length;
    invocationCallOrder.push(callOrder);
    mockInvocationCallOrder.push(callOrder);

    // Use once implementation if available
    if (onceImplementations.length > 0) {
      const impl = onceImplementations.shift()!;
      try {
        const result = impl.apply(this, args);
        results.push({ type: 'return', value: result });
        return result;
      } catch (error) {
        results.push({ type: 'throw', value: error });
        throw error;
      }
    }

    // Use once return value if available
    if (onceReturnValues.length > 0) {
      const value = onceReturnValues.shift()!;
      results.push({ type: 'return', value });
      return value;
    }

    // Use mock implementation or default
    try {
      const result = mockImpl ? mockImpl.apply(this, args) : undefined;
      results.push({ type: 'return', value: result });
      return result as ReturnType<T>;
    } catch (error) {
      results.push({ type: 'throw', value: error });
      throw error;
    }
  } as MockFn<T>;

  // Mark as mock
  mockFn._isMockFunction = true;

  // Attach mock context
  Object.defineProperty(mockFn, 'mock', {
    get() {
      return {
        calls,
        results,
        instances,
        invocationCallOrder: mockInvocationCallOrder,
        lastCall: calls[calls.length - 1],
      };
    },
  });

  // Configuration methods
  mockFn.mockReturnValue = (value: ReturnType<T>) => {
    mockImpl = (() => value) as T;
    return mockFn;
  };

  mockFn.mockReturnValueOnce = (value: ReturnType<T>) => {
    onceReturnValues.push(value);
    return mockFn;
  };

  mockFn.mockResolvedValue = (value: any) => {
    mockImpl = (async () => value) as T;
    return mockFn;
  };

  mockFn.mockResolvedValueOnce = (value: any) => {
    onceImplementations.push((async () => value) as T);
    return mockFn;
  };

  mockFn.mockRejectedValue = (value: any) => {
    mockImpl = (async () => {
      throw value;
    }) as T;
    return mockFn;
  };

  mockFn.mockRejectedValueOnce = (value: any) => {
    onceImplementations.push((async () => {
      throw value;
    }) as T);
    return mockFn;
  };

  mockFn.mockImplementation = (fn: T) => {
    mockImpl = fn;
    return mockFn;
  };

  mockFn.mockImplementationOnce = (fn: T) => {
    onceImplementations.push(fn);
    return mockFn;
  };

  mockFn.mockReturnThis = () => {
    mockImpl = (function (this: any) {
      return this;
    }) as T;
    return mockFn;
  };

  mockFn.mockName = (name: string) => {
    mockName = name;
    return mockFn;
  };

  // Inspection methods
  mockFn.getMockName = () => mockName;

  mockFn.mockClear = () => {
    calls.length = 0;
    results.length = 0;
    instances.length = 0;
    mockInvocationCallOrder.length = 0;
    return mockFn;
  };

  mockFn.mockReset = () => {
    mockFn.mockClear();
    mockImpl = undefined;
    onceImplementations.length = 0;
    onceReturnValues.length = 0;
    return mockFn;
  };

  mockFn.mockRestore = () => {
    mockFn.mockReset();
    // In a real implementation, this would restore the original function
    return mockFn;
  };

  return mockFn;
}

/**
 * Create a mock object with typed methods
 */
export function spyOn<T extends object, K extends keyof T>(
  object: T,
  method: K
): MockFn<T[K] extends (...args: any[]) => any ? T[K] : never> {
  const original = object[method];

  if (typeof original !== 'function') {
    throw new Error(`Cannot spy on non-function property ${String(method)}`);
  }

  const mockFn = fn(original as any);
  object[method] = mockFn as any;

  // Override mockRestore to put back original
  const originalRestore = mockFn.mockRestore;
  mockFn.mockRestore = () => {
    object[method] = original;
    originalRestore.call(mockFn);
    return mockFn;
  };

  return mockFn as any;
}

/**
 * Check if value is a mock function
 */
export function isMockFunction(fn: any): fn is MockFn {
  return typeof fn === 'function' && fn._isMockFunction === true;
}

/**
 * Get mock state
 */
export function mocked<T>(item: T): T {
  return item;
}

export default { fn, spyOn, isMockFunction, mocked };

// CLI Demo
if (import.meta.url.includes('elide-jest-mock.ts')) {
  console.log('🎭 jest-mock - Mock Functions for Elide (POLYGLOT!)\n');

  // Example 1: Basic mock
  console.log('Example 1: Basic Mock\n');
  const mockFn1 = fn();
  mockFn1('hello');
  mockFn1('world');
  console.log('Calls:', mockFn1.mock.calls);
  console.log('Call count:', mockFn1.mock.calls.length);
  console.log();

  // Example 2: Mock return value
  console.log('Example 2: Mock Return Value\n');
  const mockFn2 = fn().mockReturnValue(42);
  console.log('First call:', mockFn2());
  console.log('Second call:', mockFn2());
  console.log();

  // Example 3: Mock implementation
  console.log('Example 3: Mock Implementation\n');
  const mockFn3 = fn().mockImplementation((a: number, b: number) => a + b);
  console.log('2 + 3 =', mockFn3(2, 3));
  console.log('5 + 7 =', mockFn3(5, 7));
  console.log();

  // Example 4: Once implementations
  console.log('Example 4: Once Implementations\n');
  const mockFn4 = fn()
    .mockReturnValueOnce('first')
    .mockReturnValueOnce('second')
    .mockReturnValue('default');
  console.log('Call 1:', mockFn4());
  console.log('Call 2:', mockFn4());
  console.log('Call 3:', mockFn4());
  console.log('Call 4:', mockFn4());
  console.log();

  // Example 5: Async mocks
  console.log('Example 5: Async Mocks\n');
  const mockAsync = fn().mockResolvedValue('success');
  mockAsync().then((result) => {
    console.log('Resolved:', result);
  });

  const mockReject = fn().mockRejectedValue(new Error('failed'));
  mockReject().catch((err) => {
    console.log('Rejected:', err.message);
  });
  console.log();

  // Example 6: Spy on object method
  console.log('Example 6: Spy on Object Method\n');
  const obj = {
    add(a: number, b: number) {
      return a + b;
    },
  };
  const spy = spyOn(obj, 'add');
  console.log('Original result:', obj.add(2, 3));
  console.log('Spy calls:', spy.mock.calls);
  spy.mockRestore();
  console.log('After restore:', obj.add(4, 5));
  console.log();

  // Example 7: Mock clear/reset
  console.log('Example 7: Mock Clear/Reset\n');
  const mockFn7 = fn().mockReturnValue('test');
  mockFn7();
  mockFn7();
  console.log('Before clear:', mockFn7.mock.calls.length);
  mockFn7.mockClear();
  console.log('After clear:', mockFn7.mock.calls.length);
  mockFn7();
  console.log('After new call:', mockFn7.mock.calls.length);
  console.log();

  // Wait for async operations
  setTimeout(() => {
    console.log('✅ Use Cases:');
    console.log('- Unit test isolation');
    console.log('- Dependency mocking');
    console.log('- Function call tracking');
    console.log('- Return value stubbing');
    console.log();

    console.log('🚀 Performance:');
    console.log('- Zero dependencies');
    console.log('- ~45M+ downloads/week on npm!');
    console.log();

    console.log('💡 Polyglot Tips:');
    console.log('- Mock functions from any language');
    console.log('- Consistent testing API everywhere');
    console.log('- Perfect for polyglot test doubles!');
  }, 100);
}
