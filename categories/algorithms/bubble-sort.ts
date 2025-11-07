export default function bubbleSort<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < result.length - i - 1; j++) {
      if (result[j] > result[j + 1]) {
        [result[j], result[j + 1]] = [result[j + 1], result[j]];
      }
    }
  }
  return result;
}
if (import.meta.url.includes("bubble-sort")) console.log("✅", bubbleSort([5,2,8,1,9]));
