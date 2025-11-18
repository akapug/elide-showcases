/**
 * JSEsc - JavaScript String Escaping
 *
 * Core features:
 * - Escape special characters
 * - Unicode escaping
 * - JSON-compatible output
 * - HTML-safe escaping
 * - Compact/pretty modes
 * - Multiple formats
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 80M+ downloads/week
 */

interface JsescOptions {
  quotes?: 'single' | 'double' | 'backtick';
  wrap?: boolean;
  es6?: boolean;
  json?: boolean;
  compact?: boolean;
  lowercaseHex?: boolean;
  numbers?: 'binary' | 'octal' | 'decimal' | 'hexadecimal';
  indent?: string;
  isScriptContext?: boolean;
  minimal?: boolean;
}

const regexSingleEscape = /[\0\b\t\n\f\r\v"'\\]/;
const regexExtraEscape = /[\x00-\x1F\x7F-\x9F\uFEFF]/;
const regexWhitelist = /[ !#-&\(-\[\]-~]/;

const singleEscapes: Record<string, string> = {
  '\0': '\\0',
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\f': '\\f',
  '\r': '\\r',
  '\v': '\\v',
  '"': '\\"',
  "'": "\\'",
  '\\': '\\\\'
};

function escapeChar(char: string, options: JsescOptions): string {
  const charCode = char.charCodeAt(0);

  // Check for single escape sequences
  if (singleEscapes[char]) {
    return singleEscapes[char];
  }

  // For minimal mode, only escape necessary characters
  if (options.minimal && regexWhitelist.test(char)) {
    return char;
  }

  // Unicode escape
  if (charCode < 0x100) {
    const hex = charCode.toString(16);
    const prefix = options.lowercaseHex ? '\\x' : '\\x';
    return prefix + ('00' + hex).slice(-2);
  }

  if (options.es6) {
    const hex = charCode.toString(16);
    return '\\u{' + hex + '}';
  }

  const hex = charCode.toString(16);
  return '\\u' + ('0000' + hex).slice(-4);
}

export function jsesc(value: any, options: JsescOptions = {}): string {
  const quotes = options.quotes ?? 'single';
  const wrap = options.wrap ?? true;
  const es6 = options.es6 ?? false;
  const json = options.json ?? false;
  const compact = options.compact ?? true;
  const lowercaseHex = options.lowercaseHex ?? false;
  const minimal = options.minimal ?? false;
  const isScriptContext = options.isScriptContext ?? false;

  const opts: JsescOptions = {
    quotes,
    wrap,
    es6,
    json,
    compact,
    lowercaseHex,
    minimal,
    isScriptContext
  };

  if (json) {
    opts.quotes = 'double';
    opts.wrap = true;
  }

  const escapeString = (str: string): string => {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      // Handle quote character
      if (char === quotes && wrap) {
        result += '\\' + char;
        continue;
      }

      // Handle script context escaping
      if (isScriptContext && (char === '<' || char === '>')) {
        result += '\\' + char;
        continue;
      }

      // Check if character needs escaping
      if (regexSingleEscape.test(char) || (!minimal && regexExtraEscape.test(char))) {
        result += escapeChar(char, opts);
      } else {
        result += char;
      }
    }
    return result;
  };

  const serializeValue = (val: any, depth: number = 0): string => {
    if (val === null) {
      return 'null';
    }

    if (val === undefined) {
      return json ? undefined as any : 'undefined';
    }

    if (typeof val === 'boolean') {
      return String(val);
    }

    if (typeof val === 'number') {
      if (json || options.numbers === 'decimal') {
        return String(val);
      }

      switch (options.numbers) {
        case 'binary':
          return '0b' + val.toString(2);
        case 'octal':
          return '0o' + val.toString(8);
        case 'hexadecimal':
          return '0x' + val.toString(16);
        default:
          return String(val);
      }
    }

    if (typeof val === 'string') {
      const escaped = escapeString(val);
      const quote = quotes === 'single' ? "'" : quotes === 'double' ? '"' : '`';
      return wrap ? quote + escaped + quote : escaped;
    }

    if (Array.isArray(val)) {
      const items = val.map(item => serializeValue(item, depth + 1));
      return compact
        ? '[' + items.join(',') + ']'
        : '[\n' + items.map(i => '  '.repeat(depth + 1) + i).join(',\n') + '\n' + '  '.repeat(depth) + ']';
    }

    if (typeof val === 'object') {
      const pairs = Object.keys(val).map(key => {
        const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
          ? key
          : serializeValue(key, depth + 1);
        const valStr = serializeValue(val[key], depth + 1);
        return `${keyStr}:${compact ? '' : ' '}${valStr}`;
      });

      return compact
        ? '{' + pairs.join(',') + '}'
        : '{\n' + pairs.map(p => '  '.repeat(depth + 1) + p).join(',\n') + '\n' + '  '.repeat(depth) + '}';
    }

    return String(val);
  };

  return serializeValue(value);
}

if (import.meta.url.includes("jsesc")) {
  console.log("🎯 JSEsc for Elide - JavaScript String Escaping\n");

  const text = 'Hello "World"\nWith unicode: \u2665 and emoji: 😀';
  console.log("Original:", text);

  const escaped = jsesc(text);
  console.log("Escaped (single quotes):", escaped);

  const doubleQuotes = jsesc(text, { quotes: 'double' });
  console.log("Escaped (double quotes):", doubleQuotes);

  const es6Unicode = jsesc(text, { es6: true });
  console.log("ES6 unicode:", es6Unicode);

  const minimal = jsesc(text, { minimal: true });
  console.log("Minimal:", minimal);

  const obj = {
    name: 'Elide',
    special: '<script>alert("xss")</script>',
    unicode: '\u2665'
  };

  const objEscaped = jsesc(obj, { isScriptContext: true, compact: false });
  console.log("\nObject escaped:\n", objEscaped);

  console.log("\n✅ Use Cases: Code generation, Template strings, XSS prevention");
  console.log("🚀 80M+ npm downloads/week - Polyglot-ready");
}

export default jsesc;
