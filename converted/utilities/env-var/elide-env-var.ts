/**
 * Env-Var - Environment Variable Parser
 *
 * Core features:
 * - Type conversion
 * - Required checks
 * - Default values
 * - Custom validators
 * - Array support
 * - Fluent API
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 1M+ downloads/week
 */

class EnvVarAccessor {
  constructor(
    private varName: string,
    private value: string | undefined
  ) {}

  required(): EnvVarAccessor {
    if (this.value === undefined) {
      throw new Error(`Environment variable ${this.varName} is required but not set`);
    }
    return this;
  }

  default(defaultValue: string): EnvVarAccessor {
    if (this.value === undefined) {
      this.value = defaultValue;
    }
    return this;
  }

  asString(): string {
    return this.value || '';
  }

  asInt(): number {
    const parsed = parseInt(this.value || '', 10);
    if (isNaN(parsed)) {
      throw new Error(`${this.varName} must be a valid integer`);
    }
    return parsed;
  }

  asFloat(): number {
    const parsed = parseFloat(this.value || '');
    if (isNaN(parsed)) {
      throw new Error(`${this.varName} must be a valid float`);
    }
    return parsed;
  }

  asBool(): boolean {
    const val = (this.value || '').toLowerCase();
    if (val === 'true' || val === '1' || val === 'yes') return true;
    if (val === 'false' || val === '0' || val === 'no') return false;
    throw new Error(`${this.varName} must be a boolean value`);
  }

  asBoolStrict(): boolean {
    const val = this.value;
    if (val === 'true') return true;
    if (val === 'false') return false;
    throw new Error(`${this.varName} must be "true" or "false"`);
  }

  asJson<T = any>(): T {
    try {
      return JSON.parse(this.value || '');
    } catch (error) {
      throw new Error(`${this.varName} must be valid JSON`);
    }
  }

  asArray(delimiter = ','): string[] {
    if (!this.value) return [];
    return this.value.split(delimiter).map(s => s.trim());
  }

  asEnum<T extends string>(validValues: T[]): T {
    if (!this.value || !validValues.includes(this.value as T)) {
      throw new Error(
        `${this.varName} must be one of: ${validValues.join(', ')}`
      );
    }
    return this.value as T;
  }

  asUrlString(): string {
    try {
      new URL(this.value || '');
      return this.value!;
    } catch {
      throw new Error(`${this.varName} must be a valid URL`);
    }
  }

  asPortNumber(): number {
    const port = this.asInt();
    if (port < 0 || port > 65535) {
      throw new Error(`${this.varName} must be a valid port (0-65535)`);
    }
    return port;
  }
}

export function get(varName: string): EnvVarAccessor {
  return new EnvVarAccessor(varName, process.env[varName]);
}

export function from(env: Record<string, string | undefined>) {
  return {
    get(varName: string): EnvVarAccessor {
      return new EnvVarAccessor(varName, env[varName]);
    },
  };
}

if (import.meta.url.includes("env-var")) {
  console.log("🎯 Env-Var for Elide - Environment Variable Parser\n");

  // Set up test environment
  process.env.PORT = '3000';
  process.env.DEBUG = 'true';
  process.env.API_KEYS = 'key1,key2,key3';
  process.env.DATABASE_URL = 'https://db.example.com';

  console.log("=== String Values ===");
  const port = get('PORT').required().asInt();
  console.log("Port:", port);

  console.log("\n=== Boolean Values ===");
  const debug = get('DEBUG').asBool();
  console.log("Debug:", debug);

  console.log("\n=== Array Values ===");
  const apiKeys = get('API_KEYS').asArray(',');
  console.log("API Keys:", apiKeys);

  console.log("\n=== URL Validation ===");
  const dbUrl = get('DATABASE_URL').asUrlString();
  console.log("DB URL:", dbUrl);

  console.log("\n=== With Defaults ===");
  const maxRetries = get('MAX_RETRIES').default('3').asInt();
  console.log("Max Retries:", maxRetries);

  console.log();
  console.log("✅ Use Cases: Config parsing, Type conversion, Env validation");
  console.log("🚀 1M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default { get, from };
