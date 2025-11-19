/**
 * @elide/bcrypt - Test Suite
 * Comprehensive tests for bcrypt operations
 */

import { describe, it, expect } from '@jest/globals';
import bcrypt, { validatePasswordStrength, generatePassword } from '../src';

describe('Bcrypt Hash', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hash = await bcrypt.hash(password, 10);

    expect(hash).toBeDefined();
    expect(hash).toMatch(/^\$2b\$10\$/);
  });

  it('should hash synchronously', () => {
    const password = 'testPassword123';
    const hash = bcrypt.hashSync(password, 10);

    expect(hash).toBeDefined();
    expect(hash).toMatch(/^\$2b\$10\$/);
  });

  it('should generate different hashes for same password', async () => {
    const password = 'testPassword123';
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);

    expect(hash1).not.toBe(hash2);
  });

  it('should hash with different rounds', async () => {
    const password = 'testPassword123';
    const hash10 = await bcrypt.hash(password, 10);
    const hash12 = await bcrypt.hash(password, 12);

    expect(hash10).toMatch(/^\$2b\$10\$/);
    expect(hash12).toMatch(/^\$2b\$12\$/);
  });
});

describe('Bcrypt Compare', () => {
  it('should compare password with hash correctly', async () => {
    const password = 'testPassword123';
    const hash = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const password = 'testPassword123';
    const hash = await bcrypt.hash(password, 10);

    const isValid = await bcrypt.compare('wrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('should compare synchronously', () => {
    const password = 'testPassword123';
    const hash = bcrypt.hashSync(password, 10);

    const isValid = bcrypt.compareSync(password, hash);
    expect(isValid).toBe(true);
  });

  it('should handle timing attack prevention', async () => {
    const password = 'testPassword123';
    const hash = await bcrypt.hash(password, 10);

    const times: number[] = [];

    // Test with valid password
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await bcrypt.compare(password, hash);
      times.push(Date.now() - start);
    }

    // Test with invalid password
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await bcrypt.compare('wrongPassword', hash);
      times.push(Date.now() - start);
    }

    // Times should be relatively consistent
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;

    expect(variance).toBeLessThan(100); // Low variance indicates timing-safe
  });
});

describe('Bcrypt Salt', () => {
  it('should generate salt', async () => {
    const salt = await bcrypt.genSalt(10);

    expect(salt).toBeDefined();
    expect(salt).toMatch(/^\$2b\$10\$/);
  });

  it('should generate salt synchronously', () => {
    const salt = bcrypt.genSaltSync(10);

    expect(salt).toBeDefined();
    expect(salt).toMatch(/^\$2b\$10\$/);
  });

  it('should hash with custom salt', async () => {
    const password = 'testPassword123';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(password, salt);

    expect(hash).toMatch(/^\$2b\$12\$/);
  });
});

describe('Bcrypt Rounds', () => {
  it('should get rounds from hash', async () => {
    const password = 'testPassword123';
    const hash = await bcrypt.hash(password, 12);

    const rounds = bcrypt.getRounds(hash);
    expect(rounds).toBe(12);
  });

  it('should validate rounds parameter', async () => {
    const password = 'testPassword123';

    await expect(bcrypt.hash(password, 3)).rejects.toThrow();
    await expect(bcrypt.hash(password, 32)).rejects.toThrow();
  });
});

describe('Password Strength', () => {
  it('should validate weak password', () => {
    const result = validatePasswordStrength('weak');

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate strong password', () => {
    const result = validatePasswordStrength('StrongP@ssw0rd123', {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    });

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.score).toBeGreaterThan(80);
  });

  it('should calculate password score', () => {
    const weak = validatePasswordStrength('password');
    const strong = validatePasswordStrength('V3ry$tr0ng!Pass');

    expect(strong.score).toBeGreaterThan(weak.score);
  });
});

describe('Password Generation', () => {
  it('should generate password with default length', () => {
    const password = generatePassword();

    expect(password.length).toBe(16);
  });

  it('should generate password with custom length', () => {
    const password = generatePassword(24);

    expect(password.length).toBe(24);
  });

  it('should generate password with custom options', () => {
    const password = generatePassword(12, {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: false,
      includeSpecialChars: false
    });

    expect(password.length).toBe(12);
    expect(password).toMatch(/^[A-Za-z]+$/);
  });

  it('should generate unique passwords', () => {
    const passwords = new Set();

    for (let i = 0; i < 100; i++) {
      passwords.add(generatePassword());
    }

    expect(passwords.size).toBe(100);
  });
});
