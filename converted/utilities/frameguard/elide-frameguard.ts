/**
 * frameguard - X-Frame-Options Header
 * Based on https://www.npmjs.com/package/frameguard (~1M downloads/week)
 *
 * Features:
 * - Clickjacking protection via X-Frame-Options
 * - DENY, SAMEORIGIN, ALLOW-FROM support
 * - Express middleware
 * - Simple and focused
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

type FrameguardAction = 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';

interface FrameguardOptions {
  action?: FrameguardAction | string;
  domain?: string;
}

function frameguard(options: FrameguardOptions = {}) {
  let headerValue: string;

  if (!options.action || options.action === 'SAMEORIGIN') {
    headerValue = 'SAMEORIGIN';
  } else if (options.action === 'DENY') {
    headerValue = 'DENY';
  } else if (options.action === 'ALLOW-FROM') {
    if (!options.domain) {
      throw new Error('ALLOW-FROM requires a domain');
    }
    headerValue = `ALLOW-FROM ${options.domain}`;
  } else {
    headerValue = options.action;
  }

  return function frameguardMiddleware(req: any, res: any, next: any) {
    res.setHeader('X-Frame-Options', headerValue);
    next();
  };
}

function getFrameOptions(action: FrameguardAction | string, domain?: string): string {
  if (action === 'DENY') {
    return 'DENY';
  } else if (action === 'SAMEORIGIN') {
    return 'SAMEORIGIN';
  } else if (action === 'ALLOW-FROM' && domain) {
    return `ALLOW-FROM ${domain}`;
  }
  return 'SAMEORIGIN';
}

export { frameguard, getFrameOptions, FrameguardOptions, FrameguardAction };
export default frameguard;

if (import.meta.url.includes("elide-frameguard.ts")) {
  console.log("✅ frameguard - Clickjacking Protection (POLYGLOT!)\n");

  console.log('=== Frame Options ===');
  console.log('DENY:', getFrameOptions('DENY'));
  console.log('SAMEORIGIN:', getFrameOptions('SAMEORIGIN'));
  console.log('ALLOW-FROM:', getFrameOptions('ALLOW-FROM', 'https://trusted.com'));

  console.log('\n=== Middleware Example ===');
  const mockRes = {
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      console.log(`Header set: ${name} = ${value}`);
    }
  };

  // DENY - No framing allowed
  console.log('\nDENY mode:');
  const denyMiddleware = frameguard({ action: 'DENY' });
  denyMiddleware({}, mockRes, () => {});

  // SAMEORIGIN - Same-origin framing only
  console.log('\nSAMEORIGIN mode:');
  const sameoriginMiddleware = frameguard({ action: 'SAMEORIGIN' });
  sameoriginMiddleware({}, mockRes, () => {});

  // ALLOW-FROM - Specific domain framing
  console.log('\nALLOW-FROM mode:');
  const allowMiddleware = frameguard({ action: 'ALLOW-FROM', domain: 'https://partner.com' });
  allowMiddleware({}, mockRes, () => {});

  console.log('\n=== Use Cases ===');
  console.log('DENY: Prevent all iframe embedding (banking, admin panels)');
  console.log('SAMEORIGIN: Allow same-domain iframes (internal apps)');
  console.log('ALLOW-FROM: Allow specific trusted domains (partners)');

  console.log("\n🔒 ~1M downloads/week | Clickjacking prevention");
  console.log("🚀 Simple | Focused | Essential security header\n");
}
