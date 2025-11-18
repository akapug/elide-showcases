/**
 * PBKDF2 - Password-Based Key Derivation Function 2
 *
 * PBKDF2 key derivation - industry standard for password hashing.
 *
 * Package has ~40M+ downloads/week on npm!
 */

async function pbkdf2(password: string, salt: string, iterations: number, keylen: number, digest: string = 'sha256'): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const hashMap: Record<string, string> = { sha1: 'SHA-1', sha256: 'SHA-256', sha512: 'SHA-512' };

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: hashMap[digest] || 'SHA-256' },
    keyMaterial,
    keylen * 8
  );

  return new Uint8Array(derived);
}

export default pbkdf2;
export { pbkdf2 };

if (import.meta.url.includes("elide-pbkdf2.ts")) {
  console.log("🔐 PBKDF2 - Password-Based Key Derivation\n");
  const key = await pbkdf2("password", "salt", 100000, 32);
  console.log("Derived key:", Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32), "...");
  console.log("\n🚀 ~40M+ downloads/week on npm");
}
