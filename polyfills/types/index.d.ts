/**
 * Type Definitions for Elide Polyfills
 *
 * Complete TypeScript type definitions for all polyfilled APIs.
 * Provides full IDE support and type safety.
 */

/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

declare module 'elide/polyfills' {
  // ============================================================================
  // Node.js Core APIs
  // ============================================================================

  /**
   * Events module - EventEmitter implementation
   */
  export namespace events {
    export type Listener = (...args: any[]) => void;

    export class EventEmitter {
      addListener(eventName: string | symbol, listener: Listener): this;
      on(eventName: string | symbol, listener: Listener): this;
      once(eventName: string | symbol, listener: Listener): this;
      removeListener(eventName: string | symbol, listener: Listener): this;
      off(eventName: string | symbol, listener: Listener): this;
      removeAllListeners(eventName?: string | symbol): this;
      setMaxListeners(n: number): this;
      getMaxListeners(): number;
      listeners(eventName: string | symbol): Listener[];
      rawListeners(eventName: string | symbol): Listener[];
      emit(eventName: string | symbol, ...args: any[]): boolean;
      listenerCount(eventName: string | symbol): number;
      prependListener(eventName: string | symbol, listener: Listener): this;
      prependOnceListener(eventName: string | symbol, listener: Listener): this;
      eventNames(): (string | symbol)[];

      static listenerCount(emitter: EventEmitter, eventName: string | symbol): number;
      static defaultMaxListeners: number;
    }
  }

  /**
   * Path module - Path manipulation
   */
  export namespace path {
    export interface ParsedPath {
      root: string;
      dir: string;
      base: string;
      ext: string;
      name: string;
    }

    export const sep: string;
    export const delimiter: string;

    export function normalize(path: string): string;
    export function join(...paths: string[]): string;
    export function resolve(...paths: string[]): string;
    export function isAbsolute(path: string): boolean;
    export function relative(from: string, to: string): string;
    export function dirname(path: string): string;
    export function basename(path: string, ext?: string): string;
    export function extname(path: string): string;
    export function parse(path: string): ParsedPath;
    export function format(pathObject: Partial<ParsedPath>): string;

    export namespace posix {
      export const sep: '/';
      export const delimiter: ':';
      export function normalize(path: string): string;
      export function join(...paths: string[]): string;
      export function resolve(...paths: string[]): string;
      export function isAbsolute(path: string): boolean;
      export function relative(from: string, to: string): string;
      export function dirname(path: string): string;
      export function basename(path: string, ext?: string): string;
      export function extname(path: string): string;
      export function parse(path: string): ParsedPath;
      export function format(pathObject: Partial<ParsedPath>): string;
    }

    export namespace win32 {
      export const sep: '\\';
      export const delimiter: ';';
      export function normalize(path: string): string;
      export function join(...paths: string[]): string;
      export function resolve(...paths: string[]): string;
      export function isAbsolute(path: string): boolean;
      export function relative(from: string, to: string): string;
      export function dirname(path: string): string;
      export function basename(path: string, ext?: string): string;
      export function extname(path: string): string;
      export function parse(path: string): ParsedPath;
      export function format(pathObject: Partial<ParsedPath>): string;
    }
  }

  /**
   * FS module - File system operations
   */
  export namespace fs {
    export type BufferEncoding = 'utf8' | 'utf-8' | 'ascii' | 'base64' | 'hex' | 'binary' | 'latin1';

    export interface Stats {
      isFile(): boolean;
      isDirectory(): boolean;
      isBlockDevice(): boolean;
      isCharacterDevice(): boolean;
      isSymbolicLink(): boolean;
      isFIFO(): boolean;
      isSocket(): boolean;
      dev: number;
      ino: number;
      mode: number;
      nlink: number;
      uid: number;
      gid: number;
      rdev: number;
      size: number;
      blksize: number;
      blocks: number;
      atimeMs: number;
      mtimeMs: number;
      ctimeMs: number;
      birthtimeMs: number;
      atime: Date;
      mtime: Date;
      ctime: Date;
      birthtime: Date;
    }

    export interface ReadOptions {
      encoding?: BufferEncoding | null;
      flag?: string;
    }

