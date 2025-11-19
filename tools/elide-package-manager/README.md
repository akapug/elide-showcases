# Elide Package Manager

A production-ready polyglot package manager that unifies npm, PyPI, Maven, and RubyGems into a single CLI tool. Built with Elide for high-performance cross-language dependency management.

## Features

- **Multi-Ecosystem Support**: Install packages from npm, PyPI, Maven, and RubyGems with a single command
- **Smart Resolution**: Automatic dependency resolution with conflict detection
- **Dependency Graphs**: Visualize and analyze dependency trees across ecosystems
- **Lockfile Management**: Reproducible builds with integrity verification
- **Intelligent Caching**: Fast installs with SHA-256 integrity checks
- **Circular Detection**: Detect and warn about circular dependencies
- **Global & Local**: Install packages globally or per-project
- **Production Ready**: Comprehensive error handling and validation

## Installation

```bash
# Make the CLI executable
chmod +x cli.ts

# Run with Elide
elide run cli.ts --help
```

## Quick Start

### Initialize a Project

```bash
elide run cli.ts init
```

This creates `elide.json` and `elide.lock` files in your project.

### Install Packages

```bash
# Install from npm (auto-detected)
elide run cli.ts install express

# Install from specific ecosystem
elide run cli.ts install pypi:requests
elide run cli.ts install maven:org.springframework:spring-core
elide run cli.ts install rubygems:rails

# Install specific version
elide run cli.ts install express@4.18.0

# Install multiple packages
elide run cli.ts install express lodash axios
```

### Search for Packages

```bash
# Search all ecosystems
elide run cli.ts search web framework

# Search specific ecosystem
elide run cli.ts search --ecosystem npm react

# Verbose search with details
elide run cli.ts search -V typescript
```

### List Installed Packages

```bash
# Simple list
elide run cli.ts list

# Detailed list with dependencies
elide run cli.ts list --verbose
```

### Update Packages

```bash
# Check for outdated packages
elide run cli.ts outdated

# Update all packages
elide run cli.ts update
```

### Visualize Dependencies

```bash
# Show dependency graph
elide run cli.ts graph
```

### Package Information

```bash
# Get detailed package info
elide run cli.ts info express

# Info from specific ecosystem
elide run cli.ts info --ecosystem pypi requests
```

### Uninstall Packages

```bash
# Remove package
elide run cli.ts uninstall express

# Remove multiple packages
elide run cli.ts rm lodash axios
```

### Clean Cache

```bash
# Clear package cache
elide run cli.ts clean
```

## CLI Commands

### `install` (alias: `i`)

Install packages from any ecosystem.

```bash
elide run cli.ts install [packages...]

Options:
  -e, --ecosystem <type>    Specify ecosystem (npm|pypi|maven|rubygems)
  -D, --save-dev           Save as dev dependency
  -g, --global             Install globally
  -V, --verbose            Verbose output
```

### `uninstall` (aliases: `remove`, `rm`)

Remove installed packages.

```bash
elide run cli.ts uninstall <packages...>

Options:
  -g, --global             Remove global package
  -V, --verbose            Verbose output
```

### `list` (alias: `ls`)

List installed packages.

```bash
elide run cli.ts list

Options:
  -V, --verbose            Show dependencies for each package
```

### `search`

Search for packages across ecosystems.

```bash
elide run cli.ts search <query>

Options:
  -e, --ecosystem <type>   Limit search to specific ecosystem
  -V, --verbose            Show detailed results
```

### `update` (alias: `upgrade`)

Update all packages to latest versions.

```bash
elide run cli.ts update
```

### `init`

Initialize a new Elide project.

```bash
elide run cli.ts init
```

### `info`

Show detailed package information.

```bash
elide run cli.ts info <package>

Options:
  -e, --ecosystem <type>   Specify ecosystem
```

### `outdated`

Check for outdated packages.

```bash
elide run cli.ts outdated
```

