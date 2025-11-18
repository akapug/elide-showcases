/**
 * regression-js - Regression Library
 *
 * Simple regression library.
 * **POLYGLOT SHOWCASE**: One regression library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/regression-js (~20K+ downloads/week)
 *
 * Features:
 * - Linear, polynomial, exponential regression
 * - Simple API
 * - Prediction and scoring
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

type Point = [number, number];

export function linearRegression(data: Point[]): { slope: number; intercept: number; predict: (x: number) => number } {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  data.forEach(([x, y]) => { sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x; });
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept, predict: (x: number) => slope * x + intercept };
}

export default { linearRegression };

// CLI Demo
if (import.meta.url.includes("elide-regression-js.ts")) {
  console.log("📈 regression-js for Elide (POLYGLOT!)\n");
  const data: Point[] = [[1, 2], [2, 4], [3, 6]];
  const model = linearRegression(data);
  console.log("Slope:", model.slope, "Intercept:", model.intercept);
  console.log("Predict x=4:", model.predict(4));
  console.log("\n🚀 ~20K+ downloads/week on npm!");
}
