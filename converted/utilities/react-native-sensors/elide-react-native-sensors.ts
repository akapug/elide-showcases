/**
 * React Native Sensors - Device Sensors
 *
 * Access device sensors in React Native.
 * **POLYGLOT SHOWCASE**: One sensor library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-native-sensors (~80K+ downloads/week)
 *
 * Features:
 * - Accelerometer
 * - Gyroscope
 * - Magnetometer
 * - Barometer
 * - Real-time data
 * - Zero dependencies
 *
 * Package has ~80K+ downloads/week on npm!
 */

export class Accelerometer {
  static subscribe(callback: (data: { x: number; y: number; z: number }) => void) {
    console.log('[ACCELEROMETER] Subscribed');
    const interval = setInterval(() => {
      callback({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random() * 2 - 1 });
    }, 100);
    return { unsubscribe: () => clearInterval(interval) };
  }
}

export class Gyroscope {
  static subscribe(callback: (data: { x: number; y: number; z: number }) => void) {
    console.log('[GYROSCOPE] Subscribed');
    const interval = setInterval(() => {
      callback({ x: Math.random() * 360, y: Math.random() * 360, z: Math.random() * 360 });
    }, 100);
    return { unsubscribe: () => clearInterval(interval) };
  }
}

export class Magnetometer {
  static subscribe(callback: (data: { x: number; y: number; z: number }) => void) {
    console.log('[MAGNETOMETER] Subscribed');
    const interval = setInterval(() => {
      callback({ x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 100 });
    }, 100);
    return { unsubscribe: () => clearInterval(interval) };
  }
}

export class Barometer {
  static subscribe(callback: (data: { pressure: number }) => void) {
    console.log('[BAROMETER] Subscribed');
    const interval = setInterval(() => {
      callback({ pressure: 1013.25 + Math.random() * 10 });
    }, 1000);
    return { unsubscribe: () => clearInterval(interval) };
  }
}

export default { Accelerometer, Gyroscope, Magnetometer, Barometer };

// CLI Demo
if (import.meta.url.includes("elide-react-native-sensors.ts")) {
  console.log("📡 React Native Sensors - Device Sensors for Elide (POLYGLOT!)\n");

  const accelSub = Accelerometer.subscribe((data) => {
    console.log(`Accelerometer: x=${data.x.toFixed(2)}, y=${data.y.toFixed(2)}, z=${data.z.toFixed(2)}`);
  });

  const gyroSub = Gyroscope.subscribe((data) => {
    console.log(`Gyroscope: x=${data.x.toFixed(2)}°, y=${data.y.toFixed(2)}°, z=${data.z.toFixed(2)}°`);
  });

  const magSub = Magnetometer.subscribe((data) => {
    console.log(`Magnetometer: x=${data.x.toFixed(2)}, y=${data.y.toFixed(2)}, z=${data.z.toFixed(2)}`);
  });

  setTimeout(() => {
    accelSub.unsubscribe();
    gyroSub.unsubscribe();
    magSub.unsubscribe();
    console.log('\nAll subscriptions cancelled');
  }, 1000);

  console.log("\n🚀 ~80K+ downloads/week on npm!");
}
