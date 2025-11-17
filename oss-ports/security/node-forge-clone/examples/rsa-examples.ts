/**
 * @elide/forge - RSA Examples
 * Comprehensive RSA cryptography examples
 */

import {
  generateKeyPair,
  publicEncrypt,
  privateDecrypt,
  rsaSign,
  rsaVerify,
  rsaEncryptString,
  rsaDecryptString,
  rsaSignString,
  rsaVerifyString
} from '@elide/forge';

/**
 * Example 1: Generate RSA key pair
 */
export async function example1GenerateKeys() {
  console.log('=== Example 1: Generate RSA Key Pair ===\n');

  // Generate 2048-bit key pair
  console.log('Generating 2048-bit RSA key pair...');
  const keyPair = await generateKeyPair({ bits: 2048 });

  console.log('\nPublic Key:');
  console.log(keyPair.publicKey);

  console.log('\nPrivate Key (truncated):');
  console.log(keyPair.privateKey.substring(0, 100) + '...');

  return keyPair;
}

/**
 * Example 2: Encrypt and decrypt data
 */
export async function example2EncryptDecrypt() {
  console.log('\n=== Example 2: RSA Encryption/Decryption ===\n');

  const keyPair = await generateKeyPair({ bits: 2048 });

  const plaintext = 'This is a secret message!';
  console.log('Original message:', plaintext);

  // Encrypt with public key
  const encrypted = publicEncrypt(keyPair.publicKey, plaintext);
  console.log('\nEncrypted (base64):', encrypted.toString('base64'));

  // Decrypt with private key
  const decrypted = privateDecrypt(keyPair.privateKey, encrypted);
  console.log('Decrypted message:', decrypted.toString());
}

/**
 * Example 3: String encryption helpers
 */
export async function example3StringEncryption() {
  console.log('\n=== Example 3: String Encryption Helpers ===\n');

  const keyPair = await generateKeyPair({ bits: 2048 });

  const message = 'Easy string encryption!';
  console.log('Original:', message);

  // Encrypt to base64
  const ciphertext = rsaEncryptString(keyPair.publicKey, message);
  console.log('\nCiphertext:', ciphertext);

  // Decrypt from base64
  const plaintext = rsaDecryptString(keyPair.privateKey, ciphertext);
  console.log('Decrypted:', plaintext);
}

/**
 * Example 4: Digital signatures
 */
export async function example4DigitalSignatures() {
  console.log('\n=== Example 4: Digital Signatures ===\n');

  const keyPair = await generateKeyPair({ bits: 2048 });

  const message = 'Important document content';
  console.log('Document:', message);

  // Sign with private key
  const signature = rsaSign(keyPair.privateKey, message, { algorithm: 'sha256' });
  console.log('\nSignature (base64):', signature.toString('base64').substring(0, 64) + '...');

  // Verify with public key
  const isValid = rsaVerify(keyPair.publicKey, message, signature, { algorithm: 'sha256' });
  console.log('Signature valid:', isValid);

  // Try to verify tampered message
  const tamperedMessage = 'Important document content [TAMPERED]';
  const isInvalid = rsaVerify(keyPair.publicKey, tamperedMessage, signature, { algorithm: 'sha256' });
  console.log('Tampered message valid:', isInvalid);
}

/**
 * Example 5: String signature helpers
 */
export async function example5StringSignatures() {
  console.log('\n=== Example 5: String Signature Helpers ===\n');

  const keyPair = await generateKeyPair({ bits: 2048 });

  const document = 'Contract terms and conditions';
  console.log('Document:', document);

  // Sign to base64
  const signature = rsaSignString(keyPair.privateKey, document);
  console.log('\nSignature:', signature.substring(0, 64) + '...');

  // Verify from base64
  const isValid = rsaVerifyString(keyPair.publicKey, document, signature);
  console.log('Signature valid:', isValid);
}

/**
 * Example 6: Different key sizes
 */
export async function example6KeySizes() {
  console.log('\n=== Example 6: Different Key Sizes ===\n');

  const sizes = [1024, 2048, 4096];

  for (const bits of sizes) {
    console.log(`\nGenerating ${bits}-bit key pair...`);
    const startTime = Date.now();

    const keyPair = await generateKeyPair({ bits });
    const duration = Date.now() - startTime;

    console.log(`Generated in ${duration}ms`);
    console.log(`Public key length: ${keyPair.publicKey.length} chars`);
    console.log(`Private key length: ${keyPair.privateKey.length} chars`);
  }
}

/**
 * Example 7: Different signature algorithms
 */
