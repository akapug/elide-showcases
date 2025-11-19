#!/usr/bin/env node
/**
 * Elide Build CLI
 *
 * Command-line interface for Elide build tools:
 * - elide build - Production build
 * - elide dev - Development server
 * - elide preview - Preview production build
 * - elide analyze - Bundle analysis
 */

import * as process from "process";
import { Bundler } from "../bundler/index";
import { ProductionBuilder } from "../production/index";
import { DevServer } from "../dev-server/index";
import { ConfigLoader } from "../config/index";

interface CLIOptions {
  config?: string;
  watch?: boolean;
  minify?: boolean;
  sourcemap?: boolean;
  port?: number;
  open?: boolean;
}

class CLI {
  private configLoader: ConfigLoader;

  constructor() {
    this.configLoader = new ConfigLoader();
  }

  /**
   * Run CLI
   */
  async run(args: string[]): Promise<void> {
    const command = args[0];
    const options = this.parseArgs(args.slice(1));

    try {
      switch (command) {
        case "build":
          await this.build(options);
          break;

        case "dev":
          await this.dev(options);
          break;

        case "preview":
          await this.preview(options);
          break;

        case "analyze":
          await this.analyze(options);
          break;

        case "init":
          await this.init(options);
          break;

        case "help":
        case "--help":
        case "-h":
          this.showHelp();
          break;

        case "version":
        case "--version":
        case "-v":
          this.showVersion();
          break;

        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error: any) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  }

  /**
   * Build command
   */
  private async build(options: CLIOptions): Promise<void> {
    console.log("🏗️  Building for production...\n");

    const config = await this.configLoader.load(options.config);

    const builder = new ProductionBuilder({
      ...config.production,
      minify: options.minify ?? config.production?.minify,
      sourcemap: options.sourcemap ?? config.production?.sourcemap,
    });

    const result = await builder.build();

    if (result.errors > 0) {
      console.error(`\n❌ Build failed with ${result.errors} error(s)`);
      process.exit(1);
    }

    console.log("✅ Build completed successfully!");
  }

  /**
   * Dev command
   */
  private async dev(options: CLIOptions): Promise<void> {
    console.log("🚀 Starting development server...\n");

    const config = await this.configLoader.load(options.config);

    const server = new DevServer({
      ...config.dev,
      port: options.port ?? config.dev?.port,
      open: options.open ?? config.dev?.open,
    });

    await server.start();

    // Keep process running
    process.on("SIGINT", async () => {
      console.log("\n\n🛑 Shutting down...");
      await server.stop();
      process.exit(0);
    });
  }

  /**
   * Preview command
   */
  private async preview(options: CLIOptions): Promise<void> {
    console.log("👀 Starting preview server...\n");

    const config = await this.configLoader.load(options.config);

    const server = new DevServer({
      ...config.dev,
      port: options.port ?? 4173,
      hmr: false,
      static: config.production?.outDir || "dist",
    });

    await server.start();

    process.on("SIGINT", async () => {
      await server.stop();
      process.exit(0);
    });
  }

  /**
   * Analyze command
   */
  private async analyze(options: CLIOptions): Promise<void> {
    console.log("📊 Analyzing bundle...\n");

    const config = await this.configLoader.load(options.config);

    const builder = new ProductionBuilder({
      ...config.production,
      analyze: true,
      report: true,
    });

    await builder.build();

    console.log("\n✅ Analysis complete! Check build-report.html");
  }

  /**
   * Init command
   */
  private async init(options: CLIOptions): Promise<void> {
    const { default: inquirer } = await import("inquirer");

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "preset",
        message: "Select a preset:",
        choices: ["react", "vue", "node", "library", "custom"],
      },
    ]);

    const preset = answers.preset === "custom" ? undefined : answers.preset;
    const configContent = this.configLoader.createExampleConfig(preset);

    require("fs").writeFileSync("elide.config.ts", configContent);

    console.log("✅ Created elide.config.ts");
  }

  /**
   * Parse command-line arguments
   */
  private parseArgs(args: string[]): CLIOptions {
    const options: CLIOptions = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case "--config":
        case "-c":
          options.config = args[++i];
          break;

        case "--watch":
        case "-w":
          options.watch = true;
          break;

        case "--minify":
          options.minify = true;
          break;

        case "--no-minify":
          options.minify = false;
          break;

        case "--sourcemap":
          options.sourcemap = true;
          break;

        case "--no-sourcemap":
          options.sourcemap = false;
          break;

        case "--port":
        case "-p":
          options.port = parseInt(args[++i]);
          break;

        case "--open":
        case "-o":
          options.open = true;
          break;
      }
    }

    return options;
  }

  /**
   * Show help
   */
  private showHelp(): void {
    console.log(`
Elide Build - Lightning-fast build tool for Elide

Usage:
  elide <command> [options]

Commands:
  build      Build for production
  dev        Start development server
  preview    Preview production build
  analyze    Analyze bundle size
  init       Initialize new project
  help       Show this help message
  version    Show version

Options:
  -c, --config <file>   Config file path
  -w, --watch           Watch mode
  --minify              Minify output
  --no-minify           Don't minify output
  --sourcemap           Generate source maps
  --no-sourcemap        Don't generate source maps
  -p, --port <port>     Dev server port
  -o, --open            Open browser

Examples:
  elide build
  elide dev --port 3000
  elide build --minify --sourcemap
  elide analyze
  elide init

Documentation: https://elide.dev/build
    `.trim());
  }

  /**
   * Show version
   */
  private showVersion(): void {
    const version = "1.0.0";
    console.log(`Elide Build v${version}`);
  }
}

// Run CLI
if (require.main === module) {
  const cli = new CLI();
  cli.run(process.argv.slice(2));
}

export { CLI };
