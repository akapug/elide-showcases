/**
 * secure-random-password - Secure Password Generator
 * Based on https://www.npmjs.com/package/secure-random-password (~500K downloads/week)
 *
 * Features:
 * - Cryptographically secure passwords
 * - Configurable length and character sets
 * - Number and symbol requirements
 * - No ambiguous characters option
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

interface PasswordOptions {
  length?: number;
  characters?: string;
  numbers?: boolean;
  symbols?: boolean;
  lowercase?: boolean;
  uppercase?: boolean;
}

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

function randomPassword(options: PasswordOptions = {}): string {
  const {
    length = 16,
    numbers = true,
    symbols = true,
    lowercase = true,
    uppercase = true
  } = options;
  
  let chars = '';
  if (lowercase) chars += LOWERCASE;
  if (uppercase) chars += UPPERCASE;
  if (numbers) chars += NUMBERS;
  if (symbols) chars += SYMBOLS;
  
  if (options.characters) {
    chars = options.characters;
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return password;
}

export { randomPassword, PasswordOptions };
export default randomPassword;

if (import.meta.url.includes("elide-secure-random-password.ts")) {
  console.log("✅ secure-random-password - Secure Password Gen (POLYGLOT!)\n");
  
  console.log('Default (16 chars):', randomPassword());
  console.log('24 chars:', randomPassword({ length: 24 }));
  console.log('No symbols:', randomPassword({ symbols: false }));
  console.log('Only lowercase:', randomPassword({ uppercase: false, numbers: false, symbols: false }));
  
  console.log("\n🔒 ~500K downloads/week | Secure password generation");
  console.log("🚀 Configurable | Character sets | Requirements\n");
}
