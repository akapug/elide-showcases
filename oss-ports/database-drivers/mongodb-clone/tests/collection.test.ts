import { MongoClient } from '../src';

describe('MongoDB Collection Tests', () => {
  let client: MongoClient;
  let collection: any;

  beforeAll(async () => {
    client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    collection = client.db('test').collection('test_collection');
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await collection.deleteMany({});
  });

  describe('Insert Operations', () => {
    test('insertOne should insert document', async () => {
      const result = await collection.insertOne({ name: 'Test', value: 123 });
      expect(result.acknowledged).toBe(true);
      expect(result.insertedId).toBeDefined();
    });

    test('insertMany should insert multiple documents', async () => {
      const docs = [
        { name: 'Test1', value: 1 },
        { name: 'Test2', value: 2 },
        { name: 'Test3', value: 3 }
      ];

      const result = await collection.insertMany(docs);
      expect(result.acknowledged).toBe(true);
      expect(result.insertedCount).toBe(3);
    });
  });

  describe('Find Operations', () => {
    beforeEach(async () => {
      await collection.insertMany([
        { name: 'Alice', age: 28 },
        { name: 'Bob', age: 35 },
        { name: 'Charlie', age: 42 }
      ]);
    });

    test('findOne should return single document', async () => {
      const doc = await collection.findOne({ name: 'Alice' });
      expect(doc).toBeDefined();
      expect(doc.name).toBe('Alice');
      expect(doc.age).toBe(28);
    });

    test('find should return multiple documents', async () => {
      const docs = await collection.find({}).toArray();
      expect(docs).toHaveLength(3);
    });

    test('find with filter should return filtered documents', async () => {
      const docs = await collection.find({ age: { $gte: 35 } }).toArray();
      expect(docs).toHaveLength(2);
    });

    test('find with sort should return sorted documents', async () => {
      const docs = await collection.find({}).sort({ age: -1 }).toArray();
      expect(docs[0].name).toBe('Charlie');
      expect(docs[2].name).toBe('Alice');
    });

    test('find with limit should limit results', async () => {
      const docs = await collection.find({}).limit(2).toArray();
      expect(docs).toHaveLength(2);
    });
  });

  describe('Update Operations', () => {
    beforeEach(async () => {
      await collection.insertOne({ name: 'Test', value: 100 });
    });

    test('updateOne should update single document', async () => {
      const result = await collection.updateOne(
        { name: 'Test' },
        { $set: { value: 200 } }
      );

      expect(result.acknowledged).toBe(true);
      expect(result.modifiedCount).toBe(1);

      const doc = await collection.findOne({ name: 'Test' });
      expect(doc.value).toBe(200);
    });

    test('updateMany should update multiple documents', async () => {
      await collection.insertMany([
        { category: 'A', value: 10 },
        { category: 'A', value: 20 }
      ]);

      const result = await collection.updateMany(
        { category: 'A' },
        { $inc: { value: 5 } }
      );

      expect(result.modifiedCount).toBe(2);
    });
  });

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await collection.insertMany([
        { name: 'Test1', value: 1 },
        { name: 'Test2', value: 2 },
        { name: 'Test3', value: 3 }
      ]);
    });

    test('deleteOne should delete single document', async () => {
      const result = await collection.deleteOne({ name: 'Test1' });
      expect(result.deletedCount).toBe(1);

      const count = await collection.countDocuments({});
      expect(count).toBe(2);
    });

    test('deleteMany should delete multiple documents', async () => {
      const result = await collection.deleteMany({ value: { $lte: 2 } });
      expect(result.deletedCount).toBe(2);

      const count = await collection.countDocuments({});
      expect(count).toBe(1);
    });
  });
});
