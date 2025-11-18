/**
 * Mori - Persistent Data Structures for Elide
 * NPM: 100K+ downloads/week
 */

export const vector = <T>(...values: T[]): T[] => [...values];
export const conj = <T>(vec: T[], value: T): T[] => [...vec, value];
export const nth = <T>(vec: T[], index: number): T => vec[index];
export const count = <T>(vec: T[]): number => vec.length;

export const hashMap = <K extends string, V>(obj: Record<K, V> = {} as Record<K, V>): Record<K, V> => ({ ...obj });
export const assoc = <K extends string, V>(map: Record<K, V>, key: K, value: V): Record<K, V> => ({ ...map, [key]: value });
export const dissoc = <K extends string, V>(map: Record<K, V>, key: K): Record<K, V> => {
  const result = { ...map };
  delete result[key];
  return result;
};
export const get = <K extends string, V>(map: Record<K, V>, key: K): V | undefined => map[key];

export const set = <T>(...values: T[]): T[] => Array.from(new Set(values));
export const union = <T>(set1: T[], set2: T[]): T[] => Array.from(new Set([...set1, ...set2]));

if (import.meta.url.includes("mori")) {
  console.log("🎯 Mori for Elide - Persistent Data Structures\n");
  const v = vector(1, 2, 3);
  const v2 = conj(v, 4);
  console.log("Original:", v, "New:", v2);
}

export default { vector, conj, nth, count, hashMap, assoc, dissoc, get, set, union };
