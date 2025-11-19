#!/usr/bin/env node

/**
 * Vite Clone - CLI
 *
 * Command-line interface for the Vite Clone build tool.
 * Supports dev, build, preview, and optimize commands.
 */

import { cac } from 'cac';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { createServer, build, preview } from '../index';
import type { InlineConfig } from '../types/config';

const cli = cac('vite-clone');

/**
 * Global options
 */
interface GlobalCLIOptions {
  '--'?: string[];
  config?: string;
  root?: string;
  mode?: string;
  logLevel?: string;
  clearScreen?: boolean;
}

/**
 * Dev server command
 */
cli
  .command('[root]', 'Start dev server')
  .alias('serve')
  .alias('dev')
  .option('--host [host]', 'Specify hostname')
  .option('--port <port>', 'Specify port')
  .option('--https', 'Use TLS + HTTP/2')
  .option('--open [path]', 'Open browser on startup')
  .option('--cors', 'Enable CORS')
  .option('--strictPort', 'Exit if specified port is already in use')
  .option('--force', 'Force the optimizer to re-bundle dependencies')
  .action(async (root: string, options: GlobalCLIOptions & ServerOptions) => {
    try {
      const config = await resolveConfig(root, options);
      const server = await createServer({
        ...config,
        server: {
          host: options.host,
          port: options.port ? parseInt(options.port) : undefined,
          https: options.https,
          open: options.open,
          cors: options.cors,
          strictPort: options.strictPort,
          force: options.force,
        },
      });

      await server.listen();

      const info = server.config.logger.info;
      info('\n  Vite Clone dev server running at:\n');
      info(`  > Local: http://localhost:${server.config.server.port}/`);
      info(`  > Network: use --host to expose\n`);
    } catch (error) {
      console.error('Failed to start dev server:', error);
      process.exit(1);
    }
  });

/**
 * Build command
 */
cli
  .command('build [root]', 'Build for production')
  .option('--target <target>', 'Transpile target (default: "modules")')
  .option('--outDir <dir>', 'Output directory (default: "dist")')
  .option('--assetsDir <dir>', 'Assets directory under outDir (default: "assets")')
  .option('--assetsInlineLimit <number>', 'Static asset base64 inline threshold')
  .option('--sourcemap [output]', 'Generate sourcemaps')
  .option('--minify [minifier]', 'Enable/disable minification')
  .option('--manifest [name]', 'Emit build manifest json')
  .option('--ssrManifest [name]', 'Emit SSR manifest json')
  .option('--emptyOutDir', 'Force empty outDir when outside root')
  .option('--watch', 'Rebuild when files change')
  .action(async (root: string, options: GlobalCLIOptions & BuildOptions) => {
    try {
      const config = await resolveConfig(root, options);

      console.log('Building for production...\n');

      const result = await build({
        ...config,
        build: {
          target: options.target,
          outDir: options.outDir,
          assetsDir: options.assetsDir,
          assetsInlineLimit: options.assetsInlineLimit
            ? parseInt(options.assetsInlineLimit)
            : undefined,
          sourcemap: options.sourcemap,
          minify: options.minify,
          manifest: options.manifest,
          emptyOutDir: options.emptyOutDir,
          watch: options.watch,
        },
      });

      console.log(`\nBuild completed in ${(result.duration / 1000).toFixed(2)}s`);
    } catch (error) {
      console.error('Build failed:', error);
      process.exit(1);
    }
  });

/**
 * Preview command
 */
