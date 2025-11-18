/**
 * Schema DTS - Schema.org TypeScript Types
 *
 * TypeScript definitions for Schema.org structured data.
 * **POLYGLOT SHOWCASE**: One schema type system for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/schema-dts (~100K+ downloads/week)
 *
 * Features:
 * - Type-safe Schema.org definitions
 * - Support for Thing, Person, Organization, Product, Article
 * - JSON-LD generation
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface Thing {
  '@type': string;
  name?: string;
  description?: string;
  url?: string;
  image?: string;
}

export interface Person extends Thing {
  '@type': 'Person';
  givenName?: string;
  familyName?: string;
  email?: string;
}

export interface Organization extends Thing {
  '@type': 'Organization';
  logo?: string;
  address?: string;
}

export interface Article extends Thing {
  '@type': 'Article';
  headline: string;
  author?: Person;
  datePublished?: string;
  dateModified?: string;
}

export interface Product extends Thing {
  '@type': 'Product';
  offers?: {
    '@type': 'Offer';
    price: number;
    priceCurrency: string;
  };
  brand?: Organization;
}

export function toJsonLd(schema: Thing): string {
  return JSON.stringify({ '@context': 'https://schema.org', ...schema }, null, 2);
}

export default { toJsonLd };

if (import.meta.url.includes("elide-schema-dts.ts")) {
  console.log("📐 Schema DTS - Schema.org Types (POLYGLOT!)\n");

  const article: Article = {
    '@type': 'Article',
    headline: 'Best TypeScript Practices',
    description: 'Learn TS best practices',
    author: {
      '@type': 'Person',
      name: 'John Doe',
      givenName: 'John',
      familyName: 'Doe',
    },
    datePublished: '2024-01-01',
  };

  console.log(toJsonLd(article));
  console.log("\n~100K+ downloads/week on npm!");
}
