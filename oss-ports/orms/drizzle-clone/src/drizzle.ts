/**
 * Main Drizzle instance
 */

export function drizzle(connection: any, config?: any) {
  return new DrizzleInstance(connection, config);
}

class DrizzleInstance {
  constructor(private connection: any, private config: any = {}) {}

  select<T extends Record<string, any>>(fields?: T) {
    return new SelectBuilder(this.connection, fields);
  }

  insert<T>(table: any) {
    return new InsertBuilder(this.connection, table);
  }

  update<T>(table: any) {
    return new UpdateBuilder(this.connection, table);
  }

  delete<T>(table: any) {
    return new DeleteBuilder(this.connection, table);
  }

  async transaction<T>(callback: (tx: DrizzleInstance) => Promise<T>): Promise<T> {
    await this.connection.query('BEGIN');
    try {
      const tx = new DrizzleInstance(this.connection, this.config);
      const result = await callback(tx);
      await this.connection.query('COMMIT');
      return result;
    } catch (error) {
      await this.connection.query('ROLLBACK');
      throw error;
    }
  }

  get query() {
    return this.config.schema || {};
  }
}

class SelectBuilder<T = any> {
  private _from?: any;
  private _where?: any;
  private _joins: any[] = [];
  private _orderBy: any[] = [];
  private _limit?: number;
  private _offset?: number;
  private _groupBy: any[] = [];
  private _having?: any;

  constructor(private connection: any, private fields?: any) {}

  from(table: any) {
    this._from = table;
    return this;
  }

  where(condition: any) {
    this._where = condition;
    return this;
  }

  innerJoin(table: any, on: any) {
    this._joins.push({ type: 'INNER', table, on });
    return this;
  }

  leftJoin(table: any, on: any) {
    this._joins.push({ type: 'LEFT', table, on });
    return this;
  }

  rightJoin(table: any, on: any) {
    this._joins.push({ type: 'RIGHT', table, on });
    return this;
  }

  orderBy(...orders: any[]) {
    this._orderBy = orders;
    return this;
  }

  limit(limit: number) {
    this._limit = limit;
    return this;
  }

  offset(offset: number) {
    this._offset = offset;
    return this;
  }

  groupBy(...groups: any[]) {
    this._groupBy = groups;
    return this;
  }

  having(condition: any) {
    this._having = condition;
    return this;
  }

  async execute(): Promise<T[]> {
    const sql = this.toSQL();
    const result = await this.connection.query(sql);
    return result.rows || [];
  }

  then(resolve: (value: T[]) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject);
  }

  toSQL(): string {
    let sql = 'SELECT ';

    if (this.fields) {
      sql += Object.keys(this.fields).join(', ');
    } else {
      sql += '*';
    }

    if (this._from) {
      sql += ` FROM ${this._from.name}`;
    }

    for (const join of this._joins) {
      sql += ` ${join.type} JOIN ${join.table.name} ON ${join.on}`;
    }

    if (this._where) {
      sql += ` WHERE ${this._where}`;
    }

    if (this._groupBy.length > 0) {
      sql += ` GROUP BY ${this._groupBy.join(', ')}`;
    }

    if (this._having) {
      sql += ` HAVING ${this._having}`;
    }

    if (this._orderBy.length > 0) {
      sql += ` ORDER BY ${this._orderBy.join(', ')}`;
    }

    if (this._limit) {
      sql += ` LIMIT ${this._limit}`;
    }

    if (this._offset) {
      sql += ` OFFSET ${this._offset}`;
    }

    return sql;
  }
}

class InsertBuilder<T = any> {
  private _values: any[] = [];
  private _onConflict?: any;
  private _returning?: any;

  constructor(private connection: any, private table: any) {}

  values(values: any | any[]) {
    this._values = Array.isArray(values) ? values : [values];
    return this;
  }

  onConflictDoUpdate(config: any) {
    this._onConflict = { type: 'update', ...config };
    return this;
  }

  onConflictDoNothing() {
    this._onConflict = { type: 'nothing' };
    return this;
  }

  returning(fields?: any) {
    this._returning = fields;
    return this;
  }

  async execute(): Promise<T[]> {
    const sql = this.toSQL();
    const result = await this.connection.query(sql);
    return result.rows || [];
  }

  then(resolve: (value: T[]) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject);
  }

  toSQL(): string {
    const fields = Object.keys(this._values[0]);
    let sql = `INSERT INTO ${this.table.name} (${fields.join(', ')}) VALUES `;

    sql += this._values
      .map(v => `(${fields.map(f => JSON.stringify(v[f])).join(', ')})`)
      .join(', ');

    if (this._onConflict) {
      if (this._onConflict.type === 'nothing') {
        sql += ' ON CONFLICT DO NOTHING';
      } else {
        sql += ` ON CONFLICT (${this._onConflict.target.name}) DO UPDATE SET `;
        sql += Object.entries(this._onConflict.set)
          .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
          .join(', ');
      }
    }

    if (this._returning) {
      sql += ' RETURNING *';
    }

    return sql;
  }
}

class UpdateBuilder<T = any> {
  private _set: any = {};
  private _where?: any;
  private _returning?: any;

  constructor(private connection: any, private table: any) {}

  set(values: any) {
    this._set = values;
    return this;
  }

  where(condition: any) {
    this._where = condition;
    return this;
  }

  returning(fields?: any) {
    this._returning = fields;
    return this;
  }

  async execute(): Promise<T[]> {
    const sql = this.toSQL();
    const result = await this.connection.query(sql);
    return result.rows || [];
  }

  then(resolve: (value: T[]) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject);
  }

  toSQL(): string {
    let sql = `UPDATE ${this.table.name} SET `;

    sql += Object.entries(this._set)
      .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
      .join(', ');

    if (this._where) {
      sql += ` WHERE ${this._where}`;
    }

    if (this._returning) {
      sql += ' RETURNING *';
    }

    return sql;
  }
}

class DeleteBuilder<T = any> {
  private _where?: any;
  private _returning?: any;

  constructor(private connection: any, private table: any) {}

  where(condition: any) {
    this._where = condition;
    return this;
  }

  returning(fields?: any) {
    this._returning = fields;
    return this;
  }

  async execute(): Promise<T[]> {
    const sql = this.toSQL();
    const result = await this.connection.query(sql);
    return result.rows || [];
  }

  then(resolve: (value: T[]) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject);
  }

  toSQL(): string {
    let sql = `DELETE FROM ${this.table.name}`;

    if (this._where) {
      sql += ` WHERE ${this._where}`;
    }

    if (this._returning) {
      sql += ' RETURNING *';
    }

    return sql;
  }
}