### `graph`

Visualize dependency graph.

```bash
elide run cli.ts graph
```

### `clean`

Clean package cache.

```bash
elide run cli.ts clean
```

## Architecture

### Components

#### `cli.ts` - Command Line Interface

The main entry point that handles command parsing and orchestration.

- **Command Parsing**: Uses `@std/cli` for robust argument parsing
- **User Interaction**: Prompts and formatted output
- **Error Handling**: Comprehensive error messages with stack traces in verbose mode

#### `resolver.ts` - Dependency Resolver

Handles polyglot dependency resolution with advanced features.

- **Recursive Resolution**: Resolves entire dependency trees
- **Conflict Detection**: Identifies version conflicts across dependencies
- **Graph Building**: Creates dependency graphs for visualization
- **Circular Detection**: DFS-based algorithm to detect circular dependencies
- **Version Selection**: Multiple strategies (latest, oldest, semver)

#### `registry.ts` - Multi-Ecosystem Registry

Unified client for multiple package registries.

- **npm**: Uses official npm registry API
- **PyPI**: Integrates with PyPI JSON API
- **Maven**: Queries Maven Central Solr search
- **RubyGems**: Uses RubyGems.org API
- **Unified Search**: Parallel searching across all ecosystems
- **Version Resolution**: Gets latest versions and full version lists

#### `installer.ts` - Package Installer

Handles downloading, extracting, and installing packages.

- **Download Management**: Fetches packages from registries
- **Cache System**: SHA-256 integrity-checked cache
- **Format Support**: Handles .tgz, .whl, .jar, .gem formats
- **Script Execution**: Runs post-install scripts
- **Symlink Management**: Creates executable symlinks
- **Dependency Installation**: Recursive dependency installation

#### `lock-manager.ts` - Lockfile Manager

Manages `elide.lock` for reproducible builds.

- **Integrity Verification**: SHA-256 checksums for all packages
- **Version Locking**: Exact version tracking
- **Dependency Trees**: Complete dependency resolution storage
- **Verification**: Validates lockfile integrity
- **Statistics**: Provides lockfile analytics
- **Multiple Formats**: Export to JSON, YAML, TOML

## File Structure

```
elide-package-manager/
├── cli.ts              # Main CLI interface
├── resolver.ts         # Dependency resolution engine
├── registry.ts         # Multi-ecosystem registry client
├── installer.ts        # Package installation handler
├── lock-manager.ts     # Lockfile management
└── README.md           # This file
```

## Configuration

### `elide.json`

Project configuration file:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "My Elide project",
  "author": "Your Name",
  "dependencies": {
    "express": "^4.18.0",
    "pypi:requests": "^2.31.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "ecosystems": ["npm", "pypi", "maven", "rubygems"]
}
```

### `elide.lock`

Lockfile for reproducible builds:

```json
{
  "version": "1.0",
  "generated": "2025-11-12T10:00:00.000Z",
  "packages": {
    "npm:express@4.18.0": {
      "name": "express",
      "version": "4.18.0",
      "ecosystem": "npm",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.0.tgz",
      "integrity": "sha256-abc123...",
      "dependencies": {
        "body-parser": "1.20.0",
        "cookie": "0.5.0"
      }
    }
  },
  "integrity": {
    "npm:express@4.18.0": "sha256-abc123..."
  }
}
```

## Advanced Usage

### Custom Registry URLs

```typescript
import { RegistryClient } from "./registry.ts";

const registry = new RegistryClient();
registry.setRegistryUrl("npm", "https://my-private-registry.com");
```

### Programmatic Usage

```typescript
import { PackageManagerCLI } from "./cli.ts";

const cli = new PackageManagerCLI();
await cli.run(["install", "express"]);
```

### Conflict Resolution

```typescript
import { Resolver } from "./resolver.ts";

const resolver = new Resolver();
const pkg = await resolver.resolve("express", "4.18.0", "npm");
const conflicts = resolver.detectConflicts(pkg);

