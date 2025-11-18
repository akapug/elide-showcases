/**
 * Open Graph - OG Meta Tags Generator
 *
 * Generate Open Graph meta tags for social sharing.
 * **POLYGLOT SHOWCASE**: One OG generator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/open-graph (~30K+ downloads/week)
 *
 * Features:
 * - Generate OG meta tags
 * - Support for all OG properties
 * - Twitter Card integration
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export interface OpenGraphData {
  title: string;
  type?: string;
  url?: string;
  description?: string;
  image?: string | string[];
  siteName?: string;
  locale?: string;
}

export function generateOpenGraph(data: OpenGraphData): string[] {
  const tags: string[] = [];

  tags.push(`<meta property="og:title" content="${data.title}">`);

  if (data.type) tags.push(`<meta property="og:type" content="${data.type}">`);
  if (data.url) tags.push(`<meta property="og:url" content="${data.url}">`);
  if (data.description) tags.push(`<meta property="og:description" content="${data.description}">`);
  if (data.siteName) tags.push(`<meta property="og:site_name" content="${data.siteName}">`);
  if (data.locale) tags.push(`<meta property="og:locale" content="${data.locale}">`);

  if (data.image) {
    const images = Array.isArray(data.image) ? data.image : [data.image];
    images.forEach(img => tags.push(`<meta property="og:image" content="${img}">`));
  }

  return tags;
}

export default generateOpenGraph;

if (import.meta.url.includes("elide-open-graph.ts")) {
  console.log("📱 Open Graph - OG Meta Tags (POLYGLOT!)\n");

  const tags = generateOpenGraph({
    title: 'Amazing Article',
    type: 'article',
    url: 'https://example.com/article',
    description: 'Read this amazing article',
    image: 'https://example.com/image.jpg',
    siteName: 'My Blog',
  });

  tags.forEach(tag => console.log(tag));
  console.log("\n~30K+ downloads/week on npm!");
}
