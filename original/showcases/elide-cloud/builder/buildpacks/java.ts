/**
 * Java Buildpack
 */

import * as fs from 'fs';
import * as path from 'path';
import type { IBuildpack, BuildContext } from '../builder.ts';
import { Logger } from '../../core/utils.ts';

const logger = new Logger('JavaBuildpack');

export class JavaBuildpack implements IBuildpack {
  name = 'Java';
  version = '1.0.0';
  priority = 70;

  async detect(context: BuildContext): Promise<boolean> {
    const pomPath = path.join(context.sourceDir, 'pom.xml');
    const gradlePath = path.join(context.sourceDir, 'build.gradle');
    const gradleKtsPath = path.join(context.sourceDir, 'build.gradle.kts');

    return fs.existsSync(pomPath) ||
           fs.existsSync(gradlePath) ||
           fs.existsSync(gradleKtsPath);
  }

  async build(context: BuildContext): Promise<void> {
    logger.info('Building Java application...');

    // Determine Java version
    const javaVersion = this.detectJavaVersion(context);
    logger.info(`Using Java ${javaVersion}`);

    // Determine build tool
    const buildTool = this.detectBuildTool(context);
    logger.info(`Using build tool: ${buildTool}`);

    // Build application
    await this.buildApplication(context, buildTool);

    logger.info('Java build completed');
  }

  async release(context: BuildContext): Promise<{
    defaultProcess?: string;
    processes?: Record<string, string>;
  }> {
    const processes: Record<string, string> = {};

    // Find JAR file
    const jarPath = this.findJar(context);

    if (jarPath) {
      processes.web = `java -jar ${jarPath}`;
    } else {
      processes.web = 'java -jar target/*.jar';
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

  private detectJavaVersion(context: BuildContext): string {
    const systemPropsPath = path.join(context.sourceDir, 'system.properties');

    if (fs.existsSync(systemPropsPath)) {
      const props = fs.readFileSync(systemPropsPath, 'utf8');
      const match = props.match(/java\.runtime\.version=([\d.]+)/);
      if (match) {
        return match[1];
      }
    }

    return '17';
  }

  private detectBuildTool(context: BuildContext): 'maven' | 'gradle' {
    if (fs.existsSync(path.join(context.sourceDir, 'pom.xml'))) {
      return 'maven';
    }
    return 'gradle';
  }

  private async buildApplication(context: BuildContext, buildTool: string): Promise<void> {
    if (buildTool === 'maven') {
      logger.info('Building with Maven...');
      await this.runCommand(context, './mvnw clean package -DskipTests');
    } else {
      logger.info('Building with Gradle...');
      await this.runCommand(context, './gradlew clean build -x test');
    }
  }

  private findJar(context: BuildContext): string | null {
    const targetDir = path.join(context.buildDir, 'target');
    const buildDir = path.join(context.buildDir, 'build', 'libs');

    for (const dir of [targetDir, buildDir]) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const jarFile = files.find(f => f.endsWith('.jar') && !f.includes('sources'));
        if (jarFile) {
          return path.join(dir, jarFile);
        }
      }
    }

    return null;
  }

  private async runCommand(context: BuildContext, command: string): Promise<void> {
    logger.info(`Running: ${command}`);
    // In real implementation, use child_process.exec
  }
}
