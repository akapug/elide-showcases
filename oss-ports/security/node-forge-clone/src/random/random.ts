/**
 * @elide/forge - Random Number Generation
 * Cryptographically secure random number generation
 */

import * as crypto from 'crypto';

/**
 * Generate random bytes
 */
export function randomBytes(length: number): Buffer {
  return crypto.randomBytes(length);
}

/**
 * Generate random bytes as hex string
 */
export function randomBytesHex(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate random bytes as base64 string
 */
export function randomBytesBase64(length: number): string {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return crypto.randomInt(min, max + 1);
}

/**
 * Generate random UUID (v4)
 */
export function randomUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate random password
 */
export function randomPassword(
  length: number = 16,
  charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
): string {
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
}

/**
 * Generate random token
 */
export function randomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Shuffle array randomly
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Pick random element from array
 */
export function randomElement<T>(array: T[]): T {
  const index = crypto.randomInt(0, array.length);
  return array[index];
}

/**
 * Generate random string with custom alphabet
 */
export function randomString(
  length: number,
  alphabet: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string {
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, alphabet.length);
    result += alphabet[randomIndex];
  }

  return result;
}
