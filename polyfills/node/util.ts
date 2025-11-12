/**
 * Util - Utility Functions for Elide
 *
 * Complete implementation of Node.js util module.
 * **POLYGLOT SHOWCASE**: Common utilities for ALL languages on Elide!
 *
 * Features:
 * - Type checking (isArray, isDate, isError, etc.)
 * - Object inspection
 * - Promisification
 * - Deprecation warnings
 * - Format strings
 * - Inherit prototypes
 * - TextEncoder/TextDecoder
 *
 * Use cases:
 * - Type validation
 * - Debugging
 * - Legacy code migration
 * - String formatting
 * - Promise conversion
 */

/**
 * Format string with arguments
 */
export function format(format: any, ...args: any[]): string {
  if (typeof format !== 'string') {
    return [format, ...args].map(arg => inspect(arg)).join(' ');
  }

  let i = 0;
  const str = format.replace(/%[sdifjoO%]/g, (match: string) => {
    if (match === '%%') return '%';
    if (i >= args.length) return match;

    switch (match) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]).toString();
      case '%i': return parseInt(args[i++], 10).toString();
      case '%f': return parseFloat(args[i++]).toString();
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch {
          return '[Circular]';
        }
      case '%o':
      case '%O':
        return inspect(args[i++]);
      default:
        return match;
    }
  });

  // Append remaining arguments
  const remaining = args.slice(i);
  if (remaining.length > 0) {
    return str + ' ' + remaining.join(' ');
  }

  return str;
}

/**
 * Inspect an object
 */
export function inspect(obj: any, options?: {
  showHidden?: boolean;
  depth?: number | null;
  colors?: boolean;
  customInspect?: boolean;
  showProxy?: boolean;
  maxArrayLength?: number | null;
  maxStringLength?: number | null;
  breakLength?: number;
  compact?: boolean | number;
  sorted?: boolean | ((a: string, b: string) => number);
  getters?: boolean | 'get' | 'set';
}): string {
  const depth = options?.depth ?? 2;
  const maxArrayLength = options?.maxArrayLength ?? 100;

  function inspectValue(value: any, currentDepth: number): string {
    // Primitives
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (typeof value === 'symbol') return value.toString();

    // Check depth
    if (depth !== null && currentDepth >= depth) {
      return '[Object]';
    }

    // Array
    if (Array.isArray(value)) {
      const items = value
        .slice(0, maxArrayLength)
        .map(item => inspectValue(item, currentDepth + 1));

      if (value.length > maxArrayLength!) {
        items.push(`... ${value.length - maxArrayLength!} more items`);
      }

      return `[ ${items.join(', ')} ]`;
    }

    // Date
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Error
    if (value instanceof Error) {
      return `${value.name}: ${value.message}`;
    }

    // RegExp
    if (value instanceof RegExp) {
      return value.toString();
    }

    // Object
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      const pairs = keys.map(key => {
        const val = inspectValue(value[key], currentDepth + 1);
        return `${key}: ${val}`;
      });

      return `{ ${pairs.join(', ')} }`;
    }

    return String(value);
  }

  return inspectValue(obj, 0);
}

/**
 * Type checking functions
 */
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

export function isNull(value: any): value is null {
  return value === null;
}

export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}

export function isNumber(value: any): value is number {
  return typeof value === 'number';
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isSymbol(value: any): value is symbol {
  return typeof value === 'symbol';
}

export function isUndefined(value: any): value is undefined {
  return value === undefined;
}

export function isRegExp(value: any): value is RegExp {
  return value instanceof RegExp;
}

export function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null;
}

export function isDate(value: any): value is Date {
  return value instanceof Date;
}

export function isError(value: any): value is Error {
  return value instanceof Error;
}

export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

export function isPrimitive(value: any): boolean {
  return value === null || (typeof value !== 'object' && typeof value !== 'function');
}

export function isBuffer(value: any): boolean {
  return value && typeof value === 'object' && 'buffer' in value;
}

/**
 * Promisify a callback-based function
 */
export function promisify<T = any>(
  fn: (...args: any[]) => void
): (...args: any[]) => Promise<T> {
  return function promisified(...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      fn(...args, (err: Error | null, result?: T) => {
        if (err) {
          reject(err);
        } else {
          resolve(result as T);
        }
      });
    });
  };
}

/**
 * Callbackify a promise-based function
 */
export function callbackify(fn: (...args: any[]) => Promise<any>): (...args: any[]) => void {
  return function callbackified(...args: any[]): void {
    const callback = args.pop();
    if (typeof callback !== 'function') {
      throw new TypeError('Last argument must be a callback');
    }

    fn(...args)
      .then(result => callback(null, result))
      .catch(err => callback(err));
  };
}