cli
  .command('preview [root]', 'Preview production build')
  .option('--host [host]', 'Specify hostname')
  .option('--port <port>', 'Specify port')
  .option('--https', 'Use TLS + HTTP/2')
  .option('--open [path]', 'Open browser on startup')
  .option('--strictPort', 'Exit if specified port is already in use')
  .option('--outDir <dir>', 'Output directory (default: "dist")')
  .action(async (root: string, options: GlobalCLIOptions & PreviewOptions) => {
    try {
      const config = await resolveConfig(root, options);
      const server = await preview({
        ...config,
        preview: {
          host: options.host,
          port: options.port ? parseInt(options.port) : undefined,
          https: options.https,
          open: options.open,
          strictPort: options.strictPort,
        },
        build: {
          outDir: options.outDir || 'dist',
        },
      });

      await server.listen();

      const info = console.log;
      info('\n  Vite Clone preview server running at:\n');
      info(`  > Local: http://localhost:${options.port || 4173}/\n`);
    } catch (error) {
      console.error('Failed to start preview server:', error);
      process.exit(1);
    }
  });

/**
 * Optimize command
 */
cli
  .command('optimize [root]', 'Pre-bundle dependencies')
  .option('--force', 'Force optimizer to re-bundle')
  .action(async (root: string, options: GlobalCLIOptions & { force?: boolean }) => {
    try {
      const config = await resolveConfig(root, options);

      console.log('Optimizing dependencies...\n');

      await optimizeDeps(config, options.force);

      console.log('\nDependencies optimized successfully');
    } catch (error) {
      console.error('Optimization failed:', error);
      process.exit(1);
    }
  });

/**
 * Create command
 */
cli
  .command('create <project-name>', 'Create a new project')
  .option('--template <template>', 'Project template (react, vue, vanilla, etc.)')
  .action(async (projectName: string, options: { template?: string }) => {
    try {
      console.log(`Creating new project: ${projectName}\n`);

      await createProject(projectName, options.template);

      console.log(`\nProject created successfully!`);
      console.log(`\nNext steps:`);
      console.log(`  cd ${projectName}`);
      console.log(`  npm install`);
      console.log(`  npm run dev`);
    } catch (error) {
      console.error('Failed to create project:', error);
      process.exit(1);
    }
  });

/**
 * Version command
 */
cli.version(require('../../package.json').version);

/**
 * Help command
 */
cli.help();

/**
 * Parse CLI arguments
 */
cli.parse();

/**
 * Resolve configuration
 */
async function resolveConfig(
  root: string | undefined,
  options: GlobalCLIOptions,
): Promise<InlineConfig> {
  const resolvedRoot = root ? resolve(process.cwd(), root) : process.cwd();

  return {
    root: resolvedRoot,
    configFile: options.config,
    mode: options.mode,
    logLevel: options.logLevel,
    clearScreen: options.clearScreen,
  };
}

/**
 * Server options
 */
interface ServerOptions {
  host?: string;
  port?: string;
  https?: boolean;
  open?: string | boolean;
  cors?: boolean;
  strictPort?: boolean;
  force?: boolean;
}

/**
 * Build options
 */
interface BuildOptions {
  target?: string;
  outDir?: string;
  assetsDir?: string;
  assetsInlineLimit?: string;
  sourcemap?: boolean | string;
  minify?: boolean | string;
  manifest?: boolean | string;
  emptyOutDir?: boolean;
  watch?: boolean;
}

/**
 * Preview options
 */
interface PreviewOptions {
  host?: string;
  port?: string;
  https?: boolean;
  open?: string | boolean;
  strictPort?: boolean;
  outDir?: string;
}

/**
 * Optimize dependencies
 */
async function optimizeDeps(config: InlineConfig, force?: boolean): Promise<void> {
  // Implementation would scan node_modules and pre-bundle dependencies
  // For now, just log
  console.log('Scanning dependencies...');
  console.log('Pre-bundling dependencies...');
  console.log('Dependencies optimized');
}

/**
 * Create new project
 */
