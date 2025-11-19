/**
 * Java to Kotlin/TypeScript Converter
 *
 * Converts Java classes to Kotlin or TypeScript, with special handling
 * for Spring controllers, JPA entities, and business logic.
 */

import * as fs from 'fs';
import * as path from 'path';
import { JavaFile, MethodInfo, FieldInfo } from './analyzer';

export type TargetLanguage = 'kotlin' | 'typescript';

export interface ConversionOptions {
  targetLanguage: TargetLanguage;
  preserveComments: boolean;
  convertSpringToElide: boolean;
  convertJpaEntities: boolean;
  outputDir: string;
}

export interface ConversionResult {
  originalFile: string;
  convertedFile: string;
  targetLanguage: TargetLanguage;
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Main converter class
 */
export class JavaConverter {
  private options: ConversionOptions;

  constructor(options: Partial<ConversionOptions> = {}) {
    this.options = {
      targetLanguage: options.targetLanguage || 'typescript',
      preserveComments: options.preserveComments ?? true,
      convertSpringToElide: options.convertSpringToElide ?? true,
      convertJpaEntities: options.convertJpaEntities ?? true,
      outputDir: options.outputDir || './converted',
    };
  }

  /**
   * Convert a Java file to target language
   */
  async convertFile(javaFile: JavaFile): Promise<ConversionResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Read original content
      const content = fs.readFileSync(javaFile.path, 'utf-8');

      // Determine conversion strategy based on annotations
      let convertedContent: string;

      if (this.isSpringController(javaFile)) {
        convertedContent = this.convertSpringController(javaFile, content);
      } else if (this.isJpaEntity(javaFile)) {
        convertedContent = this.convertJpaEntity(javaFile, content);
      } else if (this.isSpringService(javaFile)) {
        convertedContent = this.convertSpringService(javaFile, content);
      } else {
        convertedContent = this.convertPlainClass(javaFile, content);
      }

      // Determine output file path
      const ext = this.options.targetLanguage === 'kotlin' ? '.kt' : '.ts';
      const relativePath = path.relative(process.cwd(), javaFile.path);
      const outputPath = path.join(
        this.options.outputDir,
        relativePath.replace('.java', ext)
      );

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write converted file
      fs.writeFileSync(outputPath, convertedContent);

