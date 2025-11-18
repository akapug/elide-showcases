/**
 * Web Application Firewall (WAF)
 *
 * Advanced WAF implementation for edge computing:
 * - SQL injection detection
 * - XSS prevention
 * - Path traversal protection
 * - Rate limiting
 * - Geo-blocking
 * - Custom rule engine
 * - Request inspection
 */

interface Request {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  query: Record<string, string>;
  ip: string;
  geo?: {
    country: string;
    region: string;
  };
}

interface WAFRule {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  action: 'block' | 'challenge' | 'log';
  check: (req: Request) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface WAFResult {
  allowed: boolean;
  matchedRules: MatchedRule[];
  action: 'allow' | 'block' | 'challenge';
  reason?: string;
}

interface MatchedRule {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: string;
  action: string;
}

/**
 * Pattern-based attack detector
 */
class AttackPatterns {
  /**
   * SQL injection patterns
   */
  static readonly SQL_INJECTION = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(;.*--)/,
    /(\'.*OR.*\'.*=.*\')/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
  ];

  /**
   * XSS patterns
   */
  static readonly XSS = [
    /<script[^>]*>.*<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
  ];

  /**
   * Path traversal patterns
   */
  static readonly PATH_TRAVERSAL = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e\\/i,
    /\.\.%2f/i,
    /\.\.%5c/i,
  ];

  /**
   * Command injection patterns
   */
  static readonly COMMAND_INJECTION = [
    /;\s*(ls|cat|wget|curl|nc|bash|sh)/i,
    /\|\s*(ls|cat|wget|curl|nc|bash|sh)/i,
    /`.*`/,
    /\$\(.*\)/,
  ];

