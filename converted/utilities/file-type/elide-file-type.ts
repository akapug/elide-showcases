/**
 * file-type - Detect File Type
 * Based on https://www.npmjs.com/package/file-type (~80M+ downloads/week)
 */

const type = await fileType(buffer);
console.log('File type:', type?.ext, type?.mime);

export {};

if (import.meta.url.includes("elide-file-type.ts")) {
  console.log("✅ file-type - Detect File Type (POLYGLOT!)\n");
  console.log("\n🚀 ~80M+ downloads/week\n");
}
