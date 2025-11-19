/**
 * PostgreSQL type definitions
 */

export interface ClientConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | object;
  connectionTimeoutMillis?: number;
  query_timeout?: number;
  statement_timeout?: number;
  application_name?: string;
  keepAlive?: boolean;
  keepAliveInitialDelayMillis?: number;
}

export interface PoolConfig extends ClientConfig {
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  maxUses?: number;
  allowExitOnIdle?: boolean;
}

export interface QueryConfig {
  text: string;
  values?: any[];
  name?: string;
  rowMode?: 'array' | 'object';
  types?: {
    getTypeParser: (oid: number, format?: string) => (value: string) => any;
  };
}

export interface QueryArrayConfig extends QueryConfig {
  rowMode: 'array';
}

export interface FieldDef {
  name: string;
  tableID: number;
  columnID: number;
  dataTypeID: number;
  dataTypeSize: number;
  dataTypeModifier: number;
  format: string;
}

export interface QueryResult<T = any> {
  command: string;
  rowCount: number;
  oid: number;
  rows: T[];
  fields: FieldDef[];
}

export interface QueryArrayResult<T = any[]> extends QueryResult<T> {
  rows: T[];
}

export interface Notification {
  channel: string;
  payload: string;
  processId: number;
}

export type NotificationHandler = (notification: Notification) => void;

export interface CopyStreamConfig {
  text: string;
  values?: any[];
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public severity: string,
    public code: string,
    public detail?: string,
    public hint?: string,
    public position?: string,
    public internalPosition?: string,
    public internalQuery?: string,
    public where?: string,
    public schema?: string,
    public table?: string,
    public column?: string,
    public dataType?: string,
    public constraint?: string,
    public file?: string,
    public line?: string,
    public routine?: string
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}
