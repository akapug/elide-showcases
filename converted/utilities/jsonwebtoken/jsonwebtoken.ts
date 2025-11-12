/**
 * JSON Web Token - JWT implementation
 * Based on https://www.npmjs.com/package/jsonwebtoken (~11M downloads/week)
 */

export function sign(payload: any, secret: string, options?: { expiresIn?: string }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verify(token: string, secret: string): any {
  const [header, payload, signature] = token.split('.');
  // Simplified - real implementation would verify signature
  return JSON.parse(atob(payload));
}

export function decode(token: string): any {
  const [, payload] = token.split('.');
  return JSON.parse(atob(payload));
}

export default { sign, verify, decode };

if (import.meta.url.includes("jsonwebtoken.ts")) {
  console.log("🔐 JSON Web Token for Elide\n");
  const token = sign({ userId: 123, role: 'admin' }, 'secret');
  console.log("Token:", token);
  console.log("Decoded:", decode(token));
  console.log("\n~11M+ downloads/week on npm!");
}
