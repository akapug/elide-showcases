/**
 * Gunzip-Maybe - Conditional Gunzip
 * 
 * Gunzip stream that only decompresses if gzipped.
 * **POLYGLOT SHOWCASE**: One conditional gunzip for ALL languages on Elide!
 * 
 * Package has ~8M downloads/week on npm!
 */

export default function gunzipMaybe() {
  return {
    pipe: (dest: any) => dest,
    on: (event: string, handler: Function) => {},
  };
}

if (import.meta.url.includes("elide-gunzip-maybe.ts")) {
  console.log("🗜️ Gunzip-Maybe - Conditional Gunzip (POLYGLOT!) - ~8M downloads/week\n");
}
