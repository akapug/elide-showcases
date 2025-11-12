#!/usr/bin/env elide

/**
 * Elide Package Publishing CLI
 *
 * Command-line tool for publishing packages to the Elide Marketplace
 * Compatible with npm, pip, maven, and gem workflows
 */

const REGISTRY_URL = Deno.env.get("ELIDE_REGISTRY_URL") || "http://localhost:4873";
const API_URL = Deno.env.get("ELIDE_API_URL") || "http://localhost:3000";

interface Config {
  apiToken?: string;
  registry?: string;
  username?: string;
  email?: string;
}

class PublishCLI {
  private config: Config = {};
  private configPath: string;

  constructor() {
    const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "";
    this.configPath = `${home}/.elide-marketplace`;
    this.loadConfig();
  }

  /**
   * Load configuration
   */
  private loadConfig(): void {
    try {
      const data = Deno.readTextFileSync(this.configPath);
      this.config = JSON.parse(data);
    } catch {
      // Config doesn't exist yet
    }
  }

  /**
   * Save configuration
   */
  private saveConfig(): void {
    Deno.writeTextFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  /**
   * Login to the marketplace
   */
  async login(username?: string, password?: string): Promise<void> {
    if (!username) {
      username = prompt("Username:") || "";
    }

    if (!password) {
      password = prompt("Password:") || "";
    }

    console.log("Logging in...");

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Login failed:", error.error);
      Deno.exit(1);
    }

    const data = await response.json();

    this.config.apiToken = data.token;
    this.config.username = data.username;
    this.config.registry = REGISTRY_URL;

    this.saveConfig();

    console.log(`✓ Logged in as ${data.username}`);
    console.log(`✓ API token saved to ${this.configPath}`);
  }

  /**
   * Register new user
   */
  async register(username?: string, email?: string, password?: string): Promise<void> {
    if (!username) {
      username = prompt("Username:") || "";
    }

    if (!email) {
      email = prompt("Email:") || "";
    }

    if (!password) {
      password = prompt("Password:") || "";
    }

    console.log("Registering...");

    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Registration failed:", error.error);
      Deno.exit(1);
    }

    const data = await response.json();

    this.config.apiToken = data.token;
    this.config.username = data.username;
    this.config.email = data.email;
    this.config.registry = REGISTRY_URL;

    this.saveConfig();

