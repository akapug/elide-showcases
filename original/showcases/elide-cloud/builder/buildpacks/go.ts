/**
 * Go Buildpack
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IBuildpack, BuildContext } from '../builder.ts';
import { Logger } from '../../core/utils.ts';

const logger = new Logger('GoBuildpack');

export class GoBuildpack implements IBuildpack {
  name = 'Go';
  version = '1.0.0';
  priority = 75;

  async detect(context: BuildContext): Promise<boolean> {
    const goModPath = path.join(context.sourceDir, 'go.mod');
    return fs.existsSync(goModPath);
  }

  async build(context: BuildContext): Promise<void> {
    logger.info('Building Go application...');

    // Determine Go version
    const goVersion = this.detectGoVersion(context);
    logger.info(`Using Go ${goVersion}`);

    // Download dependencies
    logger.info('Downloading dependencies...');
    await this.runCommand(context, 'go mod download');

    // Build binary
    logger.info('Building binary...');
    const outputPath = path.join(context.buildDir, 'app');
    await this.runCommand(
      context,
      `go build -o ${outputPath} -ldflags="-s -w" .`
    );

    logger.info('Go build completed');
  }

  async release(context: BuildContext): Promise<{
    defaultProcess?: string;
    processes?: Record<string, string>;
  }> {
    return {
      defaultProcess: 'web',
      processes: {
        web: './app',
      },
    };
  }

  private detectGoVersion(context: BuildContext): string {
    const goModPath = path.join(context.sourceDir, 'go.mod');

    if (fs.existsSync(goModPath)) {
      const goMod = fs.readFileSync(goModPath, 'utf8');
      const match = goMod.match(/^go\s+([\d.]+)/m);
      if (match) {
        return match[1];
      }
    }

    return '1.21';
  }

  private async runCommand(context: BuildContext, command: string): Promise<void> {
    logger.info(`Running: ${command}`);
    // In real implementation, use child_process.exec
  }
}
