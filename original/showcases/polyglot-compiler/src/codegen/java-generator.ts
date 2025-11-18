/**
 * Java Code Generator
 *
 * Generates Java 17+ code from TypeScript AST
 * Handles classes, interfaces, generics, CompletableFuture for async, and more
 */

import * as ts from 'typescript';

export interface JavaGeneratorOptions {
  version?: '17' | '21';
  package?: string;
  generateTests?: boolean;
  indentSize?: number;
  preserveComments?: boolean;
  useRecords?: boolean;
  useSealedClasses?: boolean;
}

/**
 * Maps TypeScript types to Java types
 */
class JavaTypeMapper {
  private customMappings: Map<string, string> = new Map();
  private imports: Set<string> = new Set();

  constructor() {
    this.initializeDefaultMappings();
  }

  private initializeDefaultMappings(): void {
    this.customMappings.set('number', 'double');
    this.customMappings.set('string', 'String');
    this.customMappings.set('boolean', 'boolean');
    this.customMappings.set('void', 'void');
    this.customMappings.set('any', 'Object');
    this.customMappings.set('unknown', 'Object');
    this.customMappings.set('never', 'void');
    this.customMappings.set('object', 'Map<String, Object>');
    this.customMappings.set('Array', 'List');
    this.customMappings.set('Map', 'Map');
    this.customMappings.set('Set', 'Set');
    this.customMappings.set('Promise', 'CompletableFuture');
  }

  mapType(tsType: ts.TypeNode | undefined): string {
    if (!tsType) {
      return 'Object';
    }

    switch (tsType.kind) {
      case ts.SyntaxKind.NumberKeyword:
        return 'double';
      case ts.SyntaxKind.StringKeyword:
        return 'String';
      case ts.SyntaxKind.BooleanKeyword:
        return 'boolean';
      case ts.SyntaxKind.VoidKeyword:
        return 'void';
      case ts.SyntaxKind.AnyKeyword:
      case ts.SyntaxKind.UnknownKeyword:
        return 'Object';
      case ts.SyntaxKind.NeverKeyword:
        return 'void';
      case ts.SyntaxKind.NullKeyword:
      case ts.SyntaxKind.UndefinedKeyword:
        return 'Object';
      case ts.SyntaxKind.ArrayType:
        const arrayType = tsType as ts.ArrayTypeNode;
        const elementType = this.mapType(arrayType.elementType);
        this.imports.add('java.util.List');
        return `List<${this.boxPrimitive(elementType)}>`;
      case ts.SyntaxKind.TupleType:
        // Java doesn't have tuples, use List
        this.imports.add('java.util.List');
        return 'List<Object>';
      case ts.SyntaxKind.UnionType:
        const unionType = tsType as ts.UnionTypeNode;
        // Java doesn't have union types, check if it's Optional (T | null/undefined)
        const hasNull = unionType.types.some(t =>
          t.kind === ts.SyntaxKind.NullKeyword || t.kind === ts.SyntaxKind.UndefinedKeyword
        );
        if (hasNull && unionType.types.length === 2) {
          const nonNullType = unionType.types.find(t =>
            t.kind !== ts.SyntaxKind.NullKeyword && t.kind !== ts.SyntaxKind.UndefinedKeyword
          );
          if (nonNullType) {
            this.imports.add('java.util.Optional');
            return `Optional<${this.boxPrimitive(this.mapType(nonNullType))}>`;
          }
        }
        // Otherwise, use Object as fallback
        return 'Object';
      case ts.SyntaxKind.IntersectionType:
        // Java doesn't have direct intersection types, use Object
        return 'Object';
      case ts.SyntaxKind.TypeReference:
        const typeRef = tsType as ts.TypeReferenceNode;
        const typeName = typeRef.typeName.getText();

        // Handle generics
        if (typeRef.typeArguments && typeRef.typeArguments.length > 0) {
          const typeArgs = typeRef.typeArguments.map(t => this.boxPrimitive(this.mapType(t)));

          if (typeName === 'Promise') {
            this.imports.add('java.util.concurrent.CompletableFuture');
            return `CompletableFuture<${typeArgs[0]}>`;
          } else if (typeName === 'Array') {
            this.imports.add('java.util.List');
            return `List<${typeArgs[0]}>`;
          } else if (typeName === 'Map') {
            this.imports.add('java.util.Map');
            return `Map<${typeArgs[0]}, ${typeArgs[1] || 'Object'}>`;
          } else if (typeName === 'Set') {
            this.imports.add('java.util.Set');
            return `Set<${typeArgs[0]}>`;
          } else {
            return `${typeName}<${typeArgs.join(', ')}>`;
          }
        }

        return this.customMappings.get(typeName) || typeName;
      case ts.SyntaxKind.FunctionType:
        const funcType = tsType as ts.FunctionTypeNode;
        const paramTypes = funcType.parameters.map(p => this.mapType(p.type));
        const returnType = this.mapType(funcType.type);

        // Use functional interfaces
        if (paramTypes.length === 0) {
          this.imports.add('java.util.function.Supplier');
          return `Supplier<${this.boxPrimitive(returnType)}>`;
        } else if (paramTypes.length === 1) {
          if (returnType === 'void') {
            this.imports.add('java.util.function.Consumer');
            return `Consumer<${this.boxPrimitive(paramTypes[0])}>`;
          } else {
            this.imports.add('java.util.function.Function');
            return `Function<${this.boxPrimitive(paramTypes[0])}, ${this.boxPrimitive(returnType)}>`;
          }
        } else if (paramTypes.length === 2) {
          this.imports.add('java.util.function.BiFunction');
          return `BiFunction<${this.boxPrimitive(paramTypes[0])}, ${this.boxPrimitive(paramTypes[1])}, ${this.boxPrimitive(returnType)}>`;
        } else {
          // Generic function interface
          return 'Function';
        }
      case ts.SyntaxKind.TypeLiteral:
        this.imports.add('java.util.Map');
        return 'Map<String, Object>';
      default:
        return 'Object';
    }
  }

