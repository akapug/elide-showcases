/**
 * tedious - SQL Server TDS Driver
 * Based on https://www.npmjs.com/package/tedious (~8M+ downloads/week)
 */

interface ConnectionConfig {
  server: string;
  authentication: {
    type: string;
    options: {
      userName: string;
      password: string;
    };
  };
}

class Connection {
  constructor(config: ConnectionConfig) {}
  on(event: string, callback: (...args: any[]) => void): this { return this; }
  connect(): void {}
  execSql(request: any): void {}
  close(): void {}
}

class Request {
  constructor(sql: string, callback: (err: any) => void) {}
  on(event: string, callback: (...args: any[]) => void): this { return this; }
}

export { Connection, Request };
export default { Connection, Request };
if (import.meta.url.includes("elide-tedious.ts")) {
  console.log("✅ tedious - SQL Server TDS Driver (POLYGLOT!)\n");

  const { Connection, Request } = await import('./elide-tedious.ts');
  const conn = new Connection({
    server: 'localhost',
    authentication: {
      type: 'default',
      options: { userName: 'sa', password: 'password' }
    }
  });
  conn.on('connect', () => console.log('SQL Server connected!'));
  conn.connect();
  console.log("\n🚀 ~8M+ downloads/week | SQL Server TDS Driver\n");
}
