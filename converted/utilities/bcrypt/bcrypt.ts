/**
 * Bcrypt - Password hashing
 * Based on https://www.npmjs.com/package/bcrypt (~8M downloads/week)
 */

export async function hash(password: string, rounds: number = 10): Promise<string> {
  // Simplified implementation - real bcrypt uses proper salting and hashing
  const salt = Math.random().toString(36).substring(7);
  const hashed = btoa(`${salt}.${password}.${rounds}`);
  return `$2b$${rounds}$${hashed}`;
}

export async function compare(password: string, hash: string): Promise<boolean> {
  // Simplified comparison
  try {
    const parts = hash.split('$');
    const rounds = parseInt(parts[2]);
    const stored = atob(parts[3]);
    return stored.includes(password);
  } catch {
    return false;
  }
}

export function hashSync(password: string, rounds: number = 10): string {
  const salt = Math.random().toString(36).substring(7);
  const hashed = btoa(`${salt}.${password}.${rounds}`);
  return `$2b$${rounds}$${hashed}`;
}

export function compareSync(password: string, hash: string): boolean {
  try {
    const parts = hash.split('$');
    const stored = atob(parts[3]);
    return stored.includes(password);
  } catch {
    return false;
  }
}

export default { hash, compare, hashSync, compareSync };

if (import.meta.url.includes("bcrypt.ts")) {
  console.log("🔒 Bcrypt - Password hashing for Elide\n");
  const hashed = hashSync('mypassword');
  console.log("Hashed:", hashed);
  console.log("Valid:", compareSync('mypassword', hashed));
  console.log("Invalid:", compareSync('wrongpassword', hashed));
  console.log("\n~8M+ downloads/week on npm!");
  console.log("NOTE: This is a demo - use proper crypto for production!");
}