  /**
   * Box primitive types for generics
   */
  private boxPrimitive(type: string): string {
    switch (type) {
      case 'boolean':
        return 'Boolean';
      case 'byte':
        return 'Byte';
      case 'short':
        return 'Short';
      case 'int':
        return 'Integer';
      case 'long':
        return 'Long';
      case 'float':
        return 'Float';
      case 'double':
        return 'Double';
      case 'char':
        return 'Character';
      default:
        return type;
    }
  }

  getImports(): string[] {
    return Array.from(this.imports).sort();
  }

  clearImports(): void {
    this.imports.clear();
  }
}

/**
 * Java Code Generator
 */
export class JavaGenerator {
  private indent: number = 0;
  private indentSize: number;
  private options: JavaGeneratorOptions;
  private typeMapper: JavaTypeMapper;
  private output: string[] = [];
  private currentClassName: string = '';
  private imports: Set<string> = new Set();

  constructor(options: JavaGeneratorOptions = {}) {
    this.options = {
      version: '17',
      package: 'com.example',
      generateTests: false,
      indentSize: 4,
      preserveComments: true,
      useRecords: true,
      useSealedClasses: false,
      ...options
    };
    this.indentSize = this.options.indentSize!;
    this.typeMapper = new JavaTypeMapper();
  }

  /**
   * Generate Java code from TypeScript AST
   */
  generate(sourceFile: ts.SourceFile): string {
    this.output = [];
    this.indent = 0;
    this.imports = new Set();
    this.typeMapper.clearImports();

    // First pass: analyze what we need
    this.analyzeFile(sourceFile);

    // Write package declaration
    if (this.options.package) {
      this.writeLine(`package ${this.options.package};`);
      this.writeLine('');
    }

    // Collect and write imports
    this.writeImports();

    // Generate code for each statement
    sourceFile.statements.forEach(statement => {
      this.visitNode(statement);
      this.writeLine('');
    });

    return this.output.join('\n');
  }

  /**
   * Analyze file to determine what imports we need
   */
  private analyzeFile(sourceFile: ts.SourceFile): void {
    const visit = (node: ts.Node) => {
      // Detect async functions
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) {
          this.imports.add('java.util.concurrent.CompletableFuture');
        }
      }

