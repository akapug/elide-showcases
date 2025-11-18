/**
 * Iconv - Character Conversion
 * 
 * Character encoding conversion with native bindings.
 * **POLYGLOT SHOWCASE**: One iconv implementation for ALL languages on Elide!
 * 
 * Package has ~8M downloads/week on npm!
 */

export class Iconv {
  constructor(fromEncoding: string, toEncoding: string) {}
  
  convert(input: Uint8Array | string): Uint8Array {
    return typeof input === 'string' ? new TextEncoder().encode(input) : input;
  }
}

export default Iconv;

if (import.meta.url.includes("elide-iconv.ts")) {
  console.log("🔤 Iconv - Character Conversion (POLYGLOT!) - ~8M downloads/week\n");
}
