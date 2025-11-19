/**
 * Insert query builder
 */

export class InsertQueryBuilder<DB, TB extends keyof DB & string> {
  private _values: any[] = [];
  private _returning: string[] = [];
  private _onConflict?: any;

  constructor(private config: any, private table: TB) {}

  values(values: any | any[]) {
    this._values = Array.isArray(values) ? values : [values];
    return this;
  }

  returningAll() {
    this._returning = ['*'];
    return this;
  }

  returning(columns: string[]) {
    this._returning = columns;
    return this;
  }

  onConflict(builder: (oc: OnConflictBuilder) => any) {
    const oc = new OnConflictBuilder();
    this._onConflict = builder(oc).config;
    return this;
  }

  async execute() {
    const sql = this.compile();
    const result = await this.config.dialect.executeQuery(sql);
    return result;
  }

  async executeTakeFirst() {
    const result = await this.execute();
    return result.rows?.[0];
  }

  async executeTakeFirstOrThrow() {
    const result = await this.executeTakeFirst();
    if (!result) {
      throw new Error('No result returned');
    }
    return result;
  }

  compile(): string {
    const fields = Object.keys(this._values[0]);
    let sql = `INSERT INTO ${this.table} (${fields.join(', ')}) VALUES `;

    sql += this._values
      .map(v => `(${fields.map(f => JSON.stringify(v[f])).join(', ')})`)
      .join(', ');

    if (this._onConflict) {
      if (this._onConflict.action === 'nothing') {
        sql += ' ON CONFLICT DO NOTHING';
      } else if (this._onConflict.action === 'update') {
        sql += ` ON CONFLICT (${this._onConflict.columns.join(', ')}) DO UPDATE SET `;
        sql += Object.entries(this._onConflict.set)
          .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
          .join(', ');
      }
    }

    if (this._returning.length > 0) {
      sql += ` RETURNING ${this._returning.join(', ')}`;
    }

    return sql;
  }
}

class OnConflictBuilder {
  config: any = {};

  column(column: string) {
    this.config.columns = [column];
    return this;
  }

  columns(columns: string[]) {
    this.config.columns = columns;
    return this;
  }

  doNothing() {
    this.config.action = 'nothing';
    return this;
  }

  doUpdateSet(set: any) {
    this.config.action = 'update';
    this.config.set = set;
    return this;
  }
}
