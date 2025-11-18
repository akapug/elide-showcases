/**
 * sql-template-strings - SQL Template Strings
 * Based on https://www.npmjs.com/package/sql-template-strings (~3M+ downloads/week)
 */

interface SQLStatement {
  text: string;
  values: any[];
  sql: string;
}

function SQL(strings: TemplateStringsArray, ...values: any[]): SQLStatement {
  let text = '';
  let sql = '';
  
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    sql += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
      sql += `$${i + 1}`;
    }
  }
  
  return { text, sql, values };
}

export default SQL;
if (import.meta.url.includes("elide-sql-template-strings.ts")) {
  console.log("✅ sql-template-strings - SQL Template Strings (POLYGLOT!)\n");

  const SQL = (await import('./elide-sql-template-strings.ts')).default;
  
  const userId = 1;
  const query = SQL\`SELECT * FROM users WHERE id = \${userId}\`;
  
  console.log('SQL:', query.sql);
  console.log('Values:', query.values);
  console.log('SQL template strings ready!');
  console.log("\n🚀 ~3M+ downloads/week | SQL Template Strings\n");
}
