/**
 * cross-env - Cross-Platform Environment Variable Setting
 *
 * Set environment variables across all platforms (Windows, Linux, macOS).
 * **POLYGLOT SHOWCASE**: One env tool for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/cross-env (~5M+ downloads/week)
 *
 * Features:
 * - Cross-platform environment variable setting
 * - Works on Windows, Linux, macOS
 * - No platform-specific syntax needed
 * - Simple API
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need env vars
 * - ONE implementation works everywhere on Elide
 * - No OS-specific scripts needed
 * - Share scripts across your stack
 *
 * Use cases:
 * - npm scripts that work everywhere
 * - CI/CD pipelines (cross-platform)
 * - Development environments
 * - Testing with different environments
 *
 * Package has ~5M+ downloads/week on npm!
 */

export interface EnvVars {
  [key: string]: string;
}

export function setEnv(vars: EnvVars): void {
  for (const [key, value] of Object.entries(vars)) {
    process.env[key] = value;
  }
}

export function runWithEnv(vars: EnvVars, fn: () => void): void {
  const original: Record<string, string | undefined> = {};
  
  // Save original values
  for (const key of Object.keys(vars)) {
    original[key] = process.env[key];
  }
  
  // Set new values
  setEnv(vars);
  
  try {
    fn();
  } finally {
    // Restore original values
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

export function crossEnv(vars: EnvVars): void {
  setEnv(vars);
}

export default { setEnv, runWithEnv, crossEnv };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔧 cross-env - Cross-Platform Environment Variables (POLYGLOT!)\n");

  console.log("=== Example 1: Set Environment Variables ===");
  setEnv({ NODE_ENV: 'production', DEBUG: 'false', PORT: '3000' });
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`DEBUG: ${process.env.DEBUG}`);
  console.log(`PORT: ${process.env.PORT}`);
  console.log();

  console.log("=== Example 2: Run with Temporary Environment ===");
  console.log(`Before: TEMP_VAR = ${process.env.TEMP_VAR}`);
  runWithEnv({ TEMP_VAR: 'temporary-value' }, () => {
    console.log(`Inside: TEMP_VAR = ${process.env.TEMP_VAR}`);
  });
  console.log(`After: TEMP_VAR = ${process.env.TEMP_VAR}`);
  console.log();

  console.log("=== Example 3: POLYGLOT Use Case ===");
  console.log("🌐 Same cross-env library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("✅ Use Cases: Cross-platform scripts, CI/CD, Development");
  console.log("🚀 5M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}
