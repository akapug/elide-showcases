export default function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
if (import.meta.url.includes("chunk-array.ts")) console.log("✅", chunk([1,2,3,4,5], 2));
