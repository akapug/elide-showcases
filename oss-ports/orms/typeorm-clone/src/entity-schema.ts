/**
 * Entity schema - programmatic entity definition
 */

export class EntitySchema<T = any> {
  constructor(private options: EntitySchemaOptions<T>) {}

  get name(): string {
    return this.options.name;
  }

  get target(): Function | string {
    return this.options.target || this.options.name;
  }
}

export interface EntitySchemaOptions<T> {
  name: string;
  target?: Function | string;
  tableName?: string;
  columns: Record<string, EntitySchemaColumnOptions>;
  relations?: Record<string, EntitySchemaRelationOptions>;
  indices?: EntitySchemaIndexOptions[];
  uniques?: EntitySchemaUniqueOptions[];
}

export interface EntitySchemaColumnOptions {
  type: string;
  primary?: boolean;
  generated?: boolean | 'increment' | 'uuid';
  nullable?: boolean;
  default?: any;
  unique?: boolean;
  length?: number;
}

export interface EntitySchemaRelationOptions {
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  target: string | Function;
  inverseSide?: string;
  joinColumn?: boolean | { name?: string; referencedColumnName?: string };
  joinTable?: boolean | { name?: string };
}

export interface EntitySchemaIndexOptions {
  columns: string[];
  unique?: boolean;
}

export interface EntitySchemaUniqueOptions {
  columns: string[];
}
