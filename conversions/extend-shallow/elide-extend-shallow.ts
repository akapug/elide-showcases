export default function extend<T extends object>(...objects: T[]): T {
  return Object.assign({}, ...objects);
}
if (import.meta.url.includes("extend-shallow.ts")) {
  console.log("✅", extend({a:1}, {b:2}, {c:3}));
}
