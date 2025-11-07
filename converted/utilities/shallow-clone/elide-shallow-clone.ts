export default function shallowClone<T>(obj: T): T {
  if (Array.isArray(obj)) return [...obj] as T;
  if (obj && typeof obj === 'object') return {...obj};
  return obj;
}
if (import.meta.url.includes("shallow-clone.ts")) {
  console.log("✅", shallowClone({a:1}), shallowClone([1,2,3]));
}
