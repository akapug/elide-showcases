/**
 * netmask - Network Mask Manipulation
 *
 * Parse and work with network masks, blocks, and subnets.
 * **POLYGLOT SHOWCASE**: One netmask library for ALL languages on Elide!
 *
 * Features:
 * - Network block parsing
 * - IP range operations
 * - Subnet calculations
 * - Broadcast address
 * - Network/host mask
 * - Contains checks
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need netmask calculations
 * - ONE implementation works everywhere on Elide
 * - Consistent subnet logic across languages
 * - No need for netaddr (Python), NetAddr (Ruby), etc.
 *
 * Use cases:
 * - Network planning
 * - Subnet allocation
 * - DHCP configuration
 * - IP range management
 * - Network security
 * - Firewall rules
 *
 * Package has ~15M+ downloads/week on npm!
 */

export class Netmask {
  maskLong: number;
  netLong: number;
  bitmask: number;
  base: string;
  mask: string;
  hostmask: string;
  broadcast: string;
  size: number;
  first: string;
  last: string;

  constructor(net: string, mask?: string | number) {
    let netAddr: string;
    let maskBits: number;

    if (net.includes('/')) {
      const parts = net.split('/');
      netAddr = parts[0];
      maskBits = parseInt(parts[1]);
    } else if (mask !== undefined) {
      netAddr = net;
      if (typeof mask === 'number') {
        maskBits = mask;
      } else {
        // Convert mask string to bits
        maskBits = this.maskToBits(mask);
      }
    } else {
      throw new Error('Invalid netmask format');
    }

    if (maskBits < 0 || maskBits > 32) {
      throw new Error('Invalid mask bits');
    }

    this.bitmask = maskBits;
    this.maskLong = (-1 << (32 - maskBits)) >>> 0;

    const netParts = netAddr.split('.').map(x => parseInt(x));
    this.netLong = ((netParts[0] << 24) + (netParts[1] << 16) +
                    (netParts[2] << 8) + netParts[3]) >>> 0;

    // Apply mask to get network address
    this.netLong = (this.netLong & this.maskLong) >>> 0;

    this.base = this.longToIP(this.netLong);
    this.mask = this.longToIP(this.maskLong);
    this.hostmask = this.longToIP(~this.maskLong >>> 0);

    const broadcastLong = (this.netLong | ~this.maskLong) >>> 0;
    this.broadcast = this.longToIP(broadcastLong);

    this.size = Math.pow(2, 32 - maskBits);
    this.first = this.longToIP(this.netLong + 1);
    this.last = this.longToIP(broadcastLong - 1);
  }

  private maskToBits(mask: string): number {
    const parts = mask.split('.').map(x => parseInt(x));
    const maskLong = (parts[0] << 24) + (parts[1] << 16) +
                     (parts[2] << 8) + parts[3];
    let bits = 0;
    for (let i = 31; i >= 0; i--) {
      if ((maskLong & (1 << i)) !== 0) bits++;
      else break;
    }
    return bits;
  }

  private longToIP(long: number): string {
    return [
      (long >>> 24) & 0xFF,
      (long >>> 16) & 0xFF,
      (long >>> 8) & 0xFF,
      long & 0xFF
    ].join('.');
  }

  private ipToLong(ip: string): number {
    const parts = ip.split('.').map(x => parseInt(x));
    return ((parts[0] << 24) + (parts[1] << 16) +
            (parts[2] << 8) + parts[3]) >>> 0;
  }

  contains(ip: string): boolean {
    const ipLong = this.ipToLong(ip);
    return ipLong >= this.netLong &&
           ipLong <= (this.netLong | ~this.maskLong) >>> 0;
  }

  next(count: number = 1): Netmask {
    const nextNet = (this.netLong + this.size * count) >>> 0;
    return new Netmask(this.longToIP(nextNet) + '/' + this.bitmask);
  }

