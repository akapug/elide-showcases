/**
 * @elide/jsonwebtoken - Test Suite
 * Comprehensive tests for JWT operations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { sign, verify, decode, TokenExpiredError, NotBeforeError, JsonWebTokenError } from '../src';

describe('JWT Sign', () => {
  it('should sign a JWT with default algorithm', () => {
    const payload = { userId: '123', role: 'user' };
    const secret = 'test-secret';

    const token = sign(payload, secret);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should sign a JWT with HS256', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { algorithm: 'HS256' });

    expect(token).toBeDefined();
  });

  it('should include expiration claim', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { expiresIn: '1h' });
    const decoded: any = decode(token);

    expect(decoded.exp).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('should include issued at claim by default', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret);
    const decoded: any = decode(token);

    expect(decoded.iat).toBeDefined();
  });

  it('should not include issued at when noTimestamp is true', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { noTimestamp: true });
    const decoded: any = decode(token);

    expect(decoded.iat).toBeUndefined();
  });

  it('should include issuer claim', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { issuer: 'my-app' });
    const decoded: any = decode(token);

    expect(decoded.iss).toBe('my-app');
  });

  it('should include audience claim', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { audience: 'my-api' });
    const decoded: any = decode(token);

    expect(decoded.aud).toBe('my-api');
  });

  it('should include subject claim', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { subject: 'user-123' });
    const decoded: any = decode(token);

    expect(decoded.sub).toBe('user-123');
  });

  it('should include JWT ID claim', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { jwtid: 'unique-id-123' });
    const decoded: any = decode(token);

    expect(decoded.jti).toBe('unique-id-123');
  });

  it('should include not before claim', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { notBefore: '10s' });
    const decoded: any = decode(token);

    expect(decoded.nbf).toBeDefined();
  });
});

describe('JWT Verify', () => {
  it('should verify a valid token', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret);
    const verified: any = verify(token, secret);

    expect(verified.userId).toBe('123');
  });

  it('should throw on invalid signature', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret);

    expect(() => {
      verify(token, 'wrong-secret');
    }).toThrow(JsonWebTokenError);
  });

  it('should throw on expired token', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { expiresIn: -1 });

    expect(() => {
      verify(token, secret);
    }).toThrow(TokenExpiredError);
  });

  it('should not throw on expired token when ignoreExpiration is true', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { expiresIn: -1 });

    expect(() => {
      verify(token, secret, { ignoreExpiration: true });
    }).not.toThrow();
  });

  it('should verify issuer', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { issuer: 'my-app' });

    expect(() => {
      verify(token, secret, { issuer: 'my-app' });
    }).not.toThrow();

    expect(() => {
      verify(token, secret, { issuer: 'wrong-app' });
    }).toThrow(JsonWebTokenError);
  });

  it('should verify audience', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { audience: 'my-api' });

    expect(() => {
      verify(token, secret, { audience: 'my-api' });
    }).not.toThrow();

    expect(() => {
      verify(token, secret, { audience: 'wrong-api' });
    }).toThrow(JsonWebTokenError);
  });

  it('should verify subject', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { subject: 'user-123' });

    expect(() => {
      verify(token, secret, { subject: 'user-123' });
    }).not.toThrow();

    expect(() => {
      verify(token, secret, { subject: 'wrong-user' });
    }).toThrow(JsonWebTokenError);
  });

  it('should verify JWT ID', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { jwtid: 'id-123' });

    expect(() => {
      verify(token, secret, { jwtid: 'id-123' });
    }).not.toThrow();

    expect(() => {
      verify(token, secret, { jwtid: 'wrong-id' });
    }).toThrow(JsonWebTokenError);
  });

  it('should check algorithms', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { algorithm: 'HS256' });

    expect(() => {
      verify(token, secret, { algorithms: ['HS256'] });
    }).not.toThrow();

    expect(() => {
      verify(token, secret, { algorithms: ['HS512'] });
    }).toThrow(JsonWebTokenError);
  });

  it('should throw on not before claim', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { notBefore: '10m' });

    expect(() => {
      verify(token, secret);
    }).toThrow(NotBeforeError);
  });

  it('should not throw on not before when ignoreNotBefore is true', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { notBefore: '10m' });

    expect(() => {
      verify(token, secret, { ignoreNotBefore: true });
    }).not.toThrow();
  });

  it('should verify max age', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret);

    expect(() => {
      verify(token, secret, { maxAge: '1h' });
    }).not.toThrow();

    expect(() => {
      verify(token, secret, { maxAge: -1 });
    }).toThrow(TokenExpiredError);
  });

  it('should return complete result when complete is true', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret);
    const result: any = verify(token, secret, { complete: true });

    expect(result.header).toBeDefined();
    expect(result.payload).toBeDefined();
    expect(result.header.alg).toBe('HS256');
    expect(result.payload.userId).toBe('123');
  });
});

describe('JWT Decode', () => {
  it('should decode token without verification', () => {
    const payload = { userId: '123', role: 'admin' };
    const secret = 'test-secret';

    const token = sign(payload, secret);
    const decoded: any = decode(token);

    expect(decoded.userId).toBe('123');
    expect(decoded.role).toBe('admin');
  });

  it('should decode with complete option', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret);
    const decoded: any = decode(token, { complete: true });

    expect(decoded.header).toBeDefined();
    expect(decoded.payload).toBeDefined();
    expect(decoded.signature).toBeDefined();
  });

  it('should return null for invalid token', () => {
    expect(() => {
      decode('invalid.token');
    }).toThrow(JsonWebTokenError);
  });
});

describe('JWT Utilities', () => {
  it('should check if token is expired', () => {
    const { isTokenExpired } = require('../src/decode');

    const secret = 'test-secret';

    const expiredToken = sign({ userId: '123' }, secret, { expiresIn: -1 });
    expect(isTokenExpired(expiredToken)).toBe(true);

    const validToken = sign({ userId: '123' }, secret, { expiresIn: '1h' });
    expect(isTokenExpired(validToken)).toBe(false);
  });

  it('should get token expiration', () => {
    const { getTokenExpiration } = require('../src/decode');

    const secret = 'test-secret';
    const token = sign({ userId: '123' }, secret, { expiresIn: '1h' });

    const expiration = getTokenExpiration(token);
    expect(expiration).toBeInstanceOf(Date);
  });

  it('should get token issuer', () => {
    const { getTokenIssuer } = require('../src/decode');

    const secret = 'test-secret';
    const token = sign({ userId: '123' }, secret, { issuer: 'my-app' });

    const issuer = getTokenIssuer(token);
    expect(issuer).toBe('my-app');
  });

  it('should get token subject', () => {
    const { getTokenSubject } = require('../src/decode');

    const secret = 'test-secret';
    const token = sign({ userId: '123' }, secret, { subject: 'user-123' });

    const subject = getTokenSubject(token);
    expect(subject).toBe('user-123');
  });
});

describe('Error Handling', () => {
  it('should throw TokenExpiredError with expiredAt', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { expiresIn: -1 });

    try {
      verify(token, secret);
      fail('Should have thrown TokenExpiredError');
    } catch (error) {
      expect(error).toBeInstanceOf(TokenExpiredError);
      expect((error as TokenExpiredError).expiredAt).toBeInstanceOf(Date);
    }
  });

  it('should throw NotBeforeError with date', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret, { notBefore: '10m' });

    try {
      verify(token, secret);
      fail('Should have thrown NotBeforeError');
    } catch (error) {
      expect(error).toBeInstanceOf(NotBeforeError);
      expect((error as NotBeforeError).date).toBeInstanceOf(Date);
    }
  });

  it('should throw JsonWebTokenError with message', () => {
    const payload = { userId: '123' };
    const secret = 'test-secret';

    const token = sign(payload, secret);

    try {
      verify(token, 'wrong-secret');
      fail('Should have thrown JsonWebTokenError');
    } catch (error) {
      expect(error).toBeInstanceOf(JsonWebTokenError);
      expect((error as JsonWebTokenError).message).toBeTruthy();
    }
  });
});
