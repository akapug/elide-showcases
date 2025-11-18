/**
 * parse-filepath - Parse File Paths into Components
 *
 * Parse file paths into root, dir, base, ext, and name components.
 * **POLYGLOT SHOWCASE**: One path parser for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/parse-filepath (~50K+ downloads/week)
 *
 * Features:
 * - Extract path components
 * - Parse root, directory, basename, extension
 * - Handle both Windows and Unix paths
 * - Detailed path information
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need path parsing
 * - ONE implementation works everywhere on Elide
 * - Consistent parsing across platforms
 * - Share path utilities across stack
 *
 * Use cases:
 * - File operations (extract components)
 * - Build tools (process files)
 * - Path manipulation (change extension)
 * - Template engines (file metadata)
 *
 * Package has ~50K+ downloads/week on npm!
 */

export interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
  path: string;
  absolute: boolean;
  stem: string;
  isAbsolute: boolean;
  dirname: string;
  basename: string;
  extname: string;
}

/**
 * Parse a file path into its components
 */
export function parseFilepath(filepath: string): ParsedPath {
  if (typeof filepath !== 'string') {
    throw new TypeError('expected a string');
  }

  // Normalize slashes
  const path = filepath.replace(/\\/g, '/');

  // Check if absolute
  let isAbsolute = false;
  let root = '';

  if (path.startsWith('/')) {
    isAbsolute = true;
    root = '/';
  } else if (/^[a-zA-Z]:/.test(path)) {
    isAbsolute = true;
    root = path.slice(0, 2);
  }

  // Get directory and basename
  const lastSlash = path.lastIndexOf('/');
  let dir = '';
  let base = path;

  if (lastSlash !== -1) {
    dir = path.slice(0, lastSlash);
    base = path.slice(lastSlash + 1);
  }

  // Get extension and name
  const lastDot = base.lastIndexOf('.');
  let ext = '';
  let name = base;

  if (lastDot > 0) {
    ext = base.slice(lastDot);
    name = base.slice(0, lastDot);
  }

  return {
    root,
    dir,
    base,
    ext,
    name,
    path: filepath,
    absolute: isAbsolute,
    stem: name,
    isAbsolute,
    dirname: dir,
    basename: base,
    extname: ext,
  };
}

export default parseFilepath;

// CLI Demo
if (import.meta.url.includes("elide-parse-filepath.ts")) {
  console.log("📄 parse-filepath - Parse File Paths (POLYGLOT!)\n");

  console.log("=== Example 1: Unix Absolute Path ===");
  const unix = parseFilepath("/home/user/documents/report.pdf");
  console.log("Path:", unix.path);
  console.log("Root:", unix.root);
  console.log("Directory:", unix.dir);
  console.log("Basename:", unix.base);
  console.log("Extension:", unix.ext);
  console.log("Name:", unix.name);
  console.log("Absolute:", unix.isAbsolute);
  console.log();

  console.log("=== Example 2: Windows Path ===");
  const windows = parseFilepath("C:\\Users\\John\\Documents\\file.txt");
  console.log("Path:", windows.path);
  console.log("Root:", windows.root);
  console.log("Directory:", windows.dir);
  console.log("Basename:", windows.base);
  console.log("Extension:", windows.ext);
  console.log("Name:", windows.name);
  console.log();

  console.log("=== Example 3: Relative Path ===");
  const relative = parseFilepath("src/components/Button.tsx");
  console.log("Path:", relative.path);
  console.log("Root:", relative.root);
  console.log("Directory:", relative.dir);
  console.log("Basename:", relative.base);
  console.log("Extension:", relative.ext);
  console.log("Name:", relative.name);
  console.log("Absolute:", relative.isAbsolute);
  console.log();

  console.log("=== Example 4: File Without Extension ===");
  const noExt = parseFilepath("/usr/bin/node");
  console.log("Path:", noExt.path);
  console.log("Basename:", noExt.base);
  console.log("Extension:", noExt.ext);
  console.log("Name:", noExt.name);
  console.log();

  console.log("=== Example 5: Dotfile ===");
  const dotfile = parseFilepath("/home/user/.bashrc");
  console.log("Path:", dotfile.path);
  console.log("Basename:", dotfile.base);
  console.log("Extension:", dotfile.ext);
  console.log("Name:", dotfile.name);
  console.log();

  console.log("=== Example 6: Change Extension ===");
  const original = parseFilepath("src/index.ts");
  const newPath = `${original.dir}/${original.name}.js`;
  console.log("Original:", original.path);
  console.log("New path:", newPath);
  console.log();

  console.log("=== Example 7: Build Tool Use Case ===");
  const sourceFiles = [
    "src/index.ts",
    "src/components/App.tsx",
    "src/utils/helpers.ts"
  ];

  console.log("Converting .ts to .js:");
  sourceFiles.forEach(file => {
    const parsed = parseFilepath(file);
    const outputPath = `dist/${parsed.name}.js`;
    console.log(`  ${file} → ${outputPath}`);
  });
  console.log();

  console.log("=== Example 8: Template Use Case ===");
  const template = parseFilepath("templates/email/welcome.html");
  console.log("Template info:");
  console.log("  Category:", template.dir.split('/')[1]);
  console.log("  Name:", template.name);
  console.log("  Format:", template.ext);
  console.log();

  console.log("=== Example 9: POLYGLOT Use Case ===");
  console.log("🌐 Same parse-filepath works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Parse paths consistently everywhere");
  console.log("  ✓ Extract components in any language");
  console.log("  ✓ No platform-specific parsing");
  console.log("  ✓ Share path logic across stack");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- File operations (extract components)");
  console.log("- Build tools (transform extensions)");
  console.log("- Path manipulation (change parts)");
  console.log("- Template engines (file metadata)");
  console.log("- File organization (categorize by type)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Simple string operations");
  console.log("- ~50K+ downloads/week on npm!");
  console.log();
}
