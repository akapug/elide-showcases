# Env CI - CI Environment Detection

**Pure TypeScript implementation of CI/CD environment detection for Elide.**

Based on [env-ci](https://www.npmjs.com/package/env-ci) (~500K+ downloads/week)

## Features

- Detect 40+ CI services
- Extract build information
- PR detection
- Branch and tag info
- Commit information
- Zero dependencies

## Installation

```bash
elide install @elide/env-ci
```

## Usage

### Detect CI

```typescript
import { detectCI, isCI } from "./elide-env-ci.ts";

if (isCI()) {
  const ci = detectCI();
  console.log("CI:", ci.name);
  console.log("Branch:", ci.branch);
  console.log("Commit:", ci.commit);
}
```

### Check PR

```typescript
import { isPR, detectCI } from "./elide-env-ci.ts";

if (isPR()) {
  const ci = detectCI();
  console.log("PR #", ci.pr);
  console.log("PR Branch:", ci.prBranch);
}
```

### CI-Specific Code

```typescript
import { detectCI, isCI, isPR } from "./elide-env-ci.ts";

if (isCI()) {
  const ci = detectCI();

  if (isPR()) {
    console.log("Running in PR - skip deployment");
  } else if (ci.branch === "main") {
    console.log("Deploy to production");
  } else {
    console.log("Deploy to staging");
  }
}
```

### Get CI Info

```typescript
import { detectCI } from "./elide-env-ci.ts";

const ci = detectCI();

console.log(ci);
// {
//   isCi: true,
//   name: "GitHub Actions",
//   service: "github",
//   commit: "abc123...",
//   branch: "main",
//   slug: "user/repo",
//   isPr: false
// }
```

## API Reference

### `detectCI()`

Detect CI environment and extract info.

**Returns:** `CIInfo`

### `isCI()`

Check if running in CI.

**Returns:** `boolean`

### `isPR()`

Check if running in PR.

**Returns:** `boolean`

### `getCIName()`

Get CI service name.

**Returns:** `string | undefined`

## Types

```typescript
interface CIInfo {
  isCi: boolean;
  name?: string;         // CI service name
  service?: string;      // Service identifier
  commit?: string;       // Commit SHA
  branch?: string;       // Branch name
  tag?: string;          // Tag name
  pr?: number | string;  // PR number
  isPr?: boolean;        // Is PR build
  prBranch?: string;     // PR source branch
  slug?: string;         // Repository slug
  root?: string;         // Project root
}
```

## Supported CI Services

- **GitHub Actions**
- **GitLab CI/CD**
- **Travis CI**
- **CircleCI**
- **Jenkins**
- **Azure Pipelines**
- **Bitbucket Pipelines**
- **Drone**
- **TeamCity**
- **Bamboo**
- ...and 30+ more!

## Polyglot Benefits

Use CI detection across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One CI detector everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript
- **Fast** - Instant detection
- **Comprehensive** - 40+ CI services
- **500K+ downloads/week** - Industry standard

## License

MIT
