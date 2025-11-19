/**
 * Java Project Analyzer
 *
 * Scans Java projects to identify Spring patterns, dependencies,
 * and generate comprehensive migration reports for Elide conversion.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface JavaFile {
  path: string;
  packageName: string;
  className: string;
  annotations: string[];
  imports: string[];
  methods: MethodInfo[];
  fields: FieldInfo[];
}

export interface MethodInfo {
  name: string;
  annotations: string[];
  returnType: string;
  parameters: string[];
  isPublic: boolean;
}

export interface FieldInfo {
  name: string;
  type: string;
  annotations: string[];
  isPrivate: boolean;
}

export interface SpringPattern {
  type: 'controller' | 'service' | 'repository' | 'component' | 'entity' | 'config';
  file: string;
  className: string;
  annotations: string[];
  dependencies: string[];
}

export interface DependencyInfo {
  groupId: string;
  artifactId: string;
  version: string;
  scope?: string;
}

export interface MigrationReport {
  projectName: string;
  totalFiles: number;
  javaFiles: JavaFile[];
  springPatterns: SpringPattern[];
  dependencies: DependencyInfo[];
  buildTool: 'maven' | 'gradle' | 'unknown';
  complexity: 'low' | 'medium' | 'high';
  estimatedEffort: string;
  recommendations: string[];
  warnings: string[];
}

/**
 * Main analyzer class for Java projects
 */
export class JavaProjectAnalyzer {
  private rootPath: string;
  private javaFiles: JavaFile[] = [];
  private springPatterns: SpringPattern[] = [];
  private dependencies: DependencyInfo[] = [];

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * Analyze the entire Java project
   */
  async analyze(): Promise<MigrationReport> {
    console.log('Starting Java project analysis...');

    // Scan for Java files
    await this.scanJavaFiles(this.rootPath);

    // Identify Spring patterns
    this.identifySpringPatterns();

    // Parse dependencies
    await this.parseDependencies();

    // Detect build tool
    const buildTool = this.detectBuildTool();

    // Calculate complexity
    const complexity = this.calculateComplexity();

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    // Generate warnings
    const warnings = this.generateWarnings();

    // Estimate effort
    const estimatedEffort = this.estimateEffort(complexity);

    return {
      projectName: path.basename(this.rootPath),
      totalFiles: this.javaFiles.length,
      javaFiles: this.javaFiles,
      springPatterns: this.springPatterns,
      dependencies: this.dependencies,
      buildTool,
      complexity,
      estimatedEffort,
      recommendations,
      warnings,
    };
  }

