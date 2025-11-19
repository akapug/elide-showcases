/**
 * @elide/prisma-clone - Next-generation ORM for Elide
 *
 * Type-safe database client with intuitive API and powerful features.
 */

export { PrismaClient, PrismaClientOptions } from './client';
export { Prisma } from './namespace';
export * from './types';
export * from './errors';
export * from './middleware';
export * from './transaction';
export * from './query-builder';
export * from './schema-parser';
export * from './migrations';
export * from './generators';
export * from './datasources';
export * from './validators';
export * from './hooks';

// Re-export common types
export type {
  PrismaPromise,
  Decimal,
  JsonValue,
  JsonObject,
  JsonArray,
  WhereInput,
  OrderByInput,
  IncludeInput,
  SelectInput,
  CreateInput,
  UpdateInput,
  DeleteInput,
  AggregateInput,
  GroupByInput
} from './types';

// Export utilities
export {
  createPrismaClient,
  createMockClient,
  getPrismaVersion,
  getEngineVersion
} from './utils';

// Export schema DSL
export {
  datasource,
  generator,
  model,
  field,
  relation,
  enum as enumType,
  type
} from './schema-dsl';

// Export CLI tools
export {
  migrate,
  generate,
  studio,
  format,
  validate,
  introspect
} from './cli';

// Version
export const VERSION = '1.0.0';
export const ENGINE_VERSION = '1.0.0';
