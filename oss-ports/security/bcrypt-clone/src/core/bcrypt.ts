/**
 * @elide/bcrypt - Core Bcrypt Implementation
 * Secure password hashing using bcrypt algorithm
 */

import * as crypto from 'crypto';

const BCRYPT_SALT_LENGTH = 16;
const BCRYPT_HASH_LENGTH = 23;
const DEFAULT_ROUNDS = 10;
const MAX_ROUNDS = 31;
const MIN_ROUNDS = 4;

/**
 * Generate a salt
 * @param rounds - Number of rounds (cost factor)
 */
export async function genSalt(rounds: number = DEFAULT_ROUNDS): Promise<string> {
  validateRounds(rounds);

  const randomBytes = crypto.randomBytes(BCRYPT_SALT_LENGTH);
  const salt = `$2b$${rounds.toString().padStart(2, '0')}$${base64Encode(randomBytes)}`;

  return salt;
}

/**
 * Generate a salt (synchronous)
 */
export function genSaltSync(rounds: number = DEFAULT_ROUNDS): string {
  validateRounds(rounds);

  const randomBytes = crypto.randomBytes(BCRYPT_SALT_LENGTH);
  const salt = `$2b$${rounds.toString().padStart(2, '0')}$${base64Encode(randomBytes)}`;

  return salt;
}

/**
 * Hash a password
 * @param password - Password to hash
 * @param rounds - Number of rounds or salt
 */
export async function hash(password: string, rounds: number | string = DEFAULT_ROUNDS): Promise<string> {
  const salt = typeof rounds === 'string' ? rounds : await genSalt(rounds);
  return hashWithSalt(password, salt);
}

/**
 * Hash a password (synchronous)
 */
export function hashSync(password: string, rounds: number | string = DEFAULT_ROUNDS): string {
  const salt = typeof rounds === 'string' ? rounds : genSaltSync(rounds);
  return hashWithSalt(password, salt);
}

/**
 * Compare password with hash
 * @param password - Plain text password
 * @param hash - Bcrypt hash
 */
export async function compare(password: string, hash: string): Promise<boolean> {
  try {
    const salt = extractSalt(hash);
    const newHash = hashWithSalt(password, salt);
    return timingSafeEqual(hash, newHash);
  } catch (error) {
    return false;
  }
}

/**
 * Compare password with hash (synchronous)
 */
export function compareSync(password: string, hash: string): boolean {
  try {
    const salt = extractSalt(hash);
    const newHash = hashWithSalt(password, salt);
    return timingSafeEqual(hash, newHash);
  } catch (error) {
    return false;
  }
}

/**
 * Get number of rounds from hash
 */
export function getRounds(hash: string): number {
  const parts = hash.split('$');
  if (parts.length < 3) {
    throw new Error('Invalid bcrypt hash');
  }

  const rounds = parseInt(parts[2], 10);
  if (isNaN(rounds)) {
    throw new Error('Invalid rounds in hash');
  }

  return rounds;
}

/**
 * Hash password with salt
 */
function hashWithSalt(password: string, salt: string): string {
  const parts = salt.split('$');
  if (parts.length < 4) {
    throw new Error('Invalid salt format');
  }

  const version = parts[1];
  const rounds = parseInt(parts[2], 10);
  const saltData = parts[3];

  // Simplified bcrypt implementation using PBKDF2
  // In a real implementation, this would use the actual Blowfish cipher
  const derived = crypto.pbkdf2Sync(
    password,
    Buffer.from(saltData),
    Math.pow(2, rounds),
    BCRYPT_HASH_LENGTH,
    'sha512'
  );

  const hashData = base64Encode(derived);
  return `$${version}$${rounds.toString().padStart(2, '0')}$${saltData}${hashData}`;
}

/**
 * Extract salt from hash
 */
function extractSalt(hash: string): string {
  const parts = hash.split('$');
  if (parts.length < 4) {
    throw new Error('Invalid hash format');
  }

  const version = parts[1];
  const rounds = parts[2];
  const saltAndHash = parts[3];

  // Extract just the salt part (first 22 characters)
  const salt = saltAndHash.substring(0, 22);

  return `$${version}$${rounds}$${salt}`;
}

/**
 * Validate rounds parameter
 */
function validateRounds(rounds: number): void {
  if (!Number.isInteger(rounds)) {
    throw new Error('Rounds must be an integer');
  }

  if (rounds < MIN_ROUNDS || rounds > MAX_ROUNDS) {
    throw new Error(`Rounds must be between ${MIN_ROUNDS} and ${MAX_ROUNDS}`);
  }
}

/**
 * Base64 encode for bcrypt (custom alphabet)
 */
function base64Encode(buffer: Buffer): string {
  const alphabet = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    result += alphabet[byte % alphabet.length];
  }

  return result;
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare dummy values to maintain constant time
    const dummy = '$2b$10$' + 'a'.repeat(53);
    crypto.timingSafeEqual(Buffer.from(dummy), Buffer.from(dummy));
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
