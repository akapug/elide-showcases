/**
 * Query Builder implementation
 */

import { DataSource } from './connection';

export interface QueryBuilder {
  getSql(): string;
  getParameters(): any[];
  execute(): Promise<any>;
}

export class SelectQueryBuilder<Entity> implements QueryBuilder {
  private _alias?: string;
  private _from?: { entity: Function | string; alias: string };
  private _select: string[] = [];
  private _joins: Array<{ type: string; entity: string; alias: string; condition?: string }> = [];
  private _where: string[] = [];
  private _groupBy: string[] = [];
  private _having: string[] = [];
  private _orderBy: Array<{ field: string; order: 'ASC' | 'DESC' }> = [];
  private _limit?: number;
  private _offset?: number;
  private _parameters: Record<string, any> = {};
  private _parameterIndex = 0;

  constructor(private connection: DataSource) {}

  select(selection?: string | string[]): this {
    if (!selection) {
      this._select = ['*'];
    } else if (typeof selection === 'string') {
      this._select = [selection];
    } else {
      this._select = selection;
    }
    return this;
  }

  addSelect(selection: string | string[]): this {
    if (typeof selection === 'string') {
      this._select.push(selection);
    } else {
      this._select.push(...selection);
    }
    return this;
  }

  from<T>(entity: Function | string, alias: string): SelectQueryBuilder<T> {
    this._from = { entity, alias };
    this._alias = alias;
    return this as any;
  }

