/**
 * Elide Cookie Parser - Universal Cookie Parsing Middleware
 *
 * Parse Cookie header and populate req.cookies across all languages.
 * Compatible with Express.js and other web frameworks.
 */

import { parse as parseCookie, serialize as serializeCookie } from '../cookie/elide-cookie.ts';

export interface CookieParserOptions {
  decode?: (val: string) => string;
  secret?: string | string[];
}

// Simple signature generation (for demo purposes)
function sign(value: string, secret: string): string {
  // In production, use proper HMAC
  return `s:${value}.${btoa(secret + value).substring(0, 27)}`;
}

function unsign(value: string, secrets: string[]): string | false {
  if (!value.startsWith('s:')) {
    return false;
  }

  const signedValue = value.slice(2);
  const dotIndex = signedValue.lastIndexOf('.');
  if (dotIndex === -1) {
    return false;
  }

  const originalValue = signedValue.slice(0, dotIndex);

  for (const secret of secrets) {
    const expected = sign(originalValue, secret);
    if (value === expected) {
      return originalValue;
    }
  }

  return false;
}

// Cookie parser middleware
export function cookieParser(secret?: string | string[], options: CookieParserOptions = {}) {
  const secrets = secret ? (Array.isArray(secret) ? secret : [secret]) : [];
  const decode = options.decode || decodeURIComponent;

  return (req: any, res: any, next: () => void) => {
    if (req.cookies) {
      return next();
    }

    const cookieHeader = req.headers?.cookie || req.headers?.Cookie || '';
    const cookies = parseCookie(cookieHeader);

    // Decode cookies
    req.cookies = {} as Record<string, string>;
    req.signedCookies = {} as Record<string, string>;

    for (const [name, value] of Object.entries(cookies)) {
      let decoded: string;
      try {
        decoded = decode(value);
      } catch {
        decoded = value;
      }

      if (secrets.length > 0) {
        const unsigned = unsign(decoded, secrets);
        if (unsigned !== false) {
          req.signedCookies[name] = unsigned;
        } else {
          req.cookies[name] = decoded;
        }
      } else {
        req.cookies[name] = decoded;
      }
    }

    next();
  };
}

// Export default
export default cookieParser;

// Convenience functions for response
export function setCookie(res: any, name: string, value: string, options?: any) {
  const cookie = serializeCookie(name, value, options);
  const existing = res.getHeader?.('Set-Cookie') || [];
  const cookies = Array.isArray(existing) ? existing : [existing];
  cookies.push(cookie);
  res.setHeader?.('Set-Cookie', cookies);
}

export function clearCookie(res: any, name: string, options?: any) {
  setCookie(res, name, '', {
    ...options,
    expires: new Date(0),
    maxAge: 0
  });
}

// Demo
if (import.meta.main) {
  console.log('=== Elide Cookie Parser Demo ===\n');

  // Mock request/response objects
  const createMockReq = (cookieHeader: string) => ({
    headers: { cookie: cookieHeader }
  });

  const createMockRes = () => {
    const headers: Record<string, any> = {};
    return {
      getHeader: (name: string) => headers[name],
      setHeader: (name: string, value: any) => {
        headers[name] = value;
      },
      headers
    };
  };

  // Example 1: Basic cookie parsing
  console.log('1. Basic cookie parsing:');
  const req1 = createMockReq('session=abc123; user=john; theme=dark');
  const parser1 = cookieParser();
  parser1(req1, {}, () => {});
  console.log('   Cookies:', req1.cookies);
  console.log('');

  // Example 2: URL-encoded cookies
  console.log('2. URL-encoded cookies:');
  const req2 = createMockReq('name=John%20Doe; email=john%40example.com');
  const parser2 = cookieParser();
  parser2(req2, {}, () => {});
  console.log('   Cookies:', req2.cookies);
  console.log('');

  // Example 3: Signed cookies
  console.log('3. Signed cookies:');
  const secret = 'my-secret-key';
  const signedValue = sign('user123', secret);
  const req3 = createMockReq(`userId=${signedValue}; regular=value`);
  const parser3 = cookieParser(secret);
  parser3(req3, {}, () => {});
  console.log('   Regular cookies:', req3.cookies);
  console.log('   Signed cookies:', req3.signedCookies);
  console.log('');

  // Example 4: Multiple secrets (rotation)
  console.log('4. Multiple secrets (key rotation):');
  const oldSecret = 'old-secret';
  const newSecret = 'new-secret';
  const oldSignedValue = sign('session456', oldSecret);
  const req4 = createMockReq(`sessionId=${oldSignedValue}`);
  const parser4 = cookieParser([newSecret, oldSecret]); // Try new first, then old
  parser4(req4, {}, () => {});
  console.log('   Signed cookies:', req4.signedCookies);
  console.log('');

  // Example 5: Setting cookies
  console.log('5. Setting cookies:');
  const res5 = createMockRes();
  setCookie(res5, 'userId', 'user123', { path: '/', httpOnly: true });
  setCookie(res5, 'theme', 'dark', { path: '/', maxAge: 86400 });
  console.log('   Set-Cookie headers:', res5.headers['Set-Cookie']);
  console.log('');

  // Example 6: Clearing cookies
  console.log('6. Clearing cookies:');
  const res6 = createMockRes();
  clearCookie(res6, 'oldSession', { path: '/' });
  console.log('   Set-Cookie headers:', res6.headers['Set-Cookie']);
  console.log('');

  console.log('✓ All examples completed successfully!');
}
