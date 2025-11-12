/**
 * Ruby Buildpack
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IBuildpack, BuildContext } from '../builder.ts';
import { Logger } from '../../core/utils.ts';

const logger = new Logger('RubyBuildpack');

export class RubyBuildpack implements IBuildpack {
  name = 'Ruby';
  version = '1.0.0';
  priority = 80;

  async detect(context: BuildContext): Promise<boolean> {
    const gemfilePath = path.join(context.sourceDir, 'Gemfile');
    return fs.existsSync(gemfilePath);
  }

  async build(context: BuildContext): Promise<void> {
    logger.info('Building Ruby application...');

    // Determine Ruby version
    const rubyVersion = this.detectRubyVersion(context);
    logger.info(`Using Ruby ${rubyVersion}`);

    // Install bundler
    logger.info('Installing bundler...');
    await this.runCommand(context, 'gem install bundler');

    // Install dependencies
    logger.info('Installing dependencies...');
    await this.runCommand(context, 'bundle install --deployment --without development test');

    // Precompile assets if Rails
    if (this.isRails(context)) {
      logger.info('Precompiling Rails assets...');
      await this.runCommand(context, 'bundle exec rake assets:precompile');
    }

    logger.info('Ruby build completed');
  }

  async release(context: BuildContext): Promise<{
    defaultProcess?: string;
    processes?: Record<string, string>;
  }> {
    const processes: Record<string, string> = {};

    if (this.isRails(context)) {
      processes.web = 'bundle exec puma -C config/puma.rb';
      processes.worker = 'bundle exec sidekiq';
    } else if (this.isSinatra(context)) {
      processes.web = 'bundle exec rackup config.ru';
    } else if (fs.existsSync(path.join(context.sourceDir, 'config.ru'))) {
      processes.web = 'bundle exec rackup config.ru';
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

  private detectRubyVersion(context: BuildContext): string {
    const rubyVersionPath = path.join(context.sourceDir, '.ruby-version');

    if (fs.existsSync(rubyVersionPath)) {
      return fs.readFileSync(rubyVersionPath, 'utf8').trim();
    }

    return '3.2.0';
  }

  private isRails(context: BuildContext): boolean {
    return fs.existsSync(path.join(context.sourceDir, 'config', 'application.rb'));
  }

  private isSinatra(context: BuildContext): boolean {
    const gemfilePath = path.join(context.sourceDir, 'Gemfile');
    if (fs.existsSync(gemfilePath)) {
      const gemfile = fs.readFileSync(gemfilePath, 'utf8');
      return gemfile.includes('sinatra');
    }
    return false;
  }

  private async runCommand(context: BuildContext, command: string): Promise<void> {
    logger.info(`Running: ${command}`);
    // In real implementation, use child_process.exec
  }
}
