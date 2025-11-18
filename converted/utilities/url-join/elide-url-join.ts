/**
 * URL Join - Join URL parts correctly
 *
 * Join all arguments together and normalize the resulting URL
 * Package has ~15M downloads/week on npm!
 */

export function urlJoin(...parts: string[]): string {
  // Remove empty parts
  const filteredParts = parts.filter((part) => part && part.length > 0);

  if (filteredParts.length === 0) {
    return '';
  }

  // Handle protocol separately
  let result = filteredParts[0];

  for (let i = 1; i < filteredParts.length; i++) {
    const part = filteredParts[i];

    // Remove leading slash from part if result ends with slash
    const cleanPart = result.endsWith('/') && part.startsWith('/') ? part.slice(1) : part;

    // Add separator if needed
    if (!result.endsWith('/') && !cleanPart.startsWith('/') && !cleanPart.startsWith('?') && !cleanPart.startsWith('#')) {
      result += '/';
    }

    result += cleanPart;
  }

  return result;
}

export default urlJoin;

if (import.meta.url.includes("elide-url-join.ts")) {
  console.log("🌐 URL Join (POLYGLOT!)\n");
  console.log("Examples:");
  console.log(urlJoin('https://example.com', 'api', 'v1', 'users'));
  console.log(urlJoin('https://example.com/', '/api/', '/users'));
  console.log("\n📦 ~15M downloads/week on npm");
}
