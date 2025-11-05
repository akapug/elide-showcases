export default function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = fn(item);
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
if (import.meta.url.includes("group-by.ts")) console.log("✅", groupBy([{t:'a',v:1},{t:'b',v:2},{t:'a',v:3}], x => x.t));
