/**
 * @elide/jsonwebtoken - RSA Algorithms
 * RS256, RS384, RS512 implementation
 */

import * as crypto from 'crypto';
import { Algorithm, Secret } from '../types';

/**
 * RSA algorithm implementation
 */
export class RSAAlgorithm {
  private algorithm: string;
  private hashAlgorithm: string;

  constructor(algorithm: Algorithm) {
    this.algorithm = algorithm;

    switch (algorithm) {
      case 'RS256':
        this.hashAlgorithm = 'sha256';
        break;
      case 'RS384':
        this.hashAlgorithm = 'sha384';
        break;
      case 'RS512':
        this.hashAlgorithm = 'sha512';
        break;
      default:
        throw new Error(`Unsupported RSA algorithm: ${algorithm}`);
    }
  }

  /**
   * Sign data with RSA private key
   * @param data - Data to sign
   * @param privateKey - Private key
   */
  sign(data: string, privateKey: Secret): string {
    const key = this.getPrivateKey(privateKey);

    const sign = crypto.createSign(this.hashAlgorithm);
    sign.update(data);
    sign.end();

    const signature = sign.sign(key);
    return signature.toString('base64url');
  }

  /**
   * Verify RSA signature with public key
   * @param data - Original data
   * @param signature - Signature to verify
   * @param publicKey - Public key
   */
  verify(data: string, signature: string, publicKey: Secret): boolean {
    try {
      const key = this.getPublicKey(publicKey);
      const signatureBuffer = Buffer.from(signature, 'base64url');

      const verify = crypto.createVerify(this.hashAlgorithm);
      verify.update(data);
      verify.end();

      return verify.verify(key, signatureBuffer);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get private key from secret
   */
  private getPrivateKey(secret: Secret): crypto.KeyObject | string | Buffer {
    if (typeof secret === 'string') {
      return secret;
    }

    if (Buffer.isBuffer(secret)) {
      return secret;
    }

    if (typeof secret === 'object' && 'key' in secret) {
      if (typeof secret.passphrase === 'string') {
        return {
          key: secret.key,
          passphrase: secret.passphrase
        } as any;
      }
      return secret.key;
    }

    throw new Error('Invalid private key format');
  }

  /**
   * Get public key from secret
   */
  private getPublicKey(secret: Secret): crypto.KeyObject | string | Buffer {
    if (typeof secret === 'string') {
      return secret;
    }

    if (Buffer.isBuffer(secret)) {
      return secret;
    }

    if (typeof secret === 'object' && 'key' in secret) {
      return secret.key;
    }

    throw new Error('Invalid public key format');
  }
}

/**
 * Create RSA algorithm instance
 */
export function createRSAAlgorithm(algorithm: Algorithm): RSAAlgorithm {
  return new RSAAlgorithm(algorithm);
}

/**
 * Check if algorithm is RSA
 */
export function isRSAAlgorithm(algorithm: Algorithm): boolean {
  return ['RS256', 'RS384', 'RS512'].includes(algorithm);
}
