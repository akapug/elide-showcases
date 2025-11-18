/**
 * clean-stack - Clean up error stack traces
 * Based on https://www.npmjs.com/package/clean-stack (~15M+ downloads/week)
 *
 * Features:
 * - Remove internal Node.js entries
 * - Simplify file paths
 * - Configurable filtering
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Cleaner error debugging
 */

interface CleanStackOptions {
  pretty?: boolean;
  basePath?: string;
}

function cleanStack(stack: string, options: CleanStackOptions = {}): string {
  const { pretty = false, basePath } = options;

  if (!stack) return '';

  const lines = stack.split('\n');
  const cleanedLines = lines.filter(line => {
    // Skip empty lines
    if (!line.trim()) return false;

    // Skip internal Node.js lines
    if (line.includes('node:internal')) return false;
    if (line.includes('node_modules')) return false;

    // Skip common internal patterns
    if (line.includes('Module._compile')) return false;
    if (line.includes('Module._extensions')) return false;
    if (line.includes('Module.load')) return false;

    return true;
  }).map(line => {
    let cleaned = line;

    // Remove base path if provided
    if (basePath) {
      cleaned = cleaned.replace(basePath, '');
    }

    // Make it pretty if requested
    if (pretty) {
      cleaned = cleaned.replace(/\s+at\s+/g, ' at ');
      cleaned = cleaned.trim();
    }

    return cleaned;
  });

  return cleanedLines.join('\n');
}

export default cleanStack;

// Self-test
if (import.meta.url.includes("elide-clean-stack.ts")) {
  console.log("✅ clean-stack - Clean Error Traces (POLYGLOT!)\n");

  const error = new Error('Test error');
  const stack = error.stack || '';

  console.log('Original lines:', stack.split('\n').length);
  const cleaned = cleanStack(stack, { pretty: true });
  console.log('Cleaned lines:', cleaned.split('\n').length);
  console.log('\nCleaned stack:');
  console.log(cleaned);

  console.log("\n🚀 ~15M+ downloads/week | Cleaner stack traces\n");
}