      return {
        originalFile: javaFile.path,
        convertedFile: outputPath,
        targetLanguage: this.options.targetLanguage,
        success: true,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Conversion failed: ${error}`);
      return {
        originalFile: javaFile.path,
        convertedFile: '',
        targetLanguage: this.options.targetLanguage,
        success: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Check if file is a Spring controller
   */
  private isSpringController(javaFile: JavaFile): boolean {
    return javaFile.annotations.some(a =>
      ['RestController', 'Controller'].includes(a)
    );
  }

  /**
   * Check if file is a JPA entity
   */
  private isJpaEntity(javaFile: JavaFile): boolean {
    return javaFile.annotations.includes('Entity');
  }

  /**
   * Check if file is a Spring service
   */
  private isSpringService(javaFile: JavaFile): boolean {
    return javaFile.annotations.some(a =>
      ['Service', 'Component'].includes(a)
    );
  }

  /**
   * Convert Spring Controller to Elide HTTP handler
   */
  private convertSpringController(javaFile: JavaFile, content: string): string {
    if (this.options.targetLanguage === 'typescript') {
      return this.convertControllerToTypeScript(javaFile, content);
    } else {
      return this.convertControllerToKotlin(javaFile, content);
    }
  }

  /**
   * Convert Spring Controller to TypeScript Elide handler
   */
  private convertControllerToTypeScript(javaFile: JavaFile, content: string): string {
    let output = '';

    // Add imports
    output += `import { Handler, HttpRequest, HttpResponse } from '@elide-dev/elide';\n`;
    output += `import { Status } from '@elide-dev/elide/http';\n\n`;

    // Extract request mapping paths
    const basePath = this.extractRequestMapping(content);

    // Add class comment
    output += `/**\n * Converted from Java Spring Controller: ${javaFile.className}\n */\n\n`;

    // Convert each endpoint method
    for (const method of javaFile.methods) {
      if (!method.isPublic) continue;

      const httpMethod = this.extractHttpMethod(method.annotations);
      const methodPath = this.extractMethodPath(method.annotations);
      const fullPath = this.combinePaths(basePath, methodPath);

      if (httpMethod) {
        output += this.generateTypeScriptHandler(method, httpMethod, fullPath);
        output += '\n\n';
      }
    }

    return output;
  }

  /**
   * Convert Spring Controller to Kotlin Elide handler
   */
  private convertControllerToKotlin(javaFile: JavaFile, content: string): string {
    let output = '';

    // Add imports
    output += `import dev.elide.http.*\n`;
    output += `import dev.elide.server.Handler\n\n`;

    // Extract request mapping paths
    const basePath = this.extractRequestMapping(content);

    // Add class comment
    output += `/**\n * Converted from Java Spring Controller: ${javaFile.className}\n */\n\n`;

    // Convert each endpoint method
    for (const method of javaFile.methods) {
      if (!method.isPublic) continue;

      const httpMethod = this.extractHttpMethod(method.annotations);
      const methodPath = this.extractMethodPath(method.annotations);
      const fullPath = this.combinePaths(basePath, methodPath);

      if (httpMethod) {
        output += this.generateKotlinHandler(method, httpMethod, fullPath);
        output += '\n\n';
      }
    }

    return output;
  }

  /**
   * Generate TypeScript handler function
   */
  private generateTypeScriptHandler(method: MethodInfo, httpMethod: string, path: string): string {
    const handlerName = `handle${this.capitalize(method.name)}`;

    let output = `/**\n * ${httpMethod.toUpperCase()} ${path}\n`;
    if (method.annotations.length > 0) {
      output += ` * Original annotations: ${method.annotations.join(', ')}\n`;
    }
    output += ` */\n`;

    output += `export const ${handlerName}: Handler = async (req: HttpRequest): Promise<HttpResponse> => {\n`;

    // Extract path variables
    const pathVars = this.extractPathVariables(path);
    if (pathVars.length > 0) {
      output += `  // Path variables: ${pathVars.join(', ')}\n`;
      pathVars.forEach(varName => {
        output += `  const ${varName} = req.pathParams.get('${varName}');\n`;
      });
      output += '\n';
    }

    // Extract request parameters
    const requestParams = this.extractRequestParams(method);
    if (requestParams.length > 0) {
      output += `  // Request parameters\n`;
      requestParams.forEach(param => {
        output += `  const ${param} = req.queryParams.get('${param}');\n`;
      });
      output += '\n';
    }

    // Check for request body
    if (this.hasRequestBody(method)) {
      output += `  // Parse request body\n`;
      output += `  const body = await req.json();\n\n`;
    }

    output += `  // TODO: Implement business logic from ${method.name}\n`;
    output += `  // Original return type: ${method.returnType}\n\n`;

    output += `  return new HttpResponse({\n`;
    output += `    status: Status.OK,\n`;
    output += `    body: JSON.stringify({ message: 'Not implemented' }),\n`;
    output += `  });\n`;
    output += `};`;

    return output;
  }

  /**
   * Generate Kotlin handler function
   */
  private generateKotlinHandler(method: MethodInfo, httpMethod: string, path: string): string {
    const handlerName = `handle${this.capitalize(method.name)}`;

    let output = `/**\n * ${httpMethod.toUpperCase()} ${path}\n`;
    if (method.annotations.length > 0) {
      output += ` * Original annotations: ${method.annotations.join(', ')}\n`;
    }
    output += ` */\n`;

    output += `suspend fun ${handlerName}(req: HttpRequest): HttpResponse {\n`;

    // Extract path variables
    const pathVars = this.extractPathVariables(path);
    if (pathVars.length > 0) {
      output += `  // Path variables\n`;
      pathVars.forEach(varName => {
        output += `  val ${varName} = req.pathParams["${varName}"]\n`;
      });
      output += '\n';
    }

    // Extract request parameters
    const requestParams = this.extractRequestParams(method);
    if (requestParams.length > 0) {
      output += `  // Request parameters\n`;
      requestParams.forEach(param => {
        output += `  val ${param} = req.queryParams["${param}"]\n`;
      });
      output += '\n';
    }

    // Check for request body
    if (this.hasRequestBody(method)) {
      output += `  // Parse request body\n`;
      output += `  val body = req.json()\n\n`;
    }

    output += `  // TODO: Implement business logic from ${method.name}\n`;
    output += `  // Original return type: ${method.returnType}\n\n`;

    output += `  return HttpResponse(\n`;
    output += `    status = Status.OK,\n`;
    output += `    body = """{"message": "Not implemented"}"""\n`;
    output += `  )\n`;
    output += `}`;

    return output;
  }

  /**
   * Convert JPA Entity
   */
  private convertJpaEntity(javaFile: JavaFile, content: string): string {
    if (this.options.targetLanguage === 'typescript') {
      return this.convertEntityToTypeScript(javaFile);
    } else {
      return this.convertEntityToKotlin(javaFile);
    }
  }

