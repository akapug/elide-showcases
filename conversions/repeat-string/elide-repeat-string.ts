// repeat-string - Repeat string N times
// Original: github.com/jonschlinkert/repeat-string
export default function repeat(str: string, num: number): string {
  if (typeof str !== 'string') throw new TypeError('expected a string');
  if (typeof num !== 'number') throw new TypeError('expected a number');
  return str.repeat(Math.max(0, Math.floor(num)));
}
if (import.meta.url.includes("repeat-string.ts")) {
  console.log("✅", repeat("*", 10));
  console.log("✅", repeat("Ha", 3));
}
