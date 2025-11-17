/**
 * Type definitions
 */

export type InferModel<T, TMode extends 'select' | 'insert' = 'select'> = TMode extends 'select'
  ? T
  : Partial<T>;

export interface Config {
  schema: string;
  out: string;
  driver: 'pg' | 'mysql2' | 'better-sqlite3';
  dbCredentials: any;
}
