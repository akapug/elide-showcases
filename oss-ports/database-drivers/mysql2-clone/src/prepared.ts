export class PreparedStatement {
  constructor(private conn: any, private sql: string) {}
  async prepare(): Promise<void> {}
  async execute(values?: any[]): Promise<any> { return this.conn.execute(this.sql, values); }
  async close(): Promise<void> {}
}