    export interface WriteOptions {
      encoding?: BufferEncoding | null;
      mode?: number;
      flag?: string;
    }

    export function readFileSync(path: string, options?: ReadOptions | BufferEncoding): string | Buffer;
    export function readFile(
      path: string,
      options: ReadOptions | BufferEncoding,
      callback: (err: Error | null, data?: string | Buffer) => void
    ): void;
    export function readFile(
      path: string,
      callback: (err: Error | null, data?: Buffer) => void
    ): void;

    export function writeFileSync(path: string, data: string | Buffer, options?: WriteOptions | BufferEncoding): void;
    export function writeFile(
      path: string,
      data: string | Buffer,
      options: WriteOptions | BufferEncoding,
      callback: (err: Error | null) => void
    ): void;
    export function writeFile(
      path: string,
      data: string | Buffer,
      callback: (err: Error | null) => void
    ): void;

    export function appendFileSync(path: string, data: string | Buffer, options?: WriteOptions | BufferEncoding): void;
    export function existsSync(path: string): boolean;
    export function statSync(path: string): Stats;
    export function stat(path: string, callback: (err: Error | null, stats?: Stats) => void): void;
    export function mkdirSync(path: string, options?: { recursive?: boolean; mode?: number }): void;
    export function readdirSync(path: string): string[];
    export function unlinkSync(path: string): void;
    export function rmdirSync(path: string): void;
    export function renameSync(oldPath: string, newPath: string): void;
    export function copyFileSync(src: string, dest: string): void;

    export namespace promises {
      export function readFile(path: string, options?: ReadOptions | BufferEncoding): Promise<string | Buffer>;
      export function writeFile(path: string, data: string | Buffer, options?: WriteOptions | BufferEncoding): Promise<void>;
      export function appendFile(path: string, data: string | Buffer, options?: WriteOptions | BufferEncoding): Promise<void>;
      export function stat(path: string): Promise<Stats>;
      export function mkdir(path: string, options?: { recursive?: boolean; mode?: number }): Promise<void>;
      export function readdir(path: string): Promise<string[]>;
      export function unlink(path: string): Promise<void>;
      export function rmdir(path: string): Promise<void>;
      export function rename(oldPath: string, newPath: string): Promise<void>;
      export function copyFile(src: string, dest: string): Promise<void>;
    }
  }

  /**
   * OS module - Operating system utilities
   */
  export namespace os {
    export interface CpuInfo {
      model: string;
      speed: number;
      times: {
        user: number;
        nice: number;
        sys: number;
        idle: number;
        irq: number;
      };
    }

    export interface NetworkInterfaceInfo {
      address: string;
      netmask: string;
      family: 'IPv4' | 'IPv6';
      mac: string;
      internal: boolean;
      cidr: string;
    }

    export interface UserInfo {
      username: string;
      uid: number;
      gid: number;
      shell: string | null;
      homedir: string;
    }

    export function arch(): string;
    export function cpus(): CpuInfo[];
    export const EOL: string;
    export function freemem(): number;
    export function totalmem(): number;
    export function homedir(): string;
    export function hostname(): string;
    export function networkInterfaces(): { [key: string]: NetworkInterfaceInfo[] };
    export function platform(): NodeJS.Platform;
    export function release(): string;
    export function tmpdir(): string;
    export function type(): string;
    export function uptime(): number;
    export function userInfo(): UserInfo;
    export function version(): string;
    export function loadavg(): [number, number, number];
  }

  /**
   * Util module - Utility functions
   */
  export namespace util {
    export function format(format: any, ...args: any[]): string;
    export function inspect(obj: any, options?: any): string;
    export function isArray(value: any): value is any[];
    export function isBoolean(value: any): value is boolean;
    export function isNull(value: any): value is null;
    export function isNumber(value: any): value is number;
    export function isString(value: any): value is string;
    export function isSymbol(value: any): value is symbol;
    export function isUndefined(value: any): value is undefined;
    export function isRegExp(value: any): value is RegExp;
    export function isObject(value: any): value is object;
    export function isDate(value: any): value is Date;
    export function isError(value: any): value is Error;
    export function isFunction(value: any): value is Function;
    export function isPrimitive(value: any): boolean;
    export function promisify<T = any>(fn: (...args: any[]) => void): (...args: any[]) => Promise<T>;
    export function callbackify(fn: (...args: any[]) => Promise<any>): (...args: any[]) => void;
    export function deprecate<T extends Function>(fn: T, message: string, code?: string): T;

