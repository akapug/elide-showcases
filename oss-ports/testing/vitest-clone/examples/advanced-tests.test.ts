/**
 * Vitest Clone - Advanced Testing Examples
 */

import { describe, it, expect, vi, beforeEach, afterEach, bench } from '../src';

describe('Advanced Vitest Features', () => {
  describe('Concurrent Tests', () => {
    it.concurrent('test 1', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(1 + 1).toBe(2);
    });

    it.concurrent('test 2', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(2 + 2).toBe(4);
    });

    it.concurrent('test 3', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(3 + 3).toBe(6);
    });
  });

  describe('Vi Mocking System', () => {
    it('should create mock functions', () => {
      const fn = vi.fn();
      fn('arg1', 'arg2');
      fn('arg3');

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(fn).toHaveBeenLastCalledWith('arg3');
    });

    it('should mock implementations', () => {
      const fn = vi.fn((x: number) => x * 2);

      expect(fn(5)).toBe(10);
      expect(fn(3)).toBe(6);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should mock return values', () => {
      const fn = vi.fn();
      fn.mockReturnValueOnce(1)
        .mockReturnValueOnce(2)
        .mockReturnValue(3);

      expect(fn()).toBe(1);
      expect(fn()).toBe(2);
      expect(fn()).toBe(3);
      expect(fn()).toBe(3);
    });

    it('should mock async functions', async () => {
      const fn = vi.fn();
      fn.mockResolvedValue('success');

      const result = await fn();
      expect(result).toBe('success');
    });

    it('should spy on objects', () => {
      const obj = {
        method: (x: number) => x * 2
      };

      const spy = vi.spyOn(obj, 'method');
      spy.mockImplementation((x: number) => x * 3);

      expect(obj.method(5)).toBe(15);
      expect(spy).toHaveBeenCalledWith(5);

      spy.mockRestore();
      expect(obj.method(5)).toBe(10);
    });
  });

  describe('Timer Mocking', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should fast-forward timers', () => {
      const callback = vi.fn();

      setTimeout(callback, 1000);

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);

      expect(callback).toHaveBeenCalled();
    });

    it('should run all timers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      setTimeout(callback1, 100);
      setTimeout(callback2, 200);

      vi.runAllTimers();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should advance to next timer', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      setTimeout(callback1, 100);
      setTimeout(callback2, 200);

      vi.advanceTimersToNextTimer();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      vi.advanceTimersToNextTimer();

      expect(callback2).toHaveBeenCalled();
    });

    it('should handle intervals', () => {
      const callback = vi.fn();

      setInterval(callback, 100);

      vi.advanceTimersByTime(350);

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should set system time', () => {
      const targetTime = new Date('2024-01-01').getTime();
      vi.setSystemTime(targetTime);

      expect(Date.now()).toBe(targetTime);

      vi.useRealTimers();
    });
  });

  describe('Global Stubbing', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should stub global variables', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Test Agent',
        platform: 'Test Platform'
      });

      expect(navigator.userAgent).toBe('Test Agent');
      expect(navigator.platform).toBe('Test Platform');
    });

    it('should stub environment variables', () => {
      vi.stubGlobal('process', {
        env: { NODE_ENV: 'test' }
      });

      expect((process as any).env.NODE_ENV).toBe('test');
    });
  });

  describe('Custom Matchers', () => {
    expect.extend({
      toBeWithinRange(received: number, floor: number, ceiling: number) {
        const pass = received >= floor && received <= ceiling;
        return {
          pass,
          message: () =>
            pass
              ? `expected ${received} not to be within range ${floor} - ${ceiling}`
              : `expected ${received} to be within range ${floor} - ${ceiling}`
        };
      }
    });

    it('should use custom matchers', () => {
      expect(100).toBeWithinRange(90, 110);
      expect(50).toBeWithinRange(0, 100);
    });
  });

  describe('Testing Async Code', () => {
    it('should test promises', async () => {
      const promise = Promise.resolve('success');
      await expect(promise).resolves.toBe('success');
    });

    it('should test rejected promises', async () => {
      const promise = Promise.reject(new Error('failed'));
      await expect(promise).rejects.toThrow('failed');
    });

    it('should test multiple async operations', async () => {
      const results = await Promise.all([
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ]);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should test async iterators', async () => {
      async function* generate() {
        yield 1;
        yield 2;
        yield 3;
      }

      const results: number[] = [];
      for await (const value of generate()) {
        results.push(value);
      }

      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('Data-Driven Tests', () => {
    const cases = [
      { input: 'hello', expected: 5 },
      { input: 'world', expected: 5 },
      { input: 'test', expected: 4 },
      { input: '', expected: 0 }
    ];

    cases.forEach(({ input, expected }) => {
      it(`should return ${expected} for "${input}"`, () => {
        expect(input.length).toBe(expected);
      });
    });
  });

  describe('Error Handling', () => {
    it('should catch errors', () => {
      const throwError = () => {
        throw new Error('Something went wrong');
      };

      expect(throwError).toThrow('Something went wrong');
    });

    it('should catch specific error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const throwCustom = () => {
        throw new CustomError('Custom error');
      };

      expect(throwCustom).toThrow(CustomError);
    });

    it('should test try-catch blocks', () => {
      let error: Error | null = null;

      try {
        throw new Error('Test error');
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error?.message).toBe('Test error');
    });
  });

  describe('Object and Array Testing', () => {
    it('should test object properties', () => {
      const user = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        address: {
          city: 'New York',
          country: 'USA'
        }
      };

      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('name', 'John');
      expect(user).toHaveProperty('address.city', 'New York');
      expect(user).toMatchObject({ name: 'John', email: 'john@example.com' });
    });

    it('should test arrays', () => {
      const numbers = [1, 2, 3, 4, 5];

      expect(numbers).toHaveLength(5);
      expect(numbers).toContain(3);
      expect(numbers).toContainEqual(4);
      expect(numbers[0]).toBe(1);
      expect(numbers[numbers.length - 1]).toBe(5);
    });

    it('should test array methods', () => {
      const numbers = [1, 2, 3, 4, 5];

      const doubled = numbers.map(n => n * 2);
      expect(doubled).toEqual([2, 4, 6, 8, 10]);

      const evens = numbers.filter(n => n % 2 === 0);
      expect(evens).toEqual([2, 4]);

      const sum = numbers.reduce((acc, n) => acc + n, 0);
      expect(sum).toBe(15);
    });
  });

  describe('Type Testing', () => {
    it('should test types', () => {
      const value: any = 42;

      expect(value).toBeTypeOf('number');
      expect('hello').toBeTypeOf('string');
      expect(true).toBeTypeOf('boolean');
      expect({}).toBeTypeOf('object');
      expect([]).toBeTypeOf('object');
      expect(() => {}).toBeTypeOf('function');
    });

    it('should test instance types', () => {
      class User {
        constructor(public name: string) {}
      }

      const user = new User('John');

      expect(user).toBeInstanceOf(User);
      expect(new Date()).toBeInstanceOf(Date);
      expect(new Error()).toBeInstanceOf(Error);
    });
  });

  describe('Soft Assertions', () => {
    it('should collect multiple assertion failures', () => {
      expect.soft(1 + 1).toBe(3); // Fails but continues
      expect.soft(2 + 2).toBe(5); // Fails but continues
      expect.soft(3 + 3).toBe(6); // Passes
    });
  });

  describe('Module Mocking', () => {
    it('should mock module exports', async () => {
      vi.mock('./api', () => ({
        fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' }))
      }));

      // In real implementation, would import mocked module
      // const { fetchData } = await vi.importMock('./api');
      // const result = await fetchData();
      // expect(result.data).toBe('mocked');
    });

    it('should use actual module', async () => {
      // const actual = await vi.importActual('./utils');
      // expect(actual).toBeDefined();
    });
  });
});

