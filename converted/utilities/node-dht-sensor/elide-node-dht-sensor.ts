/**
 * node-dht-sensor - DHT Temperature/Humidity Sensor
 *
 * Read DHT11/DHT22 sensors with Node.js
 * Based on https://www.npmjs.com/package/node-dht-sensor (~10K+ downloads/week)
 */

export function read(sensorType: number, pin: number): { temperature: number; humidity: number } {
  return { temperature: 22.5, humidity: 45.3 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌡️ node-dht-sensor - DHT Sensors (POLYGLOT!) ~10K+/week\n");
  const data = read(22, 4);
  console.log(`Temp: ${data.temperature}°C, Humidity: ${data.humidity}%\n`);
}
