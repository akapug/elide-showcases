/**
 * @elide/bcrypt - Basic Usage Examples
 * Demonstrates bcrypt password hashing and verification
 */

import bcrypt, {
  validatePasswordStrength,
  generatePassword,
  hashBatch,
  verifyAgainstMultiple,
  estimateCrackTime
} from '@elide/bcrypt';

/**
 * Example 1: Basic password hashing
 */
export async function example1BasicHashing() {
  console.log('=== Example 1: Basic Password Hashing ===\n');

  const password = 'mySecurePassword123!';

  // Hash with default rounds (10)
  const hash1 = await bcrypt.hash(password, 10);
  console.log('Hash with 10 rounds:', hash1);

  // Hash with higher security (12 rounds)
  const hash2 = await bcrypt.hash(password, 12);
  console.log('Hash with 12 rounds:', hash2);

  // Verify password
  const isValid = await bcrypt.compare(password, hash1);
  console.log('Password valid:', isValid);

  const isInvalid = await bcrypt.compare('wrongPassword', hash1);
  console.log('Wrong password valid:', isInvalid);

  console.log('');
}

/**
 * Example 2: Synchronous hashing
 */
export function example2SyncHashing() {
  console.log('=== Example 2: Synchronous Hashing ===\n');

  const password = 'syncPassword456';

  // Sync hash
  const hash = bcrypt.hashSync(password, 10);
  console.log('Sync hash:', hash);

  // Sync compare
  const isValid = bcrypt.compareSync(password, hash);
  console.log('Password valid:', isValid);

  console.log('');
}

/**
 * Example 3: Custom salt generation
 */
export async function example3CustomSalt() {
  console.log('=== Example 3: Custom Salt Generation ===\n');

  // Generate salt with specific rounds
  const salt = await bcrypt.genSalt(12);
  console.log('Generated salt:', salt);

  // Use the salt to hash
  const password = 'customSaltPassword';
  const hash = await bcrypt.hash(password, salt);
  console.log('Hash with custom salt:', hash);

  // Get rounds from hash
  const rounds = bcrypt.getRounds(hash);
  console.log('Rounds in hash:', rounds);

  console.log('');
}

/**
 * Example 4: Password strength validation
 */
