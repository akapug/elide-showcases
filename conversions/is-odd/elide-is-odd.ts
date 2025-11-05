// is-odd - Check if number is odd
// Original: github.com/jonschlinkert/is-odd
export default function isOdd(value: any): boolean {
  const n = Number(value);
  if (!Number.isInteger(n)) return false;
  return Math.abs(n % 2) === 1;
}
if (import.meta.url.includes("is-odd.ts")) {
  console.log("isOdd(3) =", isOdd(3));
  console.log("isOdd(2) =", isOdd(2));
}
