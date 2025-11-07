// fill-range - Fill array with range of numbers
export default function fillRange(start: number, end: number, step: number = 1): number[] {
  const arr: number[] = [];
  if (step > 0) {
    for (let i = start; i <= end; i += step) arr.push(i);
  } else if (step < 0) {
    for (let i = start; i >= end; i += step) arr.push(i);
  }
  return arr;
}
if (import.meta.url.includes("fill-range.ts")) {
  console.log("✅", fillRange(1, 5));
  console.log("✅", fillRange(0, 10, 2));
}
