/**
 * unique-random - Generate Unique Random Numbers
 *
 * Generate random numbers that are consecutively unique.
 *
 * Package has ~5M+ downloads/week on npm!
 */

function uniqueRandom(min: number, max: number): () => number {
  let previous: number | undefined;

  return function(): number {
    let num: number;
    do {
      const bytes = new Uint8Array(4);
      crypto.getRandomValues(bytes);
      const randomValue = bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3];
      num = min + (Math.abs(randomValue) % (max - min + 1));
    } while (num === previous);

    previous = num;
    return num;
  };
}

export default uniqueRandom;
export { uniqueRandom };

if (import.meta.url.includes("elide-unique-random.ts")) {
  console.log("🎲 unique-random - Unique Random Numbers\n");
  const random = uniqueRandom(1, 10);
  console.log("Five unique consecutive numbers:");
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}. ${random()}`);
  }
  console.log("\n🚀 ~5M+ downloads/week on npm");
}
