/**
 * Minimist for Elide
 *
 * A fast, minimalist argument parser for command-line applications.
 * This implementation provides full API compatibility with the original minimist
 * while leveraging Elide's instant startup and native performance.
 *
 * @module @elide/minimist
 */

/**
 * Parsed arguments object
 */
export interface ParsedArgs {
  _: (string | number)[];
  '--'?: string[];
  [key: string]: any;
}

/**
 * Options for argument parsing
 */
export interface MinimistOptions {
  /**
   * A string or array of strings argument names to always treat as strings
   */
  string?: string | string[];

  /**
   * A string or array of strings to always treat as booleans
   */
  boolean?: string | string[];

  /**
   * An object mapping string names to strings or arrays of string argument names
   * to use as aliases
   */
  alias?: Record<string, string | string[]>;

  /**
   * An object mapping string argument names to default values
   */
  default?: Record<string, any>;

  /**
   * When true, populate argv._ with everything before the -- and argv['--'] with everything after the --
   */
  '--'?: boolean;

  /**
   * A function which is invoked with a command line parameter not defined in the opts configuration object.
   * If the function returns false, the unknown option is not added to argv
   */
  unknown?: (arg: string) => boolean | void;

  /**
   * When true, populate argv._ with everything after the first non-option
   */
  stopEarly?: boolean;
}

/**
 * Check if a value looks like a number
 */
function isNumber(x: any): boolean {
  if (typeof x === 'number') return true;
  if (/^0x[0-9a-f]+$/i.test(x)) return true;
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
}

/**
 * Convert string to appropriate type
 */
function toNumber(x: string): number | string {
  if (!isNumber(x)) return x;
  const num = Number(x);
  return isNaN(num) ? x : num;
}

/**
 * Normalize options
 */
function normalizeOptions(opts: MinimistOptions = {}): {
  strings: Set<string>;
  booleans: Set<string>;
  aliases: Map<string, Set<string>>;
  defaults: Map<string, any>;
  allBools: boolean;
  unknown?: (arg: string) => boolean | void;
  stopEarly: boolean;
  doubleDash: boolean;
} {
  const strings = new Set<string>();
  const booleans = new Set<string>();
  const aliases = new Map<string, Set<string>>();
  const defaults = new Map<string, any>();

  // Process string options
  if (opts.string) {
    const stringOpts = Array.isArray(opts.string) ? opts.string : [opts.string];
    stringOpts.forEach(s => strings.add(s));
  }

  // Process boolean options
  if (opts.boolean) {
    const boolOpts = Array.isArray(opts.boolean) ? opts.boolean : [opts.boolean];
    boolOpts.forEach(b => booleans.add(b));
  }

  // Process aliases
  if (opts.alias) {
    Object.entries(opts.alias).forEach(([key, value]) => {
      const values = Array.isArray(value) ? value : [value];
      const aliasSet = new Set([key, ...values]);

      // Create bidirectional aliases
      aliasSet.forEach(alias => {
        aliases.set(alias, aliasSet);
      });
    });
  }

  // Process defaults
  if (opts.default) {
    Object.entries(opts.default).forEach(([key, value]) => {
      defaults.set(key, value);
    });
  }

  return {
    strings,
    booleans,
    aliases,
    defaults,
    allBools: false,
    unknown: opts.unknown,
    stopEarly: opts.stopEarly || false,
    doubleDash: opts['--'] || false
  };
}

/**
 * Set a value on the argv object, handling aliases
 */
function setArg(
  argv: ParsedArgs,
  key: string,
  value: any,
  aliases: Map<string, Set<string>>
): void {
  // Set the main key
  if (argv[key] === undefined) {
    argv[key] = value;
  } else if (Array.isArray(argv[key])) {
    argv[key].push(value);
  } else {
    argv[key] = [argv[key], value];
  }

  // Set all aliases
  const aliasSet = aliases.get(key);
  if (aliasSet) {
    aliasSet.forEach(alias => {
      if (alias !== key) {
        if (argv[alias] === undefined) {
          argv[alias] = value;
        } else if (Array.isArray(argv[alias])) {
          argv[alias].push(value);
        } else {
          argv[alias] = [argv[alias], value];
        }
      }
    });
  }
}

/**
 * Get the canonical key name (handling aliases)
 */
function getKey(key: string, aliases: Map<string, Set<string>>): string {
  const aliasSet = aliases.get(key);
  if (aliasSet) {
    // Return the first alias (canonical name)
    return Array.from(aliasSet)[0];
  }
  return key;
}

/**
 * Check if a key should be treated as a string
 */
function isString(key: string, strings: Set<string>, aliases: Map<string, Set<string>>): boolean {
  if (strings.has(key)) return true;
  const aliasSet = aliases.get(key);
  if (aliasSet) {
    return Array.from(aliasSet).some(alias => strings.has(alias));
  }
  return false;
}

/**
 * Check if a key should be treated as a boolean
 */
function isBoolean(key: string, booleans: Set<string>, aliases: Map<string, Set<string>>): boolean {
  if (booleans.has(key)) return true;
  const aliasSet = aliases.get(key);
  if (aliasSet) {
    return Array.from(aliasSet).some(alias => booleans.has(alias));
  }
  return false;
}

