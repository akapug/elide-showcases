/**
 * buffer-crc32 - CRC32 Checksums
 *
 * Fast CRC32 calculation for buffers. Essential for data integrity checks.
 * **POLYGLOT SHOWCASE**: Calculate CRC32 consistently across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/buffer-crc32 (~2M+ downloads/week)
 *
 * Features:
 * - Fast CRC32 calculation
 * - Support for buffers and strings
 * - Signed and unsigned variants
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need CRC32
 * - ONE implementation works everywhere on Elide
 * - Consistent checksums across languages
 *
 * Use cases:
 * - File integrity checks
 * - ZIP file format
 * - Network protocols
 * - Data validation
 *
 * Package has ~2M+ downloads/week on npm!
 */

// CRC32 lookup table
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

export function crc32(data: Uint8Array | string, previous?: number): number {
  let crc = previous === undefined ? 0 : ~~previous ^ -1;

  if (typeof data === 'string') {
    const encoder = new TextEncoder();
    data = encoder.encode(data);
  }

  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }

  return crc ^ -1;
}

export function crc32Signed(data: Uint8Array | string, previous?: number): number {
  return crc32(data, previous);
}

export function crc32Unsigned(data: Uint8Array | string, previous?: number): number {
  return crc32(data, previous) >>> 0;
}

export default crc32;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔐 buffer-crc32 - CRC32 Checksums (POLYGLOT!)\n");

  console.log("=== Example 1: String CRC32 ===");
  const str = "Hello, World!";
  const crc = crc32(str);
  console.log(`CRC32("${str}"):`, crc.toString(16).padStart(8, '0'));
  console.log();

  console.log("=== Example 2: Buffer CRC32 ===");
  const buf = new Uint8Array([1, 2, 3, 4, 5]);
  const bufCrc = crc32(buf);
  console.log("Buffer:", buf);
  console.log("CRC32:", bufCrc.toString(16).padStart(8, '0'));
  console.log();

  console.log("=== Example 3: Unsigned CRC32 ===");
  const unsigned = crc32Unsigned("test");
  console.log("Unsigned CRC32:", unsigned.toString(16));
  console.log();

  console.log("=== Example 4: Incremental CRC32 ===");
  const part1 = "Hello";
  const part2 = ", World!";
  const crc1 = crc32(part1);
  const crc2 = crc32(part2, crc1);
  console.log("Full CRC32:", crc32("Hello, World!").toString(16));
  console.log("Incremental:", crc2.toString(16));
  console.log("Match:", crc32("Hello, World!") === crc2);
  console.log();

  console.log("=== Example 5: File Verification ===");
  const fileData = new TextEncoder().encode("File contents here");
  const checksum = crc32Unsigned(fileData);
  console.log("File checksum:", checksum.toString(16).toUpperCase());
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same CRC32 in all languages via Elide!");
  console.log("✓ JavaScript/TypeScript/Python/Ruby/Java");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- File integrity checks");
  console.log("- ZIP file format");
  console.log("- Network protocols");
  console.log("- Data validation");
  console.log();

  console.log("🚀 ~2M+ downloads/week on npm!");
}
