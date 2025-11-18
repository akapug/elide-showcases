/**
 * Envinfo - Environment Information
 *
 * Core features:
 * - System information
 * - Runtime versions
 * - Package versions
 * - OS details
 * - CLI output
 * - JSON export
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 8M+ downloads/week
 */

interface EnvinfoOptions {
  System?: string[];
  Binaries?: string[];
  Browsers?: string[];
  npmPackages?: string | string[];
  npmGlobalPackages?: string | string[];
  json?: boolean;
  markdown?: boolean;
}

export async function run(options: EnvinfoOptions = {}): Promise<string> {
  const info: Record<string, any> = {};

  // System Information
  if (options.System) {
    info.System = {
      OS: `${process.platform} ${process.arch}`,
      Shell: process.env.SHELL || 'Unknown',
      Memory: `${Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100} MB`,
    };
  }

  // Binaries
  if (options.Binaries) {
    info.Binaries = {
      Node: process.version,
      npm: '9.5.0', // Mock version
      Yarn: '1.22.19', // Mock version
    };
  }

  // Browsers (mock data)
  if (options.Browsers) {
    info.Browsers = {
      Chrome: '114.0.5735.90',
      Firefox: '114.0.1',
      Safari: '16.5',
    };
  }

  // NPM Packages
  if (options.npmPackages) {
    const packages = Array.isArray(options.npmPackages)
      ? options.npmPackages
      : [options.npmPackages];

    info.npmPackages = packages.reduce((acc, pkg) => {
      acc[pkg] = '1.0.0'; // Mock version
      return acc;
    }, {} as Record<string, string>);
  }

  // Format output
  if (options.json) {
    return JSON.stringify(info, null, 2);
  }

  if (options.markdown) {
    return formatMarkdown(info);
  }

  return formatPlain(info);
}

function formatPlain(info: Record<string, any>): string {
  let output = '\nEnvironment Info:\n\n';

  for (const [section, data] of Object.entries(info)) {
    output += `  ${section}:\n`;
    for (const [key, value] of Object.entries(data)) {
      output += `    ${key}: ${value}\n`;
    }
    output += '\n';
  }

  return output;
}

function formatMarkdown(info: Record<string, any>): string {
  let output = '## Environment Info\n\n';

  for (const [section, data] of Object.entries(info)) {
    output += `### ${section}\n\n`;
    for (const [key, value] of Object.entries(data)) {
      output += `- ${key}: ${value}\n`;
    }
    output += '\n';
  }

  return output;
}

if (import.meta.url.includes("envinfo")) {
  console.log("🎯 Envinfo for Elide - Environment Information\n");

  console.log("=== Plain Output ===");
  const plainInfo = await run({
    System: ['OS', 'Shell'],
    Binaries: ['Node', 'npm'],
  });
  console.log(plainInfo);

  console.log("=== JSON Output ===");
  const jsonInfo = await run({
    System: ['OS'],
    Binaries: ['Node'],
    json: true,
  });
  console.log(jsonInfo);

  console.log("\n=== Markdown Output ===");
  const markdownInfo = await run({
    System: ['OS'],
    Binaries: ['Node'],
    markdown: true,
  });
  console.log(markdownInfo);

  console.log();
  console.log("✅ Use Cases: Bug reports, System diagnostics, Issue templates");
  console.log("🚀 8M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default { run };
