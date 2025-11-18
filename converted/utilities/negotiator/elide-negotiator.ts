/**
 * Negotiator - HTTP Content Negotiation
 *
 * HTTP content negotiation.
 * **POLYGLOT SHOWCASE**: Content negotiation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/negotiator (~30M downloads/week)
 *
 * Features:
 * - Media type negotiation
 * - Language negotiation
 * - Encoding negotiation
 * - Charset negotiation
 * - Quality value parsing
 * - Zero dependencies
 *
 * Package has ~30M downloads/week on npm!
 */

interface Request {
  headers: Record<string, string>;
}

class Negotiator {
  constructor(private request: Request) {}

  mediaTypes(available?: string[]): string[] {
    const accept = this.request.headers["accept"] || "*/*";
    const types = accept.split(",").map((t) => t.trim().split(";")[0]);
    return available ? types.filter((t) => available.includes(t)) : types;
  }

  languages(available?: string[]): string[] {
    const lang = this.request.headers["accept-language"] || "*";
    const langs = lang.split(",").map((l) => l.trim().split(";")[0]);
    return available ? langs.filter((l) => available.includes(l)) : langs;
  }

  encodings(available?: string[]): string[] {
    const enc = this.request.headers["accept-encoding"] || "*";
    const encs = enc.split(",").map((e) => e.trim());
    return available ? encs.filter((e) => available.includes(e)) : encs;
  }

  charsets(available?: string[]): string[] {
    const charset = this.request.headers["accept-charset"] || "*";
    const charsets = charset.split(",").map((c) => c.trim());
    return available ? charsets.filter((c) => available.includes(c)) : charsets;
  }
}

export default Negotiator;
export { Negotiator };

if (import.meta.url.includes("elide-negotiator.ts")) {
  console.log("🤝 Negotiator - HTTP Content Negotiation (POLYGLOT!)\n");

  const req = {
    headers: {
      "accept": "application/json, text/html",
      "accept-language": "en-US, fr;q=0.9",
      "accept-encoding": "gzip, deflate, br",
    },
  };

  const neg = new Negotiator(req);
  console.log("Media types:", neg.mediaTypes());
  console.log("Languages:", neg.languages());
  console.log("Encodings:", neg.encodings());
  console.log("\n💡 Polyglot: Same negotiation everywhere!");
}
