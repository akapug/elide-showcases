export default function isPrimitive(value: any): boolean {
  return value == null || (typeof value !== 'object' && typeof value !== 'function');
}
if (import.meta.url.includes("is-primitive.ts")) {
  console.log("✅", isPrimitive(5), isPrimitive({}), isPrimitive(null));
}
