import * as types from './types';

export class PreparedStatement {
  private client: any;
  private name: string;
  private text: string;
  private paramCount?: number;
  private prepared: boolean = false;

  constructor(client: any, name: string, text: string, paramCount?: number) {
    this.client = client;
    this.name = name;
    this.text = text;
    this.paramCount = paramCount;
  }

  async prepare(): Promise<void> {
    if (this.prepared) return;
    await this.client.query({
      name: this.name,
      text: this.text
    });
    this.prepared = true;
  }

  async execute<T = any>(values: any[]): Promise<types.QueryResult<T>> {
    if (!this.prepared) {
      await this.prepare();
    }

    return this.client.query<T>({
      name: this.name,
      text: this.text,
      values
    });
  }

  async close(): Promise<void> {
    if (!this.prepared) return;
    await this.client.query(`DEALLOCATE ${this.name}`);
    this.prepared = false;
  }
}
