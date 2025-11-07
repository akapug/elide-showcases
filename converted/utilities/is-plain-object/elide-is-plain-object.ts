export default function isPlainObject(value: any): boolean {
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}
if (import.meta.url.includes("is-plain-object.ts")) {
  console.log("✅", isPlainObject({}), isPlainObject([]), isPlainObject(null));
}
