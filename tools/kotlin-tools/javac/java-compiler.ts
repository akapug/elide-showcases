/**
 * Java Compiler (javac) Bridge for Elide
 *
 * Enables Java compilation and execution within Elide runtime:
 * - Compile Java source to bytecode
 * - Use Java libraries from TypeScript/Kotlin
 * - Annotation processing support
 * - Maven/Gradle dependency resolution
 * - Dynamic class loading
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Java compiler configuration
 */
export interface JavaCompilerConfig {
  javaVersion?: string;
  classpath?: string[];
  sourcePath?: string[];
  outputDir?: string;
  encoding?: string;
  debug?: boolean;
  deprecation?: boolean;
  warnings?: boolean;
  warningsAsErrors?: boolean;
  annotationProcessors?: string[];
  processorPath?: string[];
  enablePreview?: boolean;
  parameters?: boolean;
  verbose?: boolean;
  xlint?: string[];
}

/**
 * Java compilation result
 */
export interface JavaCompilationResult {
  success: boolean;
  output: string;
  errors?: string[];
  warnings?: string[];
  outputFiles: string[];
  classFiles: string[];
  executionTime: number;
}

/**
 * Java class metadata
 */
export interface JavaClassMetadata {
  className: string;
  packageName: string;
  methods: JavaMethodMetadata[];
  fields: JavaFieldMetadata[];
  annotations: string[];
  superClass?: string;
  interfaces: string[];
}

/**
 * Java method metadata
 */
export interface JavaMethodMetadata {
  name: string;
  returnType: string;
  parameters: Array<{ name: string; type: string }>;
  modifiers: string[];
  annotations: string[];
}

/**
 * Java field metadata
 */
export interface JavaFieldMetadata {
  name: string;
  type: string;
  modifiers: string[];
  annotations: string[];
}

/**
 * Java Compiler Bridge
 */
export class JavaCompiler {
  private config: JavaCompilerConfig;
  private javacPath: string;
  private tempDir: string;

  constructor(config: Partial<JavaCompilerConfig> = {}) {
    this.config = {
      javaVersion: '17',
      encoding: 'UTF-8',
      debug: true,
      deprecation: true,
      warnings: true,
      warningsAsErrors: false,
      parameters: true,
      verbose: false,
      ...config
    };

    this.javacPath = this.resolveJavacPath();
    this.tempDir = '/tmp/java-compiler';
  }

  /**
   * Resolve javac compiler path
   */
  private resolveJavacPath(): string {
    const javaHome = process.env.JAVA_HOME;
    if (javaHome) {
      return join(javaHome, 'bin', 'javac');
    }
    return 'javac'; // Assume in PATH
  }

  /**
   * Compile Java source files
   */
  async compile(
    sourceFiles: string[],
    outputPath?: string
  ): Promise<JavaCompilationResult> {
    const startTime = Date.now();
    const output = outputPath || this.config.outputDir || join(this.tempDir, 'classes');

    try {
      await fs.mkdir(output, { recursive: true });

      const args = this.buildCompilerArgs(sourceFiles, output);
      const command = `${this.javacPath} ${args.join(' ')}`;

      if (this.config.verbose) {
        console.log(`Executing: ${command}`);
      }

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024
      });

      const classFiles = await this.collectClassFiles(output);

