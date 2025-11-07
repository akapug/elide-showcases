export default function binarySearch<T>(arr: T[], target: T): number {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
if (import.meta.url.includes("binary-search")) console.log("✅", binarySearch([1,2,3,4,5], 3));
