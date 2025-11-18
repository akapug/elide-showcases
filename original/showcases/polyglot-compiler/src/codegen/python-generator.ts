/**
 * Python Code Generator
 *
 * Generates Python 3.10+ code from TypeScript AST
 * Handles classes, functions, async/await, decorators, types, and more
 */

import * as ts from 'typescript';

export interface PythonGeneratorOptions {
  version?: '3.10' | '3.11' | '3.12';
  useTyping?: boolean;
  useDataclasses?: boolean;
  indentSize?: number;
  preserveComments?: boolean;
}

/**
 * Maps TypeScript types to Python type hints
 */
class TypeMapper {
  private customMappings: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultMappings();
  }

  private initializeDefaultMappings(): void {
    this.customMappings.set('number', 'float');
    this.customMappings.set('string', 'str');
    this.customMappings.set('boolean', 'bool');
    this.customMappings.set('void', 'None');
    this.customMappings.set('any', 'Any');
    this.customMappings.set('unknown', 'Any');
    this.customMappings.set('never', 'NoReturn');
    this.customMappings.set('object', 'dict');
    this.customMappings.set('Array', 'list');
    this.customMappings.set('Map', 'dict');
    this.customMappings.set('Set', 'set');
    this.customMappings.set('Promise', 'Coroutine');
  }

  mapType(tsType: ts.TypeNode | undefined, useTyping: boolean = true): string {
    if (!tsType || !useTyping) {
      return '';
    }

    // Handle different type node kinds
    switch (tsType.kind) {
      case ts.SyntaxKind.NumberKeyword:
        return 'float';
      case ts.SyntaxKind.StringKeyword:
        return 'str';
      case ts.SyntaxKind.BooleanKeyword:
        return 'bool';
      case ts.SyntaxKind.VoidKeyword:
        return 'None';
      case ts.SyntaxKind.AnyKeyword:
        return 'Any';
      case ts.SyntaxKind.UnknownKeyword:
        return 'Any';
      case ts.SyntaxKind.NeverKeyword:
        return 'NoReturn';
      case ts.SyntaxKind.NullKeyword:
        return 'None';
      case ts.SyntaxKind.UndefinedKeyword:
        return 'None';
      case ts.SyntaxKind.ArrayType:
        const arrayType = tsType as ts.ArrayTypeNode;
        const elementType = this.mapType(arrayType.elementType, useTyping);
        return `list[${elementType}]`;
      case ts.SyntaxKind.TupleType:
        const tupleType = tsType as ts.TupleTypeNode;
        const elements = tupleType.elements.map(e => this.mapType(e, useTyping));
        return `tuple[${elements.join(', ')}]`;
      case ts.SyntaxKind.UnionType:
        const unionType = tsType as ts.UnionTypeNode;
        const types = unionType.types.map(t => this.mapType(t, useTyping));
        return `Union[${types.join(', ')}]`;
      case ts.SyntaxKind.IntersectionType:
        // Python doesn't have direct intersection types, use Any
        return 'Any';
      case ts.SyntaxKind.TypeReference:
        const typeRef = tsType as ts.TypeReferenceNode;
        const typeName = typeRef.typeName.getText();

        // Handle generics
        if (typeRef.typeArguments && typeRef.typeArguments.length > 0) {
          const baseType = this.customMappings.get(typeName) || typeName;
          const typeArgs = typeRef.typeArguments.map(t => this.mapType(t, useTyping));

          if (typeName === 'Promise') {
            return `Coroutine[Any, Any, ${typeArgs[0]}]`;
          } else if (typeName === 'Array') {
            return `list[${typeArgs[0]}]`;
          } else if (typeName === 'Map') {
            return `dict[${typeArgs[0]}, ${typeArgs[1] || 'Any'}]`;
          } else if (typeName === 'Set') {
            return `set[${typeArgs[0]}]`;
          } else {
            return `${baseType}[${typeArgs.join(', ')}]`;
          }
        }

        return this.customMappings.get(typeName) || typeName;
      case ts.SyntaxKind.FunctionType:
        const funcType = tsType as ts.FunctionTypeNode;
        const paramTypes = funcType.parameters.map(p =>
          this.mapType(p.type, useTyping)
        ).join(', ');
        const returnType = this.mapType(funcType.type, useTyping);
        return `Callable[[${paramTypes}], ${returnType}]`;
      case ts.SyntaxKind.TypeLiteral:
        return 'dict';
      default:
        return 'Any';
    }
  }

  getImportsNeeded(types: Set<string>): string[] {
    const imports: string[] = [];
    const typingImports = new Set<string>();

    for (const type of types) {
      if (type.includes('Union')) typingImports.add('Union');
      if (type.includes('Optional')) typingImports.add('Optional');
      if (type.includes('Any')) typingImports.add('Any');
      if (type.includes('Callable')) typingImports.add('Callable');
      if (type.includes('Coroutine')) typingImports.add('Coroutine');
      if (type.includes('NoReturn')) typingImports.add('NoReturn');
    }

    if (typingImports.size > 0) {
      imports.push(`from typing import ${Array.from(typingImports).join(', ')}`);
    }

    return imports;
  }
}