      return {
        success: true,
        output: stdout,
        warnings: this.parseWarnings(stdout + stderr),
        outputFiles: classFiles,
        classFiles,
        executionTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || '',
        errors: this.parseErrors(error.stderr || error.message),
        warnings: this.parseWarnings(error.stdout || ''),
        outputFiles: [],
        classFiles: [],
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Compile Java source from string
   */
  async compileString(
    source: string,
    className: string = 'Main'
  ): Promise<JavaCompilationResult> {
    const tempFile = join(this.tempDir, `${className}.java`);
    await fs.mkdir(dirname(tempFile), { recursive: true });
    await fs.writeFile(tempFile, source);

    const result = await this.compile([tempFile]);

    // Cleanup temp file
    try {
      await fs.unlink(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }

    return result;
  }

  /**
   * Compile with annotation processing
   */
  async compileWithAnnotations(
    sourceFiles: string[],
    processors: string[],
    processorPath: string[],
    outputPath?: string
  ): Promise<JavaCompilationResult> {
    const compiler = new JavaCompiler({
      ...this.config,
      annotationProcessors: processors,
      processorPath
    });

    return compiler.compile(sourceFiles, outputPath);
  }

  /**
   * Extract class metadata using reflection
   */
  async getClassMetadata(classFile: string): Promise<JavaClassMetadata> {
    // Use javap to extract class metadata
    try {
      const { stdout } = await execAsync(`javap -private -s ${classFile}`);
      return this.parseJavapOutput(stdout);
    } catch (error: any) {
      throw new Error(`Failed to get class metadata: ${error.message}`);
    }
  }

  /**
   * Generate JAR file from compiled classes
   */
  async createJar(
    classFiles: string[],
    jarPath: string,
    manifest?: Record<string, string>
  ): Promise<void> {
    const manifestFile = join(this.tempDir, 'MANIFEST.MF');

    // Create manifest
    if (manifest) {
      const manifestContent = Object.entries(manifest)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      await fs.writeFile(manifestFile, manifestContent + '\n');
    }

    // Create JAR
    const jarCommand = manifest
      ? `jar cfm ${jarPath} ${manifestFile} -C ${dirname(classFiles[0])} .`
      : `jar cf ${jarPath} -C ${dirname(classFiles[0])} .`;

    await execAsync(jarCommand);
  }

  /**
   * Build compiler arguments
   */
  private buildCompilerArgs(sourceFiles: string[], output: string): string[] {
    const args: string[] = [];

    // Source files
    args.push(...sourceFiles);

    // Output directory
    args.push('-d', output);

    // Java version
    if (this.config.javaVersion) {
      args.push('-source', this.config.javaVersion);
      args.push('-target', this.config.javaVersion);
    }

    // Encoding
    if (this.config.encoding) {
      args.push('-encoding', this.config.encoding);
    }

    // Classpath
    if (this.config.classpath && this.config.classpath.length > 0) {
      args.push('-classpath', this.config.classpath.join(':'));
    }

    // Source path
    if (this.config.sourcePath && this.config.sourcePath.length > 0) {
      args.push('-sourcepath', this.config.sourcePath.join(':'));
    }

    // Debug info
    if (this.config.debug) {
      args.push('-g');
    }

    // Deprecation warnings
    if (this.config.deprecation) {
      args.push('-deprecation');
    }

    // Warnings
    if (this.config.warnings) {
      if (this.config.xlint && this.config.xlint.length > 0) {
        args.push('-Xlint:' + this.config.xlint.join(','));
      } else {
        args.push('-Xlint:all');
      }
    }

    // Warnings as errors
    if (this.config.warningsAsErrors) {
      args.push('-Werror');
    }

    // Annotation processors
    if (this.config.annotationProcessors && this.config.annotationProcessors.length > 0) {
      args.push('-processor', this.config.annotationProcessors.join(','));
    }

    // Processor path
    if (this.config.processorPath && this.config.processorPath.length > 0) {
      args.push('-processorpath', this.config.processorPath.join(':'));
    }

    // Enable preview features
    if (this.config.enablePreview) {
      args.push('--enable-preview');
    }

    // Parameters
    if (this.config.parameters) {
      args.push('-parameters');
    }

    // Verbose
    if (this.config.verbose) {
      args.push('-verbose');
    }

    return args;
  }

  /**
   * Parse compiler errors
   */
  private parseErrors(output: string): string[] {
    const errors: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('error:') || line.match(/\d+ error/)) {
        errors.push(line.trim());
      }
    }

    return errors;
  }

