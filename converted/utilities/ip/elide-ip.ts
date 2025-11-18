/**
 * IP - IP Address Utilities
 *
 * Comprehensive IP address manipulation library for IPv4 and IPv6.
 * **POLYGLOT SHOWCASE**: One IP utility library for ALL languages on Elide!
 *
 * Features:
 * - IPv4 and IPv6 address validation
 * - CIDR notation support
 * - Subnet calculations
 * - IP range operations
 * - Address to long conversion
 * - Network mask operations
 * - Private/public IP detection
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need IP utilities
 * - ONE implementation works everywhere on Elide
 * - Consistent network logic across languages
 * - No need for language-specific IP libs
 *
 * Use cases:
 * - Network configuration
 * - Firewall rules
 * - Load balancers
 * - Security filtering
 * - IP allowlisting/blocklisting
 * - Subnet management
 *
 * Package has ~150M+ downloads/week on npm!
 */

/**
 * Convert IPv4 to long integer
 */
export function toLong(ip: string): number {
  const parts = ip.split('.');
  return (parseInt(parts[0]) << 24) +
         (parseInt(parts[1]) << 16) +
         (parseInt(parts[2]) << 8) +
         parseInt(parts[3]);
}

/**
 * Convert long integer to IPv4
 */
export function fromLong(long: number): string {
  return [
    (long >>> 24) & 0xFF,
    (long >>> 16) & 0xFF,
    (long >>> 8) & 0xFF,
    long & 0xFF
  ].join('.');
}

/**
 * Check if IP is valid IPv4
 */
export function isV4Format(ip: string): boolean {
  const v4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!v4Regex.test(ip)) return false;

  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part);
    return num >= 0 && num <= 255;
  });
}

/**
 * Check if IP is valid IPv6
 */
export function isV6Format(ip: string): boolean {
  const v6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return v6Regex.test(ip);
}

/**
 * Check if IP is private
 */
export function isPrivate(ip: string): boolean {
  if (!isV4Format(ip)) return false;

  const long = toLong(ip);
  return (
    (long >= toLong('10.0.0.0') && long <= toLong('10.255.255.255')) ||
    (long >= toLong('172.16.0.0') && long <= toLong('172.31.255.255')) ||
    (long >= toLong('192.168.0.0') && long <= toLong('192.168.255.255')) ||
    (long >= toLong('127.0.0.0') && long <= toLong('127.255.255.255'))
  );
}

/**
 * Check if IP is public
 */
export function isPublic(ip: string): boolean {
  return isV4Format(ip) && !isPrivate(ip);
}

/**
 * Check if IP is loopback
 */
export function isLoopback(ip: string): boolean {
  if (!isV4Format(ip)) return false;
  const long = toLong(ip);
  return long >= toLong('127.0.0.0') && long <= toLong('127.255.255.255');
}

/**
 * CIDR subnet info
 */
export interface SubnetInfo {
  networkAddress: string;
  firstAddress: string;
  lastAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  subnetMaskLength: number;
  numHosts: number;
  length: number;
  contains: (ip: string) => boolean;
}

/**
 * Parse CIDR notation
 */
export function cidrSubnet(cidr: string): SubnetInfo {
  const [ip, maskLength] = cidr.split('/');
  const mask = parseInt(maskLength);

  if (!isV4Format(ip) || mask < 0 || mask > 32) {
    throw new Error('Invalid CIDR notation');
  }

  const ipLong = toLong(ip);
  const maskLong = (-1 << (32 - mask)) >>> 0;
  const networkLong = (ipLong & maskLong) >>> 0;
  const broadcastLong = (networkLong | ~maskLong) >>> 0;

  const numHosts = Math.pow(2, 32 - mask) - 2;

  return {
    networkAddress: fromLong(networkLong),
    firstAddress: fromLong(networkLong + 1),
    lastAddress: fromLong(broadcastLong - 1),
    broadcastAddress: fromLong(broadcastLong),
    subnetMask: fromLong(maskLong),
    subnetMaskLength: mask,
    numHosts: numHosts > 0 ? numHosts : 0,
    length: Math.pow(2, 32 - mask),
    contains: (testIp: string) => {
      if (!isV4Format(testIp)) return false;
      const testLong = toLong(testIp);
      return testLong >= networkLong && testLong <= broadcastLong;
    }
  };
}

/**
 * Get subnet mask from prefix length
 */
