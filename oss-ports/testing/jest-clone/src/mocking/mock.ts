/**
 * Jest Clone - Mocking System
 * Comprehensive mocking capabilities for functions, modules, and timers
 */

import type { MockFunction, MockContext, MockResult, SpyInstance, Timer } from '../types';

export class Mock<T = any, Y extends any[] = any[]> implements MockFunction<T, Y> {
  mock: MockContext<T, Y>;
  private implementation?: (...args: Y) => T;
  private mockName?: string;
  private onceImplementations: Array<(...args: Y) => T> = [];
  private returnValues: T[] = [];
  private onceReturnValues: T[] = [];

  constructor(implementation?: (...args: Y) => T) {
    this.implementation = implementation;
    this.mock = {
      calls: [],
      results: [],
      instances: [],
      contexts: [],
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
    this.mock.contexts.push(thisArg);
    this.mock.instances.push(thisArg);

    try {
      let result: T;

      // Use once implementation if available
      if (this.onceImplementations.length > 0) {
        const impl = this.onceImplementations.shift()!;
        result = impl(...args);
      }
      // Use once return value if available
      else if (this.onceReturnValues.length > 0) {
        result = this.onceReturnValues.shift()!;
      }
      // Use regular return value if available
      else if (this.returnValues.length > 0) {
        result = this.returnValues[this.returnValues.length - 1];
      }
      // Use implementation
      else if (this.implementation) {
        result = this.implementation(...args);
      }
      // Return undefined by default
      else {
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
    this.mock.contexts = [];
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
    // For spies, restore original implementation
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

  mockName(name: string): this {
    this.mockName = name;
    return this;
  }

  getMockName(): string {
    return this.mockName || 'jest.fn()';
  }
}

export class ModuleMocker {
  private mockedModules: Map<string, any> = new Map();
  private spies: Map<any, Map<string | symbol, SpyInstance>> = new Map();

  mock(modulePath: string, factory?: () => any): void {
    if (factory) {
      this.mockedModules.set(modulePath, factory());
    } else {
      this.mockedModules.set(modulePath, {});
    }
  }

  unmock(modulePath: string): void {
    this.mockedModules.delete(modulePath);
  }

  doMock(modulePath: string, factory?: () => any): void {
    this.mock(modulePath, factory);
  }

  dontMock(modulePath: string): void {
    this.unmock(modulePath);
  }

  getMockedModule(modulePath: string): any {
    return this.mockedModules.get(modulePath);
  }

  isMocked(modulePath: string): boolean {
    return this.mockedModules.has(modulePath);
  }

  requireActual<T = any>(modulePath: string): T {
    // In a real implementation, this would load the actual module
    // bypassing any mocks
    throw new Error('requireActual not implemented');
  }

  requireMock<T = any>(modulePath: string): T {
    const mocked = this.mockedModules.get(modulePath);
    if (!mocked) {
      throw new Error(`Module ${modulePath} is not mocked`);
    }
    return mocked;
  }

  spyOn<T extends {}, M extends keyof T>(
    object: T,
    method: M
  ): SpyInstance<any, any> {
    if (typeof object[method] !== 'function') {
      throw new Error(`Cannot spy on non-function property ${String(method)}`);
    }

    const original = object[method];
    const spy = new Mock(original as any) as SpyInstance;

    // Store original for restoration
    if (!this.spies.has(object)) {
      this.spies.set(object, new Map());
    }
    this.spies.get(object)!.set(method, spy);

    // Replace method with spy
    (object as any)[method] = spy;

    // Override mockRestore to restore original
    const originalRestore = spy.mockRestore.bind(spy);
    spy.mockRestore = () => {
      originalRestore();
      (object as any)[method] = original;
      this.spies.get(object)?.delete(method);
    };

    return spy;
  }

  clearAllMocks(): void {
    for (const [obj, spyMap] of this.spies) {
      for (const spy of spyMap.values()) {
        spy.mockClear();
      }
    }
  }

  resetAllMocks(): void {
    for (const [obj, spyMap] of this.spies) {
      for (const spy of spyMap.values()) {
        spy.mockReset();
      }
    }
  }

  restoreAllMocks(): void {
    for (const [obj, spyMap] of this.spies) {
      for (const spy of spyMap.values()) {
        spy.mockRestore();
      }
    }
    this.spies.clear();
  }
}

export class TimerMocker implements Timer {
  private usingFakeTimers = false;
  private timers: Map<number, FakeTimer> = new Map();
  private currentTime = 0;
  private timerIdCounter = 1;
  private originalSetTimeout: typeof setTimeout;
  private originalClearTimeout: typeof clearTimeout;
  private originalSetInterval: typeof setInterval;
  private originalClearInterval: typeof clearInterval;
  private originalDate: typeof Date;

  constructor() {
    this.originalSetTimeout = globalThis.setTimeout;
    this.originalClearTimeout = globalThis.clearTimeout;
    this.originalSetInterval = globalThis.setInterval;
    this.originalClearInterval = globalThis.clearInterval;
    this.originalDate = globalThis.Date;
  }

  useFakeTimers(): void {
    if (this.usingFakeTimers) return;

    this.usingFakeTimers = true;
    this.currentTime = Date.now();

    // Replace global timer functions
    globalThis.setTimeout = this.setTimeout.bind(this) as any;
    globalThis.clearTimeout = this.clearTimeout.bind(this) as any;
    globalThis.setInterval = this.setInterval.bind(this) as any;
    globalThis.clearInterval = this.clearInterval.bind(this) as any;

    // Replace Date
    const self = this;
    globalThis.Date = new Proxy(this.originalDate, {
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
    if (!this.usingFakeTimers) return;

    this.usingFakeTimers = false;

    // Restore original timer functions
    globalThis.setTimeout = this.originalSetTimeout;
    globalThis.clearTimeout = this.originalClearTimeout;
    globalThis.setInterval = this.originalSetInterval;
    globalThis.clearInterval = this.originalClearInterval;
    globalThis.Date = this.originalDate;

    // Clear all fake timers
    this.timers.clear();
  }

  setTimeout(callback: () => void, delay: number): number {
    if (!this.usingFakeTimers) {
      return this.originalSetTimeout(callback, delay) as any;
    }

    const id = this.timerIdCounter++;
    this.timers.set(id, {
      callback,
      runAt: this.currentTime + delay,
      interval: false
    });
    return id;
  }

  clearTimeout(id: number): void {
    if (!this.usingFakeTimers) {
      return this.originalClearTimeout(id as any);
    }

    this.timers.delete(id);
  }

  setInterval(callback: () => void, delay: number): number {
    if (!this.usingFakeTimers) {
      return this.originalSetInterval(callback, delay) as any;
    }

    const id = this.timerIdCounter++;
    this.timers.set(id, {
      callback,
      runAt: this.currentTime + delay,
      interval: true,
      delay
    });
    return id;
  }

  clearInterval(id: number): void {
    if (!this.usingFakeTimers) {
      return this.originalClearInterval(id as any);
    }

    this.timers.delete(id);
  }

  advanceTimersByTime(ms: number): void {
    if (!this.usingFakeTimers) {
      throw new Error('advanceTimersByTime can only be used with fake timers');
    }

    const targetTime = this.currentTime + ms;

    while (this.currentTime < targetTime) {
      const nextTimer = this.getNextTimer();
      if (!nextTimer || nextTimer.timer.runAt > targetTime) {
        this.currentTime = targetTime;
        break;
      }

      this.currentTime = nextTimer.timer.runAt;
      this.runTimer(nextTimer.id, nextTimer.timer);
    }
  }

  runAllTimers(): void {
    if (!this.usingFakeTimers) {
      throw new Error('runAllTimers can only be used with fake timers');
    }

    let iterations = 0;
    const maxIterations = 100000; // Prevent infinite loops

    while (this.timers.size > 0 && iterations < maxIterations) {
      const nextTimer = this.getNextTimer();
      if (!nextTimer) break;

      this.currentTime = nextTimer.timer.runAt;
      this.runTimer(nextTimer.id, nextTimer.timer);
      iterations++;
    }

    if (iterations >= maxIterations) {
      throw new Error('Aborting after running 100000 timers, assuming infinite loop');
    }
  }

  runOnlyPendingTimers(): void {
    if (!this.usingFakeTimers) {
      throw new Error('runOnlyPendingTimers can only be used with fake timers');
    }

    const pendingTimers = Array.from(this.timers.entries());

    for (const [id, timer] of pendingTimers) {
      if (!timer.interval) {
        this.currentTime = timer.runAt;
        this.runTimer(id, timer);
      }
    }
  }

  clearAllTimers(): void {
    this.timers.clear();
  }

  getTimerCount(): number {
    return this.timers.size;
  }

  Date = Date;

  private getNextTimer(): { id: number; timer: FakeTimer } | null {
    let nextId: number | null = null;
    let nextTimer: FakeTimer | null = null;

    for (const [id, timer] of this.timers) {
      if (!nextTimer || timer.runAt < nextTimer.runAt) {
        nextId = id;
        nextTimer = timer;
      }
    }

    if (nextId === null || nextTimer === null) {
      return null;
    }

    return { id: nextId, timer: nextTimer };
  }

  private runTimer(id: number, timer: FakeTimer): void {
    try {
      timer.callback();

      if (timer.interval && timer.delay !== undefined) {
        // Reschedule interval
        timer.runAt = this.currentTime + timer.delay;
      } else {
        // Remove one-time timer
        this.timers.delete(id);
      }
    } catch (error) {
      this.timers.delete(id);
      throw error;
    }
  }
}

interface FakeTimer {
  callback: () => void;
  runAt: number;
  interval: boolean;
  delay?: number;
}

// Global jest object
export const jest = {
  fn<T = any, Y extends any[] = any[]>(
    implementation?: (...args: Y) => T
  ): MockFunction<T, Y> {
    return new Mock(implementation) as MockFunction<T, Y>;
  },

  spyOn: moduleMocker.spyOn.bind(moduleMocker),
  mock: moduleMocker.mock.bind(moduleMocker),
  unmock: moduleMocker.unmock.bind(moduleMocker),
  doMock: moduleMocker.doMock.bind(moduleMocker),
  dontMock: moduleMocker.dontMock.bind(moduleMocker),
  requireActual: moduleMocker.requireActual.bind(moduleMocker),
  requireMock: moduleMocker.requireMock.bind(moduleMocker),

  clearAllMocks: moduleMocker.clearAllMocks.bind(moduleMocker),
  resetAllMocks: moduleMocker.resetAllMocks.bind(moduleMocker),
  restoreAllMocks: moduleMocker.restoreAllMocks.bind(moduleMocker),

  useFakeTimers: timerMocker.useFakeTimers.bind(timerMocker),
  useRealTimers: timerMocker.useRealTimers.bind(timerMocker),
  advanceTimersByTime: timerMocker.advanceTimersByTime.bind(timerMocker),
  runAllTimers: timerMocker.runAllTimers.bind(timerMocker),
  runOnlyPendingTimers: timerMocker.runOnlyPendingTimers.bind(timerMocker),
  clearAllTimers: timerMocker.clearAllTimers.bind(timerMocker),
  getTimerCount: timerMocker.getTimerCount.bind(timerMocker)
};

const moduleMocker = new ModuleMocker();
const timerMocker = new TimerMocker();
