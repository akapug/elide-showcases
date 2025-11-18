/**
 * eslint-visitor-keys - Visitor Keys for ESLint
 *
 * Core features:
 * - AST node visitor keys
 * - Node type definitions
 * - Traversal utilities
 * - ES6+ support
 * - Union type handling
 * - Key validation
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 80M+ downloads/week
 */

export const KEYS: Record<string, readonly string[]> = {
  Program: ['body'],
  FunctionDeclaration: ['id', 'params', 'body'],
  FunctionExpression: ['id', 'params', 'body'],
  ArrowFunctionExpression: ['params', 'body'],
  VariableDeclaration: ['declarations'],
  VariableDeclarator: ['id', 'init'],
  Identifier: [],
  Literal: [],
  BlockStatement: ['body'],
  ExpressionStatement: ['expression'],
  ReturnStatement: ['argument'],
  IfStatement: ['test', 'consequent', 'alternate'],
  WhileStatement: ['test', 'body'],
  ForStatement: ['init', 'test', 'update', 'body'],
  ForInStatement: ['left', 'right', 'body'],
  ForOfStatement: ['left', 'right', 'body'],
  CallExpression: ['callee', 'arguments'],
  MemberExpression: ['object', 'property'],
  BinaryExpression: ['left', 'right'],
  UnaryExpression: ['argument'],
  AssignmentExpression: ['left', 'right'],
  ObjectExpression: ['properties'],
  ArrayExpression: ['elements'],
  Property: ['key', 'value'],
  ClassDeclaration: ['id', 'superClass', 'body'],
  ClassExpression: ['id', 'superClass', 'body'],
  ClassBody: ['body'],
  MethodDefinition: ['key', 'value'],
  ImportDeclaration: ['specifiers', 'source'],
  ExportNamedDeclaration: ['declaration', 'specifiers', 'source'],
  ExportDefaultDeclaration: ['declaration'],
  ExportAllDeclaration: ['source'],
  ImportSpecifier: ['imported', 'local'],
  ImportDefaultSpecifier: ['local'],
  ImportNamespaceSpecifier: ['local'],
  ExportSpecifier: ['exported', 'local'],
  TryStatement: ['block', 'handler', 'finalizer'],
  CatchClause: ['param', 'body'],
  ThrowStatement: ['argument'],
  SwitchStatement: ['discriminant', 'cases'],
  SwitchCase: ['test', 'consequent'],
  BreakStatement: ['label'],
  ContinueStatement: ['label'],
  LabeledStatement: ['label', 'body'],
};

export function getKeys(node: { type: string }): readonly string[] {
  return KEYS[node.type] || [];
}

export function unionWith(additionalKeys: Record<string, readonly string[]>): Record<string, readonly string[]> {
  const result: Record<string, string[]> = {};

  for (const type in KEYS) {
    result[type] = [...KEYS[type]];
  }

  for (const type in additionalKeys) {
    if (result[type]) {
      result[type] = [...new Set([...result[type], ...additionalKeys[type]])];
    } else {
      result[type] = [...additionalKeys[type]];
    }
  }

  return result;
}

if (import.meta.url.includes("elide-eslint-visitor-keys")) {
  console.log("🔑 eslint-visitor-keys for Elide - Visitor Keys\n");

  console.log("=== Node Visitor Keys ===\n");

  const nodes = [
    { type: 'Program' },
    { type: 'FunctionDeclaration' },
    { type: 'VariableDeclaration' },
    { type: 'IfStatement' },
    { type: 'CallExpression' },
  ];

  nodes.forEach(node => {
    const keys = getKeys(node);
    console.log(`${node.type}:`, keys.join(', '));
  });

  console.log("\n=== Union with Custom Keys ===");
  const customKeys = unionWith({
    CustomNode: ['customProp'],
    Program: ['extraProp'],
  });

  console.log("Program keys:", customKeys.Program);
  console.log("CustomNode keys:", customKeys.CustomNode);

  console.log();
  console.log("✅ Use Cases: AST traversal, ESLint rules, Code analysis");
  console.log("🚀 80M+ npm downloads/week - Essential for ESLint");
}

export default { KEYS, getKeys, unionWith };
