# safe-regex - Elide Polyglot Showcase

> **ReDoS detection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Detect vulnerable regex patterns
- Prevent ReDoS (Regular Expression Denial of Service) attacks
- Star height analysis
- Catastrophic backtracking detection
- **~40M downloads/week on npm**

## Quick Start

```typescript
import safeRegex from './elide-safe-regex.ts';

// Check regex safety
safeRegex(/^abc$/);                 // true (safe)
safeRegex(/^(a+)+$/);               // false (UNSAFE! nested quantifiers)
safeRegex(/(a|a)*b/);               // false (UNSAFE! overlapping alternation)
safeRegex(/^[a-z0-9]+$/);           // true (safe)

// With options
safeRegex(/((((a))))/, { limit: 3 }); // false (exceeds star height limit)
```

## What is ReDoS?

ReDoS (Regular Expression Denial of Service) occurs when:
1. Regex has nested quantifiers or alternations
2. Input causes catastrophic backtracking
3. Evaluation time grows exponentially
4. Server becomes unresponsive

Example:
```typescript
// UNSAFE: Can take minutes on "aaaaaaaaaaaaaaaaaaaX"
const bad = /^(a+)+$/;

// SAFE: Equivalent but no backtracking
const good = /^a+$/;
```

## Dangerous Patterns

- `(a+)+` - Nested quantifiers
- `(a|a)*` - Overlapping alternation
- `(a*)*` - Repeated groups
- `(.*)* - Double wildcard
- `(a|ab)*` - Prefix overlap in alternation

## Use Cases

- Validate user-provided regexes
- Audit codebase for vulnerable patterns
- Prevent DoS in search/filter features
- Security review automation

## Links

- [Original npm package](https://www.npmjs.com/package/safe-regex)
- [OWASP ReDoS Guide](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)

---

**Built with ❤️ for the Elide Polyglot Runtime**
