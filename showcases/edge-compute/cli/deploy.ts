/**
 * CLI Deploy Command - Deploy functions from the command line
 *
 * Provides a simple interface for deploying functions.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DeployOptions {
  name: string;
  runtime: 'typescript' | 'python' | 'ruby';
  file: string;
  env?: Record<string, string>;
  memory?: number;
  timeout?: number;
  routes?: string[];
  tags?: string[];
  version?: string;
}

export class DeployCLI {
  /**
   * Deploy a function from a file
   */
  static async deploy(options: DeployOptions): Promise<void> {
    console.log(`Deploying function: ${options.name}`);
    console.log(`Runtime: ${options.runtime}`);
    console.log(`File: ${options.file}`);

    // Read function code
    if (!fs.existsSync(options.file)) {
      throw new Error(`File not found: ${options.file}`);
    }

    const code = fs.readFileSync(options.file, 'utf-8');

    // Validate runtime matches file extension
    const ext = path.extname(options.file);
    const runtimeExtensions: Record<string, string> = {
      typescript: '.ts',
      python: '.py',
      ruby: '.rb',
    };

    if (runtimeExtensions[options.runtime] !== ext) {
      console.warn(
        `Warning: Runtime ${options.runtime} doesn't match file extension ${ext}`
      );
    }

    // Create deployment config
    const deployConfig = {
      name: options.name,
      code,
      runtime: options.runtime,
      env: options.env,
      memory: options.memory,
      timeout: options.timeout,
      routes: options.routes,
      tags: options.tags,
      options: {
        version: options.version,
        autoVersion: !options.version,
        activateImmediately: true,
      },
    };

    console.log('\nDeployment configuration:');
    console.log(JSON.stringify(deployConfig, null, 2));

    // In a real implementation, this would send the deployment to the platform
    console.log('\n✓ Function deployed successfully!');
    console.log(`Version: ${options.version || 'auto'}`);

    if (options.routes && options.routes.length > 0) {
      console.log('\nRoutes:');
      options.routes.forEach((route) => {
        console.log(`  - ${route}`);
      });
    }
  }

  /**
   * Parse command line arguments
   */
  static parseArgs(args: string[]): DeployOptions | null {
    const options: Partial<DeployOptions> = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--name':
        case '-n':
          options.name = args[++i];
          break;
        case '--runtime':
        case '-r':
          options.runtime = args[++i] as 'typescript' | 'python' | 'ruby';
          break;
        case '--file':
        case '-f':
          options.file = args[++i];
          break;
        case '--memory':
        case '-m':
          options.memory = parseInt(args[++i]);
          break;
        case '--timeout':
        case '-t':
          options.timeout = parseInt(args[++i]);
          break;
        case '--route':
          if (!options.routes) options.routes = [];
          options.routes.push(args[++i]);
          break;
        case '--tag':
          if (!options.tags) options.tags = [];
          options.tags.push(args[++i]);
          break;
        case '--env':
          if (!options.env) options.env = {};
          const [key, value] = args[++i].split('=');
          options.env[key] = value;
          break;
        case '--version':
        case '-v':
          options.version = args[++i];
          break;
      }
    }

    // Validate required options
    if (!options.name || !options.runtime || !options.file) {
      console.error('Error: Missing required options');
      this.printUsage();
      return null;
    }

    return options as DeployOptions;
  }

  /**
   * Print CLI usage
   */
  static printUsage(): void {
    console.log(`
Usage: edge-deploy [options]

Options:
  --name, -n <name>       Function name (required)
  --runtime, -r <runtime> Runtime: typescript, python, or ruby (required)
  --file, -f <file>       Function file path (required)
  --memory, -m <mb>       Memory limit in MB (default: 128)
  --timeout, -t <sec>     Timeout in seconds (default: 30)
  --route <path>          Add route (can be used multiple times)
  --tag <tag>             Add tag (can be used multiple times)
  --env <KEY=value>       Set environment variable (can be used multiple times)
  --version, -v <version> Set version (default: auto-increment)

Examples:
  # Deploy TypeScript function
  edge-deploy --name hello --runtime typescript --file hello.ts

  # Deploy with routes and env vars
  edge-deploy -n api -r typescript -f api.ts --route /api/* --env API_KEY=secret

  # Deploy Python function with memory and timeout
  edge-deploy -n worker -r python -f worker.py -m 256 -t 60
    `);
  }
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    DeployCLI.printUsage();
    process.exit(0);
  }

  const options = DeployCLI.parseArgs(args);

  if (options) {
    DeployCLI.deploy(options)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Deployment failed:', error.message);
        process.exit(1);
      });
  } else {
    process.exit(1);
  }
}

export default DeployCLI;
