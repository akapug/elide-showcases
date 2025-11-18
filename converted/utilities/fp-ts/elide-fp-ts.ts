/**
 * fp-ts - Functional Programming in TypeScript for Elide
 * NPM: 2M+ downloads/week
 */

export type Option<A> = { _tag: 'Some'; value: A } | { _tag: 'None' };

export const some = <A>(value: A): Option<A> => ({ _tag: 'Some', value });
export const none: Option<never> = { _tag: 'None' };

export const isSome = <A>(option: Option<A>): option is { _tag: 'Some'; value: A } =>
  option._tag === 'Some';

export const map = <A, B>(f: (a: A) => B) => (option: Option<A>): Option<B> =>
  isSome(option) ? some(f(option.value)) : none;

export const getOrElse = <A>(defaultValue: A) => (option: Option<A>): A =>
  isSome(option) ? option.value : defaultValue;

export type Either<E, A> = { _tag: 'Left'; left: E } | { _tag: 'Right'; right: A };

export const left = <E, A = never>(left: E): Either<E, A> => ({ _tag: 'Left', left });
export const right = <A, E = never>(right: A): Either<E, A> => ({ _tag: 'Right', right });

export const isRight = <E, A>(either: Either<E, A>): either is { _tag: 'Right'; right: A } =>
  either._tag === 'Right';

if (import.meta.url.includes("fp-ts")) {
  console.log("🎯 fp-ts for Elide - Functional Programming in TypeScript\n");
  const x = some(5);
  const y = map((n: number) => n * 2)(x);
  console.log("Option:", getOrElse(0)(y));
}

export default { some, none, map, getOrElse, left, right, isRight };
