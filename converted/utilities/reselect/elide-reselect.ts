/**
 * Reselect - Selector Memoization for Redux
 * Based on https://www.npmjs.com/package/reselect (~2M+ downloads/week)
 * Features: Composable selectors, automatic memoization
 */

export function createSelector<S, R1, R>(
  selector1: (state: S) => R1,
  combiner: (res1: R1) => R
): (state: S) => R;
export function createSelector<S, R1, R2, R>(
  selector1: (state: S) => R1,
  selector2: (state: S) => R2,
  combiner: (res1: R1, res2: R2) => R
): (state: S) => R;
export function createSelector(...args: any[]): any {
  const selectors = args.slice(0, -1);
  const combiner = args[args.length - 1];
  
  let lastArgs: any[] | null = null;
  let lastResult: any;

  return (state: any) => {
    const currentArgs = selectors.map(s => s(state));
    
    if (lastArgs && currentArgs.every((arg, i) => arg === lastArgs![i])) {
      return lastResult;
    }

    lastArgs = currentArgs;
    lastResult = combiner(...currentArgs);
    return lastResult;
  };
}

export default createSelector;

if (import.meta.url.includes("elide-reselect.ts")) {
  console.log("🎯 Reselect - Redux Selectors (~2M+/week)\n");
  
  const getItems = (state: any) => state.items;
  const getTotalPrice = createSelector(
    getItems,
    (items: any[]) => items.reduce((sum, item) => sum + item.price, 0)
  );
  
  const state = { items: [{ price: 10 }, { price: 20 }] };
  console.log("Total price:", getTotalPrice(state));
  console.log("Cached:", getTotalPrice(state));
}
