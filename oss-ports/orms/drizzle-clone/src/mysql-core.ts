/**
 * MySQL core types
 */

export function mysqlTable(name: string, columns: any) {
  return { name, columns, type: 'mysql' };
}

export function int(name: string) {
  return { name, type: 'int' };
}

export function bigint(name: string) {
  return { name, type: 'bigint' };
}

export function varchar(name: string, length?: number) {
  return { name, type: 'varchar', length };
}

export function char(name: string, length?: number) {
  return { name, type: 'char', length };
}

export function text(name: string) {
  return { name, type: 'text' };
}

export function decimal(name: string, precision?: number, scale?: number) {
  return { name, type: 'decimal', precision, scale };
}

export function float(name: string) {
  return { name, type: 'float' };
}

export function double(name: string) {
  return { name, type: 'double' };
}

export function boolean(name: string) {
  return { name, type: 'boolean' };
}

export function datetime(name: string) {
  return { name, type: 'datetime' };
}

export function timestamp(name: string) {
  return { name, type: 'timestamp' };
}

export function date(name: string) {
  return { name, type: 'date' };
}

export function json(name: string) {
  return { name, type: 'json' };
}
