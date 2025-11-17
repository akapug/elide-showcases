/**
 * Jest Clone - Advanced Testing Examples
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '../src';

describe('Advanced Testing Patterns', () => {
  describe('Async Testing', () => {
    it('should handle promises', async () => {
      const fetchData = () => Promise.resolve({ data: 'test' });
      const result = await fetchData();
      expect(result.data).toBe('test');
    });

    it('should test promise rejections', async () => {
      const fetchError = () => Promise.reject(new Error('Network error'));
      await expect(fetchError()).rejects.toThrow('Network error');
    });

    it('should test multiple async operations', async () => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ];

      const results = await Promise.all(promises);
      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('Mocking Modules', () => {
    class ApiClient {
      async fetchUsers() {
        // Real implementation would make HTTP request
        return [{ id: 1, name: 'Alice' }];
      }

      async createUser(data: any) {
        return { id: 2, ...data };
      }
    }

    it('should mock API calls', async () => {
      const client = new ApiClient();
      const spy = jest.spyOn(client, 'fetchUsers');

      spy.mockResolvedValue([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]);

      const users = await client.fetchUsers();

      expect(users).toHaveLength(2);
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    it('should mock POST requests', async () => {
      const client = new ApiClient();
      const spy = jest.spyOn(client, 'createUser');

      spy.mockResolvedValue({ id: 123, name: 'New User', email: 'new@example.com' });

      const user = await client.createUser({ name: 'New User', email: 'new@example.com' });

      expect(user.id).toBe(123);
      expect(spy).toHaveBeenCalledWith({ name: 'New User', email: 'new@example.com' });

      spy.mockRestore();
    });
  });

  describe('Testing React Components', () => {
    interface ButtonProps {
      onClick: () => void;
      label: string;
      disabled?: boolean;
    }

    const Button = ({ onClick, label, disabled }: ButtonProps) => ({
      type: 'button',
      props: { onClick, disabled },
      children: [label]
    });

    it('should render button', () => {
      const onClick = jest.fn();
      const button = Button({ onClick, label: 'Click me' });

      expect(button.type).toBe('button');
      expect(button.children[0]).toBe('Click me');
    });

    it('should handle click events', () => {
      const onClick = jest.fn();
      const button = Button({ onClick, label: 'Click me' });

      button.props.onClick();

      expect(onClick).toHaveBeenCalled();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when prop is true', () => {
      const onClick = jest.fn();
      const button = Button({ onClick, label: 'Click me', disabled: true });

      expect(button.props.disabled).toBe(true);
    });
  });

  describe('Testing State Management', () => {
    class Store {
      private state: any = {};
      private listeners: Function[] = [];

      setState(updates: any) {
        this.state = { ...this.state, ...updates };
        this.listeners.forEach(listener => listener(this.state));
      }

      getState() {
        return this.state;
      }

      subscribe(listener: Function) {
        this.listeners.push(listener);
        return () => {
          this.listeners = this.listeners.filter(l => l !== listener);
        };
      }
    }

    it('should update state', () => {
      const store = new Store();
      store.setState({ count: 0 });

      expect(store.getState().count).toBe(0);

      store.setState({ count: 1 });
      expect(store.getState().count).toBe(1);
    });

    it('should notify subscribers', () => {
      const store = new Store();
      const listener = jest.fn();

      store.subscribe(listener);
      store.setState({ count: 1 });

      expect(listener).toHaveBeenCalledWith({ count: 1 });
    });

    it('should unsubscribe', () => {
      const store = new Store();
      const listener = jest.fn();

      const unsubscribe = store.subscribe(listener);
      store.setState({ count: 1 });

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.setState({ count: 2 });

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Testing Error Boundaries', () => {
    class ErrorBoundary {
      private hasError = false;
      private error: Error | null = null;

      componentDidCatch(error: Error) {
        this.hasError = true;
        this.error = error;
      }

      render(children: any) {
        if (this.hasError) {
          return { type: 'div', children: ['Error occurred'] };
        }
        return children;
      }
    }

    it('should catch errors', () => {
      const boundary = new ErrorBoundary();
      const error = new Error('Test error');

      boundary.componentDidCatch(error);

      const result = boundary.render({ type: 'div', children: ['Normal content'] });
      expect(result.children[0]).toBe('Error occurred');
    });
  });

  describe('Testing Custom Hooks', () => {
    const useState = <T,>(initial: T) => {
      let value = initial;
      const setValue = (newValue: T) => {
        value = newValue;
      };
      return [value, setValue] as const;
    };

    const useCounter = (initialCount = 0) => {
      const [count, setCount] = useState(initialCount);

      const increment = () => setCount(count + 1);
      const decrement = () => setCount(count - 1);
      const reset = () => setCount(initialCount);

      return { count, increment, decrement, reset };
    };

    it('should initialize with default value', () => {
      const { count } = useCounter();
      expect(count).toBe(0);
    });

    it('should initialize with custom value', () => {
      const { count } = useCounter(10);
      expect(count).toBe(10);
    });
  });

  describe('Testing with Timers', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should execute callback after delay', () => {
      const callback = jest.fn();

      setTimeout(callback, 1000);

      expect(callback).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);

      expect(callback).toHaveBeenCalled();
    });

    it('should execute interval callback multiple times', () => {
      const callback = jest.fn();

      setInterval(callback, 100);

      jest.advanceTimersByTime(350);

      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should cancel timeout', () => {
      const callback = jest.fn();

      const timerId = setTimeout(callback, 1000);
      clearTimeout(timerId);

      jest.advanceTimersByTime(1000);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Parameterized Tests', () => {
    const testCases = [
      { a: 1, b: 1, expected: 2 },
      { a: 2, b: 3, expected: 5 },
      { a: -1, b: 1, expected: 0 },
      { a: 0, b: 0, expected: 0 }
    ];

    testCases.forEach(({ a, b, expected }) => {
      it(`should add ${a} + ${b} = ${expected}`, () => {
        expect(a + b).toBe(expected);
      });
    });
  });

  describe('Testing with Cleanup', () => {
    let resource: any;

    beforeEach(() => {
      resource = { connected: true, data: [] };
    });

    afterEach(() => {
      resource.connected = false;
      resource.data = [];
    });

    it('should use resource', () => {
      expect(resource.connected).toBe(true);
      resource.data.push('item');
      expect(resource.data).toHaveLength(1);
    });

    it('should have clean resource', () => {
      expect(resource.data).toHaveLength(0);
    });
  });

  describe('Testing Async Iterators', () => {
    async function* generateNumbers(count: number) {
      for (let i = 0; i < count; i++) {
        yield i;
      }
    }

    it('should iterate over async generator', async () => {
      const results: number[] = [];

      for await (const num of generateNumbers(3)) {
        results.push(num);
      }

      expect(results).toEqual([0, 1, 2]);
    });
  });

  describe('Testing Event Emitters', () => {
    class EventEmitter {
      private events: Map<string, Function[]> = new Map();

      on(event: string, handler: Function) {
        if (!this.events.has(event)) {
          this.events.set(event, []);
        }
        this.events.get(event)!.push(handler);
      }

      emit(event: string, ...args: any[]) {
        const handlers = this.events.get(event) || [];
        handlers.forEach(handler => handler(...args));
      }

      removeListener(event: string, handler: Function) {
        const handlers = this.events.get(event) || [];
        this.events.set(event, handlers.filter(h => h !== handler));
      }
    }

    it('should emit and handle events', () => {
      const emitter = new EventEmitter();
      const handler = jest.fn();

      emitter.on('test', handler);
      emitter.emit('test', 'data');

      expect(handler).toHaveBeenCalledWith('data');
    });

    it('should support multiple handlers', () => {
      const emitter = new EventEmitter();
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.emit('test');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should remove listeners', () => {
      const emitter = new EventEmitter();
      const handler = jest.fn();

      emitter.on('test', handler);
      emitter.removeListener('test', handler);
      emitter.emit('test');

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Testing with Dependency Injection', () => {
    interface Logger {
      log(message: string): void;
    }

    class UserService {
      constructor(private logger: Logger) {}

      createUser(name: string) {
        this.logger.log(`Creating user: ${name}`);
        return { id: 1, name };
      }
    }

    it('should inject dependencies', () => {
      const mockLogger: Logger = {
        log: jest.fn()
      };

      const service = new UserService(mockLogger);
      const user = service.createUser('Alice');

      expect(user.name).toBe('Alice');
      expect(mockLogger.log).toHaveBeenCalledWith('Creating user: Alice');
    });
  });
});
