/**
 * hex-to-binary - Hex to Binary Conversion
 *
 * Convert hexadecimal strings to binary representation.
 * **POLYGLOT SHOWCASE**: Hex conversion across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/hex-to-binary (~50K+ downloads/week)
 *
 * Package has ~50K+ downloads/week on npm!
 */

export function hexToBinary(hex: string): string {
  hex = hex.replace(/[^0-9a-f]/gi, '');
  let result = '';
  
  for (let i = 0; i < hex.length; i++) {
    const byte = parseInt(hex[i], 16);
    result += byte.toString(2).padStart(4, '0');
  }
  
  return result;
}

export function binaryToHex(binary: string): string {
  binary = binary.replace(/[^01]/g, '');
  let result = '';
  
  for (let i = 0; i < binary.length; i += 4) {
    const nibble = binary.substr(i, 4).padEnd(4, '0');
    result += parseInt(nibble, 2).toString(16);
  }
  
  return result;
}

export default hexToBinary;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔢 hex-to-binary (POLYGLOT!)\\n");
  
  console.log("=== Hex to Binary ===");
  const hex = "DEADBEEF";
  const binary = hexToBinary(hex);
  console.log("Hex:", hex);
  console.log("Binary:", binary);
  console.log();
  
  console.log("=== Binary to Hex ===");
  const bin = "11011110101011011011111011101111";
  const hexResult = binaryToHex(bin);
  console.log("Binary:", bin);
  console.log("Hex:", hexResult);
  console.log();
  
  console.log("🚀 ~50K+ downloads/week on npm!");
}
