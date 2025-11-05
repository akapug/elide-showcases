export default function hasValues(val: any): boolean {
  if (val == null) return false;
  if (typeof val === 'boolean') return false;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return val.length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return Boolean(val);
}
if (import.meta.url.includes("has-values.ts")) {
  console.log("✅", hasValues("test"), hasValues(""), hasValues([1]));
}
