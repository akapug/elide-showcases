/**
 * password-generator - Password Generator
 * Based on https://www.npmjs.com/package/password-generator (~1M downloads/week)
 *
 * Features:
 * - Simple password generation
 * - Configurable patterns
 * - Memorable passwords option
 * - Length control
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

function generate(length: number = 10, memorable: boolean = false): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const vowels = 'aeiou';
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  
  if (memorable) {
    let password = '';
    for (let i = 0; i < length; i++) {
      const pool = i % 2 === 0 ? consonants : vowels;
      password += pool[Math.floor(Math.random() * pool.length)];
    }
    return password;
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

export { generate };
export default generate;

if (import.meta.url.includes("elide-password-generator.ts")) {
  console.log("✅ password-generator - Simple Password Gen (POLYGLOT!)\n");
  console.log('Random 10:', generate());
  console.log('Random 20:', generate(20));
  console.log('Memorable 12:', generate(12, true));
  console.log("\n🔒 ~1M downloads/week | Simple password generation\n");
}
