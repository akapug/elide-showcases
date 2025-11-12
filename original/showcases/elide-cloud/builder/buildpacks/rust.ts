/**
 * Rust Buildpack
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IBuildpack, BuildContext } from '../builder.ts';
import { Logger } from '../../core/utils.ts';

const logger = new Logger('RustBuildpack');

export class RustBuildpack implements IBuildpack {
  name = 'Rust';
  version = '1.0.0';
  priority = 65;

  async detect(context: BuildContext): Promise<boolean> {
    const cargoPath = path.join(context.sourceDir, 'Cargo.toml');
    return fs.existsSync(cargoPath);
  }

  async build(context: BuildContext): Promise<void> {
    logger.info('Building Rust application...');

    // Determine Rust version
    const rustVersion = this.detectRustVersion(context);
    logger.info(`Using Rust ${rustVersion}`);

    // Build release binary
    logger.info('Building release binary...');
    await this.runCommand(context, 'cargo build --release');

    // Copy binary to build directory
    const binaryName = this.getBinaryName(context);
    const sourcePath = path.join(context.sourceDir, 'target', 'release', binaryName);
    const destPath = path.join(context.buildDir, 'app');

    logger.info(`Copying binary: ${binaryName} -> app`);
    // fs.copyFileSync(sourcePath, destPath);

    logger.info('Rust build completed');
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

  private detectRustVersion(context: BuildContext): string {
    const toolchainPath = path.join(context.sourceDir, 'rust-toolchain');

    if (fs.existsSync(toolchainPath)) {
      return fs.readFileSync(toolchainPath, 'utf8').trim();
    }

    return 'stable';
  }

  private getBinaryName(context: BuildContext): string {
    const cargoPath = path.join(context.sourceDir, 'Cargo.toml');
    const cargo = fs.readFileSync(cargoPath, 'utf8');

    const match = cargo.match(/name\s*=\s*"([^"]+)"/);
    if (match) {
      return match[1];
    }

    return 'app';
  }

  private async runCommand(context: BuildContext, command: string): Promise<void> {
    logger.info(`Running: ${command}`);
    // In real implementation, use child_process.exec
  }
}
