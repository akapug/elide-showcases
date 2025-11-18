# semver-diff - Elide Polyglot Showcase

> **Version diff detection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Determine difference between two semver versions
- Identify major, minor, patch, prerelease, build changes
- Useful for changelog generation
- Update notifications
- **~15M downloads/week on npm**

## Quick Start

```typescript
import semverDiff from './elide-semver-diff.ts';

semverDiff('1.0.0', '2.0.0');     // 'major'
semverDiff('1.5.0', '1.6.0');     // 'minor'
semverDiff('1.0.1', '1.0.2');     // 'patch'
semverDiff('1.0.0', '1.0.0-beta'); // 'prerelease'
semverDiff('1.0.0', '1.0.0');     // null (no change)
```

## Return Values

- `'major'` - Major version changed (X.0.0)
- `'minor'` - Minor version changed (0.X.0)
- `'patch'` - Patch version changed (0.0.X)
- `'prerelease'` - Prerelease changed
- `'build'` - Build metadata changed
- `null` - No change

## Use Cases

### Changelog Generation
```typescript
const diff = semverDiff(oldVersion, newVersion);
if (diff === 'major') {
  console.log('⚠️ Breaking changes!');
} else if (diff === 'minor') {
  console.log('✨ New features');
} else if (diff === 'patch') {
  console.log('🐛 Bug fixes');
}
```

### Update Notifications
```typescript
const diff = semverDiff(installed, available);
const message = {
  'major': 'Major update available (breaking changes)',
  'minor': 'Minor update available (new features)',
  'patch': 'Patch update available (bug fixes)'
}[diff || 'none'];
```

### CI/CD Validation
```typescript
const diff = semverDiff(lastRelease, currentVersion);
if (diff === 'major' && !hasBreakingChangeLabel) {
  throw new Error('Major version bump requires breaking-change label');
}
```

## Links

- [Original npm package](https://www.npmjs.com/package/semver-diff)
- [Semantic Versioning](https://semver.org/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
