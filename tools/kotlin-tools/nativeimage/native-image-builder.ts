/**
 * GraalVM Native Image Builder for Elide
 *
 * Comprehensive tooling for building native executables from Java/Kotlin code:
 * - Native image compilation
 * - Reflection configuration generation
 * - Resource configuration
 * - JNI configuration
 * - Profile-Guided Optimization (PGO)
 * - Static analysis and optimization
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Native image build configuration
 */
export interface NativeImageConfig {
  mainClass?: string;
  imageName?: string;
  classpath?: string[];
  outputDir?: string;
  staticBinary?: boolean;
  quickBuild?: boolean;
  optimizationLevel?: 'b' | 'O1' | 'O2' | 'O3';
  initializeAtBuildTime?: string[];
  initializeAtRunTime?: string[];
  reflectionConfig?: string;
  resourceConfig?: string;
  jniConfig?: string;
  proxyConfig?: string;
  serializationConfig?: string;
  pgoInstrument?: boolean;
  pgoProfile?: string;
  features?: string[];
  additionalArgs?: string[];
  verbose?: boolean;
  debug?: boolean;
  traceClassInitialization?: boolean;
  allowIncompleteClasspath?: boolean;
  reportUnsupportedElements?: boolean;
  noFallback?: boolean;
  sharedLibrary?: boolean;
  enableHttps?: boolean;
  enableAllSecurityServices?: boolean;
}

/**
 * Native image build result
 */
export interface NativeImageResult {
  success: boolean;
  imagePath?: string;
  output: string;
  errors?: string[];
  warnings?: string[];
  imageSize?: number;
  buildTime: number;
  peakMemory?: number;
}

/**
 * Reflection configuration entry
 */
export interface ReflectionEntry {
  name: string;
  allDeclaredConstructors?: boolean;
  allPublicConstructors?: boolean;
  allDeclaredMethods?: boolean;
  allPublicMethods?: boolean;
  allDeclaredFields?: boolean;
  allPublicFields?: boolean;
  methods?: Array<{ name: string; parameterTypes?: string[] }>;
  fields?: Array<{ name: string }>;
}

/**
 * Resource configuration entry
 */
export interface ResourceEntry {
  pattern?: string;
  glob?: string;
}

/**
 * JNI configuration entry
 */
export interface JNIEntry extends ReflectionEntry {
  // Same as reflection but for JNI access
}

/**
 * Native Image Builder
 */
export class NativeImageBuilder {
  private config: NativeImageConfig;
  private nativeImagePath: string;
  private workDir: string;

  constructor(config: Partial<NativeImageConfig> = {}) {
    this.config = {
      outputDir: './build',
      staticBinary: false,
      quickBuild: false,
      optimizationLevel: 'O2',
      verbose: false,
      debug: false,
      traceClassInitialization: false,
      allowIncompleteClasspath: true,
      reportUnsupportedElements: true,
      noFallback: true,
      sharedLibrary: false,
      enableHttps: true,
      enableAllSecurityServices: false,
      ...config
    };

    this.nativeImagePath = this.resolveNativeImagePath();
    this.workDir = '/tmp/native-image-builder';
  }

  /**
   * Resolve native-image tool path
   */
  private resolveNativeImagePath(): string {
    const graalHome = process.env.GRAALVM_HOME || process.env.JAVA_HOME;
    if (graalHome) {
      return join(graalHome, 'bin', 'native-image');
    }
    return 'native-image';
  }

  /**
   * Build native image
   */
  async build(): Promise<NativeImageResult> {
    const startTime = Date.now();

    try {
      await fs.mkdir(this.config.outputDir!, { recursive: true });

      const args = this.buildArgs();
      const command = `${this.nativeImagePath} ${args.join(' ')}`;

      if (this.config.verbose) {
        console.log(`Building native image: ${command}`);
      }

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 30 * 60 * 1000 // 30 minutes
      });

      const imagePath = this.getImagePath();
      const imageSize = await this.getFileSize(imagePath);
      const peakMemory = this.extractPeakMemory(stdout + stderr);