  forEach(fn: (ip: string, long: number, index: number) => void): void {
    const start = this.netLong + 1;
    const end = (this.netLong | ~this.maskLong) >>> 0;

    for (let i = start; i < end; i++) {
      fn(this.longToIP(i), i, i - start);
    }
  }

  toString(): string {
    return `${this.base}/${this.bitmask}`;
  }
}

// Default export
export default Netmask;

// CLI Demo
if (import.meta.url.includes("elide-netmask.ts")) {
  console.log("🌐 netmask - Network Mask Manipulation for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Parse Network Block ===");
  const net1 = new Netmask('192.168.1.0/24');
  console.log(`  Network: ${net1.base}`);
  console.log(`  Mask: ${net1.mask}`);
  console.log(`  Broadcast: ${net1.broadcast}`);
  console.log(`  First: ${net1.first}`);
  console.log(`  Last: ${net1.last}`);
  console.log(`  Size: ${net1.size} addresses`);
  console.log();

  console.log("=== Example 2: Different Notations ===");
  const net2a = new Netmask('10.0.0.0/8');
  const net2b = new Netmask('10.0.0.0', 8);
  const net2c = new Netmask('10.0.0.0', '255.0.0.0');
  console.log(`  CIDR: ${net2a.toString()}`);
  console.log(`  Bits: ${net2b.toString()}`);
  console.log(`  Mask: ${net2c.toString()}`);
  console.log();

  console.log("=== Example 3: Contains Check ===");
  const net3 = new Netmask('192.168.1.0/24');
  const testIPs = [
    '192.168.1.1',
    '192.168.1.100',
    '192.168.1.255',
    '192.168.2.1',
    '10.0.0.1'
  ];
  testIPs.forEach(ip => {
    console.log(`  ${ip} in ${net3.toString()}: ${net3.contains(ip)}`);
  });
  console.log();

  console.log("=== Example 4: Iterate IPs ===");
  const net4 = new Netmask('192.168.1.0/29');
  console.log(`  All IPs in ${net4.toString()}:`);
  const ips: string[] = [];
  net4.forEach((ip) => {
    ips.push(ip);
  });
  console.log(`    ${ips.join(', ')}`);
  console.log();

  console.log("=== Example 5: Next Network ===");
  const net5 = new Netmask('10.0.0.0/24');
  console.log(`  Current: ${net5.toString()}`);
  console.log(`  Next: ${net5.next().toString()}`);
  console.log(`  Next x3: ${net5.next(3).toString()}`);
  console.log();

  console.log("=== Example 6: Subnet Planning ===");
  const baseNet = new Netmask('172.16.0.0/16');
  console.log("  Subnet allocation:");
  console.log(`    Main: ${baseNet.base}/${baseNet.bitmask}`);
  console.log(`    Total: ${baseNet.size} addresses`);

  const subnet = new Netmask('172.16.1.0/24');
  console.log(`    Subnet 1: ${subnet.toString()} (${subnet.size - 2} hosts)`);
  console.log(`    Subnet 2: ${subnet.next().toString()}`);
  console.log(`    Subnet 3: ${subnet.next(2).toString()}`);
  console.log();

  console.log("=== Example 7: DHCP Range ===");
  const dhcp = new Netmask('192.168.1.0/24');
  console.log("  DHCP configuration:");
  console.log(`    Network: ${dhcp.base}`);
  console.log(`    Gateway: ${dhcp.first} (usually)`);
  console.log(`    DHCP Start: 192.168.1.100`);
  console.log(`    DHCP End: 192.168.1.200`);
  console.log(`    Broadcast: ${dhcp.broadcast}`);
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Same netmask library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One implementation, all languages");
  console.log("  ✓ Consistent subnet calculations everywhere");
  console.log("  ✓ Share network planning across polyglot services");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Network planning");
  console.log("- Subnet allocation");
  console.log("- DHCP configuration");
  console.log("- IP range management");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- ~15M+ downloads/week on npm");
}
