/**
 * Slugify Text
 * Convert text to URL-friendly slugs
 */

export function slugify(text: string, options: { separator?: string; lowercase?: boolean } = {}): string {
  const { separator = '-', lowercase = true } = options;

  let slug = text
    // Remove leading/trailing whitespace
    .trim()
    // Replace spaces with separator
    .replace(/\s+/g, separator)
    // Remove special characters
    .replace(/[^\w\-]+/g, '')
    // Replace multiple separators with single
    .replace(new RegExp(`${separator}+`, 'g'), separator)
    // Remove leading/trailing separators
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');

  return lowercase ? slug.toLowerCase() : slug;
}

export function deslugify(slug: string, options: { capitalize?: boolean } = {}): string {
  const { capitalize = true } = options;

  let text = slug.replace(/[-_]/g, ' ');

  if (capitalize) {
    text = text.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return text;
}

export function generateSlug(text: string, maxLength?: number): string {
  let slug = slugify(text);

  if (maxLength && slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Remove trailing separator if cut off mid-word
    slug = slug.replace(/-+$/, '');
  }

  return slug;
}

// CLI demo
if (import.meta.url.includes("slugify.ts")) {
  console.log("Slugify Demo\n");

  const examples = [
    "Hello World!",
    "TypeScript is Awesome",
    "This & That @ 2024",
    "   Extra   Spaces   "
  ];

  examples.forEach(text => {
    console.log("Original:", text);
    console.log("Slugified:", slugify(text));
    console.log();
  });

  console.log("Custom separator (_):");
  console.log(slugify("Hello World", { separator: '_' }));

  console.log("\nKeep uppercase:");
  console.log(slugify("TypeScript", { lowercase: false }));

  console.log("\nMax length (15):");
  console.log(generateSlug("This is a very long title that needs truncation", 15));

  console.log("\nDeslugify:");
  console.log("hello-world →", deslugify("hello-world"));
  console.log("typescript_rocks →", deslugify("typescript_rocks"));

  console.log("✅ Slugify test passed");
}
