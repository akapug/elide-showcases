/**
 * dns-over-http-resolver - DNS over HTTPS (DoH)
 *
 * Resolve DNS queries over HTTPS for privacy and security.
 * **POLYGLOT SHOWCASE**: One DoH resolver for ALL languages on Elide!
 *
 * Features:
 * - DNS over HTTPS (DoH)
 * - Multiple DoH providers
 * - Privacy-focused
 * - Encrypted DNS
 *
 * Package has ~1M+ downloads/week on npm!
 */

const DOH_PROVIDERS = {
  cloudflare: 'https://cloudflare-dns.com/dns-query',
  google: 'https://dns.google/resolve',
  quad9: 'https://dns.quad9.net/dns-query'
};

export async function resolve(
  domain: string,
  recordType: string = 'A',
  provider: keyof typeof DOH_PROVIDERS = 'cloudflare'
): Promise<string[]> {
  const url = `${DOH_PROVIDERS[provider]}?name=${domain}&type=${recordType}`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/dns-json' }
    });
    const data = await response.json();
    return data.Answer?.map((a: any) => a.data) || [];
  } catch {
    return [];
  }
}

export default { resolve, DOH_PROVIDERS };

if (import.meta.url.includes("elide-dns-over-http-resolver.ts")) {
  console.log("🌐 dns-over-http-resolver - DoH Resolver for Elide (POLYGLOT!)\n");
  console.log("=== DNS over HTTPS ===");
  console.log("  Providers:");
  console.log("    - Cloudflare: " + DOH_PROVIDERS.cloudflare);
  console.log("    - Google: " + DOH_PROVIDERS.google);
  console.log("    - Quad9: " + DOH_PROVIDERS.quad9);
  console.log();
  console.log("Try: await resolve('example.com', 'A', 'cloudflare')");
  console.log();
  console.log("✅ ~1M+ downloads/week on npm");
}
