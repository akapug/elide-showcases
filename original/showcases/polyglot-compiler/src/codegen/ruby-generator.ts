/**
 * Ruby Code Generator
 *
 * Generates Ruby 3.0+ code from TypeScript AST
 * Handles classes, modules, metaprogramming, blocks, and more
 */

import * as ts from 'typescript';

export interface RubyGeneratorOptions {
  version?: '3.0' | '3.1' | '3.2';
  useSorbet?: boolean;
  indentSize?: number;
  preserveComments?: boolean;
  useModules?: boolean;
}

/**
 * Maps TypeScript types to Ruby/Sorbet types
 */
class RubyTypeMapper {
  private customMappings: Map<string, string> = new Map();

  constructor() {
    this.initializeDefaultMappings();
  }

  private initializeDefaultMappings(): void {
    this.customMappings.set('number', 'Numeric');
    this.customMappings.set('string', 'String');
    this.customMappings.set('boolean', 'T::Boolean');
    this.customMappings.set('void', 'void');
    this.customMappings.set('any', 'T.untyped');
    this.customMappings.set('unknown', 'T.untyped');
    this.customMappings.set('never', 'T.noreturn');
    this.customMappings.set('object', 'Hash');
    this.customMappings.set('Array', 'Array');
    this.customMappings.set('Map', 'Hash');
    this.customMappings.set('Set', 'Set');
    this.customMappings.set('Promise', 'T.untyped');
  }

  mapType(tsType: ts.TypeNode | undefined, useSorbet: boolean = true): string {
    if (!tsType || !useSorbet) {
      return '';
    }

    switch (tsType.kind) {
      case ts.SyntaxKind.NumberKeyword:
        return 'Numeric';
      case ts.SyntaxKind.StringKeyword:
        return 'String';
      case ts.SyntaxKind.BooleanKeyword:
        return 'T::Boolean';
      case ts.SyntaxKind.VoidKeyword:
        return 'void';
      case ts.SyntaxKind.AnyKeyword:
      case ts.SyntaxKind.UnknownKeyword:
        return 'T.untyped';
      case ts.SyntaxKind.NeverKeyword:
        return 'T.noreturn';
      case ts.SyntaxKind.NullKeyword:
      case ts.SyntaxKind.UndefinedKeyword:
        return 'NilClass';
      case ts.SyntaxKind.ArrayType:
        const arrayType = tsType as ts.ArrayTypeNode;
        const elementType = this.mapType(arrayType.elementType, useSorbet);
        return `T::Array[${elementType}]`;
      case ts.SyntaxKind.TupleType:
        const tupleType = tsType as ts.TupleTypeNode;
        const elements = tupleType.elements.map(e => this.mapType(e, useSorbet));
        return `[${elements.join(', ')}]`;
      case ts.SyntaxKind.UnionType:
        const unionType = tsType as ts.UnionTypeNode;
        const types = unionType.types.map(t => this.mapType(t, useSorbet));
        return `T.any(${types.join(', ')})`;
      case ts.SyntaxKind.TypeReference:
        const typeRef = tsType as ts.TypeReferenceNode;
        const typeName = typeRef.typeName.getText();

        if (typeRef.typeArguments && typeRef.typeArguments.length > 0) {
          const baseType = this.customMappings.get(typeName) || typeName;
          const typeArgs = typeRef.typeArguments.map(t => this.mapType(t, useSorbet));

          if (typeName === 'Array') {
            return `T::Array[${typeArgs[0]}]`;
          } else if (typeName === 'Map') {
            return `T::Hash[${typeArgs[0]}, ${typeArgs[1] || 'T.untyped'}]`;
          } else if (typeName === 'Set') {
            return `T::Set[${typeArgs[0]}]`;
          } else if (typeName === 'Promise') {
            return typeArgs[0]; // Ruby doesn't have promises
          } else {
            return `${baseType}[${typeArgs.join(', ')}]`;
          }
        }

        return this.customMappings.get(typeName) || typeName;
      case ts.SyntaxKind.FunctionType:
        return 'T.proc';
      case ts.SyntaxKind.TypeLiteral:
        return 'Hash';
      default:
        return 'T.untyped';
    }
  }