  /**
   * Parse compiler warnings
   */
  private parseWarnings(output: string): string[] {
    const warnings: string[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('warning:') || line.match(/\d+ warning/)) {
        warnings.push(line.trim());
      }
    }

    return warnings;
  }

  /**
   * Collect all class files from directory
   */
  private async collectClassFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          const subFiles = await this.collectClassFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.name.endsWith('.class')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }

    return files;
  }

  /**
   * Parse javap output to extract class metadata
   */
  private parseJavapOutput(output: string): JavaClassMetadata {
    const lines = output.split('\n');
    const metadata: JavaClassMetadata = {
      className: '',
      packageName: '',
      methods: [],
      fields: [],
      annotations: [],
      interfaces: []
    };

    let inClass = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Parse package
      if (trimmed.startsWith('Compiled from')) {
        const match = trimmed.match(/class (\S+)/);
        if (match) {
          const fullName = match[1];
          const lastDot = fullName.lastIndexOf('.');
          if (lastDot > 0) {
            metadata.packageName = fullName.substring(0, lastDot);
            metadata.className = fullName.substring(lastDot + 1);
          } else {
            metadata.className = fullName;
          }
        }
      }

      // Parse annotations
      if (trimmed.startsWith('@')) {
        metadata.annotations.push(trimmed);
      }

      // Parse methods
      if (trimmed.includes('(') && trimmed.includes(')') && !trimmed.startsWith('class')) {
        // Simple method parsing
        const methodMatch = trimmed.match(/(\w+)\s+(\w+)\((.*?)\)/);
        if (methodMatch) {
          const [, returnType, name, params] = methodMatch;
          metadata.methods.push({
            name,
            returnType,
            parameters: this.parseParameters(params),
            modifiers: this.parseModifiers(trimmed),
            annotations: []
          });
        }
      }

      // Parse fields
      if (trimmed.match(/^\w+\s+\w+\s*;/)) {
        const fieldMatch = trimmed.match(/(\w+)\s+(\w+)\s*;/);
        if (fieldMatch) {
          const [, type, name] = fieldMatch;
          metadata.fields.push({
            name,
            type,
            modifiers: this.parseModifiers(trimmed),
            annotations: []
          });
        }
      }
    }

    return metadata;
  }

  /**
   * Parse method parameters
   */
  private parseParameters(params: string): Array<{ name: string; type: string }> {
    if (!params.trim()) return [];

    return params.split(',').map((param, index) => {
      const parts = param.trim().split(/\s+/);
      return {
        type: parts[0] || 'Object',
        name: parts[1] || `arg${index}`
      };
    });
  }

  /**
   * Parse modifiers from line
   */
  private parseModifiers(line: string): string[] {
    const modifiers: string[] = [];
    const keywords = ['public', 'private', 'protected', 'static', 'final', 'abstract', 'synchronized'];

    for (const keyword of keywords) {
      if (line.includes(keyword)) {
        modifiers.push(keyword);
      }
    }

    return modifiers;
  }

  /**
   * Get compiler version
   */
  async getVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync(`${this.javacPath} -version`);
      return stdout.trim();
    } catch (error: any) {
      throw new Error(`Failed to get javac version: ${error.message}`);
    }
  }

  /**
   * Check if Java compiler is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.getVersion();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Convenience function to compile Java files
 */
export async function compileJava(
  sourceFiles: string[],
  config?: Partial<JavaCompilerConfig>
): Promise<JavaCompilationResult> {
  const compiler = new JavaCompiler(config);
  return compiler.compile(sourceFiles);
}

/**
 * Convenience function to compile Java string
 */
export async function compileJavaString(
  source: string,
  className?: string,
  config?: Partial<JavaCompilerConfig>
): Promise<JavaCompilationResult> {
  const compiler = new JavaCompiler(config);
  return compiler.compileString(source, className);
}

export default JavaCompiler;
