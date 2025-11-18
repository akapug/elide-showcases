/**
 * Passport Local Strategy for Elide
 *
 * Core authentication features:
 * - Username/password authentication
 * - Customizable field names
 * - Async verification
 * - Flexible error handling
 * - Session integration
 * - Password validation
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 8M+ downloads/week
 */

export interface LocalStrategyOptions {
  usernameField?: string;
  passwordField?: string;
  passReqToCallback?: boolean;
  session?: boolean;
}

export type VerifyFunction = (
  username: string,
  password: string,
  done: (error: any, user?: any, info?: any) => void
) => void;

export type VerifyFunctionWithRequest = (
  req: any,
  username: string,
  password: string,
  done: (error: any, user?: any, info?: any) => void
) => void;

export class LocalStrategy {
  name = 'local';
  private options: LocalStrategyOptions;
  private verify: VerifyFunction | VerifyFunctionWithRequest;

  constructor(verify: VerifyFunction);
  constructor(options: LocalStrategyOptions, verify: VerifyFunction | VerifyFunctionWithRequest);
  constructor(
    optionsOrVerify: LocalStrategyOptions | VerifyFunction,
    verify?: VerifyFunction | VerifyFunctionWithRequest
  ) {
    if (typeof optionsOrVerify === 'function') {
      this.verify = optionsOrVerify;
      this.options = {};
    } else {
      this.options = optionsOrVerify;
      this.verify = verify!;
    }

    this.options = {
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: false,
      session: true,
      ...this.options
    };
  }

  authenticate(req: any, options?: any): void {
    const username = this.lookup(req.body, this.options.usernameField!);
    const password = this.lookup(req.body, this.options.passwordField!);

    if (!username || !password) {
      return req._passport.fail('Missing credentials', 400);
    }

    const verified = (error: any, user?: any, info?: any) => {
      if (error) {
        return req._passport.error(error);
      }
      if (!user) {
        return req._passport.fail(info || 'Invalid credentials', 401);
      }
      req._passport.success(user, info);
    };

    try {
      if (this.options.passReqToCallback) {
        (this.verify as VerifyFunctionWithRequest)(req, username, password, verified);
      } else {
        (this.verify as VerifyFunction)(username, password, verified);
      }
    } catch (ex) {
      req._passport.error(ex);
    }
  }

  private lookup(obj: any, field: string): any {
    if (!obj) return undefined;
    const chain = field.split(']').join('').split('[');
    for (let i = 0, len = chain.length; i < len; i++) {
      const prop = obj[chain[i]];
      if (typeof prop === 'undefined') return undefined;
      if (typeof prop !== 'object') return prop;
      obj = prop;
    }
    return obj;
  }
}

// Helper for password hashing (would use bcrypt in production)
export async function hashPassword(password: string): Promise<string> {
  // Simple hash for demo - use bcrypt/argon2 in production
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// CLI Demo
if (import.meta.url.includes("passport-local")) {
  console.log("🔑 Passport Local Strategy for Elide - Username/Password Auth\n");

  console.log("=== Creating Local Strategy ===");

  const strategy = new LocalStrategy(
    (username: string, password: string, done: (error: any, user?: any, info?: any) => void) => {
      console.log(`Verifying credentials for: ${username}`);

      // Simulated user database
      const users = [
        { id: 1, username: 'alice', passwordHash: 'hash123' },
        { id: 2, username: 'bob', passwordHash: 'hash456' }
      ];

      const user = users.find(u => u.username === username);

      if (!user) {
        console.log('✗ User not found');
        return done(null, false, { message: 'User not found' });
      }

      if (password !== 'password') {
        console.log('✗ Invalid password');
        return done(null, false, { message: 'Invalid password' });
      }

      console.log('✓ Authentication successful');
      done(null, { id: user.id, username: user.username });
    }
  );

  console.log("✓ Strategy created\n");

  console.log("=== Testing Authentication ===");

  // Mock request with valid credentials
  const mockReq = {
    body: { username: 'alice', password: 'password' },
    _passport: {
      success: (user: any, info: any) => console.log(`✓ Success:`, user),
      fail: (message: string, status: number) => console.log(`✗ Failed (${status}):`, message),
      error: (err: any) => console.log(`✗ Error:`, err)
    }
  };

  console.log("Test 1: Valid credentials");
  strategy.authenticate(mockReq);
  console.log();

  console.log("Test 2: Invalid credentials");
  const invalidReq = {
    body: { username: 'alice', password: 'wrong' },
    _passport: mockReq._passport
  };
  strategy.authenticate(invalidReq);
  console.log();

  console.log("Test 3: Missing credentials");
  const missingReq = {
    body: {},
    _passport: mockReq._passport
  };
  strategy.authenticate(missingReq);
  console.log();

  console.log("=== Custom Field Names ===");
  const customStrategy = new LocalStrategy(
    { usernameField: 'email', passwordField: 'pass' },
    (username, password, done) => {
      console.log(`Custom fields - email: ${username}`);
      done(null, { id: 1, email: username });
    }
  );

  const customReq = {
    body: { email: 'alice@example.com', pass: 'secret' },
    _passport: mockReq._passport
  };
  customStrategy.authenticate(customReq);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Form-based login");
  console.log("- Username/password authentication");
  console.log("- Custom credential fields");
  console.log("- Session-based auth");
  console.log("- Web application login");
  console.log();

  console.log("🚀 Polyglot Benefits:");
  console.log("- 8M+ npm downloads/week");
  console.log("- Zero dependencies");
  console.log("- Works in TypeScript, Python, Ruby, Java");
  console.log("- Instant startup on Elide");
}

export default LocalStrategy;
