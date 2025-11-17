import { MongoClient } from '../src';

async function main() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();

  const db = client.db('crud_demo');
  const users = db.collection('users');

  console.log('=== MongoDB CRUD Operations Demo ===\n');

  await users.deleteMany({});

  console.log('--- Create Operations ---');
  const insertOneResult = await users.insertOne({
    name: 'Alice Johnson',
    email: 'alice@example.com',
    age: 28,
    interests: ['coding', 'music', 'travel'],
    address: {
      street: '123 Main St',
      city: 'Boston',
      state: 'MA',
      zip: '02101'
    },
    createdAt: new Date()
  });
  console.log('Inserted user ID:', insertOneResult.insertedId);

  const insertManyResult = await users.insertMany([
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      age: 35,
      interests: ['sports', 'cooking'],
      address: { city: 'New York', state: 'NY' },
      createdAt: new Date()
    },
    {
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      age: 42,
      interests: ['reading', 'gardening', 'photography'],
      address: { city: 'San Francisco', state: 'CA' },
      createdAt: new Date()
    },
    {
      name: 'Diana Prince',
      email: 'diana@example.com',
      age: 31,
      interests: ['fitness', 'yoga', 'meditation'],
      address: { city: 'Seattle', state: 'WA' },
      createdAt: new Date()
    }
  ]);
  console.log(`Inserted ${insertManyResult.insertedCount} users`);

  console.log('\n--- Read Operations ---');
  const allUsers = await users.find({}).toArray();
  console.log(`Total users: ${allUsers.length}`);

  const user = await users.findOne({ name: 'Alice Johnson' });
  console.log('Found user:', user?.name);

  const youngUsers = await users.find({ age: { $lt: 35 } }).toArray();
  console.log(`Users under 35: ${youngUsers.length}`);

  const sortedUsers = await users.find({})
    .sort({ age: -1 })
    .limit(2)
    .toArray();
  console.log('Top 2 oldest users:', sortedUsers.map(u => u.name));

  const eastCoastUsers = await users.find({
    'address.state': { $in: ['NY', 'MA'] }
  }).toArray();
  console.log(`East coast users: ${eastCoastUsers.length}`);

  const interestsProjection = await users.find({})
    .project({ name: 1, interests: 1, _id: 0 })
    .toArray();
  console.log('Users with interests projection:', interestsProjection.length);

  console.log('\n--- Update Operations ---');
  const updateOneResult = await users.updateOne(
    { name: 'Alice Johnson' },
    { $set: { age: 29, 'address.zip': '02102' } }
  );
  console.log(`Modified ${updateOneResult.modifiedCount} document`);

  const updateManyResult = await users.updateMany(
    { age: { $gte: 30 } },
    { $push: { interests: 'travel' } as any }
  );
  console.log(`Modified ${updateManyResult.modifiedCount} documents (added interest)`);

  const incrementResult = await users.updateMany(
    {},
    { $inc: { age: 1 } }
  );
  console.log(`Incremented age for ${incrementResult.modifiedCount} users`);

  const replaceResult = await users.replaceOne(
    { name: 'Bob Smith' },
    {
      name: 'Bob Smith',
      email: 'bob.smith@example.com',
      age: 36,
      interests: ['sports', 'cooking', 'technology'],
      status: 'active',
      updatedAt: new Date()
    }
  );
  console.log(`Replaced ${replaceResult.modifiedCount} document`);

  console.log('\n--- Delete Operations ---');
  const deleteOneResult = await users.deleteOne({ name: 'Charlie Brown' });
  console.log(`Deleted ${deleteOneResult.deletedCount} document`);

  const deleteManyResult = await users.deleteMany({ age: { $gt: 40 } });
  console.log(`Deleted ${deleteManyResult.deletedCount} documents`);

  console.log('\n--- Advanced Query Operations ---');
  const count = await users.countDocuments({});
  console.log(`Total documents: ${count}`);

  const distinctCities = await users.distinct('address.city');
  console.log('Distinct cities:', distinctCities);

  const bulkOps = await users.bulkWrite([
    {
      insertOne: {
        document: {
          name: 'Eve Adams',
          email: 'eve@example.com',
          age: 27,
          interests: ['art', 'music']
        }
      }
    },
    {
      updateOne: {
        filter: { name: 'Alice Johnson' },
        update: { $set: { verified: true } }
      }
    },
    {
      deleteOne: {
        filter: { age: { $lt: 25 } }
      }
    }
  ]);
  console.log('Bulk operations result:', {
    inserted: bulkOps.insertedCount,
    modified: bulkOps.modifiedCount,
    deleted: bulkOps.deletedCount
  });

  const finalCount = await users.countDocuments({});
  console.log(`\nFinal user count: ${finalCount}`);

  await client.close();
  console.log('\nDemo complete!');
}

main().catch(console.error);
