# Elide DX Integration Guide

Complete guide for integrating Elide DX tools into your development workflow.

## Table of Contents

1. [Quick Start](#quick-start)
2. [IDE Integration](#ide-integration)
3. [CI/CD Integration](#cicd-integration)
4. [Git Hooks](#git-hooks)
5. [Automation](#automation)
6. [Team Workflows](#team-workflows)

## Quick Start

### Installation

```bash
# Global installation
npm install -g @elide/dx

# Project installation
npm install --save-dev @elide/dx

# Verify installation
elide --version
```

### Basic Configuration

Create `.elide/config.json` in your project root:

```json
{
  "debugger": {
    "port": 9229,
    "sourceMaps": true,
    "pauseOnExceptions": false
  },
  "test": {
    "parallel": true,
    "coverage": true,
    "coverageThreshold": {
      "lines": 80,
      "functions": 80
    }
  },
  "linter": {
    "rules": {
      "no-console": "warn",
      "no-unused-vars": "error",
      "semi": ["error", "always"]
    }
  },
  "formatter": {
    "printWidth": 80,
    "tabWidth": 2,
    "singleQuote": true
  }
}
```

## IDE Integration

### Visual Studio Code

#### Installation

1. Install the Elide DX extension from VS Code Marketplace
2. Or install manually:

```bash
code --install-extension elide.elide-dx
```

#### Configuration

Create `.vscode/settings.json`:

```json
{
  "elide.enable": true,
  "elide.debug.autoAttach": true,
  "elide.test.autoRun": "onSave",
  "elide.lint.enable": true,
  "elide.lint.autoFix": true,
  "elide.format.enable": true,
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "elide.elide-dx"
  },
  "[javascript]": {
    "editor.defaultFormatter": "elide.elide-dx"
  }
}
```

#### Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "elide",
      "request": "launch",
      "name": "Launch Elide App",
      "program": "${workspaceFolder}/src/main.ts",
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    },
    {
      "type": "elide",
      "request": "attach",
      "name": "Attach to Elide",
      "port": 9229,
      "restart": true
    }
  ]
}
```

#### Keyboard Shortcuts

Add to `.vscode/keybindings.json`:

```json
[
  {
    "key": "f5",
    "command": "elide.debug.start"
  },
  {
    "key": "shift+f5",
    "command": "elide.debug.stop"
  },
  {
    "key": "f10",
    "command": "elide.debug.stepOver"
  },
  {
    "key": "f11",
    "command": "elide.debug.stepInto"
  },
  {
    "key": "shift+f11",
    "command": "elide.debug.stepOut"
  },
  {
    "key": "ctrl+shift+t",
    "command": "elide.test.run"
  },
  {
    "key": "ctrl+shift+l",
    "command": "elide.lint.fix"
  }
]
```

### IntelliJ IDEA / WebStorm

#### Installation

1. Open Settings → Plugins
2. Search for "Elide DX"
3. Click Install and restart IDE

#### Configuration

1. Open Settings → Languages & Frameworks → Elide
2. Configure paths and options:
   - Elide executable: `/usr/local/bin/elide`
   - Enable automatic linting: ✓
   - Enable automatic formatting: ✓
   - Run tests on save: ✓

#### Run Configurations

Create run configurations for:

**Debug Configuration:**
- Template: Elide Debug
- Main file: `src/main.ts`
- Debug port: 9229

**Test Configuration:**
- Template: Elide Test
- Test pattern: `**/*.test.ts`
- Coverage: Enabled

### Vim/Neovim

#### Installation with vim-plug

```vim
Plug 'elide/elide-dx.nvim'
```

#### Configuration (Lua)

```lua
require('elide-dx').setup({
  debugger = {
    enabled = true,
    port = 9229,
    auto_attach = true
  },
  test = {
    enabled = true,
    auto_run = false
  },
  linter = {
    enabled = true,
    auto_fix = true,
    virtual_text = true
  },
  formatter = {
    enabled = true,
    format_on_save = true
  }
})
```

#### Key Mappings

```lua
local opts = { noremap = true, silent = true }

-- Debugging
vim.keymap.set('n', '<F5>', ':ElideDebugStart<CR>', opts)
vim.keymap.set('n', '<F10>', ':ElideDebugStepOver<CR>', opts)
vim.keymap.set('n', '<F11>', ':ElideDebugStepInto<CR>', opts)

-- Testing
vim.keymap.set('n', '<leader>t', ':ElideTest<CR>', opts)
vim.keymap.set('n', '<leader>tc', ':ElideTestCoverage<CR>', opts)

-- Linting
vim.keymap.set('n', '<leader>l', ':ElideLint<CR>', opts)
vim.keymap.set('n', '<leader>lf', ':ElideLintFix<CR>', opts)

-- Formatting
vim.keymap.set('n', '<leader>f', ':ElideFormat<CR>', opts)
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/elide-dx.yml`:

```yaml
name: Elide DX

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Elide DX
        run: npm install -g @elide/dx

      - name: Lint
        run: elide lint

      - name: Type Check
        run: elide typecheck

      - name: Format Check
        run: elide format --check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Elide DX
        run: npm install -g @elide/dx

      - name: Run Tests
        run: elide test --coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage.json

  profile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Elide DX
        run: npm install -g @elide/dx

      - name: Profile Startup
        run: elide profile --duration 5000 --output profile.json

      - name: Upload Profile
        uses: actions/upload-artifact@v3
        with:
          name: performance-profile
          path: profile.json
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
image: node:18

stages:
  - quality
  - test
  - profile

before_script:
  - npm install -g @elide/dx

lint:
  stage: quality
  script:
    - elide lint
  allow_failure: false

typecheck:
  stage: quality
  script:
    - elide typecheck
  allow_failure: false

format:
  stage: quality
  script:
    - elide format --check
  allow_failure: false

test:
  stage: test
  script:
    - elide test --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

profile:
  stage: profile
  script:
    - elide profile --duration 5000 --output profile.json
  artifacts:
    paths:
      - profile.json
    expire_in: 1 week
```

### Jenkins

Create `Jenkinsfile`:

```groovy
pipeline {
  agent any

  tools {
    nodejs 'NodeJS 18'
  }

  stages {
    stage('Setup') {
      steps {
        sh 'npm install -g @elide/dx'
      }
    }

    stage('Quality Checks') {
      parallel {
        stage('Lint') {
          steps {
            sh 'elide lint'
          }
        }
        stage('Type Check') {
          steps {
            sh 'elide typecheck'
          }
        }
        stage('Format Check') {
          steps {
            sh 'elide format --check'
          }
        }
      }
    }

    stage('Test') {
      steps {
        sh 'elide test --coverage'
      }
      post {
        always {
          publishHTML([
            reportDir: 'coverage',
            reportFiles: 'index.html',
            reportName: 'Coverage Report'
          ])
        }
      }
    }

    stage('Profile') {
      steps {
        sh 'elide profile --duration 5000 --output profile.json'
      }
      post {
        always {
          archiveArtifacts artifacts: 'profile.json'
        }
      }
    }
  }
}
```

## Git Hooks

### Husky + lint-staged

Install dependencies:

```bash
npm install --save-dev husky lint-staged
```

Configure `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,js}": [
      "elide lint --fix",
      "elide format"
    ],
    "*.{json,md}": [
      "elide format"
    ]
  }
}
```

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint-staged
npx lint-staged

# Run type check
elide typecheck

# Run tests
elide test --bail
```

Create `.husky/pre-push`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run full test suite with coverage
elide test --coverage

# Check coverage thresholds
if [ $? -ne 0 ]; then
  echo "Tests failed or coverage threshold not met"
  exit 1
fi
```

## Automation

### Watch Mode

Development workflow with watch mode:

```bash
# Terminal 1: Run tests in watch mode
elide test --watch

# Terminal 2: Run app with debugger
elide debug --inspect-brk src/main.ts

# Terminal 3: Monitor performance
elide inspect
```

### NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "elide debug src/main.ts",
    "dev:inspect": "elide inspect",
    "test": "elide test",
    "test:watch": "elide test --watch",
    "test:coverage": "elide test --coverage",
    "lint": "elide lint",
    "lint:fix": "elide lint --fix",
    "format": "elide format",
    "format:check": "elide format --check",
    "typecheck": "elide typecheck",
    "docs": "elide docs",
    "profile": "elide profile --duration 10000",
    "quality": "npm run lint && npm run typecheck && npm run format:check"
  }
}
```

## Team Workflows

### Code Review Checklist

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
<!-- Describe your changes -->

## Quality Checks
- [ ] `elide lint` passes
- [ ] `elide typecheck` passes
- [ ] `elide format --check` passes
- [ ] `elide test --coverage` passes with >80% coverage
- [ ] No performance regressions (run `elide profile`)

## Testing
- [ ] Added tests for new features
- [ ] All tests pass
- [ ] Manual testing completed

## Documentation
- [ ] Updated documentation
- [ ] Added code comments
- [ ] Updated CHANGELOG
```

### Performance Budgets

Create `.elide/performance-budget.json`:

```json
{
  "startup": {
    "max": 1000,
    "warn": 800
  },
  "bundleSize": {
    "max": 500000,
    "warn": 400000
  },
  "memory": {
    "max": 100000000,
    "warn": 80000000
  },
  "fps": {
    "min": 30,
    "warn": 45
  }
}
```

Check budgets in CI:

```bash
elide profile --check-budget .elide/performance-budget.json
```

## Best Practices

1. **Run quality checks before commits**
   - Use git hooks
   - Keep feedback loop tight

2. **Monitor performance continuously**
   - Profile regularly
   - Track metrics over time

3. **Maintain high test coverage**
   - Set coverage thresholds
   - Review coverage reports

4. **Automate everything**
   - CI/CD integration
   - Automated formatting
   - Automated linting

5. **Share configurations**
   - Commit config files
   - Document team standards
   - Use consistent settings

## Troubleshooting

See [README.md#troubleshooting](README.md#troubleshooting) for common issues and solutions.

## Support

- Documentation: https://elide.dev/docs/dx
- Issues: https://github.com/elide/elide-dx/issues
- Discord: https://discord.gg/elide
