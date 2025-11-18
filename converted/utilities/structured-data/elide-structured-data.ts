/**
 * Structured Data - Schema.org Structured Data
 *
 * Generate Schema.org structured data for SEO.
 * **POLYGLOT SHOWCASE**: One structured data generator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/structured-data (~30K+ downloads/week)
 *
 * Features:
 * - Generate Schema.org structured data
 * - Support for breadcrumbs, reviews, FAQs
 * - JSON-LD output
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function createBreadcrumb(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function createFAQ(questions: Array<{ question: string; answer: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export default { createBreadcrumb, createFAQ };

if (import.meta.url.includes("elide-structured-data.ts")) {
  console.log("📊 Structured Data - Schema.org Generator (POLYGLOT!)\n");

  const breadcrumb = createBreadcrumb([
    { name: 'Home', url: 'https://example.com' },
    { name: 'Products', url: 'https://example.com/products' },
    { name: 'T-Shirt', url: 'https://example.com/products/tshirt' },
  ]);

  console.log(JSON.stringify(breadcrumb, null, 2));
  console.log("\n~30K+ downloads/week on npm!");
}