  getSorbetSig(params: ts.NodeArray<ts.ParameterDeclaration>, returnType: ts.TypeNode | undefined): string[] {
    const lines: string[] = ['sig {'];

    // Add parameter types
    for (const param of params) {
      const paramName = param.name.getText();
      const paramType = this.mapType(param.type, true);
      lines.push(`  params(${paramName}: ${paramType}).`);
    }

    // Add return type
    const retType = this.mapType(returnType, true);
    lines.push(`  returns(${retType})`);
    lines.push('}');

    return lines;
  }
}

/**
 * Ruby Code Generator
 */
export class RubyGenerator {
  private indent: number = 0;
  private indentSize: number;
  private options: RubyGeneratorOptions;
  private typeMapper: RubyTypeMapper;
  private output: string[] = [];
  private requires: Set<string> = new Set();
  private needsSorbet: boolean = false;

  constructor(options: RubyGeneratorOptions = {}) {
    this.options = {
      version: '3.0',
      useSorbet: false,
      indentSize: 2,
      preserveComments: true,
      useModules: true,
      ...options
    };
    this.indentSize = this.options.indentSize!;
    this.typeMapper = new RubyTypeMapper();
  }

  /**
   * Generate Ruby code from TypeScript AST
   */
  generate(sourceFile: ts.SourceFile): string {
    this.output = [];
    this.indent = 0;
    this.requires = new Set();
    this.needsSorbet = false;

    // Generate header comment
    this.writeLine('# frozen_string_literal: true');
    this.writeLine('');
    this.writeLine('# Generated Ruby code from TypeScript');
    this.writeLine(`# Source: ${sourceFile.fileName}`);
    this.writeLine('');

    // Analyze for requires
    this.analyzeRequires(sourceFile);

    // Write requires
    this.writeRequires();

    // Generate code for each statement
    sourceFile.statements.forEach(statement => {
      this.visitNode(statement);
      this.writeLine('');
    });

    return this.output.join('\n');
  }

  /**
   * Analyze AST to determine needed requires
   */
  private analyzeRequires(node: ts.Node): void {
    const visit = (n: ts.Node) => {
      if (this.options.useSorbet) {
        // Check if we need Sorbet
        if (ts.isClassDeclaration(n) || ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n)) {
          this.needsSorbet = true;
        }
      }

      ts.forEachChild(n, visit);
    };

