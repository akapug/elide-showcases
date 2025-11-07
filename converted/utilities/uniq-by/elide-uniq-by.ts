export default function uniqBy<T>(arr: T[], fn: (item: T) => any): T[] {
  const seen = new Set();
  return arr.filter(item => {
    const key = fn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
if (import.meta.url.includes("uniq-by.ts")) console.log("✅", uniqBy([{id:1},{id:2},{id:1}], x => x.id));
