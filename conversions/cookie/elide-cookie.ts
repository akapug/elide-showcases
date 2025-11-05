/**
 * Cookie - HTTP Cookie Parsing and Serialization
 *
 * Parse and serialize HTTP cookies.
 * **POLYGLOT SHOWCASE**: One cookie parser for ALL languages on Elide!
 *
 * Features:
 * - Parse Cookie header
 * - Serialize cookies
 * - Set-Cookie header support
 * - Cookie attributes (expires, max-age, domain, path, secure, httpOnly, sameSite)
 * - Encoding/decoding
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need cookie handling
 * - ONE implementation works everywhere on Elide
 * - Consistent cookie parsing across languages
 * - No need for language-specific cookie libs
 *
 * Use cases:
 * - Web servers and frameworks
 * - HTTP clients
 * - Session management
 * - Authentication systems
 * - API services
 * - Web scraping
 *
 * Package has ~7M+ downloads/week on npm!
 */

export interface CookieOptions {
  /** Cookie expiration (Date object or milliseconds) */
  expires?: Date | number;
  /** Max age in seconds */
  maxAge?: number;
  /** Cookie domain */
  domain?: string;
  /** Cookie path */
  path?: string;
  /** Secure flag (HTTPS only) */
  secure?: boolean;
  /** HttpOnly flag (not accessible via JavaScript) */
  httpOnly?: boolean;
  /** SameSite attribute */
  sameSite?: 'Strict' | 'Lax' | 'None' | boolean;
  /** Encode cookie value */
  encode?: (value: string) => string;
}

/**
 * Parse a Cookie header value
 */
export function parse(str: string, options: { decode?: (value: string) => string } = {}): Record<string, string> {
  if (!str || typeof str !== 'string') return {};

  const { decode = decodeURIComponent } = options;
  const cookies: Record<string, string> = {};

  const pairs = str.split(/;\s*/);

  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');

    if (eqIdx < 0) {
      continue;
    }

    const key = pair.substring(0, eqIdx).trim();
    let value = pair.substring(eqIdx + 1).trim();

    // Remove quotes if present
    if (value[0] === '"') {
      value = value.slice(1, -1);
    }

    // Only set if key doesn't exist yet
    if (cookies[key] === undefined) {
      try {
        cookies[key] = decode(value);
      } catch {
        cookies[key] = value;
      }
    }
  }

  return cookies;
}

/**
 * Serialize a cookie to Set-Cookie header value
 */
export function serialize(name: string, value: string, options: CookieOptions = {}): string {
  const {
    encode = encodeURIComponent,
    expires,
    maxAge,
    domain,
    path,
    secure,
    httpOnly,
    sameSite
  } = options;

  if (!isValidName(name)) {
    throw new TypeError('Invalid cookie name');
  }

  const encodedValue = encode(value);

  let str = `${name}=${encodedValue}`;

  // Expires
  if (expires) {
    const expiresDate = expires instanceof Date ? expires : new Date(expires);
    str += `; Expires=${expiresDate.toUTCString()}`;
  }

  // Max-Age
  if (maxAge !== undefined) {
    str += `; Max-Age=${Math.floor(maxAge)}`;
  }

  // Domain
  if (domain) {
    str += `; Domain=${domain}`;
  }

  // Path
  if (path) {
    str += `; Path=${path}`;
  }

  // Secure
  if (secure) {
    str += '; Secure';
  }

  // HttpOnly
  if (httpOnly) {
    str += '; HttpOnly';
  }

  // SameSite
  if (sameSite) {
    const sameSiteValue = sameSite === true ? 'Strict' : sameSite;
    str += `; SameSite=${sameSiteValue}`;
  }

  return str;
}

/**
 * Validate cookie name
 */
function isValidName(name: string): boolean {
  return /^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/.test(name);
}

/**
 * Parse multiple Set-Cookie headers
 */
export function parseSetCookie(headers: string[]): Record<string, string>[] {
  return headers.map(header => {
    const parts = header.split(';');
    const nameValue = parts[0].split('=');

    const cookie: Record<string, string> = {
      name: nameValue[0].trim(),
      value: nameValue[1]?.trim() || ''
    };

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      const eqIdx = part.indexOf('=');

      if (eqIdx > 0) {
        const key = part.substring(0, eqIdx).toLowerCase();
        const value = part.substring(eqIdx + 1);
        cookie[key] = value;
      } else {
        cookie[part.toLowerCase()] = 'true';
      }
    }

    return cookie;
  });
}

/**
 * Create a session cookie (no expiration)
 */
export function sessionCookie(name: string, value: string, options: CookieOptions = {}): string {
  return serialize(name, value, {
    ...options,
    expires: undefined,
    maxAge: undefined
  });
}

/**
 * Create a persistent cookie with expiration
 */
export function persistentCookie(name: string, value: string, days: number, options: CookieOptions = {}): string {
  return serialize(name, value, {
    ...options,
    maxAge: days * 24 * 60 * 60
  });
}

/**
 * Create a cookie that expires immediately (for deletion)
 */
