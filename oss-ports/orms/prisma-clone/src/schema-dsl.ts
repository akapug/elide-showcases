/**
 * Schema DSL - programmatic schema definition
 */

/**
 * Define datasource
 */
export function datasource(name: string, config: any) {
  return { type: 'datasource', name, config };
}

/**
 * Define generator
 */
export function generator(name: string, config: any) {
  return { type: 'generator', name, config };
}

/**
 * Define model
 */
export function model(name: string, fields: any) {
  return { type: 'model', name, fields };
}

/**
 * Define field
 */
export function field(name: string, type: string, options?: any) {
  return { name, type, ...options };
}

/**
 * Define relation
 */
export function relation(fields: string[], references: string[], options?: any) {
  return { type: 'relation', fields, references, ...options };
}

/**
 * Define enum
 */
export function enumType(name: string, values: string[]) {
  return { type: 'enum', name, values };
}

/**
 * Define custom type
 */
export function type(name: string, fields: any) {
  return { type: 'type', name, fields };
}