/**
 * Python Code Generator
 */
export class PythonGenerator {
  private indent: number = 0;
  private indentSize: number;
  private options: PythonGeneratorOptions;
  private typeMapper: TypeMapper;
  private output: string[] = [];
  private usedTypes: Set<string> = new Set();
  private imports: Set<string> = new Set();
  private needsAsyncio: boolean = false;
  private needsDataclasses: boolean = false;

  constructor(options: PythonGeneratorOptions = {}) {
    this.options = {
      version: '3.10',
      useTyping: true,
      useDataclasses: true,
      indentSize: 4,
      preserveComments: true,
      ...options
    };
    this.indentSize = this.options.indentSize!;
    this.typeMapper = new TypeMapper();
  }

  /**
   * Generate Python code from TypeScript AST
   */
  generate(sourceFile: ts.SourceFile): string {
    this.output = [];
    this.indent = 0;
    this.usedTypes = new Set();
    this.imports = new Set();
    this.needsAsyncio = false;
    this.needsDataclasses = false;

    // Generate header comment
    this.writeLine('"""');
    this.writeLine(`Generated Python code from TypeScript`);
    this.writeLine(`Source: ${sourceFile.fileName}`);
    this.writeLine('"""');
    this.writeLine('');

    // Visit all nodes to determine needed imports
    this.analyzeImports(sourceFile);

    // Write imports
    this.writeImports();

    // Generate code for each statement
    sourceFile.statements.forEach(statement => {
      this.visitNode(statement);
      this.writeLine('');
    });

    return this.output.join('\n');
  }

  /**
   * Analyze AST to determine needed imports
   */
  private analyzeImports(node: ts.Node): void {
    const visit = (n: ts.Node) => {
      // Check for async functions
      if (ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n) || ts.isArrowFunction(n)) {
        if (n.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword)) {
          this.needsAsyncio = true;
        }
      }

      // Check for classes with decorators
      if (ts.isClassDeclaration(n)) {
        if (n.modifiers?.some(m => m.kind === ts.SyntaxKind.AbstractKeyword)) {
          this.imports.add('from abc import ABC, abstractmethod');
        }
        if (this.shouldUseDataclass(n)) {
          this.needsDataclasses = true;
        }
      }

