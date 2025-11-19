import { MongoClient } from '../src';

async function main() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();

  const db = client.db('aggregation_demo');
  const orders = db.collection('orders');

  // Sample data
  await orders.insertMany([
    { customer: 'Alice', product: 'Laptop', price: 1200, quantity: 1, date: new Date('2024-01-15') },
    { customer: 'Bob', product: 'Mouse', price: 25, quantity: 2, date: new Date('2024-01-16') },
    { customer: 'Alice', product: 'Keyboard', price: 80, quantity: 1, date: new Date('2024-01-17') },
    { customer: 'Charlie', product: 'Monitor', price: 300, quantity: 2, date: new Date('2024-01-18') },
    { customer: 'Bob', product: 'Laptop', price: 1200, quantity: 1, date: new Date('2024-01-19') },
  ]);

  console.log('=== Aggregation Pipeline Demo ===\n');

  // Pipeline 1: Total sales by customer
  console.log('Total sales by customer:');
  const salesByCustomer = await orders.aggregate([
    { $addFields: { total: { $multiply: ['$price', '$quantity'] } } },
    { $group: {
        _id: '$customer',
        totalSpent: { $sum: '$total' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } }
  ]).toArray();
  console.log(salesByCustomer);

  // Pipeline 2: Product statistics
  console.log('\nProduct statistics:');
  const productStats = await orders.aggregate([
    { $group: {
        _id: '$product',
        totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } },
        unitsSold: { $sum: '$quantity' },
        avgPrice: { $avg: '$price' }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]).toArray();
  console.log(productStats);

  // Pipeline 3: Daily sales trend
  console.log('\nDaily sales trend:');
  const dailySales = await orders.aggregate([
    { $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        },
        revenue: { $sum: { $multiply: ['$price', '$quantity'] } },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]).toArray();
  console.log(dailySales);

  await client.close();
  console.log('\nDemo complete!');
}

main().catch(console.error);
