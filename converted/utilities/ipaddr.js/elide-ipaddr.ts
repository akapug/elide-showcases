/**
 * ipaddr.js - IP Address Manipulation
 *
 * Library for manipulating IPv4 and IPv6 addresses in JavaScript.
 * **POLYGLOT SHOWCASE**: One IP manipulation library for ALL languages on Elide!
 *
 * Features:
 * - IPv4 and IPv6 parsing
 * - Address validation
 * - Range checking
 * - CIDR matching
 * - Special address detection (loopback, multicast, etc.)
 * - Address family conversion
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need IP parsing
 * - ONE implementation works everywhere on Elide
 * - Consistent IP handling across services
 * - No need for ipaddress (Python), IPAddr (Ruby), InetAddress (Java)
 *
 * Use cases:
 * - HTTP request filtering
 * - Proxy configuration
 * - Network security
 * - IP geolocation
 * - Rate limiting by IP
 * - Access control
 *
 * Package has ~150M+ downloads/week on npm!
 */

export class IPv4 {
  parts: number[];

  constructor(parts: number[]) {
    if (parts.length !== 4) {
      throw new Error('IPv4 must have 4 octets');
    }
    this.parts = parts;
  }

  static parse(str: string): IPv4 {
    const parts = str.split('.').map(x => parseInt(x, 10));
    if (parts.length !== 4 || parts.some(x => isNaN(x) || x < 0 || x > 255)) {
      throw new Error('Invalid IPv4 address');
    }
    return new IPv4(parts);
  }

  toString(): string {
    return this.parts.join('.');
  }

  toByteArray(): number[] {
    return this.parts.slice();
  }

  match(cidr: IPv4 | [IPv4, number]): boolean {
    if (Array.isArray(cidr)) {
      const [subnet, prefixLength] = cidr;
      const mask = (-1 << (32 - prefixLength)) >>> 0;
      const thisLong = this.toLong();
      const subnetLong = subnet.toLong();
      return ((thisLong & mask) >>> 0) === ((subnetLong & mask) >>> 0);
    }
    return this.toString() === cidr.toString();
  }

  toLong(): number {
    return (this.parts[0] << 24) + (this.parts[1] << 16) +
           (this.parts[2] << 8) + this.parts[3];
  }

  isPrivate(): boolean {
    const long = this.toLong();
    return (
      this.match([IPv4.parse('10.0.0.0'), 8]) ||
      this.match([IPv4.parse('172.16.0.0'), 12]) ||
      this.match([IPv4.parse('192.168.0.0'), 16]) ||
      this.match([IPv4.parse('127.0.0.0'), 8])
    );
  }

  isLoopback(): boolean {
    return this.match([IPv4.parse('127.0.0.0'), 8]);
  }
}

export class IPv6 {
  parts: number[];

  constructor(parts: number[]) {
    if (parts.length !== 8) {
      throw new Error('IPv6 must have 8 parts');
    }
    this.parts = parts;
  }

  static parse(str: string): IPv6 {
    if (str === '::') {
      return new IPv6([0, 0, 0, 0, 0, 0, 0, 0]);
    }

    // Expand :: notation
    let parts: string[];
    if (str.includes('::')) {
      const [left, right] = str.split('::');
      const leftParts = left ? left.split(':') : [];
      const rightParts = right ? right.split(':') : [];
      const missing = 8 - leftParts.length - rightParts.length;
      parts = [...leftParts, ...Array(missing).fill('0'), ...rightParts];
    } else {
      parts = str.split(':');
    }

    const numParts = parts.map(x => parseInt(x || '0', 16));
    if (numParts.length !== 8 || numParts.some(x => isNaN(x) || x < 0 || x > 0xFFFF)) {
      throw new Error('Invalid IPv6 address');
    }

    return new IPv6(numParts);
  }

