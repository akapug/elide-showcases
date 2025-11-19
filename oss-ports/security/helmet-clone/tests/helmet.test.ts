/**
 * @elide/helmet - Test Suite
 * Comprehensive tests for security headers
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import helmet, {
  contentSecurityPolicy,
  strictTransportSecurity,
  xFrameOptions,
  xssFilter,
  noSniff,
  referrerPolicy,
  permissionsPolicy,
  dnsPrefetchControl,
  hidePoweredBy,
  expectCt,
  crossOriginResourcePolicy,
  crossOriginEmbedderPolicy,
  crossOriginOpenerPolicy
} from '../src';

describe('Helmet - Main Middleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
      getHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should apply all default security headers', () => {
    const middleware = helmet();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should allow disabling specific headers', () => {
    const middleware = helmet({
      contentSecurityPolicy: false,
      xssFilter: false
    });

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow custom configuration', () => {
    const middleware = helmet({
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });

    middleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.stringContaining('max-age=31536000')
    );
  });
});

describe('Content Security Policy', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn(),
      getHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should set CSP header with default directives', () => {
    const middleware = contentSecurityPolicy();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining("default-src 'self'")
    );
    expect(next).toHaveBeenCalled();
  });

  it('should set custom directives', () => {
    const middleware = contentSecurityPolicy({
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://trusted.cdn.com'],
        'style-src': ["'self'", "'unsafe-inline'"]
      }
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining('script-src')
    );
  });

  it('should use report-only mode when specified', () => {
    const middleware = contentSecurityPolicy({
      reportOnly: true
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy-Report-Only',
      expect.any(String)
    );
  });

  it('should handle boolean directives', () => {
    const middleware = contentSecurityPolicy({
      directives: {
        'upgrade-insecure-requests': true,
        'block-all-mixed-content': true
      }
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining('upgrade-insecure-requests')
    );
  });

  it('should handle report-uri directive', () => {
    const middleware = contentSecurityPolicy({
      directives: {
        'default-src': ["'self'"],
        'report-uri': ['/csp-report']
      }
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.stringContaining('report-uri /csp-report')
    );
  });
});

describe('Strict Transport Security', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should set HSTS header with default options', () => {
    const middleware = strictTransportSecurity();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.stringContaining('max-age=15552000')
    );
  });

  it('should include subdomains when specified', () => {
    const middleware = strictTransportSecurity({
      maxAge: 31536000,
      includeSubDomains: true
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.stringContaining('includeSubDomains')
    );
  });

  it('should include preload when specified', () => {
    const middleware = strictTransportSecurity({
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.stringContaining('preload')
    );
  });

  it('should use custom max age', () => {
    const middleware = strictTransportSecurity({
      maxAge: 7776000
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.stringContaining('max-age=7776000')
    );
  });
});

describe('X-Frame-Options', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should set X-Frame-Options to SAMEORIGIN by default', () => {
    const middleware = xFrameOptions();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Frame-Options',
      'SAMEORIGIN'
    );
  });

  it('should set X-Frame-Options to DENY', () => {
    const middleware = xFrameOptions({ action: 'DENY' });
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Frame-Options',
      'DENY'
    );
  });

  it('should set X-Frame-Options to ALLOW-FROM', () => {
    const middleware = xFrameOptions({
      action: 'ALLOW-FROM',
      domain: 'https://example.com'
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Frame-Options',
      'ALLOW-FROM https://example.com'
    );
  });
});

describe('X-XSS-Protection', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should set X-XSS-Protection with block mode', () => {
    const middleware = xssFilter();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-XSS-Protection',
      '1; mode=block'
    );
  });

  it('should set report URI when provided', () => {
    const middleware = xssFilter({
      mode: 'block',
      reportUri: '/xss-report'
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-XSS-Protection',
      '1; mode=block; report=/xss-report'
    );
  });
});

describe('X-Content-Type-Options', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should set X-Content-Type-Options to nosniff', () => {
    const middleware = noSniff();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff'
    );
  });
});

describe('Referrer-Policy', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should set Referrer-Policy with default value', () => {
    const middleware = referrerPolicy();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'no-referrer'
    );
  });

  it('should set custom referrer policy', () => {
    const middleware = referrerPolicy({
      policy: 'strict-origin-when-cross-origin'
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'strict-origin-when-cross-origin'
    );
  });

  it('should set multiple policies', () => {
    const middleware = referrerPolicy({
      policy: ['no-referrer', 'strict-origin-when-cross-origin']
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'no-referrer, strict-origin-when-cross-origin'
    );
  });
});

describe('Permissions-Policy', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should set Permissions-Policy header', () => {
    const middleware = permissionsPolicy({
      directives: {
        camera: [],
        microphone: [],
        geolocation: ['self']
      }
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      expect.stringContaining('camera=()')
    );
  });

  it('should handle self origin', () => {
    const middleware = permissionsPolicy({
      directives: {
        geolocation: ['self']
      }
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      expect.stringContaining('geolocation=(self)')
    );
  });

  it('should handle specific origins', () => {
    const middleware = permissionsPolicy({
      directives: {
        payment: ['self', 'https://payment.example.com']
      }
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      expect.stringContaining('payment=(self "https://payment.example.com")')
    );
  });
});

describe('DNS Prefetch Control', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should disable DNS prefetch by default', () => {
    const middleware = dnsPrefetchControl();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-DNS-Prefetch-Control',
      'off'
    );
  });

  it('should allow enabling DNS prefetch', () => {
    const middleware = dnsPrefetchControl({ allow: true });
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-DNS-Prefetch-Control',
      'on'
    );
  });
});

describe('Hide Powered By', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn(),
      removeHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should remove X-Powered-By header by default', () => {
    const middleware = hidePoweredBy();
    middleware(req, res, next);

    expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
  });

  it('should set custom X-Powered-By value', () => {
    const middleware = hidePoweredBy({ setTo: 'Custom Server' });
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Powered-By',
      'Custom Server'
    );
  });
});

describe('Expect-CT', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should set Expect-CT header with default options', () => {
    const middleware = expectCt();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Expect-CT',
      'max-age=0'
    );
  });

  it('should set Expect-CT with enforce', () => {
    const middleware = expectCt({
      maxAge: 86400,
      enforce: true
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Expect-CT',
      expect.stringContaining('enforce')
    );
  });

  it('should set Expect-CT with report URI', () => {
    const middleware = expectCt({
      maxAge: 86400,
      reportUri: '/ct-report'
    });

    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Expect-CT',
      expect.stringContaining('report-uri="/ct-report"')
    );
  });
});

describe('Cross-Origin Policies', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = {};
    res = {
      setHeader: jest.fn()
    };
    next = jest.fn();
  });

  it('should set CORP header', () => {
    const middleware = crossOriginResourcePolicy();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Resource-Policy',
      'same-origin'
    );
  });

  it('should set COEP header', () => {
    const middleware = crossOriginEmbedderPolicy();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Embedder-Policy',
      'require-corp'
    );
  });

  it('should set COOP header', () => {
    const middleware = crossOriginOpenerPolicy();
    middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Opener-Policy',
      'same-origin'
    );
  });
});
