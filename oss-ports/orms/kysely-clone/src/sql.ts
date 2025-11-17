/**
 * SQL utilities
 */

export function sql(strings: TemplateStringsArray, ...values: any[]) {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += `$${i + 1}` + strings[i + 1];
  }
  return result;
}

export function raw(sql: string) {
  return { type: 'raw', sql };
}
