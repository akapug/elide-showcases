/**
 * Data types
 */

export const DataTypes = {
  STRING: (length?: number) => ({ type: 'STRING', length }),
  CHAR: (length?: number) => ({ type: 'CHAR', length }),
  TEXT: (size?: 'tiny' | 'medium' | 'long') => ({ type: 'TEXT', size }),
  INTEGER: { type: 'INTEGER' },
  BIGINT: { type: 'BIGINT' },
  FLOAT: { type: 'FLOAT' },
  REAL: { type: 'REAL' },
  DOUBLE: { type: 'DOUBLE' },
  DECIMAL: (precision?: number, scale?: number) => ({ type: 'DECIMAL', precision, scale }),
  BOOLEAN: { type: 'BOOLEAN' },
  DATE: { type: 'DATE' },
  DATEONLY: { type: 'DATEONLY' },
  TIME: { type: 'TIME' },
  NOW: { type: 'NOW' },
  UUID: { type: 'UUID' },
  UUIDV1: { type: 'UUIDV1' },
  UUIDV4: { type: 'UUIDV4' },
  BLOB: (size?: 'tiny' | 'medium' | 'long') => ({ type: 'BLOB', size }),
  ENUM: (...values: string[]) => ({ type: 'ENUM', values }),
  JSON: { type: 'JSON' },
  JSONB: { type: 'JSONB' },
  ARRAY: (type: any) => ({ type: 'ARRAY', arrayType: type }),
  GEOMETRY: (subtype?: string, srid?: number) => ({ type: 'GEOMETRY', subtype, srid }),
  GEOGRAPHY: (subtype?: string, srid?: number) => ({ type: 'GEOGRAPHY', subtype, srid }),
  VIRTUAL: (returnType?: any, fields?: string[]) => ({ type: 'VIRTUAL', returnType, fields }),
  CIDR: { type: 'CIDR' },
  INET: { type: 'INET' },
  MACADDR: { type: 'MACADDR' },
  RANGE: (subtype: any) => ({ type: 'RANGE', subtype })
};
