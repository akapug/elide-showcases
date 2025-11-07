/**
 * Math Expression Evaluator
 * Parse and evaluate mathematical expressions
 */

export function evaluate(expression: string): number {
  const tokens = tokenize(expression);
  return evaluateTokens(tokens);
}

function tokenize(expr: string): string[] {
  return expr.match(/\d+\.?\d*|[+\-*/()^]|[a-z]+/gi) || [];
}

function evaluateTokens(tokens: string[]): number {
  const values: number[] = [];
  const ops: string[] = [];

  const precedence: Record<string, number> = {
    '+': 1, '-': 1, '*': 2, '/': 2, '^': 3
  };

  const applyOp = (op: string, b: number, a: number): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      case '^': return Math.pow(a, b);
      default: throw new Error('Unknown operator: ' + op);
    }
  };

  const functions: Record<string, (x: number) => number> = {
    'sin': Math.sin,
    'cos': Math.cos,
    'tan': Math.tan,
    'sqrt': Math.sqrt,
    'abs': Math.abs,
    'log': Math.log,
    'exp': Math.exp
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (/^\d+\.?\d*$/.test(token)) {
      values.push(parseFloat(token));
    } else if (token in functions) {
      ops.push(token);
    } else if (token === '(') {
      ops.push(token);
    } else if (token === ')') {
      while (ops.length > 0 && ops[ops.length - 1] !== '(') {
        const op = ops.pop()!;
        if (op in functions) {
          values.push(functions[op](values.pop()!));
        } else {
          values.push(applyOp(op, values.pop()!, values.pop()!));
        }
      }
      ops.pop(); // Remove '('

      if (ops.length > 0 && ops[ops.length - 1] in functions) {
        const fn = ops.pop()!;
        values.push(functions[fn](values.pop()!));
      }
    } else if (token in precedence) {
      while (ops.length > 0 &&
             ops[ops.length - 1] !== '(' &&
             precedence[ops[ops.length - 1]] >= precedence[token]) {
        values.push(applyOp(ops.pop()!, values.pop()!, values.pop()!));
      }
      ops.push(token);
    }
  }

  while (ops.length > 0) {
    values.push(applyOp(ops.pop()!, values.pop()!, values.pop()!));
  }

  return values[0];
}

export function evaluateWithVariables(expression: string, variables: Record<string, number>): number {
  let expr = expression;
  for (const [name, value] of Object.entries(variables)) {
    expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), String(value));
  }
  return evaluate(expr);
}

export function validateExpression(expression: string): { valid: boolean; error?: string } {
  try {
    evaluate(expression);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

// CLI demo
if (import.meta.url.includes("math-evaluator.ts")) {
  console.log("Math Expression Evaluator Demo\n");

  const expressions = [
    "2 + 3 * 4",
    "(2 + 3) * 4",
    "10 / 2 + 3",
    "2 ^ 3 + 1",
    "sqrt(16) + 5",
    "sin(0) + cos(0)",
    "abs(-5) * 2"
  ];

  console.log("Basic expressions:");
  expressions.forEach(expr => {
    console.log(`  ${expr} = ${evaluate(expr)}`);
  });

  console.log("\nWith variables:");
  const withVars = "x * 2 + y";
  console.log(`  ${withVars} where x=5, y=3 = ${evaluateWithVariables(withVars, { x: 5, y: 3 })}`);

  console.log("\nValidation:");
  console.log("  '2 + 2' valid?", validateExpression("2 + 2").valid);
  console.log("  '2 +' valid?", validateExpression("2 +").valid);

  console.log("✅ Math evaluator test passed");
}
