/**
 * public-ip - Get Your Public IP Address
 *
 * Get your public IP address by querying external services.
 * **POLYGLOT SHOWCASE**: One public IP getter for ALL languages on Elide!
 *
 * Features:
 * - Get public IPv4
 * - Get public IPv6
 * - Multiple fallback services
 * - HTTP/HTTPS support
 *
 * Package has ~5M+ downloads/week on npm!
 */

const IPV4_SERVICES = [
  'https://api.ipify.org?format=json',
  'https://api.my-ip.io/ip.json',
  'https://ipapi.co/json/'
];

const IPV6_SERVICES = [
  'https://api64.ipify.org?format=json'
];

async function queryService(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.ip || data.IP || null;
  } catch {
    return null;
  }
}

export async function v4(): Promise<string> {
  for (const service of IPV4_SERVICES) {
    const ip = await queryService(service);
    if (ip) return ip;
  }
  throw new Error('Could not get public IPv4 address');
}

export async function v6(): Promise<string> {
  for (const service of IPV6_SERVICES) {
    const ip = await queryService(service);
    if (ip) return ip;
  }
  throw new Error('Could not get public IPv6 address');
}

export default { v4, v6 };

if (import.meta.url.includes("elide-public-ip.ts")) {
  console.log("🌐 public-ip - Get Public IP for Elide (POLYGLOT!)\n");
  console.log("Note: Requires network access to query external services");
  console.log("Try: await v4() to get your public IPv4");
  console.log();
  console.log("✅ ~5M+ downloads/week on npm");
}
