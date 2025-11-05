/**
 * Password Generator
 * Generate secure passwords with entropy calculation
 */

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

export interface PasswordOptions {
  length?: number;
  lowercase?: boolean;
  uppercase?: boolean;
  digits?: boolean;
  symbols?: boolean;
}

export function generatePassword(options: PasswordOptions = {}): string {
  const {
    length = 16,
    lowercase = true,
    uppercase = true,
    digits = true,
    symbols = true
  } = options;

  if (length < 1) {
    throw new RangeError('Password length must be at least 1');
  }

  let chars = '';
  if (lowercase) chars += LOWERCASE;
  if (uppercase) chars += UPPERCASE;
  if (digits) chars += DIGITS;
  if (symbols) chars += SYMBOLS;

  if (chars.length === 0) {
    throw new Error('At least one character type must be enabled');
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  return password;
}

export function calculateEntropy(password: string): number {
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  let poolSize = 0;
  if (hasLowercase) poolSize += 26;
  if (hasUppercase) poolSize += 26;
  if (hasDigits) poolSize += 10;
  if (hasSymbols) poolSize += 32; // Approximate

  return password.length * Math.log2(poolSize);
}

export function assessStrength(password: string): { score: number; label: string; entropy: number } {
  const entropy = calculateEntropy(password);

  let score: number;
  let label: string;

  if (entropy < 28) {
    score = 0;
    label = 'Very Weak';
  } else if (entropy < 36) {
    score = 1;
    label = 'Weak';
  } else if (entropy < 60) {
    score = 2;
    label = 'Fair';
  } else if (entropy < 128) {
    score = 3;
    label = 'Strong';
  } else {
    score = 4;
    label = 'Very Strong';
  }

  return { score, label, entropy };
}

export function generatePassphrase(wordCount: number = 4): string {
  const words = [
    'correct', 'horse', 'battery', 'staple', 'purple', 'monkey', 'dishwasher',
    'rainbow', 'elephant', 'sunshine', 'mountain', 'ocean', 'garden', 'crystal',
    'thunder', 'whisper', 'cascade', 'meadow', 'forest', 'river', 'cloud',
    'phoenix', 'dragon', 'wizard', 'castle', 'knight', 'treasure', 'adventure'
  ];

  const selected: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    selected.push(words[randomIndex]);
  }

  return selected.join('-');
}

// CLI demo
if (import.meta.url.includes("password-generator.ts")) {
  console.log("Password Generator Demo\n");

  console.log("1. Standard password (16 chars):");
  const pwd1 = generatePassword();
  console.log("  Password:", pwd1);
  const strength1 = assessStrength(pwd1);
  console.log("  Strength:", strength1.label, `(${strength1.entropy.toFixed(1)} bits)`);

  console.log("\n2. Letters only (12 chars):");
  const pwd2 = generatePassword({ length: 12, digits: false, symbols: false });
  console.log("  Password:", pwd2);
  const strength2 = assessStrength(pwd2);
  console.log("  Strength:", strength2.label, `(${strength2.entropy.toFixed(1)} bits)`);

  console.log("\n3. PIN (6 digits):");
  const pin = generatePassword({ length: 6, lowercase: false, uppercase: false, symbols: false });
  console.log("  PIN:", pin);
  const strength3 = assessStrength(pin);
  console.log("  Strength:", strength3.label, `(${strength3.entropy.toFixed(1)} bits)`);

  console.log("\n4. Passphrase:");
  const passphrase = generatePassphrase(4);
  console.log("  Passphrase:", passphrase);
  const strength4 = assessStrength(passphrase);
  console.log("  Strength:", strength4.label, `(${strength4.entropy.toFixed(1)} bits)`);

  console.log("✅ Password generator test passed");
}
