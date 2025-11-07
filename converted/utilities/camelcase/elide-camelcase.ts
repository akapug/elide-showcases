export default function camelCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
}
if (import.meta.url.includes("camelcase.ts")) {
  console.log("✅", camelCase("foo-bar"), camelCase("hello_world"));
}
