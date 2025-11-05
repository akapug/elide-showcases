export default function omit<T extends object>(obj: T, ...keys: string[]): Partial<T> {
  const result = {...obj};
  keys.forEach(key => delete (result as any)[key]);
  return result;
}
if (import.meta.url.includes("omit.ts")) {
  console.log("✅", omit({a:1, b:2, c:3}, 'b'));
}
