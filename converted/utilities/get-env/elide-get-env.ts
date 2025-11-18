/**
 * Get-Env - Get Environment Name
 *
 * Core features:
 * - Environment detection
 * - Custom environments
 * - Fallback support
 * - Simple API
 * - Type safety
 * - Aliases support
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 1M+ downloads/week
 */

type Environment = 'development' | 'production' | 'test' | 'staging' | string;

interface GetEnvOptions {
  nodeEnv?: string;
  default?: Environment;
}

export function getEnv(options: GetEnvOptions = {}): Environment {
  const nodeEnv = options.nodeEnv || process.env.NODE_ENV;

  if (!nodeEnv) {
    return options.default || 'development';
  }

  return nodeEnv.toLowerCase().trim();
}

export function isDevelopment(env?: string): boolean {
  const current = env || getEnv();
  return current === 'development' || current === 'dev';
}

export function isProduction(env?: string): boolean {
  const current = env || getEnv();
  return current === 'production' || current === 'prod';
}

export function isTest(env?: string): boolean {
  const current = env || getEnv();
  return current === 'test' || current === 'testing';
}

export function isStaging(env?: string): boolean {
  const current = env || getEnv();
  return current === 'staging' || current === 'stage';
}

export class Env {
  private env: Environment;

  constructor(env?: string) {
    this.env = env || getEnv();
  }

  is(environment: Environment): boolean {
    return this.env === environment;
  }

  isDevelopment(): boolean {
    return isDevelopment(this.env);
  }

  isProduction(): boolean {
    return isProduction(this.env);
  }

  isTest(): boolean {
    return isTest(this.env);
  }

  isStaging(): boolean {
    return isStaging(this.env);
  }

  toString(): string {
    return this.env;
  }
}

if (import.meta.url.includes("get-env")) {
  console.log("🎯 Get-Env for Elide - Get Environment Name\n");

  console.log("=== Get Current Environment ===");
  process.env.NODE_ENV = 'production';
  const env = getEnv();
  console.log("Current environment:", env);

  console.log("\n=== Environment Checks ===");
  console.log("Is production?", isProduction());
  console.log("Is development?", isDevelopment());
  console.log("Is test?", isTest());

  console.log("\n=== Env Class ===");
  const envObj = new Env('staging');
  console.log("Environment:", envObj.toString());
  console.log("Is staging?", envObj.isStaging());
  console.log("Is production?", envObj.isProduction());

  console.log("\n=== With Default ===");
  delete process.env.NODE_ENV;
  const defaultEnv = getEnv({ default: 'development' });
  console.log("Default environment:", defaultEnv);

  console.log();
  console.log("✅ Use Cases: Environment detection, Config switching, Feature flags");
  console.log("🚀 1M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default getEnv;
