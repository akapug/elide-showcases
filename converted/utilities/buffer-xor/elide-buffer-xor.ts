/**
 * buffer-xor - XOR Buffers
 *
 * Bitwise XOR two buffers together. Essential for cryptography and data manipulation.
 * **POLYGLOT SHOWCASE**: XOR buffers consistently across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/buffer-xor (~500K+ downloads/week)
 *
 * Features:
 * - Fast buffer XOR operations
 * - In-place or new buffer
 * - Variable length support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need bitwise operations
 * - ONE implementation works everywhere on Elide
 *
 * Use cases:
 * - Cryptography (stream ciphers)
 * - Data obfuscation
 * - Error detection
 * - Checksum calculation
 *
 * Package has ~500K+ downloads/week on npm!
 */

export function bufferXor(a: Uint8Array, b: Uint8Array, inPlace: boolean = false): Uint8Array {
  const length = Math.min(a.length, b.length);
  const result = inPlace ? a : new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    result[i] = a[i] ^ b[i];
  }

  return result;
}

export default bufferXor;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ buffer-xor - XOR Buffers (POLYGLOT!)\n");

  console.log("=== Example 1: Basic XOR ===");
  const buf1 = new Uint8Array([0xFF, 0x00, 0xAA, 0x55]);
  const buf2 = new Uint8Array([0x0F, 0xF0, 0x55, 0xAA]);
  const result = bufferXor(buf1, buf2);
  console.log("Buffer 1:", buf1);
  console.log("Buffer 2:", buf2);
  console.log("XOR:     ", result);
  console.log();

  console.log("=== Example 2: XOR Mask ===");
  const data = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello"
  const mask = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
  const masked = bufferXor(data, mask);
  console.log("Original:", data);
  console.log("Masked:  ", masked);
  const unmasked = bufferXor(masked, mask);
  console.log("Unmasked:", unmasked);
  console.log("String:  ", new TextDecoder().decode(unmasked));
  console.log();

  console.log("=== Example 3: Stream Cipher ===");
  const plaintext = new TextEncoder().encode("Secret Message");
  const key = new Uint8Array(plaintext.length).map(() => Math.floor(Math.random() * 256));
  const ciphertext = bufferXor(plaintext, key);
  const decrypted = bufferXor(ciphertext, key);
  console.log("Plaintext: ", new TextDecoder().decode(plaintext));
  console.log("Key:       ", key.slice(0, 8), "...");
  console.log("Ciphertext:", ciphertext.slice(0, 8), "...");
  console.log("Decrypted: ", new TextDecoder().decode(decrypted));
  console.log();

  console.log("=== Example 4: In-Place XOR ===");
  const buf3 = new Uint8Array([1, 2, 3, 4]);
  const buf4 = new Uint8Array([5, 6, 7, 8]);
  console.log("Before:", buf3);
  bufferXor(buf3, buf4, true);
  console.log("After: ", buf3);
  console.log();

  console.log("=== Example 5: POLYGLOT Use Case ===");
  console.log("🌐 Same XOR in all languages via Elide!");
  console.log("✓ JavaScript/TypeScript/Python/Ruby/Java");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Cryptography (stream ciphers)");
  console.log("- Data obfuscation");
  console.log("- Error detection");
  console.log("- Checksum calculation");
  console.log();

  console.log("🚀 ~500K+ downloads/week on npm!");
}
