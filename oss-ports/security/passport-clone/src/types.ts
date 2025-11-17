/**
 * @elide/passport - Type Definitions
 * Production-ready authentication middleware for Elide
 */

export type DoneCallback = (error: Error | null, user?: any, info?: any) => void;
export type VerifyCallback = DoneCallback;

export interface AuthenticateOptions {
  session?: boolean;
  successRedirect?: string;
  failureRedirect?: string;
  failureFlash?: boolean | string;
  successFlash?: boolean | string;
  successMessage?: boolean | string;
  failureMessage?: boolean | string;
  failWithError?: boolean;
  assignProperty?: string;
  scope?: string | string[];
  state?: string;
  callbackURL?: string;
  passReqToCallback?: boolean;
}

export interface StrategyOptions {
  name?: string;
  passReqToCallback?: boolean;
}

export interface Strategy {
  name: string;
  authenticate(req: any, options?: any): void;
}

export interface SerializeFunction {
  (user: any, done: DoneCallback): void;
}

export interface DeserializeFunction {
  (serialized: any, done: DoneCallback): void;
}

export interface SessionManager {
  logIn(req: any, user: any, options: any, done: DoneCallback): void;
  logOut(req: any, done: DoneCallback): void;
}

export interface Framework {
  initialize(passport: any, options?: any): (req: any, res: any, next: any) => void;
  authenticate(passport: any, name: string | string[], options?: AuthenticateOptions): any;
}

export interface User {
  id: string | number;
  username?: string;
  email?: string;
  [key: string]: any;
}

export interface Request {
  user?: User;
  session?: any;
  login: (user: User, done: DoneCallback) => void;
  logout: (done: DoneCallback) => void;
  isAuthenticated: () => boolean;
  isUnauthenticated: () => boolean;
  headers: Record<string, string>;
  query: Record<string, any>;
  body: Record<string, any>;
  params: Record<string, any>;
  [key: string]: any;
}

export interface Profile {
  provider: string;
  id: string;
  displayName?: string;
  name?: {
    familyName?: string;
    givenName?: string;
    middleName?: string;
  };
  emails?: Array<{
    value: string;
    type?: string;
  }>;
  photos?: Array<{
    value: string;
  }>;
  username?: string;
  _raw?: string;
  _json?: any;
}

export interface OAuth2StrategyOptions extends StrategyOptions {
  authorizationURL: string;
  tokenURL: string;
  clientID: string;
  clientSecret: string;
  callbackURL?: string;
  scope?: string | string[];
  state?: boolean | string;
  scopeSeparator?: string;
  sessionKey?: string;
  store?: any;
  trustProxy?: boolean;
  customHeaders?: Record<string, string>;
  skipUserProfile?: boolean;
}

export interface JWTStrategyOptions extends StrategyOptions {
  secretOrKey: string | Buffer;
  secretOrKeyProvider?: (request: any, rawJwtToken: any, done: (err: any, secretOrKey?: any) => void) => void;
  jwtFromRequest: (request: any) => string | null;
  issuer?: string;
  audience?: string;
  algorithms?: string[];
  ignoreExpiration?: boolean;
  passReqToCallback?: boolean;
  jsonWebTokenOptions?: {
    maxAge?: string;
    clockTolerance?: number;
    clockTimestamp?: number;
  };
}

export interface LocalStrategyOptions extends StrategyOptions {
  usernameField?: string;
  passwordField?: string;
  session?: boolean;
  passReqToCallback?: boolean;
}

export interface VerifyFunction {
  (username: string, password: string, done: VerifyCallback): void;
  (req: any, username: string, password: string, done: VerifyCallback): void;
}

export interface JWTVerifyFunction {
  (payload: any, done: VerifyCallback): void;
  (req: any, payload: any, done: VerifyCallback): void;
}

export interface OAuth2VerifyFunction {
  (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): void;
  (req: any, accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): void;
}

export interface AuthInfo {
  scope?: string;
  message?: string;
  [key: string]: any;
}

export interface StrategyCreatedStatic {
  new (...args: any[]): Strategy;
}

export interface MultiStrategyOptions {
  strategies: string[];
  preferredStrategy?: string;
}