    export class TextEncoder {
      encoding: string;
      encode(input?: string): Uint8Array;
      encodeInto(source: string, destination: Uint8Array): { read: number; written: number };
    }

    export class TextDecoder {
      encoding: string;
      constructor(encoding?: string, options?: { fatal?: boolean; ignoreBOM?: boolean });
      decode(input?: BufferSource): string;
    }

    export namespace types {
      export function isPromise(value: any): value is Promise<any>;
      export function isMap(value: any): value is Map<any, any>;
      export function isSet(value: any): value is Set<any>;
      export function isTypedArray(value: any): boolean;
      export function isDate(value: any): value is Date;
      // ... more type checkers
    }
  }

  /**
   * URL module - URL parsing and manipulation
   */
  export namespace url {
    export class URL {
      constructor(url: string, base?: string | URL);
      hash: string;
      host: string;
      hostname: string;
      href: string;
      origin: string;
      password: string;
      pathname: string;
      port: string;
      protocol: string;
      search: string;
      searchParams: URLSearchParams;
      username: string;
      toString(): string;
      toJSON(): string;
    }

    export class URLSearchParams implements Iterable<[string, string]> {
      constructor(init?: string | Record<string, string> | URLSearchParams);
      append(name: string, value: string): void;
      delete(name: string): void;
      get(name: string): string | null;
      getAll(name: string): string[];
      has(name: string): boolean;
      set(name: string, value: string): void;
      sort(): void;
      toString(): string;
      forEach(callback: (value: string, key: string, parent: URLSearchParams) => void): void;
      keys(): IterableIterator<string>;
      values(): IterableIterator<string>;
      entries(): IterableIterator<[string, string]>;
      [Symbol.iterator](): IterableIterator<[string, string]>;
    }

    export interface UrlObject {
      protocol?: string | null;
      slashes?: boolean;
      auth?: string | null;
      host?: string | null;
      port?: string | null;
      hostname?: string | null;
      hash?: string | null;
      search?: string | null;
      query?: string | Record<string, string | string[]> | null;
      pathname?: string | null;
      path?: string | null;
      href?: string;
    }

    export function parse(urlStr: string, parseQueryString?: boolean, slashesDenoteHost?: boolean): UrlObject;
    export function format(urlObject: UrlObject | URL): string;
    export function resolve(from: string, to: string): string;
    export function fileURLToPath(url: string | URL): string;
    export function pathToFileURL(path: string): URL;
  }

  /**
   * QueryString module - Query string parsing
   */
  export namespace querystring {
    export function parse(
      str: string,
      sep?: string,
      eq?: string,
      options?: { decodeURIComponent?: (str: string) => string; maxKeys?: number }
    ): Record<string, string | string[]>;

    export function stringify(
      obj: Record<string, any>,
      sep?: string,
      eq?: string,
      options?: { encodeURIComponent?: (str: string) => string }
    ): string;

    export function escape(str: string): string;
    export function unescape(str: string): string;
    export function decode(str: string): Record<string, string | string[]>;
    export function encode(obj: Record<string, any>): string;
  }

  /**
   * Assert module - Assertion testing
   */
  export namespace assert {
    export class AssertionError extends Error {
      actual: any;
      expected: any;
      operator: string;
      generatedMessage: boolean;
    }

    export function assert(value: any, message?: string | Error): asserts value;
    export function fail(message?: string | Error): never;
    export function ok(value: any, message?: string | Error): asserts value;
    export function equal(actual: any, expected: any, message?: string | Error): void;
    export function notEqual(actual: any, expected: any, message?: string | Error): void;
    export function strictEqual(actual: any, expected: any, message?: string | Error): void;
    export function notStrictEqual(actual: any, expected: any, message?: string | Error): void;
    export function deepStrictEqual(actual: any, expected: any, message?: string | Error): void;
    export function notDeepStrictEqual(actual: any, expected: any, message?: string | Error): void;
    export function throws(fn: () => any, error?: RegExp | Function | Error, message?: string): void;
    export function doesNotThrow(fn: () => any, error?: RegExp | Function, message?: string): void;
    export function rejects(
      asyncFn: (() => Promise<any>) | Promise<any>,
      error?: RegExp | Function | Error,
      message?: string
    ): Promise<void>;
    export function doesNotReject(
      asyncFn: (() => Promise<any>) | Promise<any>,
      error?: RegExp | Function,
      message?: string
    ): Promise<void>;
    export function match(actual: string, expected: RegExp, message?: string | Error): void;
    export function doesNotMatch(actual: string, expected: RegExp, message?: string | Error): void;

