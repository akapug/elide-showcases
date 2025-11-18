/**
 * bcryptjs - Pure JavaScript bcrypt
 *
 * Pure JavaScript implementation of bcrypt password hashing.
 * No native dependencies, works in all JavaScript environments.
 *
 * Package has ~8M+ downloads/week on npm!
 */

import { hash, compare, generateSalt, getRounds } from '../bcrypt/elide-bcrypt.ts';

export default { hash, compare, generateSalt, getRounds, hashSync: hash, compareSync: compare };
export { hash, compare, generateSalt, getRounds };

if (import.meta.url.includes("elide-bcryptjs.ts")) {
  console.log("🔐 bcryptjs - Pure JavaScript bcrypt\n");
  const passwordHash = await hash("password123", { rounds: 10 });
  console.log("Hash:", passwordHash);
  console.log("Valid:", await compare("password123", passwordHash));
  console.log("\n🚀 ~8M+ downloads/week on npm");
}
