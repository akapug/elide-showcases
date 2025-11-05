export default function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
if (import.meta.url.includes("random-int.ts")) console.log("✅", randomInt(1, 10));
