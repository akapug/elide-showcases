/**
 * Is Inside Container - Detect Container Environment
 *
 * Check if running inside Docker/container.
 * **POLYGLOT SHOWCASE**: Container detection for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-inside-container (~5M+ downloads/week)
 *
 * Features:
 * - Detect Docker containers
 * - Check for cgroups
 * - Environment detection
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

import * as fs from 'fs';

export function isInsideContainer(): boolean {
  // Check for .dockerenv file
  if (fs.existsSync('/.dockerenv')) {
    return true;
  }

  // Check cgroup for docker
  try {
    const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
    return cgroup.includes('docker') || cgroup.includes('kubepods') || cgroup.includes('containerd');
  } catch {
    // File doesn't exist or can't be read
  }

  // Check environment variables
  if (process.env.KUBERNETES_SERVICE_HOST || process.env.DOCKER_CONTAINER) {
    return true;
  }

  return false;
}

export default isInsideContainer;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🐳 Is Inside Container - Container Detection (POLYGLOT!)\n");

  console.log("Running in container:", isInsideContainer());

  if (isInsideContainer()) {
    console.log("Detected container environment!");
  } else {
    console.log("Not running in a container");
  }

  console.log("\n🚀 ~5M+ downloads/week on npm!");
}
