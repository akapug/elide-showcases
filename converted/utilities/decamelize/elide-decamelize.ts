/**
 * Decamelize - Convert camelCase to other formats
 *
 * Features:
 * - Converts camelCase to snake_case or kebab-case
 * - Configurable separator
 * - Zero dependencies
 *
 * Package has ~30M+ downloads/week on npm!
 */

export default function decamelize(str: string, separator: string = '_'): string {
  return str
    .replace(/([a-z\d])([A-Z])/g, `$1${separator}$2`)
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, `$1${separator}$2`)
    .toLowerCase();
}

if (import.meta.url.includes("decamelize")) {
  console.log("helloWorld →", decamelize("helloWorld"));
  console.log("helloWorld →", decamelize("helloWorld", '-'));
  console.log("HTTPSConnection →", decamelize("HTTPSConnection"));
  console.log("XMLHttpRequest →", decamelize("XMLHttpRequest"));
}
