export default function pick<T extends object>(obj: T, ...keys: string[]): Partial<T> {
  const result: any = {};
  keys.forEach(key => {
    if (key in obj) result[key] = (obj as any)[key];
  });
  return result;
}
if (import.meta.url.includes("pick.ts")) {
  console.log("✅", pick({a:1, b:2, c:3}, 'a', 'c'));
}
