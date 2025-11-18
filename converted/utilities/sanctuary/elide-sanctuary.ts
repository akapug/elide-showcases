/**
 * Sanctuary - Functional JavaScript for Elide
 * NPM: 100K+ downloads/week
 */

export const map = <A, B>(f: (a: A) => B) => (functor: A[]): B[] => functor.map(f);
export const chain = <A, B>(f: (a: A) => B[]) => (monad: A[]): B[] => monad.flatMap(f);
export const filter = <A>(pred: (a: A) => boolean) => (arr: A[]): A[] => arr.filter(pred);
export const reduce = <A, B>(f: (acc: B, val: A) => B) => (init: B) => (arr: A[]): B => arr.reduce(f, init);

export const head = <A>(arr: A[]): A | undefined => arr[0];
export const tail = <A>(arr: A[]): A[] => arr.slice(1);
export const take = (n: number) => <A>(arr: A[]): A[] => arr.slice(0, n);
export const drop = (n: number) => <A>(arr: A[]): A[] => arr.slice(n);

export const prop = <K extends string>(key: K) => <T extends Record<K, any>>(obj: T): T[K] => obj[key];
export const props = <K extends string>(keys: K[]) => <T extends Record<K, any>>(obj: T): T[K][] => keys.map(k => obj[k]);

if (import.meta.url.includes("sanctuary")) {
  console.log("🎯 Sanctuary for Elide - Refuge from unsafe JavaScript\n");
  const nums = [1, 2, 3];
  console.log("map(x => x * 2):", map((x: number) => x * 2)(nums));
}

export default { map, chain, filter, reduce, head, tail, take, drop, prop, props };
