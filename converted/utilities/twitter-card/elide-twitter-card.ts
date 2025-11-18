/**
 * Twitter Card - Twitter Card Meta Tags
 *
 * Generate Twitter Card meta tags for social sharing.
 * **POLYGLOT SHOWCASE**: One Twitter Card generator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/twitter-card (~20K+ downloads/week)
 *
 * Features:
 * - Generate Twitter Card tags
 * - Support for summary, summary_large_image, app, player
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export type TwitterCardType = 'summary' | 'summary_large_image' | 'app' | 'player';

export interface TwitterCardData {
  card: TwitterCardType;
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
}

export function generateTwitterCard(data: TwitterCardData): string[] {
  const tags: string[] = [];

  tags.push(`<meta name="twitter:card" content="${data.card}">`);

  if (data.site) tags.push(`<meta name="twitter:site" content="${data.site}">`);
  if (data.creator) tags.push(`<meta name="twitter:creator" content="${data.creator}">`);
  if (data.title) tags.push(`<meta name="twitter:title" content="${data.title}">`);
  if (data.description) tags.push(`<meta name="twitter:description" content="${data.description}">`);
  if (data.image) tags.push(`<meta name="twitter:image" content="${data.image}">`);
  if (data.imageAlt) tags.push(`<meta name="twitter:image:alt" content="${data.imageAlt}">`);

  return tags;
}

export default generateTwitterCard;

if (import.meta.url.includes("elide-twitter-card.ts")) {
  console.log("🐦 Twitter Card - Twitter Card Meta Tags (POLYGLOT!)\n");

  const tags = generateTwitterCard({
    card: 'summary_large_image',
    site: '@mysite',
    creator: '@author',
    title: 'Amazing Article',
    description: 'Read this amazing article',
    image: 'https://example.com/twitter.jpg',
    imageAlt: 'Article cover image',
  });

  tags.forEach(tag => console.log(tag));
  console.log("\n~20K+ downloads/week on npm!");
}
