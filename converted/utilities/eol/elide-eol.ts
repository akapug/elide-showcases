/**
 * EOL - Line ending utilities
 *
 * Features:
 * - Detect line endings
 * - Convert line endings
 * - Platform-specific defaults
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

export const LF = '\n';
export const CRLF = '\r\n';
export const CR = '\r';

export const auto = (() => {
  if (typeof process !== 'undefined' && process.platform === 'win32') {
    return CRLF;
  }
  return LF;
})();

export function lf(str: string): string {
  return str.replace(/\r\n|\r/g, LF);
}

export function crlf(str: string): string {
  return str.replace(/\r\n|\r|\n/g, CRLF);
}

export function cr(str: string): string {
  return str.replace(/\r\n|\n/g, CR);
}

export function split(str: string): string[] {
  return str.split(/\r\n|\r|\n/);
}

export default {
  LF,
  CRLF,
  CR,
  auto,
  lf,
  crlf,
  cr,
  split,
};

if (import.meta.url.includes("eol")) {
  const mixed = "hello\r\nworld\ntest\rend";
  console.log("LF:", JSON.stringify(lf(mixed)));
  console.log("CRLF:", JSON.stringify(crlf(mixed)));
  console.log("CR:", JSON.stringify(cr(mixed)));
  console.log("Split:", split(mixed));
  console.log("Auto:", JSON.stringify(auto));
}
