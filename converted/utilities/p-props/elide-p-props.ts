/**
 * Elide P-Props - Promise Object Properties
 *
 * Pure TypeScript implementation of p-props.
 *
 * Features:
 * - Resolve promises in object properties
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-props (~8M downloads/week)
 */

export default async function pProps<T extends Record<string, any>>(
  input: { [K in keyof T]: Promise<T[K]> | T[K] }
): Promise<T> {
  const keys = Object.keys(input) as Array<keyof T>;
  const values = await Promise.all(keys.map(key => input[key]));

  const result = {} as T;
  keys.forEach((key, index) => {
    result[key] = values[index];
  });

  return result;
}

export { pProps };