    visit(node);
  }

  /**
   * Write require statements
   */
  private writeRequires(): void {
    const allRequires: string[] = [];

    // Sorbet require
    if (this.needsSorbet && this.options.useSorbet) {
      allRequires.push("require 'sorbet-runtime'");
    }

    // Custom requires
    allRequires.push(...Array.from(this.requires));

    if (allRequires.length > 0) {
      allRequires.forEach(req => this.writeLine(req));
      this.writeLine('');
    }
  }

  /**
   * Visit a node and generate appropriate Ruby code
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
      case ts.SyntaxKind.ModuleDeclaration:
        this.visitModuleDeclaration(node as ts.ModuleDeclaration);
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
      default:
        this.writeLine(`# TODO: Handle ${ts.SyntaxKind[node.kind]}`);
    }
  }

  /**
   * Visit class declaration
   */
  private visitClassDeclaration(node: ts.ClassDeclaration): void {
    const className = node.name?.text || 'UnnamedClass';
    const baseClass = this.getBaseClass(node);

    // Write Sorbet extend if needed
    if (this.options.useSorbet) {
      this.writeLine('class ' + className + (baseClass ? ` < ${baseClass}` : ''));
      this.increaseIndent();
      this.writeLine('extend T::Sig');
      this.writeLine('');
    } else {
      this.writeLine('class ' + className + (baseClass ? ` < ${baseClass}` : ''));
      this.increaseIndent();
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

    // Write attr_accessor/reader/writer for properties
    this.writePropertyAccessors(properties);

    // Write constructor (initialize method)
    if (constructor.length > 0) {
      this.visitConstructor(constructor[0], properties);
    } else if (properties.length > 0) {
      this.writeDefaultConstructor(properties);
    }

    // Write methods
    for (const method of methods) {
      this.visitMethodDeclaration(method);
    }

    // If class is empty, write a comment
    if (node.members.length === 0) {
      this.writeLine('# Empty class');
    }

    this.decreaseIndent();
    this.writeLine('end');
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
   * Write property accessors (attr_accessor, attr_reader, attr_writer)
   */
  private writePropertyAccessors(properties: ts.PropertyDeclaration[]): void {
    if (properties.length === 0) {
      return;
    }

    const readers: string[] = [];
    const writers: string[] = [];
    const accessors: string[] = [];

    for (const prop of properties) {
      const propName = prop.name.getText();
      const isReadonly = prop.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword);

      if (isReadonly) {
        readers.push(`:${propName}`);
      } else {
        accessors.push(`:${propName}`);
      }
    }

    if (accessors.length > 0) {
      this.writeLine(`attr_accessor ${accessors.join(', ')}`);
    }
    if (readers.length > 0) {
      this.writeLine(`attr_reader ${readers.join(', ')}`);
    }
    if (writers.length > 0) {
      this.writeLine(`attr_writer ${writers.join(', ')}`);
    }

    if (accessors.length > 0 || readers.length > 0 || writers.length > 0) {
      this.writeLine('');
    }
  }

  /**
   * Visit constructor
   */
  private visitConstructor(node: ts.ConstructorDeclaration, properties: ts.PropertyDeclaration[]): void {
    // Write Sorbet signature
    if (this.options.useSorbet) {
      const sigLines = this.typeMapper.getSorbetSig(node.parameters, undefined);
      sigLines.forEach(line => this.writeLine(line));
    }

    const params = node.parameters.map(p => this.visitParameter(p)).join(', ');
    this.writeLine(`def initialize(${params})`);
    this.increaseIndent();

    // Visit body
    if (node.body) {
      this.visitBlock(node.body);
    }

    this.decreaseIndent();
    this.writeLine('end');
    this.writeLine('');
  }

  /**
   * Write default constructor
   */
  private writeDefaultConstructor(properties: ts.PropertyDeclaration[]): void {
    const params = properties.map(p => {
      const name = p.name.getText();
      let param = name;
      if (p.initializer) {
        param += ` = ${this.visitExpression(p.initializer)}`;
      } else if (p.questionToken) {
        param += ' = nil';
      }
      return param;
    });

    this.writeLine(`def initialize(${params.join(', ')})`);
    this.increaseIndent();

    for (const prop of properties) {
      const name = prop.name.getText();
      this.writeLine(`@${name} = ${name}`);
    }

    this.decreaseIndent();
    this.writeLine('end');
    this.writeLine('');
  }

  /**
   * Visit method declaration
   */
  private visitMethodDeclaration(node: ts.MethodDeclaration): void {
    const methodName = this.toSnakeCase(node.name.getText());
    const isStatic = node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword);

    // Write Sorbet signature
    if (this.options.useSorbet) {
      const sigLines = this.typeMapper.getSorbetSig(node.parameters, node.type);
      sigLines.forEach(line => this.writeLine(line));
    }

    const params = node.parameters.map(p => this.visitParameter(p)).join(', ');
    const defPrefix = isStatic ? 'def self.' : 'def ';
    this.writeLine(`${defPrefix}${methodName}(${params})`);
    this.increaseIndent();

    // Visit body
    if (node.body) {
      this.visitBlock(node.body);
    } else {
      this.writeLine('# Abstract method');
    }

    this.decreaseIndent();
    this.writeLine('end');
    this.writeLine('');
  }

  /**
   * Visit function declaration
   */
  private visitFunctionDeclaration(node: ts.FunctionDeclaration): void {
    const funcName = this.toSnakeCase(node.name?.text || 'anonymous');

    // Write Sorbet signature
    if (this.options.useSorbet) {
      const sigLines = this.typeMapper.getSorbetSig(node.parameters, node.type);
      sigLines.forEach(line => this.writeLine(line));
    }

    const params = node.parameters.map(p => this.visitParameter(p)).join(', ');
    this.writeLine(`def ${funcName}(${params})`);
    this.increaseIndent();

    // Visit body
    if (node.body) {
      this.visitBlock(node.body);
    }

    this.decreaseIndent();
    this.writeLine('end');
  }

  /**
   * Visit parameter
   */
  private visitParameter(param: ts.ParameterDeclaration): string {
    const paramName = param.name.getText();
    let result = paramName;

    if (param.initializer) {
      result += ` = ${this.visitExpression(param.initializer)}`;
    } else if (param.questionToken) {
      result += ' = nil';
    }

    return result;
  }

  /**
   * Visit interface declaration (convert to module)
   */
  private visitInterfaceDeclaration(node: ts.InterfaceDeclaration): void {
    const interfaceName = node.name.text;

    this.writeLine(`module ${interfaceName}`);
    this.increaseIndent();

    if (this.options.useSorbet) {
      this.writeLine('extend T::Sig');
      this.writeLine('extend T::Helpers');
      this.writeLine('interface!');
      this.writeLine('');
    }

    // Visit members
    for (const member of node.members) {
      if (ts.isMethodSignature(member)) {
        const methodName = this.toSnakeCase(member.name.getText());

        if (this.options.useSorbet) {
          const sigLines = this.typeMapper.getSorbetSig(member.parameters, member.type);
          sigLines.forEach(line => this.writeLine(line));
        }

        const params = member.parameters.map(p => this.visitParameter(p)).join(', ');
        this.writeLine(`def ${methodName}(${params}); end`);
        this.writeLine('');
      }
    }

    this.decreaseIndent();
    this.writeLine('end');
  }

  /**
   * Visit module declaration
   */
  private visitModuleDeclaration(node: ts.ModuleDeclaration): void {
    const moduleName = node.name.text;

    this.writeLine(`module ${moduleName}`);
    this.increaseIndent();

    if (node.body && ts.isModuleBlock(node.body)) {
      for (const statement of node.body.statements) {
        this.visitNode(statement);
      }
    }

    this.decreaseIndent();
    this.writeLine('end');
  }

  /**
   * Visit enum declaration
   */
  private visitEnumDeclaration(node: ts.EnumDeclaration): void {
    const enumName = node.name.text;

    this.writeLine(`module ${enumName}`);
    this.increaseIndent();

    for (const member of node.members) {
      const memberName = member.name.getText().toUpperCase();
      const value = member.initializer ? this.visitExpression(member.initializer) : `'${member.name.getText()}'`;
      this.writeLine(`${memberName} = ${value}`);
    }

    this.decreaseIndent();
    this.writeLine('end');
  }

  /**
   * Visit variable statement
   */
  private visitVariableStatement(node: ts.VariableStatement): void {
    for (const declaration of node.declarationList.declarations) {
      const varName = this.toSnakeCase(declaration.name.getText());
      const isConst = node.declarationList.flags & ts.NodeFlags.Const;

      if (isConst) {
        // Constants in Ruby are uppercase
        const constName = varName.toUpperCase();
        if (declaration.initializer) {
          this.writeLine(`${constName} = ${this.visitExpression(declaration.initializer)}`);
        }
      } else {
        // Regular variable
        if (declaration.initializer) {
          this.writeLine(`${varName} = ${this.visitExpression(declaration.initializer)}`);
        }
      }
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
    const rubyModule = this.toSnakeCase(moduleSpecifier);

    this.writeLine(`require '${rubyModule}'`);
  }

  /**
   * Visit block statement
   */
  private visitBlock(block: ts.Block): void {
    if (block.statements.length === 0) {
      this.writeLine('# Empty block');
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
    this.writeLine(`if ${condition}`);
    this.increaseIndent();
    this.visitStatement(node.thenStatement);
    this.decreaseIndent();

    if (node.elseStatement) {
      if (ts.isIfStatement(node.elseStatement)) {
        const elsifCondition = this.visitExpression(node.elseStatement.expression);
        this.writeLine(`elsif ${elsifCondition}`);
        this.increaseIndent();
        this.visitStatement(node.elseStatement.thenStatement);
        this.decreaseIndent();

        if (node.elseStatement.elseStatement) {
          this.writeLine('else');
          this.increaseIndent();
          this.visitStatement(node.elseStatement.elseStatement);
          this.decreaseIndent();
        }
      } else {
        this.writeLine('else');
        this.increaseIndent();
        this.visitStatement(node.elseStatement);
        this.decreaseIndent();
      }
    }

    this.writeLine('end');
  }

  /**
   * Visit for statement
   */
  private visitForStatement(node: ts.ForStatement): void {
    // Try to detect simple range-based for loop
    if (node.initializer && node.condition && node.incrementor) {
      const initText = node.initializer.getText();
      const condText = node.condition.getText();

      const match = initText.match(/(\w+)\s*=\s*(\d+)/);
      if (match) {
        const varName = match[1];
        const startVal = match[2];

        const endMatch = condText.match(/\w+\s*<\s*(.+)/);
        if (endMatch) {
          const endVal = endMatch[1];
          this.writeLine(`(${startVal}...${endVal}).each do |${varName}|`);
          this.increaseIndent();
          this.visitStatement(node.statement);
          this.decreaseIndent();
          this.writeLine('end');
          return;
        }
      }
    }

    // Fallback: convert to while loop
    if (node.initializer) {
      this.visitStatement(node.initializer as ts.Statement);
    }

    const condition = node.condition ? this.visitExpression(node.condition) : 'true';
    this.writeLine(`while ${condition}`);
    this.increaseIndent();
    this.visitStatement(node.statement);

    if (node.incrementor) {
      this.writeLine(this.visitExpression(node.incrementor));
    }

    this.decreaseIndent();
    this.writeLine('end');
  }

  /**
   * Visit for-of statement
   */
  private visitForOfStatement(node: ts.ForOfStatement): void {
    const varName = node.initializer.getText().replace(/^(let|const|var)\s+/, '');
    const iterable = this.visitExpression(node.expression);

    this.writeLine(`${iterable}.each do |${varName}|`);
    this.increaseIndent();
    this.visitStatement(node.statement);
    this.decreaseIndent();
    this.writeLine('end');
  }

  /**
   * Visit while statement
   */
  private visitWhileStatement(node: ts.WhileStatement): void {
    const condition = this.visitExpression(node.expression);
    this.writeLine(`while ${condition}`);
    this.increaseIndent();
    this.visitStatement(node.statement);
    this.decreaseIndent();
    this.writeLine('end');
  }

  /**
   * Visit switch statement (convert to case/when)
   */
  private visitSwitchStatement(node: ts.SwitchStatement): void {
    const expr = this.visitExpression(node.expression);
    this.writeLine(`case ${expr}`);

    for (const clause of node.caseBlock.clauses) {
      if (ts.isCaseClause(clause)) {
        const caseExpr = this.visitExpression(clause.expression);
        this.writeLine(`when ${caseExpr}`);
        this.increaseIndent();
        for (const statement of clause.statements) {
          this.visitStatement(statement);
        }
        this.decreaseIndent();
      } else if (ts.isDefaultClause(clause)) {
        this.writeLine('else');
        this.increaseIndent();
        for (const statement of clause.statements) {
          this.visitStatement(statement);
        }
        this.decreaseIndent();
      }
    }

    this.writeLine('end');
  }

  /**
   * Visit try statement
   */
  private visitTryStatement(node: ts.TryStatement): void {
    this.writeLine('begin');
    this.increaseIndent();
    this.visitBlock(node.tryBlock);
    this.decreaseIndent();

    if (node.catchClause) {
      const varName = node.catchClause.variableDeclaration?.name.getText() || 'e';
      this.writeLine(`rescue StandardError => ${varName}`);
      this.increaseIndent();
      this.visitBlock(node.catchClause.block);
      this.decreaseIndent();
    }

    if (node.finallyBlock) {
      this.writeLine('ensure');
      this.increaseIndent();
      this.visitBlock(node.finallyBlock);
      this.decreaseIndent();
    }

    this.writeLine('end');
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
        return 'true';
      case ts.SyntaxKind.FalseKeyword:
        return 'false';
      case ts.SyntaxKind.NullKeyword:
        return 'nil';
      case ts.SyntaxKind.Identifier:
        return this.toSnakeCase((node as ts.Identifier).text);
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
      case ts.SyntaxKind.ConditionalExpression:
        return this.visitConditional(node as ts.ConditionalExpression);
      case ts.SyntaxKind.ArrowFunction:
        return this.visitArrowFunction(node as ts.ArrowFunction);
      default:
        return node.getText();
    }
  }

  /**
   * Visit property access expression
   */
  private visitPropertyAccess(node: ts.PropertyAccessExpression): string {
    const object = this.visitExpression(node.expression);
    const property = this.toSnakeCase(node.name.text);
    return `${object}.${property}`;
  }

  /**
   * Visit call expression
   */
  private visitCallExpression(node: ts.CallExpression): string {
    const func = this.visitExpression(node.expression);
    const args = node.arguments.map(arg => this.visitExpression(arg)).join(', ');

    // Check if it's a method call
    if (func.includes('.')) {
      return `${func}(${args})`;
    }

    return `${func}(${args})`;
  }

  /**
   * Visit new expression
   */
  private visitNewExpression(node: ts.NewExpression): string {
    const className = this.visitExpression(node.expression);
    const args = node.arguments ? node.arguments.map(arg => this.visitExpression(arg)).join(', ') : '';
    return `${className}.new(${args})`;
  }

  /**
   * Visit array literal
   */
  private visitArrayLiteral(node: ts.ArrayLiteralExpression): string {
    const elements = node.elements.map(el => this.visitExpression(el)).join(', ');
    return `[${elements}]`;
  }

  /**
   * Visit object literal (convert to Hash)
   */
  private visitObjectLiteral(node: ts.ObjectLiteralExpression): string {
    const properties = node.properties.map(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const key = prop.name.getText();
        const value = this.visitExpression(prop.initializer);
        return `${key}: ${value}`;
      }
      return '';
    }).filter(p => p);

    return `{ ${properties.join(', ')} }`;
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
   * Convert TypeScript operator to Ruby
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
        return '&&';
      case ts.SyntaxKind.BarBarToken:
        return '||';
      case ts.SyntaxKind.ExclamationToken:
        return '!';
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
   * Visit conditional expression (ternary)
   */
  private visitConditional(node: ts.ConditionalExpression): string {
    const condition = this.visitExpression(node.condition);
    const whenTrue = this.visitExpression(node.whenTrue);
    const whenFalse = this.visitExpression(node.whenFalse);
    return `${condition} ? ${whenTrue} : ${whenFalse}`;
  }

  /**
   * Visit arrow function (convert to lambda or block)
   */
  private visitArrowFunction(node: ts.ArrowFunction): string {
    const params = node.parameters.map(p => p.name.getText()).join(', ');

    if (ts.isBlock(node.body)) {
      return `lambda { |${params}| ... }`;
    } else {
      const body = this.visitExpression(node.body);
      return `lambda { |${params}| ${body} }`;
    }
  }

  /**
   * Convert camelCase to snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
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