  /**
   * Convert JPA Entity to TypeScript interface
   */
  private convertEntityToTypeScript(javaFile: JavaFile): string {
    let output = '';

    output += `/**\n * Converted from JPA Entity: ${javaFile.className}\n */\n`;
    output += `export interface ${javaFile.className} {\n`;

    for (const field of javaFile.fields) {
      const tsType = this.javaTypeToTypeScript(field.type);
      const optional = this.isOptionalField(field) ? '?' : '';

      if (field.annotations.length > 0) {
        output += `  /** ${field.annotations.join(', ')} */\n`;
      }

      output += `  ${field.name}${optional}: ${tsType};\n`;
    }

    output += `}\n\n`;

    // Add validation or ORM setup if needed
    output += `// TODO: Add ORM mapping or validation logic\n`;
    output += `// Consider using TypeORM, Prisma, or similar\n`;

    return output;
  }

  /**
   * Convert JPA Entity to Kotlin data class
   */
  private convertEntityToKotlin(javaFile: JavaFile): string {
    let output = '';

    output += `/**\n * Converted from JPA Entity: ${javaFile.className}\n */\n`;
    output += `data class ${javaFile.className}(\n`;

    const fields = javaFile.fields.map((field, index) => {
      const kotlinType = this.javaTypeToKotlin(field.type);
      const nullable = this.isOptionalField(field) ? '?' : '';
      const comma = index < javaFile.fields.length - 1 ? ',' : '';

      let line = '';
      if (field.annotations.length > 0) {
        line += `  /** ${field.annotations.join(', ')} */\n`;
      }
      line += `  val ${field.name}: ${kotlinType}${nullable}${comma}`;

      return line;
    });

    output += fields.join('\n');
    output += '\n)\n\n';

    output += `// TODO: Add JPA or database mapping annotations\n`;

    return output;
  }

  /**
   * Convert Spring Service
   */
  private convertSpringService(javaFile: JavaFile, content: string): string {
    if (this.options.targetLanguage === 'typescript') {
      return this.convertServiceToTypeScript(javaFile);
    } else {
      return this.convertServiceToKotlin(javaFile);
    }
  }

  /**
   * Convert Service to TypeScript
   */
  private convertServiceToTypeScript(javaFile: JavaFile): string {
    let output = '';

    output += `/**\n * Converted from Spring Service: ${javaFile.className}\n */\n`;
    output += `export class ${javaFile.className} {\n`;

    // Convert injected dependencies
    const dependencies = javaFile.fields.filter(f =>
      f.annotations.includes('Autowired') || f.annotations.includes('Inject')
    );

    if (dependencies.length > 0) {
      output += `  constructor(\n`;
      dependencies.forEach((dep, index) => {
        const comma = index < dependencies.length - 1 ? ',' : '';
        output += `    private ${dep.name}: ${dep.type}${comma}\n`;
      });
      output += `  ) {}\n\n`;
    }

    // Convert methods
    for (const method of javaFile.methods) {
      if (!method.isPublic) continue;

      const returnType = this.javaTypeToTypeScript(method.returnType);
      const params = method.parameters.map(p => {
        const [type, name] = p.trim().split(/\s+/).reverse();
        return `${name}: ${this.javaTypeToTypeScript(type || 'any')}`;
      }).join(', ');

      output += `  async ${method.name}(${params}): Promise<${returnType}> {\n`;
      output += `    // TODO: Implement business logic\n`;
      output += `    throw new Error('Not implemented');\n`;
      output += `  }\n\n`;
    }

    output += `}\n`;

    return output;
  }

  /**
   * Convert Service to Kotlin
   */
  private convertServiceToKotlin(javaFile: JavaFile): string {
    let output = '';

    output += `/**\n * Converted from Spring Service: ${javaFile.className}\n */\n`;
    output += `class ${javaFile.className}`;

    // Convert injected dependencies
    const dependencies = javaFile.fields.filter(f =>
      f.annotations.includes('Autowired') || f.annotations.includes('Inject')
    );

    if (dependencies.length > 0) {
      output += `(\n`;
      dependencies.forEach((dep, index) => {
        const comma = index < dependencies.length - 1 ? ',' : '';
        output += `  private val ${dep.name}: ${dep.type}${comma}\n`;
      });
      output += `)`;
    }

    output += ` {\n\n`;

    // Convert methods
    for (const method of javaFile.methods) {
      if (!method.isPublic) continue;

      const returnType = this.javaTypeToKotlin(method.returnType);
      const params = method.parameters.map(p => {
        const [type, name] = p.trim().split(/\s+/).reverse();
        return `${name}: ${this.javaTypeToKotlin(type || 'Any')}`;
      }).join(', ');

      output += `  suspend fun ${method.name}(${params}): ${returnType} {\n`;
      output += `    // TODO: Implement business logic\n`;
      output += `    throw NotImplementedError()\n`;
      output += `  }\n\n`;
    }

    output += `}\n`;

    return output;
  }

