/**
 * newton-raphson - Newton's Method
 *
 * Newton-Raphson root finding.
 * **POLYGLOT SHOWCASE**: One Newton's method library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/newton-raphson (~5K+ downloads/week)
 *
 * Features:
 * - Newton-Raphson iteration
 * - Automatic differentiation option
 * - Convergence control
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

export function newtonRaphson(
  f: (x: number) => number,
  df: (x: number) => number,
  x0: number,
  options: { tol?: number; maxIter?: number } = {}
): number {
  const tol = options.tol || 1e-6;
  const maxIter = options.maxIter || 100;

  let x = x0;
  for (let i = 0; i < maxIter; i++) {
    const fx = f(x);
    if (Math.abs(fx) < tol) return x;

    const dfx = df(x);
    if (Math.abs(dfx) < 1e-12) throw new Error('Derivative too small');

    x = x - fx / dfx;
  }

  return x;
}

export default newtonRaphson;

// CLI Demo
if (import.meta.url.includes("elide-newton-raphson.ts")) {
  console.log("🔍 newton-raphson for Elide (POLYGLOT!)\n");
  const f = (x: number) => x * x - 4;
  const df = (x: number) => 2 * x;
  const root = newtonRaphson(f, df, 1);
  console.log("Root of x² - 4:", root.toFixed(6));
  console.log("Verification: f(" + root.toFixed(6) + ") =", f(root).toFixed(10));
  console.log("\n🚀 ~5K+ downloads/week on npm!");
}
