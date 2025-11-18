/**
 * is-glob - Check if String is a Glob Pattern
 *
 * Determine if a string contains glob characters
 * Fast and lightweight glob detection
 *
 * Popular package with ~120M downloads/week on npm!
 */

interface IsGlobOptions {
  strict?: boolean;
}

export function isGlob(str: string, options: IsGlobOptions = {}): boolean {
  if (typeof str !== 'string' || str.length === 0) {
    return false;
  }

  const { strict = true } = options;

  // Check for glob characters
  const globChars = /[*?[\]{}!]/;
  const hasGlobChars = globChars.test(str);

  if (!hasGlobChars) {
    return false;
  }

  // In strict mode, check for valid glob patterns
  if (strict) {
    // Escaped characters are not glob patterns
    if (/\\[*?[\]{}!]/.test(str)) {
      return false;
    }
  }

  return true;
}

// CLI Demo
if (import.meta.url.includes("elide-is-glob.ts")) {
  console.log("🔍 is-glob - Detect Glob Patterns for Elide\n");
  console.log('isGlob("*.ts")           // true');
  console.log('isGlob("foo.ts")         // false');
  console.log('isGlob("**/*.js")        // true');
  console.log('isGlob("{a,b}.ts")       // true');
  console.log('isGlob("[a-z].ts")       // true');
  console.log('isGlob("!test.ts")       // true');
  console.log('isGlob("path/to/file")   // false');
  console.log('isGlob("\\\\*.ts")        // false (escaped)');
  console.log();
  console.log("✅ Use Cases: Input validation, path processing");
  console.log("🚀 ~120M downloads/week on npm");
}

export default isGlob;
