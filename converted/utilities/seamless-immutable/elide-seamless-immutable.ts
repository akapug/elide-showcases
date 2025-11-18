/**
 * Seamless-Immutable - Immutable Data for Elide
 * NPM: 500K+ downloads/week
 */

export function Immutable<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const merge = <T extends object>(obj1: T, obj2: Partial<T>): T =>
  ({ ...obj1, ...obj2 });

export const set = <T extends object, K extends keyof T>(obj: T, key: K, value: T[K]): T =>
  ({ ...obj, [key]: value });

export const without = <T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result as Omit<T, K>;
};

if (import.meta.url.includes("seamless-immutable")) {
  console.log("🎯 Seamless-Immutable for Elide\n");
  const obj = Immutable({ a: 1, b: 2 });
  const obj2 = set(obj, 'a', 5);
  console.log("Original:", obj, "Updated:", obj2);
}

export default { Immutable, merge, set, without };
