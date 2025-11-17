/**
 * @elide/jsonwebtoken - HMAC Algorithms
 * HS256, HS384, HS512 implementation
 */

import * as crypto from 'crypto';
import { Algorithm, Secret } from '../types';

/**
 * HMAC algorithm implementation
 */
export class HMACAlgorithm {
  private algorithm: string;
  private hashAlgorithm: string;

  constructor(algorithm: Algorithm) {
    this.algorithm = algorithm;

    switch (algorithm) {
      case 'HS256':
        this.hashAlgorithm = 'sha256';
        break;
      case 'HS384':
        this.hashAlgorithm = 'sha384';
        break;
      case 'HS512':
        this.hashAlgorithm = 'sha512';
        break;
      default:
        throw new Error(`Unsupported HMAC algorithm: ${algorithm}`);
    }
  }

  /**
   * Sign data with HMAC
   * @param data - Data to sign
   * @param secret - Secret key
   */
  sign(data: string, secret: Secret): string {
    const key = this.getKey(secret);
    const hmac = crypto.createHmac(this.hashAlgorithm, key);
    hmac.update(data);
    return hmac.digest('base64url');
  }

  /**
   * Verify HMAC signature
   * @param data - Original data
   * @param signature - Signature to verify
   * @param secret - Secret key
   */
  verify(data: string, signature: string, secret: Secret): boolean {
    const expectedSignature = this.sign(data, secret);
    return this.timingSafeEqual(signature, expectedSignature);
  }

  /**
   * Get key from secret
   */
  private getKey(secret: Secret): Buffer | string {
    if (typeof secret === 'string') {
      return secret;
    }

    if (Buffer.isBuffer(secret)) {
      return secret;
    }

    if (typeof secret === 'object' && 'key' in secret) {
      return secret.key;
    }

    throw new Error('Invalid secret type for HMAC');
  }

  /**
   * Timing-safe string comparison
   * Prevents timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    return crypto.timingSafeEqual(bufA, bufB);
  }
}

/**
 * Create HMAC algorithm instance
 */
export function createHMACAlgorithm(algorithm: Algorithm): HMACAlgorithm {
  return new HMACAlgorithm(algorithm);
}

/**
 * Check if algorithm is HMAC
 */
export function isHMACAlgorithm(algorithm: Algorithm): boolean {
  return ['HS256', 'HS384', 'HS512'].includes(algorithm);
}
