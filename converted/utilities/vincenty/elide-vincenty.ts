/**
 * Vincenty - Vincenty Formula for Distance
 *
 * High-precision distance calculation using Vincenty's formula.
 * **POLYGLOT SHOWCASE**: One Vincenty library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/vincenty (~10K+ downloads/week)
 *
 * Features:
 * - Vincenty's inverse formula
 * - High precision distance
 * - Ellipsoidal earth model
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const a = 6378137;
  const b = 6356752.314245;
  const f = 1 / 298.257223563;

  const L = (lon2 - lon1) * Math.PI / 180;
  const U1 = Math.atan((1 - f) * Math.tan(lat1 * Math.PI / 180));
  const U2 = Math.atan((1 - f) * Math.tan(lat2 * Math.PI / 180));
  const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

  let λ = L, λʹ, iterLimit = 100;
  let cosλ, sinλ, σ, cosσ, sinσ, cos2σM, C;

  do {
    sinλ = Math.sin(λ);
    cosλ = Math.cos(λ);
    const sinSqσ = (cosU2 * sinλ) * (cosU2 * sinλ) +
                   (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) * (cosU1 * sinU2 - sinU1 * cosU2 * cosλ);
    sinσ = Math.sqrt(sinSqσ);
    if (sinσ === 0) return 0;
    cosσ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
    σ = Math.atan2(sinσ, cosσ);
    const sinα = cosU1 * cosU2 * sinλ / sinσ;
    const cosSqα = 1 - sinα * sinα;
    cos2σM = cosσ - 2 * sinU1 * sinU2 / cosSqα;
    C = f / 16 * cosSqα * (4 + f * (4 - 3 * cosSqα));
    λʹ = λ;
    λ = L + (1 - C) * f * sinα * (σ + C * sinσ * (cos2σM + C * cosσ * (-1 + 2 * cos2σM * cos2σM)));
  } while (Math.abs(λ - λʹ) > 1e-12 && --iterLimit > 0);

  const uSq = cosSqα! * (a * a - b * b) / (b * b);
  const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const Δσ = B * sinσ! * (cos2σM! + B / 4 * (cosσ! * (-1 + 2 * cos2σM! * cos2σM!) -
              B / 6 * cos2σM! * (-3 + 4 * sinσ! * sinσ!) * (-3 + 4 * cos2σM! * cos2σM!)));

  return b * A * (σ! - Δσ);
}

export default { distance };

// CLI Demo
if (import.meta.url.includes("elide-vincenty.ts")) {
  console.log("📐 Vincenty Formula for Elide (POLYGLOT!)\n");
  const dist = distance(40.7128, -74.0060, 51.5074, -0.1278);
  console.log("Distance:", dist.toFixed(0), "m\n");
  console.log("✅ Use Cases: High-precision distance\n");
}