      // Detect Collections usage
      if (ts.isArrayTypeNode(node)) {
        this.imports.add('java.util.List');
        this.imports.add('java.util.ArrayList');
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  /**
   * Write import statements
   */
  private writeImports(): void {
    const allImports = new Set([
      ...this.imports,
      ...this.typeMapper.getImports()
    ]);

    if (allImports.size > 0) {
      const sortedImports = Array.from(allImports).sort();
      sortedImports.forEach(imp => this.writeLine(`import ${imp};`));
      this.writeLine('');
    }
  }

  /**
   * Visit a node and generate appropriate Java code
   */
  private visitNode(node: ts.Node): void {
    if (this.options.preserveComments) {
      this.writeLeadingComments(node);
    }

    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration:
        this.visitClassDeclaration(node as ts.ClassDeclaration);
        break;
      case ts.SyntaxKind.FunctionDeclaration:
        this.visitFunctionDeclaration(node as ts.FunctionDeclaration);
        break;
      case ts.SyntaxKind.InterfaceDeclaration:
        this.visitInterfaceDeclaration(node as ts.InterfaceDeclaration);
        break;
      case ts.SyntaxKind.EnumDeclaration:
        this.visitEnumDeclaration(node as ts.EnumDeclaration);
        break;
      case ts.SyntaxKind.TypeAliasDeclaration:
        // Java doesn't have type aliases, convert to interface or skip
        this.writeLine('// Type alias not directly supported in Java');
        break;
      case ts.SyntaxKind.VariableStatement:
        this.visitVariableStatement(node as ts.VariableStatement);
        break;
      case ts.SyntaxKind.ImportDeclaration:
        // Imports are handled separately
        break;
      default:
        this.writeLine(`// TODO: Handle ${ts.SyntaxKind[node.kind]}`);
    }
  }

  /**
   * Visit class declaration
   */
  private visitClassDeclaration(node: ts.ClassDeclaration): void {
    const className = node.name?.text || 'UnnamedClass';
    this.currentClassName = className;

    // Check if should use record (Java 17+)
    const shouldUseRecord = this.shouldUseRecord(node);

    if (shouldUseRecord) {
      this.visitRecordDeclaration(node, className);
      return;
    }

    // Build modifiers
    const modifiers: string[] = [];
    if (node.modifiers) {
      for (const mod of node.modifiers) {
        if (mod.kind === ts.SyntaxKind.ExportKeyword) {
          modifiers.push('public');
        } else if (mod.kind === ts.SyntaxKind.AbstractKeyword) {
          modifiers.push('abstract');
        }
      }
    }

    if (modifiers.length === 0) {
      modifiers.push('public');
    }

    // Handle inheritance
    const baseClass = this.getBaseClass(node);
    const interfaces = this.getInterfaces(node);

    // Write class declaration
    let classDecl = `${modifiers.join(' ')} class ${className}`;

    if (baseClass) {
      classDecl += ` extends ${baseClass}`;
    }

    if (interfaces.length > 0) {
      classDecl += ` implements ${interfaces.join(', ')}`;
    }

    this.writeLine(classDecl + ' {');
    this.increaseIndent();

    // Collect class members
    const properties: ts.PropertyDeclaration[] = [];
    const methods: ts.MethodDeclaration[] = [];
    const constructors: ts.ConstructorDeclaration[] = [];

    for (const member of node.members) {
      if (ts.isPropertyDeclaration(member)) {
        properties.push(member);
      } else if (ts.isMethodDeclaration(member)) {
        methods.push(member);
      } else if (ts.isConstructor(member)) {
        constructors.push(member);
      }
    }

    // Write fields
    for (const prop of properties) {
      this.visitPropertyDeclaration(prop);
    }

    if (properties.length > 0) {
      this.writeLine('');
    }

    // Write constructors
    if (constructors.length > 0) {
      for (const ctor of constructors) {
        this.visitConstructor(ctor, className);
      }
    } else if (properties.length > 0) {
      // Generate default constructor
      this.writeDefaultConstructor(className, properties);
    }

    // Write methods
    for (const method of methods) {
      this.visitMethodDeclaration(method);
      this.writeLine('');
    }

    this.decreaseIndent();
    this.writeLine('}');
  }

  /**
   * Check if class should use record (Java 17+)
   */
  private shouldUseRecord(node: ts.ClassDeclaration): boolean {
    if (!this.options.useRecords || this.options.version === '17') {
      return false;
    }

    // Use record if class has only readonly properties and no methods
    const hasOnlyReadonlyProperties = node.members.every(m => {
      if (ts.isPropertyDeclaration(m)) {
        return m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ReadonlyKeyword);
      }
      return ts.isConstructor(m);
    });