  innerJoin(entity: string, alias: string, condition?: string, parameters?: any): this {
    this._joins.push({ type: 'INNER', entity, alias, condition });
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  leftJoin(entity: string, alias: string, condition?: string, parameters?: any): this {
    this._joins.push({ type: 'LEFT', entity, alias, condition });
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  innerJoinAndSelect(entity: string, alias: string, condition?: string, parameters?: any): this {
    return this.innerJoin(entity, alias, condition, parameters);
  }

  leftJoinAndSelect(entity: string, alias: string, condition?: string, parameters?: any): this {
    return this.leftJoin(entity, alias, condition, parameters);
  }

  where(condition: string, parameters?: any): this {
    this._where = [condition];
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  andWhere(condition: string, parameters?: any): this {
    this._where.push(condition);
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  orWhere(condition: string, parameters?: any): this {
    if (this._where.length > 0) {
      this._where[this._where.length - 1] = `(${this._where[this._where.length - 1]}) OR (${condition})`;
    } else {
      this._where.push(condition);
    }
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  groupBy(field: string): this {
    this._groupBy = [field];
    return this;
  }

  addGroupBy(field: string): this {
    this._groupBy.push(field);
    return this;
  }

  having(condition: string, parameters?: any): this {
    this._having = [condition];
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  andHaving(condition: string, parameters?: any): this {
    this._having.push(condition);
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  orderBy(field: string, order: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderBy = [{ field, order }];
    return this;
  }

  addOrderBy(field: string, order: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderBy.push({ field, order });
    return this;
  }

  take(limit: number): this {
    this._limit = limit;
    return this;
  }

  skip(offset: number): this {
    this._offset = offset;
    return this;
  }

  limit(limit: number): this {
    return this.take(limit);
  }

  offset(offset: number): this {
    return this.skip(offset);
  }

  setParameter(key: string, value: any): this {
    this._parameters[key] = value;
    return this;
  }

  setParameters(parameters: Record<string, any>): this {
    Object.assign(this._parameters, parameters);
    return this;
  }

  getSql(): string {
    let sql = `SELECT ${this._select.join(', ')}`;

    if (this._from) {
      const fromTable = typeof this._from.entity === 'string'
        ? this._from.entity
        : (this._from.entity as any).name;
      sql += ` FROM ${fromTable} AS ${this._from.alias}`;
    }

    for (const join of this._joins) {
      sql += ` ${join.type} JOIN ${join.entity} AS ${join.alias}`;
      if (join.condition) {
        sql += ` ON ${join.condition}`;
      }
    }

    if (this._where.length > 0) {
      sql += ` WHERE ${this._where.join(' AND ')}`;
    }

    if (this._groupBy.length > 0) {
      sql += ` GROUP BY ${this._groupBy.join(', ')}`;
    }

    if (this._having.length > 0) {
      sql += ` HAVING ${this._having.join(' AND ')}`;
    }

    if (this._orderBy.length > 0) {
      sql += ` ORDER BY ${this._orderBy.map(o => `${o.field} ${o.order}`).join(', ')}`;
    }

    if (this._limit !== undefined) {
      sql += ` LIMIT ${this._limit}`;
    }

    if (this._offset !== undefined) {
      sql += ` OFFSET ${this._offset}`;
    }

    return sql;
  }

  getParameters(): any[] {
    return Object.values(this._parameters);
  }

  async execute(): Promise<any> {
    return this.connection.query(this.getSql(), this.getParameters());
  }

  async getMany(): Promise<Entity[]> {
    return this.execute();
  }

  async getOne(): Promise<Entity | null> {
    this.take(1);
    const results = await this.getMany();
    return results[0] || null;
  }

  async getRawMany(): Promise<any[]> {
    return this.execute();
  }

  async getRawOne(): Promise<any> {
    this.take(1);
    const results = await this.getRawMany();
    return results[0] || null;
  }

  async getCount(): Promise<number> {
    const countQb = this.clone();
    countQb._select = ['COUNT(*) as count'];
    const result = await countQb.getRawOne();
    return result?.count || 0;
  }

  async getManyAndCount(): Promise<[Entity[], number]> {
    const [entities, count] = await Promise.all([
      this.getMany(),
      this.getCount()
    ]);
    return [entities, count];
  }

  clone(): SelectQueryBuilder<Entity> {
    const qb = new SelectQueryBuilder<Entity>(this.connection);
    qb._select = [...this._select];
    qb._from = this._from;
    qb._joins = [...this._joins];
    qb._where = [...this._where];
    qb._groupBy = [...this._groupBy];
    qb._having = [...this._having];
    qb._orderBy = [...this._orderBy];
    qb._limit = this._limit;
    qb._offset = this._offset;
    qb._parameters = { ...this._parameters };
    return qb;
  }
}

export class InsertQueryBuilder<Entity> implements QueryBuilder {
  private _into?: string;
  private _values: any[] = [];
  private _returning: string[] = [];

  constructor(private connection: DataSource) {}

  into(entity: Function | string): this {
    this._into = typeof entity === 'string' ? entity : (entity as any).name;
    return this;
  }

  values(values: any | any[]): this {
    this._values = Array.isArray(values) ? values : [values];
    return this;
  }

  returning(selection: string | string[]): this {
    this._returning = typeof selection === 'string' ? [selection] : selection;
    return this;
  }

  getSql(): string {
    if (!this._into) throw new Error('Table not specified');
    if (this._values.length === 0) throw new Error('No values to insert');

    const fields = Object.keys(this._values[0]);
    let sql = `INSERT INTO ${this._into} (${fields.join(', ')}) VALUES `;

    const valuePlaceholders = this._values.map((_, idx) => {
      return `(${fields.map((_, fIdx) => `:param${idx}_${fIdx}`).join(', ')})`;
    });

    sql += valuePlaceholders.join(', ');

    if (this._returning.length > 0) {
      sql += ` RETURNING ${this._returning.join(', ')}`;
    }

    return sql;
  }

  getParameters(): any[] {
    const params: any[] = [];
    for (const value of this._values) {
      params.push(...Object.values(value));
    }
    return params;
  }

  async execute(): Promise<any> {
    return this.connection.query(this.getSql(), this.getParameters());
  }
}

export class UpdateQueryBuilder<Entity> implements QueryBuilder {
  private _table?: string;
  private _set: Record<string, any> = {};
  private _where: string[] = [];
  private _parameters: Record<string, any> = {};
  private _returning: string[] = [];

  constructor(private connection: DataSource) {}

  update(entity: Function | string): this {
    this._table = typeof entity === 'string' ? entity : (entity as any).name;
    return this;
  }

  set(values: Record<string, any>): this {
    this._set = values;
    return this;
  }

  where(condition: string, parameters?: any): this {
    this._where = [condition];
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  andWhere(condition: string, parameters?: any): this {
    this._where.push(condition);
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  returning(selection: string | string[]): this {
    this._returning = typeof selection === 'string' ? [selection] : selection;
    return this;
  }

  getSql(): string {
    if (!this._table) throw new Error('Table not specified');

    const setClause = Object.keys(this._set)
      .map(key => `${key} = :${key}`)
      .join(', ');

    let sql = `UPDATE ${this._table} SET ${setClause}`;

    if (this._where.length > 0) {
      sql += ` WHERE ${this._where.join(' AND ')}`;
    }

    if (this._returning.length > 0) {
      sql += ` RETURNING ${this._returning.join(', ')}`;
    }

    return sql;
  }

  getParameters(): any[] {
    return [...Object.values(this._set), ...Object.values(this._parameters)];
  }

  async execute(): Promise<any> {
    return this.connection.query(this.getSql(), this.getParameters());
  }
}

export class DeleteQueryBuilder<Entity> implements QueryBuilder {
  private _from?: string;
  private _where: string[] = [];
  private _parameters: Record<string, any> = {};
  private _returning: string[] = [];

  constructor(private connection: DataSource) {}

  from(entity: Function | string): this {
    this._from = typeof entity === 'string' ? entity : (entity as any).name;
    return this;
  }

  where(condition: string, parameters?: any): this {
    this._where = [condition];
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  andWhere(condition: string, parameters?: any): this {
    this._where.push(condition);
    if (parameters) {
      Object.assign(this._parameters, parameters);
    }
    return this;
  }

  returning(selection: string | string[]): this {
    this._returning = typeof selection === 'string' ? [selection] : selection;
    return this;
  }

  getSql(): string {
    if (!this._from) throw new Error('Table not specified');

    let sql = `DELETE FROM ${this._from}`;

    if (this._where.length > 0) {
      sql += ` WHERE ${this._where.join(' AND ')}`;
    }

    if (this._returning.length > 0) {
      sql += ` RETURNING ${this._returning.join(', ')}`;
    }

    return sql;
  }

  getParameters(): any[] {
    return Object.values(this._parameters);
  }

  async execute(): Promise<any> {
    return this.connection.query(this.getSql(), this.getParameters());
  }
}
