/**
 * Delete query builder
 */

export class DeleteQueryBuilder<DB, TB extends keyof DB & string> {
  private _where: any[] = [];
  private _returning: string[] = [];

  constructor(private config: any, private table: TB) {}

  where(column: string, operator: string, value: any) {
    this._where.push({ column, operator, value });
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

  async execute() {
    const sql = this.compile();
    return await this.config.dialect.executeQuery(sql);
  }

  compile(): string {
    let sql = `DELETE FROM ${this.table}`;

    if (this._where.length > 0) {
      sql += ' WHERE ';
      sql += this._where
        .map(w => `${w.column} ${w.operator} ${JSON.stringify(w.value)}`)
        .join(' AND ');
    }

    if (this._returning.length > 0) {
      sql += ` RETURNING ${this._returning.join(', ')}`;
    }

    return sql;
  }
}
