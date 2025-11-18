/**
 * ieee754 - IEEE 754 Floating Point Read/Write
 *
 * Read/write IEEE 754 floating point numbers from/to buffers.
 * **POLYGLOT SHOWCASE**: Handle floats consistently across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ieee754 (~10M+ downloads/week)
 *
 * Features:
 * - Read/write float32 and float64
 * - Little-endian and big-endian support
 * - Direct buffer access
 * - Zero dependencies
 *
 * Use cases:
 * - Binary file formats
 * - Network protocols
 * - Float serialization
 * - Cross-platform data exchange
 *
 * Package has ~10M+ downloads/week on npm!
 */

export function read(buffer: Uint8Array, offset: number, isLE: boolean, mLen: number, nBytes: number): number {
  let e, m;
  const eLen = nBytes * 8 - mLen - 1;
  const eMax = (1 << eLen) - 1;
  const eBias = eMax >> 1;
  let nBits = -7;
  let i = isLE ? (nBytes - 1) : 0;
  const d = isLE ? -1 : 1;
  let s = buffer[offset + i];

  i += d;
  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;

  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;

  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }

  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}

export function write(buffer: Uint8Array, value: number, offset: number, isLE: boolean, mLen: number, nBytes: number): void {
  let e, m, c;
  let eLen = nBytes * 8 - mLen - 1;
  const eMax = (1 << eLen) - 1;
  const eBias = eMax >> 1;
  const rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
  let i = isLE ? 0 : (nBytes - 1);
  const d = isLE ? 1 : -1;
  const s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128;
}

export default { read, write };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔢 ieee754 - Float Read/Write (POLYGLOT!)\n");

  console.log("=== Example 1: Float32 ===");
  const buf1 = new Uint8Array(4);
  write(buf1, 3.14, 0, true, 23, 4);
  console.log("Written:", buf1);
  console.log("Read:", read(buf1, 0, true, 23, 4));
  console.log();

  console.log("=== Example 2: Float64 ===");
  const buf2 = new Uint8Array(8);
  write(buf2, Math.PI, 0, true, 52, 8);
  console.log("Written:", buf2);
  console.log("Read:", read(buf2, 0, true, 52, 8));
  console.log();

  console.log("🚀 ~10M+ downloads/week on npm!");
}
