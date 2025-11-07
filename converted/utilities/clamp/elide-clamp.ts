export default function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}
if (import.meta.url.includes("clamp.ts")) console.log("✅", clamp(5, 0, 10), clamp(-5, 0, 10));
