/**
 * cidr-regex - CIDR Notation Regular Expression
 *
 * Regular expression for matching CIDR notation (IPv4 and IPv6).
 * **POLYGLOT SHOWCASE**: One CIDR regex for ALL languages on Elide!
 *
 * Features:
 * - IPv4 CIDR matching
 * - IPv6 CIDR matching
 * - Strict and non-strict modes
 * - Extract CIDR blocks from text
 * - Global and single match modes
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need CIDR validation
 * - ONE regex works everywhere on Elide
 * - Consistent CIDR parsing across languages
 * - No need for language-specific regex patterns
 *
 * Use cases:
 * - Firewall configuration parsing
 * - Network ACL validation
 * - IP allowlist/blocklist
 * - Network inventory
 * - Config file parsing
 * - Security policy validation
 *
 * Package has ~30M+ downloads/week on npm!
 */

/**
 * IPv4 CIDR regex pattern
 */
export const v4Pattern = '(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\\/(?:3[0-2]|[1-2]?[0-9])';

/**
 * IPv6 CIDR regex pattern
 */
export const v6Pattern = '(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\\/(?:12[0-8]|1[0-1][0-9]|[1-9]?[0-9])';

/**
 * Get IPv4 CIDR regex
 */
export function v4(options?: { exact?: boolean }): RegExp {
  const pattern = options?.exact ? `^${v4Pattern}$` : v4Pattern;
  return new RegExp(pattern);
}

/**
 * Get IPv6 CIDR regex
 */
export function v6(options?: { exact?: boolean }): RegExp {
  const pattern = options?.exact ? `^${v6Pattern}$` : v6Pattern;
  return new RegExp(pattern);
}

/**
 * Get combined IPv4/IPv6 CIDR regex
 */
export function cidr(options?: { exact?: boolean }): RegExp {
  const pattern = options?.exact
    ? `^(?:${v4Pattern}|${v6Pattern})$`
    : `(?:${v4Pattern}|${v6Pattern})`;
  return new RegExp(pattern);
}

/**
 * Test if string is valid CIDR notation
 */
export function test(str: string, version?: 'v4' | 'v6'): boolean {
  if (version === 'v4') {
    return v4({ exact: true }).test(str);
  }
  if (version === 'v6') {
    return v6({ exact: true }).test(str);
  }
  return cidr({ exact: true }).test(str);
}

/**
 * Extract CIDR blocks from text
 */
export function extract(text: string, version?: 'v4' | 'v6'): string[] {
  let regex: RegExp;
  if (version === 'v4') {
    regex = new RegExp(v4Pattern, 'g');
  } else if (version === 'v6') {
    regex = new RegExp(v6Pattern, 'g');
  } else {
    regex = new RegExp(`${v4Pattern}|${v6Pattern}`, 'g');
  }

  return text.match(regex) || [];
}

// Default export
export default {
  v4,
  v6,
  cidr,
  test,
  extract
};

// CLI Demo
if (import.meta.url.includes("elide-cidr-regex.ts")) {
  console.log("🌐 cidr-regex - CIDR Notation Matcher for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Validate IPv4 CIDR ===");
  const v4Tests = [
    '192.168.1.0/24',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.1.1',  // No CIDR
    '256.1.1.1/24'  // Invalid
  ];
  v4Tests.forEach(cidr => {
    console.log(`  ${cidr}: ${test(cidr, 'v4')}`);
  });
  console.log();

  console.log("=== Example 2: Validate IPv6 CIDR ===");
  const v6Tests = [
    '2001:db8::/32',
    'fe80::/10',
    '::1/128',
    '2001:db8::1'  // No CIDR
  ];
  v6Tests.forEach(cidr => {
    console.log(`  ${cidr}: ${test(cidr, 'v6')}`);
  });
  console.log();

  console.log("=== Example 3: Extract CIDR from Text ===");
  const config = `
    Allow from 192.168.1.0/24
    Allow from 10.0.0.0/8
    Allow from 2001:db8::/32
    Deny from 0.0.0.0/0
  `;
  const cidrs = extract(config);
  console.log("  Found CIDR blocks:");
  cidrs.forEach(cidr => console.log(`    - ${cidr}`));
  console.log();

  console.log("=== Example 4: Firewall Rules ===");
  const firewallConfig = `
    # Allow private networks
    allow 192.168.0.0/16
    allow 10.0.0.0/8
    allow 172.16.0.0/12

    # Allow IPv6 local
    allow fe80::/10
  `;
  const rules = extract(firewallConfig);
  console.log("  Firewall rules:");
  rules.forEach(rule => console.log(`    ✓ ${rule}`));
  console.log();

  console.log("=== Example 5: Validate Network ACL ===");
  const acls = [
    '0.0.0.0/0',
    '192.168.1.0/24',
    '10.0.0.0/8',
    'invalid/24'
  ];
  console.log("  ACL validation:");
  acls.forEach(acl => {
    const valid = test(acl);
    console.log(`    ${acl}: ${valid ? '✓ Valid' : '✗ Invalid'}`);
  });
  console.log();

  console.log("=== Example 6: Network Inventory ===");
  const inventory = [
    { name: 'Office', cidr: '192.168.1.0/24', valid: test('192.168.1.0/24') },
    { name: 'VPN', cidr: '10.8.0.0/24', valid: test('10.8.0.0/24') },
    { name: 'DMZ', cidr: '172.16.0.0/16', valid: test('172.16.0.0/16') }
  ];
  console.log("  Network inventory:");
  inventory.forEach(net => {
    console.log(`    ${net.name}: ${net.cidr} (${net.valid ? 'Valid' : 'Invalid'})`);
  });
  console.log();

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("🌐 Same CIDR regex works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One regex pattern, all languages");
  console.log("  ✓ Consistent CIDR validation everywhere");
  console.log("  ✓ Share network configs across polyglot services");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Firewall configuration parsing");
  console.log("- Network ACL validation");
  console.log("- IP allowlist/blocklist");
  console.log("- Security policy validation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- ~30M+ downloads/week on npm");
}
