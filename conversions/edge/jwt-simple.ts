/**
 * Simple JWT (JSON Web Token)
 * Basic JWT encoding/decoding (no crypto verification - for demo only!)
 */

export interface JWTHeader {
  alg: string;
  typ: string;
}

export interface JWTPayload {
  [key: string]: any;
  iat?: number; // issued at
  exp?: number; // expires
  sub?: string; // subject
  iss?: string; // issuer
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function encode(payload: JWTPayload, options: { expiresIn?: number } = {}): string {
  const header: JWTHeader = {
    alg: 'none',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JWTPayload = {
    ...payload,
    iat: payload.iat || now
  };

  if (options.expiresIn) {
    fullPayload.exp = now + options.expiresIn;
  }

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(fullPayload));

  return `${headerEncoded}.${payloadEncoded}.`;
}

export function decode(token: string): { header: JWTHeader; payload: JWTPayload } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    return { header, payload };
  } catch {
    return null;
  }
}

export function isExpired(token: string): boolean {
  const decoded = decode(token);
  if (!decoded || !decoded.payload.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return decoded.payload.exp < now;
}

export function verify(token: string): { valid: boolean; reason?: string } {
  if (!token) return { valid: false, reason: 'Missing token' };

  const decoded = decode(token);
  if (!decoded) return { valid: false, reason: 'Invalid token format' };

  if (isExpired(token)) return { valid: false, reason: 'Token expired' };

  return { valid: true };
}

// CLI demo
if (import.meta.url.includes("jwt-simple.ts")) {
  console.log("Simple JWT Demo\n");

  const payload = {
    userId: 123,
    username: 'alice',
    role: 'admin'
  };

  console.log("Encode:");
  const token = encode(payload, { expiresIn: 3600 });
  console.log("Token:", token.substring(0, 50) + "...");

  console.log("\nDecode:");
  const decoded = decode(token);
  if (decoded) {
    console.log("Header:", decoded.header);
    console.log("Payload:", decoded.payload);
  }

  console.log("\nVerify:");
  const verification = verify(token);
  console.log("Valid:", verification.valid);

  console.log("\nExpired token:");
  const expiredToken = encode(payload, { expiresIn: -1 });
  console.log("Is expired:", isExpired(expiredToken));

  console.log("\n✅ JWT simple test passed");
  console.log("⚠️  Note: This is demo-only (no crypto verification)");
}
