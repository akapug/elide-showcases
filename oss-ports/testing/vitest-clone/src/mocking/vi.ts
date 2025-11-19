/**
 * Vitest Clone - Vi Mocking System
 * Comprehensive mocking utilities (Vitest's answer to jest)
 */

import type { Vi, MockFunction, SpyInstance, MockContext, MockResult } from '../types';

export class VitestMock<T = any, Y extends any[] = any[]> implements MockFunction<T, Y> {
  mock: MockContext<T, Y>;
  private implementation?: (...args: Y) => T;
  private onceImplementations: Array<(...args: Y) => T> = [];
  private returnValues: T[] = [];
  private onceReturnValues: T[] = [];
  private callOrder = 0;
  private static globalCallOrder = 0;

  constructor(implementation?: (...args: Y) => T) {
    this.implementation = implementation;
    this.mock = {
      calls: [],
      results: [],
      instances: [],
      invocationCallOrder: [],
      lastCall: undefined
    };

    return new Proxy(this, {
      apply: (target, thisArg, args: Y) => {
        return target.call(thisArg, ...args);
      }
    }) as any;
  }

  call(thisArg: any, ...args: Y): T {
    this.mock.calls.push(args);
    this.mock.lastCall = args;
    this.mock.instances.push(thisArg);
    this.mock.invocationCallOrder.push(VitestMock.globalCallOrder++);

    try {
      let result: T;

      if (this.onceImplementations.length > 0) {
        const impl = this.onceImplementations.shift()!;
        result = impl(...args);
      } else if (this.onceReturnValues.length > 0) {
        result = this.onceReturnValues.shift()!;
      } else if (this.returnValues.length > 0) {
        result = this.returnValues[this.returnValues.length - 1];
      } else if (this.implementation) {
        result = this.implementation(...args);
      } else {
        result = undefined as T;
      }

      this.mock.results.push({
        type: 'return',
        value: result
      });

      return result;
    } catch (error) {
      this.mock.results.push({
        type: 'throw',
        value: error as any
      });
      throw error;
    }
  }

  mockClear(): this {
    this.mock.calls = [];
    this.mock.results = [];
    this.mock.instances = [];
    this.mock.invocationCallOrder = [];
    this.mock.lastCall = undefined;
    return this;
  }

  mockReset(): this {
    this.mockClear();
    this.implementation = undefined;
    this.onceImplementations = [];
    this.returnValues = [];
    this.onceReturnValues = [];
    return this;
  }

  mockRestore(): void {
    this.mockReset();
  }

  mockImplementation(fn: (...args: Y) => T): this {
    this.implementation = fn;
    return this;
  }

  mockImplementationOnce(fn: (...args: Y) => T): this {
    this.onceImplementations.push(fn);
    return this;
  }

  mockReturnValue(value: T): this {
    this.returnValues = [value];
    return this;
  }

  mockReturnValueOnce(value: T): this {
    this.onceReturnValues.push(value);
    return this;
  }

  mockResolvedValue(value: Awaited<T>): this {
    this.implementation = (() => Promise.resolve(value)) as any;
    return this;
  }

  mockResolvedValueOnce(value: Awaited<T>): this {
    this.onceImplementations.push((() => Promise.resolve(value)) as any);
    return this;
  }

  mockRejectedValue(value: any): this {
    this.implementation = (() => Promise.reject(value)) as any;
    return this;
  }

  mockRejectedValueOnce(value: any): this {
    this.onceImplementations.push((() => Promise.reject(value)) as any);
    return this;
  }
}

class ViImplementation implements Vi {
  private mocks: Set<VitestMock> = new Set();
  private spies: Map<any, Map<string | symbol, SpyInstance>> = new Map();
  private mockedModules: Map<string, any> = new Map();
  private fakeTimersEnabled = false;
  private currentTime = 0;
  private timers: Map<number, any> = new Map();
  private timerIdCounter = 1;
  private originalTimers: any = {};
  private stubbedGlobals: Map<string, { original: any; stubbed: any }> = new Map();