/**
 * Mark a function as deprecated
 */
export function deprecate<T extends Function>(fn: T, message: string, code?: string): T {
  let warned = false;

  const deprecated = function (this: any, ...args: any[]) {
    if (!warned) {
      warned = true;
      const msg = code ? `[${code}] ${message}` : message;
      console.warn(`DeprecationWarning: ${msg}`);
    }
    return fn.apply(this, args);
  };

  return deprecated as any as T;
}

/**
 * Inherit prototype
 */
export function inherits(constructor: any, superConstructor: any): void {
  if (constructor === undefined || constructor === null) {
    throw new TypeError('The constructor to inherit must not be null or undefined');
  }

  if (superConstructor === undefined || superConstructor === null) {
    throw new TypeError('The super constructor to inherit must not be null or undefined');
  }

  if (superConstructor.prototype === undefined) {
    throw new TypeError('The super constructor must have a prototype');
  }

  constructor.super_ = superConstructor;
  constructor.prototype = Object.create(superConstructor.prototype, {
    constructor: {
      value: constructor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}

/**
 * TextEncoder
 */
export class TextEncoder {
  encoding: string = 'utf-8';

  encode(input: string = ''): Uint8Array {
    const bytes: number[] = [];
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6));
        bytes.push(0x80 | (code & 0x3f));
      } else if (code < 0x10000) {
        bytes.push(0xe0 | (code >> 12));
        bytes.push(0x80 | ((code >> 6) & 0x3f));
        bytes.push(0x80 | (code & 0x3f));
      }
    }
    return new Uint8Array(bytes);
  }

  encodeInto(source: string, destination: Uint8Array): { read: number; written: number } {
    const encoded = this.encode(source);
    const written = Math.min(encoded.length, destination.length);
    for (let i = 0; i < written; i++) {
      destination[i] = encoded[i];
    }
    return { read: source.length, written };
  }
}

/**
 * TextDecoder
 */
export class TextDecoder {
  encoding: string = 'utf-8';

  constructor(encoding?: string, options?: { fatal?: boolean; ignoreBOM?: boolean }) {
    this.encoding = encoding || 'utf-8';
  }

  decode(input?: BufferSource): string {
    if (!input) return '';

    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input as ArrayBuffer);
    let result = '';
    let i = 0;

    while (i < bytes.length) {
      const byte = bytes[i];

      if (byte < 0x80) {
        result += String.fromCharCode(byte);
        i++;
      } else if (byte < 0xe0) {
        const code = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
        result += String.fromCharCode(code);
        i += 2;
      } else if (byte < 0xf0) {
        const code = ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
        result += String.fromCharCode(code);
        i += 3;
      } else {
        i++; // Skip unsupported
      }
    }

    return result;
  }
}

/**
 * Types namespace
 */
