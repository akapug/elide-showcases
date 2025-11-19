/**
 * Node.js Buildpack
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IBuildpack, BuildContext } from '../builder.ts';
import { Logger } from '../../core/utils.ts';

const logger = new Logger('NodeBuildpack');

export class NodeBuildpack implements IBuildpack {
  name = 'Node.js';
  version = '1.0.0';
  priority = 90;

  async detect(context: BuildContext): Promise<boolean> {
    const packageJsonPath = path.join(context.sourceDir, 'package.json');
    return fs.existsSync(packageJsonPath);
  }

  async build(context: BuildContext): Promise<void> {
    logger.info('Building Node.js application...');

    const packageJsonPath = path.join(context.sourceDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Determine Node.js version
    const nodeVersion = packageJson.engines?.node || process.version;
    logger.info(`Using Node.js ${nodeVersion}`);

    // Determine package manager
    const packageManager = this.detectPackageManager(context);
    logger.info(`Using package manager: ${packageManager}`);

    // Install dependencies
    await this.installDependencies(context, packageManager);

    // Run build script if exists
    if (packageJson.scripts?.build) {
      logger.info('Running build script...');
      await this.runCommand(context, `${packageManager} run build`);
    }

    // Prune dev dependencies
    if (packageManager === 'npm') {
      await this.runCommand(context, 'npm prune --production');
    } else if (packageManager === 'yarn') {
      await this.runCommand(context, 'yarn install --production --ignore-scripts --prefer-offline');
    }

    logger.info('Node.js build completed');
  }

  async release(context: BuildContext): Promise<{
    defaultProcess?: string;
    processes?: Record<string, string>;
  }> {
    const packageJsonPath = path.join(context.sourceDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const processes: Record<string, string> = {};

    // Web process
    if (packageJson.scripts?.start) {
      processes.web = 'npm start';
    } else if (fs.existsSync(path.join(context.sourceDir, 'index.js'))) {
      processes.web = 'node index.js';
    } else if (fs.existsSync(path.join(context.sourceDir, 'server.js'))) {
      processes.web = 'node server.js';
    } else if (fs.existsSync(path.join(context.sourceDir, 'app.js'))) {
      processes.web = 'node app.js';
    }

    // Worker process if specified
    if (packageJson.scripts?.worker) {
      processes.worker = 'npm run worker';
    }

    return {
      defaultProcess: 'web',
      processes,
    };
  }

  private detectPackageManager(context: BuildContext): string {
    if (fs.existsSync(path.join(context.sourceDir, 'yarn.lock'))) {
      return 'yarn';
    } else if (fs.existsSync(path.join(context.sourceDir, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    } else {
      return 'npm';
    }
  }

  private async installDependencies(context: BuildContext, packageManager: string): Promise<void> {
    logger.info('Installing dependencies...');

    const commands: Record<string, string> = {
      npm: 'npm ci --production=false',
      yarn: 'yarn install --frozen-lockfile',
      pnpm: 'pnpm install --frozen-lockfile',
    };

    await this.runCommand(context, commands[packageManager]);
  }

  private async runCommand(context: BuildContext, command: string): Promise<void> {
    // Simulate command execution
    logger.info(`Running: ${command}`);
    // In real implementation, use child_process.exec
  }
}