  fn<T = any, Y extends any[] = any[]>(implementation?: (...args: Y) => T): MockFunction<T, Y> {
    const mock = new VitestMock(implementation) as MockFunction<T, Y>;
    this.mocks.add(mock as any);
    return mock;
  }

  spyOn<T extends {}, M extends keyof T>(object: T, method: M): SpyInstance {
    if (typeof object[method] !== 'function') {
      throw new Error(`Cannot spy on non-function property ${String(method)}`);
    }

    const original = object[method];
    const spy = new VitestMock(original as any) as SpyInstance;

    if (!this.spies.has(object)) {
      this.spies.set(object, new Map());
    }
    this.spies.get(object)!.set(method, spy);

    (object as any)[method] = spy;

    const originalRestore = spy.mockRestore.bind(spy);
    spy.mockRestore = () => {
      originalRestore();
      (object as any)[method] = original;
      this.spies.get(object)?.delete(method);
    };

    return spy;
  }

  mock(path: string, factory?: () => any): void {
    if (factory) {
      this.mockedModules.set(path, factory());
    } else {
      this.mockedModules.set(path, {});
    }
  }

  unmock(path: string): void {
    this.mockedModules.delete(path);
  }

  doMock(path: string, factory?: () => any): void {
    this.mock(path, factory);
  }

  doUnmock(path: string): void {
    this.unmock(path);
  }

  async importActual<T = any>(path: string): Promise<T> {
    // In a real implementation, bypass mocks and import actual module
    throw new Error('importActual not implemented');
  }

  async importMock<T = any>(path: string): Promise<T> {
    const mocked = this.mockedModules.get(path);
    if (!mocked) {
      throw new Error(`Module ${path} is not mocked`);
    }
    return mocked;
  }

  mocked<T>(item: T, deep = false): T {
    // Return typed mock
    return item;
  }

  clearAllMocks(): void {
    for (const mock of this.mocks) {
      mock.mockClear();
    }
    for (const spyMap of this.spies.values()) {
      for (const spy of spyMap.values()) {
        spy.mockClear();
      }
    }
  }

  resetAllMocks(): void {
    for (const mock of this.mocks) {
      mock.mockReset();
    }
    for (const spyMap of this.spies.values()) {
      for (const spy of spyMap.values()) {
        spy.mockReset();
      }
    }
  }

  restoreAllMocks(): void {
    for (const spyMap of this.spies.values()) {
      for (const spy of spyMap.values()) {
        spy.mockRestore();
      }
    }
    this.spies.clear();
  }

  useFakeTimers(): void {
    if (this.fakeTimersEnabled) return;

    this.fakeTimersEnabled = true;
    this.currentTime = Date.now();

    this.originalTimers = {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
      setInterval: globalThis.setInterval,
      clearInterval: globalThis.clearInterval,
      Date: globalThis.Date
    };

    globalThis.setTimeout = this.fakeSetTimeout.bind(this) as any;
    globalThis.clearTimeout = this.fakeClearTimeout.bind(this) as any;
    globalThis.setInterval = this.fakeSetInterval.bind(this) as any;
    globalThis.clearInterval = this.fakeClearInterval.bind(this) as any;

    const self = this;
    globalThis.Date = new Proxy(this.originalTimers.Date, {
      construct(target, args) {
        if (args.length === 0) {
          return new target(self.currentTime);
        }
        return new target(...args);
      },
      apply(target, thisArg, args) {
        if (args.length === 0) {
          return new target(self.currentTime).toString();
        }
        return target.apply(thisArg, args);
      },
      get(target, prop) {
        if (prop === 'now') {
          return () => self.currentTime;
        }
        return target[prop as keyof typeof Date];
      }
    }) as any;
  }

  useRealTimers(): void {
    if (!this.fakeTimersEnabled) return;

    this.fakeTimersEnabled = false;

    globalThis.setTimeout = this.originalTimers.setTimeout;
    globalThis.clearTimeout = this.originalTimers.clearTimeout;
    globalThis.setInterval = this.originalTimers.setInterval;
    globalThis.clearInterval = this.originalTimers.clearInterval;
    globalThis.Date = this.originalTimers.Date;

    this.timers.clear();
  }

