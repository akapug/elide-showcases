/**
 * Is-CI - Check if Running in CI
 *
 * Core features:
 * - Simple CI detection
 * - Multiple CI providers
 * - Environment variable checks
 * - Boolean result
 * - Zero configuration
 * - Fast detection
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 80M+ downloads/week
 */

const CI_ENVIRONMENTS = [
  'CI',
  'CONTINUOUS_INTEGRATION',
  'BUILD_NUMBER',
  'RUN_ID',
];

const CI_PROVIDERS = [
  'TRAVIS',
  'CIRCLECI',
  'JENKINS',
  'GITLAB_CI',
  'GITHUB_ACTIONS',
  'BUILDKITE',
  'DRONE',
  'SEMAPHORE',
  'APPVEYOR',
  'WERCKER',
  'NETLIFY',
  'BITBUCKET_PIPELINES',
  'AZURE_PIPELINES',
  'TEAMCITY_VERSION',
  'CODEBUILD_BUILD_ID',
  'AWS_REGION',
];

export const isCI: boolean = checkIsCI();

function checkIsCI(): boolean {
  // Check explicit CI flag
  if (process.env.CI === 'false') {
    return false;
  }

  // Check for common CI environment variables
  for (const envVar of CI_ENVIRONMENTS) {
    if (process.env[envVar]) {
      return true;
    }
  }

  // Check for specific CI provider variables
  for (const provider of CI_PROVIDERS) {
    if (process.env[provider]) {
      return true;
    }
  }

  return false;
}

if (import.meta.url.includes("is-ci")) {
  console.log("🎯 Is-CI for Elide - Check if Running in CI\n");

  console.log("=== Current Environment ===");
  console.log("Is CI:", isCI);

  console.log("\n=== Simulate CI Environment ===");
  process.env.CI = 'true';
  console.log("Is CI (simulated):", checkIsCI());

  console.log("\n=== Simulate GitHub Actions ===");
  delete process.env.CI;
  process.env.GITHUB_ACTIONS = 'true';
  console.log("Is CI (GitHub Actions):", checkIsCI());

  console.log("\n=== Simulate Local Development ===");
  delete process.env.GITHUB_ACTIONS;
  console.log("Is CI (local):", checkIsCI());

  console.log();
  console.log("✅ Use Cases: CI detection, Build scripts, Conditional logic");
  console.log("🚀 80M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default isCI;