export function mask(prefixLength: number): string {
  if (prefixLength < 0 || prefixLength > 32) {
    throw new Error('Invalid prefix length');
  }
  const maskLong = (-1 << (32 - prefixLength)) >>> 0;
  return fromLong(maskLong);
}

/**
 * Create CIDR notation
 */
export function cidr(ip: string, prefixLength: number): string {
  if (!isV4Format(ip)) {
    throw new Error('Invalid IPv4 address');
  }
  if (prefixLength < 0 || prefixLength > 32) {
    throw new Error('Invalid prefix length');
  }
  return `${ip}/${prefixLength}`;
}

/**
 * Check if two IPs are in same subnet
 */
export function subnet(ip1: string, ip2: string, maskLength: number): boolean {
  if (!isV4Format(ip1) || !isV4Format(ip2)) return false;

  const maskLong = (-1 << (32 - maskLength)) >>> 0;
  const network1 = (toLong(ip1) & maskLong) >>> 0;
  const network2 = (toLong(ip2) & maskLong) >>> 0;

  return network1 === network2;
}

/**
 * Get IP address or localhost
 */
export function address(family?: 'ipv4' | 'ipv6'): string {
  // In browser/edge runtime, return localhost
  return family === 'ipv6' ? '::1' : '127.0.0.1';
}

// Default export
export default {
  toLong,
  fromLong,
  isV4Format,
  isV6Format,
  isPrivate,
  isPublic,
  isLoopback,
  cidrSubnet,
  mask,
  cidr,
  subnet,
  address
};

// CLI Demo
if (import.meta.url.includes("elide-ip.ts")) {
  console.log("🌐 IP - IP Address Utilities for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: IPv4 Validation ===");
  const testIPs = [
    '192.168.1.1',
    '10.0.0.1',
    '256.1.1.1',
    'invalid',
    '172.16.0.1'
  ];
  testIPs.forEach(ip => {
    console.log(`  ${ip}: ${isV4Format(ip)}`);
  });
  console.log();

  console.log("=== Example 2: IP to Long Conversion ===");
  const ip1 = '192.168.1.1';
  const long1 = toLong(ip1);
  console.log(`  ${ip1} → ${long1}`);
  console.log(`  ${long1} → ${fromLong(long1)}`);
  console.log();

  console.log("=== Example 3: Private vs Public ===");
  const ips = [
    '192.168.1.1',
    '10.0.0.1',
    '8.8.8.8',
    '172.16.0.1',
    '1.1.1.1'
  ];
  ips.forEach(ip => {
    console.log(`  ${ip}: ${isPrivate(ip) ? 'Private' : 'Public'}`);
  });
  console.log();

  console.log("=== Example 4: CIDR Subnets ===");
  const subnet1 = cidrSubnet('192.168.1.0/24');
  console.log(`  Network: ${subnet1.networkAddress}`);
  console.log(`  First: ${subnet1.firstAddress}`);
  console.log(`  Last: ${subnet1.lastAddress}`);
  console.log(`  Broadcast: ${subnet1.broadcastAddress}`);
  console.log(`  Mask: ${subnet1.subnetMask}`);
  console.log(`  Hosts: ${subnet1.numHosts}`);
  console.log();

  console.log("=== Example 5: Subnet Membership ===");
  const subnet2 = cidrSubnet('10.0.0.0/8');
  const testIPs2 = ['10.1.1.1', '10.255.255.255', '192.168.1.1'];
  testIPs2.forEach(ip => {
    console.log(`  ${ip} in 10.0.0.0/8: ${subnet2.contains(ip)}`);
  });
  console.log();

  console.log("=== Example 6: Subnet Masks ===");
  [8, 16, 24, 28, 32].forEach(prefix => {
    console.log(`  /${prefix} → ${mask(prefix)}`);
  });
  console.log();

  console.log("=== Example 7: Loopback Detection ===");
  const loopbacks = ['127.0.0.1', '127.0.0.2', '192.168.1.1'];
  loopbacks.forEach(ip => {
    console.log(`  ${ip}: ${isLoopback(ip) ? 'Loopback' : 'Not loopback'}`);
  });
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Same IP utilities work in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent network logic everywhere");
  console.log("  ✓ No language-specific IP bugs");
  console.log("  ✓ Share firewall rules across polyglot services");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Network configuration");
  console.log("- Firewall rules");
  console.log("- Load balancers");
  console.log("- Security filtering");
  console.log("- IP allowlisting/blocklisting");
  console.log("- Subnet management");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- ~150M+ downloads/week on npm");
}