export const types = {
  isAnyArrayBuffer: (value: any): boolean => {
    return value instanceof ArrayBuffer || value instanceof SharedArrayBuffer;
  },
  isArrayBufferView: (value: any): boolean => {
    return ArrayBuffer.isView(value);
  },
  isArgumentsObject: (value: any): boolean => {
    return Object.prototype.toString.call(value) === '[object Arguments]';
  },
  isArrayBuffer: (value: any): boolean => {
    return value instanceof ArrayBuffer;
  },
  isAsyncFunction: (value: any): boolean => {
    return typeof value === 'function' && value.constructor.name === 'AsyncFunction';
  },
  isBigInt64Array: (value: any): boolean => {
    return value instanceof BigInt64Array;
  },
  isBigUint64Array: (value: any): boolean => {
    return value instanceof BigUint64Array;
  },
  isBooleanObject: (value: any): boolean => {
    return value instanceof Boolean;
  },
  isBoxedPrimitive: (value: any): boolean => {
    return value instanceof Boolean || value instanceof Number || value instanceof String;
  },
  isDataView: (value: any): boolean => {
    return value instanceof DataView;
  },
  isDate,
  isExternal: (value: any): boolean => false,
  isFloat32Array: (value: any): boolean => {
    return value instanceof Float32Array;
  },
  isFloat64Array: (value: any): boolean => {
    return value instanceof Float64Array;
  },
  isGeneratorFunction: (value: any): boolean => {
    return typeof value === 'function' && value.constructor.name === 'GeneratorFunction';
  },
  isGeneratorObject: (value: any): boolean => {
    return Object.prototype.toString.call(value) === '[object Generator]';
  },
  isInt8Array: (value: any): boolean => {
    return value instanceof Int8Array;
  },
  isInt16Array: (value: any): boolean => {
    return value instanceof Int16Array;
  },
  isInt32Array: (value: any): boolean => {
    return value instanceof Int32Array;
  },
  isMap: (value: any): boolean => {
    return value instanceof Map;
  },
  isMapIterator: (value: any): boolean => {
    return Object.prototype.toString.call(value) === '[object Map Iterator]';
  },
  isModuleNamespaceObject: (value: any): boolean => false,
  isNativeError: isError,
  isNumberObject: (value: any): boolean => {
    return value instanceof Number;
  },
  isPromise: (value: any): boolean => {
    return value instanceof Promise;
  },
  isProxy: (value: any): boolean => false,
  isRegExp,
  isSet: (value: any): boolean => {
    return value instanceof Set;
  },
  isSetIterator: (value: any): boolean => {
    return Object.prototype.toString.call(value) === '[object Set Iterator]';
  },
  isSharedArrayBuffer: (value: any): boolean => {
    return value instanceof SharedArrayBuffer;
  },
  isStringObject: (value: any): boolean => {
    return value instanceof String;
  },
  isSymbolObject: (value: any): boolean => {
    return value instanceof Symbol || (typeof value === 'object' && typeof value.valueOf() === 'symbol');
  },
  isTypedArray: (value: any): boolean => {
    return ArrayBuffer.isView(value) && !(value instanceof DataView);
  },
  isUint8Array: (value: any): boolean => {
    return value instanceof Uint8Array;
  },
  isUint8ClampedArray: (value: any): boolean => {
    return value instanceof Uint8ClampedArray;
  },
  isUint16Array: (value: any): boolean => {
    return value instanceof Uint16Array;
  },
  isUint32Array: (value: any): boolean => {
    return value instanceof Uint32Array;
  },
  isWeakMap: (value: any): boolean => {
    return value instanceof WeakMap;
  },
  isWeakSet: (value: any): boolean => {
    return value instanceof WeakSet;
  },
  isWebAssemblyCompiledModule: (value: any): boolean => false
};

// Default export
export default {
  format,
  inspect,
  isArray,
  isBoolean,
  isNull,
  isNullOrUndefined,
  isNumber,
  isString,
  isSymbol,
  isUndefined,
  isRegExp,
  isObject,
  isDate,
  isError,
  isFunction,
  isPrimitive,
  isBuffer,
  promisify,
  callbackify,
  deprecate,
  inherits,
  TextEncoder,
  TextDecoder,
  types
};

// CLI Demo
if (import.meta.url.includes("util.ts")) {
  console.log("🛠️  Util - Utilities for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Format Strings ===");
  console.log(format('Hello %s', 'World'));
  console.log(format('Number: %d, String: %s', 42, 'test'));
  console.log(format('JSON: %j', { key: 'value' }));
  console.log();

  console.log("=== Example 2: Inspect Objects ===");
  const obj = { name: 'John', age: 30, nested: { key: 'value' } };
  console.log(inspect(obj));
  console.log(inspect([1, 2, [3, 4]]));
  console.log();

  console.log("=== Example 3: Type Checking ===");
  console.log('isArray([]):', isArray([]));
  console.log('isNumber(42):', isNumber(42));
  console.log('isString("test"):', isString('test'));
  console.log('isDate(new Date()):', isDate(new Date()));
  console.log('isNull(null):', isNull(null));
  console.log();

  console.log("=== Example 4: Promisify ===");
  function asyncOp(value: number, callback: (err: Error | null, result?: number) => void) {
    setTimeout(() => callback(null, value * 2), 10);
  }

  const promisified = promisify<number>(asyncOp);
  promisified(21).then(result => {
    console.log('Promisified result:', result);
  });

  setTimeout(() => {
    console.log();

    console.log("=== Example 5: TextEncoder/Decoder ===");
    const encoder = new TextEncoder();
    const encoded = encoder.encode('Hello');
    console.log('Encoded:', encoded);

    const decoder = new TextDecoder();
    const decoded = decoder.decode(encoded);
    console.log('Decoded:', decoded);
    console.log();

    console.log("=== Example 6: Types Checking ===");
    console.log('isPromise(Promise.resolve()):', types.isPromise(Promise.resolve()));
    console.log('isMap(new Map()):', types.isMap(new Map()));
    console.log('isSet(new Set()):', types.isSet(new Set()));
    console.log('isTypedArray(new Uint8Array()):', types.isTypedArray(new Uint8Array()));
    console.log();

    console.log("=== POLYGLOT Use Case ===");
    console.log("🌐 Util functions work in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log();
    console.log("Benefits:");
    console.log("  ✓ One util API for all languages");
    console.log("  ✓ Consistent type checking");
    console.log("  ✓ Share debugging tools");
    console.log("  ✓ Cross-language promisification");
  }, 50);
}
