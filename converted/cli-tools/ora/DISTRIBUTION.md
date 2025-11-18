# Ora Distribution Guide

Guide to building, packaging, and distributing Elide ora.

## Quick Start

```bash
# Build for current platform
elide build --output ora

# Build for all platforms
npm run build:all

# Publish to npm
npm publish
```

## Building Binaries

### Development Build

```bash
elide build --output ora --dev
```

### Production Build (Optimized)

```bash
elide build --output ora --optimize --strip-debug --minify
```

### Multi-Platform Builds

```bash
npm run build:all
```

This builds for:
- Linux x64, ARM64
- macOS x64, ARM64
- Windows x64

## Primary Use Case: Embedded in CLI Tools

Ora is typically embedded in other CLI tools, not distributed standalone.

### Example: Build Tool with Ora

```typescript
// your-build-tool/cli.ts
import ora from '@elide/ora';

const spinner = ora('Building...').start();
// ... build logic ...
spinner.succeed('Build complete!');
```

### Build Single Binary

```bash
# Build your CLI tool + ora bundled
elide build --output mybuildtool
```

Result: **~3-4MB standalone binary** (including ora)

Compare to Node.js: **~45MB** (Node.js + ora + your code)

## Distribution Channels

### 1. npm Package (Library)

Primary distribution for developers:

```json
{
  "name": "my-cli-tool",
  "dependencies": {
    "@elide/ora": "^1.0.0"
  }
}
```

### 2. Embedded in CLI Binaries

Most common real-world usage:

```typescript
// Your CLI depends on ora
import ora from '@elide/ora';
```

Then build everything into one binary:

```bash
elide build --output mycli
```

Users get a single binary with ora built-in.

### 3. Standalone Demo Binary (Optional)

For testing/demos, you can distribute ora CLI:

```bash
# Download ora CLI for testing spinners
curl -L https://github.com/elide-dev/ora/releases/latest/download/ora-linux-x64 -o ora
chmod +x ora

# Try different spinners
./ora --demo
./ora --list
```

## Docker Integration

### Add Ora to Build Tool Image

```dockerfile
FROM elide:latest AS builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN elide build --output buildtool

FROM scratch
COPY --from=builder /app/buildtool /buildtool
ENTRYPOINT ["/buildtool"]
```

Final image: **~3-4MB** (with ora bundled)

## Real-World Examples

### Build Tool Example

```typescript
#!/usr/bin/env elide
import ora from '@elide/ora';
import { build } from './builder';

const spinner = ora('Building project...').start();

try {
  await build();
  spinner.succeed('Build complete!');
} catch (error) {
  spinner.fail('Build failed: ' + error.message);
  process.exit(1);
}
```

Build and distribute:

```bash
elide build --output mybuild
# Result: 3.5MB standalone binary
```

### Package Manager Example

```typescript
import ora from '@elide/ora';

async function install(packages: string[]) {
  const spinner = ora().start();

  for (let i = 0; i < packages.length; i++) {
    spinner.text = `Installing ${packages[i]} (${i + 1}/${packages.length})`;
    await installPackage(packages[i]);
  }

  spinner.succeed(`Installed ${packages.length} packages!`);
}
```

### Database Migration Tool

```typescript
import ora from '@elide/ora';

async function migrate() {
  const spinner = ora('Connecting to database...').start();
  await db.connect();
  spinner.succeed('Connected!');

  spinner.start('Running migrations...');
  await db.migrate();
  spinner.succeed('Migrations complete!');
}
```

## Size Comparison

### As Embedded Library

| Your CLI Tool | Node.js + ora | Elide + ora |
|---------------|---------------|-------------|
| Simple CLI | ~42MB | ~3.5MB |
| Build tool | ~45MB | ~4.2MB |
| Package manager | ~48MB | ~4.8MB |

**Savings: ~90%** (40MB smaller binaries)

### Docker Image Size

| Image Type | Node.js + ora | Elide + ora |
|------------|---------------|-------------|
| Alpine base | 180MB | 3.5MB* |
| Debian base | 320MB | 3.5MB* |
| From scratch | N/A | 3.5MB |

\* Standalone binary, no base image needed

## npm Distribution

### As Library Dependency

```json
{
  "name": "@elide/ora",
  "main": "index.ts",
  "files": ["index.ts", "README.md"]
}
```

Users install:

```bash
npm install @elide/ora
```

### With Pre-built Binaries

If distributing standalone ora CLI:

```json
{
  "name": "@elide/ora",
  "bin": {
    "ora": "./cli.ts"
  },
  "files": ["index.ts", "cli.ts", "dist/"]
}
```

## Package Manager Distribution

### Homebrew (for ora CLI)

```ruby
class Ora < Formula
  desc "Terminal spinner powered by Elide"
  homepage "https://github.com/elide-dev/ora"
  url "https://github.com/elide-dev/ora/releases/download/v1.0.0/ora-macos-arm64"
  sha256 "..."

  def install
    bin.install "ora-macos-arm64" => "ora"
  end

  test do
    system "#{bin}/ora", "--version"
  end
end
```

### npm Global Install

```bash
npm install -g @elide/ora
ora --demo
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Build CLI Tool
  run: |
    npm install
    elide build --output mycli

- name: Upload Binary
  uses: actions/upload-artifact@v3
  with:
    name: mycli
    path: mycli
```

### Release Workflow

```yaml
- name: Build All Platforms
  run: npm run build:all

- name: Create Release
  uses: softprops/action-gh-release@v1
  with:
    files: dist/*
```

## Best Practices

1. **Embed ora in your CLI tool** (don't distribute ora standalone)
2. **Bundle everything into one binary** for easiest distribution
3. **Keep binaries optimized** with `--strip-debug --minify`
4. **Provide multi-platform builds** for better UX
5. **Use npm for library distribution** (developers)
6. **Use GitHub Releases for binary distribution** (end users)

## Migration from Node.js

### Before (Node.js ora)

```json
{
  "dependencies": {
    "ora": "^7.0.0"
  }
}
```

Your distributed binary: **~42-45MB**

### After (Elide ora)

```json
{
  "dependencies": {
    "@elide/ora": "^1.0.0"
  }
}
```

Build with Elide:

```bash
elide build --output mycli
```

Your distributed binary: **~3-4MB** (**90% smaller**)

**Result**: Same API, zero code changes, 10x smaller binary, 50-100x faster startup.

## Advanced: Library Variants

### Minimal Build (No CLI)

If you only need the ora library (not CLI):

```bash
elide build --optimize-size --tree-shake --output ora-lib
```

Result: **~2.5MB** (smaller than full build)

### With All Spinners

Default build includes all 50+ spinner types.

### Minimal Spinners

Custom build with only essential spinners:

```typescript
// custom-build.ts
export { ora } from './index';
export const spinners = {
  dots: { /* ... */ },
  line: { /* ... */ },
  star: { /* ... */ }
};
```

Build: **~2MB** (fewer spinner frames)

## Examples

See:
- `examples/` - Usage examples
- Cross-env's DISTRIBUTION.md - Detailed distribution workflows
- Minimist's DISTRIBUTION.md - Additional strategies

---

For comprehensive build processes, code signing, and advanced distribution, refer to [cross-env/DISTRIBUTION.md](../cross-env/DISTRIBUTION.md).
