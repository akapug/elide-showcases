/**
 * URL Regex - Regular expression for matching URLs
 *
 * Regular expression for matching URLs in text
 * Package has ~8M downloads/week on npm!
 */

export interface UrlRegexOptions {
  exact?: boolean;
  strict?: boolean;
}

export function urlRegex(options: UrlRegexOptions = {}): RegExp {
  const { exact = false, strict = true } = options;

  const protocol = strict ? 'https?://' : '(?:https?://)?';
  const domain = '(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}';
  const path = '(?:/[^\\s]*)?';

  const pattern = `${protocol}${domain}${path}`;

  return exact ? new RegExp(`^${pattern}$`) : new RegExp(pattern, 'g');
}

export default urlRegex;

if (import.meta.url.includes("elide-url-regex.ts")) {
  console.log("🌐 URL Regex (POLYGLOT!)\n");
  console.log("Example:");
  const regex = urlRegex();
  const text = "Visit https://example.com and http://test.org for more info";
  const urls = text.match(regex);
  console.log("Text:", text);
  console.log("URLs found:", urls);
  console.log("\n📦 ~8M downloads/week on npm");
}
