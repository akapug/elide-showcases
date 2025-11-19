/**
 * Vitest Clone - Basic Usage Examples
 */

import { describe, it, expect, vi, beforeEach, afterEach } from '../src';

describe('Vitest matchers', () => {
  it('should use toBe for strict equality', () => {
    expect(2 + 2).toBe(4);
    expect('vitest').toBe('vitest');
  });

  it('should use toEqual for deep equality', () => {
    expect({ name: 'test' }).toEqual({ name: 'test' });
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  it('should check types', () => {
    expect(42).toBeTypeOf('number');
    expect('hello').toBeTypeOf('string');
    expect(true).toBeTypeOf('boolean');
  });
});

describe('Vi mocking', () => {
  it('should create mock functions', () => {
    const mockFn = vi.fn();
    mockFn('arg1');
    mockFn('arg2');

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith('arg1');
  });

  it('should mock implementations', () => {
    const multiply = vi.fn((a: number, b: number) => a * b);
    expect(multiply(2, 3)).toBe(6);
  });

  it('should spy on objects', () => {
    const obj = {
      method: (x: number) => x * 2
    };

    const spy = vi.spyOn(obj, 'method');
    expect(obj.method(5)).toBe(10);
    expect(spy).toHaveBeenCalledWith(5);

    spy.mockRestore();
  });
});

describe.concurrent('Concurrent tests', () => {
  it.concurrent('test 1', async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(1).toBe(1);
  });

  it.concurrent('test 2', async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(2).toBe(2);
  });
});
