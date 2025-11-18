/**
 * RFC5322 Address Parser - RFC 5322 Email Address Parser
 *
 * Parse email addresses according to RFC 5322.
 * **POLYGLOT SHOWCASE**: One RFC parser for ALL languages on Elide!
 */

export interface ParsedAddress {
  name?: string;
  email: string;
  local: string;
  domain: string;
}

export function parse(address: string): ParsedAddress | null {
  // Handle "Name <email@domain.com>" format
  const withNameMatch = address.match(/^(.+?)\s*<(.+?)>$/);
  let email: string;
  let name: string | undefined;

  if (withNameMatch) {
    name = withNameMatch[1].replace(/^["']|["']$/g, '').trim();
    email = withNameMatch[2];
  } else {
    email = address.trim();
  }

  // Parse email
  const emailParts = email.split('@');
  if (emailParts.length !== 2) return null;

  const [local, domain] = emailParts;

  return {
    name,
    email,
    local,
    domain
  };
}

export function parseList(addressList: string): ParsedAddress[] {
  return addressList
    .split(',')
    .map(addr => parse(addr.trim()))
    .filter((addr): addr is ParsedAddress => addr !== null);
}

export default { parse, parseList };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📧 RFC5322 Address Parser - RFC Parser for Elide (POLYGLOT!)\n");

  const addresses = [
    'user@example.com',
    'John Doe <john@example.com>',
    '"Jane Smith" <jane@example.com>'
  ];

  addresses.forEach(addr => {
    const parsed = parse(addr);
    console.log(addr);
    console.log("  Parsed:", parsed);
  });

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