    return hasOnlyReadonlyProperties && node.members.length > 0;
  }

  /**
   * Visit record declaration (Java 17+)
   */
  private visitRecordDeclaration(node: ts.ClassDeclaration, className: string): void {
    // Extract properties
    const properties = node.members.filter(m => ts.isPropertyDeclaration(m)) as ts.PropertyDeclaration[];

    // Build record components
    const components = properties.map(p => {
      const propName = p.name.getText();
      const propType = this.typeMapper.mapType(p.type);
      return `${propType} ${propName}`;
    });

    this.writeLine(`public record ${className}(${components.join(', ')}) {}`);
  }

  /**
   * Get base class from heritage clauses
   */
  private getBaseClass(node: ts.ClassDeclaration): string | null {
    if (!node.heritageClauses) {
      return null;
    }

    for (const clause of node.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
        return clause.types[0]?.expression.getText() || null;
      }
    }

    return null;
  }

  /**
   * Get interfaces from heritage clauses
   */
  private getInterfaces(node: ts.ClassDeclaration): string[] {
    const interfaces: string[] = [];

    if (!node.heritageClauses) {
      return interfaces;
    }

    for (const clause of node.heritageClauses) {
      if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
        for (const type of clause.types) {
          interfaces.push(type.expression.getText());
        }
      }
    }

    return interfaces;
  }

  /**
   * Visit property declaration
   */
  private visitPropertyDeclaration(prop: ts.PropertyDeclaration): void {
    const propName = prop.name.getText();
    const propType = this.typeMapper.mapType(prop.type);

    // Build modifiers
    const modifiers: string[] = ['private'];

    if (prop.modifiers) {
      for (const mod of prop.modifiers) {
        if (mod.kind === ts.SyntaxKind.StaticKeyword) {
          modifiers.unshift('static');
        } else if (mod.kind === ts.SyntaxKind.ReadonlyKeyword) {
          modifiers.push('final');
        }
      }
    }

    let line = `${modifiers.join(' ')} ${propType} ${propName}`;

    if (prop.initializer) {
      line += ` = ${this.visitExpression(prop.initializer)}`;
    }

    line += ';';
    this.writeLine(line);
  }

  /**
   * Visit constructor
   */
  private visitConstructor(node: ts.ConstructorDeclaration, className: string): void {
    const params = node.parameters.map(p => this.visitParameter(p)).join(', ');

    this.writeLine(`public ${className}(${params}) {`);
    this.increaseIndent();

    // Visit body
    if (node.body) {
      this.visitBlock(node.body);
    }

    this.decreaseIndent();
    this.writeLine('}');
    this.writeLine('');
  }

  /**
   * Write default constructor
   */
  private writeDefaultConstructor(className: string, properties: ts.PropertyDeclaration[]): void {
    const params = properties.map(p => {
      const name = p.name.getText();
      const type = this.typeMapper.mapType(p.type);
      return `${type} ${name}`;
    });

    this.writeLine(`public ${className}(${params.join(', ')}) {`);
    this.increaseIndent();

    for (const prop of properties) {
      const name = prop.name.getText();
      this.writeLine(`this.${name} = ${name};`);
    }

    this.decreaseIndent();
    this.writeLine('}');
    this.writeLine('');

    // Generate getters and setters
    for (const prop of properties) {
      const name = prop.name.getText();
      const type = this.typeMapper.mapType(prop.type);
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

      // Getter
      this.writeLine(`public ${type} get${capitalizedName}() {`);
      this.increaseIndent();
      this.writeLine(`return ${name};`);
      this.decreaseIndent();
      this.writeLine('}');
      this.writeLine('');

      // Setter (if not readonly)
      const isReadonly = prop.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword);
      if (!isReadonly) {
        this.writeLine(`public void set${capitalizedName}(${type} ${name}) {`);
        this.increaseIndent();
        this.writeLine(`this.${name} = ${name};`);
        this.decreaseIndent();
        this.writeLine('}');
        this.writeLine('');
      }
    }
  }

  /**
   * Visit method declaration
   */
  private visitMethodDeclaration(node: ts.MethodDeclaration): void {
    const methodName = node.name.getText();
    const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);
    const isStatic = node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword);
    const isAbstract = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AbstractKeyword);

    // Build modifiers
    const modifiers: string[] = ['public'];

    if (isStatic) {
      modifiers.push('static');
    }
    if (isAbstract) {
      modifiers.push('abstract');
    }

    // Build return type
    let returnType = this.typeMapper.mapType(node.type);
    if (isAsync) {
      this.imports.add('java.util.concurrent.CompletableFuture');
      returnType = `CompletableFuture<${this.typeMapper.boxPrimitive(returnType)}>`;
    }

    // Build parameter list
    const params = node.parameters.map(p => this.visitParameter(p)).join(', ');

    // Write method signature
    this.writeLine(`${modifiers.join(' ')} ${returnType} ${methodName}(${params}) {`);
    this.increaseIndent();

    // Visit body
    if (node.body) {
      if (isAsync) {
        this.writeAsyncMethodBody(node.body);
      } else {
        this.visitBlock(node.body);
      }
    } else if (isAbstract) {
      // No body for abstract methods
    } else {
      this.writeLine('// TODO: Implement method');
    }

    this.decreaseIndent();
    this.writeLine('}');
  }

  /**
   * Write async method body using CompletableFuture
   */
  private writeAsyncMethodBody(block: ts.Block): void {
    this.writeLine('return CompletableFuture.supplyAsync(() -> {');
    this.increaseIndent();

    for (const statement of block.statements) {
      this.visitStatement(statement);
    }

    this.writeLine('return null; // TODO: Return actual value');
    this.decreaseIndent();
    this.writeLine('});');
  }

  /**
   * Visit function declaration
   */
  private visitFunctionDeclaration(node: ts.FunctionDeclaration): void {
    const funcName = node.name?.text || 'anonymous';
    const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);

    // Build return type
    let returnType = this.typeMapper.mapType(node.type);
    if (isAsync) {
      this.imports.add('java.util.concurrent.CompletableFuture');
      returnType = `CompletableFuture<${this.typeMapper.boxPrimitive(returnType)}>`;
    }

    // Build parameter list
    const params = node.parameters.map(p => this.visitParameter(p)).join(', ');

    // Write function signature (as static method)
    this.writeLine(`public static ${returnType} ${funcName}(${params}) {`);
    this.increaseIndent();

    // Visit body
    if (node.body) {
      if (isAsync) {
        this.writeAsyncMethodBody(node.body);
      } else {
        this.visitBlock(node.body);
      }
    }

    this.decreaseIndent();
    this.writeLine('}');
  }

  /**
   * Visit parameter
   */
  private visitParameter(param: ts.ParameterDeclaration): string {
    const paramName = param.name.getText();
    const paramType = this.typeMapper.mapType(param.type);

    let result = `${paramType} ${paramName}`;

    // Java doesn't support default parameters directly
    // Would need method overloading

    return result;
  }

  /**
   * Visit interface declaration
   */
  private visitInterfaceDeclaration(node: ts.InterfaceDeclaration): void {
    const interfaceName = node.name.text;

    // Handle inheritance
    const baseInterfaces: string[] = [];
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        for (const type of clause.types) {
          baseInterfaces.push(type.expression.getText());
        }
      }
    }

    let interfaceDecl = `public interface ${interfaceName}`;
    if (baseInterfaces.length > 0) {
      interfaceDecl += ` extends ${baseInterfaces.join(', ')}`;
    }

    this.writeLine(interfaceDecl + ' {');
    this.increaseIndent();

    // Visit members
    for (const member of node.members) {
      if (ts.isPropertySignature(member)) {
        const propName = member.name.getText();
        const propType = this.typeMapper.mapType(member.type);
        const capitalizedName = propName.charAt(0).toUpperCase() + propName.slice(1);

        // Generate getter
        this.writeLine(`${propType} get${capitalizedName}();`);
      } else if (ts.isMethodSignature(member)) {
        const methodName = member.name.getText();
        const returnType = this.typeMapper.mapType(member.type);
        const params = member.parameters.map(p => this.visitParameter(p)).join(', ');
        this.writeLine(`${returnType} ${methodName}(${params});`);
      }
    }

    this.decreaseIndent();
    this.writeLine('}');
  }

  /**
   * Visit enum declaration
   */
  private visitEnumDeclaration(node: ts.EnumDeclaration): void {
    const enumName = node.name.text;

    this.writeLine(`public enum ${enumName} {`);
    this.increaseIndent();

    const members = node.members.map((member, index) => {
      const memberName = member.name.getText().toUpperCase();
      const isLast = index === node.members.length - 1;
      return memberName + (isLast ? '' : ',');
    });

    members.forEach(m => this.writeLine(m));

    this.decreaseIndent();
    this.writeLine('}');
  }

  /**
   * Visit variable statement
   */
  private visitVariableStatement(node: ts.VariableStatement): void {
    for (const declaration of node.declarationList.declarations) {
      const varName = declaration.name.getText();
      const varType = this.typeMapper.mapType(declaration.type);
      const isConst = node.declarationList.flags & ts.NodeFlags.Const;

      let line = 'public static ';
      if (isConst) {
        line += 'final ';
      }
      line += `${varType} ${varName}`;

      if (declaration.initializer) {
        line += ` = ${this.visitExpression(declaration.initializer)}`;
      }

      line += ';';
      this.writeLine(line);
    }
  }

  /**
   * Visit block statement
   */
  private visitBlock(block: ts.Block): void {
    if (block.statements.length === 0) {
      this.writeLine('// Empty block');
      return;
    }

    for (const statement of block.statements) {
      this.visitStatement(statement);
    }
  }

  /**
   * Visit statement
   */
  private visitStatement(node: ts.Statement): void {
    switch (node.kind) {
      case ts.SyntaxKind.ReturnStatement:
        this.visitReturnStatement(node as ts.ReturnStatement);
        break;
      case ts.SyntaxKind.IfStatement:
        this.visitIfStatement(node as ts.IfStatement);
        break;
      case ts.SyntaxKind.ForStatement:
        this.visitForStatement(node as ts.ForStatement);
        break;
      case ts.SyntaxKind.ForOfStatement:
        this.visitForOfStatement(node as ts.ForOfStatement);
        break;
      case ts.SyntaxKind.WhileStatement:
        this.visitWhileStatement(node as ts.WhileStatement);
        break;
      case ts.SyntaxKind.SwitchStatement:
        this.visitSwitchStatement(node as ts.SwitchStatement);
        break;
      case ts.SyntaxKind.TryStatement:
        this.visitTryStatement(node as ts.TryStatement);
        break;
      case ts.SyntaxKind.ThrowStatement:
        this.visitThrowStatement(node as ts.ThrowStatement);
        break;
      case ts.SyntaxKind.VariableStatement:
        this.visitLocalVariableStatement(node as ts.VariableStatement);
        break;
      case ts.SyntaxKind.ExpressionStatement:
        this.visitExpressionStatement(node as ts.ExpressionStatement);
        break;
      case ts.SyntaxKind.Block:
        this.visitBlock(node as ts.Block);
        break;
      default:
        this.writeLine(`// TODO: Handle statement ${ts.SyntaxKind[node.kind]}`);
    }
  }

  /**
   * Visit local variable statement
   */
  private visitLocalVariableStatement(node: ts.VariableStatement): void {
    for (const declaration of node.declarationList.declarations) {
      const varName = declaration.name.getText();
      const varType = this.typeMapper.mapType(declaration.type);
      const isConst = node.declarationList.flags & ts.NodeFlags.Const;

      let line = '';
      if (isConst) {
        line += 'final ';
      }
      line += `${varType} ${varName}`;

      if (declaration.initializer) {
        line += ` = ${this.visitExpression(declaration.initializer)}`;
      }

      line += ';';
      this.writeLine(line);
    }
  }

  /**
   * Visit expression statement
   */
  private visitExpressionStatement(node: ts.ExpressionStatement): void {
    this.writeLine(this.visitExpression(node.expression) + ';');
  }

  /**
   * Visit return statement
   */
  private visitReturnStatement(node: ts.ReturnStatement): void {
    if (node.expression) {
      this.writeLine(`return ${this.visitExpression(node.expression)};`);
    } else {
      this.writeLine('return;');
    }
  }

  /**
   * Visit if statement
   */
  private visitIfStatement(node: ts.IfStatement): void {
    const condition = this.visitExpression(node.expression);
    this.writeLine(`if (${condition}) {`);
    this.increaseIndent();
    this.visitStatement(node.thenStatement);
    this.decreaseIndent();

    if (node.elseStatement) {
      if (ts.isIfStatement(node.elseStatement)) {
        const elifCondition = this.visitExpression(node.elseStatement.expression);
        this.writeLine(`} else if (${elifCondition}) {`);
        this.increaseIndent();
        this.visitStatement(node.elseStatement.thenStatement);
        this.decreaseIndent();

        if (node.elseStatement.elseStatement) {
          this.writeLine('} else {');
          this.increaseIndent();
          this.visitStatement(node.elseStatement.elseStatement);
          this.decreaseIndent();
        }
      } else {
        this.writeLine('} else {');
        this.increaseIndent();
        this.visitStatement(node.elseStatement);
        this.decreaseIndent();
      }
    }

    this.writeLine('}');
  }

  /**
   * Visit for statement
   */
  private visitForStatement(node: ts.ForStatement): void {
    const init = node.initializer ? node.initializer.getText() : '';
    const condition = node.condition ? this.visitExpression(node.condition) : 'true';
    const increment = node.incrementor ? this.visitExpression(node.incrementor) : '';

    this.writeLine(`for (${init}; ${condition}; ${increment}) {`);
    this.increaseIndent();
    this.visitStatement(node.statement);
    this.decreaseIndent();
    this.writeLine('}');
  }

  /**
   * Visit for-of statement
   */
  private visitForOfStatement(node: ts.ForOfStatement): void {
    const varName = node.initializer.getText().replace(/^(let|const|var)\s+/, '');
    const iterable = this.visitExpression(node.expression);

    this.writeLine(`for (var ${varName} : ${iterable}) {`);
    this.increaseIndent();
    this.visitStatement(node.statement);
    this.decreaseIndent();
    this.writeLine('}');
  }

  /**
   * Visit while statement
   */
  private visitWhileStatement(node: ts.WhileStatement): void {
    const condition = this.visitExpression(node.expression);
    this.writeLine(`while (${condition}) {`);
    this.increaseIndent();
    this.visitStatement(node.statement);
    this.decreaseIndent();
    this.writeLine('}');
  }

  /**
   * Visit switch statement
   */
  private visitSwitchStatement(node: ts.SwitchStatement): void {
    const expr = this.visitExpression(node.expression);
    this.writeLine(`switch (${expr}) {`);
    this.increaseIndent();

    for (const clause of node.caseBlock.clauses) {
      if (ts.isCaseClause(clause)) {
        const caseExpr = this.visitExpression(clause.expression);
        this.writeLine(`case ${caseExpr}:`);
        this.increaseIndent();
        for (const statement of clause.statements) {
          this.visitStatement(statement);
        }
        this.writeLine('break;');
        this.decreaseIndent();
      } else if (ts.isDefaultClause(clause)) {
        this.writeLine('default:');
        this.increaseIndent();
        for (const statement of clause.statements) {
          this.visitStatement(statement);
        }
        this.writeLine('break;');
        this.decreaseIndent();
      }
    }

    this.decreaseIndent();
    this.writeLine('}');
  }

  /**
   * Visit try statement
   */
  private visitTryStatement(node: ts.TryStatement): void {
    this.writeLine('try {');
    this.increaseIndent();
    this.visitBlock(node.tryBlock);
    this.decreaseIndent();

    if (node.catchClause) {
      const varName = node.catchClause.variableDeclaration?.name.getText() || 'e';
      this.writeLine(`} catch (Exception ${varName}) {`);
      this.increaseIndent();
      this.visitBlock(node.catchClause.block);
      this.decreaseIndent();
    }

    if (node.finallyBlock) {
      this.writeLine('} finally {');
      this.increaseIndent();
      this.visitBlock(node.finallyBlock);
      this.decreaseIndent();
    }

    this.writeLine('}');
  }

  /**
   * Visit throw statement
   */
  private visitThrowStatement(node: ts.ThrowStatement): void {
    if (node.expression) {
      this.writeLine(`throw new RuntimeException(${this.visitExpression(node.expression)});`);
    } else {
      this.writeLine('throw new RuntimeException();');
    }
  }

  /**
   * Visit expression
   */
  private visitExpression(node: ts.Expression): string {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
        return `"${(node as ts.StringLiteral).text}"`;
      case ts.SyntaxKind.NumericLiteral:
        return (node as ts.NumericLiteral).text;
      case ts.SyntaxKind.TrueKeyword:
        return 'true';
      case ts.SyntaxKind.FalseKeyword:
        return 'false';
      case ts.SyntaxKind.NullKeyword:
        return 'null';
      case ts.SyntaxKind.Identifier:
        return (node as ts.Identifier).text;
      case ts.SyntaxKind.PropertyAccessExpression:
        return this.visitPropertyAccess(node as ts.PropertyAccessExpression);
      case ts.SyntaxKind.CallExpression:
        return this.visitCallExpression(node as ts.CallExpression);
      case ts.SyntaxKind.NewExpression:
        return this.visitNewExpression(node as ts.NewExpression);
      case ts.SyntaxKind.ArrayLiteralExpression:
        return this.visitArrayLiteral(node as ts.ArrayLiteralExpression);
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.visitObjectLiteral(node as ts.ObjectLiteralExpression);
      case ts.SyntaxKind.BinaryExpression:
        return this.visitBinaryExpression(node as ts.BinaryExpression);
      case ts.SyntaxKind.PrefixUnaryExpression:
        return this.visitPrefixUnary(node as ts.PrefixUnaryExpression);
      case ts.SyntaxKind.PostfixUnaryExpression:
        return this.visitPostfixUnary(node as ts.PostfixUnaryExpression);
      case ts.SyntaxKind.ConditionalExpression:
        return this.visitConditional(node as ts.ConditionalExpression);
      case ts.SyntaxKind.AwaitExpression:
        return this.visitAwaitExpression(node as ts.AwaitExpression);
      default:
        return node.getText();
    }
  }

  /**
   * Visit property access expression
   */
  private visitPropertyAccess(node: ts.PropertyAccessExpression): string {
    const object = this.visitExpression(node.expression);
    const property = node.name.text;
    return `${object}.${property}`;
  }

  /**
   * Visit call expression
   */
  private visitCallExpression(node: ts.CallExpression): string {
    const func = this.visitExpression(node.expression);
    const args = node.arguments.map(arg => this.visitExpression(arg)).join(', ');
    return `${func}(${args})`;
  }

  /**
   * Visit new expression
   */
  private visitNewExpression(node: ts.NewExpression): string {
    const className = this.visitExpression(node.expression);
    const args = node.arguments ? node.arguments.map(arg => this.visitExpression(arg)).join(', ') : '';
    return `new ${className}(${args})`;
  }

  /**
   * Visit array literal
   */
  private visitArrayLiteral(node: ts.ArrayLiteralExpression): string {
    this.imports.add('java.util.List');
    const elements = node.elements.map(el => this.visitExpression(el)).join(', ');
    return `List.of(${elements})`;
  }

  /**
   * Visit object literal (convert to Map)
   */
  private visitObjectLiteral(node: ts.ObjectLiteralExpression): string {
    this.imports.add('java.util.Map');
    const properties = node.properties.map(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const key = prop.name.getText();
        const value = this.visitExpression(prop.initializer);
        return `"${key}", ${value}`;
      }
      return '';
    }).filter(p => p);

    return `Map.of(${properties.join(', ')})`;
  }

  /**
   * Visit binary expression
   */
  private visitBinaryExpression(node: ts.BinaryExpression): string {
    const left = this.visitExpression(node.left);
    const right = this.visitExpression(node.right);
    const op = this.convertOperator(node.operatorToken.kind);
    return `${left} ${op} ${right}`;
  }

  /**
   * Convert TypeScript operator to Java
   */
  private convertOperator(kind: ts.SyntaxKind): string {
    switch (kind) {
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
      case ts.SyntaxKind.EqualsEqualsToken:
        return '==';
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsToken:
        return '!=';
      case ts.SyntaxKind.AmpersandAmpersandToken:
        return '&&';
      case ts.SyntaxKind.BarBarToken:
        return '||';
      default:
        return ts.tokenToString(kind) || '';
    }
  }

  /**
   * Visit prefix unary expression
   */
  private visitPrefixUnary(node: ts.PrefixUnaryExpression): string {
    const operand = this.visitExpression(node.operand);
    const op = ts.tokenToString(node.operator) || '';
    return `${op}${operand}`;
  }

  /**
   * Visit postfix unary expression
   */
  private visitPostfixUnary(node: ts.PostfixUnaryExpression): string {
    const operand = this.visitExpression(node.operand);
    const op = ts.tokenToString(node.operator) || '';
    return `${operand}${op}`;
  }

  /**
   * Visit conditional expression
   */
  private visitConditional(node: ts.ConditionalExpression): string {
    const condition = this.visitExpression(node.condition);
    const whenTrue = this.visitExpression(node.whenTrue);
    const whenFalse = this.visitExpression(node.whenFalse);
    return `${condition} ? ${whenTrue} : ${whenFalse}`;
  }

  /**
   * Visit await expression
   */
  private visitAwaitExpression(node: ts.AwaitExpression): string {
    const expr = this.visitExpression(node.expression);
    return `${expr}.join()`; // CompletableFuture.join()
  }

  /**
   * Write leading comments
   */
  private writeLeadingComments(node: ts.Node): void {
    const sourceFile = node.getSourceFile();
    const fullText = sourceFile.getFullText();
    const nodeStart = node.getFullStart();
    const commentRanges = ts.getLeadingCommentRanges(fullText, nodeStart);

    if (!commentRanges) {
      return;
    }

    for (const range of commentRanges) {
      const comment = fullText.substring(range.pos, range.end);

      if (comment.startsWith('//')) {
        this.writeLine(comment);
      } else if (comment.startsWith('/*')) {
        // Convert to Javadoc if it's a block comment
        const lines = comment.split('\n');
        if (comment.startsWith('/**')) {
          // Already Javadoc-style
          lines.forEach(line => this.writeLine(line.trim()));
        } else {
          // Convert to Javadoc
          this.writeLine('/**');
          lines.slice(1, -1).forEach(line => {
            const cleaned = line.trim().replace(/^\*\s*/, '');
            if (cleaned) {
              this.writeLine(` * ${cleaned}`);
            }
          });
          this.writeLine(' */');
        }
      }
    }
  }

  /**
   * Increase indentation
   */
  private increaseIndent(): void {
    this.indent += this.indentSize;
  }

  /**
   * Decrease indentation
   */
  private decreaseIndent(): void {
    this.indent = Math.max(0, this.indent - this.indentSize);
  }

  /**
   * Write a line with current indentation
   */
  private writeLine(text: string): void {
    const indentation = ' '.repeat(this.indent);
    this.output.push(indentation + text);
  }
}
