/**
 * @elide/jsonwebtoken - ECDSA Algorithms
 * ES256, ES384, ES512 implementation
 */

import * as crypto from 'crypto';
import { Algorithm, Secret } from '../types';

/**
 * ECDSA algorithm implementation
 */
export class ECDSAAlgorithm {
  private algorithm: string;
  private hashAlgorithm: string;
  private curve: string;

  constructor(algorithm: Algorithm) {
    this.algorithm = algorithm;

    switch (algorithm) {
      case 'ES256':
        this.hashAlgorithm = 'sha256';
        this.curve = 'prime256v1';
        break;
      case 'ES384':
        this.hashAlgorithm = 'sha384';
        this.curve = 'secp384r1';
        break;
      case 'ES512':
        this.hashAlgorithm = 'sha512';
        this.curve = 'secp521r1';
        break;
      default:
        throw new Error(`Unsupported ECDSA algorithm: ${algorithm}`);
    }
  }

  /**
   * Sign data with ECDSA private key
   * @param data - Data to sign
   * @param privateKey - Private key
   */
  sign(data: string, privateKey: Secret): string {
    const key = this.getPrivateKey(privateKey);

    const sign = crypto.createSign(this.hashAlgorithm);
    sign.update(data);
    sign.end();

    const signature = sign.sign({
      key: key as any,
      dsaEncoding: 'ieee-p1363'
    });

    return signature.toString('base64url');
  }

  /**
   * Verify ECDSA signature with public key
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

      return verify.verify({
        key: key as any,
        dsaEncoding: 'ieee-p1363'
      }, signatureBuffer);
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
 * Create ECDSA algorithm instance
 */
export function createECDSAAlgorithm(algorithm: Algorithm): ECDSAAlgorithm {
  return new ECDSAAlgorithm(algorithm);
}

/**
 * Check if algorithm is ECDSA
 */
export function isECDSAAlgorithm(algorithm: Algorithm): boolean {
  return ['ES256', 'ES384', 'ES512'].includes(algorithm);
}