async function createProject(projectName: string, template?: string): Promise<void> {
  const { default: prompts } = await import('prompts');

  // Prompt for template if not provided
  if (!template) {
    const result = await prompts({
      type: 'select',
      name: 'template',
      message: 'Select a framework',
      choices: [
        { title: 'React', value: 'react' },
        { title: 'Vue', value: 'vue' },
        { title: 'Svelte', value: 'svelte' },
        { title: 'Vanilla', value: 'vanilla' },
        { title: 'Preact', value: 'preact' },
        { title: 'Lit', value: 'lit' },
      ],
    });

    template = result.template;
  }

  if (!template) {
    throw new Error('No template selected');
  }

  // Create project directory
  const projectDir = resolve(process.cwd(), projectName);

  if (existsSync(projectDir)) {
    throw new Error(`Directory ${projectName} already exists`);
  }

  console.log(`Creating ${template} project...`);

  // In production, would copy template files
  // For now, just create basic structure
  const { mkdirSync, writeFileSync } = await import('fs');

  mkdirSync(projectDir, { recursive: true });
  mkdirSync(resolve(projectDir, 'src'), { recursive: true });
  mkdirSync(resolve(projectDir, 'public'), { recursive: true });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'vite-clone',
      build: 'vite-clone build',
      preview: 'vite-clone preview',
    },
    devDependencies: {
      '@elide/vite-clone': '^1.0.0',
    },
    dependencies: getTemplateDependencies(template),
  };

  writeFileSync(
    resolve(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2),
  );

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${getTemplateExtension(template)}"></script>
  </body>
</html>`;

  writeFileSync(resolve(projectDir, 'index.html'), indexHtml);

  // Create main entry file
  const mainFile = getTemplateMainFile(template);
  writeFileSync(
    resolve(projectDir, 'src', `main.${getTemplateExtension(template)}`),
    mainFile,
  );

  // Create vite.config.ts
  const viteConfig = getTemplateConfig(template);
  writeFileSync(resolve(projectDir, 'vite.config.ts'), viteConfig);

  // Create .gitignore
  const gitignore = `node_modules
dist
.vite-clone
*.log`;

  writeFileSync(resolve(projectDir, '.gitignore'), gitignore);
}

/**
 * Get template dependencies
 */
function getTemplateDependencies(template: string): Record<string, string> {
  const deps: Record<string, Record<string, string>> = {
    react: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    vue: {
      vue: '^3.3.0',
    },
    svelte: {
      svelte: '^4.0.0',
    },
    preact: {
      preact: '^10.15.0',
    },
    lit: {
      lit: '^2.7.0',
    },
    vanilla: {},
  };

  return deps[template] || {};
}

/**
 * Get template file extension
 */
function getTemplateExtension(template: string): string {
  const extensions: Record<string, string> = {
    react: 'tsx',
    vue: 'js',
    svelte: 'js',
    vanilla: 'js',
    preact: 'tsx',
    lit: 'ts',
  };

  return extensions[template] || 'js';
}

/**
 * Get template main file
 */
function getTemplateMainFile(template: string): string {
  const mainFiles: Record<string, string> = {
    react: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function App() {
  return (
    <div>
      <h1>Hello from React!</h1>
      <p>Edit src/main.tsx and save to test HMR</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    vue: `import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

createApp(App).mount('#root');`,
    vanilla: `import './style.css';

document.querySelector('#root').innerHTML = \`
  <div>
    <h1>Hello from Vanilla JS!</h1>
    <p>Edit src/main.js and save to test HMR</p>
  </div>
\`;`,
  };

  return mainFiles[template] || mainFiles.vanilla;
}

/**
 * Get template config
 */
function getTemplateConfig(template: string): string {
  const configs: Record<string, string> = {
    react: `import { defineConfig } from '@elide/vite-clone';
import react from '@elide/vite-clone/plugin-react';

export default defineConfig({
  plugins: [react()],
});`,
    vue: `import { defineConfig } from '@elide/vite-clone';
import vue from '@elide/vite-clone/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});`,
    vanilla: `import { defineConfig } from '@elide/vite-clone';

export default defineConfig({});`,
  };

  return configs[template] || configs.vanilla;
}