  /**
   * LDAP injection patterns
   */
  static readonly LDAP_INJECTION = [
    /\(\|\(/,
    /\)\(\|/,
    /\*\)\(/,
  ];
}

/**
 * WAF Rule Engine
 */
class WAFRuleEngine {
  private rules: Map<string, WAFRule>;

  constructor() {
    this.rules = new Map();
    this.loadDefaultRules();
  }

  /**
   * Load default security rules
   */
  private loadDefaultRules(): void {
    // SQL Injection rules
    this.addRule({
      id: 'sqli-001',
      name: 'SQL Injection Detection',
      category: 'injection',
      enabled: true,
      action: 'block',
      severity: 'critical',
      check: (req) => this.checkSQLInjection(req),
    });

    // XSS rules
    this.addRule({
      id: 'xss-001',
      name: 'Cross-Site Scripting Detection',
      category: 'xss',
      enabled: true,
      action: 'block',
      severity: 'high',
      check: (req) => this.checkXSS(req),
    });

    // Path Traversal rules
    this.addRule({
      id: 'path-001',
      name: 'Path Traversal Detection',
      category: 'path-traversal',
      enabled: true,
      action: 'block',
      severity: 'high',
      check: (req) => this.checkPathTraversal(req),
    });

    // Command Injection rules
    this.addRule({
      id: 'cmdi-001',
      name: 'Command Injection Detection',
      category: 'injection',
      enabled: true,
      action: 'block',
      severity: 'critical',
      check: (req) => this.checkCommandInjection(req),
    });

    // File Upload rules
    this.addRule({
      id: 'upload-001',
      name: 'Malicious File Upload',
      category: 'upload',
      enabled: true,
      action: 'block',
      severity: 'high',
      check: (req) => this.checkMaliciousUpload(req),
    });

    // Header Injection rules
    this.addRule({
      id: 'header-001',
      name: 'Header Injection',
      category: 'injection',
      enabled: true,
      action: 'block',
      severity: 'medium',
      check: (req) => this.checkHeaderInjection(req),
    });

    // Sensitive Data Exposure
    this.addRule({
      id: 'data-001',
      name: 'Sensitive Data Exposure',
      category: 'data-exposure',
      enabled: true,
      action: 'log',
      severity: 'medium',
      check: (req) => this.checkSensitiveData(req),
    });

    // Rate Limiting
    this.addRule({
      id: 'rate-001',
      name: 'Rate Limiting',
      category: 'rate-limit',
      enabled: true,
      action: 'challenge',
      severity: 'low',
      check: (req) => this.checkRateLimit(req),
    });
  }

  /**
   * Add custom rule
   */
  addRule(rule: WAFRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Enable/disable rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get all rules
   */
  getRules(): WAFRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Check SQL injection
   */
  private checkSQLInjection(req: Request): boolean {
    const testStrings = [
      req.url,
      ...Object.values(req.query),
      JSON.stringify(req.body),
    ];

    for (const str of testStrings) {
      for (const pattern of AttackPatterns.SQL_INJECTION) {
        if (pattern.test(str)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check XSS
   */
  private checkXSS(req: Request): boolean {
    const testStrings = [
      req.url,
      ...Object.values(req.query),
      ...Object.values(req.headers),
      JSON.stringify(req.body),
    ];

    for (const str of testStrings) {
      for (const pattern of AttackPatterns.XSS) {
        if (pattern.test(str)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check path traversal
   */
  private checkPathTraversal(req: Request): boolean {
    const url = req.url;

    for (const pattern of AttackPatterns.PATH_TRAVERSAL) {
      if (pattern.test(url)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check command injection
   */
  private checkCommandInjection(req: Request): boolean {
    const testStrings = [
      ...Object.values(req.query),
      JSON.stringify(req.body),
    ];

    for (const str of testStrings) {
      for (const pattern of AttackPatterns.COMMAND_INJECTION) {
        if (pattern.test(str)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check malicious file upload
   */
  private checkMaliciousUpload(req: Request): boolean {
    const contentType = req.headers['content-type'] || '';

    // Check for executable file uploads
    const dangerousExtensions = /\.(exe|bat|cmd|sh|php|asp|jsp|jar)$/i;

    if (req.body && typeof req.body === 'object') {
      const filename = req.body.filename || '';
      if (dangerousExtensions.test(filename)) {
        return true;
      }
    }

    // Check for double extensions
    if (contentType.includes('application/octet-stream')) {
      const filename = req.headers['x-filename'] || '';
      if (/\.\w+\.\w+$/.test(filename)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check header injection
   */
  private checkHeaderInjection(req: Request): boolean {
    for (const [key, value] of Object.entries(req.headers)) {
      // Check for CRLF injection
      if (/[\r\n]/.test(value)) {
        return true;
      }

      // Check for suspicious headers
      if (key.toLowerCase() === 'host' && /[<>"]/.test(value)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check sensitive data exposure
   */
  private checkSensitiveData(req: Request): boolean {
    const sensitivePatterns = [
      /\b\d{16}\b/, // Credit card
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /password=[\w]+/i,
      /api[_-]?key=[\w-]+/i,
    ];

    const testStrings = [req.url, JSON.stringify(req.body)];

    for (const str of testStrings) {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(str)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check rate limit (simplified)
   */
  private checkRateLimit(req: Request): boolean {
    // This is a simplified check - in production, use proper rate limiting
    return false;
  }
}

/**
 * Web Application Firewall
 */
export class WebApplicationFirewall {
  private ruleEngine: WAFRuleEngine;
  private whitelist: Set<string>;
  private blacklist: Set<string>;
  private blockedCountries: Set<string>;
  private stats: {
    totalRequests: number;
    blocked: number;
    challenged: number;
    allowed: number;
  };

  constructor() {
    this.ruleEngine = new WAFRuleEngine();
    this.whitelist = new Set();
    this.blacklist = new Set();
    this.blockedCountries = new Set();
    this.stats = {
      totalRequests: 0,
      blocked: 0,
      challenged: 0,
      allowed: 0,
    };
  }

  /**
   * Inspect incoming request
   */
  inspect(req: Request): WAFResult {
    this.stats.totalRequests++;

    // Check whitelist
    if (this.whitelist.has(req.ip)) {
      this.stats.allowed++;
      return {
        allowed: true,
        matchedRules: [],
        action: 'allow',
      };
    }

    // Check blacklist
    if (this.blacklist.has(req.ip)) {
      this.stats.blocked++;
      return {
        allowed: false,
        matchedRules: [],
        action: 'block',
        reason: 'IP blacklisted',
      };
    }

    // Check geo-blocking
    if (req.geo && this.blockedCountries.has(req.geo.country)) {
      this.stats.blocked++;
      return {
        allowed: false,
        matchedRules: [],
        action: 'block',
        reason: 'Geographic region blocked',
      };
    }

    // Run rules
    const matchedRules: MatchedRule[] = [];
    let highestAction: 'allow' | 'block' | 'challenge' = 'allow';

    for (const rule of this.ruleEngine.getRules()) {
      if (!rule.enabled) continue;

      try {
        if (rule.check(req)) {
          matchedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            severity: rule.severity,
            action: rule.action,
          });

          // Determine highest priority action
          if (rule.action === 'block') {
            highestAction = 'block';
          } else if (rule.action === 'challenge' && highestAction !== 'block') {
            highestAction = 'challenge';
          }
        }
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error);
      }
    }

    // Update stats
    if (highestAction === 'block') {
      this.stats.blocked++;
    } else if (highestAction === 'challenge') {
      this.stats.challenged++;
    } else {
      this.stats.allowed++;
    }

    return {
      allowed: highestAction !== 'block',
      matchedRules,
      action: highestAction,
      reason: matchedRules.length > 0
        ? `Matched ${matchedRules.length} rule(s)`
        : undefined,
    };
  }

  /**
   * Add IP to whitelist
   */
  whitelistIP(ip: string): void {
    this.whitelist.add(ip);
  }

  /**
   * Add IP to blacklist
   */
  blacklistIP(ip: string): void {
    this.blacklist.add(ip);
  }

  /**
   * Block country
   */
  blockCountry(country: string): void {
    this.blockedCountries.add(country);
  }

  /**
   * Unblock country
   */
  unblockCountry(country: string): void {
    this.blockedCountries.delete(country);
  }

  /**
   * Add custom rule
   */
  addRule(rule: WAFRule): void {
    this.ruleEngine.addRule(rule);
  }

  /**
   * Get statistics
   */
  getStats() {
    const blockRate = this.stats.totalRequests > 0
      ? this.stats.blocked / this.stats.totalRequests
      : 0;

    return {
      ...this.stats,
      blockRate,
      rules: this.ruleEngine.getRules().length,
      whitelisted: this.whitelist.size,
      blacklisted: this.blacklist.size,
      blockedCountries: this.blockedCountries.size,
    };
  }

  /**
   * Get all rules
   */
  getRules(): WAFRule[] {
    return this.ruleEngine.getRules();
  }
}

/**
 * Example usage
 */
async function demonstrateWAF() {
  console.log('=== Web Application Firewall Demo ===\n');

  const waf = new WebApplicationFirewall();

  // Test cases
  const testRequests: Request[] = [
    // Normal request
    {
      url: 'https://example.com/api/users',
      method: 'GET',
      headers: { 'user-agent': 'Mozilla/5.0' },
      query: {},
      ip: '192.0.2.1',
    },
    // SQL injection attempt
    {
      url: 'https://example.com/api/users?id=1 UNION SELECT * FROM users--',
      method: 'GET',
      headers: {},
      query: { id: "1 UNION SELECT * FROM users--" },
      ip: '192.0.2.2',
    },
    // XSS attempt
    {
      url: 'https://example.com/search?q=<script>alert(1)</script>',
      method: 'GET',
      headers: {},
      query: { q: '<script>alert(1)</script>' },
      ip: '192.0.2.3',
    },
    // Path traversal
    {
      url: 'https://example.com/files?path=../../etc/passwd',
      method: 'GET',
      headers: {},
      query: { path: '../../etc/passwd' },
      ip: '192.0.2.4',
    },
  ];

  console.log('Testing requests:\n');

  for (const req of testRequests) {
    const result = waf.inspect(req);

    console.log(`Request: ${req.url}`);
    console.log(`IP: ${req.ip}`);
    console.log(`Action: ${result.action}`);

    if (result.matchedRules.length > 0) {
      console.log('Matched Rules:');
      for (const rule of result.matchedRules) {
        console.log(`  - ${rule.ruleName} (${rule.severity})`);
      }
    }

    console.log();
  }

  // Statistics
  console.log('WAF Statistics:');
  const stats = waf.getStats();
  console.log(`  Total requests: ${stats.totalRequests}`);
  console.log(`  Allowed: ${stats.allowed}`);
  console.log(`  Blocked: ${stats.blocked}`);
  console.log(`  Challenged: ${stats.challenged}`);
  console.log(`  Block rate: ${(stats.blockRate * 100).toFixed(1)}%`);
  console.log(`  Active rules: ${stats.rules}`);
}

if (require.main === module) {
  demonstrateWAF().catch(console.error);
}

export { WAFRule, WAFResult, Request, MatchedRule, AttackPatterns };