  /**
   * Recursively scan for Java files
   */
  private async scanJavaFiles(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip build directories and hidden files
      if (entry.name.startsWith('.') ||
          entry.name === 'target' ||
          entry.name === 'build' ||
          entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        await this.scanJavaFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.java')) {
        const javaFile = await this.parseJavaFile(fullPath);
        if (javaFile) {
          this.javaFiles.push(javaFile);
        }
      }
    }
  }

  /**
   * Parse a single Java file
   */
  private async parseJavaFile(filePath: string): Promise<JavaFile | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract package name
      const packageMatch = content.match(/package\s+([\w.]+);/);
      const packageName = packageMatch ? packageMatch[1] : '';

      // Extract class name
      const classMatch = content.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : path.basename(filePath, '.java');

      // Extract annotations
      const annotations = this.extractAnnotations(content);

      // Extract imports
      const imports = this.extractImports(content);

      // Extract methods
      const methods = this.extractMethods(content);

      // Extract fields
      const fields = this.extractFields(content);

      return {
        path: filePath,
        packageName,
        className,
        annotations,
        imports,
        methods,
        fields,
      };
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract annotations from Java code
   */
  private extractAnnotations(content: string): string[] {
    const annotations: string[] = [];
    const annotationRegex = /@(\w+)(?:\([^)]*\))?/g;
    let match;

    while ((match = annotationRegex.exec(content)) !== null) {
      annotations.push(match[1]);
    }

    return [...new Set(annotations)];
  }

  /**
   * Extract imports from Java code
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+([\w.]+);/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Extract method information
   */
  private extractMethods(content: string): MethodInfo[] {
    const methods: MethodInfo[] = [];

    // Simple regex for public methods (can be enhanced)
    const methodRegex = /(public|private|protected)\s+(\w+)\s+(\w+)\s*\(([^)]*)\)/g;
    let match;

    while ((match = methodRegex.exec(content)) !== null) {
      const isPublic = match[1] === 'public';
      const returnType = match[2];
      const name = match[3];
      const params = match[4].split(',').map(p => p.trim()).filter(p => p);

      // Find annotations before this method
      const methodStart = match.index;
      const beforeMethod = content.substring(Math.max(0, methodStart - 200), methodStart);
      const methodAnnotations = this.extractAnnotations(beforeMethod);

      methods.push({
        name,
        annotations: methodAnnotations,
        returnType,
        parameters: params,
        isPublic,
      });
    }

    return methods;
  }

  /**
   * Extract field information
   */
  private extractFields(content: string): FieldInfo[] {
    const fields: FieldInfo[] = [];

    // Simple regex for fields
    const fieldRegex = /(private|public|protected)\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*[;=]/g;
    let match;

    while ((match = fieldRegex.exec(content)) !== null) {
      const isPrivate = match[1] === 'private';
      const type = match[2];
      const name = match[3];

      // Find annotations before this field
      const fieldStart = match.index;
      const beforeField = content.substring(Math.max(0, fieldStart - 200), fieldStart);
      const fieldAnnotations = this.extractAnnotations(beforeField);

      fields.push({
        name,
        type,
        annotations: fieldAnnotations,
        isPrivate,
      });
    }

    return fields;
  }

  /**
   * Identify Spring patterns in the codebase
   */
  private identifySpringPatterns(): void {
    const springAnnotations: Record<string, SpringPattern['type']> = {
      'RestController': 'controller',
      'Controller': 'controller',
      'Service': 'service',
      'Repository': 'repository',
      'Component': 'component',
      'Entity': 'entity',
      'Configuration': 'config',
    };

    for (const javaFile of this.javaFiles) {
      for (const annotation of javaFile.annotations) {
        if (annotation in springAnnotations) {
          // Extract injected dependencies
          const dependencies = javaFile.fields
            .filter(f => f.annotations.includes('Autowired') || f.annotations.includes('Inject'))
            .map(f => f.type);

          this.springPatterns.push({
            type: springAnnotations[annotation],
            file: javaFile.path,
            className: javaFile.className,
            annotations: javaFile.annotations,
            dependencies,
          });
        }
      }
    }
  }

  /**
   * Parse Maven pom.xml or Gradle build files
   */
  private async parseDependencies(): Promise<void> {
    // Try Maven first
    const pomPath = path.join(this.rootPath, 'pom.xml');
    if (fs.existsSync(pomPath)) {
      await this.parseMavenDependencies(pomPath);
      return;
    }

    // Try Gradle
    const gradlePath = path.join(this.rootPath, 'build.gradle');
    if (fs.existsSync(gradlePath)) {
      await this.parseGradleDependencies(gradlePath);
    }
  }

  /**
   * Parse Maven pom.xml
   */
  private async parseMavenDependencies(pomPath: string): Promise<void> {
    try {
      const content = fs.readFileSync(pomPath, 'utf-8');

      // Simple regex parsing (for production, use a proper XML parser)
      const dependencyRegex = /<dependency>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<version>(.*?)<\/version>/g;
      let match;

      while ((match = dependencyRegex.exec(content)) !== null) {
        this.dependencies.push({
          groupId: match[1],
          artifactId: match[2],
          version: match[3],
        });
      }
    } catch (error) {
      console.error('Error parsing pom.xml:', error);
    }
  }

  /**
   * Parse Gradle build.gradle
   */
  private async parseGradleDependencies(gradlePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(gradlePath, 'utf-8');

      // Simple regex for Gradle dependencies
      const dependencyRegex = /(?:implementation|compile|api)\s+['"]([^:'"]+):([^:'"]+):([^'"]+)['"]/g;
      let match;

      while ((match = dependencyRegex.exec(content)) !== null) {
        this.dependencies.push({
          groupId: match[1],
          artifactId: match[2],
          version: match[3],
        });
      }
    } catch (error) {
      console.error('Error parsing build.gradle:', error);
    }
  }

  /**
   * Detect build tool used
   */
  private detectBuildTool(): 'maven' | 'gradle' | 'unknown' {
    if (fs.existsSync(path.join(this.rootPath, 'pom.xml'))) {
      return 'maven';
    }
    if (fs.existsSync(path.join(this.rootPath, 'build.gradle'))) {
      return 'gradle';
    }
    return 'unknown';
  }

  /**
   * Calculate project complexity
   */
  private calculateComplexity(): 'low' | 'medium' | 'high' {
    const fileCount = this.javaFiles.length;
    const patternCount = this.springPatterns.length;
    const dependencyCount = this.dependencies.length;

    const score = fileCount * 0.5 + patternCount * 2 + dependencyCount * 0.1;

    if (score < 50) return 'low';
    if (score < 150) return 'medium';
    return 'high';
  }

  /**
   * Estimate migration effort
   */
  private estimateEffort(complexity: string): string {
    const fileCount = this.javaFiles.length;

    switch (complexity) {
      case 'low':
        return `${Math.ceil(fileCount * 0.5)} - ${Math.ceil(fileCount * 1)} hours`;
      case 'medium':
        return `${Math.ceil(fileCount * 1)} - ${Math.ceil(fileCount * 2)} hours`;
      case 'high':
        return `${Math.ceil(fileCount * 2)} - ${Math.ceil(fileCount * 4)} hours`;
      default:
        return 'Unknown';
    }
  }

  /**
   * Generate migration recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Controller recommendations
    const controllers = this.springPatterns.filter(p => p.type === 'controller');
    if (controllers.length > 0) {
      recommendations.push(
        `Found ${controllers.length} Spring controllers - migrate to Elide HTTP handlers`
      );
    }

    // Service recommendations
    const services = this.springPatterns.filter(p => p.type === 'service');
    if (services.length > 0) {
      recommendations.push(
        `Found ${services.length} Spring services - use Elide dependency injection`
      );
    }

    // JPA recommendations
    const entities = this.springPatterns.filter(p => p.type === 'entity');
    if (entities.length > 0) {
      recommendations.push(
        `Found ${entities.length} JPA entities - consider migrating to modern ORM or Elide data layer`
      );
    }

    // Spring Boot specific
    const hasSpringBoot = this.dependencies.some(d => d.artifactId.includes('spring-boot'));
    if (hasSpringBoot) {
      recommendations.push(
        'Migrate Spring Boot application to Elide application structure'
      );
    }

    // General recommendations
    recommendations.push(
      'Start with stateless components first',
      'Migrate business logic before infrastructure',
      'Use spring-bridge.ts for gradual migration'
    );

    return recommendations;
  }

  /**
   * Generate migration warnings
   */
  private generateWarnings(): string[] {
    const warnings: string[] = [];

    // Check for complex dependencies
    if (this.dependencies.length > 50) {
      warnings.push('Large number of dependencies detected - review and minimize');
    }

    // Check for deprecated Spring patterns
    const hasXml = fs.existsSync(path.join(this.rootPath, 'src/main/resources/application-context.xml'));
    if (hasXml) {
      warnings.push('XML configuration detected - prefer annotation-based config');
    }

    // Check for JDBC templates
    const hasJdbc = this.dependencies.some(d => d.artifactId.includes('jdbc'));
    if (hasJdbc) {
      warnings.push('JDBC dependencies found - consider using higher-level ORM');
    }

    return warnings;
  }
}

