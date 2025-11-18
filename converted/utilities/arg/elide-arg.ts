/**
 * Arg - Command Line Argument Parser
 *
 * Core features:
 * - Type-safe parsing
 * - Handler functions
 * - Alias support
 * - Default values
 * - Strict validation
 * - Unknown flag detection
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 40M+ downloads/week
 */

type ArgHandler = (value: string, name: string, prev: any) => any;

interface ArgSpec {
  [key: string]: ArgHandler | string | [ArgHandler];
}

interface ArgOptions {
  permissive?: boolean;
  argv?: string[];
  stopAtPositional?: boolean;
}

interface ArgResult {
  _: string[];
  [key: string]: any;
}

// Built-in handlers
function string(value: string): string {
  return value;
}

function number(value: string): number {
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`Not a number: ${value}`);
  }
  return parsed;
}

function flag(value: string, name: string, prev: boolean | undefined): boolean {
  if (prev === false) {
    throw new Error(`Flag ${name} is already set to false`);
  }
  return true;
}

function count(value: string, name: string, prev: number = 0): number {
  return prev + 1;
}

export function arg<T extends ArgSpec>(
  spec: T,
  options: ArgOptions = {}
): ArgResult {
  const result: ArgResult = { _: [] };
  const argv = options.argv || process.argv.slice(2);
  const aliases: Record<string, string> = {};

  // Build aliases map
  for (const [key, value] of Object.entries(spec)) {
    if (typeof value === 'string') {
      aliases[value] = key;
    } else if (Array.isArray(value)) {
      // Handle array form [handler, alias]
      // Not implemented in this minimal version
    }
  }

  // Parse arguments
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (options.stopAtPositional && !arg.startsWith('-')) {
      result._.push(...argv.slice(i));
      break;
    }

    if (arg === '--') {
      result._.push(...argv.slice(i + 1));
      break;
    }

    if (arg.startsWith('--')) {
      const [rawKey, ...rawValueParts] = arg.substring(2).split('=');
      const key = rawKey;
      const handler = spec[key];

      if (!handler && !options.permissive) {
        throw new Error(`Unknown flag: --${key}`);
      }

      if (typeof handler === 'function') {
        const hasValue = rawValueParts.length > 0;
        const value = hasValue ? rawValueParts.join('=') : argv[i + 1];

        if (!hasValue && (!value || value.startsWith('-'))) {
          // No value provided, treat as flag
          result[key] = handler('', key, result[key]);
        } else {
          if (!hasValue) i++; // Skip next arg as it's the value
          result[key] = handler(value, key, result[key]);
        }
      } else if (typeof handler === 'string') {
        // Alias
        const aliasedKey = handler;
        const aliasedHandler = spec[aliasedKey];
        if (typeof aliasedHandler === 'function') {
          const value = rawValueParts.length > 0 ? rawValueParts.join('=') : argv[++i];
          result[aliasedKey] = aliasedHandler(value, aliasedKey, result[aliasedKey]);
        }
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      // Short flags
      const flags = arg.substring(1).split('');
      for (const f of flags) {
        const fullKey = aliases[f];
        if (fullKey) {
          const handler = spec[fullKey];
          if (typeof handler === 'function') {
            result[fullKey] = handler('', fullKey, result[fullKey]);
          }
        } else if (!options.permissive) {
          throw new Error(`Unknown flag: -${f}`);
        }
      }
    } else {
      result._.push(arg);
    }
  }

  return result;
}

// Export handlers
arg.flag = flag;
arg.COUNT = count;

if (import.meta.url.includes("arg")) {
  console.log("🎯 Arg for Elide - Command Line Argument Parser\n");

  console.log("=== Basic Parsing ===");
  const args1 = arg({
    '--port': Number,
    '--verbose': Boolean,
    '--name': String,
  }, {
    argv: ['--port', '3000', '--verbose', '--name', 'myapp'],
  });
  console.log("Parsed:", args1);

  console.log("\n=== With Aliases ===");
  const args2 = arg({
    '--port': Number,
    '-p': '--port',
    '--verbose': arg.flag,
    '-v': '--verbose',
  }, {
    argv: ['-p', '8080', '-v'],
  });
  console.log("Parsed:", args2);

  console.log("\n=== Positional Args ===");
  const args3 = arg({
    '--watch': arg.flag,
  }, {
    argv: ['build', 'src', '--watch', 'dest'],
  });
  console.log("Parsed:", args3);

  console.log();
  console.log("✅ Use Cases: CLI parsing, Type-safe args, Strict validation");
  console.log("🚀 40M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default arg;
