/**
 * Type definitions for Prisma Client
 */

/**
 * Prisma Client Options
 */
export interface PrismaClientOptions {
  datasources?: {
    db?: {
      url?: string;
    };
  };
  connection?: ConnectionOptions;
  log?: LogOptions;
  errorFormat?: 'pretty' | 'colorless' | 'minimal';
  rejectOnNotFound?: boolean;
  schema?: string;
}

/**
 * Connection Options
 */
export interface ConnectionOptions {
  poolSize?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  maxLifetime?: number;
  connectionLimit?: number;
}

/**
 * Log Options
 */
export interface LogOptions {
  level?: LogLevel;
  emit?: boolean;
}

export type LogLevel = 'info' | 'query' | 'warn' | 'error';

/**
 * Log Event
 */
export interface LogEvent {
  timestamp: Date;
  level: LogLevel;
  message: string;
  target?: string;
  duration?: number;
}

/**
 * Query Event
 */
export interface QueryEvent {
  model: string;
  action: string;
  args: any;
  timestamp?: Date;
  duration?: number;
}

/**
 * Middleware
 */
export type Middleware = (
  params: QueryEvent,
  next: () => Promise<any>
) => Promise<any>;

/**
 * Transaction Options
 */
export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: IsolationLevel;
}

export type IsolationLevel =
  | 'ReadUncommitted'
  | 'ReadCommitted'
  | 'RepeatableRead'
  | 'Serializable';

/**
 * Find Unique Args
 */
export interface FindUniqueArgs<T> {
  where: WhereUniqueInput<T>;
  select?: SelectInput<T>;
  include?: IncludeInput<T>;
}

/**
 * Find First Args
 */
export interface FindFirstArgs<T> {
  where?: WhereInput<T>;
  select?: SelectInput<T>;
  include?: IncludeInput<T>;
  orderBy?: OrderByInput<T>;
  skip?: number;
  cursor?: WhereUniqueInput<T>;
}

/**
 * Find Many Args
 */
export interface FindManyArgs<T> {
  where?: WhereInput<T>;
  select?: SelectInput<T>;
  include?: IncludeInput<T>;
  orderBy?: OrderByInput<T>;
  skip?: number;
  take?: number;
  cursor?: WhereUniqueInput<T>;
  distinct?: keyof T | (keyof T)[];
}

/**
 * Create Args
 */
export interface CreateArgs<T> {
  data: CreateInput<T>;
  select?: SelectInput<T>;
  include?: IncludeInput<T>;
}

/**
 * Create Many Args
 */
export interface CreateManyArgs<T> {
  data: CreateInput<T> | CreateInput<T>[];
  skipDuplicates?: boolean;
}

/**
 * Update Args
 */
export interface UpdateArgs<T> {
  where: WhereUniqueInput<T>;
  data: UpdateInput<T>;
  select?: SelectInput<T>;
  include?: IncludeInput<T>;
}

/**
 * Update Many Args
 */
export interface UpdateManyArgs<T> {
  where?: WhereInput<T>;
  data: UpdateInput<T>;
}

/**
 * Upsert Args
 */
export interface UpsertArgs<T> {
  where: WhereUniqueInput<T>;
  create: CreateInput<T>;
  update: UpdateInput<T>;
  select?: SelectInput<T>;
  include?: IncludeInput<T>;
}

/**
 * Delete Args
 */
export interface DeleteArgs<T> {
  where: WhereUniqueInput<T>;
  select?: SelectInput<T>;
}

/**
 * Delete Many Args
 */
export interface DeleteManyArgs<T> {
  where?: WhereInput<T>;
}

/**
 * Count Args
 */
export interface CountArgs<T> {
  where?: WhereInput<T>;
  select?: CountSelect<T>;
}

/**
 * Aggregate Args
 */
export interface AggregateArgs<T> {
  where?: WhereInput<T>;
  _count?: CountSelect<T>;
  _sum?: SumSelect<T>;
  _avg?: AvgSelect<T>;
  _min?: MinSelect<T>;
  _max?: MaxSelect<T>;
}

/**
 * Group By Args
 */
export interface GroupByArgs<T> {
  where?: WhereInput<T>;
  by: (keyof T)[];
  having?: HavingInput<T>;
  orderBy?: OrderByInput<T>;
  skip?: number;
  take?: number;
}

/**
 * Where Input
 */
export type WhereInput<T> = {
  [K in keyof T]?: T[K] | WhereCondition<T[K]> | null;
} & {
  AND?: WhereInput<T>[];
  OR?: WhereInput<T>[];
  NOT?: WhereInput<T>[];
};

/**
 * Where Unique Input
 */
export type WhereUniqueInput<T> = {
  [K in keyof T]?: T[K];
};

/**
 * Where Condition
 */
export interface WhereCondition<T> {
  equals?: T;
  not?: T | WhereCondition<T>;
  in?: T[];
  notIn?: T[];
  lt?: T;
  lte?: T;
  gt?: T;
  gte?: T;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  search?: string;
  mode?: 'default' | 'insensitive';
}

/**
 * Order By Input
 */
export type OrderByInput<T> =
  | {
      [K in keyof T]?: 'asc' | 'desc' | OrderByNested;
    }
  | {
      [K in keyof T]?: 'asc' | 'desc' | OrderByNested;
    }[];

export interface OrderByNested {
  _count?: 'asc' | 'desc';
  _sum?: 'asc' | 'desc';
  _avg?: 'asc' | 'desc';
  _min?: 'asc' | 'desc';
  _max?: 'asc' | 'desc';
}

/**
 * Select Input
 */