/**
 * CLI entry point
 */
export async function analyzeProject(projectPath: string): Promise<void> {
  const analyzer = new JavaProjectAnalyzer(projectPath);
  const report = await analyzer.analyze();

  console.log('\n=== Java Project Analysis Report ===\n');
  console.log(`Project: ${report.projectName}`);
  console.log(`Build Tool: ${report.buildTool}`);
  console.log(`Total Java Files: ${report.totalFiles}`);
  console.log(`Complexity: ${report.complexity}`);
  console.log(`Estimated Effort: ${report.estimatedEffort}`);

  console.log('\n--- Spring Patterns ---');
  const patternCounts: Record<string, number> = {};
  for (const pattern of report.springPatterns) {
    patternCounts[pattern.type] = (patternCounts[pattern.type] || 0) + 1;
  }
  Object.entries(patternCounts).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\n--- Key Dependencies ---');
  report.dependencies
    .filter(d => d.groupId.includes('spring') || d.groupId.includes('hibernate'))
    .slice(0, 10)
    .forEach(d => {
      console.log(`  ${d.groupId}:${d.artifactId}:${d.version}`);
    });

  console.log('\n--- Recommendations ---');
  report.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });

  if (report.warnings.length > 0) {
    console.log('\n--- Warnings ---');
    report.warnings.forEach((warn, i) => {
      console.log(`  ${i + 1}. ${warn}`);
    });
  }

  // Save report to JSON
  const reportPath = path.join(projectPath, 'migration-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nFull report saved to: ${reportPath}`);
}

// Run if called directly
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  analyzeProject(projectPath).catch(console.error);
}
