#!/usr/bin/env node
/**
 * Elide Next CLI
 *
 * Commands:
 * - dev: Start development server
 * - build: Build for production
 * - start: Start production server
 * - create: Create new project
 * - export: Export static site
 */

import { parseArgs } from 'util';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

interface CLICommand {
  name: string;
  description: string;
  options?: Record<string, { type: 'string' | 'boolean'; description: string }>;
  action: (args: any) => Promise<void>;
}

class ElideNextCLI {
  private commands = new Map<string, CLICommand>();

  constructor() {
    this.registerCommands();
  }

  private registerCommands(): void {
    // dev command
    this.commands.set('dev', {
      name: 'dev',
      description: 'Start development server with HMR',
      options: {
        port: { type: 'string', description: 'Port to listen on' },
        hostname: { type: 'string', description: 'Hostname to listen on' },
        turbo: { type: 'boolean', description: 'Enable Turbopack (experimental)' },
      },
      action: this.dev.bind(this),
    });

    // build command
    this.commands.set('build', {
      name: 'build',
      description: 'Build application for production',
      options: {
        profile: { type: 'boolean', description: 'Enable build profiling' },
        debug: { type: 'boolean', description: 'Enable debug mode' },
      },
      action: this.build.bind(this),
    });

    // start command
    this.commands.set('start', {
      name: 'start',
      description: 'Start production server',
      options: {
        port: { type: 'string', description: 'Port to listen on' },
        hostname: { type: 'string', description: 'Hostname to listen on' },
      },
      action: this.start.bind(this),
    });

    // create command
    this.commands.set('create', {
      name: 'create',
      description: 'Create new Next.js application',
      options: {
        typescript: { type: 'boolean', description: 'Use TypeScript' },
        tailwind: { type: 'boolean', description: 'Use Tailwind CSS' },
        'app-dir': { type: 'boolean', description: 'Use app directory' },
        'src-dir': { type: 'boolean', description: 'Use src directory' },
      },
      action: this.create.bind(this),
    });

    // export command
    this.commands.set('export', {
      name: 'export',
      description: 'Export static site',
      options: {
        outdir: { type: 'string', description: 'Output directory' },
      },
      action: this.export.bind(this),
    });

    // info command
    this.commands.set('info', {
      name: 'info',
      description: 'Display system information',
      action: this.info.bind(this),
    });
  }

  /**
   * Development server
   */
  private async dev(args: any): Promise<void> {
    const port = parseInt(args.port || '3000');
    const hostname = args.hostname || 'localhost';

    console.log('🚀 Starting Elide Next development server...\n');

    const { DevServer } = await import('../server/dev');
    const server = new DevServer({
      port,
      hostname,
      hmr: true,
    });

    await server.start();

    console.log(`✨ Ready on http://${hostname}:${port}`);
    console.log(`⚡ Powered by Elide + GraalVM\n`);
  }

  /**
   * Production build
   */
  private async build(args: any): Promise<void> {
    console.log('🔨 Building application for production...\n');

    const start = performance.now();

    const { Builder } = await import('../compiler/bundle');
    const builder = new Builder({
      mode: 'production',
      profile: args.profile,
      debug: args.debug,
    });

    await builder.build();

    const elapsed = performance.now() - start;
    console.log(`\n✅ Build completed in ${(elapsed / 1000).toFixed(2)}s`);
  }

  /**
   * Production server
   */
  private async start(args: any): Promise<void> {
    const port = parseInt(args.port || '3000');
    const hostname = args.hostname || '0.0.0.0';

    console.log('🚀 Starting Elide Next production server...\n');

    const { ProductionServer } = await import('../server/prod');
    const server = new ProductionServer({
      port,
      hostname,
    });

    await server.start();

    console.log(`✨ Server running on http://${hostname}:${port}`);
  }

  /**
   * Create new project
   */
  private async create(args: any): Promise<void> {
    const projectName = args._[1];

    if (!projectName) {
      console.error('❌ Error: Project name is required');
      console.log('Usage: elide-next create <project-name>');
      process.exit(1);
    }

    console.log(`📦 Creating new Elide Next application: ${projectName}\n`);

    const useTypeScript = args.typescript !== false;
    const useTailwind = args.tailwind === true;
    const useAppDir = args['app-dir'] === true;
    const useSrcDir = args['src-dir'] === true;

    await this.scaffoldProject(projectName, {
      useTypeScript,
      useTailwind,
      useAppDir,
      useSrcDir,
    });

    console.log(`\n✅ Created ${projectName}`);
    console.log('\nNext steps:');
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  npm run dev\n');
  }

  /**
   * Export static site
   */
  private async export(args: any): Promise<void> {
    const outdir = args.outdir || 'out';

    console.log('📤 Exporting static site...\n');

    const { Exporter } = await import('../compiler/export');
    const exporter = new Exporter({ outdir });

    await exporter.export();

    console.log(`\n✅ Exported to ${outdir}/`);
  }

