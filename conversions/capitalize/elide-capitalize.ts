export default function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
if (import.meta.url.includes("capitalize.ts")) console.log("✅", capitalize("hello"));
