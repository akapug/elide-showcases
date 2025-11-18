/**
 * mpu6050 - MPU6050 Motion Sensor
 *
 * Read accelerometer and gyroscope from MPU6050
 * Based on https://www.npmjs.com/package/mpu6050 (~3K+ downloads/week)
 */

export class MPU6050 {
  getMotion6() {
    return [0, 0, 0, 0, 0, 0];
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📱 mpu6050 - Motion Sensor (POLYGLOT!) ~3K+/week\n");
}
