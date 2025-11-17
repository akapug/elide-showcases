/**
 * Jest Clone - Basic Usage Examples
 */

import { describe, it, expect, beforeEach, afterEach } from '../src';

describe('Basic matchers', () => {
  it('should use toBe for strict equality', () => {
    expect(2 + 2).toBe(4);
    expect('hello').toBe('hello');
    expect(true).toBe(true);
  });

  it('should use toEqual for deep equality', () => {
    const user = { name: 'John', age: 30 };
    expect(user).toEqual({ name: 'John', age: 30 });
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  it('should check truthiness', () => {
    expect('hello').toBeTruthy();
    expect(1).toBeTruthy();
    expect(true).toBeTruthy();

    expect('').toBeFalsy();
    expect(0).toBeFalsy();
    expect(false).toBeFalsy();
    expect(null).toBeFalsy();
    expect(undefined).toBeFalsy();
  });

  it('should check for null and undefined', () => {
    const value = null;
    expect(value).toBeNull();
    expect(value).not.toBeUndefined();

    const obj: any = {};
    expect(obj.missing).toBeUndefined();
    expect(obj.missing).not.toBeDefined();
  });
});

describe('Number matchers', () => {
  it('should compare numbers', () => {
    const value = 5;
    expect(value).toBeGreaterThan(3);
    expect(value).toBeGreaterThanOrEqual(5);
    expect(value).toBeLessThan(10);
    expect(value).toBeLessThanOrEqual(5);
  });

  it('should handle floating point comparison', () => {
    const value = 0.1 + 0.2;
    expect(value).toBeCloseTo(0.3, 5);
  });
});

describe('String matchers', () => {
  it('should match strings', () => {
    const text = 'Hello, World!';
    expect(text).toMatch(/World/);
    expect(text).toMatch('Hello');
    expect(text).toContain('World');
  });
});

describe('Array matchers', () => {
  it('should check array contents', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toContain('banana');
    expect(fruits).toHaveLength(3);
    expect(fruits).toContainEqual('orange');
  });
});

describe('Object matchers', () => {
  it('should check object properties', () => {
    const user = {
      name: 'Alice',
      age: 25,
      address: {
        city: 'New York',
        country: 'USA'
      }
    };

    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('name', 'Alice');
    expect(user).toHaveProperty('address.city', 'New York');

    expect(user).toMatchObject({
      name: 'Alice',
      age: 25
    });
  });
});

describe('Exception matchers', () => {
  it('should test error throwing', () => {
    const throwError = () => {
      throw new Error('Something went wrong');
    };

    expect(throwError).toThrow();
    expect(throwError).toThrow('Something went wrong');
    expect(throwError).toThrow(/went wrong/);
  });

  it('should test no error throwing', () => {
    const noError = () => {
      return 'success';
    };

    expect(noError).not.toThrow();
  });
});

describe('Lifecycle hooks', () => {
  let counter = 0;

  beforeEach(() => {
    counter = 0;
  });

  afterEach(() => {
    console.log('Test completed');
  });

  it('should increment counter', () => {
    counter++;
    expect(counter).toBe(1);
  });

  it('should start with fresh counter', () => {
    expect(counter).toBe(0);
  });
});

describe('Async tests', () => {
  it('should handle promises', async () => {
    const fetchData = () => Promise.resolve('data');
    const data = await fetchData();
    expect(data).toBe('data');
  });

  it('should handle async/await', async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(10);
    expect(true).toBe(true);
  });

  it('should test promise rejections', async () => {
    const fetchError = () => Promise.reject(new Error('Failed'));
    await expect(fetchError()).rejects.toThrow('Failed');
  });
});