/**
 * Parse command-line arguments
 *
 * @param args - Array of argument strings (typically process.argv.slice(2))
 * @param opts - Parsing options
 * @returns Parsed arguments object
 */
export default function minimist(
  args: string[] = [],
  opts: MinimistOptions = {}
): ParsedArgs {
  const options = normalizeOptions(opts);
  const argv: ParsedArgs = { _: [] };
  const notFlags: (string | number)[] = [];

  // Set default values
  options.defaults.forEach((value, key) => {
    setArg(argv, key, value, options.aliases);
  });

  let i = 0;
  let broken = false;

  while (i < args.length) {
    const arg = args[i];

    // Handle stop-early
    if (options.stopEarly && !arg.startsWith('-')) {
      argv._ = argv._.concat(args.slice(i));
      break;
    }

    // Handle double dash
    if (arg === '--') {
      broken = true;
      if (options.doubleDash) {
        argv['--'] = args.slice(i + 1);
      } else {
        notFlags.push(...args.slice(i + 1));
      }
      break;
    }

    // Handle long flags (--flag or --flag=value)
    if (arg.startsWith('--')) {
      const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
      if (match) {
        let [, key, value] = match;

        // Handle negation (--no-flag)
        let negated = false;
        if (key.startsWith('no-')) {
          negated = true;
          key = key.slice(3);
        }

        // Check if unknown
        if (options.unknown && !options.strings.has(key) && !options.booleans.has(key) && !options.aliases.has(key)) {
          if (options.unknown('--' + key) === false) {
            i++;
            continue;
          }
        }

        const canonicalKey = getKey(key, options.aliases);

        if (value !== undefined) {
          // --flag=value
          const finalValue = isString(canonicalKey, options.strings, options.aliases)
            ? value
            : toNumber(value);
          setArg(argv, canonicalKey, finalValue, options.aliases);
        } else if (negated) {
          // --no-flag
          setArg(argv, canonicalKey, false, options.aliases);
        } else if (isBoolean(canonicalKey, options.booleans, options.aliases)) {
          // --flag (boolean)
          setArg(argv, canonicalKey, true, options.aliases);
        } else {
          // --flag value (check next arg)
          const next = args[i + 1];
          if (next !== undefined && !next.startsWith('-')) {
            const finalValue = isString(canonicalKey, options.strings, options.aliases)
              ? next
              : toNumber(next);
            setArg(argv, canonicalKey, finalValue, options.aliases);
            i++;
          } else {
            // No value provided, treat as boolean
            setArg(argv, canonicalKey, true, options.aliases);
          }
        }
      }
      i++;
      continue;
    }

    // Handle short flags (-f or -abc or -x=value)
    if (arg.startsWith('-') && arg.length > 1 && arg !== '-') {
      const letters = arg.slice(1);

      // Check for -x=value format
      const equalIndex = letters.indexOf('=');
      if (equalIndex !== -1) {
        const key = letters.slice(0, equalIndex);
        const value = letters.slice(equalIndex + 1);
        const canonicalKey = getKey(key, options.aliases);

        if (options.unknown && !options.strings.has(key) && !options.booleans.has(key) && !options.aliases.has(key)) {
          if (options.unknown('-' + key) === false) {
            i++;
            continue;
          }
        }

        const finalValue = isString(canonicalKey, options.strings, options.aliases)
          ? value
          : toNumber(value);
        setArg(argv, canonicalKey, finalValue, options.aliases);
        i++;
        continue;
      }

      // Handle -abc as -a -b -c or -x value
      for (let j = 0; j < letters.length; j++) {
        const letter = letters[j];
        const canonicalKey = getKey(letter, options.aliases);

        if (options.unknown && !options.strings.has(letter) && !options.booleans.has(letter) && !options.aliases.has(letter)) {
          if (options.unknown('-' + letter) === false) {
            continue;
          }
        }

        if (j === letters.length - 1) {
          // Last letter, check if next arg is a value
          const next = args[i + 1];
          if (
            next !== undefined &&
            !next.startsWith('-') &&
            !isBoolean(canonicalKey, options.booleans, options.aliases)
          ) {
            const finalValue = isString(canonicalKey, options.strings, options.aliases)
              ? next
              : toNumber(next);
            setArg(argv, canonicalKey, finalValue, options.aliases);
            i++;
          } else {
            // Treat as boolean
            setArg(argv, canonicalKey, true, options.aliases);
          }
        } else {
          // Middle letter, treat as boolean
          setArg(argv, canonicalKey, true, options.aliases);
        }
      }
      i++;
      continue;
    }

    // Not a flag, add to positional args
    notFlags.push(toNumber(arg));
    i++;
  }

  // Add positional arguments
  argv._ = notFlags;

  return argv;
}

// Named export for compatibility
export { minimist };

/**
 * Parse a single argument string
 * Useful for parsing argument strings from configuration files
 */
export function parseArgString(argString: string, opts?: MinimistOptions): ParsedArgs {
  // Simple split by spaces, respecting quotes
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < argString.length; i++) {
    const char = argString[i];

    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuote) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  return minimist(args, opts);
}
