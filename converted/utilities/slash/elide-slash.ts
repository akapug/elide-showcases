/**
 * slash - Convert Windows Backslashes to Forward Slashes
 *
 * Simple utility to convert Windows-style backslashes to Unix-style forward slashes.
 * **POLYGLOT SHOWCASE**: One path converter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/slash (~3M+ downloads/week)
 *
 * Features:
 * - Convert backslashes to forward slashes
 * - Handle Windows paths
 * - Simple, focused API
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need path normalization
 * - ONE implementation works everywhere on Elide
 * - Consistent path format across platforms
 * - Share path utilities across languages
 *
 * Use cases:
 * - Normalize Windows paths
 * - URL generation from file paths
 * - Cross-platform file operations
 * - Build tools and bundlers
 *
 * Package has ~3M+ downloads/week on npm - essential utility!
 */

/**
 * Convert Windows backslashes to forward slashes
 */
export function slash(path: string): string {
  const isExtendedLengthPath = path.startsWith('\\\\?\\');

  if (isExtendedLengthPath) {
    return path;
  }

  return path.replace(/\\/g, '/');
}

export default slash;

// CLI Demo
if (import.meta.url.includes("elide-slash.ts")) {
  console.log("🔄 slash - Convert Backslashes to Forward Slashes (POLYGLOT!)\n");

  console.log("=== Example 1: Windows Paths ===");
  console.log("Input:  C:\\Users\\John\\Documents\\file.txt");
  console.log("Output:", slash("C:\\Users\\John\\Documents\\file.txt"));
  console.log();

  console.log("=== Example 2: Relative Paths ===");
  console.log("Input:  src\\components\\Button.tsx");
  console.log("Output:", slash("src\\components\\Button.tsx"));
  console.log();

  console.log("=== Example 3: Mixed Slashes ===");
  console.log("Input:  path/to\\mixed/slashes");
  console.log("Output:", slash("path/to\\mixed/slashes"));
  console.log();

  console.log("=== Example 4: Already Unix Style ===");
  console.log("Input:  /usr/local/bin");
  console.log("Output:", slash("/usr/local/bin"));
  console.log();

  console.log("=== Example 5: Build Tool Use Case ===");
  const files = [
    "src\\index.ts",
    "src\\components\\App.tsx",
    "src\\utils\\helpers.ts"
  ];

  console.log("Before:");
  files.forEach(f => console.log("  " + f));

  console.log("\nAfter:");
  files.map(slash).forEach(f => console.log("  " + f));
  console.log();

  console.log("=== Example 6: URL Generation ===");
  const filePath = "uploads\\images\\photo.jpg";
  const url = `https://cdn.example.com/${slash(filePath)}`;
  console.log("File path:", filePath);
  console.log("CDN URL:", url);
  console.log();

  console.log("=== Example 7: Import Path Fixing ===");
  const importPath = "..\\..\\utils\\database";
  const fixedImport = `import { db } from '${slash(importPath)}';`;
  console.log("Original:", `import { db } from '${importPath}';`);
  console.log("Fixed:", fixedImport);
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Same slash utility works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One path converter everywhere");
  console.log("  ✓ Consistent across all platforms");
  console.log("  ✓ No platform detection needed");
  console.log("  ✓ Share paths between services");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Normalize Windows paths");
  console.log("- URL generation from file paths");
  console.log("- Cross-platform build tools");
  console.log("- Import path fixing");
  console.log("- File path standardization");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Single regex replace operation");
  console.log("- ~3M+ downloads/week on npm!");
  console.log();
}
