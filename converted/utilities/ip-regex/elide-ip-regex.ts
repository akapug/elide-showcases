/**
 * ip-regex - IP Address Regular Expression
 *
 * Regular expression for matching IPv4 and IPv6 addresses.
 * **POLYGLOT SHOWCASE**: One IP regex for ALL languages on Elide!
 *
 * Features:
 * - IPv4 address matching
 * - IPv6 address matching
 * - Extract IPs from text
 * - Strict and non-strict modes
 * - Global and single match modes
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need IP validation
 * - ONE regex works everywhere on Elide
 * - Consistent IP parsing across languages
 * - No need for language-specific regex patterns
 *
 * Use cases:
 * - Log file parsing
 * - IP extraction from text
 * - Web scraping
 * - Network monitoring
 * - Security analysis
 * - Access log processing
 *
 * Package has ~40M+ downloads/week on npm!
 */

/**
 * IPv4 regex pattern
 */
export const v4Pattern = '(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])(?:\\.(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])){3}';

/**
 * IPv6 regex pattern
 */
export const v6Pattern = '(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:)';

/**
 * Get IPv4 regex
 */
export function v4(options?: { exact?: boolean }): RegExp {
  const pattern = options?.exact ? `^${v4Pattern}$` : v4Pattern;
  return new RegExp(pattern);
}

/**
 * Get IPv6 regex
 */
export function v6(options?: { exact?: boolean }): RegExp {
  const pattern = options?.exact ? `^${v6Pattern}$` : v6Pattern;
  return new RegExp(pattern);
}

/**
 * Get combined IPv4/IPv6 regex
 */
export function ip(options?: { exact?: boolean }): RegExp {
  const pattern = options?.exact
    ? `^(?:${v4Pattern}|${v6Pattern})$`
    : `(?:${v4Pattern}|${v6Pattern})`;
  return new RegExp(pattern);
}

/**
 * Test if string is valid IP address
 */
export function test(str: string, version?: 'v4' | 'v6'): boolean {
  if (version === 'v4') {
    return v4({ exact: true }).test(str);
  }
  if (version === 'v6') {
    return v6({ exact: true }).test(str);
  }
  return ip({ exact: true }).test(str);
}

/**
 * Extract IP addresses from text
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
  ip,
  test,
  extract
};

// CLI Demo
if (import.meta.url.includes("elide-ip-regex.ts")) {
  console.log("🌐 ip-regex - IP Address Matcher for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Validate IPv4 ===");
  const v4Tests = [
    '192.168.1.1',
    '10.0.0.1',
    '256.1.1.1',
    '8.8.8.8',
    'not-an-ip'
  ];
  v4Tests.forEach(ip => {
    console.log(`  ${ip}: ${test(ip, 'v4')}`);
  });
  console.log();

  console.log("=== Example 2: Validate IPv6 ===");
  const v6Tests = [
    '2001:db8::1',
    '::1',
    '2001:db8:0:0:0:0:0:1',
    'invalid'
  ];
  v6Tests.forEach(ip => {
    console.log(`  ${ip}: ${test(ip, 'v6')}`);
  });
  console.log();

  console.log("=== Example 3: Extract IPs from Logs ===");
  const logLine = 'Request from 192.168.1.100 to 10.0.0.5 at 2024-01-01';
  const ips = extract(logLine);
  console.log(`  Log: ${logLine}`);
  console.log(`  IPs found: ${ips.join(', ')}`);
  console.log();

  console.log("=== Example 4: Parse Apache Access Log ===");
  const accessLog = `
    192.168.1.1 - - [01/Jan/2024:12:00:00] "GET / HTTP/1.1" 200
    10.0.0.5 - - [01/Jan/2024:12:00:01] "POST /api HTTP/1.1" 201
    172.16.0.10 - - [01/Jan/2024:12:00:02] "GET /status HTTP/1.1" 200
  `;
  const logIPs = extract(accessLog);
  console.log("  IPs in access log:");
  logIPs.forEach(ip => console.log(`    - ${ip}`));
  console.log();

  console.log("=== Example 5: Extract from Network Config ===");
  const config = `
    interface eth0
      address 192.168.1.1
      gateway 192.168.1.254
      nameserver 8.8.8.8
      nameserver 8.8.4.4
  `;
  const configIPs = extract(config);
  console.log("  Network config IPs:");
  configIPs.forEach(ip => console.log(`    - ${ip}`));
  console.log();

  console.log("=== Example 6: Security Analysis ===");
  const securityLog = `
    Failed login from 203.0.113.45
    Blocked request from 198.51.100.23
    Suspicious activity from 192.0.2.100
  `;
  const suspiciousIPs = extract(securityLog);
  console.log("  Suspicious IPs:");
  suspiciousIPs.forEach(ip => console.log(`    🚨 ${ip}`));
  console.log();

  console.log("=== Example 7: Mixed IPv4/IPv6 ===");
  const mixed = 'IPv4: 192.168.1.1, IPv6: 2001:db8::1, IPv4: 10.0.0.1';
  const allIPs = extract(mixed);
  console.log(`  Text: ${mixed}`);
  console.log("  All IPs:");
  allIPs.forEach(ip => {
    const type = test(ip, 'v4') ? 'IPv4' : 'IPv6';
    console.log(`    - ${ip} (${type})`);
  });
  console.log();

  console.log("=== Example 8: POLYGLOT Use Case ===");
  console.log("🌐 Same IP regex works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One regex pattern, all languages");
  console.log("  ✓ Consistent IP extraction everywhere");
  console.log("  ✓ Share log parsing across polyglot services");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Log file parsing");
  console.log("- IP extraction from text");
  console.log("- Network monitoring");
  console.log("- Security analysis");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- ~40M+ downloads/week on npm");
}
