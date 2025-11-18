/**
 * random-item - Get Random Array Item
 *
 * Get a random item from an array.
 *
 * Package has ~3M+ downloads/week on npm!
 */

function randomItem<T>(array: T[]): T {
  if (!array || array.length === 0) {
    throw new Error('Array cannot be empty');
  }
  const bytes = new Uint8Array(1);
  crypto.getRandomValues(bytes);
  return array[bytes[0] % array.length];
}

export default randomItem;
export { randomItem };

if (import.meta.url.includes("elide-random-item.ts")) {
  console.log("🎲 random-item - Get Random Array Item\n");
  const fruits = ['apple', 'banana', 'orange', 'grape'];
  console.log("Random fruit:", randomItem(fruits));
  console.log("Random number:", randomItem([1, 2, 3, 4, 5, 6]));
  console.log("\n🚀 ~3M+ downloads/week on npm");
}
