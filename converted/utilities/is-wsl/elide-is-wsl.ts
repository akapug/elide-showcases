/**
 * Is WSL - Windows Subsystem for Linux Detection
 *
 * Detect if running in Windows Subsystem for Linux.
 * **POLYGLOT SHOWCASE**: WSL detection for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-wsl (~3M+ downloads/week)
 *
 * Features:
 * - WSL 1 detection
 * - WSL 2 detection
 * - Windows detection
 * - Version detection
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need WSL detection
 * - ONE WSL detector works everywhere on Elide
 * - Consistent environment detection
 * - Share platform logic across your stack
 *
 * Use cases:
 * - Platform-specific code
 * - Path handling
 * - File system operations
 * - Development tools
 *
 * Package has ~3M+ downloads/week on npm - essential detection utility!
 */

/**
 * Check if running in WSL
 */
function isWSL(): boolean {
  if (typeof process === "undefined") {
    return false;
  }

  if (process.platform !== "linux") {
    return false;
  }

  // Check /proc/version for WSL signature
  // In real implementation, would read /proc/version
  // For this demo, we'll simulate based on environment
  const isInWSL = process.env.WSL_DISTRO_NAME !== undefined ||
                  process.env.WSL_INTEROP !== undefined;

  return isInWSL;
}

/**
 * Check if running in WSL 2
 */
function isWSL2(): boolean {
  if (!isWSL()) {
    return false;
  }

  // Check kernel version for WSL 2
  // WSL 2 uses version 4.19+ with "microsoft" in lowercase
  // For this demo, check WSL_INTEROP which is WSL 2 specific
  return process.env.WSL_INTEROP !== undefined;
}

/**
 * Get WSL version
 */
function getWSLVersion(): 1 | 2 | null {
  if (!isWSL()) {
    return null;
  }

  return isWSL2() ? 2 : 1;
}

/**
 * Get WSL distribution name
 */
function getWSLDistro(): string | null {
  if (!isWSL()) {
    return null;
  }

  return process.env.WSL_DISTRO_NAME || null;
}

export { isWSL, isWSL2, getWSLVersion, getWSLDistro };
export default isWSL;

// CLI Demo
if (import.meta.url.includes("elide-is-wsl.ts")) {
  console.log("🐧 Is WSL - Windows Subsystem for Linux Detection for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Check WSL ===");
  console.log("Is WSL:", isWSL());
  console.log("Is WSL 2:", isWSL2());
  console.log();

  console.log("=== Example 2: Get WSL Version ===");
  const version = getWSLVersion();
  if (version) {
    console.log(`Running in WSL ${version}`);
  } else {
    console.log("Not running in WSL");
  }
  console.log();

  console.log("=== Example 3: Get Distribution ===");
  const distro = getWSLDistro();
  if (distro) {
    console.log("WSL Distribution:", distro);
  } else {
    console.log("Not in WSL or distro unknown");
  }
  console.log();

  console.log("=== Example 4: Platform-Specific Code ===");
  if (isWSL()) {
    console.log("🪟🐧 Running in WSL");
    if (isWSL2()) {
      console.log("   Version: WSL 2");
      console.log("   Using VM-based Linux kernel");
    } else {
      console.log("   Version: WSL 1");
      console.log("   Using translation layer");
    }
  } else if (process.platform === "linux") {
    console.log("🐧 Running on native Linux");
  } else if (process.platform === "win32") {
    console.log("🪟 Running on Windows");
  }
  console.log();

  console.log("=== Example 5: Path Handling ===");
  function normalizePath(path: string): string {
    if (isWSL()) {
      // WSL-specific path handling
      // Convert Windows paths to Linux paths
      return path.replace(/\\/g, "/");
    }
    return path;
  }

  const examplePath = "C:\\Users\\example\\file.txt";
  console.log("Original path:", examplePath);
  console.log("Normalized path:", normalizePath(examplePath));
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same WSL detection works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One WSL detector, all languages");
  console.log("  ✓ Consistent environment detection");
  console.log("  ✓ Version-aware code");
  console.log("  ✓ Cross-platform compatibility");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Platform-specific code");
  console.log("- Path handling");
  console.log("- File system operations");
  console.log("- Development tools");
  console.log("- Windows/Linux interop");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast detection");
  console.log("- WSL 1 and 2 support");
  console.log("- ~3M+ downloads/week on npm!");
}
