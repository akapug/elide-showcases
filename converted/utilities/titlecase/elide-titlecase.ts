export default function titleCase(str: string): string {
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
if (import.meta.url.includes("titlecase.ts")) console.log("✅", titleCase("hello world"));
