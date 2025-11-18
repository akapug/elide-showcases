/**
 * x-xss-protection - X-XSS-Protection Header
 * Based on https://www.npmjs.com/package/x-xss-protection (~1M downloads/week)
 *
 * Features:
 * - Enable browser XSS filter
 * - Block mode for detected attacks
 * - Report URI support
 * - Legacy browser protection
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

interface XXSSProtectionOptions {
  mode?: 'block' | null;
  reportUri?: string;
  setOnOldIE?: boolean;
}

function xXssProtection(options: XXSSProtectionOptions = {}) {
  const { mode = 'block', reportUri, setOnOldIE = true } = options;

  let headerValue: string;

  if (mode === 'block') {
    headerValue = '1; mode=block';
  } else if (reportUri) {
    headerValue = `1; report=${reportUri}`;
  } else {
    headerValue = '1';
  }

  return function xXssProtectionMiddleware(req: any, res: any, next: any) {
    // Check if old IE (for setOnOldIE option)
    const userAgent = req.headers?.['user-agent'] || '';
    const isOldIE = /MSIE [0-9]/i.test(userAgent);

    if (!isOldIE || setOnOldIE) {
      res.setHeader('X-XSS-Protection', headerValue);
    }

    next();
  };
}

function getXSSProtection(options: XXSSProtectionOptions = {}): string {
  const { mode = 'block', reportUri } = options;

  if (mode === 'block') {
    return '1; mode=block';
  } else if (reportUri) {
    return `1; report=${reportUri}`;
  }
  return '1';
}

export { xXssProtection, getXSSProtection, XXSSProtectionOptions };
export default xXssProtection;

if (import.meta.url.includes("elide-x-xss-protection.ts")) {
  console.log("✅ x-xss-protection - Browser XSS Filter (POLYGLOT!)\n");

  console.log('=== X-XSS-Protection Headers ===');

  console.log('Enabled (default):');
  console.log(getXSSProtection());

  console.log('\nBlock mode (recommended):');
  console.log(getXSSProtection({ mode: 'block' }));

  console.log('\nWith report URI:');
  console.log(getXSSProtection({ reportUri: '/xss-report' }));

  console.log('\nDisabled (mode: null):');
  console.log(getXSSProtection({ mode: null }));

  console.log('\n=== Middleware Example ===');
  const mockReq = {
    headers: { 'user-agent': 'Mozilla/5.0' }
  };
  const mockRes = {
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      console.log(`\nHeader set: ${name}`);
      console.log(`Value: ${value}`);
    }
  };

  const middleware = xXssProtection({ mode: 'block' });
  middleware(mockReq, mockRes, () => {});

  console.log('\n=== What Does This Do? ===');
  console.log('The X-XSS-Protection header tells browsers to:');
  console.log('1. Enable their built-in XSS filter');
  console.log('2. Block the page if XSS is detected (mode=block)');
  console.log('3. Report violations (optional)');

  console.log('\n=== Header Values ===');
  console.log('0: Disable XSS filter');
  console.log('1: Enable XSS filter (sanitize)');
  console.log('1; mode=block: Enable and block page');
  console.log('1; report=<uri>: Enable and report violations');

  console.log('\n=== Modern Note ===');
  console.log('⚠️  X-XSS-Protection is deprecated in modern browsers');
  console.log('✓  Use Content-Security-Policy instead');
  console.log('✓  Keep for legacy browser support');

  console.log("\n🔒 ~1M downloads/week | Legacy XSS protection");
  console.log("🚀 Browser filter | Block mode | Report support\n");
}
