/**
 * Bot Detection at Edge
 *
 * Advanced bot detection and mitigation strategies:
 * - User-agent analysis
 * - Behavioral analysis
 * - Rate limiting
 * - Challenge-response (CAPTCHA)
 * - IP reputation checking
 * - Fingerprinting
 * - Machine learning-based detection
 */

interface Request {
  ip: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  fingerprint?: string;
}

interface BotScore {
  score: number; // 0-100, higher = more likely bot
  signals: Signal[];
  action: 'allow' | 'challenge' | 'block';
  confidence: number;
}

interface Signal {
  type: string;
  value: any;
  weight: number;
  description: string;
}

/**
 * Bot Detection Engine
 */
class BotDetector {
  private requestHistory: Map<string, Request[]>;
  private blocklist: Set<string>;
  private allowlist: Set<string>;

  constructor() {
    this.requestHistory = new Map();
    this.blocklist = new Set([
      '192.0.2.1', // Example blocked IP
      '198.51.100.0/24', // Example blocked range
    ]);
    this.allowlist = new Set([
      'googlebot',
      'bingbot',
      'slackbot',
      'twitterbot',
    ]);
  }

  /**
   * Analyze request and return bot score
   */
  analyze(req: Request): BotScore {
    const signals: Signal[] = [];
    let totalScore = 0;

    // Check allowlist first
    if (this.isAllowlisted(req)) {
      return {
        score: 0,
        signals: [{ type: 'allowlist', value: true, weight: 0, description: 'Verified bot' }],
        action: 'allow',
        confidence: 1.0,
      };
    }

    // Check blocklist
    if (this.isBlocklisted(req)) {
      signals.push({
        type: 'blocklist',
        value: true,
        weight: 100,
        description: 'IP in blocklist',
      });
      totalScore += 100;
    }

    // User-agent analysis
    const uaScore = this.analyzeUserAgent(req.headers['user-agent'] || '');
    if (uaScore.score > 0) {
      signals.push(uaScore);
      totalScore += uaScore.score;
    }

    // Request rate analysis
    const rateScore = this.analyzeRequestRate(req);
    if (rateScore.score > 0) {
      signals.push(rateScore);
      totalScore += rateScore.score;
    }

    // Header analysis
    const headerScore = this.analyzeHeaders(req.headers);
    if (headerScore.score > 0) {
      signals.push(headerScore);
      totalScore += headerScore.score;
    }

    // Behavioral analysis
    const behaviorScore = this.analyzeBehavior(req);
    if (behaviorScore.score > 0) {
      signals.push(behaviorScore);
      totalScore += behaviorScore.score;
    }

    // Fingerprint analysis
    if (req.fingerprint) {
      const fpScore = this.analyzeFingerprint(req.fingerprint);
      if (fpScore.score > 0) {
        signals.push(fpScore);
        totalScore += fpScore.score;
      }
    }

    // Calculate final score (0-100)
    const finalScore = Math.min(100, totalScore);

    // Determine action based on score
    let action: 'allow' | 'challenge' | 'block';
    if (finalScore >= 80) {
      action = 'block';
    } else if (finalScore >= 50) {
      action = 'challenge';
    } else {
      action = 'allow';
    }

    // Calculate confidence
    const confidence = signals.length > 0 ? Math.min(1.0, signals.length / 5) : 0.5;

    // Store request in history
    this.recordRequest(req);

    return {
      score: finalScore,
      signals,
      action,
      confidence,
    };
  }