export type SelectInput<T> = {
  [K in keyof T]?: boolean;
};

/**
 * Include Input
 */
export type IncludeInput<T> = {
  [K in keyof T]?: boolean | NestedInclude<T[K]>;
};

export interface NestedInclude<T> {
  select?: SelectInput<T>;
  include?: IncludeInput<T>;
  where?: WhereInput<T>;
  orderBy?: OrderByInput<T>;
  skip?: number;
  take?: number;
}

/**
 * Create Input
 */
export type CreateInput<T> = {
  [K in keyof T]?: T[K] | NestedCreate<T[K]>;
};

export interface NestedCreate<T> {
  create?: CreateInput<T> | CreateInput<T>[];
  connectOrCreate?: {
    where: WhereUniqueInput<T>;
    create: CreateInput<T>;
  };
  connect?: WhereUniqueInput<T> | WhereUniqueInput<T>[];
}

/**
 * Update Input
 */
export type UpdateInput<T> = {
  [K in keyof T]?: T[K] | FieldUpdate<T[K]> | NestedUpdate<T[K]>;
};

export interface FieldUpdate<T> {
  set?: T;
  increment?: number;
  decrement?: number;
  multiply?: number;
  divide?: number;
}

export interface NestedUpdate<T> {
  create?: CreateInput<T> | CreateInput<T>[];
  connectOrCreate?: {
    where: WhereUniqueInput<T>;
    create: CreateInput<T>;
  };
  upsert?: {
    where: WhereUniqueInput<T>;
    create: CreateInput<T>;
    update: UpdateInput<T>;
  };
  connect?: WhereUniqueInput<T> | WhereUniqueInput<T>[];
  disconnect?: WhereUniqueInput<T> | WhereUniqueInput<T>[];
  delete?: WhereUniqueInput<T> | WhereUniqueInput<T>[];
  update?: {
    where: WhereUniqueInput<T>;
    data: UpdateInput<T>;
  };
  updateMany?: {
    where: WhereInput<T>;
    data: UpdateInput<T>;
  };
  deleteMany?: WhereInput<T>;
}

/**
 * Count Select
 */
export type CountSelect<T> =
  | boolean
  | {
      [K in keyof T]?: boolean;
    };

/**
 * Sum Select
 */
export type SumSelect<T> = {
  [K in keyof T]?: boolean;
};

/**
 * Avg Select
 */
export type AvgSelect<T> = {
  [K in keyof T]?: boolean;
};

/**
 * Min Select
 */
export type MinSelect<T> = {
  [K in keyof T]?: boolean;
};

/**
 * Max Select
 */
export type MaxSelect<T> = {
  [K in keyof T]?: boolean;
};

/**
 * Having Input
 */
export type HavingInput<T> = WhereInput<T>;

/**
 * Prisma Promise
 */
export interface PrismaPromise<T> extends Promise<T> {
  [Symbol.toStringTag]: 'PrismaPromise';
}

/**
 * Decimal type
 */
export class Decimal {
  constructor(value: string | number) {}
  toString(): string {
    return '';
  }
  toNumber(): number {
    return 0;
  }
  toFixed(decimals?: number): string {
    return '';
  }
}

/**
 * JSON types
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface JsonArray extends Array<JsonValue> {}

/**
 * Batch Payload
 */
export interface BatchPayload {
  count: number;
}

/**
 * Result types
 */
export interface AggregateResult {
  _count?: any;
  _sum?: any;
  _avg?: any;
  _min?: any;
  _max?: any;
}

/**
 * Datasource types
 */
export type Datasource = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'sqlserver';

/**
 * Engine types
 */
export interface QueryEngineConfig {
  datasourceUrl: string;
  pool?: any;
  logLevel?: LogLevel;
  metrics?: any;
}

export interface QueryResult {
  rows: any[];
  affectedRows: number;
  fields: FieldInfo[];
}

export interface FieldInfo {
  name: string;
  type: string;
  nullable: boolean;
}

/**
 * Migration types
 */
export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
  timestamp: Date;
  applied: boolean;
}

export interface MigrationHistory {
  id: string;
  name: string;
  appliedAt: Date;
}

/**
 * Schema types
 */
export interface Schema {
  datasources: DatasourceConfig[];
  generators: GeneratorConfig[];
  models: ModelSchema[];
  enums: EnumSchema[];
  types: TypeSchema[];
}

export interface DatasourceConfig {
  name: string;
  provider: Datasource;
  url: string;
}

export interface GeneratorConfig {
  name: string;
  provider: string;
  output?: string;
}

export interface ModelSchema {
  name: string;
  fields: FieldSchema[];
  idFields: string[];
  uniqueFields: string[][];
  indexes: IndexSchema[];
}

export interface FieldSchema {
  name: string;
  type: string;
  isRequired: boolean;
  isList: boolean;
  isId: boolean;
  isUnique: boolean;
  isUpdatedAt: boolean;
  default?: any;
  relation?: RelationSchema;
}

export interface RelationSchema {
  name: string;
  fields: string[];
  references: string[];
  onDelete?: 'Cascade' | 'SetNull' | 'Restrict' | 'NoAction';
  onUpdate?: 'Cascade' | 'SetNull' | 'Restrict' | 'NoAction';
}

export interface IndexSchema {
  name?: string;
  fields: string[];
  isUnique: boolean;
}

export interface EnumSchema {
  name: string;
  values: string[];
}

export interface TypeSchema {
  name: string;
  fields: FieldSchema[];
}

/**
 * Validator types
 */
export interface ValidationRule {
  type: string;
  message: string;
  validate: (value: any) => boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
