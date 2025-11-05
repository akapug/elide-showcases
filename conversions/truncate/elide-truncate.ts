export default function truncate(str: string, len: number, suffix = '...'): string {
  if (str.length <= len) return str;
  return str.slice(0, len - suffix.length) + suffix;
}
if (import.meta.url.includes("truncate.ts")) console.log("✅", truncate("Hello World", 8));