export function example4PasswordStrength() {
  console.log('=== Example 4: Password Strength Validation ===\n');

  const passwords = [
    'weak',
    'password123',
    'Password123',
    'SecureP@ssw0rd!',
    'VerySecurePassword123!@#'
  ];

  passwords.forEach(pwd => {
    const result = validatePasswordStrength(pwd, {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    });

    console.log(`Password: "${pwd}"`);
    console.log(`Valid: ${result.valid}`);
    console.log(`Score: ${result.score}/100`);
    if (result.errors.length > 0) {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
    console.log('');
  });
}

/**
 * Example 5: Generate secure passwords
 */
export function example5GeneratePasswords() {
  console.log('=== Example 5: Generate Secure Passwords ===\n');

  // Generate default password
  const pwd1 = generatePassword();
  console.log('Default password:', pwd1);

  // Generate with custom length
  const pwd2 = generatePassword(24);
  console.log('24-char password:', pwd2);

  // Generate without special characters
  const pwd3 = generatePassword(16, {
    includeSpecialChars: false
  });
  console.log('No special chars:', pwd3);

  // Generate numbers only
  const pwd4 = generatePassword(8, {
    includeUppercase: false,
    includeLowercase: false,
    includeNumbers: true,
    includeSpecialChars: false
  });
  console.log('Numbers only PIN:', pwd4);

  console.log('');
}

/**
 * Example 6: Batch password hashing
 */
export async function example6BatchHashing() {
  console.log('=== Example 6: Batch Password Hashing ===\n');

  const passwords = [
    'user1password',
    'user2password',
    'user3password',
    'user4password',
    'user5password'
  ];

  console.log('Hashing', passwords.length, 'passwords...');

  const startTime = Date.now();
  const hashes = await hashBatch(passwords, 10);
  const duration = Date.now() - startTime;

  console.log('Hashed in', duration, 'ms');
  console.log('Average:', (duration / passwords.length).toFixed(2), 'ms per password');

  hashes.forEach((hash, index) => {
    console.log(`User ${index + 1}:`, hash.substring(0, 29) + '...');
  });

  console.log('');
}

/**
 * Example 7: Verify against multiple hashes
 */
export async function example7MultipleHashes() {
  console.log('=== Example 7: Verify Against Multiple Hashes ===\n');

  const password = 'commonPassword123';

  // Create multiple hashes (e.g., for password history)
  const oldHashes = [
    await bcrypt.hash('oldPassword1', 10),
    await bcrypt.hash('oldPassword2', 10),
    await bcrypt.hash(password, 10), // Current password in history
    await bcrypt.hash('oldPassword4', 10)
  ];

  // Check if password was used before
  const wasUsedBefore = await verifyAgainstMultiple(password, oldHashes);
  console.log('Password was used before:', wasUsedBefore);

  const newPassword = 'newUniquePassword456';
  const isNew = await verifyAgainstMultiple(newPassword, oldHashes);
  console.log('New password is unique:', !isNew);

  console.log('');
}

/**
 * Example 8: Estimate crack time
 */
export function example8CrackTime() {
  console.log('=== Example 8: Estimate Crack Time ===\n');

  const passwords = [
    'abc',
    'password',
    'Password1',
    'P@ssw0rd!',
    'MyV3ry$ecur3P@ssw0rd!'
  ];

  passwords.forEach(pwd => {
    const { seconds, humanReadable } = estimateCrackTime(pwd);
    console.log(`Password: "${pwd}"`);
    console.log(`Estimated crack time: ${humanReadable}`);
    console.log(`(${seconds.toExponential(2)} seconds)`);
    console.log('');
  });
}

/**
 * Example 9: User registration with validation
 */
export async function example9UserRegistration() {
  console.log('=== Example 9: User Registration Flow ===\n');

  const username = 'johndoe';
  const password = 'SecureP@ssw0rd123';

  // Step 1: Validate password strength
  const validation = validatePasswordStrength(password, {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  });

  if (!validation.valid) {
    console.log('Password validation failed:');
    validation.errors.forEach(error => console.log('  -', error));
    return;
  }

  console.log('Password strength: Strong (Score:', validation.score + '/100)');

  // Step 2: Hash the password
  console.log('Hashing password...');
  const hash = await bcrypt.hash(password, 12);
  console.log('Password hashed successfully');

  // Step 3: Store user (mock)
  const user = {
    id: 1,
    username,
    passwordHash: hash,
    createdAt: new Date()
  };

  console.log('\nUser registered:');
  console.log('  Username:', user.username);
  console.log('  Password hash:', user.passwordHash.substring(0, 29) + '...');
  console.log('  Created at:', user.createdAt.toISOString());

  console.log('');
}

/**
 * Example 10: User login with timing attack prevention
 */
export async function example10SecureLogin() {
  console.log('=== Example 10: Secure Login Flow ===\n');

  // Mock user database
  const users = [
    {
      username: 'alice',
      passwordHash: await bcrypt.hash('alicePassword123', 10)
    },
    {
      username: 'bob',
      passwordHash: await bcrypt.hash('bobPassword456', 10)
    }
  ];

  // Login attempt
  const attemptLogin = async (username: string, password: string) => {
    console.log(`Login attempt: ${username}`);

    const startTime = Date.now();

    // Find user
    const user = users.find(u => u.username === username);

    // Always perform comparison even if user not found
    // This prevents timing attacks
    const hashToCompare = user?.passwordHash || '$2b$10$invalidhashfortimingattak';

    const isValid = await bcrypt.compare(password, hashToCompare);

    const duration = Date.now() - startTime;

    if (user && isValid) {
      console.log(`✓ Login successful (${duration}ms)`);
      return { success: true, user: { username: user.username } };
    } else {
      console.log(`✗ Login failed (${duration}ms)`);
      return { success: false, error: 'Invalid credentials' };
    }
  };

  // Valid login
  await attemptLogin('alice', 'alicePassword123');

  // Invalid password
  await attemptLogin('alice', 'wrongPassword');

  // Invalid username
  await attemptLogin('charlie', 'anyPassword');

  console.log('');
}

/**
 * Example 11: Password reset flow
 */
export async function example11PasswordReset() {
  console.log('=== Example 11: Password Reset Flow ===\n');

  const oldPasswordHash = await bcrypt.hash('oldPassword123', 10);
  console.log('Old password hash:', oldPasswordHash.substring(0, 29) + '...');

  const newPassword = 'newSecureP@ssw0rd456';

  // Validate new password
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    console.log('New password validation failed');
    return;
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  console.log('New password hash:', newPasswordHash.substring(0, 29) + '...');

  // Verify old and new hashes are different
  console.log('Hashes are different:', oldPasswordHash !== newPasswordHash);

  console.log('');
}

/**
 * Example 12: Cost factor adjustment over time
 */
export async function example12CostAdjustment() {
  console.log('=== Example 12: Cost Factor Adjustment ===\n');

  const password = 'testPassword123';

  // Hash with different cost factors
  const costs = [8, 10, 12, 14];

  for (const cost of costs) {
    const startTime = Date.now();
    const hash = await bcrypt.hash(password, cost);
    const duration = Date.now() - startTime;

    console.log(`Cost ${cost}: ${duration}ms`);
  }

  console.log('\nNote: As cost increases, hashing time increases exponentially');
  console.log('Adjust cost factor based on your security requirements and performance needs');

  console.log('');
}

// Run all examples
if (require.main === module) {
  (async () => {
    await example1BasicHashing();
    example2SyncHashing();
    await example3CustomSalt();
    example4PasswordStrength();
    example5GeneratePasswords();
    await example6BatchHashing();
    await example7MultipleHashes();
    example8CrackTime();
    await example9UserRegistration();
    await example10SecureLogin();
    await example11PasswordReset();
    await example12CostAdjustment();
  })();
}