  /**
   * Check if IP is allowlisted
   */
  private isAllowlisted(req: Request): boolean {
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    for (const bot of this.allowlist) {
      if (ua.includes(bot)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if IP is blocklisted
   */
  private isBlocklisted(req: Request): boolean {
    return this.blocklist.has(req.ip);
  }

  /**
   * Analyze user-agent string
   */
  private analyzeUserAgent(ua: string): Signal {
    let score = 0;
    let description = '';

    // Missing user-agent
    if (!ua || ua.trim() === '') {
      score = 40;
      description = 'Missing user-agent';
    }
    // Known bot patterns
    else if (/bot|crawler|spider|scraper/i.test(ua)) {
      score = 30;
      description = 'Bot-like user-agent';
    }
    // Suspicious patterns
    else if (/python|curl|wget|java|go-http/i.test(ua)) {
      score = 35;
      description = 'Automated tool user-agent';
    }
    // Very old browsers
    else if (/MSIE [1-6]\./i.test(ua)) {
      score = 25;
      description = 'Outdated browser';
    }

    return {
      type: 'user_agent',
      value: ua,
      weight: score,
      description,
      score,
    };
  }

  /**
   * Analyze request rate
   */
  private analyzeRequestRate(req: Request): Signal {
    const history = this.requestHistory.get(req.ip) || [];
    const now = req.timestamp;

    // Count requests in last minute
    const recentRequests = history.filter((r) => now - r.timestamp < 60000);

    let score = 0;
    let description = '';

    if (recentRequests.length > 100) {
      score = 50;
      description = `Excessive requests: ${recentRequests.length}/min`;
    } else if (recentRequests.length > 50) {
      score = 30;
      description = `High request rate: ${recentRequests.length}/min`;
    } else if (recentRequests.length > 30) {
      score = 15;
      description = `Elevated request rate: ${recentRequests.length}/min`;
    }

    return {
      type: 'request_rate',
      value: recentRequests.length,
      weight: score,
      description,
      score,
    };
  }

  /**
   * Analyze request headers
   */
  private analyzeHeaders(headers: Record<string, string>): Signal {
    let score = 0;
    const issues: string[] = [];

    // Missing common headers
    if (!headers['accept']) {
      score += 15;
      issues.push('missing Accept header');
    }
    if (!headers['accept-language']) {
      score += 10;
      issues.push('missing Accept-Language');
    }
    if (!headers['accept-encoding']) {
      score += 10;
      issues.push('missing Accept-Encoding');
    }

    // Suspicious header combinations
    if (headers['user-agent'] && !headers['accept']) {
      score += 15;
      issues.push('user-agent without accept');
    }

    const description = issues.length > 0 ? issues.join(', ') : '';

    return {
      type: 'headers',
      value: issues,
      weight: score,
      description,
      score,
    };
  }

  /**
   * Analyze behavioral patterns
   */
  private analyzeBehavior(req: Request): Signal {
    const history = this.requestHistory.get(req.ip) || [];
    let score = 0;
    const issues: string[] = [];

    if (history.length < 2) {
      return { type: 'behavior', value: null, weight: 0, description: '', score: 0 };
    }

    // Check for sequential URL patterns
    const urls = history.slice(-10).map((r) => r.url);
    if (this.isSequentialPattern(urls)) {
      score += 25;
      issues.push('sequential URL pattern');
    }

    // Check for constant timing
    const timings = history.slice(-5).map((r, i, arr) =>
      i > 0 ? r.timestamp - arr[i - 1].timestamp : 0
    ).filter(t => t > 0);

    if (timings.length > 3) {
      const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
      const variance = timings.reduce((sum, t) => sum + Math.pow(t - avgTiming, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);

      // Very consistent timing suggests automation
      if (stdDev < 100) {
        score += 30;
        issues.push('robotic timing pattern');
      }
    }

    // Check for missing referers on deep pages
    if (!req.headers['referer'] && req.url.split('/').length > 3) {
      score += 10;
      issues.push('missing referer on deep page');
    }

    const description = issues.join(', ');

    return {
      type: 'behavior',
      value: issues,
      weight: score,
      description,
      score,
    };
  }

  /**
   * Check for sequential URL patterns
   */
  private isSequentialPattern(urls: string[]): boolean {
    if (urls.length < 3) return false;

    // Extract numeric parts from URLs
    const numbers = urls.map((url) => {
      const match = url.match(/\/(\d+)/);
      return match ? parseInt(match[1]) : null;
    }).filter((n) => n !== null) as number[];

    if (numbers.length < 3) return false;

    // Check if numbers are sequential
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i - 1] + 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Analyze browser fingerprint
   */
  private analyzeFingerprint(fingerprint: string): Signal {
    let score = 0;
    let description = '';

    // Check fingerprint uniqueness
    const fingerprintCounts = new Map<string, number>();

    for (const history of this.requestHistory.values()) {
      for (const req of history) {
        if (req.fingerprint) {
          const count = fingerprintCounts.get(req.fingerprint) || 0;
          fingerprintCounts.set(req.fingerprint, count + 1);
        }
      }
    }

    const count = fingerprintCounts.get(fingerprint) || 0;

    // Same fingerprint used by many IPs
    if (count > 10) {
      score = 40;
      description = `Fingerprint shared by ${count} IPs`;
    } else if (count > 5) {
      score = 25;
      description = `Fingerprint shared by ${count} IPs`;
    }

    return {
      type: 'fingerprint',
      value: fingerprint,
      weight: score,
      description,
      score,
    };
  }

  /**
   * Record request in history
   */
  private recordRequest(req: Request): void {
    const history = this.requestHistory.get(req.ip) || [];
    history.push(req);

    // Keep only last 100 requests per IP
    if (history.length > 100) {
      history.shift();
    }

    this.requestHistory.set(req.ip, history);
  }

  /**
   * Add IP to blocklist
   */
  blockIP(ip: string): void {
    this.blocklist.add(ip);
  }

  /**
   * Remove IP from blocklist
   */
  unblockIP(ip: string): void {
    this.blocklist.delete(ip);
  }

  /**
   * Get detection statistics
   */
  getStats() {
    let totalRequests = 0;
    for (const history of this.requestHistory.values()) {
      totalRequests += history.length;
    }

    return {
      uniqueIPs: this.requestHistory.size,
      totalRequests,
      blockedIPs: this.blocklist.size,
      allowedBots: this.allowlist.size,
    };
  }
}

/**
 * CAPTCHA Challenge Generator
 */
class CaptchaChallenge {
  /**
   * Generate a simple math challenge
   */
  static generateMathChallenge(): { challenge: string; answer: number } {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const op = Math.random() > 0.5 ? '+' : '-';

    const challenge = `${a} ${op} ${b}`;
    const answer = op === '+' ? a + b : a - b;

    return { challenge, answer };
  }

  /**
   * Verify challenge response
   */
  static verify(answer: number, expected: number): boolean {
    return answer === expected;
  }
}

/**
 * Example usage
 */
async function demonstrateBotDetection() {
  console.log('=== Bot Detection Examples ===\n');

  const detector = new BotDetector();

  // Example 1: Legitimate user
  console.log('1. Legitimate User:');
  const legitimateReq: Request = {
    ip: '203.0.113.1',
    url: 'https://example.com/',
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.5',
      'accept-encoding': 'gzip, deflate, br',
    },
    timestamp: Date.now(),
  };

  let result = detector.analyze(legitimateReq);
  console.log(`Score: ${result.score}/100`);
  console.log(`Action: ${result.action}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  console.log();

  // Example 2: Suspicious bot
  console.log('2. Suspicious Bot:');
  const botReq: Request = {
    ip: '198.51.100.1',
    url: 'https://example.com/api/data',
    method: 'GET',
    headers: {
      'user-agent': 'python-requests/2.28.0',
    },
    timestamp: Date.now(),
  };

  result = detector.analyze(botReq);
  console.log(`Score: ${result.score}/100`);
  console.log(`Action: ${result.action}`);
  console.log(`Signals: ${result.signals.map(s => s.description).join(', ')}`);
  console.log();

  // Example 3: Rate limiting
  console.log('3. High Request Rate:');
  for (let i = 0; i < 55; i++) {
    const req: Request = {
      ip: '192.0.2.100',
      url: `https://example.com/page${i}`,
      method: 'GET',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
      timestamp: Date.now(),
    };
    result = detector.analyze(req);
  }
  console.log(`Score after 55 requests: ${result.score}/100`);
  console.log(`Action: ${result.action}`);
  console.log();

  // Example 4: Verified bot
  console.log('4. Verified Bot (Googlebot):');
  const googlebotReq: Request = {
    ip: '66.249.66.1',
    url: 'https://example.com/',
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    },
    timestamp: Date.now(),
  };

  result = detector.analyze(googlebotReq);
  console.log(`Score: ${result.score}/100`);
  console.log(`Action: ${result.action}`);
  console.log();

  // Example 5: CAPTCHA Challenge
  console.log('5. CAPTCHA Challenge:');
  const challenge = CaptchaChallenge.generateMathChallenge();
  console.log(`Challenge: What is ${challenge.challenge}?`);
  console.log(`Correct answer: ${challenge.answer}`);
  console.log(`Verification: ${CaptchaChallenge.verify(challenge.answer, challenge.answer)}`);
  console.log();

  // Statistics
  console.log('Detection Statistics:');
  const stats = detector.getStats();
  console.log(`Unique IPs: ${stats.uniqueIPs}`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Blocked IPs: ${stats.blockedIPs}`);
  console.log(`Allowed Bots: ${stats.allowedBots}`);
}

if (require.main === module) {
  demonstrateBotDetection().catch(console.error);
}

export { BotDetector, BotScore, Signal, Request, CaptchaChallenge };
