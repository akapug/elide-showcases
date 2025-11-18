/**
 * Passport Authentication Middleware for Elide
 *
 * Core authentication features:
 * - Strategy-based authentication
 * - Session management
 * - User serialization/deserialization
 * - Middleware integration
 * - Multi-strategy support
 * - Extensible authentication
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 15M+ downloads/week
 */

export interface User {
  id: string | number;
  [key: string]: any;
}

export interface AuthInfo {
  scope?: string[];
  [key: string]: any;
}

export interface Strategy {
  name: string;
  authenticate(req: any, options?: any): void;
}

export type SerializeFunction = (user: User, done: (err: any, id?: any) => void) => void;
export type DeserializeFunction = (id: any, done: (err: any, user?: User | false) => void) => void;
export type VerifyFunction = (...args: any[]) => void;

export class Passport {
  private strategies: Map<string, Strategy> = new Map();
  private serializers: SerializeFunction[] = [];
  private deserializers: DeserializeFunction[] = [];
  private userProperty: string = 'user';

  use(strategy: Strategy): this;
  use(name: string, strategy: Strategy): this;
  use(nameOrStrategy: string | Strategy, strategy?: Strategy): this {
    if (typeof nameOrStrategy === 'string' && strategy) {
      this.strategies.set(nameOrStrategy, strategy);
    } else if (typeof nameOrStrategy === 'object') {
      this.strategies.set(nameOrStrategy.name, nameOrStrategy);
    }
    return this;
  }

  unuse(name: string): this {
    this.strategies.delete(name);
    return this;
  }

  authenticate(strategyName: string, options?: any): (req: any, res: any, next: any) => void {
    return (req: any, res: any, next: any) => {
      const strategy = this.strategies.get(strategyName);
      if (!strategy) {
        throw new Error(`Unknown authentication strategy: ${strategyName}`);
      }

      // Store passport instance on request
      req._passport = this;

      // Create success handler
      const success = (user: User, info?: AuthInfo) => {
        req.login(user, (err: any) => {
          if (err) return next(err);
          if (options?.successRedirect) {
            return res.redirect(options.successRedirect);
          }
          next();
        });
      };

      // Create fail handler
      const fail = (challenge?: any, status?: number) => {
        if (options?.failureRedirect) {
          return res.redirect(options.failureRedirect);
        }
        res.status(status || 401).json({ error: challenge || 'Unauthorized' });
      };

      // Create error handler
      const error = (err: any) => {
        next(err);
      };

      // Attach handlers to request
      req._passport.success = success;
      req._passport.fail = fail;
      req._passport.error = error;

      // Execute strategy
      strategy.authenticate(req, options);
    };
  }

  serializeUser(fn: SerializeFunction): void {
    this.serializers.push(fn);
  }

  deserializeUser(fn: DeserializeFunction): void {
    this.deserializers.push(fn);
  }

  async serializeUserAsync(user: User): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.serializers.length === 0) {
        return resolve(user);
      }
      this.serializers[0](user, (err, id) => {
        if (err) reject(err);
        else resolve(id);
      });
    });
  }

  async deserializeUserAsync(id: any): Promise<User | false> {
    return new Promise((resolve, reject) => {
      if (this.deserializers.length === 0) {
        return resolve(id);
      }
      this.deserializers[0](id, (err, user) => {
        if (err) reject(err);
        else resolve(user || false);
      });
    });
  }

  initialize(): (req: any, res: any, next: any) => void {
    return (req: any, res: any, next: any) => {
      req._passport = this;
      req.login = req.logIn = (user: User, done: (err: any) => void) => {
        this.serializeUserAsync(user).then(id => {
          if (req.session) {
            req.session.passport = { user: id };
          }
          req[this.userProperty] = user;
          done(null);
        }).catch(done);
      };
      req.logout = req.logOut = (done: (err?: any) => void) => {
        if (req.session && req.session.passport) {
          delete req.session.passport;
        }
        req[this.userProperty] = null;
        done();
      };
      req.isAuthenticated = () => !!req[this.userProperty];
      req.isUnauthenticated = () => !req[this.userProperty];
      next();
    };
  }

  session(): (req: any, res: any, next: any) => void {
    return (req: any, res: any, next: any) => {
      if (!req.session) {
        return next(new Error('Session support required'));
      }

      if (req.session.passport && req.session.passport.user) {
        this.deserializeUserAsync(req.session.passport.user)
          .then(user => {
            if (user) {
              req[this.userProperty] = user;
            }
            next();
          })
          .catch(next);
      } else {
        next();
      }
    };
  }
}

// Create default instance
export const passport = new Passport();

// CLI Demo
if (import.meta.url.includes("passport")) {
  console.log("🔐 Passport for Elide - Authentication Middleware\n");

  console.log("=== Basic Setup ===");
  const app = new Passport();

  // Configure serialization
  app.serializeUser((user, done) => {
    console.log(`Serializing user: ${user.id}`);
    done(null, user.id);
  });

  app.deserializeUser((id, done) => {
    console.log(`Deserializing user: ${id}`);
    done(null, { id, username: 'demo' });
  });

  console.log("✓ Serialization configured\n");

  console.log("=== Example Strategy ===");
  class LocalStrategy implements Strategy {
    name = 'local';
    authenticate(req: any, options?: any) {
      const { username, password } = req.body || {};
      if (username === 'demo' && password === 'password') {
        req._passport.success({ id: 1, username: 'demo' });
      } else {
        req._passport.fail('Invalid credentials', 401);
      }
    }
  }

  app.use(new LocalStrategy());
  console.log("✓ Local strategy registered\n");

  console.log("=== Mock Authentication ===");
  const mockReq = {
    body: { username: 'demo', password: 'password' },
    session: {},
    login: (user: User, done: (err: any) => void) => {
      console.log(`✓ User logged in: ${user.username}`);
      done(null);
    }
  };
  const mockRes = {
    redirect: (url: string) => console.log(`Redirect to: ${url}`),
    status: (code: number) => ({ json: (data: any) => console.log(`Response ${code}:`, data) })
  };
  const mockNext = () => console.log("Next middleware called");

  console.log("Authenticating with valid credentials...");
  app.authenticate('local')(mockReq, mockRes, mockNext);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- User authentication");
  console.log("- Session management");
  console.log("- OAuth integration");
  console.log("- Multi-strategy auth");
  console.log("- API authentication");
  console.log();

  console.log("🚀 Polyglot Benefits:");
  console.log("- 15M+ npm downloads/week");
  console.log("- Zero dependencies");
  console.log("- Works in TypeScript, Python, Ruby, Java");
  console.log("- Instant startup on Elide");
}

export default passport;
