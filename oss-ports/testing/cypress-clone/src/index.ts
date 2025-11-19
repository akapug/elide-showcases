/**
 * Cypress Clone - Main Entry Point
 * JavaScript E2E testing framework for Elide
 */

export interface Chainable<Subject = any> {
  // Queries
  get(selector: string, options?: Partial<Loggable & Timeoutable>): Chainable<Subject>;
  contains(content: string | number | RegExp): Chainable<Subject>;
  contains(selector: string, content: string | number | RegExp): Chainable<Subject>;
  find(selector: string): Chainable<Subject>;
  filter(selector: string): Chainable<Subject>;
  not(selector: string): Chainable<Subject>;
  eq(index: number): Chainable<Subject>;
  first(): Chainable<Subject>;
  last(): Chainable<Subject>;
  parent(selector?: string): Chainable<Subject>;
  parents(selector?: string): Chainable<Subject>;
  children(selector?: string): Chainable<Subject>;
  siblings(selector?: string): Chainable<Subject>;
  next(selector?: string): Chainable<Subject>;
  prev(selector?: string): Chainable<Subject>;
  closest(selector: string): Chainable<Subject>;

  // Actions
  click(options?: Partial<ClickOptions>): Chainable<Subject>;
  dblclick(options?: Partial<ClickOptions>): Chainable<Subject>;
  rightclick(options?: Partial<ClickOptions>): Chainable<Subject>;
  type(text: string, options?: Partial<TypeOptions>): Chainable<Subject>;
  clear(options?: Partial<ClearOptions>): Chainable<Subject>;
  check(value?: string | string[], options?: Partial<CheckOptions>): Chainable<Subject>;
  uncheck(value?: string | string[], options?: Partial<CheckOptions>): Chainable<Subject>;
  select(valueOrText: string | string[], options?: Partial<SelectOptions>): Chainable<Subject>;
  focus(options?: Partial<Loggable>): Chainable<Subject>;
  blur(options?: Partial<Loggable>): Chainable<Subject>;
  submit(options?: Partial<Loggable>): Chainable<Subject>;
  trigger(eventName: string, options?: Partial<TriggerOptions>): Chainable<Subject>;

  // Assertions
  should(chainers: string, value?: any): Chainable<Subject>;
  should(chainers: string, method: string, value: any): Chainable<Subject>;
  should(fn: (currentSubject: Subject) => void): Chainable<Subject>;
  and(chainers: string, value?: any): Chainable<Subject>;
  and(chainers: string, method: string, value: any): Chainable<Subject>;
  and(fn: (currentSubject: Subject) => void): Chainable<Subject>;

  // Utilities
  as(alias: string): Chainable<Subject>;
  invoke(functionName: string, ...args: any[]): Chainable<any>;
  its(propertyName: string): Chainable<any>;
  then<S>(fn: (currentSubject: Subject) => S | Chainable<S>): Chainable<S>;
  each(fn: (element: any, index: number, $list: any) => void): Chainable<Subject>;
  spread<S>(fn: (...args: any[]) => S): Chainable<S>;
  within(fn: (currentSubject: Subject) => void): Chainable<Subject>;
  wrap<S>(object: S): Chainable<S>;

  // Waits
  wait(ms: number): Chainable<Subject>;
  wait(alias: string, options?: Partial<Loggable & Timeoutable>): Chainable<Subject>;

  // Window
  window(options?: Partial<Loggable>): Chainable<Window>;
  document(options?: Partial<Loggable>): Chainable<Document>;
  title(options?: Partial<Loggable>): Chainable<string>;

  // Screenshots
  screenshot(fileName?: string, options?: Partial<Loggable & ScreenshotOptions>): Chainable<Subject>;

  // Debugging
  debug(options?: Partial<Loggable>): Chainable<Subject>;
  pause(options?: Partial<Loggable>): Chainable<Subject>;
}

export interface Cy extends Chainable {
  // Navigation
  visit(url: string, options?: Partial<VisitOptions>): Chainable<Window>;
  go(direction: 'back' | 'forward' | number): Chainable<Window>;
  reload(forceReload?: boolean): Chainable<Window>;

