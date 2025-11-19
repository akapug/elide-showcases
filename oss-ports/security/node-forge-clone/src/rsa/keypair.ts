/**
 * @elide/forge - RSA Key Pair Generation
 * Generate RSA public/private key pairs
 */

import * as crypto from 'crypto';

export interface RSAKeyPair {
  privateKey: string;
  publicKey: string;
}

export interface RSAKeyPairOptions {
  bits?: number;
  exponent?: number;
  format?: 'pem' | 'der';
}

/**
 * Generate RSA key pair
 */
export async function generateKeyPair(options: RSAKeyPairOptions = {}): Promise<RSAKeyPair> {
  const {
    bits = 2048,
    exponent = 65537,
    format = 'pem'
  } = options;

  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength: bits,
        publicExponent: exponent,
        publicKeyEncoding: {
          type: 'spki',
          format: format
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: format
        }
      },
      (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({ publicKey, privateKey });
        }
      }
    );
  });
}

/**
 * Generate RSA key pair synchronously
 */
export function generateKeyPairSync(options: RSAKeyPairOptions = {}): RSAKeyPair {
  const {
    bits = 2048,
    exponent = 65537,
    format = 'pem'
  } = options;

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: bits,
    publicExponent: exponent,
    publicKeyEncoding: {
      type: 'spki',
      format: format
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: format
    }
  });

  return { publicKey, privateKey };
}

/**
 * Extract public key from private key
 */
export function publicKeyFromPrivateKey(privateKey: string): string {
  const keyObject = crypto.createPrivateKey(privateKey);
  const publicKeyObject = crypto.createPublicKey(keyObject);

  return publicKeyObject.export({
    type: 'spki',
    format: 'pem'
  }) as string;
}

/**
 * Get key info
 */
export function getKeyInfo(key: string): {
  type: 'public' | 'private';
  bits: number;
  format: string;
} {
  let keyObject: crypto.KeyObject;

  try {
    keyObject = crypto.createPrivateKey(key);
    const details = (keyObject as any).asymmetricKeyDetails || {};

    return {
      type: 'private',
      bits: details.modulusLength || 0,
      format: 'pem'
    };
  } catch {
    keyObject = crypto.createPublicKey(key);
    const details = (keyObject as any).asymmetricKeyDetails || {};

    return {
      type: 'public',
      bits: details.modulusLength || 0,
      format: 'pem'
    };
  }
}
