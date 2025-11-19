/**
 * Select query builder
 */

export class SelectQueryBuilder<DB, TB extends keyof DB & string> {
  private _select: string[] = [];
  private _where: any[] = [];
  private _joins: any[] = [];
  private _orderBy: any[] = [];
  private _groupBy: string[] = [];
  private _having: any[] = [];
  private _limit?: number;
  private _offset?: number;
  private _distinct: boolean = false;

  constructor(private config: any, private table: TB) {}

  select<S extends keyof DB[TB]>(columns: S[] | readonly S[]) {
    this._select = columns as string[];
    return this;
  }

  selectAll() {
    this._select = ['*'];
    return this;
  }

  where(column: string, operator: string, value: any) {
    this._where.push({ column, operator, value });
    return this;
  }

  innerJoin<T extends keyof DB & string>(
    table: T,
    leftColumn: string,
    rightColumn: string
  ) {
    this._joins.push({ type: 'INNER', table, leftColumn, rightColumn });
    return this;
  }

  leftJoin<T extends keyof DB & string>(
    table: T,
    leftColumn: string,
    rightColumn: string
  ) {
    this._joins.push({ type: 'LEFT', table, leftColumn, rightColumn });
    return this;
  }

  rightJoin<T extends keyof DB & string>(
    table: T,
    leftColumn: string,
    rightColumn: string
  ) {
    this._joins.push({ type: 'RIGHT', table, leftColumn, rightColumn });
    return this;
  }

  fullJoin<T extends keyof DB & string>(
    table: T,
    leftColumn: string,
    rightColumn: string
  ) {
    this._joins.push({ type: 'FULL', table, leftColumn, rightColumn });
    return this;
  }

  orderBy(column: string, direction?: 'asc' | 'desc') {
    this._orderBy.push({ column, direction: direction || 'asc' });
    return this;
  }

  groupBy(...columns: string[]) {
    this._groupBy = columns;
    return this;
  }

  having(condition: any) {
    this._having.push(condition);
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

  distinct() {
    this._distinct = true;
    return this;
  }

  async execute(): Promise<any[]> {
    const sql = this.compile();
    const result = await this.config.dialect.executeQuery(sql);
    return result.rows || [];
  }

  async executeTakeFirst(): Promise<any | undefined> {
    this.limit(1);
    const results = await this.execute();
    return results[0];
  }

  async executeTakeFirstOrThrow(): Promise<any> {
    const result = await this.executeTakeFirst();
    if (!result) {
      throw new Error('No result found');
    }
    return result;
  }

  compile(): string {
    let sql = 'SELECT ';

    if (this._distinct) {
      sql += 'DISTINCT ';
    }

    sql += this._select.join(', ');
    sql += ` FROM ${this.table}`;

    for (const join of this._joins) {
      sql += ` ${join.type} JOIN ${join.table} ON ${join.leftColumn} = ${join.rightColumn}`;
    }

    if (this._where.length > 0) {
      sql += ' WHERE ';
      sql += this._where
        .map(w => `${w.column} ${w.operator} ${JSON.stringify(w.value)}`)
        .join(' AND ');
    }

    if (this._groupBy.length > 0) {
      sql += ` GROUP BY ${this._groupBy.join(', ')}`;
    }

    if (this._having.length > 0) {
      sql += ` HAVING ${this._having.join(' AND ')}`;
    }

    if (this._orderBy.length > 0) {
      sql += ' ORDER BY ';
      sql += this._orderBy
        .map(o => `${o.column} ${o.direction.toUpperCase()}`)
        .join(', ');
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
