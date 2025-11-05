export default function snakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_').toLowerCase();
}
if (import.meta.url.includes("snakecase.ts")) {
  console.log("✅", snakeCase("fooBar"), snakeCase("hello-world"));
}
