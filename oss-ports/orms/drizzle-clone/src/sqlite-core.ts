/**
 * SQLite core types
 */

export function sqliteTable(name: string, columns: any) {
  return { name, columns, type: 'sqlite' };
}

export function integer(name: string) {
  return { name, type: 'integer' };
}

export function text(name: string) {
  return { name, type: 'text' };
}

export function real(name: string) {
  return { name, type: 'real' };
}

export function blob(name: string) {
  return { name, type: 'blob' };
}
