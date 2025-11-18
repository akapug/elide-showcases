/**
 * bowser - Browser Detection Library
 *
 * Parse User-Agent strings to detect browsers, engines, and platforms.
 * **POLYGLOT SHOWCASE**: One browser detector for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/bowser (~1M+ downloads/week)
 *
 * Features:
 * - Browser name and version detection
 * - OS platform detection
 * - Engine detection
 * - Browser satisfies version check
 * - Mobile/tablet/desktop classification
 * - Zero dependencies
 *
 * Use cases:
 * - Browser compatibility checks
 * - Feature detection
 * - Analytics tracking
 * - Conditional polyfills
 *
 * Package has ~1M+ downloads/week on npm!
 */

export interface BrowserDetails {
  browser: {
    name: string | undefined;
    version: string | undefined;
  };
  os: {
    name: string | undefined;
    version: string | undefined;
    versionName: string | undefined;
  };
  platform: {
    type: string | undefined;
    vendor: string | undefined;
    model: string | undefined;
  };
  engine: {
    name: string | undefined;
    version: string | undefined;
  };
}

export class Bowser {
  private ua: string;

  constructor(userAgent: string) {
    this.ua = userAgent;
  }

  getBrowser(): { name: string | undefined; version: string | undefined } {
    if (/Chrome\/(\d+\.\d+)/.test(this.ua) && !/Edge|Edg/.test(this.ua)) {
      return { name: 'Chrome', version: this.ua.match(/Chrome\/(\d+\.\d+)/)?.[1] };
    }
    if (/Firefox\/(\d+\.\d+)/.test(this.ua)) {
      return { name: 'Firefox', version: this.ua.match(/Firefox\/(\d+\.\d+)/)?.[1] };
    }
    if (/Safari/.test(this.ua) && !/Chrome/.test(this.ua)) {
      return { name: 'Safari', version: this.ua.match(/Version\/(\d+\.\d+)/)?.[1] };
    }
    if (/Edg\/(\d+\.\d+)/.test(this.ua)) {
      return { name: 'Edge', version: this.ua.match(/Edg\/(\d+\.\d+)/)?.[1] };
    }
    return { name: undefined, version: undefined };
  }

  getOS(): { name: string | undefined; version: string | undefined; versionName: string | undefined } {
    if (/iPhone|iPad/.test(this.ua)) {
      const match = this.ua.match(/OS (\d+)[._](\d+)/);
      const version = match ? `${match[1]}.${match[2]}` : undefined;
      return { name: 'iOS', version, versionName: version };
    }
    if (/Android (\d+\.?\d*)/.test(this.ua)) {
      const version = this.ua.match(/Android (\d+\.?\d*)/)?.[1];
      return { name: 'Android', version, versionName: version };
    }
    if (/Windows NT/.test(this.ua)) {
      const version = this.ua.match(/Windows NT (\d+\.\d+)/)?.[1];
      return { name: 'Windows', version, versionName: version === '10.0' ? '10/11' : version };
    }
    if (/Mac OS X/.test(this.ua)) {
      const match = this.ua.match(/Mac OS X (\d+)[._](\d+)/);
      const version = match ? `${match[1]}.${match[2]}` : undefined;
      return { name: 'macOS', version, versionName: version };
    }
    return { name: undefined, version: undefined, versionName: undefined };
  }

  getPlatform(): { type: string | undefined; vendor: string | undefined; model: string | undefined } {
    if (/iPhone/.test(this.ua)) {
      return { type: 'mobile', vendor: 'Apple', model: 'iPhone' };
    }
    if (/iPad/.test(this.ua)) {
      return { type: 'tablet', vendor: 'Apple', model: 'iPad' };
    }
    if (/Android/.test(this.ua) && /Mobile/.test(this.ua)) {
      return { type: 'mobile', vendor: undefined, model: undefined };
    }
    if (/Android/.test(this.ua)) {
      return { type: 'tablet', vendor: undefined, model: undefined };
    }
    return { type: 'desktop', vendor: undefined, model: undefined };
  }

  getEngine(): { name: string | undefined; version: string | undefined } {
    if (/Chrome/.test(this.ua)) {
      return { name: 'Blink', version: this.ua.match(/Chrome\/(\d+\.\d+)/)?.[1] };
    }
    if (/Safari/.test(this.ua) && !/Chrome/.test(this.ua)) {
      return { name: 'WebKit', version: this.ua.match(/AppleWebKit\/(\d+\.\d+)/)?.[1] };
    }
    if (/Firefox/.test(this.ua)) {
      return { name: 'Gecko', version: this.ua.match(/rv:(\d+\.\d+)/)?.[1] };
    }
    return { name: undefined, version: undefined };
  }

  getDetails(): BrowserDetails {
    return {
      browser: this.getBrowser(),
      os: this.getOS(),
      platform: this.getPlatform(),
      engine: this.getEngine(),
    };
  }

  satisfies(check: Record<string, string>): boolean {
    const browser = this.getBrowser();
    if (!browser.name || !browser.version) return false;

    const browserName = browser.name.toLowerCase();
    if (!(browserName in check)) return false;

    const required = check[browserName];
    const current = parseFloat(browser.version);
    const requiredVersion = parseFloat(required.replace('>=', '').replace('>', '').trim());

    if (required.startsWith('>=')) return current >= requiredVersion;
    if (required.startsWith('>')) return current > requiredVersion;
    return current === requiredVersion;
  }

  is(platformType: string): boolean {
    return this.getPlatform().type === platformType;
  }
}

export function parse(userAgent: string): Bowser {
  return new Bowser(userAgent);
}

export function getParser(userAgent: string): Bowser {
  return new Bowser(userAgent);
}

export default { parse, getParser, Bowser };

// CLI Demo
if (import.meta.url.includes("elide-bowser.ts")) {
  console.log("🎯 bowser - Browser Detection for Elide (POLYGLOT!)\n");

  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const browser = parse(ua);

  console.log("=== Example 1: Parse Browser ===");
  console.log(browser.getDetails());
  console.log();

  console.log("=== Example 2: Browser Satisfies Check ===");
  console.log(`Chrome >= 100: ${browser.satisfies({ chrome: '>=100' })}`);
  console.log(`Chrome >= 130: ${browser.satisfies({ chrome: '>=130' })}`);
  console.log();

  console.log("=== Example 3: Platform Check ===");
  console.log(`Is desktop: ${browser.is('desktop')}`);
  console.log(`Is mobile: ${browser.is('mobile')}`);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Browser compatibility checks");
  console.log("- Feature detection");
  console.log("- Analytics tracking");
  console.log("- Conditional polyfills");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- ~1M+ downloads/week on npm!");
}
