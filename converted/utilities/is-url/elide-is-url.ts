/**
 * is-url - URL Validation
 * Based on https://www.npmjs.com/package/is-url (~15M downloads/week)
 *
 * Features:
 * - URL validation
 * - Protocol checking
 * - Domain validation
 * - Support for various URL formats
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

const protocolRegex = /^[a-z][a-z0-9+.-]*:/i;
const urlRegex = /^[a-z][a-z0-9+.-]*:\/\/([a-z0-9\-._~%!$&'()*+,;=:]+@)?[a-z0-9\-._~%]+(\.[a-z0-9\-._~%]+)*(:[0-9]+)?(\/[a-z0-9\-._~%!$&'()*+,;=:@/]*)?(\?[a-z0-9\-._~%!$&'()*+,;=:@/?]*)?(#[a-z0-9\-._~%!$&'()*+,;=:@/?]*)?$/i;

function isUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  if (url.length === 0 || url.length > 2083) {
    return false;
  }

  if (!protocolRegex.test(url)) {
    return false;
  }

  return urlRegex.test(url);
}

export default isUrl;
export { isUrl };

if (import.meta.url.includes("elide-is-url.ts")) {
  console.log("✅ is-url - URL Validation (POLYGLOT!)\n");

  const testCases = [
    'https://www.example.com',
    'http://example.com/path',
    'https://example.com:8080',
    'ftp://files.example.com',
    'https://user:pass@example.com',
    'https://example.com/path?query=value',
    'https://example.com#fragment',
    'example.com',
    'www.example.com',
    '//example.com',
    'http://',
    'not a url',
    'https://sub.domain.example.com/path?query=1#hash'
  ];

  testCases.forEach(url => {
    console.log(`${url.padEnd(50)} => ${isUrl(url) ? '✓ Valid' : '✗ Invalid'}`);
  });

  console.log("\n🔒 ~15M downloads/week | Comprehensive URL validation");
  console.log("🚀 Protocol check | Domain validation | Port & path support\n");
}
