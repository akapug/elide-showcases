/**
 * @elide/forge - Message Digest (Hash Functions)
 * SHA, MD5, and other hash functions
 */

import * as crypto from 'crypto';

export type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'sha3-256' | 'sha3-384' | 'sha3-512';

/**
 * Create message digest
 */
export class MessageDigest {
  private hash: crypto.Hash;
  private algorithm: HashAlgorithm;

  constructor(algorithm: HashAlgorithm = 'sha256') {
    this.algorithm = algorithm;
    this.hash = crypto.createHash(algorithm);
  }

  /**
   * Update digest with data
   */
  update(data: string | Buffer): this {
    this.hash.update(data);
    return this;
  }

  /**
   * Get digest as Buffer
   */
  digest(): Buffer {
    return this.hash.digest();
  }

  /**
   * Get digest as hex string
   */
  digestHex(): string {
    return this.hash.digest('hex');
  }

  /**
   * Get digest as base64 string
   */
  digestBase64(): string {
    return this.hash.digest('base64');
  }
}

/**
 * Hash data with specified algorithm
 */
export function hash(
  algorithm: HashAlgorithm,
  data: string | Buffer
): Buffer {
  return crypto.createHash(algorithm).update(data).digest();
}

/**
 * Hash data and return hex
 */
export function hashHex(
  algorithm: HashAlgorithm,
  data: string | Buffer
): string {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

/**
 * Hash data and return base64
 */
export function hashBase64(
  algorithm: HashAlgorithm,
  data: string | Buffer
): string {
  return crypto.createHash(algorithm).update(data).digest('base64');
}

/**
 * MD5 hash
 */
export function md5(data: string | Buffer): Buffer {
  return hash('md5', data);
}

/**
 * SHA-1 hash
 */
export function sha1(data: string | Buffer): Buffer {
  return hash('sha1', data);
}

/**
 * SHA-256 hash
 */
export function sha256(data: string | Buffer): Buffer {
  return hash('sha256', data);
}

/**
 * SHA-384 hash
 */
export function sha384(data: string | Buffer): Buffer {
  return hash('sha384', data);
}

/**
 * SHA-512 hash
 */
export function sha512(data: string | Buffer): Buffer {
  return hash('sha512', data);
}

/**
 * HMAC (Hash-based Message Authentication Code)
 */
export class HMAC {
  private hmac: crypto.Hmac;

  constructor(algorithm: HashAlgorithm, key: string | Buffer) {
    this.hmac = crypto.createHmac(algorithm, key);
  }

  update(data: string | Buffer): this {
    this.hmac.update(data);
    return this;
  }

  digest(): Buffer {
    return this.hmac.digest();
  }

  digestHex(): string {
    return this.hmac.digest('hex');
  }

  digestBase64(): string {
    return this.hmac.digest('base64');
  }
}

/**
 * Create HMAC
 */
export function createHMAC(
  algorithm: HashAlgorithm,
  key: string | Buffer,
  data: string | Buffer
): Buffer {
  return crypto.createHmac(algorithm, key).update(data).digest();
}

/**
 * Create HMAC hex
 */
export function createHMACHex(
  algorithm: HashAlgorithm,
  key: string | Buffer,
  data: string | Buffer
): string {
  return crypto.createHmac(algorithm, key).update(data).digest('hex');
}
