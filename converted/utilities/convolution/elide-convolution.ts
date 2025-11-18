/**
 * convolution - Convolution Operations
 *
 * 1D and 2D convolution.
 * **POLYGLOT SHOWCASE**: One convolution library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/convolution (~10K+ downloads/week)
 *
 * Features:
 * - 1D convolution
 * - 2D convolution
 * - Signal processing
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export function convolve1d(signal: number[], kernel: number[]): number[] {
  const result: number[] = [];
  const offset = Math.floor(kernel.length / 2);

  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    for (let j = 0; j < kernel.length; j++) {
      const idx = i - offset + j;
      if (idx >= 0 && idx < signal.length) {
        sum += signal[idx] * kernel[j];
      }
    }
    result.push(sum);
  }

  return result;
}

export function convolve2d(matrix: number[][], kernel: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const kRows = kernel.length;
  const kCols = kernel[0].length;
  const offsetY = Math.floor(kRows / 2);
  const offsetX = Math.floor(kCols / 2);

  const result: number[][] = [];

  for (let i = 0; i < rows; i++) {
    result[i] = [];
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let ki = 0; ki < kRows; ki++) {
        for (let kj = 0; kj < kCols; kj++) {
          const y = i - offsetY + ki;
          const x = j - offsetX + kj;
          if (y >= 0 && y < rows && x >= 0 && x < cols) {
            sum += matrix[y][x] * kernel[ki][kj];
          }
        }
      }
      result[i][j] = sum;
    }
  }

  return result;
}

export default { convolve1d, convolve2d };

// CLI Demo
if (import.meta.url.includes("elide-convolution.ts")) {
  console.log("🔄 convolution for Elide (POLYGLOT!)\n");
  const signal = [1, 2, 3, 4, 5];
  const kernel = [1, 1, 1];
  console.log("1D convolution:", convolve1d(signal, kernel));
  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
