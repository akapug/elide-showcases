import Database from '../src';

// Advanced SQLite usage
const db = new Database(':memory:', {
  enableWAL: true,
  cacheSize: -64000
});

// User-defined functions
db.function('reverse', (str: string) => str.split('').reverse().join(''));
db.function('pow', (a: number, b: number) => Math.pow(a, b));

// User-defined aggregates
db.aggregate('product', {
  start: () => 1,
  step: (total, value) => total * value,
  finalize: (total) => total
});

db.exec(`
  CREATE TABLE numbers (value INTEGER);
  INSERT INTO numbers (value) VALUES (1), (2), (3), (4), (5);
`);

console.log('Custom functions:');
console.log(db.prepare('SELECT reverse(?) as reversed').get('hello'));
console.log(db.prepare('SELECT pow(2, 10) as result').get());

console.log('Custom aggregate:');
console.log(db.prepare('SELECT product(value) as result FROM numbers').get());

// Performance optimization with indexes
db.exec(`
  CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL
  );
  CREATE INDEX idx_category ON products(category);
  CREATE INDEX idx_price ON products(price);
`);

const insertProduct = db.prepare('INSERT INTO products (name, category, price) VALUES (?, ?, ?)');
const insertMany = db.transaction((products: any[]) => {
  for (const p of products) {
    insertProduct.run(p.name, p.category, p.price);
  }
});

const sampleProducts = Array.from({ length: 1000 }, (_, i) => ({
  name: `Product ${i}`,
  category: ['Electronics', 'Books', 'Clothing'][i % 3],
  price: Math.random() * 1000
}));

console.time('Insert 1000 products');
insertMany(sampleProducts);
console.timeEnd('Insert 1000 products');

// Complex queries
const expensiveElectronics = db.prepare(`
  SELECT * FROM products
  WHERE category = 'Electronics' AND price > 500
  ORDER BY price DESC
  LIMIT 10
`).all();

console.log('Expensive electronics:', expensiveElectronics.length);

// Backup database
const backup = db.backup('backup.db', {
  progress({ totalPages, remainingPages, percentComplete }) {
    console.log(`Backup progress: ${percentComplete.toFixed(2)}%`);
  }
});
backup.executeSync();

db.close();
console.log('Advanced demo complete!');
