/**
 * randomstring - Generate Random Strings
 *
 * Generate random strings with customizable options.
 *
 * Package has ~3M+ downloads/week on npm!
 */

interface Options {
  length?: number;
  charset?: string;
  capitalization?: 'uppercase' | 'lowercase';
}

function generate(options: Options | number = {}): string {
  const opts = typeof options === 'number' ? { length: options } : options;
  const length = opts.length || 32;
  const charset = opts.charset || 'alphanumeric';

  const charsets: Record<string, string> = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    numeric: '0123456789',
    hex: '0123456789abcdef'
  };

  const chars = charsets[charset] || charset;
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  if (opts.capitalization === 'uppercase') result = result.toUpperCase();
  if (opts.capitalization === 'lowercase') result = result.toLowerCase();

  return result;
}

export default { generate };
export { generate };

if (import.meta.url.includes("elide-randomstring.ts")) {
  console.log("🔐 randomstring - Generate Random Strings\n");
  console.log("Alphanumeric (32):", generate());
  console.log("Numeric (10):", generate({ length: 10, charset: 'numeric' }));
  console.log("Hex (16):", generate({ length: 16, charset: 'hex' }));
  console.log("\n🚀 ~3M+ downloads/week on npm");
}
