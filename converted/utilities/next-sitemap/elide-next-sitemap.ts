/**
 * Next Sitemap - Next.js Sitemap Generator
 *
 * Generate sitemaps for Next.js applications.
 * **POLYGLOT SHOWCASE**: One sitemap generator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/next-sitemap (~200K+ downloads/week)
 *
 * Features:
 * - Generate XML sitemaps
 * - Robots.txt generation
 * - Support for multiple sitemaps
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

export interface SitemapConfig {
  siteUrl: string;
  generateRobotsTxt?: boolean;
  changefreq?: string;
  priority?: number;
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

export function generateSitemap(urls: SitemapUrl[], config: SitemapConfig): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${config.siteUrl}${url.loc}</loc>\n`;
    if (url.lastmod) xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    if (url.changefreq) xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    if (url.priority !== undefined) xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n';
  }

  xml += '</urlset>';
  return xml;
}

export function generateRobotsTxt(sitemapUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}`;
}

export default { generateSitemap, generateRobotsTxt };

if (import.meta.url.includes("elide-next-sitemap.ts")) {
  console.log("🗺️  Next Sitemap - Next.js Sitemap Generator (POLYGLOT!)\n");

  const sitemap = generateSitemap(
    [
      { loc: '/', changefreq: 'daily', priority: 1.0 },
      { loc: '/about', changefreq: 'monthly', priority: 0.8 },
      { loc: '/blog', changefreq: 'weekly', priority: 0.9 },
    ],
    { siteUrl: 'https://example.com' }
  );

  console.log(sitemap);
  console.log("\n" + generateRobotsTxt('https://example.com/sitemap.xml'));
  console.log("\n~200K+ downloads/week on npm!");
}