  /**
   * Display system info
   */
  private async info(args: any): Promise<void> {
    const os = await import('os');
    const elideVersion = '1.0.0'; // Load from package.json in real implementation

    console.log('System Information:');
    console.log(`  Platform: ${process.platform}`);
    console.log(`  Architecture: ${process.arch}`);
    console.log(`  CPU Cores: ${os.cpus().length}`);
    console.log(`  Memory: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`  Node.js: ${process.version}`);
    console.log(`  Elide Next: ${elideVersion}`);
    console.log(`  GraalVM: ${process.env.GRAALVM_VERSION || 'Not detected'}`);
  }

  /**
   * Scaffold new project
   */
  private async scaffoldProject(
    name: string,
    options: {
      useTypeScript: boolean;
      useTailwind: boolean;
      useAppDir: boolean;
      useSrcDir: boolean;
    }
  ): Promise<void> {
    const ext = options.useTypeScript ? 'tsx' : 'jsx';
    const baseDir = options.useSrcDir ? join(name, 'src') : name;
    const pagesDir = options.useAppDir ? 'app' : 'pages';

    // Create directory structure
    await mkdir(join(baseDir, pagesDir), { recursive: true });
    await mkdir(join(name, 'public'), { recursive: true });

    // Create package.json
    const packageJson = {
      name,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'elide-next dev',
        build: 'elide-next build',
        start: 'elide-next start',
        export: 'elide-next export',
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        'elide-next': '^1.0.0',
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        ...(options.useTypeScript ? { 'typescript': '^5.0.0' } : {}),
        ...(options.useTailwind ? { 'tailwindcss': '^3.3.0' } : {}),
      },
    };

    await writeFile(
      join(name, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create main page
    const indexPage = options.useAppDir
      ? this.createAppIndexPage(options.useTypeScript)
      : this.createPagesIndexPage(options.useTypeScript);

    const indexPath = join(
      baseDir,
      pagesDir,
      options.useAppDir ? 'page' : 'index',
      `.${ext}`
    );

    await writeFile(indexPath, indexPage);

    // Create config files
    if (options.useTypeScript) {
      await writeFile(
        join(name, 'tsconfig.json'),
        JSON.stringify(this.createTsConfig(), null, 2)
      );
    }

    if (options.useTailwind) {
      await writeFile(
        join(name, 'tailwind.config.js'),
        this.createTailwindConfig()
      );
    }

    // Create next.config
    const configExt = options.useTypeScript ? 'ts' : 'js';
    await writeFile(
      join(name, `next.config.${configExt}`),
      this.createNextConfig(options.useTypeScript)
    );

    // Create .gitignore
    await writeFile(
      join(name, '.gitignore'),
      this.createGitignore()
    );

    // Create README
    await writeFile(
      join(name, 'README.md'),
      this.createReadme(name)
    );
  }

  private createAppIndexPage(typescript: boolean): string {
    return `${typescript ? "export default async function Page() {" : "export default async function Page() {"}
  return (
    <div>
      <h1>Welcome to Elide Next!</h1>
      <p>Edit app/page.${typescript ? 'tsx' : 'jsx'} to get started.</p>
    </div>
  );
}
`;
  }

  private createPagesIndexPage(typescript: boolean): string {
    return `${typescript ? "import type { NextPage } from 'elide-next';\n\n" : ""}export default function Home()${typescript ? ': NextPage' : ''} {
  return (
    <div>
      <h1>Welcome to Elide Next!</h1>
      <p>Edit pages/index.${typescript ? 'tsx' : 'jsx'} to get started.</p>
    </div>
  );
}
`;
  }

  private createTsConfig() {
    return {
      compilerOptions: {
        target: 'ES2020',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: {
          '@/*': ['./src/*'],
        },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    };
  }

  private createTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
  }

  private createNextConfig(typescript: boolean): string {
    const config = `${typescript ? 'import type { NextConfig } from "elide-next";\n\n' : ''}const config${typescript ? ': NextConfig' : ''} = {
  reactStrictMode: true,
  swcMinify: true,
};

${typescript ? 'export default config;' : 'module.exports = config;'}
`;
    return config;
  }

  private createGitignore(): string {
    return `.next/
node_modules/
dist/
out/
.env*.local
.DS_Store
*.log
`;
  }

  private createReadme(name: string): string {
    return `# ${name}

This is a [Elide Next](https://docs.elide.dev/next-clone) project.

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

- [Elide Documentation](https://docs.elide.dev)
- [Elide Next Documentation](https://docs.elide.dev/next-clone)
- [Next.js Documentation](https://nextjs.org/docs)

## Deploy

Deploy your application using Elide's deployment tools:

\`\`\`bash
elide-next deploy
\`\`\`
`;
  }

  /**
   * Run CLI
   */
  async run(argv: string[]): Promise<void> {
    const commandName = argv[2];

    if (!commandName || commandName === '--help' || commandName === '-h') {
      this.printHelp();
      return;
    }

    const command = this.commands.get(commandName);

    if (!command) {
      console.error(`❌ Unknown command: ${commandName}`);
      this.printHelp();
      process.exit(1);
    }

    try {
      // Parse arguments
      const options: any = {
        options: {},
        positionals: [],
      };

      if (command.options) {
        for (const [key, spec] of Object.entries(command.options)) {
          options.options[key] = { type: spec.type };
        }
      }

      const args = parseArgs({
        args: argv.slice(3),
        ...options,
        allowPositionals: true,
      });

      await command.action({
        ...args.values,
        _: [commandName, ...args.positionals],
      });
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  private printHelp(): void {
    console.log('Elide Next CLI\n');
    console.log('Usage: elide-next <command> [options]\n');
    console.log('Commands:\n');

    for (const cmd of this.commands.values()) {
      console.log(`  ${cmd.name.padEnd(12)} ${cmd.description}`);
    }

    console.log('\nOptions:\n');
    console.log('  --help, -h   Show this help message\n');
    console.log('For command-specific help: elide-next <command> --help');
  }
}

// Run CLI
const cli = new ElideNextCLI();
cli.run(process.argv).catch((error) => {
  console.error(error);
  process.exit(1);
});
