/**
 * @elide/forge - AES Examples
 * Comprehensive AES encryption examples
 */

import {
  aesEncrypt,
  aesDecrypt,
  aesEncryptString,
  aesDecryptString,
  randomBytes
} from '@elide/forge';

/**
 * Example 1: Basic AES-256-GCM encryption
 */
export function example1BasicEncryption() {
  console.log('=== Example 1: Basic AES-256-GCM Encryption ===\n');

  const key = randomBytes(32); // 256-bit key
  const plaintext = 'This is a secret message!';

  console.log('Key (hex):', key.toString('hex'));
  console.log('Plaintext:', plaintext);

  // Encrypt
  const { ciphertext, iv, tag } = aesEncrypt(key, plaintext, { mode: 'gcm' });

  console.log('\nCiphertext (hex):', ciphertext.toString('hex'));
  console.log('IV (hex):', iv.toString('hex'));
  console.log('Auth tag (hex):', tag?.toString('hex'));

  // Decrypt
  const decrypted = aesDecrypt(key, ciphertext, iv, { mode: 'gcm', tag });
  console.log('\nDecrypted:', decrypted.toString());
}

/**
 * Example 2: AES with different modes
 */
export function example2DifferentModes() {
  console.log('\n=== Example 2: Different AES Modes ===\n');

  const key = randomBytes(32);
  const data = 'Test data for encryption';

  const modes = ['cbc', 'gcm', 'ctr'] as const;

  modes.forEach(mode => {
    console.log(`\nMode: ${mode.toUpperCase()}`);

    const { ciphertext, iv, tag } = aesEncrypt(key, data, { mode });

    console.log(`Ciphertext length: ${ciphertext.length} bytes`);
    console.log(`IV length: ${iv.length} bytes`);
    if (tag) console.log(`Tag length: ${tag.length} bytes`);

    const decrypted = aesDecrypt(key, ciphertext, iv, { mode, tag });
    console.log(`Decrypted matches: ${decrypted.toString() === data}`);
  });
}

/**
 * Example 3: String encryption helpers
 */
export function example3StringHelpers() {
  console.log('\n=== Example 3: String Encryption Helpers ===\n');

  const key = 'my-secret-key-256-bits-long!!'; // 32 bytes
  const message = 'Easy string encryption with AES-GCM';

  console.log('Message:', message);

  // Encrypt to base64
  const { ciphertext, iv, tag } = aesEncryptString(key, message);

  console.log('\nCiphertext:', ciphertext);
  console.log('IV:', iv);
  console.log('Tag:', tag);

  // Decrypt from base64
  const decrypted = aesDecryptString(key, ciphertext, iv, { tag });
  console.log('\nDecrypted:', decrypted);
}

/**
 * Example 4: Different key sizes
 */
export function example4KeySizes() {
  console.log('\n=== Example 4: Different Key Sizes ===\n');

  const data = 'Test message';

  const keySizes = [128, 192, 256] as const;

  keySizes.forEach(keySize => {
    const key = randomBytes(keySize / 8);

    console.log(`\nAES-${keySize}:`);
    console.log(`Key size: ${key.length} bytes`);

    const { ciphertext, iv } = aesEncrypt(key, data, { mode: 'gcm', keySize });

    const decrypted = aesDecrypt(key, ciphertext, iv, { mode: 'gcm', keySize });
    console.log(`Encryption successful: ${decrypted.toString() === data}`);
  });
}

/**
 * Example 5: Encrypt large file (chunked)
 */
export function example5LargeDataEncryption() {
  console.log('\n=== Example 5: Large Data Encryption ===\n');

  const key = randomBytes(32);
  const iv = randomBytes(16);

  // Simulate large file (10MB)
  const largeData = Buffer.alloc(10 * 1024 * 1024);
  largeData.fill('A');

  console.log(`Data size: ${largeData.length} bytes`);

  const startTime = Date.now();

  const { ciphertext } = aesEncrypt(key, largeData, { mode: 'gcm', iv });

  const encryptionTime = Date.now() - startTime;
  console.log(`Encryption time: ${encryptionTime}ms`);

  const decryptionStart = Date.now();

  const decrypted = aesDecrypt(key, ciphertext, iv, { mode: 'gcm' });

  const decryptionTime = Date.now() - decryptionStart;
  console.log(`Decryption time: ${decryptionTime}ms`);

  console.log(`Data integrity: ${decrypted.equals(largeData)}`);
}

/**
 * Example 6: Password-based encryption
 */
export function example6PasswordBasedEncryption() {
  console.log('\n=== Example 6: Password-Based Encryption ===\n');

  const crypto = require('crypto');
  const password = 'userPassword123';
  const salt = randomBytes(16);

  console.log('Password:', password);
  console.log('Salt (hex):', salt.toString('hex'));

  // Derive key from password using PBKDF2
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  console.log('\nDerived key (hex):', key.toString('hex'));

  const data = 'Sensitive user data';

  const { ciphertext, iv, tag } = aesEncrypt(key, data);

  console.log('\nEncrypted with password-derived key');

  // To decrypt, derive key again from password and salt
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const decrypted = aesDecrypt(derivedKey, ciphertext, iv, { tag });

  console.log('Decrypted:', decrypted.toString());
}

