/**
 * valid-filename - Check if Filename is Valid
 *
 * Check if a string is a valid filename on the current platform.
 * **POLYGLOT SHOWCASE**: One filename validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/valid-filename (~50K+ downloads/week)
 *
 * Features:
 * - Validate filenames
 * - Cross-platform rules
 * - Check reserved names
 * - Check invalid characters
 * - Zero dependencies
 */

const INVALID_CHARS_UNIX = /\0/;
const INVALID_CHARS_WINDOWS = /[<>:"/\\|?*\x00-\x1F]/;
const RESERVED_NAMES_WINDOWS = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const MAX_LENGTH = 255;

export function validFilename(filename: string, options: { platform?: string } = {}): boolean {
  if (typeof filename !== 'string') {
    return false;
  }

  if (filename.length === 0 || filename.length > MAX_LENGTH) {
    return false;
  }

  // Check for current directory or parent directory
  if (filename === '.' || filename === '..') {
    return false;
  }

  const platform = options.platform || process.platform;

  if (platform === 'win32') {
    // Windows validation
    if (INVALID_CHARS_WINDOWS.test(filename)) {
      return false;
    }

    if (RESERVED_NAMES_WINDOWS.test(filename.replace(/\.[^.]*$/, ''))) {
      return false;
    }

    // No trailing dots or spaces
    if (filename.endsWith('.') || filename.endsWith(' ')) {
      return false;
    }
  } else {
    // Unix validation
    if (INVALID_CHARS_UNIX.test(filename)) {
      return false;
    }
  }

  return true;
}

export default validFilename;

if (import.meta.url.includes("elide-valid-filename.ts")) {
  console.log("✅ valid-filename - Validate Filenames (POLYGLOT!)\n");

  console.log("=== Example 1: Valid Filenames ===");
  console.log("'document.txt':", validFilename('document.txt'));
  console.log("'my-file.json':", validFilename('my-file.json'));
  console.log("'image_001.png':", validFilename('image_001.png'));
  console.log();

  console.log("=== Example 2: Invalid Characters ===");
  console.log("'file<name>.txt':", validFilename('file<name>.txt'));
  console.log("'file|name.txt':", validFilename('file|name.txt'));
  console.log("'file:name.txt':", validFilename('file:name.txt'));
  console.log();

  console.log("=== Example 3: Reserved Names (Windows) ===");
  console.log("'CON':", validFilename('CON', { platform: 'win32' }));
  console.log("'PRN':", validFilename('PRN', { platform: 'win32' }));
  console.log("'AUX':", validFilename('AUX', { platform: 'win32' }));
  console.log("'CON.txt':", validFilename('CON.txt', { platform: 'win32' }));
  console.log();

  console.log("=== Example 4: Special Cases ===");
  console.log("'.':", validFilename('.'));
  console.log("'..':", validFilename('..'));
  console.log("'.gitignore':", validFilename('.gitignore'));
  console.log("'':", validFilename(''));
  console.log();

  console.log("=== Example 5: Length Check ===");
  const longName = 'a'.repeat(256);
  console.log(`${'a'.repeat(255)}:`, validFilename('a'.repeat(255)));
  console.log(`${'a'.repeat(256)}:`, validFilename(longName));
  console.log();

  console.log("=== Example 6: Validate User Input ===");
  const userInputs = [
    'my-document.pdf',
    'invalid<file>.txt',
    'CON',
    'valid_file_123.json'
  ];

  console.log("Checking user inputs:");
  userInputs.forEach(input => {
    const isValid = validFilename(input);
    console.log(`  ${input}: ${isValid ? '✓ valid' : '✗ invalid'}`);
  });
  console.log();

  console.log("🚀 Performance: ~50K+ downloads/week on npm!");
}
