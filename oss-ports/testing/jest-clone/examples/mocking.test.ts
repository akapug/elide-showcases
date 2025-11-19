/**
 * Jest Clone - Mocking Examples
 */

import { describe, it, expect, jest, beforeEach } from '../src';

describe('Mock functions', () => {
  it('should create and use mock functions', () => {
    const mockFn = jest.fn();

    mockFn('arg1', 'arg2');
    mockFn('arg3');

    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(mockFn).toHaveBeenLastCalledWith('arg3');
  });

  it('should mock implementations', () => {
    const mockFn = jest.fn((x: number) => x * 2);

    expect(mockFn(5)).toBe(10);
    expect(mockFn(3)).toBe(6);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should mock return values', () => {
    const mockFn = jest.fn();
    mockFn.mockReturnValue(42);

    expect(mockFn()).toBe(42);
    expect(mockFn()).toBe(42);
  });

  it('should mock return values once', () => {
    const mockFn = jest.fn();
    mockFn
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
      .mockReturnValue(3);

    expect(mockFn()).toBe(1);
    expect(mockFn()).toBe(2);
    expect(mockFn()).toBe(3);
    expect(mockFn()).toBe(3);
  });

  it('should mock resolved values', async () => {
    const mockFn = jest.fn();
    mockFn.mockResolvedValue('success');

    const result = await mockFn();
    expect(result).toBe('success');
  });

  it('should mock rejected values', async () => {
    const mockFn = jest.fn();
    mockFn.mockRejectedValue(new Error('Failed'));

    await expect(mockFn()).rejects.toThrow('Failed');
  });

  it('should access mock calls', () => {
    const mockFn = jest.fn();

    mockFn('first', 1);
    mockFn('second', 2);

    expect(mockFn.mock.calls).toHaveLength(2);
    expect(mockFn.mock.calls[0]).toEqual(['first', 1]);
    expect(mockFn.mock.calls[1]).toEqual(['second', 2]);
    expect(mockFn.mock.lastCall).toEqual(['second', 2]);
  });

  it('should track return values', () => {
    const mockFn = jest.fn((x: number) => x * 2);

    mockFn(2);
    mockFn(3);

    expect(mockFn.mock.results[0].value).toBe(4);
    expect(mockFn.mock.results[1].value).toBe(6);
  });
});

describe('Mock clearing and resetting', () => {
  let mockFn: any;

  beforeEach(() => {
    mockFn = jest.fn((x: number) => x * 2);
    mockFn(1);
    mockFn(2);
  });

  it('should clear mock calls', () => {
    expect(mockFn.mock.calls).toHaveLength(2);

    mockFn.mockClear();

    expect(mockFn.mock.calls).toHaveLength(0);
    expect(mockFn(3)).toBe(6); // Implementation still works
  });

  it('should reset mock', () => {
    mockFn.mockReset();

    expect(mockFn.mock.calls).toHaveLength(0);
    expect(mockFn(3)).toBeUndefined(); // Implementation cleared
  });
});

describe('Spying on objects', () => {
  it('should spy on object methods', () => {
    const calculator = {
      add: (a: number, b: number) => a + b,
      multiply: (a: number, b: number) => a * b
    };

    const spy = jest.spyOn(calculator, 'add');

    expect(calculator.add(2, 3)).toBe(5);
    expect(spy).toHaveBeenCalledWith(2, 3);

    spy.mockRestore();
  });

  it('should mock spy implementation', () => {
    const object = {
      method: (x: number) => x
    };

    const spy = jest.spyOn(object, 'method');
    spy.mockImplementation((x: number) => x * 2);

    expect(object.method(5)).toBe(10);
    expect(spy).toHaveBeenCalledWith(5);

    spy.mockRestore();
    expect(object.method(5)).toBe(5); // Original implementation restored
  });
});

describe('Timer mocking', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fast-forward timers', () => {
    const callback = jest.fn();

    setTimeout(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalled();
  });

  it('should run all timers', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    setTimeout(callback1, 100);
    setTimeout(callback2, 200);

    jest.runAllTimers();

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('should handle intervals', () => {
    const callback = jest.fn();

    setInterval(callback, 100);

    jest.advanceTimersByTime(250);

    expect(callback).toHaveBeenCalledTimes(2);
  });
});

// Example of mocking modules
interface ApiResponse {
  data: any;
  status: number;
}

class ApiClient {
  async fetchData(url: string): Promise<ApiResponse> {
    // Real implementation would make HTTP request
    return { data: null, status: 200 };
  }

  async postData(url: string, body: any): Promise<ApiResponse> {
    return { data: null, status: 201 };
  }
}

describe('Module mocking example', () => {
  it('should mock API client', async () => {
    const client = new ApiClient();
    const spy = jest.spyOn(client, 'fetchData');

    spy.mockResolvedValue({
      data: { id: 1, name: 'Test' },
      status: 200
    });

    const result = await client.fetchData('/api/users/1');

    expect(result.data).toEqual({ id: 1, name: 'Test' });
    expect(spy).toHaveBeenCalledWith('/api/users/1');

    spy.mockRestore();
  });
});