/**
 * Example 7: Authenticated encryption (GCM)
 */
export function example7AuthenticatedEncryption() {
  console.log('\n=== Example 7: Authenticated Encryption ===\n');

  const key = randomBytes(32);
  const data = 'Important data with authentication';

  const { ciphertext, iv, tag } = aesEncrypt(key, data, { mode: 'gcm' });

  console.log('Original data:', data);
  console.log('Authentication tag:', tag?.toString('hex'));

  // Successful decryption
  try {
    const decrypted = aesDecrypt(key, ciphertext, iv, { mode: 'gcm', tag });
    console.log('\n✓ Decryption successful:', decrypted.toString());
  } catch (error) {
    console.log('✗ Decryption failed');
  }

  // Tamper with ciphertext
  console.log('\nTampering with ciphertext...');
  const tamperedCiphertext = Buffer.from(ciphertext);
  tamperedCiphertext[0] ^= 0xFF; // Flip bits

  try {
    const decrypted = aesDecrypt(key, tamperedCiphertext, iv, { mode: 'gcm', tag });
    console.log('✗ Decryption should have failed!');
  } catch (error) {
    console.log('✓ Tampering detected - decryption failed as expected');
  }
}

/**
 * Example 8: JSON data encryption
 */
export function example8JSONEncryption() {
  console.log('\n=== Example 8: JSON Data Encryption ===\n');

  const key = randomBytes(32);

  const userData = {
    id: 12345,
    username: 'johndoe',
    email: 'john@example.com',
    roles: ['user', 'admin'],
    metadata: {
      lastLogin: new Date().toISOString(),
      preferences: { theme: 'dark' }
    }
  };

  console.log('Original data:');
  console.log(JSON.stringify(userData, null, 2));

  // Encrypt JSON
  const jsonString = JSON.stringify(userData);
  const { ciphertext, iv, tag } = aesEncryptString(key.toString('hex'), jsonString);

  console.log('\nEncrypted JSON (truncated):', ciphertext.substring(0, 64) + '...');

  // Decrypt JSON
  const decryptedString = aesDecryptString(key.toString('hex'), ciphertext, iv, { tag });
  const decryptedData = JSON.parse(decryptedString);

  console.log('\nDecrypted data:');
  console.log(JSON.stringify(decryptedData, null, 2));
}

/**
 * Example 9: Secure data transmission
 */
export function example9SecureTransmission() {
  console.log('\n=== Example 9: Secure Data Transmission ===\n');

  // Sender side
  const sharedKey = randomBytes(32);
  const message = 'Confidential transaction data';

  console.log('Sender encrypting message...');
  const { ciphertext, iv, tag } = aesEncryptString(sharedKey.toString('hex'), message);

  // Package for transmission
  const package = {
    ciphertext,
    iv,
    tag,
    timestamp: Date.now()
  };

  console.log('Package ready for transmission');

  // Simulate transmission
  const transmittedPackage = JSON.parse(JSON.stringify(package));

  // Receiver side
  console.log('\nReceiver decrypting message...');
  const decrypted = aesDecryptString(
    sharedKey.toString('hex'),
    transmittedPackage.ciphertext,
    transmittedPackage.iv,
    { tag: transmittedPackage.tag }
  );

  console.log('Received message:', decrypted);
}

/**
 * Example 10: Key rotation
 */
export function example10KeyRotation() {
  console.log('\n=== Example 10: Key Rotation ===\n');

  const oldKey = randomBytes(32);
  const newKey = randomBytes(32);

  const data = 'Persistent encrypted data';

  // Encrypt with old key
  console.log('Encrypting with old key...');
  const { ciphertext: oldCiphertext, iv: oldIV, tag: oldTag } = aesEncrypt(oldKey, data);

  // Decrypt with old key
  const decryptedOld = aesDecrypt(oldKey, oldCiphertext, oldIV, { tag: oldTag });

  // Re-encrypt with new key
  console.log('Re-encrypting with new key...');
  const { ciphertext: newCiphertext, iv: newIV, tag: newTag } = aesEncrypt(newKey, decryptedOld);

  // Verify with new key
  const decryptedNew = aesDecrypt(newKey, newCiphertext, newIV, { tag: newTag });

  console.log('Data integrity maintained:', decryptedNew.toString() === data);
  console.log('Key rotation successful!');
}

// Run all examples
if (require.main === module) {
  example1BasicEncryption();
  example2DifferentModes();
  example3StringHelpers();
  example4KeySizes();
  // example5LargeDataEncryption(); // Commented out due to size
  example6PasswordBasedEncryption();
  example7AuthenticatedEncryption();
  example8JSONEncryption();
  example9SecureTransmission();
  example10KeyRotation();
}
