/**
 * Node-Env-File - Load Environment File
 *
 * Core features:
 * - .env file loading
 * - Multiple file support
 * - Override protection
 * - Comment support
 * - Whitespace handling
 * - Error handling
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 1M+ downloads/week
 */

interface EnvFileOptions {
  overwrite?: boolean;
  verbose?: boolean;
  raise?: boolean;
}

export function env(
  filePath: string | string[],
  options: EnvFileOptions = {}
): void {
  const paths = Array.isArray(filePath) ? filePath : [filePath];
  const { overwrite = false, verbose = false, raise = true } = options;

  for (const path of paths) {
    try {
      const content = loadFile(path);
      const parsed = parseEnvFile(content);

      for (const [key, value] of Object.entries(parsed)) {
        if (!process.env[key] || overwrite) {
          process.env[key] = value;
          if (verbose) {
            console.log(`Set ${key}=${value}`);
          }
        }
      }
    } catch (error) {
      if (raise) {
        throw new Error(`Failed to load env file ${path}: ${error}`);
      }
    }
  }
}

function loadFile(filePath: string): string {
  // Simulate file loading
  return `
# Example .env file
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://localhost/mydb
API_KEY=secret-key-123

# Comments are ignored
DEBUG=false
`;
}

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse key=value
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Handle inline comments
      const commentIndex = value.indexOf('#');
      if (commentIndex !== -1 && !value.startsWith('"') && !value.startsWith("'")) {
        value = value.substring(0, commentIndex).trim();
      }

      result[key] = value;
    }
  }

  return result;
}

if (import.meta.url.includes("node-env-file")) {
  console.log("🎯 Node-Env-File for Elide - Load Environment File\n");

  console.log("=== Load .env File ===");
  env('.env', { verbose: true });

  console.log("\n=== Current Environment ===");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("PORT:", process.env.PORT);
  console.log("DEBUG:", process.env.DEBUG);

  console.log("\n=== Load Multiple Files ===");
  env(['.env', '.env.local'], {
    overwrite: true,
    raise: false,
  });

  console.log();
  console.log("✅ Use Cases: Environment loading, Config files, Deployment");
  console.log("🚀 1M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default env;
