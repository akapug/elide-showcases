/**
 * regression - Regression Analysis
 *
 * Regression analysis library for various curve fitting methods.
 * **POLYGLOT SHOWCASE**: One regression library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/regression (~50K+ downloads/week)
 *
 * Features:
 * - Linear regression
 * - Polynomial regression
 * - Exponential regression
 * - Logarithmic regression
 * - Power regression
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

type Point = [number, number];

export function linear(data: Point[]): { equation: number[]; predict: (x: number) => number; r2: number } {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  data.forEach(([x, y]) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predict = (x: number) => slope * x + intercept;

  // Calculate R²
  const yMean = sumY / n;
  let ssTot = 0, ssRes = 0;
  data.forEach(([x, y]) => {
    ssTot += (y - yMean) ** 2;
    ssRes += (y - predict(x)) ** 2;
  });
  const r2 = 1 - (ssRes / ssTot);

  return { equation: [intercept, slope], predict, r2 };
}

export function polynomial(data: Point[], order: number = 2): { equation: number[]; predict: (x: number) => number } {
  // Simple quadratic for demo
  if (order !== 2) throw new Error('Only order 2 implemented');

  const n = data.length;
  let sumX = 0, sumY = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumXY = 0, sumX2Y = 0;

  data.forEach(([x, y]) => {
    sumX += x;
    sumY += y;
    sumX2 += x ** 2;
    sumX3 += x ** 3;
    sumX4 += x ** 4;
    sumXY += x * y;
    sumX2Y += x ** 2 * y;
  });

  // Solve 3x3 system for a, b, c in y = ax² + bx + c
  // Simplified solution
  const a = (n * sumX2Y - sumX2 * sumY) / (n * sumX4 - sumX2 * sumX2);
  const b = (sumXY - a * sumX3) / sumX2;
  const c = (sumY - b * sumX - a * sumX2) / n;

  const predict = (x: number) => a * x * x + b * x + c;

  return { equation: [c, b, a], predict };
}

export function exponential(data: Point[]): { equation: number[]; predict: (x: number) => number } {
  // y = a * e^(b*x)
  const logData: Point[] = data.map(([x, y]) => [x, Math.log(y)]);
  const linearFit = linear(logData);

  const a = Math.exp(linearFit.equation[0]);
  const b = linearFit.equation[1];

  const predict = (x: number) => a * Math.exp(b * x);

  return { equation: [a, b], predict };
}

export function logarithmic(data: Point[]): { equation: number[]; predict: (x: number) => number } {
  // y = a + b * ln(x)
  const logData: Point[] = data.map(([x, y]) => [Math.log(x), y]);
  const linearFit = linear(logData);

  const a = linearFit.equation[0];
  const b = linearFit.equation[1];

  const predict = (x: number) => a + b * Math.log(x);

  return { equation: [a, b], predict };
}

export function power(data: Point[]): { equation: number[]; predict: (x: number) => number } {
  // y = a * x^b
  const logData: Point[] = data.map(([x, y]) => [Math.log(x), Math.log(y)]);
  const linearFit = linear(logData);

  const a = Math.exp(linearFit.equation[0]);
  const b = linearFit.equation[1];

  const predict = (x: number) => a * Math.pow(x, b);

  return { equation: [a, b], predict };
}

export default { linear, polynomial, exponential, logarithmic, power };

// CLI Demo
if (import.meta.url.includes("elide-regression.ts")) {
  console.log("📈 regression - Regression Analysis for Elide (POLYGLOT!)\n");

  console.log("=== Linear Regression ===");
  const data: Point[] = [[1, 2], [2, 4], [3, 6], [4, 8], [5, 10]];
  const lin = linear(data);
  console.log("y = " + lin.equation[1].toFixed(2) + "x + " + lin.equation[0].toFixed(2));
  console.log("R² =", lin.r2.toFixed(4));
  console.log("Predict x=6:", lin.predict(6));

  console.log("\n=== Polynomial Regression ===");
  const data2: Point[] = [[1, 1], [2, 4], [3, 9], [4, 16], [5, 25]];
  const poly = polynomial(data2, 2);
  console.log("Coefficients:", poly.equation.map(x => x.toFixed(2)));
  console.log("Predict x=6:", poly.predict(6).toFixed(2));

  console.log("\n=== Exponential Regression ===");
  const data3: Point[] = [[1, 2], [2, 4], [3, 8], [4, 16]];
  const exp = exponential(data3);
  console.log("Coefficients:", exp.equation.map(x => x.toFixed(2)));

  console.log("\n🚀 ~50K+ downloads/week on npm!");
}