      ts.forEachChild(n, visit);
    };

    visit(node);
  }

  /**
   * Write import statements
   */
  private writeImports(): void {
    const allImports: string[] = [];

    // Standard library imports
    if (this.needsAsyncio) {
      allImports.push('import asyncio');
    }
    if (this.needsDataclasses) {
      allImports.push('from dataclasses import dataclass, field');
    }

    // Typing imports
    if (this.options.useTyping && this.usedTypes.size > 0) {
      const typingImports = this.typeMapper.getImportsNeeded(this.usedTypes);
      allImports.push(...typingImports);
    }

    // Custom imports
    allImports.push(...Array.from(this.imports));

    if (allImports.length > 0) {
      allImports.forEach(imp => this.writeLine(imp));
      this.writeLine('');
    }
  }

  /**
   * Visit a node and generate appropriate Python code
   */
  private visitNode(node: ts.Node): void {
    // Handle comments
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
      case ts.SyntaxKind.TypeAliasDeclaration:
        this.visitTypeAliasDeclaration(node as ts.TypeAliasDeclaration);
        break;
      case ts.SyntaxKind.EnumDeclaration:
        this.visitEnumDeclaration(node as ts.EnumDeclaration);
        break;
      case ts.SyntaxKind.VariableStatement:
        this.visitVariableStatement(node as ts.VariableStatement);
        break;
      case ts.SyntaxKind.ExpressionStatement:
        this.visitExpressionStatement(node as ts.ExpressionStatement);
        break;
      case ts.SyntaxKind.ImportDeclaration:
        this.visitImportDeclaration(node as ts.ImportDeclaration);
        break;
      case ts.SyntaxKind.ExportDeclaration:
      case ts.SyntaxKind.ExportAssignment:
        // Python doesn't have explicit exports
        break;
      default:
        // For unhandled nodes, add a comment
        this.writeLine(`# TODO: Handle ${ts.SyntaxKind[node.kind]}`);
    }
  }

  /**
   * Visit class declaration
   */
  private visitClassDeclaration(node: ts.ClassDeclaration): void {
    const className = node.name?.text || 'UnnamedClass';
    const baseClasses: string[] = [];

    // Handle inheritance
    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        for (const type of clause.types) {
          const baseName = type.expression.getText();
          if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
            baseClasses.push(baseName);
          } else if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
            // In Python, we treat implements as extends for protocols
            baseClasses.push(baseName);
          }
        }
      }
    }

    // Check for abstract class
    const isAbstract = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AbstractKeyword);
    if (isAbstract && !baseClasses.includes('ABC')) {
      baseClasses.unshift('ABC');
    }

    // Check if should use dataclass
    const useDataclass = this.shouldUseDataclass(node);
    if (useDataclass) {
      this.writeLine('@dataclass');
    }

    // Write decorators
    if (node.decorators) {
      for (const decorator of node.decorators) {
        this.writeLine(`@${decorator.expression.getText()}`);
      }
    }

    // Write class declaration
    const bases = baseClasses.length > 0 ? `(${baseClasses.join(', ')})` : '';
    this.writeLine(`class ${className}${bases}:`);
    this.increaseIndent();

    // Write docstring if there are JSDoc comments
    const docstring = this.getDocstring(node);
    if (docstring) {
      this.writeLine(`"""${docstring}"""`);
    }

    // Collect class members
    const properties: ts.PropertyDeclaration[] = [];
    const methods: ts.MethodDeclaration[] = [];
    const constructor: ts.ConstructorDeclaration[] = [];

    for (const member of node.members) {
      if (ts.isPropertyDeclaration(member)) {
        properties.push(member);
      } else if (ts.isMethodDeclaration(member)) {
        methods.push(member);
      } else if (ts.isConstructor(member)) {
        constructor.push(member);
      }
    }

    // Write class properties (for dataclass or type hints)
    if (useDataclass) {
      for (const prop of properties) {
        this.visitDataclassProperty(prop);
      }
    } else if (properties.length > 0 && this.options.useTyping) {
      // Write type annotations
      for (const prop of properties) {
        const propName = prop.name.getText();
        const propType = this.typeMapper.mapType(prop.type, this.options.useTyping!);
        if (propType) {
          this.writeLine(`${propName}: ${propType}`);
          this.usedTypes.add(propType);
        }
      }
      this.writeLine('');
    }

    // Write constructor
    if (constructor.length > 0) {
      this.visitConstructor(constructor[0], properties);
    } else if (!useDataclass && properties.length > 0) {
      // Generate default constructor
      this.writeDefaultConstructor(properties);
    }

    // Write methods
    for (const method of methods) {
      this.visitMethodDeclaration(method);
      this.writeLine('');
    }

    // If class is empty, add pass
    if (node.members.length === 0) {
      this.writeLine('pass');
    }

    this.decreaseIndent();
  }

  /**
   * Check if class should use dataclass decorator
   */
  private shouldUseDataclass(node: ts.ClassDeclaration): boolean {
    if (!this.options.useDataclasses) {
      return false;
    }

    // Use dataclass if class has only properties and no complex methods
    const hasOnlyProperties = node.members.every(m =>
      ts.isPropertyDeclaration(m) || ts.isConstructor(m)
    );

    return hasOnlyProperties;
  }

  /**
   * Visit dataclass property
   */
  private visitDataclassProperty(prop: ts.PropertyDeclaration): void {
    const propName = prop.name.getText();
    const propType = this.typeMapper.mapType(prop.type, this.options.useTyping!);

    let line = propName;
    if (propType) {
      line += `: ${propType}`;
      this.usedTypes.add(propType);
    }

    // Handle initializer
    if (prop.initializer) {
      const defaultValue = this.visitExpression(prop.initializer);
      line += ` = ${defaultValue}`;
    } else if (!prop.questionToken) {
      // No default and not optional - no default value needed
    } else {
      // Optional property
      line += ' = None';
    }

    this.writeLine(line);
  }

  /**
   * Visit constructor
   */
  private visitConstructor(node: ts.ConstructorDeclaration, properties: ts.PropertyDeclaration[]): void {
    const params = node.parameters.map(p => this.visitParameter(p)).join(', ');
    this.writeLine(`def __init__(self${params ? ', ' + params : ''}):`);
    this.increaseIndent();

    // Write docstring
    const docstring = this.getDocstring(node);
    if (docstring) {
      this.writeLine(`"""${docstring}"""`);
    }

    // Visit body
    if (node.body) {
      this.visitBlock(node.body);
    } else {
      this.writeLine('pass');
    }

    this.decreaseIndent();
  }

  /**
   * Write default constructor for properties
   */
  private writeDefaultConstructor(properties: ts.PropertyDeclaration[]): void {
    const params = properties.map(p => {
      const name = p.name.getText();
      const type = this.typeMapper.mapType(p.type, this.options.useTyping!);
      let param = name;
      if (type) {
        param += `: ${type}`;
        this.usedTypes.add(type);
      }
      if (p.initializer) {
        param += ` = ${this.visitExpression(p.initializer)}`;
      } else if (p.questionToken) {
        param += ' = None';
      }
      return param;
    });

    this.writeLine(`def __init__(self${params.length > 0 ? ', ' + params.join(', ') : ''}):`);
    this.increaseIndent();

    // Assign properties
    for (const prop of properties) {
      const name = prop.name.getText();
      this.writeLine(`self.${name} = ${name}`);
    }

    this.decreaseIndent();
    this.writeLine('');
  }

  /**
   * Visit method declaration
   */
  private visitMethodDeclaration(node: ts.MethodDeclaration): void {
    const methodName = node.name.getText();
    const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);
    const isStatic = node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword);
    const isAbstract = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AbstractKeyword);

    // Write decorators
    if (isStatic) {
      this.writeLine('@staticmethod');
    }
    if (isAbstract) {
      this.writeLine('@abstractmethod');
    }

    // Build parameter list
    const params: string[] = isStatic ? [] : ['self'];
    for (const param of node.parameters) {
      params.push(this.visitParameter(param));
    }

    // Build return type
    const returnType = this.typeMapper.mapType(node.type, this.options.useTyping!);
    const returnTypeStr = returnType ? ` -> ${returnType}` : '';
    if (returnType) {
      this.usedTypes.add(returnType);
    }

    // Write method signature
    const asyncPrefix = isAsync ? 'async ' : '';
    this.writeLine(`${asyncPrefix}def ${methodName}(${params.join(', ')})${returnTypeStr}:`);
    this.increaseIndent();

    // Write docstring
    const docstring = this.getDocstring(node);
    if (docstring) {
      this.writeLine(`"""${docstring}"""`);
    }

    // Visit body
    if (node.body) {
      this.visitBlock(node.body);
    } else if (isAbstract) {
      this.writeLine('pass');
    } else {
      this.writeLine('pass');
    }

    this.decreaseIndent();
  }

  /**
   * Visit function declaration
   */
  private visitFunctionDeclaration(node: ts.FunctionDeclaration): void {
    const funcName = node.name?.text || 'anonymous';
    const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword);

    // Build parameter list
    const params = node.parameters.map(p => this.visitParameter(p));

    // Build return type
    const returnType = this.typeMapper.mapType(node.type, this.options.useTyping!);
    const returnTypeStr = returnType ? ` -> ${returnType}` : '';
    if (returnType) {
      this.usedTypes.add(returnType);
    }

    // Write function signature
    const asyncPrefix = isAsync ? 'async ' : '';
    this.writeLine(`${asyncPrefix}def ${funcName}(${params.join(', ')})${returnTypeStr}:`);
    this.increaseIndent();

    // Write docstring
    const docstring = this.getDocstring(node);
    if (docstring) {
      this.writeLine(`"""${docstring}"""`);
    }

    // Visit body
    if (node.body) {
      this.visitBlock(node.body);
    } else {
      this.writeLine('pass');
    }

    this.decreaseIndent();
  }

  /**
   * Visit parameter
   */
  private visitParameter(param: ts.ParameterDeclaration): string {
    const paramName = param.name.getText();
    const paramType = this.typeMapper.mapType(param.type, this.options.useTyping!);

    let result = paramName;

    if (paramType) {
      result += `: ${paramType}`;
      this.usedTypes.add(paramType);
    }

    if (param.initializer) {
      result += ` = ${this.visitExpression(param.initializer)}`;
    } else if (param.questionToken) {
      result += ' = None';
    }

    return result;
  }

  /**
   * Visit interface declaration (convert to class or Protocol)
   */
  private visitInterfaceDeclaration(node: ts.InterfaceDeclaration): void {
    const interfaceName = node.name.text;

    // In Python, we can use typing.Protocol for interfaces
    this.imports.add('from typing import Protocol');

    this.writeLine(`class ${interfaceName}(Protocol):`);
    this.increaseIndent();

    const docstring = this.getDocstring(node);
    if (docstring) {
      this.writeLine(`"""${docstring}"""`);
    }

    // Visit members
    for (const member of node.members) {
      if (ts.isPropertySignature(member)) {
        const propName = member.name.getText();
        const propType = this.typeMapper.mapType(member.type, this.options.useTyping!);
        if (propType) {
          this.writeLine(`${propName}: ${propType}`);
          this.usedTypes.add(propType);
        }
      } else if (ts.isMethodSignature(member)) {
        const methodName = member.name.getText();
        const params = member.parameters.map(p => this.visitParameter(p));
        const returnType = this.typeMapper.mapType(member.type, this.options.useTyping!);
        const returnTypeStr = returnType ? ` -> ${returnType}` : '';
        if (returnType) {
          this.usedTypes.add(returnType);
        }
        this.writeLine(`def ${methodName}(self${params.length > 0 ? ', ' + params.join(', ') : ''})${returnTypeStr}: ...`);
      }
    }

    if (node.members.length === 0) {
      this.writeLine('pass');
    }

    this.decreaseIndent();
  }

  /**
   * Visit type alias declaration
   */
  private visitTypeAliasDeclaration(node: ts.TypeAliasDeclaration): void {
    const aliasName = node.name.text;
    const aliasType = this.typeMapper.mapType(node.type, this.options.useTyping!);

    if (aliasType) {
      this.writeLine(`${aliasName} = ${aliasType}`);
      this.usedTypes.add(aliasType);
    }
  }

  /**
   * Visit enum declaration
   */
  private visitEnumDeclaration(node: ts.EnumDeclaration): void {
    const enumName = node.name.text;

    this.imports.add('from enum import Enum');

    this.writeLine(`class ${enumName}(Enum):`);
    this.increaseIndent();

    for (const member of node.members) {
      const memberName = member.name.getText();
      const value = member.initializer ? this.visitExpression(member.initializer) : `'${memberName}'`;
      this.writeLine(`${memberName} = ${value}`);
    }

    if (node.members.length === 0) {
      this.writeLine('pass');
    }

    this.decreaseIndent();
  }

  /**
   * Visit variable statement
   */
  private visitVariableStatement(node: ts.VariableStatement): void {
    for (const declaration of node.declarationList.declarations) {
      const varName = declaration.name.getText();
      const varType = this.typeMapper.mapType(declaration.type, this.options.useTyping!);

      let line = varName;

      if (varType) {
        line += `: ${varType}`;
        this.usedTypes.add(varType);
      }

      if (declaration.initializer) {
        line += ` = ${this.visitExpression(declaration.initializer)}`;
      }

      this.writeLine(line);
    }
  }

  /**
   * Visit expression statement
   */
  private visitExpressionStatement(node: ts.ExpressionStatement): void {
    this.writeLine(this.visitExpression(node.expression));
  }

  /**
   * Visit import declaration
   */
  private visitImportDeclaration(node: ts.ImportDeclaration): void {
    const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;

    if (node.importClause) {
      const imports: string[] = [];

      // Default import
      if (node.importClause.name) {
        imports.push(node.importClause.name.text);
      }

      // Named imports
      if (node.importClause.namedBindings) {
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          for (const element of node.importClause.namedBindings.elements) {
            imports.push(element.name.text);
          }
        } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          // import * as name
          const name = node.importClause.namedBindings.name.text;
          this.writeLine(`import ${moduleSpecifier} as ${name}`);
          return;
        }
      }

      if (imports.length > 0) {
        this.writeLine(`from ${moduleSpecifier} import ${imports.join(', ')}`);
      }
    } else {
      this.writeLine(`import ${moduleSpecifier}`);
    }
  }

  /**
   * Visit block statement
   */
  private visitBlock(block: ts.Block): void {
    if (block.statements.length === 0) {
      this.writeLine('pass');
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
        this.visitVariableStatement(node as ts.VariableStatement);
        break;
      case ts.SyntaxKind.ExpressionStatement:
        this.visitExpressionStatement(node as ts.ExpressionStatement);
        break;
      case ts.SyntaxKind.Block:
        this.visitBlock(node as ts.Block);
        break;
      default:
        this.writeLine(`# TODO: Handle statement ${ts.SyntaxKind[node.kind]}`);
    }
  }

  /**
   * Visit return statement
   */
  private visitReturnStatement(node: ts.ReturnStatement): void {
    if (node.expression) {
      this.writeLine(`return ${this.visitExpression(node.expression)}`);
    } else {
      this.writeLine('return');
    }
  }

  /**
   * Visit if statement
   */
  private visitIfStatement(node: ts.IfStatement): void {
    const condition = this.visitExpression(node.expression);
    this.writeLine(`if ${condition}:`);
    this.increaseIndent();
    this.visitStatement(node.thenStatement);
    this.decreaseIndent();

    if (node.elseStatement) {
      if (ts.isIfStatement(node.elseStatement)) {
        // elif
        const elifCondition = this.visitExpression(node.elseStatement.expression);
        this.writeLine(`elif ${elifCondition}:`);
        this.increaseIndent();
        this.visitStatement(node.elseStatement.thenStatement);
        this.decreaseIndent();

        if (node.elseStatement.elseStatement) {
          this.writeLine('else:');
          this.increaseIndent();
          this.visitStatement(node.elseStatement.elseStatement);
          this.decreaseIndent();
        }
      } else {
        this.writeLine('else:');
        this.increaseIndent();
        this.visitStatement(node.elseStatement);
        this.decreaseIndent();
      }
    }
  }

  /**
   * Visit for statement
   */
  private visitForStatement(node: ts.ForStatement): void {
    // Convert TypeScript for loop to Python
    // for (let i = 0; i < n; i++) => for i in range(n):

    if (node.initializer && node.condition && node.incrementor) {
      // Try to detect simple range-based for loop
      const initText = node.initializer.getText();
      const condText = node.condition.getText();
      const incText = node.incrementor.getText();

      // Simple heuristic: look for i = 0; i < n; i++
      const match = initText.match(/(\w+)\s*=\s*(\d+)/);
      if (match) {
        const varName = match[1];
        const startVal = match[2];

        // Extract end value from condition
        const endMatch = condText.match(/\w+\s*<\s*(.+)/);
        if (endMatch) {
          const endVal = endMatch[1];
          this.writeLine(`for ${varName} in range(${startVal}, ${endVal}):`);
          this.increaseIndent();
          this.visitStatement(node.statement);
          this.decreaseIndent();
          return;
        }
      }
    }

    // Fallback: convert to while loop
    if (node.initializer) {
      this.visitStatement(node.initializer as ts.Statement);
    }

    const condition = node.condition ? this.visitExpression(node.condition) : 'True';
    this.writeLine(`while ${condition}:`);
    this.increaseIndent();
    this.visitStatement(node.statement);

    if (node.incrementor) {
      this.writeLine(this.visitExpression(node.incrementor));
    }

    this.decreaseIndent();
  }

  /**
   * Visit for-of statement
   */
  private visitForOfStatement(node: ts.ForOfStatement): void {
    const varName = node.initializer.getText().replace(/^(let|const|var)\s+/, '');
    const iterable = this.visitExpression(node.expression);

    this.writeLine(`for ${varName} in ${iterable}:`);
    this.increaseIndent();
    this.visitStatement(node.statement);
    this.decreaseIndent();
  }

  /**
   * Visit while statement
   */
  private visitWhileStatement(node: ts.WhileStatement): void {
    const condition = this.visitExpression(node.expression);
    this.writeLine(`while ${condition}:`);
    this.increaseIndent();
    this.visitStatement(node.statement);
    this.decreaseIndent();
  }

  /**
   * Visit switch statement
   */
  private visitSwitchStatement(node: ts.SwitchStatement): void {
    // Python 3.10+ has match-case
    if (this.options.version !== '3.10' && this.options.version !== '3.11' && this.options.version !== '3.12') {
      // Fallback to if-elif for older Python
      this.visitSwitchAsIfElif(node);
      return;
    }

    const expr = this.visitExpression(node.expression);
    this.writeLine(`match ${expr}:`);
    this.increaseIndent();

    for (const clause of node.caseBlock.clauses) {
      if (ts.isCaseClause(clause)) {
        const caseExpr = this.visitExpression(clause.expression);
        this.writeLine(`case ${caseExpr}:`);
        this.increaseIndent();
        for (const statement of clause.statements) {
          this.visitStatement(statement);
        }
        this.decreaseIndent();
      } else if (ts.isDefaultClause(clause)) {
        this.writeLine('case _:');
        this.increaseIndent();
        for (const statement of clause.statements) {
          this.visitStatement(statement);
        }
        this.decreaseIndent();
      }
    }

    this.decreaseIndent();
  }

  /**
   * Visit switch as if-elif (for Python < 3.10)
   */
  private visitSwitchAsIfElif(node: ts.SwitchStatement): void {
    const expr = this.visitExpression(node.expression);
    let first = true;

    for (const clause of node.caseBlock.clauses) {
      if (ts.isCaseClause(clause)) {
        const caseExpr = this.visitExpression(clause.expression);
        const keyword = first ? 'if' : 'elif';
        this.writeLine(`${keyword} ${expr} == ${caseExpr}:`);
        first = false;
        this.increaseIndent();
        for (const statement of clause.statements) {
          this.visitStatement(statement);
        }
        this.decreaseIndent();
      } else if (ts.isDefaultClause(clause)) {
        this.writeLine('else:');
        this.increaseIndent();
        for (const statement of clause.statements) {
          this.visitStatement(statement);
        }
        this.decreaseIndent();
      }
    }
  }

  /**
   * Visit try statement
   */
  private visitTryStatement(node: ts.TryStatement): void {
    this.writeLine('try:');
    this.increaseIndent();
    this.visitBlock(node.tryBlock);
    this.decreaseIndent();

    if (node.catchClause) {
      const varName = node.catchClause.variableDeclaration?.name.getText() || 'e';
      this.writeLine(`except Exception as ${varName}:`);
      this.increaseIndent();
      this.visitBlock(node.catchClause.block);
      this.decreaseIndent();
    }

    if (node.finallyBlock) {
      this.writeLine('finally:');
      this.increaseIndent();
      this.visitBlock(node.finallyBlock);
      this.decreaseIndent();
    }
  }

  /**
   * Visit throw statement
   */
  private visitThrowStatement(node: ts.ThrowStatement): void {
    if (node.expression) {
      this.writeLine(`raise ${this.visitExpression(node.expression)}`);
    } else {
      this.writeLine('raise');
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
        return 'True';
      case ts.SyntaxKind.FalseKeyword:
        return 'False';
      case ts.SyntaxKind.NullKeyword:
        return 'None';
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
      case ts.SyntaxKind.ArrowFunction:
        return this.visitArrowFunction(node as ts.ArrowFunction);
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
    return `${className}(${args})`;
  }

  /**
   * Visit array literal
   */
  private visitArrayLiteral(node: ts.ArrayLiteralExpression): string {
    const elements = node.elements.map(el => this.visitExpression(el)).join(', ');
    return `[${elements}]`;
  }

  /**
   * Visit object literal
   */
  private visitObjectLiteral(node: ts.ObjectLiteralExpression): string {
    const properties = node.properties.map(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const key = prop.name.getText();
        const value = this.visitExpression(prop.initializer);
        return `"${key}": ${value}`;
      }
      return '';
    }).filter(p => p);

    return `{${properties.join(', ')}}`;
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
   * Convert TypeScript operator to Python
   */
  private convertOperator(kind: ts.SyntaxKind): string {
    switch (kind) {
      case ts.SyntaxKind.EqualsEqualsToken:
      case ts.SyntaxKind.EqualsEqualsEqualsToken:
        return '==';
      case ts.SyntaxKind.ExclamationEqualsToken:
      case ts.SyntaxKind.ExclamationEqualsEqualsToken:
        return '!=';
      case ts.SyntaxKind.AmpersandAmpersandToken:
        return 'and';
      case ts.SyntaxKind.BarBarToken:
        return 'or';
      case ts.SyntaxKind.ExclamationToken:
        return 'not';
      default:
        return ts.tokenToString(kind) || '';
    }
  }

  /**
   * Visit prefix unary expression
   */
  private visitPrefixUnary(node: ts.PrefixUnaryExpression): string {
    const operand = this.visitExpression(node.operand);
    const op = this.convertOperator(node.operator);
    return `${op}${operand}`;
  }

  /**
   * Visit postfix unary expression
   */
  private visitPostfixUnary(node: ts.PostfixUnaryExpression): string {
    const operand = this.visitExpression(node.operand);
    // Python doesn't have ++ or --, convert to += 1 or -= 1
    if (node.operator === ts.SyntaxKind.PlusPlusToken) {
      return `${operand} + 1`;
    } else if (node.operator === ts.SyntaxKind.MinusMinusToken) {
      return `${operand} - 1`;
    }
    return operand;
  }

  /**
   * Visit conditional expression
   */
  private visitConditional(node: ts.ConditionalExpression): string {
    const condition = this.visitExpression(node.condition);
    const whenTrue = this.visitExpression(node.whenTrue);
    const whenFalse = this.visitExpression(node.whenFalse);
    return `${whenTrue} if ${condition} else ${whenFalse}`;
  }

  /**
   * Visit arrow function
   */
  private visitArrowFunction(node: ts.ArrowFunction): string {
    const params = node.parameters.map(p => p.name.getText()).join(', ');

    if (ts.isBlock(node.body)) {
      // Multi-line lambda not directly supported, would need def
      return `lambda ${params}: ...`;
    } else {
      const body = this.visitExpression(node.body);
      return `lambda ${params}: ${body}`;
    }
  }

  /**
   * Visit await expression
   */
  private visitAwaitExpression(node: ts.AwaitExpression): string {
    const expr = this.visitExpression(node.expression);
    return `await ${expr}`;
  }

  /**
   * Get docstring from JSDoc comments
   */
  private getDocstring(node: ts.Node): string {
    const sourceFile = node.getSourceFile();
    const fullText = sourceFile.getFullText();
    const nodeStart = node.getFullStart();
    const commentRanges = ts.getLeadingCommentRanges(fullText, nodeStart);

    if (!commentRanges || commentRanges.length === 0) {
      return '';
    }

    const lastComment = commentRanges[commentRanges.length - 1];
    const commentText = fullText.substring(lastComment.pos, lastComment.end);

    // Extract text from JSDoc comment
    const lines = commentText.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('/**') && !line.startsWith('*/') && !line.startsWith('*'))
      .map(line => line.replace(/^\*\s*/, ''));

    return lines.join(' ').trim();
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
      const lines = comment.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('//')) {
          this.writeLine(`#${trimmed.substring(2)}`);
        } else if (trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          const cleaned = trimmed.replace(/^\/\*+|\*+\/$/g, '').replace(/^\*\s*/, '');
          if (cleaned) {
            this.writeLine(`# ${cleaned}`);
          }
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
