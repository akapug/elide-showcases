# Cross-Env Distribution Guide

Complete guide to building, packaging, and distributing the Elide cross-env as standalone binaries.

## Table of Contents

- [Building Binaries](#building-binaries)
- [Distribution Channels](#distribution-channels)
- [Platform-Specific Builds](#platform-specific-builds)
- [npm Distribution](#npm-distribution)
- [Docker Integration](#docker-integration)
- [CI/CD Integration](#cicd-integration)
- [Versioning and Releases](#versioning-and-releases)

## Building Binaries

### Single Platform Build

Build for your current platform:

```bash
elide build --output cross-env
```

This creates a standalone executable named `cross-env` (or `cross-env.exe` on Windows).

### Multi-Platform Builds

Build for all supported platforms:

```bash
npm run build:all
```

This executes:
- `build:linux` - Linux x64
- `build:macos` - macOS ARM64 (Apple Silicon)
- `build:windows` - Windows x64

#### Individual Platform Builds

```bash
# Linux x64
elide build --platform linux-x64 --output dist/cross-env-linux-x64

# Linux ARM64 (Raspberry Pi, ARM servers)
elide build --platform linux-arm64 --output dist/cross-env-linux-arm64

# macOS x64 (Intel)
elide build --platform darwin-x64 --output dist/cross-env-macos-x64

# macOS ARM64 (Apple Silicon)
elide build --platform darwin-arm64 --output dist/cross-env-macos-arm64

# Windows x64
elide build --platform win32-x64 --output dist/cross-env-windows-x64.exe

# Windows ARM64
elide build --platform win32-arm64 --output dist/cross-env-windows-arm64.exe
```

### Build Options

#### Optimized Production Build

```bash
elide build \
  --output cross-env \
  --optimize \
  --strip-debug \
  --minify
```

#### Development Build (Faster, with Debug Info)

```bash
elide build \
  --output cross-env \
  --dev \
  --source-maps
```

#### Size-Optimized Build

```bash
elide build \
  --output cross-env \
  --optimize-size \
  --compress \
  --strip-all
```

Expected sizes:
- Standard build: ~4.1 MB
- Size-optimized: ~3.2 MB
- With compression: ~2.8 MB

## Distribution Channels

### 1. npm Package Distribution

The primary distribution method is via npm with platform-specific binaries.

#### Package Structure

```
@elide/cross-env/
├── package.json
├── index.ts
├── cli.ts
├── README.md
├── dist/
│   ├── cross-env-linux-x64
│   ├── cross-env-linux-arm64
│   ├── cross-env-macos-x64
│   ├── cross-env-macos-arm64
│   ├── cross-env-windows-x64.exe
│   └── cross-env-windows-arm64.exe
└── bin/
    └── cross-env (symlink to appropriate dist/ binary)
```

#### Publishing to npm

```bash
# Build all platforms
npm run build:all

# Test locally
npm pack
npm install -g ./elide-cross-env-1.0.0.tgz

# Publish to npm
npm publish --access public
```

#### Installation Methods

Users can install via:

```bash
# Global installation
npm install -g @elide/cross-env

# Project-local installation
npm install --save-dev @elide/cross-env

# Using npx (no installation)
npx @elide/cross-env NODE_ENV=production node app.js
```

### 2. GitHub Releases

Distribute binaries directly via GitHub Releases.

#### Release Structure

```
v1.0.0/
├── cross-env-linux-x64
├── cross-env-linux-arm64
├── cross-env-macos-x64
├── cross-env-macos-arm64
├── cross-env-windows-x64.exe
├── cross-env-windows-arm64.exe
├── checksums.txt
└── README.md
```

#### Creating a Release

```bash
# Tag the version
git tag v1.0.0
git push origin v1.0.0

# Build all platforms
npm run build:all

# Generate checksums
cd dist
sha256sum cross-env-* > checksums.txt

# Upload to GitHub Releases (using gh CLI)
gh release create v1.0.0 \
  --title "Cross-Env v1.0.0" \
  --notes "Release notes here" \
  cross-env-*
```

#### User Installation from GitHub

```bash
# Linux x64
curl -L https://github.com/elide-dev/cross-env/releases/latest/download/cross-env-linux-x64 -o cross-env
chmod +x cross-env
sudo mv cross-env /usr/local/bin/

# macOS (Apple Silicon)
curl -L https://github.com/elide-dev/cross-env/releases/latest/download/cross-env-macos-arm64 -o cross-env
chmod +x cross-env
sudo mv cross-env /usr/local/bin/

# Windows (PowerShell)
Invoke-WebRequest -Uri "https://github.com/elide-dev/cross-env/releases/latest/download/cross-env-windows-x64.exe" -OutFile "cross-env.exe"
Move-Item cross-env.exe C:\Windows\System32\
```

### 3. Homebrew Distribution

For macOS and Linux users.

#### Formula Structure

Create a Homebrew formula (`cross-env.rb`):

```ruby
class CrossEnv < Formula
  desc "Cross-platform environment variable setter powered by Elide"
  homepage "https://github.com/elide-dev/cross-env"
  version "1.0.0"

  if OS.mac? && Hardware::CPU.arm?
    url "https://github.com/elide-dev/cross-env/releases/download/v1.0.0/cross-env-macos-arm64"
    sha256 "..."
  elsif OS.mac?
    url "https://github.com/elide-dev/cross-env/releases/download/v1.0.0/cross-env-macos-x64"
    sha256 "..."
  else
    url "https://github.com/elide-dev/cross-env/releases/download/v1.0.0/cross-env-linux-x64"
    sha256 "..."
  end

  def install
    bin.install Dir["cross-env-*"].first => "cross-env"
  end

  test do
    system "#{bin}/cross-env", "TEST=true", "echo", "Test successful"
  end
end
```

#### User Installation

```bash
# Add tap (if using custom tap)
brew tap elide-dev/tools

# Install
brew install cross-env

# Update
brew upgrade cross-env
```

### 4. Docker Distribution

Multiple Docker distribution strategies.

#### Strategy 1: Multi-Stage Build

```dockerfile
# Build stage
FROM elide/elide:latest AS builder
WORKDIR /build
COPY . .
RUN elide build --output cross-env --optimize

# Runtime stage (minimal)
FROM scratch
COPY --from=builder /build/cross-env /cross-env
ENTRYPOINT ["/cross-env"]
```

Usage:
```bash
docker build -t elide/cross-env:latest .
docker run elide/cross-env NODE_ENV=production node app.js
```

#### Strategy 2: Standalone Binary in Docker

```dockerfile
FROM alpine:latest
RUN apk add --no-cache libc6-compat
COPY dist/cross-env-linux-x64 /usr/local/bin/cross-env
RUN chmod +x /usr/local/bin/cross-env
ENTRYPOINT ["cross-env"]
```

Final image size: ~8 MB (Alpine + binary)

#### Strategy 3: Add to Existing Image

```dockerfile
FROM node:20-alpine
COPY --from=elide/cross-env:latest /cross-env /usr/local/bin/cross-env
# Your app code here
```

### 5. Package Manager Distribution

#### APT (Debian/Ubuntu)

Create a `.deb` package:

```bash
# Using elide package command
elide package --format deb --output cross-env_1.0.0_amd64.deb

# Manual creation
mkdir -p cross-env_1.0.0_amd64/usr/local/bin
cp dist/cross-env-linux-x64 cross-env_1.0.0_amd64/usr/local/bin/cross-env
dpkg-deb --build cross-env_1.0.0_amd64
```

Installation:
```bash
sudo dpkg -i cross-env_1.0.0_amd64.deb
```

#### RPM (RHEL/Fedora/CentOS)

Create a `.rpm` package:

```bash
# Using elide package command
elide package --format rpm --output cross-env-1.0.0.x86_64.rpm
```

Installation:
```bash
sudo rpm -i cross-env-1.0.0.x86_64.rpm
```

#### Snap (Ubuntu)

```yaml
# snapcraft.yaml
name: cross-env
version: '1.0.0'
summary: Cross-platform environment variable setter
description: |
  Cross-env for Elide - Set environment variables cross-platform with instant startup.

grade: stable
confinement: strict

apps:
  cross-env:
    command: cross-env
    plugs: [home, network]

parts:
  cross-env:
    plugin: dump
    source: dist/
    organize:
      cross-env-linux-x64: cross-env
```

Build and publish:
```bash
snapcraft
snapcraft upload --release=stable cross-env_1.0.0_amd64.snap
```

Installation:
```bash
sudo snap install cross-env
```

## Platform-Specific Builds

### Linux

#### x64 (Most Common)

```bash
elide build --platform linux-x64 --output cross-env
```

Target: Most Linux distributions (Ubuntu, Debian, RHEL, etc.)

#### ARM64

```bash
elide build --platform linux-arm64 --output cross-env
```

Target: Raspberry Pi, AWS Graviton, ARM servers

#### Distribution Testing

Test on various distributions:
```bash
# Ubuntu
docker run -v $(pwd):/app ubuntu:22.04 /app/cross-env TEST=true echo "OK"

# Alpine
docker run -v $(pwd):/app alpine:latest /app/cross-env TEST=true echo "OK"

# RHEL
docker run -v $(pwd):/app redhat/ubi9 /app/cross-env TEST=true echo "OK"
```

### macOS

#### Intel (x64)

```bash
elide build --platform darwin-x64 --output cross-env
```

Target: Intel Macs (2020 and earlier)

#### Apple Silicon (ARM64)

```bash
elide build --platform darwin-arm64 --output cross-env
```

Target: M1, M2, M3 Macs (2020 and later)

#### Universal Binary

Create a universal binary for both architectures:

```bash
# Build both
elide build --platform darwin-x64 --output cross-env-x64
elide build --platform darwin-arm64 --output cross-env-arm64

# Combine using lipo
lipo -create cross-env-x64 cross-env-arm64 -output cross-env
```

#### Code Signing (macOS)

```bash
# Sign the binary
codesign --sign "Developer ID Application: Your Name" cross-env

# Verify signature
codesign --verify --verbose cross-env

# Notarize for Gatekeeper
xcrun notarytool submit cross-env.zip --keychain-profile "notary-profile" --wait
xcrun stapler staple cross-env
```

### Windows

#### x64

```bash
elide build --platform win32-x64 --output cross-env.exe
```

Target: 64-bit Windows (most common)

#### ARM64

```bash
elide build --platform win32-arm64 --output cross-env.exe
```

Target: Windows on ARM (Surface Pro X, etc.)

#### Code Signing (Windows)

```bash
# Sign the executable
signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com /td sha256 /fd sha256 cross-env.exe

# Verify signature
signtool verify /pa cross-env.exe
```

## npm Distribution

### Package Configuration

Ensure `package.json` includes platform-specific binaries:

```json
{
  "name": "@elide/cross-env",
  "bin": {
    "cross-env": "./cli.ts"
  },
  "files": [
    "index.ts",
    "cli.ts",
    "dist/"
  ],
  "elide": {
    "platforms": [
      "linux-x64",
      "linux-arm64",
      "darwin-x64",
      "darwin-arm64",
      "win32-x64",
      "win32-arm64"
    ]
  }
}
```

### Post-Install Script

Automatically select the correct binary after installation:

```javascript
// scripts/postinstall.js
import { platform, arch } from 'os';
import { chmod } from 'fs/promises';
import { join } from 'path';

const platformMap = {
  'linux-x64': 'cross-env-linux-x64',
  'linux-arm64': 'cross-env-linux-arm64',
  'darwin-x64': 'cross-env-macos-x64',
  'darwin-arm64': 'cross-env-macos-arm64',
  'win32-x64': 'cross-env-windows-x64.exe',
  'win32-arm64': 'cross-env-windows-arm64.exe'
};

const key = `${platform()}-${arch()}`;
const binary = platformMap[key];

if (binary) {
  const binaryPath = join('dist', binary);
  await chmod(binaryPath, 0o755);
  console.log(`Installed cross-env for ${key}`);
}
```

Add to package.json:
```json
{
  "scripts": {
    "postinstall": "node scripts/postinstall.js"
  }
}
```

## Docker Integration

### As a Build Tool

Use in multi-stage builds:

```dockerfile
FROM node:20 AS builder
RUN npm install -g @elide/cross-env
WORKDIR /app
COPY package*.json ./
RUN cross-env NODE_ENV=production npm ci
COPY . .
RUN cross-env NODE_ENV=production npm run build

FROM node:20-alpine
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
```

### Standalone Binary Layer

Create a reusable layer:

```dockerfile
FROM alpine:latest AS cross-env
ADD https://github.com/elide-dev/cross-env/releases/latest/download/cross-env-linux-x64 /usr/local/bin/cross-env
RUN chmod +x /usr/local/bin/cross-env

FROM node:20-alpine
COPY --from=cross-env /usr/local/bin/cross-env /usr/local/bin/
# Your app here
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            platform: linux-x64
          - os: macos-latest
            platform: darwin-arm64
          - os: windows-latest
            platform: win32-x64

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Elide
        uses: elide-dev/setup-elide@v1

      - name: Build
        run: elide build --platform ${{ matrix.platform }} --output dist/cross-env

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: cross-env-${{ matrix.platform }}
          path: dist/cross-env*

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            cross-env-*/cross-env*
```

### GitLab CI

```yaml
build:
  stage: build
  parallel:
    matrix:
      - PLATFORM: linux-x64
      - PLATFORM: darwin-arm64
      - PLATFORM: win32-x64
  script:
    - elide build --platform $PLATFORM --output dist/cross-env-$PLATFORM
  artifacts:
    paths:
      - dist/

release:
  stage: release
  script:
    - gh release create $CI_COMMIT_TAG dist/*
  only:
    - tags
```

## Versioning and Releases

### Semantic Versioning

Follow semver (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking API changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes

### Release Checklist

1. **Update Version**
   ```bash
   npm version minor  # or major/patch
   ```

2. **Build All Platforms**
   ```bash
   npm run build:all
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Generate Checksums**
   ```bash
   cd dist
   sha256sum * > checksums.txt
   ```

5. **Create Git Tag**
   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

6. **Publish to npm**
   ```bash
   npm publish
   ```

7. **Create GitHub Release**
   ```bash
   gh release create v1.1.0 --generate-notes dist/*
   ```

## Best Practices

1. **Always provide checksums** for binary downloads
2. **Code sign binaries** for macOS and Windows
3. **Test on all target platforms** before releasing
4. **Keep binaries size-optimized** with compression
5. **Provide multiple installation methods** for user convenience
6. **Version binary names** for clarity (e.g., `cross-env-1.0.0-linux-x64`)
7. **Document platform requirements** clearly
8. **Automate builds** with CI/CD pipelines

## Troubleshooting

### Binary Won't Execute on Linux

```bash
# Check architecture
file cross-env

# Ensure it's executable
chmod +x cross-env

# Check for missing dependencies
ldd cross-env
```

### macOS Gatekeeper Blocks Binary

```bash
# Remove quarantine attribute
xattr -d com.apple.quarantine cross-env

# Or sign the binary
codesign --sign - cross-env
```

### Windows SmartScreen Warning

- Code sign the binary with a verified certificate
- Or instruct users to click "More info" → "Run anyway"

---

This distribution guide ensures your Elide cross-env binaries reach users through their preferred channels while maintaining security and reliability.
