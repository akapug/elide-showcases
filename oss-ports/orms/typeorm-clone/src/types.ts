/**
 * TypeORM type definitions
 */

export interface FindOptionsWhere<Entity> {
  [key: string]: any;
}

export interface FindOptionsOrder<Entity> {
  [key: string]: 'ASC' | 'DESC' | FindOptionsOrder<any>;
}

export interface FindOptionsRelations<Entity> {
  [key: string]: boolean | FindOptionsRelations<any>;
}

export interface FindOptionsSelect<Entity> {
  [key: string]: boolean | FindOptionsSelect<any>;
}

export interface FindManyOptions<Entity = any> {
  where?: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[];
  select?: FindOptionsSelect<Entity>;
  relations?: FindOptionsRelations<Entity> | string[];
  order?: FindOptionsOrder<Entity>;
  skip?: number;
  take?: number;
  cache?: boolean | number | { id: any; milliseconds: number };
  lock?: { mode: 'optimistic' | 'pessimistic_read' | 'pessimistic_write'; version?: number };
  withDeleted?: boolean;
  loadEagerRelations?: boolean;
  transaction?: boolean;
}

export interface FindOneOptions<Entity = any> extends FindManyOptions<Entity> {}

export interface SaveOptions {
  data?: any;
  reload?: boolean;
  listeners?: boolean;
  transaction?: boolean;
  chunk?: number;
}

export interface RemoveOptions {
  data?: any;
  listeners?: boolean;
  transaction?: boolean;
  chunk?: number;
}

export interface InsertResult {
  identifiers: any[];
  generatedMaps: any[];
  raw: any;
}

export interface UpdateResult {
  affected?: number;
  raw: any;
  generatedMaps: any[];
}

export interface DeleteResult {
  affected?: number;
  raw: any;
}
