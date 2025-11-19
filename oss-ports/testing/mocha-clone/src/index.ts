/**
 * Mocha Clone - Main Entry Point
 * Feature-rich JavaScript test framework for Elide
 */

export interface MochaOptions {
  ui?: 'bdd' | 'tdd' | 'qunit' | 'exports';
  reporter?: string | ReporterConstructor;
  timeout?: number;
  retries?: number;
  slow?: number;
  bail?: boolean;
  grep?: string | RegExp;
  invert?: boolean;
  checkLeaks?: boolean;
  globals?: string[];
  growl?: boolean;
  useColors?: boolean;
  inlineDiffs?: boolean;
  parallel?: boolean;
  jobs?: number;
  require?: string[];
  fullTrace?: boolean;
  forbidOnly?: boolean;
  forbidPending?: boolean;
}

export class Mocha {
  private options: MochaOptions;
  private files: string[] = [];
  private suite: Suite;

  constructor(options: MochaOptions = {}) {
    this.options = {
      ui: 'bdd',
      reporter: 'spec',
      timeout: 2000,
      slow: 75,
      ...options
    };

    this.suite = new Suite('', new Context());
  }

  addFile(file: string): this {
    this.files.push(file);
    return this;
  }

  loadFiles(fn?: () => void): void {
    // Load test files
    if (fn) fn();
  }

  reporter(reporter: string | ReporterConstructor, reporterOptions?: any): this {
    this.options.reporter = reporter;
    return this;
  }

  ui(name: string): this {
    this.options.ui = name as any;
    return this;
  }

  timeout(ms: number): this {
    this.options.timeout = ms;
    return this;
  }

  retries(count: number): this {
    this.options.retries = count;
    return this;
  }

  slow(ms: number): this {
    this.options.slow = ms;
    return this;
  }

  bail(enabled?: boolean): this {
    this.options.bail = enabled ?? true;
    return this;
  }

  grep(pattern: string | RegExp): this {
    this.options.grep = pattern;
    return this;
  }

  invert(): this {
    this.options.invert = true;
    return this;
  }

  checkLeaks(): this {
    this.options.checkLeaks = true;
    return this;
  }

  globals(globals: string[]): this {
    this.options.globals = globals;
    return this;
  }

  growl(): this {
    this.options.growl = true;
    return this;
  }

  useColors(enabled: boolean): this {
    this.options.useColors = enabled;
    return this;
  }

  inlineDiffs(enabled: boolean): this {
    this.options.inlineDiffs = enabled;
    return this;
  }

  forbidOnly(): this {
    this.options.forbidOnly = true;
    return this;
  }

  forbidPending(): this {
    this.options.forbidPending = true;
    return this;
  }

  parallel(): this {
    this.options.parallel = true;
    return this;
  }

  run(fn?: (failures: number) => void): Runner {
    const runner = new Runner(this.suite);

    if (fn) {
      runner.on('end', () => {
        fn(runner.failures);
      });
    }

    return runner;
  }
}

export class Suite {
  title: string;
  parent?: Suite;
  ctx: Context;
  tests: Test[] = [];
  suites: Suite[] = [];
  pending: boolean = false;
  _beforeAll: Hook[] = [];
  _beforeEach: Hook[] = [];
  _afterAll: Hook[] = [];
  _afterEach: Hook[] = [];
  _timeout?: number;
  _retries?: number;
  _slow?: number;
  _bail?: boolean;

  constructor(title: string, ctx: Context) {
    this.title = title;
    this.ctx = ctx;
  }

  timeout(ms: number | string): this {
    if (typeof ms === 'string') {
      ms = parseInt(ms, 10);
    }
    this._timeout = ms;
    return this;
  }

  retries(count: number): this {
    this._retries = count;
    return this;
  }

  slow(ms: number): this {
    this._slow = ms;
    return this;
  }

  bail(enabled?: boolean): this {
    this._bail = enabled ?? true;
    return this;
  }

  beforeAll(fn: Function): this;
  beforeAll(title: string, fn: Function): this;
  beforeAll(title: string | Function, fn?: Function): this {
    if (typeof title === 'function') {
      fn = title;
      title = fn.name || '';
    }
    const hook = new Hook(title as string, fn!);
    this._beforeAll.push(hook);
    return this;
  }

  afterAll(fn: Function): this;
  afterAll(title: string, fn: Function): this;
  afterAll(title: string | Function, fn?: Function): this {
    if (typeof title === 'function') {
      fn = title;
      title = fn.name || '';
    }
    const hook = new Hook(title as string, fn!);
    this._afterAll.push(hook);
    return this;
  }

