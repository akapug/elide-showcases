/**
 * Elide Security Scanner
 * Detect security vulnerabilities in code
 */

export interface SecurityReport {
  vulnerabilities: Vulnerability[];
  summary: SecuritySummary;
}

export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  file: string;
  line: number;
  code: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration
  owasp?: string; // OWASP category
}

export interface SecuritySummary {
  totalVulnerabilities: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  riskScore: number;
}

/**
 * Security Scanner for Elide
 */
export class ElideSecurityScanner {
  private rules: SecurityRule[] = [];

  constructor() {
    this.registerSecurityRules();
  }

  /**
   * Register security rules
   */
  private registerSecurityRules(): void {
    // SQL Injection
    this.rules.push({
      id: 'sql-injection',
      severity: 'critical',
      title: 'SQL Injection Vulnerability',
      pattern: /\$\{[^}]+\}|`\$\{[^}]+\}`/,
      contextPatterns: [/\.query\(/, /\.execute\(/, /SELECT|INSERT|UPDATE|DELETE/i],
      description: 'Unsanitized user input in SQL query',
      recommendation: 'Use parameterized queries or prepared statements',
      cwe: 'CWE-89',
      owasp: 'A1:2021 - Injection'
    });

    // XSS (Cross-Site Scripting)
    this.rules.push({
      id: 'xss',
      severity: 'high',
      title: 'Cross-Site Scripting (XSS)',
      pattern: /innerHTML|dangerouslySetInnerHTML|document\.write/,
      description: 'Potential XSS vulnerability through unsafe HTML rendering',
      recommendation: 'Use textContent or sanitize HTML input',
      cwe: 'CWE-79',
      owasp: 'A3:2021 - Injection'
    });

    // Command Injection
    this.rules.push({
      id: 'command-injection',
      severity: 'critical',
      title: 'Command Injection',
      pattern: /exec\(|spawn\(|execSync\(|spawnSync\(/,
      description: 'Unsafe execution of system commands',
      recommendation: 'Validate and sanitize all inputs, use parameterized commands',
      cwe: 'CWE-78',
      owasp: 'A1:2021 - Injection'
    });

    // Path Traversal
    this.rules.push({
      id: 'path-traversal',
      severity: 'high',
      title: 'Path Traversal',
      pattern: /\.\.\//,
      contextPatterns: [/readFile|writeFile|fs\./],
      description: 'Potential path traversal vulnerability',
      recommendation: 'Validate file paths and use path.resolve()',
      cwe: 'CWE-22',
      owasp: 'A5:2021 - Security Misconfiguration'
    });

    // Hardcoded Credentials
    this.rules.push({
      id: 'hardcoded-credentials',
      severity: 'high',
      title: 'Hardcoded Credentials',
      pattern: /password\s*=\s*['"][^'"]+['"]|api[_-]?key\s*=\s*['"][^'"]+['"]/i,
      description: 'Hardcoded credentials found in source code',
      recommendation: 'Use environment variables or secure credential storage',
      cwe: 'CWE-798',
      owasp: 'A7:2021 - Identification and Authentication Failures'
    });

    // Insecure Random
    this.rules.push({
      id: 'insecure-random',
      severity: 'medium',
      title: 'Insecure Random Number Generation',
      pattern: /Math\.random\(/,
      contextPatterns: [/token|secret|password|key/i],
      description: 'Math.random() is not cryptographically secure',
      recommendation: 'Use crypto.randomBytes() for security-sensitive operations',
      cwe: 'CWE-338',
      owasp: 'A2:2021 - Cryptographic Failures'
    });

    // Eval Usage
    this.rules.push({
      id: 'eval-usage',
      severity: 'high',
      title: 'Use of eval()',
      pattern: /\beval\(/,
      description: 'eval() can execute arbitrary code',
      recommendation: 'Avoid eval(), use safer alternatives like JSON.parse()',
      cwe: 'CWE-95',
      owasp: 'A1:2021 - Injection'
    });

    // Insecure Deserialization
    this.rules.push({
      id: 'insecure-deserialization',
      severity: 'high',
      title: 'Insecure Deserialization',
      pattern: /JSON\.parse\(|deserialize\(|unserialize\(/,
      description: 'Deserializing untrusted data can lead to code execution',
      recommendation: 'Validate and sanitize data before deserialization',
      cwe: 'CWE-502',
      owasp: 'A8:2021 - Software and Data Integrity Failures'
    });

    // Weak Crypto
    this.rules.push({
      id: 'weak-crypto',
      severity: 'high',
      title: 'Weak Cryptographic Algorithm',
      pattern: /md5|sha1|des-|rc4/i,
      description: 'Use of weak or broken cryptographic algorithm',
      recommendation: 'Use modern algorithms like SHA-256, AES-256',
      cwe: 'CWE-327',
      owasp: 'A2:2021 - Cryptographic Failures'
    });

    // Missing CSRF Protection
    this.rules.push({
      id: 'csrf',
      severity: 'medium',
      title: 'Potential CSRF Vulnerability',
      pattern: /\.post\(|\.put\(|\.delete\(/,
      description: 'State-changing operation without CSRF protection',
      recommendation: 'Implement CSRF tokens for state-changing operations',
      cwe: 'CWE-352',
      owasp: 'A5:2021 - Security Misconfiguration'
    });

    // Insecure Communication
    this.rules.push({
      id: 'insecure-communication',
      severity: 'medium',
      title: 'Insecure Communication',
      pattern: /http:\/\//i,
      description: 'Use of unencrypted HTTP protocol',
      recommendation: 'Use HTTPS for all communications',
      cwe: 'CWE-319',
      owasp: 'A2:2021 - Cryptographic Failures'
    });

    // Information Disclosure
    this.rules.push({
      id: 'info-disclosure',
      severity: 'low',
      title: 'Information Disclosure',
      pattern: /console\.log\(|console\.error\(|console\.debug\(/,
      description: 'Sensitive information may be logged',
      recommendation: 'Remove console statements in production or sanitize logs',
      cwe: 'CWE-200',
      owasp: 'A1:2021 - Broken Access Control'
    });

    // Open Redirect
    this.rules.push({
      id: 'open-redirect',
      severity: 'medium',
      title: 'Open Redirect',
      pattern: /redirect\(|location\.href\s*=/,
      description: 'Potential open redirect vulnerability',
      recommendation: 'Validate redirect URLs against a whitelist',
      cwe: 'CWE-601',
      owasp: 'A1:2021 - Broken Access Control'
    });

    // XXE (XML External Entity)
    this.rules.push({
      id: 'xxe',
      severity: 'high',
      title: 'XML External Entity (XXE)',
      pattern: /parseXml|XMLParser|DOMParser/,
      description: 'XML parsing without disabling external entities',
      recommendation: 'Disable XML external entities in parser configuration',
      cwe: 'CWE-611',
      owasp: 'A5:2021 - Security Misconfiguration'
    });

    // Unsafe Regex
    this.rules.push({
      id: 'unsafe-regex',
      severity: 'medium',
      title: 'Regular Expression Denial of Service (ReDoS)',
      pattern: /new RegExp\(|\/.*(\+\*|\*\+)/,
      description: 'Potentially unsafe regex pattern',
      recommendation: 'Avoid nested quantifiers and test regex performance',
      cwe: 'CWE-1333',
      owasp: 'A6:2021 - Vulnerable and Outdated Components'
    });
  }

  /**
   * Scan files for security vulnerabilities
   */
  async scan(files: Array<{ path: string; content: string }>): Promise<SecurityReport> {
    console.log(`[Security] Scanning ${files.length} files...`);

    const vulnerabilities: Vulnerability[] = [];

    for (const file of files) {
      const fileVulns = this.scanFile(file.path, file.content);
      vulnerabilities.push(...fileVulns);
    }

    const summary = this.generateSummary(vulnerabilities);

    return {
      vulnerabilities: vulnerabilities.sort((a, b) =>
        this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity)
      ),
      summary
    };
  }

  /**
   * Scan single file
   */
  private scanFile(filePath: string, content: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const lines = content.split('\n');

    for (const rule of this.rules) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (rule.pattern.test(line)) {
          // Check context patterns if specified
          if (rule.contextPatterns) {
            let hasContext = false;
            const context = this.getContext(lines, i, 3);

            for (const contextPattern of rule.contextPatterns) {
              if (contextPattern.test(context)) {
                hasContext = true;
                break;
              }
            }

            if (!hasContext) continue;
          }

          vulnerabilities.push({
            id: rule.id,
            severity: rule.severity,
            title: rule.title,
            description: rule.description,
            file: filePath,
            line: i + 1,
            code: line.trim(),
            recommendation: rule.recommendation,
            cwe: rule.cwe,
            owasp: rule.owasp
          });
        }
      }
    }

    return vulnerabilities;
  }

  /**
   * Get context around a line
   */
  private getContext(lines: string[], lineIndex: number, contextSize: number): string {
    const start = Math.max(0, lineIndex - contextSize);
    const end = Math.min(lines.length, lineIndex + contextSize + 1);
    return lines.slice(start, end).join('\n');
  }

  /**
   * Generate summary
   */
  private generateSummary(vulnerabilities: Vulnerability[]): SecuritySummary {
    const summary: SecuritySummary = {
      totalVulnerabilities: vulnerabilities.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      riskScore: 0
    };

    for (const vuln of vulnerabilities) {
      summary[vuln.severity]++;
    }

    // Calculate risk score (0-100)
    summary.riskScore = Math.min(
      100,
      summary.critical * 20 +
      summary.high * 10 +
      summary.medium * 5 +
      summary.low * 2 +
      summary.info * 1
    );

    return summary;
  }

  /**
   * Get severity score for sorting
   */
  private getSeverityScore(severity: Vulnerability['severity']): number {
    const scores = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1
    };
    return scores[severity];
  }

  /**
   * Get vulnerability by ID
   */
  getRule(id: string): SecurityRule | undefined {
    return this.rules.find(r => r.id === id);
  }

  /**
   * Get all rules
   */
  getRules(): SecurityRule[] {
    return [...this.rules];
  }
}

interface SecurityRule {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  pattern: RegExp;
  contextPatterns?: RegExp[];
  description: string;
  recommendation: string;
  cwe?: string;
  owasp?: string;
}

export default ElideSecurityScanner;