    export namespace strict {
      export const equal: typeof strictEqual;
      export const notEqual: typeof notStrictEqual;
      export const deepEqual: typeof deepStrictEqual;
      export const notDeepEqual: typeof notDeepStrictEqual;
    }
  }

  /**
   * Timers module - Timer functions
   */
  export namespace timers {
    export interface Timeout {
      ref(): this;
      unref(): this;
      hasRef(): boolean;
      refresh(): this;
      [Symbol.toPrimitive](): number;
    }

    export function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): Timeout;
    export function clearTimeout(timeout: Timeout | number): void;
    export function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): Timeout;
    export function clearInterval(timeout: Timeout | number): void;
    export function setImmediate(callback: (...args: any[]) => void, ...args: any[]): Timeout;
    export function clearImmediate(immediate: Timeout | number): void;

    export namespace promises {
      export function setTimeout(ms: number, value?: any): Promise<any>;
      export function setImmediate(value?: any): Promise<any>;
      export function setInterval(ms: number, value?: any): AsyncGenerator<any, void, unknown>;
    }
  }

  // ============================================================================
  // Web APIs
  // ============================================================================

  /**
   * WebSocket API
   */
  export namespace websocket {
    export enum ReadyState {
      CONNECTING = 0,
      OPEN = 1,
      CLOSING = 2,
      CLOSED = 3
    }

    export type BinaryType = 'blob' | 'arraybuffer';

    export class CloseEvent extends Event {
      code: number;
      reason: string;
      wasClean: boolean;
    }

    export class MessageEvent extends Event {
      data: any;
      origin: string;
    }

    export class WebSocket extends EventTarget {
      static readonly CONNECTING: 0;
      static readonly OPEN: 1;
      static readonly CLOSING: 2;
      static readonly CLOSED: 3;

      readonly url: string;
      readonly protocol: string;
      readonly extensions: string;
      readyState: ReadyState;
      bufferedAmount: number;
      binaryType: BinaryType;

      onopen: ((this: WebSocket, ev: Event) => any) | null;
      onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
      onerror: ((this: WebSocket, ev: Event) => any) | null;
      onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;

      constructor(url: string | URL, protocols?: string | string[]);
      send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
      close(code?: number, reason?: string): void;
    }
  }

  /**
   * Storage API
   */
  export namespace storage {
    export class Storage {
      readonly length: number;
      getItem(key: string): string | null;
      setItem(key: string, value: string): void;
      removeItem(key: string): void;
      clear(): void;
      key(index: number): string | null;
      hasItem(key: string): boolean;
      keys(): string[];
      values(): string[];
      entries(): [string, string][];
    }

    export class StorageEvent extends Event {
      key: string | null;
      oldValue: string | null;
      newValue: string | null;
      url: string;
      storageArea: Storage | null;
    }

    export class JSONStorage {
      constructor(storage: Storage);
      getItem<T = any>(key: string): T | null;
      setItem(key: string, value: any): void;
      removeItem(key: string): void;
      clear(): void;
      hasItem(key: string): boolean;
    }

    export const localStorage: Storage;
    export const sessionStorage: Storage;
  }

  /**
   * BroadcastChannel API
   */
  export namespace broadcastChannel {
    export class BroadcastChannel extends EventTarget {
      readonly name: string;
      onmessage: ((this: BroadcastChannel, ev: MessageEvent) => any) | null;
      onmessageerror: ((this: BroadcastChannel, ev: MessageEvent) => any) | null;

      constructor(name: string);
      postMessage(message: any): void;
      close(): void;
    }
  }
}

export {};
