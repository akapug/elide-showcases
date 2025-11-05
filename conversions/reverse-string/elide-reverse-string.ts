export default function reverse(str: string): string {
  return str.split('').reverse().join('');
}
if (import.meta.url.includes("reverse-string.ts")) console.log("✅", reverse("hello"));
