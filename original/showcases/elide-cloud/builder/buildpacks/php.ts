/**
 * PHP Buildpack
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IBuildpack, BuildContext } from '../builder.ts';
import { Logger } from '../../core/utils.ts';

const logger = new Logger('PHPBuildpack');

export class PHPBuildpack implements IBuildpack {
  name = 'PHP';
  version = '1.0.0';
  priority = 60;

  async detect(context: BuildContext): Promise<boolean> {
    const composerPath = path.join(context.sourceDir, 'composer.json');
    const indexPath = path.join(context.sourceDir, 'index.php');

    return fs.existsSync(composerPath) || fs.existsSync(indexPath);
  }

  async build(context: BuildContext): Promise<void> {
    logger.info('Building PHP application...');

    // Determine PHP version
    const phpVersion = this.detectPhpVersion(context);
    logger.info(`Using PHP ${phpVersion}`);

    // Install composer dependencies
    const composerPath = path.join(context.sourceDir, 'composer.json');
    if (fs.existsSync(composerPath)) {
      logger.info('Installing Composer dependencies...');
      await this.runCommand(context, 'composer install --no-dev --optimize-autoloader');
    }

    // Setup web server configuration
    await this.setupWebServer(context);

    logger.info('PHP build completed');
  }

  async release(context: BuildContext): Promise<{
    defaultProcess?: string;
    processes?: Record<string, string>;
  }> {
    const processes: Record<string, string> = {};

    // Determine web server command
    if (this.isLaravel(context)) {
      processes.web = 'php artisan serve --host=0.0.0.0 --port=$PORT';
    } else if (this.isSymfony(context)) {
      processes.web = 'php -S 0.0.0.0:$PORT -t public';
    } else {
      processes.web = 'php -S 0.0.0.0:$PORT';
    }

    // Check for Procfile
    const procfilePath = path.join(context.sourceDir, 'Procfile');
    if (fs.existsSync(procfilePath)) {
      const procfile = fs.readFileSync(procfilePath, 'utf8');
      const lines = procfile.split('\n');

      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          processes[match[1]] = match[2];
        }
      }
    }

    return {
      defaultProcess: 'web',
      processes,
    };
  }

  private detectPhpVersion(context: BuildContext): string {
    const composerPath = path.join(context.sourceDir, 'composer.json');

    if (fs.existsSync(composerPath)) {
      const composer = JSON.parse(fs.readFileSync(composerPath, 'utf8'));
      const phpVersion = composer.require?.php;

      if (phpVersion) {
        const match = phpVersion.match(/[\d.]+/);
        if (match) {
          return match[0];
        }
      }
    }

    return '8.2';
  }

  private isLaravel(context: BuildContext): boolean {
    return fs.existsSync(path.join(context.sourceDir, 'artisan'));
  }

  private isSymfony(context: BuildContext): boolean {
    return fs.existsSync(path.join(context.sourceDir, 'symfony.lock'));
  }

  private async setupWebServer(context: BuildContext): Promise<void> {
    logger.info('Setting up web server configuration...');
    // Setup nginx or Apache configuration
  }

  private async runCommand(context: BuildContext, command: string): Promise<void> {
    logger.info(`Running: ${command}`);
    // In real implementation, use child_process.exec
  }
}
