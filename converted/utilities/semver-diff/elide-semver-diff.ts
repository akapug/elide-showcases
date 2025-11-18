/**
 * semver-diff - Semantic Version Diff
 * Based on https://www.npmjs.com/package/semver-diff (~15M downloads/week)
 *
 * Features:
 * - Determine difference between two semver versions
 * - Identify major, minor, patch, prerelease changes
 * - Useful for changelog generation
 * - Update notifications
 *
 * Polyglot Benefits:
 * - Pure TypeScript implementation
 * - Zero dependencies
 * - Works in TypeScript, Python, Ruby, Java via Elide
 */

type DiffType = 'major' | 'minor' | 'patch' | 'prerelease' | 'build' | null;

interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

function parse(version: string): SemVer | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-.]+))?$/);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5]
  };
}

function semverDiff(versionA: string, versionB: string): DiffType {
  const a = parse(versionA);
  const b = parse(versionB);

  if (!a || !b) {
    return null;
  }

  if (a.major !== b.major) {
    return 'major';
  }

  if (a.minor !== b.minor) {
    return 'minor';
  }

  if (a.patch !== b.patch) {
    return 'patch';
  }

  if (a.prerelease !== b.prerelease) {
    return 'prerelease';
  }

  if (a.build !== b.build) {
    return 'build';
  }

  return null;
}

export { semverDiff, DiffType };
export default semverDiff;

if (import.meta.url.includes("elide-semver-diff.ts")) {
  console.log("✅ semver-diff - Version Difference Detection (POLYGLOT!)\n");

  const testCases = [
    ['1.0.0', '2.0.0', 'Major version bump'],
    ['1.5.0', '1.6.0', 'Minor version bump'],
    ['1.0.1', '1.0.2', 'Patch version bump'],
    ['1.0.0', '1.0.0-beta', 'Prerelease change'],
    ['1.0.0', '1.0.0+build.1', 'Build metadata change'],
    ['1.0.0', '1.0.0', 'No change'],
    ['2.1.3', '3.0.0', 'Major upgrade'],
    ['1.2.3', '1.2.4', 'Patch fix']
  ];

  console.log('=== Version Diff Analysis ===\n');

  testCases.forEach(([from, to, description]) => {
    const diff = semverDiff(from, to);
    const diffStr = diff || 'none';
    console.log(`${from} → ${to}`);
    console.log(`  Type: ${diffStr}`);
    console.log(`  Description: ${description}`);
    console.log('');
  });

  console.log('=== Use Cases ===');
  console.log('✓ Changelog generation');
  console.log('✓ Update notifications');
  console.log('✓ Breaking change detection');
  console.log('✓ CI/CD version validation');
  console.log('✓ Dependency update analysis');

  console.log("\n🔒 ~15M downloads/week | Version diff utility");
  console.log("🚀 Change detection | Update analysis | Changelog helper\n");
}
