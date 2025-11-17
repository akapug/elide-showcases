/**
 * Expression builders
 */

export class ExpressionBuilder {
  and(expressions: any[]) {
    return expressions.join(' AND ');
  }

  or(expressions: any[]) {
    return expressions.join(' OR ');
  }

  not(expression: any) {
    return `NOT (${expression})`;
  }
}
