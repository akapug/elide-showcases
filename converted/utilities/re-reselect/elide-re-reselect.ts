/**
 * Re-reselect - Enhanced Reselect with Keyed Memoization
 * Based on https://www.npmjs.com/package/re-reselect (~100K+ downloads/week)
 * Features: Multiple cache instances based on key
 */

export function createCachedSelector<S, R1, R>(
  selector1: (state: S, props?: any) => R1,
  combiner: (res1: R1) => R,
  keySelector: (state: S, props?: any) => string
): (state: S, props?: any) => R {
  const cache = new Map();

  return (state: S, props?: any) => {
    const cacheKey = keySelector(state, props);
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const input = selector1(state, props);
    const result = combiner(input);
    cache.set(cacheKey, result);
    return result;
  };
}

export default createCachedSelector;

if (import.meta.url.includes("elide-re-reselect.ts")) {
  console.log("🎯+ Re-reselect - Enhanced Reselect (~100K+/week)\n");
  
  const getUserById = createCachedSelector(
    (state: any, userId: number) => state.users[userId],
    (user) => user.name.toUpperCase(),
    (state, userId) => \`user-\${userId}\`
  );
  
  const state = { users: { 1: { name: 'alice' }, 2: { name: 'bob' } } };
  console.log("User 1:", getUserById(state, 1));
  console.log("User 2:", getUserById(state, 2));
}