  beforeEach(fn: Function): this;
  beforeEach(title: string, fn: Function): this;
  beforeEach(title: string | Function, fn?: Function): this {
    if (typeof title === 'function') {
      fn = title;
      title = fn.name || '';
    }
    const hook = new Hook(title as string, fn!);
    this._beforeEach.push(hook);
    return this;
  }

  afterEach(fn: Function): this;
  afterEach(title: string, fn: Function): this;
  afterEach(title: string | Function, fn?: Function): this {
    if (typeof title === 'function') {
      fn = title;
      title = fn.name || '';
    }
    const hook = new Hook(title as string, fn!);
    this._afterEach.push(hook);
    return this;
  }

  addSuite(suite: Suite): this {
    suite.parent = this;
    this.suites.push(suite);
    return this;
  }

  addTest(test: Test): this {
    test.parent = this;
    this.tests.push(test);
    return this;
  }

  fullTitle(): string {
    if (this.parent) {
      const full = this.parent.fullTitle();
      return full ? `${full} ${this.title}` : this.title;
    }
    return this.title;
  }
}

export class Test {
  title: string;
  parent?: Suite;
  fn?: Function;
  pending: boolean = false;
  duration?: number;
  state?: 'passed' | 'failed' | 'pending';
  err?: Error;
  _timeout?: number;
  _retries?: number;
  _slow?: number;
  _currentRetry: number = 0;
  ctx: Context;

  constructor(title: string, fn?: Function) {
    this.title = title;
    this.fn = fn;
    this.ctx = new Context();

    if (!fn) {
      this.pending = true;
    }
  }

  timeout(ms: number | string): this {
    if (typeof ms === 'string') {
      ms = parseInt(ms, 10);
    }
    this._timeout = ms;
    return this;
  }

  retries(count: number): this {
    this._retries = count;
    return this;
  }

  slow(ms: number): this {
    this._slow = ms;
    return this;
  }

  fullTitle(): string {
    if (this.parent) {
      return `${this.parent.fullTitle()} ${this.title}`;
    }
    return this.title;
  }

  isPending(): boolean {
    return this.pending || (this.parent?.pending ?? false);
  }

  currentRetry(): number {
    return this._currentRetry;
  }
}

export class Hook {
  title: string;
  fn: Function;
  ctx: Context;
  parent?: Suite;
  _timeout?: number;
  err?: Error;

  constructor(title: string, fn: Function) {
    this.title = title;
    this.fn = fn;
    this.ctx = new Context();
  }

  timeout(ms: number): this {
    this._timeout = ms;
    return this;
  }
}

export class Context {
  test?: Test;
  currentTest?: Test;

  timeout(ms: number): this {
    if (this.test) {
      this.test.timeout(ms);
    }
    return this;
  }

  retries(count: number): this {
    if (this.test) {
      this.test.retries(count);
    }
    return this;
  }

  slow(ms: number): this {
    if (this.test) {
      this.test.slow(ms);
    }
    return this;
  }
}

export class Runner {
  suite: Suite;
  total: number = 0;
  failures: number = 0;
  private listeners: { [event: string]: Function[] } = {};

  constructor(suite: Suite) {
    this.suite = suite;
    this.countTests(suite);
  }

  private countTests(suite: Suite): void {
    this.total += suite.tests.length;
    for (const child of suite.suites) {
      this.countTests(child);
    }
  }