  // Network
  request(url: string): Chainable<Response>;
  request(options: Partial<RequestOptions>): Chainable<Response>;
  intercept(method: string, url: string | RegExp, response?: any): Chainable<null>;
  intercept(url: string | RegExp, response?: any): Chainable<null>;

  // Cookies
  getCookie(name: string, options?: Partial<Loggable & Timeoutable>): Chainable<Cookie | null>;
  getCookies(options?: Partial<Loggable & Timeoutable>): Chainable<Cookie[]>;
  setCookie(name: string, value: string, options?: Partial<SetCookieOptions>): Chainable<Cookie>;
  clearCookie(name: string, options?: Partial<Loggable & Timeoutable>): Chainable<null>;
  clearCookies(options?: Partial<Loggable & Timeoutable>): Chainable<null>;

  // Local Storage
  clearLocalStorage(key?: string): Chainable<Storage>;

  // Viewport
  viewport(width: number, height: number, options?: Partial<Loggable>): Chainable<null>;
  viewport(preset: ViewportPreset, orientation?: 'portrait' | 'landscape', options?: Partial<Loggable>): Chainable<null>;

  // Fixtures
  fixture(path: string, encoding?: Encoding): Chainable<any>;

  // Aliasing
  get<S = any>(alias: string, options?: Partial<Loggable & Timeoutable>): Chainable<S>;

  // Tasks & Plugins
  task(event: string, arg?: any, options?: Partial<Loggable & Timeoutable>): Chainable<any>;
  exec(command: string, options?: Partial<ExecOptions>): Chainable<Exec>;
  readFile(filePath: string, options?: Partial<Loggable & Timeoutable>): Chainable<string>;
  writeFile(filePath: string, contents: any, options?: Partial<Loggable & Timeoutable>): Chainable<null>;

  // Location
  url(options?: Partial<Loggable>): Chainable<string>;
  location(key?: keyof Location, options?: Partial<Loggable>): Chainable<Location | string>;
  hash(options?: Partial<Loggable>): Chainable<string>;

  // Clock
  clock(now?: number, options?: string[]): Chainable<Clock>;
  tick(milliseconds: number): Chainable<Clock>;

  // Origin
  origin(url: string, fn: () => void): Chainable<null>;

  // Session
  session(id: string, setup: () => void, options?: Partial<SessionOptions>): Chainable<null>;

  // Custom commands
  log(message: string, ...args: any[]): Chainable<null>;
}

export interface Loggable {
  log: boolean;
}

export interface Timeoutable {
  timeout: number;
}

export interface ClickOptions extends Loggable, Timeoutable {
  force: boolean;
  multiple: boolean;
  position: 'topLeft' | 'top' | 'topRight' | 'left' | 'center' | 'right' | 'bottomLeft' | 'bottom' | 'bottomRight';
}

export interface TypeOptions extends Loggable, Timeoutable {
  delay: number;
  force: boolean;
  parseSpecialCharSequences: boolean;
}

export interface ClearOptions extends Loggable, Timeoutable {
  force: boolean;
}

export interface CheckOptions extends Loggable, Timeoutable {
  force: boolean;
}

export interface SelectOptions extends Loggable, Timeoutable {
  force: boolean;
}

export interface TriggerOptions extends Loggable, Timeoutable {
  bubbles: boolean;
  cancelable: boolean;
  eventConstructor: string;
}

export interface VisitOptions extends Loggable, Timeoutable {
  url: string;
  method: 'GET' | 'POST';
  body: any;
  headers: { [key: string]: string };
  qs: { [key: string]: any };
  auth: { username: string; password: string };
  failOnStatusCode: boolean;
  onBeforeLoad: (win: Window) => void;
  onLoad: (win: Window) => void;
  retryOnStatusCodeFailure: boolean;
  retryOnNetworkFailure: boolean;
}

export interface RequestOptions extends Loggable, Timeoutable {
  method: string;
  url: string;
  headers: { [key: string]: string };
  body: any;
  form: boolean;
  auth: { username: string; password: string };
  qs: { [key: string]: any };
  failOnStatusCode: boolean;
  followRedirect: boolean;
  encoding: Encoding;
  gzip: boolean;
}

export interface Response {
  status: number;
  statusText: string;
  body: any;
  headers: { [key: string]: string };
  duration: number;
  isOkStatusCode: boolean;
  requestHeaders: { [key: string]: string };
  allRequestResponses: any[];
}

