/**
 * Robots Parser - robots.txt Parser
 *
 * Parse and query robots.txt files for SEO and crawling.
 * **POLYGLOT SHOWCASE**: One robots.txt parser for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/robots-parser (~100K+ downloads/week)
 *
 * Features:
 * - Parse robots.txt content
 * - Check if URL is allowed for user-agent
 * - Support for wildcards
 * - Sitemap extraction
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need robots.txt parsing
 * - ONE implementation works everywhere on Elide
 * - Consistent crawling rules across services
 *
 * Package has ~100K+ downloads/week on npm!
 */

interface Rule {
  userAgent: string;
  allow: string[];
  disallow: string[];
}

export class RobotsParser {
  private rules: Rule[] = [];
  private sitemaps: string[] = [];

  parse(content: string): void {
    const lines = content.split('\n');
    let currentAgent = '*';
    let currentRule: Rule = { userAgent: currentAgent, allow: [], disallow: [] };

    for (let line of lines) {
      line = line.trim().split('#')[0];
      if (!line) continue;

      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      const keyLower = key.toLowerCase().trim();

      if (keyLower === 'user-agent') {
        if (currentRule.allow.length > 0 || currentRule.disallow.length > 0) {
          this.rules.push(currentRule);
        }
        currentAgent = value;
        currentRule = { userAgent: currentAgent, allow: [], disallow: [] };
      } else if (keyLower === 'allow') {
        currentRule.allow.push(value);
      } else if (keyLower === 'disallow') {
        currentRule.disallow.push(value);
      } else if (keyLower === 'sitemap') {
        this.sitemaps.push(value);
      }
    }

    if (currentRule.allow.length > 0 || currentRule.disallow.length > 0) {
      this.rules.push(currentRule);
    }
  }

  isAllowed(url: string, userAgent: string = '*'): boolean {
    const rule = this.rules.find(r => r.userAgent === userAgent) ||
                 this.rules.find(r => r.userAgent === '*');

    if (!rule) return true;

    for (const pattern of rule.disallow) {
      if (this.matches(url, pattern)) return false;
    }

    for (const pattern of rule.allow) {
      if (this.matches(url, pattern)) return true;
    }

    return true;
  }

  private matches(url: string, pattern: string): boolean {
    if (pattern === '') return true;
    const regex = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp('^' + regex).test(url);
  }

  getSitemaps(): string[] {
    return this.sitemaps;
  }
}

export default RobotsParser;

if (import.meta.url.includes("elide-robots-parser.ts")) {
  console.log("🤖 Robots Parser - robots.txt Parser (POLYGLOT!)\n");

  const parser = new RobotsParser();
  
  const robotsTxt = `
User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /public/

User-agent: Googlebot
Allow: /

Sitemap: https://example.com/sitemap.xml
  `;

  parser.parse(robotsTxt);

  console.log("Is /admin/ allowed?", parser.isAllowed('/admin/'));
  console.log("Is /public/ allowed?", parser.isAllowed('/public/'));
  console.log("Sitemaps:", parser.getSitemaps());
  console.log("\n~100K+ downloads/week on npm!");
}
