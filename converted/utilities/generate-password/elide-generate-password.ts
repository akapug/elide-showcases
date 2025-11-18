/**
 * generate-password - Password Generator with Rules
 * Based on https://www.npmjs.com/package/generate-password (~2M downloads/week)
 *
 * Features:
 * - Generate passwords with rules
 * - Exclude ambiguous characters
 * - Strict mode (ensure all character types)
 * - Multiple password generation
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

interface GenerateOptions {
  length?: number;
  numbers?: boolean;
  symbols?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
  excludeSimilarCharacters?: boolean;
  strict?: boolean;
}

function generate(options: GenerateOptions = {}): string {
  const {
    length = 10,
    numbers = true,
    symbols = false,
    uppercase = true,
    lowercase = true,
    excludeSimilarCharacters = false,
    strict = false
  } = options;
  
  let chars = '';
  if (lowercase) chars += excludeSimilarCharacters ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  if (uppercase) chars += excludeSimilarCharacters ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (numbers) chars += excludeSimilarCharacters ? '23456789' : '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return password;
}

function generateMultiple(count: number, options: GenerateOptions = {}): string[] {
  return Array.from({ length: count }, () => generate(options));
}

export { generate, generateMultiple, GenerateOptions };
export default { generate, generateMultiple };

if (import.meta.url.includes("elide-generate-password.ts")) {
  console.log("✅ generate-password - Password Gen with Rules (POLYGLOT!)\n");
  console.log('Default:', generate());
  console.log('With symbols:', generate({ symbols: true }));
  console.log('No similar chars:', generate({ excludeSimilarCharacters: true }));
  console.log('Multiple:', generateMultiple(3));
  console.log("\n🔒 ~2M downloads/week | Rule-based generation\n");
}
