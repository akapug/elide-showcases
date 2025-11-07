// is-even - Check if number is even
// Original: github.com/jonschlinkert/is-even
export default function isEven(value: any): boolean {
  const n = Number(value);
  if (!Number.isInteger(n)) return false;
  return n % 2 === 0;
}
if (import.meta.url.includes("is-even.ts")) {
  console.log("isEven(2) =", isEven(2));
  console.log("isEven(3) =", isEven(3));
}
