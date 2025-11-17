/**
 * @elide/bcrypt - Helper Utilities
 * Additional utilities for password handling
 */

import { hash, compare } from '../core/bcrypt';

/**
 * Password strength requirements
 */
export interface PasswordStrengthOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  score: number; // 0-100
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(
  password: string,
  options: PasswordStrengthOptions = {}
): PasswordValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false
  } = options;

  const errors: string[] = [];
  let score = 0;

  // Check length
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  } else {
    score += 25;
  }

  // Check uppercase
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 25;
  }

  // Check lowercase
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 25;
  }

  // Check numbers
  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/[0-9]/.test(password)) {
    score += 15;
  }

  // Check special characters
  if (requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (/[^A-Za-z0-9]/.test(password)) {
    score += 10;
  }

  return {
    valid: errors.length === 0,
    errors,
    score: Math.min(score, 100)
  };
}

/**
 * Generate random password
 */
export function generatePassword(
  length: number = 16,
  options: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSpecialChars?: boolean;
  } = {}
): string {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSpecialChars = true
  } = options;

  let charset = '';

  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) charset += '0123456789';
  if (includeSpecialChars) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!charset) {
    throw new Error('At least one character type must be included');
  }

  let password = '';
  const crypto = require('crypto');

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
}

/**
 * Hash multiple passwords in batch
 */
export async function hashBatch(
  passwords: string[],
  rounds: number = 10
): Promise<string[]> {
  return Promise.all(passwords.map(pwd => hash(pwd, rounds)));
}

/**
 * Verify password against multiple hashes
 */
export async function verifyAgainstMultiple(
  password: string,
  hashes: string[]
): Promise<boolean> {
  const results = await Promise.all(
    hashes.map(hash => compare(password, hash))
  );

  return results.some(result => result);
}

/**
 * Calculate time to crack password
 * Based on entropy and assuming 1 billion attempts per second
 */
export function estimateCrackTime(password: string): {
  seconds: number;
  humanReadable: string;
} {
  const charset = getCharsetSize(password);
  const length = password.length;
  const combinations = Math.pow(charset, length);
  const attemptsPerSecond = 1_000_000_000; // 1 billion
  const seconds = combinations / attemptsPerSecond / 2; // Average case

  return {
    seconds,
    humanReadable: formatTime(seconds)
  };
}

/**
 * Get charset size for password
 */
function getCharsetSize(password: string): number {
  let size = 0;

  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^A-Za-z0-9]/.test(password)) size += 32; // Approximate special chars

  return size;
}

/**
 * Format time duration
 */
function formatTime(seconds: number): string {
  if (seconds < 1) return 'Instant';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  return `${Math.round(seconds / 31536000)} years`;
}
