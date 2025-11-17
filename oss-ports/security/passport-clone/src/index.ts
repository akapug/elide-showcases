/**
 * @elide/passport - Production-ready Authentication Middleware
 * Complete authentication framework for Elide applications
 *
 * @module @elide/passport
 * @author Elide Security Team
 * @license MIT
 */

// Core
export { Authenticator, createPassport } from './authenticator';
export { Strategy } from './strategies/strategy';

// Strategies
export { LocalStrategy, createLocalStrategy } from './strategies/local';
export { JWTStrategy, ExtractJwt, createJWTStrategy } from './strategies/jwt';
export { OAuth2Strategy, createOAuth2Strategy } from './strategies/oauth2';
export { GoogleStrategy, createGoogleStrategy } from './strategies/google';
export { GitHubStrategy, createGitHubStrategy } from './strategies/github';
export { FacebookStrategy, createFacebookStrategy } from './strategies/facebook';
export { TwitterStrategy, createTwitterStrategy } from './strategies/twitter';
export { BearerStrategy, createBearerStrategy } from './strategies/bearer';
export { APIKeyStrategy, createAPIKeyStrategy } from './strategies/apikey';
export { SessionStrategy, createSessionStrategy } from './strategies/session';
export { AnonymousStrategy, createAnonymousStrategy } from './strategies/anonymous';

// Middleware
export {
  authenticate,
  ensureAuthenticated,
  ensureUnauthenticated,
  ensureRole,
  ensurePermission,
  optionalAuthentication
} from './middleware/authenticate';

// Utilities
export {
  SessionStore,
  MemoryStore,
  SessionManager,
  SessionConfig,
  createSessionConfig,
  regenerateSession
} from './utils/session';

// Types
export type {
  DoneCallback,
  VerifyCallback,
  AuthenticateOptions,
  StrategyOptions,
  Strategy as IStrategy,
  SerializeFunction,
  DeserializeFunction,
  SessionManager as ISessionManager,
  Framework,
  User,
  Request,
  Profile,
  OAuth2StrategyOptions,
  JWTStrategyOptions,
  LocalStrategyOptions,
  VerifyFunction,
  JWTVerifyFunction,
  OAuth2VerifyFunction,
  AuthInfo,
  StrategyCreatedStatic,
  MultiStrategyOptions
} from './types';

// Default instance (singleton pattern)
const defaultPassport = createPassport();

/**
 * Initialize Passport
 * @param options - Initialization options
 */
export function initialize(options?: { userProperty?: string }): any {
  return defaultPassport.initialize(options);
}

/**
 * Session middleware
 * @param options - Session options
 */
export function session(options?: any): any {
  return defaultPassport.session(options);
}

/**
 * Register authentication strategy
 * @param name - Strategy name or Strategy instance
 * @param strategy - Strategy instance (if name provided)
 */
export function use(name: string | Strategy, strategy?: Strategy): Authenticator {
  return defaultPassport.use(name, strategy);
}

/**
 * Remove registered strategy
 * @param name - Strategy name
 */
export function unuse(name: string): Authenticator {
  return defaultPassport.unuse(name);
}

/**
 * Register user serializer
 * @param fn - Serialization function
 */
export function serializeUser(fn: any): void {
  return defaultPassport.serializeUser(fn);
}

/**
 * Register user deserializer
 * @param fn - Deserialization function
 */
export function deserializeUser(fn: any): void {
  return defaultPassport.deserializeUser(fn);
}

/**
 * Transform authentication info
 * @param fn - Transform function
 */
export function transformAuthInfo(fn: any): void {
  return defaultPassport.transformAuthInfo(fn);
}

// Export default instance
export default defaultPassport;

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Passport configuration
 */
export interface PassportConfig {
  userProperty?: string;
  enableSessions?: boolean;
  sessionKey?: string;
}

/**
 * Configure Passport with options
 * @param config - Configuration options
 */
export function configure(config: PassportConfig): void {
  if (config.userProperty) {
    (defaultPassport as any)._userProperty = config.userProperty;
  }
  if (config.sessionKey) {
    (defaultPassport as any)._key = config.sessionKey;
  }
}

/**
 * Helper to create custom strategy
 * @param name - Strategy name
 * @param authenticateFn - Authentication function
 */
export function createCustomStrategy(
  name: string,
  authenticateFn: (req: any, options?: any) => void
): Strategy {
  class CustomStrategy extends Strategy {
    constructor() {
      super(name);
    }

    authenticate(req: any, options?: any): void {
      authenticateFn.call(this, req, options);
    }
  }

  return new CustomStrategy();
}

/**
 * Multi-strategy support
 * Chain multiple strategies together
 */
export class MultiStrategy extends Strategy {
  private strategies: Strategy[];
  private mode: 'any' | 'all';

  constructor(strategies: Strategy[], mode: 'any' | 'all' = 'any', name?: string) {
    super(name || 'multi');
    this.strategies = strategies;
    this.mode = mode;
  }

  authenticate(req: any, options?: any): void {
    let successCount = 0;
    let failCount = 0;
    const results: any[] = [];

    const checkComplete = () => {
      if (this.mode === 'any' && successCount > 0) {
        return this.success(results.find(r => r.success)?.user);
      }

      if (this.mode === 'all' && successCount === this.strategies.length) {
        return this.success(results[0]?.user);
      }

      if (successCount + failCount === this.strategies.length) {
        return this.fail({ message: 'Authentication failed' });
      }
    };

    this.strategies.forEach((strategy, index) => {
      const originalSuccess = strategy.success.bind(strategy);
      const originalFail = strategy.fail.bind(strategy);
      const originalError = strategy.error.bind(strategy);

      strategy.success = (user: any, info?: any) => {
        successCount++;
        results.push({ success: true, user, info });
        checkComplete();
      };

      strategy.fail = (challenge?: any, status?: number) => {
        failCount++;
        results.push({ success: false, challenge, status });
        checkComplete();
      };

      strategy.error = (err: Error) => {
        return this.error(err);
      };

      strategy.authenticate(req, options);
    });
  }
}

/**
 * Create multi-strategy authenticator
 * @param strategies - Array of strategies
 * @param mode - Authentication mode ('any' or 'all')
 */
export function createMultiStrategy(
  strategies: Strategy[],
  mode: 'any' | 'all' = 'any'
): MultiStrategy {
  return new MultiStrategy(strategies, mode);
}
