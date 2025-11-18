/**
 * LowDB - Small JSON Database
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 5M+ downloads/week
 */

export class LowDB<T extends Record<string, any>> {
  constructor(private data: T) {}

  get data(): T {
    return this.data;
  }

  set(key: keyof T, value: any): this {
    this.data[key] = value;
    return this;
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key];
  }

  update(fn: (data: T) => void): this {
    fn(this.data);
    return this;
  }

  write(): this {
    // In-memory only for this demo
    return this;
  }

  read(): this {
    return this;
  }
}

export class JSONFile<T extends Record<string, any>> {
  private data: T;

  constructor(filename: string, private defaultData: T) {
    this.data = { ...defaultData };
  }

  read(): T {
    return this.data;
  }

  write(data: T): void {
    this.data = data;
  }
}

export class Low<T extends Record<string, any>> {
  public data: T;

  constructor(private adapter: JSONFile<T>) {
    this.data = adapter.read();
  }

  read(): this {
    this.data = this.adapter.read();
    return this;
  }

  write(): this {
    this.adapter.write(this.data);
    return this;
  }
}

if (import.meta.url.includes("lowdb")) {
  console.log("🎯 LowDB for Elide - Small JSON Database\n");

  interface Schema {
    posts: Array<{ id: number; title: string }>;
    user: { name: string };
  }

  const adapter = new JSONFile<Schema>('db.json', { posts: [], user: { name: 'Guest' } });
  const db = new Low(adapter);

  db.data.posts.push({ id: 1, title: 'Hello World' });
  db.data.user.name = 'Alice';
  db.write();

  console.log("Data:", db.data);
  console.log("\n✅ Simple JSON database");
  console.log("🚀 5M+ npm downloads/week - Polyglot-ready");
}

export default { Low, JSONFile };