export async function example7SignatureAlgorithms() {
  console.log('\n=== Example 7: Signature Algorithms ===\n');

  const keyPair = await generateKeyPair({ bits: 2048 });
  const message = 'Test message for signatures';

  const algorithms = ['sha256', 'sha384', 'sha512'] as const;

  for (const algorithm of algorithms) {
    const signature = rsaSign(keyPair.privateKey, message, { algorithm });
    const isValid = rsaVerify(keyPair.publicKey, message, signature, { algorithm });

    console.log(`${algorithm.toUpperCase()}: ${isValid ? '✓' : '✗'} (${signature.length} bytes)`);
  }
}

/**
 * Example 8: Encrypt large data in chunks
 */
export async function example8ChunkedEncryption() {
  console.log('\n=== Example 8: Chunked Encryption ===\n');

  const keyPair = await generateKeyPair({ bits: 2048 });

  // Maximum data size for RSA is limited by key size
  const maxSize = (2048 / 8) - 42; // OAEP padding
  console.log(`Max chunk size for 2048-bit key: ${maxSize} bytes`);

  const largeData = 'A'.repeat(100);
  console.log(`\nData size: ${largeData.length} bytes`);

  // Split into chunks
  const chunks: Buffer[] = [];
  for (let i = 0; i < largeData.length; i += maxSize) {
    const chunk = largeData.substring(i, i + maxSize);
    const encrypted = publicEncrypt(keyPair.publicKey, chunk);
    chunks.push(encrypted);
  }

  console.log(`Encrypted into ${chunks.length} chunks`);

  // Decrypt chunks
  let decrypted = '';
  for (const chunk of chunks) {
    const decryptedChunk = privateDecrypt(keyPair.privateKey, chunk);
    decrypted += decryptedChunk.toString();
  }

  console.log('Decryption successful:', decrypted === largeData);
}

/**
 * Example 9: Key exchange simulation
 */
export async function example9KeyExchange() {
  console.log('\n=== Example 9: Key Exchange Simulation ===\n');

  // Alice generates her key pair
  console.log('Alice generates key pair...');
  const aliceKeys = await generateKeyPair({ bits: 2048 });

  // Bob generates his key pair
  console.log('Bob generates key pair...');
  const bobKeys = await generateKeyPair({ bits: 2048 });

  // Alice sends encrypted message to Bob
  const aliceMessage = 'Hello Bob, this is Alice!';
  console.log('\nAlice sends:', aliceMessage);

  const aliceEncrypted = publicEncrypt(bobKeys.publicKey, aliceMessage);
  const bobDecrypted = privateDecrypt(bobKeys.privateKey, aliceEncrypted);

  console.log('Bob receives:', bobDecrypted.toString());

  // Bob sends encrypted message to Alice
  const bobMessage = 'Hello Alice, this is Bob!';
  console.log('\nBob sends:', bobMessage);

  const bobEncrypted = publicEncrypt(aliceKeys.publicKey, bobMessage);
  const aliceDecrypted = privateDecrypt(aliceKeys.privateKey, bobEncrypted);

  console.log('Alice receives:', aliceDecrypted.toString());
}

/**
 * Example 10: Signed and encrypted message
 */
export async function example10SignAndEncrypt() {
  console.log('\n=== Example 10: Sign and Encrypt ===\n');

  const senderKeys = await generateKeyPair({ bits: 2048 });
  const recipientKeys = await generateKeyPair({ bits: 2048 });

  const message = 'Confidential and authenticated message';
  console.log('Original message:', message);

  // Step 1: Sign with sender's private key
  const signature = rsaSign(senderKeys.privateKey, message);
  console.log('\nStep 1: Message signed');

  // Step 2: Encrypt message and signature with recipient's public key
  const messageData = JSON.stringify({ message, signature: signature.toString('base64') });
  const encrypted = rsaEncryptString(recipientKeys.publicKey, messageData);
  console.log('Step 2: Message encrypted');

  // Step 3: Decrypt with recipient's private key
  const decryptedData = rsaDecryptString(recipientKeys.privateKey, encrypted);
  const { message: decryptedMessage, signature: signatureB64 } = JSON.parse(decryptedData);
  console.log('\nStep 3: Message decrypted:', decryptedMessage);

  // Step 4: Verify signature with sender's public key
  const signatureBuffer = Buffer.from(signatureB64, 'base64');
  const isValid = rsaVerify(senderKeys.publicKey, decryptedMessage, signatureBuffer);
  console.log('Step 4: Signature verified:', isValid);
}

// Run all examples
if (require.main === module) {
  (async () => {
    await example1GenerateKeys();
    await example2EncryptDecrypt();
    await example3StringEncryption();
    await example4DigitalSignatures();
    await example5StringSignatures();
    await example6KeySizes();
    await example7SignatureAlgorithms();
    await example8ChunkedEncryption();
    await example9KeyExchange();
    await example10SignAndEncrypt();
  })();
}
