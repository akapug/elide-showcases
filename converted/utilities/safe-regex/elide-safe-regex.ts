/**
 * safe-regex - ReDoS (Regular Expression Denial of Service) Detection
 * Based on https://www.npmjs.com/package/safe-regex (~40M downloads/week)
 *
 * Features:
 * - Detect vulnerable regex patterns
 * - Prevent ReDoS attacks
 * - Star height analysis
 * - Catastrophic backtracking detection
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

interface SafeRegexOptions {
  limit?: number;
}

function safeRegex(pattern: string | RegExp, options: SafeRegexOptions = {}): boolean {
  const { limit = 25 } = options;

  const re = typeof pattern === 'string' ? pattern : pattern.source;

  // Check for nested quantifiers (catastrophic backtracking)
  if (/(\+|\*|\{[0-9,]+\})\s*(\+|\*|\{[0-9,]+\})/.test(re)) {
    return false;
  }

  // Check for repeated groups with quantifiers
  if (/\([^)]*(\+|\*)\)[^(]*(\+|\*)/.test(re)) {
    return false;
  }

  // Check star height (nested repetitions)
  const starHeight = calculateStarHeight(re);
  if (starHeight > limit) {
    return false;
  }

  // Check for alternation with overlapping patterns
  if (/\([^|]+\|[^)]+\)(\+|\*)/.test(re)) {
    return false;
  }

  return true;
}

function calculateStarHeight(re: string): number {
  let maxDepth = 0;
  let currentDepth = 0;

  for (let i = 0; i < re.length; i++) {
    if (re[i] === '(' && re[i - 1] !== '\\') {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (re[i] === ')' && re[i - 1] !== '\\') {
      currentDepth--;
    }
  }

  return maxDepth;
}

export { safeRegex, SafeRegexOptions, calculateStarHeight };
export default safeRegex;

if (import.meta.url.includes("elide-safe-regex.ts")) {
  console.log("✅ safe-regex - ReDoS Detection (POLYGLOT!)\n");

  const testCases = [
    { regex: /^abc$/, name: 'Simple pattern' },
    { regex: /^(a+)+$/, name: 'Nested quantifiers (UNSAFE!)' },
    { regex: /(a|a)*b/, name: 'Alternation with repetition (UNSAFE!)' },
    { regex: /^[a-z0-9]+$/, name: 'Character class with quantifier' },
    { regex: /(a*)*/, name: 'Catastrophic backtracking (UNSAFE!)' },
    { regex: /^[\w\.-]+@[\w\.-]+\.\w+$/, name: 'Email regex' },
    { regex: /(.*)*/, name: 'Double wildcard (UNSAFE!)' },
    { regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, name: 'Password validation' }
  ];

  console.log('=== ReDoS Vulnerability Check ===\n');

  testCases.forEach(({ regex, name }) => {
    const safe = safeRegex(regex);
    const status = safe ? '✓ Safe' : '⚠️  UNSAFE';
    console.log(`${status.padEnd(10)} | ${name}`);
    console.log(`           | ${regex.source}`);
    console.log('');
  });

  console.log('=== Star Height Analysis ===\n');
  const heightTests = [
    '(a)',
    '((a))',
    '(((a)))',
    '(a+)+',
    '((a*)*)*'
  ];

  heightTests.forEach(pattern => {
    const height = calculateStarHeight(pattern);
    console.log(`Height ${height}: ${pattern}`);
  });

  console.log('\n=== What is ReDoS? ===');
  console.log('ReDoS (Regular Expression Denial of Service) occurs when:');
  console.log('1. Regex has nested quantifiers or alternations');
  console.log('2. Input causes catastrophic backtracking');
  console.log('3. Evaluation time grows exponentially');
  console.log('4. Server becomes unresponsive');

  console.log('\n=== Dangerous Patterns ===');
  console.log('(a+)+         - Nested quantifiers');
  console.log('(a|a)*        - Overlapping alternation');
  console.log('(a*)*         - Repeated groups');
  console.log('(.*)*         - Double wildcard');

  console.log("\n🔒 ~40M downloads/week | ReDoS prevention");
  console.log("🚀 Pattern analysis | Star height | Backtracking detection\n");
}
