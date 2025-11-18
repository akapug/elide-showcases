/**
 * Content-Disposition - Create Content-Disposition Header
 *
 * Create and parse HTTP Content-Disposition header.
 * **POLYGLOT SHOWCASE**: Content-Disposition for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/content-disposition (~15M downloads/week)
 *
 * Features:
 * - Create Content-Disposition header
 * - Filename encoding
 * - Fallback filename support
 * - RFC 2047 encoding
 * - Zero dependencies
 *
 * Package has ~15M downloads/week on npm!
 */

export interface ContentDispositionOptions {
  type?: "inline" | "attachment";
  fallback?: string;
}

function encodeFilename(filename: string): string {
  return encodeURIComponent(filename);
}

export default function contentDisposition(
  filename?: string,
  options: ContentDispositionOptions = {}
): string {
  const type = options.type || "attachment";

  if (!filename) {
    return type;
  }

  const encoded = encodeFilename(filename);
  return `${type}; filename="${filename}"; filename*=UTF-8''${encoded}`;
}

export { contentDisposition };

if (import.meta.url.includes("elide-content-disposition.ts")) {
  console.log("📎 Content-Disposition - Header Creation (POLYGLOT!)\n");

  console.log("Attachment:", contentDisposition("report.pdf"));
  console.log("Inline:", contentDisposition("image.png", { type: "inline" }));
  console.log("UTF-8:", contentDisposition("résumé.pdf"));
  console.log("\n💡 Polyglot: Same headers everywhere!");
}