describe('Benchmarks', () => {
  bench('sort array', () => {
    const arr = Array.from({ length: 1000 }, () => Math.random());
    arr.sort();
  }, { time: 1000 });

  bench('filter and map', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    arr.filter(x => x % 2 === 0).map(x => x * 2);
  });

  bench('reduce', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    arr.reduce((sum, n) => sum + n, 0);
  });
});

describe('Complex Scenarios', () => {
  class TodoList {
    private todos: Array<{ id: number; text: string; done: boolean }> = [];
    private nextId = 1;

    add(text: string) {
      this.todos.push({ id: this.nextId++, text, done: false });
    }

    toggle(id: number) {
      const todo = this.todos.find(t => t.id === id);
      if (todo) {
        todo.done = !todo.done;
      }
    }

    remove(id: number) {
      this.todos = this.todos.filter(t => t.id !== id);
    }

    getAll() {
      return this.todos;
    }

    getActive() {
      return this.todos.filter(t => !t.done);
    }

    getCompleted() {
      return this.todos.filter(t => t.done);
    }

    clearCompleted() {
      this.todos = this.todos.filter(t => !t.done);
    }
  }

  let todoList: TodoList;

  beforeEach(() => {
    todoList = new TodoList();
  });

  it('should add todos', () => {
    todoList.add('Buy milk');
    todoList.add('Walk dog');

    expect(todoList.getAll()).toHaveLength(2);
  });

  it('should toggle todos', () => {
    todoList.add('Buy milk');
    const todos = todoList.getAll();

    todoList.toggle(todos[0].id);

    expect(todoList.getCompleted()).toHaveLength(1);
    expect(todoList.getActive()).toHaveLength(0);
  });

  it('should remove todos', () => {
    todoList.add('Buy milk');
    const todos = todoList.getAll();

    todoList.remove(todos[0].id);

    expect(todoList.getAll()).toHaveLength(0);
  });

  it('should clear completed', () => {
    todoList.add('Buy milk');
    todoList.add('Walk dog');
    todoList.add('Clean house');

    const todos = todoList.getAll();
    todoList.toggle(todos[0].id);
    todoList.toggle(todos[2].id);

    todoList.clearCompleted();

    expect(todoList.getAll()).toHaveLength(1);
    expect(todoList.getActive()).toHaveLength(1);
  });
});
