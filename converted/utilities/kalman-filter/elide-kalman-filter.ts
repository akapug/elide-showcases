/**
 * kalman-filter - Kalman Filtering
 *
 * Kalman filter implementation.
 * **POLYGLOT SHOWCASE**: One Kalman filter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/kalman-filter (~10K+ downloads/week)
 *
 * Features:
 * - 1D Kalman filter
 * - State estimation
 * - Noise reduction
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export class KalmanFilter {
  private x: number; // state
  private P: number; // error covariance
  private Q: number; // process noise
  private R: number; // measurement noise

  constructor(processNoise: number = 0.01, measurementNoise: number = 1, initialState: number = 0) {
    this.x = initialState;
    this.P = 1;
    this.Q = processNoise;
    this.R = measurementNoise;
  }

  update(measurement: number): number {
    // Prediction
    const xPred = this.x;
    const PPred = this.P + this.Q;

    // Update
    const K = PPred / (PPred + this.R); // Kalman gain
    this.x = xPred + K * (measurement - xPred);
    this.P = (1 - K) * PPred;

    return this.x;
  }

  filter(measurements: number[]): number[] {
    return measurements.map(m => this.update(m));
  }
}

export default KalmanFilter;

// CLI Demo
if (import.meta.url.includes("elide-kalman-filter.ts")) {
  console.log("🎯 kalman-filter for Elide (POLYGLOT!)\n");
  const kf = new KalmanFilter(0.01, 1);
  const noisy = [1, 1.1, 0.9, 1.2, 0.8, 1.1];
  const filtered = kf.filter(noisy);
  console.log("Noisy:", noisy);
  console.log("Filtered:", filtered.map(x => x.toFixed(2)));
  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
