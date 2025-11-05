export default function swapCase(str: string): string {
  return str.replace(/[a-zA-Z]/g, c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase());
}
if (import.meta.url.includes("swap-case.ts")) console.log("✅", swapCase("Hello World"));
