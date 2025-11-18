/**
 * hex-to-binary - Hex to Binary Conversion
 *
 * Convert hexadecimal strings to binary strings.
 *
 * Package has ~2M+ downloads/week on npm!
 */

function hexToBinary(hex: string): string {
  return hex
    .split('')
    .map(char => parseInt(char, 16).toString(2).padStart(4, '0'))
    .join('');
}

function binaryToHex(binary: string): string {
  let hex = '';
  for (let i = 0; i < binary.length; i += 4) {
    const chunk = binary.substring(i, i + 4);
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}

export default hexToBinary;
export { hexToBinary, binaryToHex };

if (import.meta.url.includes("elide-hex-to-binary.ts")) {
  console.log("🔤 hex-to-binary - Hex/Binary Conversion\n");
  const hex = "a3f5";
  const binary = hexToBinary(hex);
  const backToHex = binaryToHex(binary);
  console.log("Hex:", hex);
  console.log("Binary:", binary);
  console.log("Back to Hex:", backToHex);
  console.log("\n🚀 ~2M+ downloads/week on npm");
}
