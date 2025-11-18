/**
 * sanitize-filename - Filename Sanitization
 * Based on https://www.npmjs.com/package/sanitize-filename (~5M downloads/week)
 *
 * Features:
 * - Remove illegal filesystem characters
 * - Handle reserved names (CON, PRN, AUX, etc.)
 * - Truncate long filenames
 * - Cross-platform compatibility
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

interface SanitizeOptions {
  replacement?: string;
}

const illegalRe = /[\/\?<>\\:\*\|"]/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
const windowsTrailingRe = /[\. ]+$/;

function sanitize(input: string, options: SanitizeOptions = {}): string {
  const replacement = options.replacement || '';

  let sanitized = input
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement)
    .replace(windowsTrailingRe, replacement);

  // Truncate to 255 bytes (common filesystem limit)
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.slice(0, 255 - (ext?.length || 0) - 1);
    sanitized = ext ? `${name}.${ext}` : name;
  }

  return sanitized || 'unnamed';
}

export default sanitize;
export { sanitize, SanitizeOptions };

if (import.meta.url.includes("elide-sanitize-filename.ts")) {
  console.log("✅ sanitize-filename - Safe Filenames (POLYGLOT!)\n");

  const testCases = [
    'my file.txt',
    'invoice#12.pdf',
    'data<script>.json',
    'file/with/slashes.txt',
    'con.txt',  // Windows reserved
    'file?.txt',
    'file:name.txt',
    '...hidden',
    'normal-file_123.txt'
  ];

  testCases.forEach(filename => {
    console.log('Original:', filename);
    console.log('Sanitized:', sanitize(filename));
    console.log('With dash:', sanitize(filename, { replacement: '-' }));
    console.log('---');
  });

  console.log("\n🔒 ~5M downloads/week | Cross-platform filename safety");
  console.log("🚀 Removes illegal chars | Handles reserved names | Truncates long names\n");
}
