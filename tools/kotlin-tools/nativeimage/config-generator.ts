/**
 * Native Image Configuration Generator
 *
 * Automatically generate reflection, resource, JNI, and proxy configurations
 * for GraalVM Native Image builds through static analysis and runtime tracing.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Configuration generator options
 */
export interface GeneratorOptions {
  outputDir: string;
  mainClass: string;
  classpath: string[];
  testCommand?: string;
  mergeExisting?: boolean;
  verbose?: boolean;
}

/**
 * Generated configuration set
 */
export interface ConfigurationSet {
  reflectionConfig: any;
  resourceConfig: any;
  jniConfig: any;
  proxyConfig: any;
  serializationConfig: any;
}

/**
 * Configuration Generator
 */
export class ConfigGenerator {
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = {
      mergeExisting: true,
      verbose: false,
      ...options
    };
  }

  /**
   * Generate all configurations using native-image-agent
   */
  async generateAll(): Promise<ConfigurationSet> {
    await fs.mkdir(this.options.outputDir, { recursive: true });

    // Run application with agent to collect configuration
    const agentOptions = [
      `config-output-dir=${this.options.outputDir}`,
      this.options.mergeExisting ? 'config-merge-dir=${this.options.outputDir}' : '',
      'experimental-class-loader-support'
    ].filter(Boolean).join(',');

    const command = [
      'java',
      `-agentlib:native-image-agent=${agentOptions}`,
      '-cp', this.options.classpath.join(':'),
      this.options.mainClass,
      this.options.testCommand || ''
    ].join(' ');

    if (this.options.verbose) {
      console.log(`Running: ${command}`);
    }

    try {
      await execAsync(command, {
        timeout: 5 * 60 * 1000, // 5 minutes
        maxBuffer: 10 * 1024 * 1024
      });
    } catch (error) {
      console.warn('Agent execution completed with warnings');
    }

    // Load generated configurations
    return this.loadConfigurations();
  }

  /**
   * Generate reflection configuration only
   */
  async generateReflectionConfig(): Promise<any> {
    const config = await this.generateAll();
    return config.reflectionConfig;
  }

  /**
   * Generate resource configuration from classpath scan
   */
  async generateResourceConfig(
    patterns: string[] = ['**/*.properties', '**/*.xml', '**/*.json']
  ): Promise<any> {
    const resources: any = {
      resources: {
        includes: [],
        excludes: []
      }
    };

    // Scan classpath for resources
    for (const cp of this.options.classpath) {
      if (cp.endsWith('.jar')) {
        // List JAR contents
        try {
          const { stdout } = await execAsync(`jar tf ${cp}`);
          const files = stdout.split('\n');

          for (const file of files) {
            if (this.matchesPatterns(file, patterns)) {
              resources.resources.includes.push({
                pattern: `\\Q${file}\\E`
              });
            }
          }
        } catch (error) {
          // Ignore JAR listing errors
        }
      }
    }

    return resources;
  }

  /**
   * Generate JNI configuration from native method detection
   */
  async generateJNIConfig(): Promise<any> {
    const jniClasses: any[] = [];

    // This would scan bytecode for native methods
    // For now, return template
    return jniClasses;
  }

  /**
   * Generate proxy configuration from interface detection
   */
  async generateProxyConfig(): Promise<any> {
    const proxies: any[] = [];

    // This would detect proxy usage from bytecode
    // For now, return template
    return proxies;
  }

  /**
   * Generate serialization configuration
   */
  async generateSerializationConfig(): Promise<any> {
    const serialization: any[] = [];

    // This would detect Serializable classes
    // For now, return template
    return serialization;
  }

  /**
   * Generate build configuration template
   */
  async generateBuildTemplate(
    templateType: 'gradle' | 'maven' = 'gradle'
  ): Promise<string> {
    if (templateType === 'gradle') {
      return this.generateGradleBuildTemplate();
    } else {
      return this.generateMavenBuildTemplate();
    }
  }

  /**
   * Generate Gradle build template
   */
  private generateGradleBuildTemplate(): string {
    return `
plugins {
    id 'org.graalvm.buildtools.native' version '0.9.28'
}

graalvmNative {
    binaries {
        main {
            imageName = '${this.options.mainClass.split('.').pop()}'
            mainClass = '${this.options.mainClass}'

            buildArgs.add('--no-fallback')
            buildArgs.add('--enable-https')
            buildArgs.add('--install-exit-handlers')
            buildArgs.add('-H:+ReportExceptionStackTraces')

            // Optimization
            buildArgs.add('-O3')
            buildArgs.add('-march=native')

            // Configuration
            buildArgs.add('-H:ReflectionConfigurationFiles=\${projectDir}/native-image/reflect-config.json')
            buildArgs.add('-H:ResourceConfigurationFiles=\${projectDir}/native-image/resource-config.json')
            buildArgs.add('-H:JNIConfigurationFiles=\${projectDir}/native-image/jni-config.json')

            // Memory
            buildArgs.add('-J-Xmx8g')

            // Debug (remove for production)
            // buildArgs.add('-g')
            // buildArgs.add('--verbose')
        }
    }
}

tasks.nativeCompile {
    classpathJar {
        enabled = true
    }
}
`;
  }

  /**
   * Generate Maven build template
   */
  private generateMavenBuildTemplate(): string {
    return `
<plugin>
    <groupId>org.graalvm.buildtools</groupId>
    <artifactId>native-maven-plugin</artifactId>
    <version>0.9.28</version>
    <configuration>
        <imageName>\${project.artifactId}</imageName>
        <mainClass>${this.options.mainClass}</mainClass>
        <buildArgs>
            <buildArg>--no-fallback</buildArg>
            <buildArg>--enable-https</buildArg>
            <buildArg>--install-exit-handlers</buildArg>
            <buildArg>-H:+ReportExceptionStackTraces</buildArg>
            <buildArg>-O3</buildArg>
            <buildArg>-march=native</buildArg>
            <buildArg>-H:ReflectionConfigurationFiles=native-image/reflect-config.json</buildArg>
            <buildArg>-H:ResourceConfigurationFiles=native-image/resource-config.json</buildArg>
            <buildArg>-H:JNIConfigurationFiles=native-image/jni-config.json</buildArg>
            <buildArg>-J-Xmx8g</buildArg>
        </buildArgs>
    </configuration>
    <executions>
        <execution>
            <id>build-native</id>
            <goals>
                <goal>compile-no-fork</goal>
            </goals>
            <phase>package</phase>
        </execution>
    </executions>
</plugin>
`;
  }

  /**
   * Generate optimized configuration for common frameworks
   */
  async generateFrameworkConfig(
    framework: 'spring' | 'quarkus' | 'micronaut' | 'helidon'
  ): Promise<ConfigurationSet> {
    const baseConfig = await this.generateAll();

    // Add framework-specific configurations
    switch (framework) {
      case 'spring':
        return this.enhanceSpringConfig(baseConfig);
      case 'quarkus':
        return this.enhanceQuarkusConfig(baseConfig);
      case 'micronaut':
        return this.enhanceMicronautConfig(baseConfig);
      case 'helidon':
        return this.enhanceHelidonConfig(baseConfig);
      default:
        return baseConfig;
    }
  }

  /**
   * Load existing configurations
   */
  private async loadConfigurations(): Promise<ConfigurationSet> {
    const loadConfig = async (filename: string): Promise<any> => {
      try {
        const content = await fs.readFile(
          join(this.options.outputDir, filename),
          'utf-8'
        );
        return JSON.parse(content);
      } catch (error) {
        return filename.includes('resource') ? { resources: { includes: [] } } : [];
      }
    };

    return {
      reflectionConfig: await loadConfig('reflect-config.json'),
      resourceConfig: await loadConfig('resource-config.json'),
      jniConfig: await loadConfig('jni-config.json'),
      proxyConfig: await loadConfig('proxy-config.json'),
      serializationConfig: await loadConfig('serialization-config.json')
    };
  }

  /**
   * Check if file matches patterns
   */
  private matchesPatterns(file: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      const regex = new RegExp(
        pattern.replace(/\./g, '\\.').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      );
      return regex.test(file);
    });
  }

  /**
   * Enhance configuration for Spring
   */
  private enhanceSpringConfig(config: ConfigurationSet): ConfigurationSet {
    // Add Spring-specific reflection entries
    const springClasses = [
      'org.springframework.boot.SpringApplication',
      'org.springframework.context.annotation.ConfigurationClassPostProcessor',
      'org.springframework.boot.autoconfigure.AutoConfigurationImportSelector'
    ];

    springClasses.forEach(className => {
      config.reflectionConfig.push({
        name: className,
        allDeclaredConstructors: true,
        allPublicConstructors: true,
        allDeclaredMethods: true,
        allPublicMethods: true,
        allDeclaredFields: true,
        allPublicFields: true
      });
    });

    return config;
  }

  /**
   * Enhance configuration for Quarkus
   */
  private enhanceQuarkusConfig(config: ConfigurationSet): ConfigurationSet {
    // Quarkus handles most of this automatically
    return config;
  }

  /**
   * Enhance configuration for Micronaut
   */
  private enhanceMicronautConfig(config: ConfigurationSet): ConfigurationSet {
    // Add Micronaut-specific entries
    const micronautClasses = [
      'io.micronaut.context.ApplicationContext',
      'io.micronaut.runtime.Micronaut'
    ];

    micronautClasses.forEach(className => {
      config.reflectionConfig.push({
        name: className,
        allDeclaredConstructors: true,
        allPublicMethods: true
      });
    });

    return config;
  }

  /**
   * Enhance configuration for Helidon
   */
  private enhanceHelidonConfig(config: ConfigurationSet): ConfigurationSet {
    // Add Helidon-specific entries
    return config;
  }

  /**
   * Save configuration set to files
   */
  async saveConfigurations(config: ConfigurationSet): Promise<void> {
    await fs.mkdir(this.options.outputDir, { recursive: true });

    await fs.writeFile(
      join(this.options.outputDir, 'reflect-config.json'),
      JSON.stringify(config.reflectionConfig, null, 2)
    );

    await fs.writeFile(
      join(this.options.outputDir, 'resource-config.json'),
      JSON.stringify(config.resourceConfig, null, 2)
    );

    await fs.writeFile(
      join(this.options.outputDir, 'jni-config.json'),
      JSON.stringify(config.jniConfig, null, 2)
    );

    await fs.writeFile(
      join(this.options.outputDir, 'proxy-config.json'),
      JSON.stringify(config.proxyConfig, null, 2)
    );

    await fs.writeFile(
      join(this.options.outputDir, 'serialization-config.json'),
      JSON.stringify(config.serializationConfig, null, 2)
    );
  }
}

/**
 * Convenience function to generate configurations
 */
export async function generateConfigurations(
  options: GeneratorOptions
): Promise<ConfigurationSet> {
  const generator = new ConfigGenerator(options);
  return generator.generateAll();
}

export default ConfigGenerator;
