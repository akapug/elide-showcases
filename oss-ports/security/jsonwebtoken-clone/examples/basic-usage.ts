/**
 * @elide/jsonwebtoken - Basic Usage Example
 * Demonstrates JWT signing, verification, and decoding
 */

import {
  sign,
  verify,
  decode,
  TokenExpiredError,
  NotBeforeError,
  JsonWebTokenError
} from '@elide/jsonwebtoken';

// Example 1: Simple sign and verify
function example1() {
  console.log('=== Example 1: Simple Sign and Verify ===');

  const payload = {
    userId: '123',
    username: 'john.doe',
    role: 'admin'
  };

  // Sign token
  const token = sign(payload, 'my-secret-key', {
    expiresIn: '1h'
  });

  console.log('Token:', token);

  // Verify token
  try {
    const decoded = verify(token, 'my-secret-key');
    console.log('Decoded:', decoded);
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

// Example 2: Access and refresh tokens
function example2() {
  console.log('\n=== Example 2: Access and Refresh Tokens ===');

  const user = { id: '456', email: 'user@example.com' };

  // Generate access token (short-lived)
  const accessToken = sign(
    { userId: user.id, type: 'access' },
    'access-secret',
    { expiresIn: '15m' }
  );

  // Generate refresh token (long-lived)
  const refreshToken = sign(
    { userId: user.id, type: 'refresh' },
    'refresh-secret',
    { expiresIn: '7d' }
  );

  console.log('Access Token:', accessToken);
  console.log('Refresh Token:', refreshToken);

  // Verify tokens
  const accessPayload = verify(accessToken, 'access-secret');
  const refreshPayload = verify(refreshToken, 'refresh-secret');

  console.log('Access Payload:', accessPayload);
  console.log('Refresh Payload:', refreshPayload);
}

// Example 3: Custom claims
function example3() {
  console.log('\n=== Example 3: Custom Claims ===');

  const token = sign(
    {
      userId: '789',
      email: 'admin@example.com',
      permissions: ['read', 'write', 'delete'],
      metadata: {
        loginIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      }
    },
    'secret',
    {
      expiresIn: '2h',
      issuer: 'my-app',
      audience: 'my-api',
      subject: 'user-789'
    }
  );

  console.log('Token with custom claims:', token);

  const decoded = verify(token, 'secret', {
    issuer: 'my-app',
    audience: 'my-api'
  });

  console.log('Decoded:', decoded);
}

// Example 4: Error handling
function example4() {
  console.log('\n=== Example 4: Error Handling ===');

  // Create an expired token
  const expiredToken = sign(
    { userId: '999' },
    'secret',
    { expiresIn: -1 } // Already expired
  );

  try {
    verify(expiredToken, 'secret');
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.log('Token expired at:', error.expiredAt);
    }
  }

  // Invalid signature
  try {
    verify(expiredToken, 'wrong-secret');
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      console.log('Token error:', error.message);
    }
  }

  // Not before
  const notYetValidToken = sign(
    { userId: '888' },
    'secret',
    { notBefore: '1h' }
  );

  try {
    verify(notYetValidToken, 'secret');
  } catch (error) {
    if (error instanceof NotBeforeError) {
      console.log('Token not valid until:', error.date);
    }
  }
}

// Example 5: Decode without verification
function example5() {
  console.log('\n=== Example 5: Decode Without Verification ===');

  const token = sign(
    { userId: '111', role: 'user' },
    'secret'
  );

  // Simple decode
  const payload = decode(token);
  console.log('Payload:', payload);

  // Complete decode with header
  const complete = decode(token, { complete: true });
  console.log('Header:', complete.header);
  console.log('Payload:', complete.payload);
  console.log('Signature:', complete.signature);
}

// Run all examples
export function runExamples() {
  example1();
  example2();
  example3();
  example4();
  example5();
}

// Run if executed directly
if (require.main === module) {
  runExamples();
}
