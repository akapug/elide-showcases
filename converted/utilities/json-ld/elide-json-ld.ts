/**
 * JSON-LD - Structured Data for SEO
 *
 * Generate JSON-LD structured data for rich snippets.
 * **POLYGLOT SHOWCASE**: One JSON-LD generator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/json-ld (~50K+ downloads/week)
 *
 * Features:
 * - Generate Schema.org JSON-LD
 * - Support for articles, products, organizations
 * - Type-safe structured data
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need structured data
 * - ONE implementation works everywhere on Elide
 * - Consistent rich snippets across services
 *
 * Package has ~50K+ downloads/week on npm!
 */

export type JsonLdType = 'Article' | 'Product' | 'Organization' | 'Person' | 'WebSite' | 'BreadcrumbList';

export interface JsonLd {
  '@context': string;
  '@type': JsonLdType;
  [key: string]: any;
}

export function createArticle(data: {
  headline: string;
  description?: string;
  author?: string;
  datePublished?: string;
  image?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline,
    description: data.description,
    author: data.author ? { '@type': 'Person', name: data.author } : undefined,
    datePublished: data.datePublished,
    image: data.image,
  };
}

export function createProduct(data: {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    offers: data.price ? {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.currency || 'USD',
    } : undefined,
    image: data.image,
  };
}

export function createOrganization(data: {
  name: string;
  url?: string;
  logo?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
  };
}

export function toScript(jsonLd: JsonLd): string {
  return `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`;
}

export default { createArticle, createProduct, createOrganization, toScript };

if (import.meta.url.includes("elide-json-ld.ts")) {
  console.log("📋 JSON-LD - Structured Data Generator (POLYGLOT!)\n");

  console.log("=== Article JSON-LD ===");
  const article = createArticle({
    headline: 'Best TypeScript Practices',
    description: 'Learn TypeScript best practices',
    author: 'John Doe',
    datePublished: '2024-01-01',
  });
  console.log(JSON.stringify(article, null, 2));

  console.log("\n=== Product JSON-LD ===");
  const product = createProduct({
    name: 'Red T-Shirt',
    description: 'High quality cotton',
    price: 29.99,
    currency: 'USD',
  });
  console.log(JSON.stringify(product, null, 2));

  console.log("\n=== HTML Script Tag ===");
  console.log(toScript(article));

  console.log("\n~50K+ downloads/week on npm!");
}
