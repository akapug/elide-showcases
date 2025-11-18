/**
 * Change Case - Universal Case Converter
 *
 * Comprehensive string case transformation library.
 * Handles all common case formats with a unified API.
 *
 * Features:
 * - camelCase conversion
 * - PascalCase conversion
 * - snake_case conversion
 * - kebab-case conversion
 * - CONSTANT_CASE conversion
 * - dot.case conversion
 * - path/case conversion
 * - Sentence case conversion
 * - Title Case conversion
 * - And more!
 *
 * Use cases:
 * - API field transformations
 * - Code generation
 * - Database column naming
 * - URL slugs
 * - Configuration files
 *
 * Package has ~15M+ downloads/week on npm!
 */

// Helper to split words
function splitWords(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // ABCDef -> ABC Def
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
}

/**
 * Convert to camelCase
 */
export function camelCase(str: string): string {
  const words = splitWords(str);
  if (words.length === 0) return '';
  return words[0].toLowerCase() + words.slice(1).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
}

/**
 * Convert to PascalCase
 */
export function pascalCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('');
}

/**
 * Convert to snake_case
 */
export function snakeCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w.toLowerCase()).join('_');
}

/**
 * Convert to kebab-case
 */
export function kebabCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w.toLowerCase()).join('-');
}

/**
 * Convert to CONSTANT_CASE
 */
export function constantCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w.toUpperCase()).join('_');
}

/**
 * Convert to dot.case
 */
export function dotCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w.toLowerCase()).join('.');
}

/**
 * Convert to path/case
 */
export function pathCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w.toLowerCase()).join('/');
}

/**
 * Convert to Sentence case
 */
export function sentenceCase(str: string): string {
  const words = splitWords(str);
  if (words.length === 0) return '';
  return words[0][0].toUpperCase() + words[0].slice(1).toLowerCase() +
    (words.length > 1 ? ' ' + words.slice(1).map(w => w.toLowerCase()).join(' ') : '');
}

/**
 * Convert to Title Case
 */
export function titleCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Convert to Capital Case
 */
export function capitalCase(str: string): string {
  return titleCase(str);
}

/**
 * Convert to lower case
 */
export function lowerCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w.toLowerCase()).join(' ');
}

/**
 * Convert to UPPER CASE
 */
export function upperCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w.toUpperCase()).join(' ');
}

/**
 * Convert to param-case (alias for kebab-case)
 */
export function paramCase(str: string): string {
  return kebabCase(str);
}

/**
 * Convert to header-case
 */
export function headerCase(str: string): string {
  const words = splitWords(str);
  return words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('-');
}

// Default export is an object with all converters
export default {
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  constantCase,
  dotCase,
  pathCase,
  sentenceCase,
  titleCase,
  capitalCase,
  lowerCase,
  upperCase,
  paramCase,
  headerCase,
};

// CLI Demo
if (import.meta.url.includes("change-case")) {
  console.log("🔤 Change Case - Universal Case Converter for Elide\n");

  const testStr = "helloWorldExample";

  console.log("=== Converting 'helloWorldExample' ===");
  console.log("camelCase:", camelCase(testStr));
  console.log("PascalCase:", pascalCase(testStr));
  console.log("snake_case:", snakeCase(testStr));
  console.log("kebab-case:", kebabCase(testStr));
  console.log("CONSTANT_CASE:", constantCase(testStr));
  console.log("dot.case:", dotCase(testStr));
  console.log("path/case:", pathCase(testStr));
  console.log("Sentence case:", sentenceCase(testStr));
  console.log("Title Case:", titleCase(testStr));
  console.log("lower case:", lowerCase(testStr));
  console.log("UPPER CASE:", upperCase(testStr));
  console.log("param-case:", paramCase(testStr));
  console.log("Header-Case:", headerCase(testStr));
  console.log();

  console.log("=== Converting 'user_profile_data' ===");
  const testStr2 = "user_profile_data";
  console.log("camelCase:", camelCase(testStr2));
  console.log("PascalCase:", pascalCase(testStr2));
  console.log("kebab-case:", kebabCase(testStr2));
  console.log("CONSTANT_CASE:", constantCase(testStr2));
  console.log();

  console.log("=== Converting 'my-api-endpoint' ===");
  const testStr3 = "my-api-endpoint";
  console.log("camelCase:", camelCase(testStr3));
  console.log("PascalCase:", pascalCase(testStr3));
  console.log("snake_case:", snakeCase(testStr3));
  console.log("Sentence case:", sentenceCase(testStr3));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- API field transformations");
  console.log("- Code generation");
  console.log("- Database column naming");
  console.log("- URL slug generation");
  console.log("- Configuration file formats");
  console.log("- Variable renaming");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Pure TypeScript implementation");
  console.log("- ~15M+ downloads/week on npm");
  console.log("- All conversions in one library");
}