  on(event: string, listener: Function): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return this;
  }

  once(event: string, listener: Function): this {
    const wrapper = (...args: any[]) => {
      this.removeListener(event, wrapper);
      listener(...args);
    };
    this.on(event, wrapper);
    return this;
  }

  removeListener(event: string, listener: Function): this {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (this.listeners[event]) {
      for (const listener of this.listeners[event]) {
        listener(...args);
      }
      return true;
    }
    return false;
  }

  async run(): Promise<this> {
    this.emit('start');

    await this.runSuite(this.suite);

    this.emit('end');

    return this;
  }

  private async runSuite(suite: Suite): Promise<void> {
    if (suite.tests.length > 0 || suite.suites.length > 0) {
      this.emit('suite', suite);

      // Run beforeAll hooks
      for (const hook of suite._beforeAll) {
        this.emit('hook', hook);
        await this.runHook(hook);
        this.emit('hook end', hook);
      }

      // Run tests
      for (const test of suite.tests) {
        await this.runTest(test, suite);
      }

      // Run child suites
      for (const child of suite.suites) {
        await this.runSuite(child);
      }

      // Run afterAll hooks
      for (const hook of suite._afterAll) {
        this.emit('hook', hook);
        await this.runHook(hook);
        this.emit('hook end', hook);
      }

      this.emit('suite end', suite);
    }
  }

  private async runTest(test: Test, suite: Suite): Promise<void> {
    if (test.isPending()) {
      test.state = 'pending';
      this.emit('pending', test);
      return;
    }

    this.emit('test', test);

    const start = Date.now();

    try {
      // Run beforeEach hooks
      for (const hook of this.getBeforeEachHooks(suite)) {
        await this.runHook(hook);
      }

      // Run test
      if (test.fn) {
        await this.runTestFn(test);
      }

      // Run afterEach hooks
      for (const hook of this.getAfterEachHooks(suite)) {
        await this.runHook(hook);
      }

      test.duration = Date.now() - start;
      test.state = 'passed';
      this.emit('pass', test);
    } catch (err) {
      test.duration = Date.now() - start;
      test.state = 'failed';
      test.err = err as Error;
      this.failures++;
      this.emit('fail', test, err);

      // Retry if configured
      if (test._retries && test._currentRetry < test._retries) {
        test._currentRetry++;
        this.emit('retry', test);
        await this.runTest(test, suite);
      }
    } finally {
      this.emit('test end', test);
    }
  }

  private async runHook(hook: Hook): Promise<void> {
    const timeout = hook._timeout || 2000;
    await this.runWithTimeout(hook.fn.bind(hook.ctx), timeout);
  }

  private async runTestFn(test: Test): Promise<void> {
    const timeout = test._timeout || 2000;
    test.ctx.test = test;
    test.ctx.currentTest = test;
    await this.runWithTimeout(test.fn!.bind(test.ctx), timeout);
  }

  private async runWithTimeout(fn: Function, timeout: number): Promise<void> {
    if (timeout === 0) {
      return await fn();
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout of ${timeout}ms exceeded`));
      }, timeout);

      Promise.resolve(fn())
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private getBeforeEachHooks(suite: Suite): Hook[] {
    const hooks: Hook[] = [];
    let current: Suite | undefined = suite;

    while (current) {
      hooks.unshift(...current._beforeEach);
      current = current.parent;
    }

    return hooks;
  }

  private getAfterEachHooks(suite: Suite): Hook[] {
    const hooks: Hook[] = [];
    let current: Suite | undefined = suite;

    while (current) {
      hooks.push(...current._afterEach);
      current = current.parent;
    }

    return hooks;
  }
}

export interface ReporterConstructor {
  new (runner: Runner, options?: any): any;
}

// BDD Interface
export function describe(title: string, fn: () => void): Suite {
  const suite = new Suite(title, new Context());
  fn();
  return suite;
}

export function context(title: string, fn: () => void): Suite {
  return describe(title, fn);
}

export function it(title: string, fn?: Function): Test {
  const test = new Test(title, fn);
  return test;
}

export function specify(title: string, fn?: Function): Test {
  return it(title, fn);
}

export function before(fn: Function): void;
export function before(title: string, fn: Function): void;
export function before(title: string | Function, fn?: Function): void {
  // Register beforeAll hook
}

export function after(fn: Function): void;
export function after(title: string, fn: Function): void;
export function after(title: string | Function, fn?: Function): void {
  // Register afterAll hook
}

export function beforeEach(fn: Function): void;
export function beforeEach(title: string, fn: Function): void;
export function beforeEach(title: string | Function, fn?: Function): void {
  // Register beforeEach hook
}

export function afterEach(fn: Function): void;
export function afterEach(title: string, fn: Function): void;
export function afterEach(title: string | Function, fn?: Function): void {
  // Register afterEach hook
}

// Test modifiers
describe.skip = function(title: string, fn: () => void): Suite {
  const suite = describe(title, fn);
  suite.pending = true;
  return suite;
};

describe.only = function(title: string, fn: () => void): Suite {
  return describe(title, fn);
};

it.skip = function(title: string, fn?: Function): Test {
  const test = it(title, fn);
  test.pending = true;
  return test;
};

it.only = function(title: string, fn?: Function): Test {
  return it(title, fn);
};

// TDD Interface
export function suite(title: string, fn: () => void): Suite {
  return describe(title, fn);
}

export function test(title: string, fn?: Function): Test {
  return it(title, fn);
}

export function setup(fn: Function): void {
  beforeEach(fn);
}

export function teardown(fn: Function): void {
  afterEach(fn);
}

export function suiteSetup(fn: Function): void {
  before(fn);
}

export function suiteTeardown(fn: Function): void {
  after(fn);
}

suite.skip = describe.skip;
suite.only = describe.only;
test.skip = it.skip;
test.only = it.only;

export default Mocha;