  /**
   * Convert plain Java class
   */
  private convertPlainClass(javaFile: JavaFile, content: string): string {
    if (this.options.targetLanguage === 'typescript') {
      return this.convertServiceToTypeScript(javaFile); // Reuse service converter
    } else {
      return this.convertServiceToKotlin(javaFile); // Reuse service converter
    }
  }

  /**
   * Type conversion utilities
   */
  private javaTypeToTypeScript(javaType: string): string {
    const typeMap: Record<string, string> = {
      'String': 'string',
      'Integer': 'number',
      'int': 'number',
      'Long': 'number',
      'long': 'number',
      'Double': 'number',
      'double': 'number',
      'Float': 'number',
      'float': 'number',
      'Boolean': 'boolean',
      'boolean': 'boolean',
      'void': 'void',
      'Object': 'any',
      'List': 'Array',
      'Set': 'Set',
      'Map': 'Map',
    };

    // Handle generic types
    if (javaType.includes('<')) {
      const base = javaType.substring(0, javaType.indexOf('<'));
      const generic = javaType.substring(javaType.indexOf('<') + 1, javaType.lastIndexOf('>'));
      const mappedBase = typeMap[base] || base;
      const mappedGeneric = this.javaTypeToTypeScript(generic);
      return `${mappedBase}<${mappedGeneric}>`;
    }

    return typeMap[javaType] || javaType;
  }

  private javaTypeToKotlin(javaType: string): string {
    const typeMap: Record<string, string> = {
      'String': 'String',
      'Integer': 'Int',
      'int': 'Int',
      'Long': 'Long',
      'long': 'Long',
      'Double': 'Double',
      'double': 'Double',
      'Float': 'Float',
      'float': 'Float',
      'Boolean': 'Boolean',
      'boolean': 'Boolean',
      'void': 'Unit',
      'Object': 'Any',
    };

    // Handle generic types
    if (javaType.includes('<')) {
      const base = javaType.substring(0, javaType.indexOf('<'));
      const generic = javaType.substring(javaType.indexOf('<') + 1, javaType.lastIndexOf('>'));
      const mappedBase = typeMap[base] || base;
      const mappedGeneric = this.javaTypeToKotlin(generic);
      return `${mappedBase}<${mappedGeneric}>`;
    }

    return typeMap[javaType] || javaType;
  }

  /**
   * Helper utilities
   */
  private extractRequestMapping(content: string): string {
    const match = content.match(/@RequestMapping\s*\(\s*["']([^"']+)["']/);
    return match ? match[1] : '';
  }

  private extractHttpMethod(annotations: string[]): string | null {
    const methodMap: Record<string, string> = {
      'GetMapping': 'GET',
      'PostMapping': 'POST',
      'PutMapping': 'PUT',
      'DeleteMapping': 'DELETE',
      'PatchMapping': 'PATCH',
    };

    for (const annotation of annotations) {
      if (annotation in methodMap) {
        return methodMap[annotation];
      }
    }

    return null;
  }

  private extractMethodPath(annotations: string[]): string {
    for (const annotation of annotations) {
      const match = annotation.match(/Mapping\s*\(\s*["']([^"']+)["']/);
      if (match) {
        return match[1];
      }
    }
    return '';
  }

  private combinePaths(...paths: string[]): string {
    return paths
      .filter(p => p)
      .map(p => p.replace(/^\/+|\/+$/g, ''))
      .join('/')
      .replace(/^/, '/');
  }

  private extractPathVariables(path: string): string[] {
    const matches = path.matchAll(/\{(\w+)\}/g);
    return Array.from(matches, m => m[1]);
  }

  private extractRequestParams(method: MethodInfo): string[] {
    // Simple extraction - would need more sophisticated parsing
    return [];
  }

  private hasRequestBody(method: MethodInfo): boolean {
    return method.annotations.some(a => a.includes('RequestBody'));
  }

  private isOptionalField(field: FieldInfo): boolean {
    return field.annotations.some(a => a.includes('Nullable'));
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Batch convert multiple files
 */
export async function convertFiles(
  javaFiles: JavaFile[],
  options: Partial<ConversionOptions> = {}
): Promise<ConversionResult[]> {
  const converter = new JavaConverter(options);
  const results: ConversionResult[] = [];

  for (const javaFile of javaFiles) {
    const result = await converter.convertFile(javaFile);
    results.push(result);

    if (result.success) {
      console.log(`✓ Converted: ${result.originalFile} → ${result.convertedFile}`);
    } else {
      console.error(`✗ Failed: ${result.originalFile}`);
      result.errors.forEach(err => console.error(`  ${err}`));
    }
  }

  return results;
}
