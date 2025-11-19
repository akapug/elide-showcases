/**
 * @elide/passport - Test Suite
 * Comprehensive tests for Passport authentication
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Authenticator, LocalStrategy, JWTStrategy, ExtractJwt } from '../src';

describe('Passport Authenticator', () => {
  let passport: Authenticator;

  beforeEach(() => {
    passport = new Authenticator();
  });

  describe('Strategy Registration', () => {
    it('should register a strategy by name', () => {
      const strategy = new LocalStrategy((username, password, done) => {
        done(null, { id: '1', username });
      });

      passport.use('local', strategy);
      expect((passport as any)._strategy('local')).toBeDefined();
    });

    it('should register a strategy using strategy name', () => {
      const strategy = new LocalStrategy((username, password, done) => {
        done(null, { id: '1', username });
      });

      passport.use(strategy);
      expect((passport as any)._strategy('local')).toBeDefined();
    });

    it('should unregister a strategy', () => {
      const strategy = new LocalStrategy((username, password, done) => {
        done(null, { id: '1', username });
      });

      passport.use(strategy);
      passport.unuse('local');
      expect((passport as any)._strategy('local')).toBeUndefined();
    });
  });

  describe('User Serialization', () => {
    it('should serialize user', (done) => {
      passport.serializeUser((user: any, cb) => {
        cb(null, user.id);
      });

      const user = { id: '123', username: 'test' };
      (passport as any)._serializeUser(user, (err: any, id: string) => {
        expect(err).toBeNull();
        expect(id).toBe('123');
        done();
      });
    });

    it('should deserialize user', (done) => {
      passport.deserializeUser((id: string, cb) => {
        cb(null, { id, username: 'test' });
      });

      (passport as any)._deserializeUser('123', (err: any, user: any) => {
        expect(err).toBeNull();
        expect(user.id).toBe('123');
        expect(user.username).toBe('test');
        done();
      });
    });
  });
});

describe('LocalStrategy', () => {
  it('should authenticate with valid credentials', (done) => {
    const strategy = new LocalStrategy((username, password, cb) => {
      if (username === 'test' && password === 'password') {
        return cb(null, { id: '1', username: 'test' });
      }
      cb(null, false);
    });

    const req = {
      body: { username: 'test', password: 'password' },
      query: {},
      headers: {},
      isAuthenticated: () => false,
      isUnauthenticated: () => true
    };

    strategy.success = (user: any) => {
      expect(user.username).toBe('test');
      done();
    };

    strategy.authenticate(req);
  });

  it('should fail with invalid credentials', (done) => {
    const strategy = new LocalStrategy((username, password, cb) => {
      if (username === 'test' && password === 'password') {
        return cb(null, { id: '1', username: 'test' });
      }
      cb(null, false, { message: 'Invalid credentials' });
    });

    const req = {
      body: { username: 'test', password: 'wrong' },
      query: {},
      headers: {},
      isAuthenticated: () => false,
      isUnauthenticated: () => true
    };

    strategy.fail = (info: any) => {
      expect(info.message).toBe('Invalid credentials');
      done();
    };

    strategy.authenticate(req);
  });
});

describe('JWTStrategy', () => {
  const jwtOptions = {
    secretOrKey: 'test-secret',
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
  };

  it('should extract JWT from Authorization header', () => {
    const extractor = ExtractJwt.fromAuthHeaderAsBearerToken();
    const req = {
      headers: { authorization: 'Bearer test-token' }
    };

    const token = extractor(req as any);
    expect(token).toBe('test-token');
  });

  it('should extract JWT from query parameter', () => {
    const extractor = ExtractJwt.fromUrlQueryParameter('token');
    const req = {
      query: { token: 'test-token' }
    };

    const token = extractor(req as any);
    expect(token).toBe('test-token');
  });

  it('should try multiple extractors', () => {
    const extractor = ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      ExtractJwt.fromUrlQueryParameter('token')
    ]);

    const req = {
      headers: {},
      query: { token: 'test-token' }
    };

    const token = extractor(req as any);
    expect(token).toBe('test-token');
  });
});
