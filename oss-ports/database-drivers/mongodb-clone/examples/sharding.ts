import { MongoClient } from '../src';

async function main() {
  console.log('=== MongoDB Sharding Example ===\n');

  const client = new MongoClient('mongodb://mongos1:27017,mongos2:27017', {
    replicaSet: 'myReplicaSet'
  });

  await client.connect();

  const admin = client.db('admin');
  const db = client.db('sharded_database');

  console.log('--- Enable Sharding ---');
  await admin.command({ enableSharding: 'sharded_database' });

  console.log('\n--- Create Sharded Collection ---');
  const products = db.collection('products');

  await admin.command({
    shardCollection: 'sharded_database.products',
    key: { category: 1, _id: 1 }
  });

  console.log('\n--- Insert Data Across Shards ---');
  const categories = ['Electronics', 'Books', 'Clothing', 'Home', 'Sports'];
  const productsData = [];

  for (let i = 0; i < 10000; i++) {
    productsData.push({
      _id: i,
      category: categories[i % categories.length],
      name: `Product ${i}`,
      price: Math.random() * 1000,
      stock: Math.floor(Math.random() * 100),
      tags: [`tag${i % 10}`, `tag${i % 20}`]
    });
  }

  await products.insertMany(productsData);
  console.log(`Inserted ${productsData.length} products across shards`);

  console.log('\n--- Query Distribution ---');
  const electronics = await products.find({
    category: 'Electronics'
  }).toArray();
  console.log(`Found ${electronics.length} electronics products`);

  console.log('\n--- Aggregation Across Shards ---');
  const categoryStats = await products.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        totalStock: { $sum: '$stock' }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log('Category statistics:');
  console.table(categoryStats);

  console.log('\n--- Shard Distribution ---');
  const shardStats = await admin.command({
    shardDistribution: 'sharded_database.products'
  });
  console.log('Shard distribution:', shardStats);

  console.log('\n--- Chunk Information ---');
  const chunks = await admin.db('config').collection('chunks')
    .find({ ns: 'sharded_database.products' })
    .toArray();
  console.log(`Total chunks: ${chunks.length}`);

  console.log('\n--- Move Chunk (Balancing) ---');
  if (chunks.length > 0) {
    try {
      await admin.command({
        moveChunk: 'sharded_database.products',
        find: { category: 'Electronics' },
        to: 'shard0001'
      });
      console.log('Chunk moved successfully');
    } catch (error) {
      console.log('Chunk move skipped (auto-balancing enabled)');
    }
  }

  await client.close();
  console.log('\nSharding example complete!');
}

main().catch(console.error);
