/**
 * Unit Converter
 * Convert between various units of measurement
 */

// Length conversions (to meters)
const LENGTH_TO_METERS: Record<string, number> = {
  meters: 1,
  kilometers: 1000,
  centimeters: 0.01,
  millimeters: 0.001,
  miles: 1609.34,
  yards: 0.9144,
  feet: 0.3048,
  inches: 0.0254
};

// Weight conversions (to kilograms)
const WEIGHT_TO_KG: Record<string, number> = {
  kilograms: 1,
  grams: 0.001,
  milligrams: 0.000001,
  pounds: 0.453592,
  ounces: 0.0283495,
  tons: 1000
};

// Temperature conversions
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * 5/9;
}

export function celsiusToKelvin(celsius: number): number {
  return celsius + 273.15;
}

export function kelvinToCelsius(kelvin: number): number {
  return kelvin - 273.15;
}

// Length conversions
export function convertLength(value: number, from: string, to: string): number {
  const fromUnit = LENGTH_TO_METERS[from.toLowerCase()];
  const toUnit = LENGTH_TO_METERS[to.toLowerCase()];

  if (!fromUnit || !toUnit) {
    throw new Error('Invalid length unit');
  }

  const meters = value * fromUnit;
  return meters / toUnit;
}

// Weight conversions
export function convertWeight(value: number, from: string, to: string): number {
  const fromUnit = WEIGHT_TO_KG[from.toLowerCase()];
  const toUnit = WEIGHT_TO_KG[to.toLowerCase()];

  if (!fromUnit || !toUnit) {
    throw new Error('Invalid weight unit');
  }

  const kg = value * fromUnit;
  return kg / toUnit;
}

// Temperature conversions
export function convertTemperature(value: number, from: string, to: string): number {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  if (fromLower === toLower) return value;

  // Convert to Celsius first
  let celsius: number;
  if (fromLower === 'celsius') {
    celsius = value;
  } else if (fromLower === 'fahrenheit') {
    celsius = fahrenheitToCelsius(value);
  } else if (fromLower === 'kelvin') {
    celsius = kelvinToCelsius(value);
  } else {
    throw new Error('Invalid temperature unit');
  }

  // Convert from Celsius to target
  if (toLower === 'celsius') {
    return celsius;
  } else if (toLower === 'fahrenheit') {
    return celsiusToFahrenheit(celsius);
  } else if (toLower === 'kelvin') {
    return celsiusToKelvin(celsius);
  } else {
    throw new Error('Invalid temperature unit');
  }
}

// CLI demo
if (import.meta.url.includes("unit-converter.ts")) {
  console.log("Unit Converter Demo\n");

  console.log("Length conversions:");
  console.log("  10 km =", convertLength(10, 'kilometers', 'miles').toFixed(2), "miles");
  console.log("  6 feet =", convertLength(6, 'feet', 'meters').toFixed(2), "meters");
  console.log("  100 inches =", convertLength(100, 'inches', 'centimeters').toFixed(2), "cm");

  console.log("\nWeight conversions:");
  console.log("  5 kg =", convertWeight(5, 'kilograms', 'pounds').toFixed(2), "pounds");
  console.log("  16 oz =", convertWeight(16, 'ounces', 'grams').toFixed(2), "grams");
  console.log("  2000 lbs =", convertWeight(2000, 'pounds', 'kilograms').toFixed(2), "kg");

  console.log("\nTemperature conversions:");
  console.log("  0°C =", convertTemperature(0, 'Celsius', 'Fahrenheit').toFixed(2), "°F");
  console.log("  100°F =", convertTemperature(100, 'Fahrenheit', 'Celsius').toFixed(2), "°C");
  console.log("  300 K =", convertTemperature(300, 'Kelvin', 'Celsius').toFixed(2), "°C");

  console.log("✅ Unit converter test passed");
}