    console.log(`✓ Registered as ${data.username}`);
    console.log(`✓ API token saved to ${this.configPath}`);
  }

  /**
   * Publish a package
   */
  async publish(packagePath: string = "."): Promise<void> {
    if (!this.config.apiToken) {
      console.error("Not logged in. Run: elide-publish login");
      Deno.exit(1);
    }

    console.log("Reading package metadata...");

    const metadata = await this.readPackageMetadata(packagePath);

    if (!metadata) {
      console.error("Could not read package metadata");
      Deno.exit(1);
    }

    console.log(`Publishing ${metadata.name}@${metadata.version}...`);

    // Create tarball
    const tarball = await this.createTarball(packagePath);

    // Upload to registry
    const response = await fetch(`${API_URL}/api/packages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: metadata.name,
        version: metadata.version,
        description: metadata.description,
        tarball,
        dependencies: metadata.dependencies,
        devDependencies: metadata.devDependencies,
        license: metadata.license
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Publish failed:", error.error);
      Deno.exit(1);
    }

    const result = await response.json();

    console.log(`✓ Published ${result.package}@${result.version}`);
    console.log(`  View: https://marketplace.elide.dev/package/${result.package}`);
  }

  /**
   * Read package metadata
   */
  private async readPackageMetadata(path: string): Promise<any> {
    // Try package.json (npm/node)
    try {
      const packageJson = JSON.parse(
        await Deno.readTextFile(`${path}/package.json`)
      );
      return packageJson;
    } catch {
      // Not a Node.js package
    }

    // Try setup.py (Python)
    try {
      const setupPy = await Deno.readTextFile(`${path}/setup.py`);
      // Parse setup.py for name, version, etc.
      // This is simplified - would need proper Python parsing
      const nameMatch = setupPy.match(/name\s*=\s*["']([^"']+)["']/);
      const versionMatch = setupPy.match(/version\s*=\s*["']([^"']+)["']/);

      if (nameMatch && versionMatch) {
        return {
          name: nameMatch[1],
          version: versionMatch[1],
          description: ""
        };
      }
    } catch {
      // Not a Python package
    }

    // Try pom.xml (Maven/Java)
    try {
      const pomXml = await Deno.readTextFile(`${path}/pom.xml`);
      // Parse pom.xml
      const groupMatch = pomXml.match(/<groupId>([^<]+)<\/groupId>/);
      const artifactMatch = pomXml.match(/<artifactId>([^<]+)<\/artifactId>/);
      const versionMatch = pomXml.match(/<version>([^<]+)<\/version>/);

      if (groupMatch && artifactMatch && versionMatch) {
        return {
          name: `${groupMatch[1]}:${artifactMatch[1]}`,
          version: versionMatch[1],
          description: ""
        };
      }
    } catch {
      // Not a Maven package
    }

    // Try .gemspec (Ruby)
    try {
      const files = Deno.readDirSync(path);
      for (const file of files) {
        if (file.name.endsWith(".gemspec")) {
          const gemspec = await Deno.readTextFile(`${path}/${file.name}`);
          const nameMatch = gemspec.match(/\.name\s*=\s*["']([^"']+)["']/);
          const versionMatch = gemspec.match(/\.version\s*=\s*["']([^"']+)["']/);

          if (nameMatch && versionMatch) {
            return {
              name: nameMatch[1],
              version: versionMatch[1],
              description: ""
            };
          }
        }
      }
    } catch {
      // Not a Ruby gem
    }

    return null;
  }

  /**
   * Create tarball of package
   */
  private async createTarball(path: string): Promise<string> {
    // In production, create actual tarball
    // For demo, return a placeholder URL
    return `https://cdn.elide.dev/packages/${Math.random().toString(36).substr(2)}.tgz`;
  }

  /**
   * Search packages
   */
  async search(query: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/packages/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      console.error("Search failed");
      Deno.exit(1);
    }

    const data = await response.json();

    if (data.results.length === 0) {
      console.log("No packages found");
      return;
    }

    console.log(`Found ${data.total} package(s):\n`);

    data.results.forEach((pkg: any) => {
      console.log(`${pkg.name} - ${pkg.description}`);
      console.log(`  Downloads: ${pkg.downloads} | Score: ${pkg.score?.toFixed(2) || "N/A"}`);
      console.log();
    });
  }

  /**
   * Get package info
   */
  async info(packageName: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/packages/${packageName}`);

    if (!response.ok) {
      console.error("Package not found");
      Deno.exit(1);
    }

    const pkg = await response.json();

    console.log(`${pkg.name}`);
    console.log(`${"-".repeat(pkg.name.length)}`);
    console.log();
    console.log(`Description: ${pkg.description}`);
    console.log(`Latest: ${pkg.versions[0]?.version || "N/A"}`);
    console.log(`License: ${pkg.license || "N/A"}`);
    console.log(`Downloads: ${pkg.downloads}`);
    console.log(`Stars: ${pkg.stars}`);
    console.log();
    console.log("Score:");
    console.log(`  Quality: ${pkg.score?.quality?.toFixed(2) || "N/A"}`);
    console.log(`  Popularity: ${pkg.score?.popularity?.toFixed(2) || "N/A"}`);
    console.log(`  Maintenance: ${pkg.score?.maintenance?.toFixed(2) || "N/A"}`);
    console.log(`  Overall: ${pkg.score?.overall?.toFixed(2) || "N/A"}`);
    console.log();
    console.log("Maintainers:", pkg.maintainers.join(", "));
    console.log();
    console.log("Versions:");
    pkg.versions.slice(0, 5).forEach((v: any) => {
      console.log(`  ${v.version} - ${new Date(v.publishedAt).toLocaleDateString()}`);
    });
  }

  /**
   * List user's packages
   */
  async list(): Promise<void> {
    if (!this.config.apiToken) {
      console.error("Not logged in. Run: elide-publish login");
      Deno.exit(1);
    }

    // This would need an API endpoint to list user's packages
    console.log("Your packages:");
    console.log("  (This feature requires the /api/users/me/packages endpoint)");
  }

  /**
   * Show current user info
   */
  whoami(): void {
    if (!this.config.username) {
      console.log("Not logged in");
    } else {
      console.log(`Logged in as: ${this.config.username}`);
      console.log(`Email: ${this.config.email || "N/A"}`);
      console.log(`Registry: ${this.config.registry || REGISTRY_URL}`);
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.config = {};
    this.saveConfig();
    console.log("Logged out");
  }
}

// Main CLI
const cli = new PublishCLI();
const args = Deno.args;
const command = args[0];

switch (command) {
  case "login":
    await cli.login(args[1], args[2]);
    break;

  case "register":
    await cli.register(args[1], args[2], args[3]);
    break;

  case "publish":
    await cli.publish(args[1]);
    break;

  case "search":
    if (!args[1]) {
      console.error("Usage: elide-publish search <query>");
      Deno.exit(1);
    }
    await cli.search(args[1]);
    break;

  case "info":
    if (!args[1]) {
      console.error("Usage: elide-publish info <package-name>");
      Deno.exit(1);
    }
    await cli.info(args[1]);
    break;

  case "list":
    await cli.list();
    break;

  case "whoami":
    cli.whoami();
    break;

  case "logout":
    cli.logout();
    break;

  case "help":
  case undefined:
    console.log(`
Elide Marketplace Publishing CLI

Usage: elide-publish <command> [options]

Commands:
  login [username] [password]    Login to marketplace
  register [user] [email] [pwd]  Register new account
  publish [path]                 Publish package from path (default: .)
  search <query>                 Search for packages
  info <package>                 Show package information
  list                           List your packages
  whoami                         Show current user
  logout                         Logout
  help                           Show this help

Environment Variables:
  ELIDE_REGISTRY_URL            Registry URL (default: http://localhost:4873)
  ELIDE_API_URL                 API URL (default: http://localhost:3000)

Examples:
  elide-publish login
  elide-publish publish
  elide-publish search express
  elide-publish info @elide/http
`);
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error("Run 'elide-publish help' for usage");
    Deno.exit(1);
}
