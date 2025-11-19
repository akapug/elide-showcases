/**
 * SQL operators and helpers
 */

export function eq(left: any, right: any) {
  return `${left.name} = ${JSON.stringify(right)}`;
}

export function ne(left: any, right: any) {
  return `${left.name} != ${JSON.stringify(right)}`;
}

export function gt(left: any, right: any) {
  return `${left.name} > ${JSON.stringify(right)}`;
}

export function gte(left: any, right: any) {
  return `${left.name} >= ${JSON.stringify(right)}`;
}

export function lt(left: any, right: any) {
  return `${left.name} < ${JSON.stringify(right)}`;
}

export function lte(left: any, right: any) {
  return `${left.name} <= ${JSON.stringify(right)}`;
}

export function isNull(column: any) {
  return `${column.name} IS NULL`;
}

export function isNotNull(column: any) {
  return `${column.name} IS NOT NULL`;
}

export function inArray(column: any, values: any[]) {
  return `${column.name} IN (${values.map(v => JSON.stringify(v)).join(', ')})`;
}

export function notInArray(column: any, values: any[]) {
  return `${column.name} NOT IN (${values.map(v => JSON.stringify(v)).join(', ')})`;
}

export function between(column: any, min: any, max: any) {
  return `${column.name} BETWEEN ${JSON.stringify(min)} AND ${JSON.stringify(max)}`;
}

export function notBetween(column: any, min: any, max: any) {
  return `${column.name} NOT BETWEEN ${JSON.stringify(min)} AND ${JSON.stringify(max)}`;
}

export function like(column: any, pattern: string) {
  return `${column.name} LIKE ${JSON.stringify(pattern)}`;
}

export function ilike(column: any, pattern: string) {
  return `${column.name} ILIKE ${JSON.stringify(pattern)}`;
}

export function and(...conditions: any[]) {
  return `(${conditions.join(' AND ')})`;
}

export function or(...conditions: any[]) {
  return `(${conditions.join(' OR ')})`;
}

export function not(condition: any) {
  return `NOT (${condition})`;
}

export function exists(subquery: any) {
  return `EXISTS (${subquery})`;
}

export function notExists(subquery: any) {
  return `NOT EXISTS (${subquery})`;
}

export function count(column?: any) {
  return column ? `COUNT(${column.name})` : 'COUNT(*)';
}

export function avg(column: any) {
  return `AVG(${column.name})`;
}

export function sum(column: any) {
  return `SUM(${column.name})`;
}

export function min(column: any) {
  return `MIN(${column.name})`;
}

export function max(column: any) {
  return `MAX(${column.name})`;
}

export function asc(column: any) {
  return `${column.name} ASC`;
}

export function desc(column: any) {
  return `${column.name} DESC`;
}

export function sql(strings: TemplateStringsArray, ...values: any[]) {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += values[i] + strings[i + 1];
  }
  return result;
}
