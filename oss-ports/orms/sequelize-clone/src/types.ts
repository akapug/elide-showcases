/**
 * Type definitions
 */

export interface FindOptions {
  where?: any;
  attributes?: string[] | { include?: string[]; exclude?: string[] };
  include?: any;
  order?: Array<[string, 'ASC' | 'DESC']>;
  limit?: number;
  offset?: number;
  group?: string | string[];
  having?: any;
  raw?: boolean;
  nest?: boolean;
  subQuery?: boolean;
  transaction?: any;
  lock?: any;
  skipLocked?: boolean;
}

export interface CreateOptions {
  fields?: string[];
  validate?: boolean;
  hooks?: boolean;
  transaction?: any;
  returning?: boolean | string[];
}

export interface UpdateOptions {
  where?: any;
  fields?: string[];
  validate?: boolean;
  hooks?: boolean;
  transaction?: any;
  returning?: boolean | string[];
  silent?: boolean;
}

export interface DestroyOptions {
  where?: any;
  hooks?: boolean;
  transaction?: any;
  force?: boolean;
  truncate?: boolean;
  cascade?: boolean;
}