// Resolve conflicts
const resolutions = resolver.resolveConflicts(conflicts, "latest");
```

### Cache Management

```typescript
import { Installer } from "./installer.ts";

const installer = new Installer();

// Get cache stats
const stats = installer.getCacheStats();
console.log(`Cache size: ${stats.packages} packages`);

// Clean cache
await installer.cleanCache();
```

### Lockfile Verification

```typescript
import { LockManager } from "./lock-manager.ts";

const lockManager = new LockManager();
await lockManager.load();

const { valid, errors } = await lockManager.verify();
if (!valid) {
  console.error("Lockfile validation failed:");
  errors.forEach(error => console.error(`  - ${error}`));
}
```

## Package Format Support

### npm Packages (.tgz)

- Extracts tarball to `elide_modules/<package>`
- Runs `npm install` scripts if present
- Creates symlinks for binaries in `.bin/`

### PyPI Packages (.whl, .tar.gz)

- Supports both wheel and source distributions
- Runs `setup.py install` for source packages
- Handles `requirements.txt` dependencies

### Maven Packages (.jar)

- Extracts JAR files to package directory
- Handles Maven coordinates (`groupId:artifactId:version`)
- Supports Maven Central repository

### RubyGems (.gem)

- Extracts gem archives
- Processes gemspec metadata
- Handles runtime and development dependencies

## Performance

- **Parallel Downloads**: Multiple packages download simultaneously
- **Smart Caching**: Avoids re-downloading with integrity checks
- **Incremental Resolution**: Caches resolved dependency trees
- **Minimal I/O**: Efficient file operations with streaming

## Error Handling

The package manager includes comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Version Conflicts**: Clear warning messages with resolution suggestions
- **Integrity Failures**: Prevents installation of corrupted packages
- **Circular Dependencies**: Detects and reports circular dependency chains
- **Missing Dependencies**: Validates all dependencies are resolvable

## Security

- **Integrity Verification**: SHA-256 checksums for all packages
- **Lockfile Validation**: Ensures consistent installations
- **Script Safety**: Optional script execution with `--skip-scripts`
- **HTTPS Only**: All registry communications use HTTPS

## Troubleshooting

### Package Not Found

```bash
# Specify ecosystem explicitly
elide run cli.ts install --ecosystem npm express
```

### Version Conflicts

```bash
# View dependency graph to identify conflicts
elide run cli.ts graph

# Check outdated packages
elide run cli.ts outdated
```

### Cache Issues

```bash
# Clean cache and reinstall
elide run cli.ts clean
elide run cli.ts install
```

### Lockfile Corruption

```bash
# Remove and regenerate lockfile
rm elide.lock
elide run cli.ts install
```

## Development

### Running Tests

```bash
# Unit tests
deno test

# Integration tests
deno test --integration
```

### Building

```bash
# Compile to executable
deno compile --allow-all cli.ts -o epm
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Roadmap

- [ ] Add support for Cargo (Rust) packages
- [ ] Implement workspace support for monorepos
- [ ] Add package publishing capabilities
- [ ] Create web UI for dependency visualization
- [ ] Add audit command for security vulnerabilities
- [ ] Implement peer dependency resolution
- [ ] Add plugin system for custom ecosystems
- [ ] Create migration tools from npm/pip/etc
- [ ] Add CI/CD integration guides
- [ ] Implement differential updates

## Support

- GitHub Issues: [Report bugs and feature requests](https://github.com/elide-dev/elide-showcases)
- Documentation: [Full docs](https://docs.elide.dev)
- Community: [Join our Discord](https://discord.gg/elide)

## Acknowledgments

Built with:
- [Elide](https://elide.dev) - Polyglot runtime
- [Deno Standard Library](https://deno.land/std) - Core utilities
- npm, PyPI, Maven, and RubyGems APIs

---

**Made with ❤️ by the Elide community**