  toString(): string {
    const hex = this.parts.map(x => x.toString(16));

    // Find longest sequence of zeros
    let maxZeroStart = -1;
    let maxZeroLen = 0;
    let currentZeroStart = -1;
    let currentZeroLen = 0;

    for (let i = 0; i < hex.length; i++) {
      if (hex[i] === '0') {
        if (currentZeroStart === -1) {
          currentZeroStart = i;
          currentZeroLen = 1;
        } else {
          currentZeroLen++;
        }
      } else {
        if (currentZeroLen > maxZeroLen) {
          maxZeroStart = currentZeroStart;
          maxZeroLen = currentZeroLen;
        }
        currentZeroStart = -1;
        currentZeroLen = 0;
      }
    }

    if (currentZeroLen > maxZeroLen) {
      maxZeroStart = currentZeroStart;
      maxZeroLen = currentZeroLen;
    }

    // Use :: notation for longest zero sequence
    if (maxZeroLen > 1) {
      const before = hex.slice(0, maxZeroStart).join(':');
      const after = hex.slice(maxZeroStart + maxZeroLen).join(':');
      return `${before}::${after}`.replace(/^:|:$/g, '::');
    }

    return hex.join(':');
  }

  isLoopback(): boolean {
    return this.parts.every((x, i) => i === 7 ? x === 1 : x === 0);
  }
}

/**
 * Parse IP address (auto-detect version)
 */
export function parse(str: string): IPv4 | IPv6 {
  if (str.includes(':')) {
    return IPv6.parse(str);
  }
  return IPv4.parse(str);
}

/**
 * Check if string is valid IP
 */
export function isValid(str: string): boolean {
  try {
    parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Process IP (convert IPv6-mapped IPv4)
 */
export function process(str: string): IPv4 | IPv6 {
  const addr = parse(str);

  // Convert IPv6-mapped IPv4
  if (addr instanceof IPv6) {
    const parts = addr.parts;
    if (parts.slice(0, 6).every(x => x === 0) && parts[6] === 0xFFFF) {
      const ipv4Bytes = [
        (parts[7] >>> 8) & 0xFF,
        parts[7] & 0xFF,
        (parts[6] >>> 8) & 0xFF,
        parts[6] & 0xFF
      ];
      return new IPv4(ipv4Bytes);
    }
  }

  return addr;
}

// Default export
export default {
  IPv4,
  IPv6,
  parse,
  isValid,
  process
};

// CLI Demo
if (import.meta.url.includes("elide-ipaddr.ts")) {
  console.log("🌐 ipaddr.js - IP Address Manipulation for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Parse IPv4 ===");
  const ipv4 = IPv4.parse('192.168.1.1');
  console.log(`  Address: ${ipv4.toString()}`);
  console.log(`  Octets: ${ipv4.parts.join(', ')}`);
  console.log(`  Long: ${ipv4.toLong()}`);
  console.log(`  Private: ${ipv4.isPrivate()}`);
  console.log();

  console.log("=== Example 2: Parse IPv6 ===");
  const ipv6 = IPv6.parse('2001:db8::1');
  console.log(`  Address: ${ipv6.toString()}`);
  console.log(`  Loopback: ${ipv6.isLoopback()}`);
  console.log();

  console.log("=== Example 3: CIDR Matching ===");
  const ip = IPv4.parse('192.168.1.100');
  console.log(`  IP: ${ip.toString()}`);
  console.log(`  In 192.168.0.0/16: ${ip.match([IPv4.parse('192.168.0.0'), 16])}`);
  console.log(`  In 10.0.0.0/8: ${ip.match([IPv4.parse('10.0.0.0'), 8])}`);
  console.log();

  console.log("=== Example 4: Private IP Detection ===");
  const testIPs = [
    '192.168.1.1',
    '10.0.0.1',
    '8.8.8.8',
    '172.16.0.1',
    '1.1.1.1'
  ];
  testIPs.forEach(ip => {
    const addr = IPv4.parse(ip);
    console.log(`  ${ip}: ${addr.isPrivate() ? 'Private' : 'Public'}`);
  });
  console.log();

  console.log("=== Example 5: Auto-detect IP Version ===");
  const addresses = [
    '192.168.1.1',
    '2001:db8::1',
    '::1',
    '127.0.0.1'
  ];
  addresses.forEach(addr => {
    const parsed = parse(addr);
    const type = parsed instanceof IPv4 ? 'IPv4' : 'IPv6';
    console.log(`  ${addr} → ${type}`);
  });
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same IP parsing works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent IP parsing everywhere");
  console.log("  ✓ No language-specific IP bugs");
  console.log("  ✓ Share IP logic across polyglot services");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- HTTP request filtering");
  console.log("- Proxy configuration");
  console.log("- Network security");
  console.log("- IP geolocation");
  console.log("- Rate limiting by IP");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- ~150M+ downloads/week on npm");
}
