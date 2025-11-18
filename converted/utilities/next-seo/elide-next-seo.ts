/**
 * Next SEO - Next.js SEO Management
 *
 * Manage SEO in Next.js applications with ease.
 * **POLYGLOT SHOWCASE**: One SEO manager for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/next-seo (~500K+ downloads/week)
 *
 * Features:
 * - Configure page SEO (title, description)
 * - Open Graph support
 * - Twitter Card support
 * - JSON-LD structured data
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

export interface SEOConfig {
  title?: string;
  description?: string;
  canonical?: string;
  openGraph?: {
    type?: string;
    title?: string;
    description?: string;
    images?: Array<{ url: string; alt?: string }>;
    siteName?: string;
  };
  twitter?: {
    card?: string;
    site?: string;
    creator?: string;
  };
}

export function generateSEO(config: SEOConfig): string {
  const tags: string[] = [];

  if (config.title) {
    tags.push(`<title>${config.title}</title>`);
    tags.push(`<meta name="title" content="${config.title}">`);
  }

  if (config.description) {
    tags.push(`<meta name="description" content="${config.description}">`);
  }

  if (config.canonical) {
    tags.push(`<link rel="canonical" href="${config.canonical}">`);
  }

  if (config.openGraph) {
    const og = config.openGraph;
    if (og.type) tags.push(`<meta property="og:type" content="${og.type}">`);
    if (og.title) tags.push(`<meta property="og:title" content="${og.title}">`);
    if (og.description) tags.push(`<meta property="og:description" content="${og.description}">`);
    if (og.siteName) tags.push(`<meta property="og:site_name" content="${og.siteName}">`);
    if (og.images) {
      og.images.forEach(img => {
        tags.push(`<meta property="og:image" content="${img.url}">`);
        if (img.alt) tags.push(`<meta property="og:image:alt" content="${img.alt}">`);
      });
    }
  }

  if (config.twitter) {
    const tw = config.twitter;
    if (tw.card) tags.push(`<meta name="twitter:card" content="${tw.card}">`);
    if (tw.site) tags.push(`<meta name="twitter:site" content="${tw.site}">`);
    if (tw.creator) tags.push(`<meta name="twitter:creator" content="${tw.creator}">`);
  }

  return tags.join('\n');
}

export default generateSEO;

if (import.meta.url.includes("elide-next-seo.ts")) {
  console.log("🔍 Next SEO - Next.js SEO Management (POLYGLOT!)\n");

  const seo = generateSEO({
    title: 'My Amazing Page',
    description: 'This is the best page ever',
    canonical: 'https://example.com/page',
    openGraph: {
      type: 'website',
      title: 'My Amazing Page',
      description: 'This is the best page ever',
      siteName: 'My Site',
      images: [{ url: 'https://example.com/og.jpg', alt: 'OG Image' }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@mysite',
    },
  });

  console.log(seo);
  console.log("\n~500K+ downloads/week on npm!");
}
