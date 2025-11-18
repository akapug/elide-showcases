/**
 * Humanize String - Convert strings to human-readable format
 *
 * Features:
 * - Converts camelCase, snake_case, kebab-case to readable format
 * - Capitalizes first letter
 * - Removes underscores and hyphens
 * - Zero dependencies
 *
 * Package has ~3M+ downloads/week on npm!
 */

export default function humanizeString(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}

if (import.meta.url.includes("humanize-string")) {
  console.log("helloWorld →", humanizeString("helloWorld"));
  console.log("foo_bar →", humanizeString("foo_bar"));
  console.log("test-case →", humanizeString("test-case"));
  console.log("HTTPSConnection →", humanizeString("HTTPSConnection"));
}
