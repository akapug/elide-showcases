/**
 * @elide/forge - RSA Encryption/Decryption
 * RSA public-key encryption and decryption
 */

import * as crypto from 'crypto';

export type RSAPadding = 'pkcs1' | 'oaep';

export interface RSAEncryptOptions {
  padding?: RSAPadding;
  hash?: string;
}

/**
 * Encrypt data with RSA public key
 */
export function publicEncrypt(
  publicKey: string,
  data: Buffer | string,
  options: RSAEncryptOptions = {}
): Buffer {
  const { padding = 'oaep', hash = 'sha256' } = options;

  const buffer = typeof data === 'string' ? Buffer.from(data) : data;

  const paddingScheme = padding === 'oaep'
    ? crypto.constants.RSA_PKCS1_OAEP_PADDING
    : crypto.constants.RSA_PKCS1_PADDING;

  return crypto.publicEncrypt(
    {
      key: publicKey,
      padding: paddingScheme,
      oaepHash: hash
    },
    buffer
  );
}

/**
 * Decrypt data with RSA private key
 */
export function privateDecrypt(
  privateKey: string,
  encryptedData: Buffer,
  options: RSAEncryptOptions = {}
): Buffer {
  const { padding = 'oaep', hash = 'sha256' } = options;

  const paddingScheme = padding === 'oaep'
    ? crypto.constants.RSA_PKCS1_OAEP_PADDING
    : crypto.constants.RSA_PKCS1_PADDING;

  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: paddingScheme,
      oaepHash: hash
    },
    encryptedData
  );
}

/**
 * Encrypt data with RSA private key (for signing)
 */
export function privateEncrypt(
  privateKey: string,
  data: Buffer | string
): Buffer {
  const buffer = typeof data === 'string' ? Buffer.from(data) : data;

  return crypto.privateEncrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING
    },
    buffer
  );
}

/**
 * Decrypt data with RSA public key (for signature verification)
 */
export function publicDecrypt(
  publicKey: string,
  encryptedData: Buffer
): Buffer {
  return crypto.publicDecrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING
    },
    encryptedData
  );
}

/**
 * Encrypt string and return base64
 */
export function encryptString(
  publicKey: string,
  plaintext: string,
  options?: RSAEncryptOptions
): string {
  const encrypted = publicEncrypt(publicKey, plaintext, options);
  return encrypted.toString('base64');
}

/**
 * Decrypt base64 string
 */
export function decryptString(
  privateKey: string,
  ciphertext: string,
  options?: RSAEncryptOptions
): string {
  const buffer = Buffer.from(ciphertext, 'base64');
  const decrypted = privateDecrypt(privateKey, buffer, options);
  return decrypted.toString('utf8');
}
