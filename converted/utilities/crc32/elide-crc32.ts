/**
 * CRC32 - CRC32 Algorithm
 * 
 * Fast CRC32 checksum calculation.
 * **POLYGLOT SHOWCASE**: One CRC32 implementation for ALL languages on Elide!
 * 
 * Package has ~8M downloads/week on npm!
 */

export default function crc32(data: string | Uint8Array): number {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let crc = 0xFFFFFFFF;
  
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export function signed(data: string | Uint8Array): number {
  return crc32(data) | 0;
}

export function unsigned(data: string | Uint8Array): number {
  return crc32(data) >>> 0;
}

if (import.meta.url.includes("elide-crc32.ts")) {
  console.log("🔢 CRC32 - CRC32 Algorithm (POLYGLOT!) - ~8M downloads/week\n");
  
  const data = "Hello, World!";
  console.log(`CRC32 of "${data}": 0x${crc32(data).toString(16).toUpperCase()}`);
}
