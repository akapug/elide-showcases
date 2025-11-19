/**
 * @elide/forge - AES Cipher
 * AES encryption and decryption
 */

import * as crypto from 'crypto';

export type AESMode = 'cbc' | 'gcm' | 'ctr' | 'ecb';
export type AESKeySize = 128 | 192 | 256;

export interface AESEncryptOptions {
  mode?: AESMode;
  keySize?: AESKeySize;
  iv?: Buffer;
  tag?: Buffer;
}

export interface AESEncryptResult {
  ciphertext: Buffer;
  iv: Buffer;
  tag?: Buffer;
}

/**
 * Encrypt data with AES
 */
export function encrypt(
  key: Buffer | string,
  data: Buffer | string,
  options: AESEncryptOptions = {}
): AESEncryptResult {
  const { mode = 'gcm', keySize = 256 } = options;

  const keyBuffer = typeof key === 'string' ? Buffer.from(key) : key;
  const dataBuffer = typeof data === 'string' ? Buffer.from(data) : data;

  // Generate IV if not provided
  const iv = options.iv || crypto.randomBytes(mode === 'gcm' ? 12 : 16);

  // Ensure key is correct size
  const validKey = ensureKeySize(keyBuffer, keySize);

  const algorithm = `aes-${keySize}-${mode}`;
  const cipher = crypto.createCipheriv(algorithm, validKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(dataBuffer),
    cipher.final()
  ]);

  const result: AESEncryptResult = {
    ciphertext: encrypted,
    iv
  };

  // Add auth tag for GCM mode
  if (mode === 'gcm') {
    result.tag = (cipher as crypto.CipherGCM).getAuthTag();
  }

  return result;
}

/**
 * Decrypt data with AES
 */
export function decrypt(
  key: Buffer | string,
  encryptedData: Buffer,
  iv: Buffer,
  options: AESEncryptOptions = {}
): Buffer {
  const { mode = 'gcm', keySize = 256, tag } = options;

  const keyBuffer = typeof key === 'string' ? Buffer.from(key) : key;

  // Ensure key is correct size
  const validKey = ensureKeySize(keyBuffer, keySize);

  const algorithm = `aes-${keySize}-${mode}`;
  const decipher = crypto.createDecipheriv(algorithm, validKey, iv);

  // Set auth tag for GCM mode
  if (mode === 'gcm' && tag) {
    (decipher as crypto.DecipherGCM).setAuthTag(tag);
  }

  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);
}

/**
 * Ensure key is correct size
 */
function ensureKeySize(key: Buffer, keySize: AESKeySize): Buffer {
  const requiredBytes = keySize / 8;

  if (key.length === requiredBytes) {
    return key;
  }

  if (key.length > requiredBytes) {
    return key.slice(0, requiredBytes);
  }

  // Pad key if too short
  const padded = Buffer.alloc(requiredBytes);
  key.copy(padded);
  return padded;
}

/**
 * Encrypt string and return base64
 */
export function encryptString(
  key: string,
  plaintext: string,
  options?: AESEncryptOptions
): { ciphertext: string; iv: string; tag?: string } {
  const result = encrypt(key, plaintext, options);

  return {
    ciphertext: result.ciphertext.toString('base64'),
    iv: result.iv.toString('base64'),
    tag: result.tag?.toString('base64')
  };
}

/**
 * Decrypt base64 string
 */
export function decryptString(
  key: string,
  ciphertext: string,
  iv: string,
  options?: AESEncryptOptions & { tag?: string }
): string {
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
  const ivBuffer = Buffer.from(iv, 'base64');

  const decryptOptions = { ...options };
  if (options?.tag) {
    decryptOptions.tag = Buffer.from(options.tag, 'base64');
  }

  const decrypted = decrypt(key, ciphertextBuffer, ivBuffer, decryptOptions);
  return decrypted.toString('utf8');
}