  advanceTimersByTime(ms: number): void {
    if (!this.fakeTimersEnabled) {
      throw new Error('Timers are not mocked');
    }

    const targetTime = this.currentTime + ms;

    while (this.currentTime < targetTime) {
      const nextTimer = this.getNextTimer();
      if (!nextTimer || nextTimer.runAt > targetTime) {
        this.currentTime = targetTime;
        break;
      }

      this.currentTime = nextTimer.runAt;
      this.executeTimer(nextTimer);
    }
  }

  advanceTimersToNextTimer(): void {
    if (!this.fakeTimersEnabled) {
      throw new Error('Timers are not mocked');
    }

    const nextTimer = this.getNextTimer();
    if (nextTimer) {
      this.currentTime = nextTimer.runAt;
      this.executeTimer(nextTimer);
    }
  }

  runAllTimers(): void {
    if (!this.fakeTimersEnabled) {
      throw new Error('Timers are not mocked');
    }

    let iterations = 0;
    const maxIterations = 100000;

    while (this.timers.size > 0 && iterations < maxIterations) {
      const nextTimer = this.getNextTimer();
      if (!nextTimer) break;

      this.currentTime = nextTimer.runAt;
      this.executeTimer(nextTimer);
      iterations++;
    }

    if (iterations >= maxIterations) {
      throw new Error('Infinite loop detected in timers');
    }
  }

  runOnlyPendingTimers(): void {
    if (!this.fakeTimersEnabled) {
      throw new Error('Timers are not mocked');
    }

    const pendingTimers = Array.from(this.timers.values())
      .filter(t => !t.interval);

    for (const timer of pendingTimers) {
      this.currentTime = timer.runAt;
      this.executeTimer(timer);
    }
  }

  clearAllTimers(): void {
    this.timers.clear();
  }

  getTimerCount(): number {
    return this.timers.size;
  }

  setSystemTime(time: number | Date): void {
    if (!this.fakeTimersEnabled) {
      throw new Error('Timers are not mocked');
    }

    this.currentTime = time instanceof Date ? time.getTime() : time;
  }

  getRealSystemTime(): number {
    return this.originalTimers.Date.now();
  }

  stubGlobal(name: string, value: any): void {
    if (!this.stubbedGlobals.has(name)) {
      this.stubbedGlobals.set(name, {
        original: (globalThis as any)[name],
        stubbed: value
      });
    }
    (globalThis as any)[name] = value;
  }

  unstubAllGlobals(): void {
    for (const [name, { original }] of this.stubbedGlobals) {
      (globalThis as any)[name] = original;
    }
    this.stubbedGlobals.clear();
  }

  hoisted<T>(factory: () => T): T {
    // In a real implementation, this would hoist the factory to the top
    return factory();
  }

  private fakeSetTimeout(callback: () => void, delay: number = 0): number {
    const id = this.timerIdCounter++;
    this.timers.set(id, {
      callback,
      runAt: this.currentTime + delay,
      interval: false
    });
    return id;
  }

  private fakeClearTimeout(id: number): void {
    this.timers.delete(id);
  }

  private fakeSetInterval(callback: () => void, delay: number): number {
    const id = this.timerIdCounter++;
    this.timers.set(id, {
      callback,
      runAt: this.currentTime + delay,
      interval: true,
      delay
    });
    return id;
  }

  private fakeClearInterval(id: number): void {
    this.timers.delete(id);
  }

  private getNextTimer(): any {
    let next: any = null;

    for (const timer of this.timers.values()) {
      if (!next || timer.runAt < next.runAt) {
        next = timer;
      }
    }

    return next;
  }

  private executeTimer(timer: any): void {
    try {
      timer.callback();

      if (timer.interval) {
        timer.runAt = this.currentTime + timer.delay;
      } else {
        // Remove one-time timer
        for (const [id, t] of this.timers) {
          if (t === timer) {
            this.timers.delete(id);
            break;
          }
        }
      }
    } catch (error) {
      // Remove timer on error
      for (const [id, t] of this.timers) {
        if (t === timer) {
          this.timers.delete(id);
          break;
        }
      }
      throw error;
    }
  }
}

export const vi = new ViImplementation();
