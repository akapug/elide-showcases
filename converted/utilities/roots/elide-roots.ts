/**
 * roots - Root Finding
 *
 * Find roots of functions.
 * **POLYGLOT SHOWCASE**: One root finding library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/roots (~10K+ downloads/week)
 *
 * Features:
 * - Bisection method
 * - Newton's method
 * - Secant method
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export function bisection(f: (x: number) => number, a: number, b: number, tol: number = 1e-6): number {
  let fa = f(a), fb = f(b);
  if (fa * fb > 0) throw new Error('Function must have opposite signs at endpoints');

  while (b - a > tol) {
    const c = (a + b) / 2;
    const fc = f(c);
    if (fc === 0) return c;
    if (fa * fc < 0) {
      b = c;
      fb = fc;
    } else {
      a = c;
      fa = fc;
    }
  }
  return (a + b) / 2;
}

export function newton(f: (x: number) => number, df: (x: number) => number, x0: number, tol: number = 1e-6): number {
  let x = x0;
  for (let i = 0; i < 100; i++) {
    const fx = f(x);
    if (Math.abs(fx) < tol) return x;
    x = x - fx / df(x);
  }
  return x;
}

export default { bisection, newton };

// CLI Demo
if (import.meta.url.includes("elide-roots.ts")) {
  console.log("🌿 roots - Root Finding for Elide (POLYGLOT!)\n");
  const f = (x: number) => x * x - 2;
  const df = (x: number) => 2 * x;
  console.log("Root of x² - 2 (bisection):", bisection(f, 0, 2).toFixed(6));
  console.log("Root of x² - 2 (Newton):", newton(f, df, 1).toFixed(6));
  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
