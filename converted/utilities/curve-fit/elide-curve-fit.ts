/**
 * curve-fit - Curve Fitting
 *
 * Non-linear curve fitting library.
 * **POLYGLOT SHOWCASE**: One curve fitting library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/curve-fit (~5K+ downloads/week)
 *
 * Features:
 * - Non-linear least squares
 * - Custom function fitting
 * - Parameter optimization
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

type FitFunction = (x: number, params: number[]) => number;

export function fit(
  xData: number[],
  yData: number[],
  func: FitFunction,
  initialParams: number[],
  iterations: number = 100
): number[] {
  let params = [...initialParams];
  const learningRate = 0.01;

  for (let iter = 0; iter < iterations; iter++) {
    const gradients = params.map(() => 0);

    // Calculate gradients
    for (let i = 0; i < xData.length; i++) {
      const predicted = func(xData[i], params);
      const error = predicted - yData[i];

      for (let j = 0; j < params.length; j++) {
        const delta = 0.0001;
        const paramsCopy = [...params];
        paramsCopy[j] += delta;
        const predictedDelta = func(xData[i], paramsCopy);
        const gradient = (predictedDelta - predicted) / delta;
        gradients[j] += 2 * error * gradient;
      }
    }

    // Update parameters
    for (let j = 0; j < params.length; j++) {
      params[j] -= learningRate * gradients[j] / xData.length;
    }
  }

  return params;
}

export default { fit };

// CLI Demo
if (import.meta.url.includes("elide-curve-fit.ts")) {
  console.log("📐 curve-fit for Elide (POLYGLOT!)\n");
  const xData = [1, 2, 3, 4, 5];
  const yData = [2, 4, 6, 8, 10];
  const func = (x: number, [a, b]: number[]) => a * x + b;
  const params = fit(xData, yData, func, [1, 0], 100);
  console.log("Fitted parameters:", params.map(x => x.toFixed(2)));
  console.log("\n🚀 ~5K+ downloads/week on npm!");
}