export interface Cookie {
  name: string;
  value: string;
  path: string;
  domain: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'no_restriction' | 'lax' | 'strict';
  expiry?: number;
}

export interface SetCookieOptions extends Loggable, Timeoutable {
  path: string;
  domain: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'no_restriction' | 'lax' | 'strict';
  expiry: number;
}

export interface Exec {
  code: number;
  stdout: string;
  stderr: string;
}

export interface ExecOptions extends Loggable, Timeoutable {
  failOnNonZeroExit: boolean;
  env: { [key: string]: string };
}

export interface Clock {
  tick(milliseconds: number): void;
  restore(): void;
}

export interface SessionOptions {
  validate: () => void;
  cacheAcrossSpecs: boolean;
}

export interface ScreenshotOptions {
  capture: 'fullPage' | 'viewport' | 'runner';
  clip: { x: number; y: number; width: number; height: number };
  scale: boolean;
  disableTimersAndAnimations: boolean;
  overwrite: boolean;
}

export type ViewportPreset =
  | 'iphone-3'
  | 'iphone-4'
  | 'iphone-5'
  | 'iphone-6'
  | 'iphone-6+'
  | 'iphone-7'
  | 'iphone-8'
  | 'iphone-x'
  | 'iphone-xr'
  | 'iphone-se2'
  | 'ipad-2'
  | 'ipad-mini'
  | 'macbook-11'
  | 'macbook-13'
  | 'macbook-15'
  | 'macbook-16';

export type Encoding =
  | 'ascii'
  | 'base64'
  | 'binary'
  | 'hex'
  | 'latin1'
  | 'utf8'
  | 'utf-8'
  | 'ucs2'
  | 'ucs-2'
  | 'utf16le'
  | 'utf-16le';

export declare const cy: Cy;

export interface CypressStatic {
  Commands: {
    add(name: string, fn: (...args: any[]) => any): void;
    add(name: string, options: { prevSubject: boolean | 'element' | 'document' | 'window' }, fn: (...args: any[]) => any): void;
    overwrite(name: string, fn: (originalFn: any, ...args: any[]) => any): void;
  };
  Screenshot: {
    defaults(options: Partial<ScreenshotOptions>): void;
  };
  config(): CypressConfig;
  config(key: string): any;
  config(key: string, value: any): void;
  config(config: Partial<CypressConfig>): void;
  env(): { [key: string]: any };
  env(key: string): any;
  env(key: string, value: any): void;
  env(object: { [key: string]: any }): void;
  isCy(value: any): value is Cy;
  log(options: any): void;
  testingType: 'e2e' | 'component';
  version: string;
}

export interface CypressConfig {
  baseUrl: string;
  specPattern: string;
  supportFile: string;
  video: boolean;
  screenshotOnRunFailure: boolean;
  viewportWidth: number;
  viewportHeight: number;
  defaultCommandTimeout: number;
  requestTimeout: number;
  responseTimeout: number;
  pageLoadTimeout: number;
  execTimeout: number;
  taskTimeout: number;
  retries: number | { runMode: number; openMode: number };
  screenshotsFolder: string;
  videosFolder: string;
  downloadsFolder: string;
  fixturesFolder: string;
  env: { [key: string]: any };
}

export declare const Cypress: CypressStatic;

export function defineConfig(config: Partial<CypressConfig & { e2e?: any; component?: any }>): any {
  return config;
}

// Test structure
export function describe(name: string, fn: () => void): void {}
export function context(name: string, fn: () => void): void {}
export function it(name: string, fn: () => void): void {}
export function specify(name: string, fn: () => void): void {}

export function before(fn: () => void): void {}
export function beforeEach(fn: () => void): void {}
export function after(fn: () => void): void {}
export function afterEach(fn: () => void): void {}

export namespace describe {
  export function skip(name: string, fn: () => void): void {}
  export function only(name: string, fn: () => void): void {}
}

export namespace it {
  export function skip(name: string, fn: () => void): void {}
  export function only(name: string, fn: () => void): void {}
}

// TypeScript declarations
declare global {
  namespace Cypress {
    interface Chainable extends Cy {}
  }
}