      return {
        success: true,
        imagePath,
        output: stdout + stderr,
        warnings: this.parseWarnings(stdout + stderr),
        imageSize,
        buildTime: Date.now() - startTime,
        peakMemory
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout + error.stderr,
        errors: this.parseErrors(error.stderr || error.message),
        warnings: this.parseWarnings(error.stdout || ''),
        buildTime: Date.now() - startTime
      };
    }
  }

  /**
   * Build with Profile-Guided Optimization
   */
  async buildWithPGO(
    workloadCommand: string,
    iterations: number = 5
  ): Promise<NativeImageResult> {
    // Step 1: Build instrumented image
    const instrumentedConfig = {
      ...this.config,
      pgoInstrument: true,
      imageName: (this.config.imageName || 'app') + '-instrumented'
    };

    const instrumentedBuilder = new NativeImageBuilder(instrumentedConfig);
    const instrumentedResult = await instrumentedBuilder.build();

    if (!instrumentedResult.success) {
      return instrumentedResult;
    }

    // Step 2: Run workload to generate profile
    const profilePath = join(this.workDir, 'default.iprof');

    for (let i = 0; i < iterations; i++) {
      if (this.config.verbose) {
        console.log(`Running PGO iteration ${i + 1}/${iterations}`);
      }

      await execAsync(`${instrumentedResult.imagePath} ${workloadCommand}`);
    }

    // Step 3: Build optimized image with profile
    const optimizedConfig = {
      ...this.config,
      pgoProfile: profilePath,
      pgoInstrument: false
    };

    const optimizedBuilder = new NativeImageBuilder(optimizedConfig);
    return optimizedBuilder.build();
  }

  /**
   * Generate reflection configuration from trace
   */
  async generateReflectionConfig(
    appCommand: string,
    outputPath: string
  ): Promise<void> {
    const agentConfig = `-agentlib:native-image-agent=config-output-dir=${outputPath}`;

    const command = `java ${agentConfig} -cp ${this.config.classpath?.join(':')} ${this.config.mainClass} ${appCommand}`;

    await execAsync(command);
  }

  /**
   * Add reflection configuration
   */
  async addReflectionConfig(
    entries: ReflectionEntry[],
    outputPath?: string
  ): Promise<void> {
    const config = {
      name: 'reflect-config.json',
      content: JSON.stringify(entries, null, 2)
    };

    const path = outputPath || join(this.workDir, config.name);
    await fs.writeFile(path, config.content);

    this.config.reflectionConfig = path;
  }

  /**
   * Add resource configuration
   */
  async addResourceConfig(
    entries: ResourceEntry[],
    outputPath?: string
  ): Promise<void> {
    const config = {
      resources: {
        includes: entries
      }
    };

    const path = outputPath || join(this.workDir, 'resource-config.json');
    await fs.writeFile(path, JSON.stringify(config, null, 2));

    this.config.resourceConfig = path;
  }

  /**
   * Add JNI configuration
   */
  async addJNIConfig(
    entries: JNIEntry[],
    outputPath?: string
  ): Promise<void> {
    const config = JSON.stringify(entries, null, 2);
    const path = outputPath || join(this.workDir, 'jni-config.json');
    await fs.writeFile(path, config);

    this.config.jniConfig = path;
  }

  /**
   * Analyze native image build
   */
  async analyzeBuild(imagePath: string): Promise<{
    size: number;
    sections: Array<{ name: string; size: number }>;
    symbols: number;
    dependencies: string[];
  }> {
    const size = await this.getFileSize(imagePath);

    // Get sections
    const { stdout: sectionsOutput } = await execAsync(`size ${imagePath}`);
    const sections = this.parseSections(sectionsOutput);

    // Get symbols
    const { stdout: symbolsOutput } = await execAsync(`nm ${imagePath} | wc -l`);
    const symbols = parseInt(symbolsOutput.trim());

    // Get dependencies
    const { stdout: depsOutput } = await execAsync(`ldd ${imagePath} || true`);
    const dependencies = this.parseDependencies(depsOutput);

    return {
      size,
      sections,
      symbols,
      dependencies
    };
  }

  /**
   * Build arguments for native-image
   */
  private buildArgs(): string[] {
    const args: string[] = [];

    // Main class
    if (this.config.mainClass) {
      args.push(this.config.mainClass);
    }

    // Classpath
    if (this.config.classpath && this.config.classpath.length > 0) {
      args.push('-cp', this.config.classpath.join(':'));
    }

    // Image name
    if (this.config.imageName) {
      args.push('-o', join(this.config.outputDir!, this.config.imageName));
    }

    // Static binary
    if (this.config.staticBinary) {
      args.push('--static');
    }

    // Quick build
    if (this.config.quickBuild) {
      args.push('-Ob');
    } else {
      args.push(`-O${this.config.optimizationLevel}`);
    }

    // Initialize at build time
    if (this.config.initializeAtBuildTime) {
      args.push(
        '--initialize-at-build-time=' + this.config.initializeAtBuildTime.join(',')
      );
    }

    // Initialize at run time
    if (this.config.initializeAtRunTime) {
      args.push(
        '--initialize-at-run-time=' + this.config.initializeAtRunTime.join(',')
      );
    }

    // Configuration files
    if (this.config.reflectionConfig) {
      args.push('-H:ReflectionConfigurationFiles=' + this.config.reflectionConfig);
    }
    if (this.config.resourceConfig) {
      args.push('-H:ResourceConfigurationFiles=' + this.config.resourceConfig);
    }
    if (this.config.jniConfig) {
      args.push('-H:JNIConfigurationFiles=' + this.config.jniConfig);
    }
    if (this.config.proxyConfig) {
      args.push('-H:DynamicProxyConfigurationFiles=' + this.config.proxyConfig);
    }
    if (this.config.serializationConfig) {
      args.push('-H:SerializationConfigurationFiles=' + this.config.serializationConfig);
    }

    // PGO
    if (this.config.pgoInstrument) {
      args.push('--pgo-instrument');
    }
    if (this.config.pgoProfile) {
      args.push('--pgo=' + this.config.pgoProfile);
    }

    // Features
    if (this.config.features) {
      this.config.features.forEach(feature => {
        args.push('--features=' + feature);
      });
    }

    // Debugging
    if (this.config.debug) {
      args.push('-g');
    }

    // Trace class initialization
    if (this.config.traceClassInitialization) {
      args.push('-H:+TraceClassInitialization');
    }

    // Allow incomplete classpath
    if (this.config.allowIncompleteClasspath) {
      args.push('--allow-incomplete-classpath');
    }

    // Report unsupported elements
    if (this.config.reportUnsupportedElements) {
      args.push('-H:+ReportUnsupportedElementsAtRuntime');
    }

    // No fallback
    if (this.config.noFallback) {
      args.push('--no-fallback');
    }

    // Shared library
    if (this.config.sharedLibrary) {
      args.push('--shared');
    }

    // HTTPS
    if (this.config.enableHttps) {
      args.push('--enable-https');
    }

    // Security services
    if (this.config.enableAllSecurityServices) {
      args.push('--enable-all-security-services');
    }

    // Verbose
    if (this.config.verbose) {
      args.push('--verbose');
    }

    // Additional args
    if (this.config.additionalArgs) {
      args.push(...this.config.additionalArgs);
    }

    return args;
  }

  /**
   * Get image path
   */
  private getImagePath(): string {
    return join(
      this.config.outputDir!,
      this.config.imageName || 'app'
    );
  }

  /**
   * Get file size
   */
  private async getFileSize(path: string): Promise<number> {
    try {
      const stats = await fs.stat(path);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Extract peak memory from output
   */
  private extractPeakMemory(output: string): number | undefined {
    const match = output.match(/Peak RSS: ([\d.]+)([KMG]B)/);
    if (!match) return undefined;

    const value = parseFloat(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'KB': return value * 1024;
      case 'MB': return value * 1024 * 1024;
      case 'GB': return value * 1024 * 1024 * 1024;
      default: return value;
    }
  }

  /**
   * Parse errors from output
   */
  private parseErrors(output: string): string[] {
    const errors: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('Error:') || line.includes('error:')) {
        errors.push(line.trim());
      }
    }

    return errors;
  }

  /**
   * Parse warnings from output
   */
  private parseWarnings(output: string): string[] {
    const warnings: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('Warning:') || line.includes('warning:')) {
        warnings.push(line.trim());
      }
    }

    return warnings;
  }

  /**
   * Parse sections from size output
   */
  private parseSections(output: string): Array<{ name: string; size: number }> {
    // Parse output from `size` command
    const sections: Array<{ name: string; size: number }> = [];
    const lines = output.split('\n');

    if (lines.length >= 2) {
      const headers = lines[0].trim().split(/\s+/);
      const values = lines[1].trim().split(/\s+/);

      for (let i = 0; i < headers.length - 1; i++) {
        sections.push({
          name: headers[i],
          size: parseInt(values[i])
        });
      }
    }

    return sections;
  }

  /**
   * Parse dependencies from ldd output
   */
  private parseDependencies(output: string): string[] {
    const deps: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const match = line.match(/^\s*(.+?)\s+=>/);
      if (match) {
        deps.push(match[1].trim());
      }
    }

    return deps;
  }
}

/**
 * Convenience function to build native image
 */
export async function buildNativeImage(
  mainClass: string,
  classpath: string[],
  config?: Partial<NativeImageConfig>
): Promise<NativeImageResult> {
  const builder = new NativeImageBuilder({
    mainClass,
    classpath,
    ...config
  });

  return builder.build();
}

export default NativeImageBuilder;