export function deleteCookie(name: string, options: CookieOptions = {}): string {
  return serialize(name, '', {
    ...options,
    expires: new Date(0),
    maxAge: 0
  });
}

// Default export
export default {
  parse,
  serialize,
  parseSetCookie,
  sessionCookie,
  persistentCookie,
  deleteCookie
};

// CLI Demo
if (import.meta.url.includes("elide-cookie.ts")) {
  console.log("🍪 Cookie - HTTP Cookie Parser for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Parse Cookie Header ===");
  const cookieHeader = "session=abc123; user=john; theme=dark";
  const parsed = parse(cookieHeader);
  console.log("Cookie header:", cookieHeader);
  console.log("Parsed:", JSON.stringify(parsed, null, 2));
  console.log();

  console.log("=== Example 2: Serialize Basic Cookie ===");
  const simple = serialize('session', 'abc123');
  console.log("Simple cookie:", simple);
  console.log();

  console.log("=== Example 3: Cookie with Options ===");
  const secure = serialize('token', 'xyz789', {
    expires: new Date('2025-12-31'),
    path: '/',
    domain: 'example.com',
    secure: true,
    httpOnly: true,
    sameSite: 'Strict'
  });
  console.log("Secure cookie:");
  console.log(secure);
  console.log();

  console.log("=== Example 4: Max-Age vs Expires ===");
  const withMaxAge = serialize('temp', 'value', { maxAge: 3600 });
  const withExpires = serialize('temp', 'value', {
    expires: new Date(Date.now() + 3600000)
  });
  console.log("With Max-Age (1 hour):", withMaxAge);
  console.log("With Expires:", withExpires);
  console.log();

  console.log("=== Example 5: Session vs Persistent ===");
  const session = sessionCookie('sessionId', 'sess_123');
  const persistent = persistentCookie('userId', 'user_456', 30);
  console.log("Session cookie:", session);
  console.log("Persistent (30 days):", persistent);
  console.log();

  console.log("=== Example 6: Delete Cookie ===");
  const deletedCookie = deleteCookie('oldCookie', { path: '/' });
  console.log("Delete cookie:", deletedCookie);
  console.log();

  console.log("=== Example 7: SameSite Attribute ===");
  const sameSiteStrict = serialize('csrf', 'token123', { sameSite: 'Strict' });
  const sameSiteLax = serialize('tracking', 'track456', { sameSite: 'Lax' });
  const sameSiteNone = serialize('third', 'party789', {
    sameSite: 'None',
    secure: true
  });
  console.log("SameSite=Strict:", sameSiteStrict);
  console.log("SameSite=Lax:", sameSiteLax);
  console.log("SameSite=None:", sameSiteNone);
  console.log();

  console.log("=== Example 8: Parse Set-Cookie Headers ===");
  const setCookieHeaders = [
    "session=abc123; Path=/; HttpOnly",
    "theme=dark; Max-Age=31536000",
    "lang=en; Domain=.example.com; Secure"
  ];
  console.log("Set-Cookie headers:");
  const parsedSetCookie = parseSetCookie(setCookieHeaders);
  parsedSetCookie.forEach((cookie, i) => {
    console.log(`  ${i + 1}.`, JSON.stringify(cookie));
  });
  console.log();

  console.log("=== Example 9: URL Encoding ===");
  const specialChars = serialize('message', 'Hello World! & Special #chars');
  console.log("With special chars:", specialChars);
  const parsedSpecial = parse(specialChars.split(';')[0]);
  console.log("Parsed back:", parsedSpecial);
  console.log();

  console.log("=== Example 10: Multiple Cookies ===");
  const cookies = [
    serialize('session', 'abc123', { path: '/', httpOnly: true }),
    serialize('user', 'john', { maxAge: 86400 }),
    serialize('theme', 'dark', { maxAge: 31536000 })
  ];
  console.log("Multiple Set-Cookie headers:");
  cookies.forEach((cookie, i) => {
    console.log(`  ${i + 1}. ${cookie}`);
  });
  console.log();

  console.log("=== Example 11: Authentication Cookie ===");
  const authCookie = serialize('auth_token', 'eyJhbGc...', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
  console.log("Auth cookie (7 days, secure):");
  console.log(authCookie);
  console.log();

  console.log("=== Example 12: Cookie from Request ===");
  const requestCookies = "sessionId=abc123; userId=user456; theme=dark; lang=en";
  const allCookies = parse(requestCookies);
  console.log("Request cookies:", requestCookies);
  console.log("Parsed:");
  Object.entries(allCookies).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log();

  console.log("=== Example 13: POLYGLOT Use Case ===");
  console.log("🌐 Same cookie parser works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent cookie handling everywhere");
  console.log("  ✓ No language-specific cookie bugs");
  console.log("  ✓ Share cookie logic across polyglot projects");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Web servers and frameworks");
  console.log("- HTTP clients");
  console.log("- Session management");
  console.log("- Authentication systems");
  console.log("- API services");
  console.log("- Web scraping");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~7M+ downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java via Elide");
  console.log("- Share cookie logic across languages");
  console.log("- One cookie standard for all services");
  console.log("- Perfect for microservices!");
}
