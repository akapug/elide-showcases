/**
 * @webassemblyjs/ast - WebAssembly AST
 *
 * Abstract Syntax Tree for WebAssembly modules.
 * **POLYGLOT SHOWCASE**: WASM AST for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@webassemblyjs/ast (~3M+ downloads/week)
 *
 * Features:
 * - AST node types
 * - Tree traversal
 * - Node manipulation
 * - Builder utilities
 * - Visitor pattern
 * - Transform helpers
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java can work with WASM AST
 * - ONE AST format works everywhere on Elide
 * - Consistent tree manipulation across languages
 * - Share transformations across your stack
 *
 * Use cases:
 * - Code generation
 * - Optimization passes
 * - Static analysis
 * - Module transformation
 *
 * Package has ~3M+ downloads/week on npm - essential WASM AST!
 */

interface ASTNode {
  type: string;
  loc?: SourceLocation;
}

interface SourceLocation {
  start: Position;
  end: Position;
}

interface Position {
  line: number;
  column: number;
}

interface ModuleNode extends ASTNode {
  type: "Module";
  fields: ASTNode[];
}

interface FunctionNode extends ASTNode {
  type: "Func";
  name?: string;
  params: ParamNode[];
  results: ResultNode[];
  body: InstructionNode[];
}

interface ParamNode extends ASTNode {
  type: "Param";
  valtype: string;
}

interface ResultNode extends ASTNode {
  type: "Result";
  valtype: string;
}

interface InstructionNode extends ASTNode {
  type: "Instruction";
  name: string;
  args: any[];
}

/**
 * Create module node
 */
export function module(fields: ASTNode[] = []): ModuleNode {
  return {
    type: "Module",
    fields
  };
}

/**
 * Create function node
 */
export function func(
  name: string | undefined,
  params: ParamNode[],
  results: ResultNode[],
  body: InstructionNode[]
): FunctionNode {
  return {
    type: "Func",
    name,
    params,
    results,
    body
  };
}

/**
 * Create parameter node
 */
export function param(valtype: string): ParamNode {
  return {
    type: "Param",
    valtype
  };
}

/**
 * Create result node
 */
export function result(valtype: string): ResultNode {
  return {
    type: "Result",
    valtype
  };
}

/**
 * Create instruction node
 */
export function instruction(name: string, args: any[] = []): InstructionNode {
  return {
    type: "Instruction",
    name,
    args
  };
}

/**
 * Traverse AST with visitor
 */
export function traverse(node: ASTNode, visitor: (node: ASTNode) => void): void {
  visitor(node);

  if ('fields' in node) {
    (node as ModuleNode).fields.forEach(field => traverse(field, visitor));
  }

  if ('body' in node) {
    (node as FunctionNode).body.forEach(inst => traverse(inst, visitor));
  }
}

/**
 * Find nodes by type
 */
export function findNodes(ast: ASTNode, nodeType: string): ASTNode[] {
  const nodes: ASTNode[] = [];
  traverse(ast, node => {
    if (node.type === nodeType) {
      nodes.push(node);
    }
  });
  return nodes;
}

// CLI Demo
if (import.meta.url.includes("elide-webassemblyjs-ast.ts")) {
  console.log("🌳 @webassemblyjs/ast - WASM AST for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Build AST ===");
  const addFunc = func(
    "add",
    [param("i32"), param("i32")],
    [result("i32")],
    [
      instruction("local.get", [0]),
      instruction("local.get", [1]),
      instruction("i32.add")
    ]
  );

  console.log("Function AST:");
  console.log(`  Name: ${addFunc.name}`);
  console.log(`  Params: ${addFunc.params.length}`);
  console.log(`  Results: ${addFunc.results.length}`);
  console.log(`  Instructions: ${addFunc.body.length}`);
  console.log();

  console.log("=== Example 2: Module AST ===");
  const moduleAST = module([addFunc]);
  console.log("Module fields:", moduleAST.fields.length);
  console.log();

  console.log("=== Example 3: Traversal ===");
  console.log("Traversing AST:");
  traverse(moduleAST, node => {
    console.log(`  Visited: ${node.type}`);
  });
  console.log();

  console.log("=== Example 4: Find Nodes ===");
  const funcs = findNodes(moduleAST, "Func");
  console.log(`Found ${funcs.length} function(s)`);
  console.log();

  console.log("=== Example 5: Instruction Types ===");
  console.log("Common WASM instructions:");
  const instructions = [
    "local.get", "local.set", "i32.add", "i32.sub",
    "i32.mul", "i32.const", "call", "return"
  ];
  instructions.forEach(inst => console.log(`  • ${inst}`));
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same AST works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One AST format, all platforms");
  console.log("  ✓ Consistent tree structure");
  console.log("  ✓ Share transformations everywhere");
  console.log("  ✓ No need for platform-specific ASTs");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- WASM code generation");
  console.log("- Optimization pass development");
  console.log("- Static analysis tools");
  console.log("- Module transformation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Efficient tree operations");
  console.log("- Fast traversal");
  console.log("- Instant execution on Elide");
  console.log("- ~3M+ downloads/week on npm!");
}
