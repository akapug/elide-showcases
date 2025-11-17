# Complete MongoDB Driver Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Operations](#basic-operations)
3. [Advanced Queries](#advanced-queries)
4. [Aggregation](#aggregation)
5. [Indexes](#indexes)
6. [Transactions](#transactions)
7. [Best Practices](#best-practices)

## Introduction

@elide/mongodb provides a complete MongoDB driver implementation with support for all CRUD operations, aggregation, transactions, change streams, and GridFS.

## Basic Operations

### Insert Operations

```typescript
// Insert one document
const result = await collection.insertOne({
  name: 'Alice',
  email: 'alice@example.com',
  age: 28
});
console.log('Inserted ID:', result.insertedId);

// Insert many documents
await collection.insertMany([
  { name: 'Bob', age: 35 },
  { name: 'Charlie', age: 42 }
]);
```

### Find Operations

```typescript
// Find one document
const user = await collection.findOne({ name: 'Alice' });

// Find many documents
const users = await collection.find({ age: { $gte: 30 } }).toArray();

// Find with options
const results = await collection.find({ status: 'active' })
  .sort({ created: -1 })
  .limit(10)
  .skip(0)
  .toArray();
```

### Update Operations

```typescript
// Update one document
await collection.updateOne(
  { name: 'Alice' },
  { $set: { age: 29 }, $inc: { views: 1 } }
);

// Update many documents
await collection.updateMany(
  { status: 'pending' },
  { $set: { status: 'processed' } }
);

// Replace document
await collection.replaceOne(
  { name: 'Bob' },
  { name: 'Bob', age: 36, status: 'active' }
);
```

### Delete Operations

```typescript
// Delete one document
await collection.deleteOne({ name: 'Charlie' });

// Delete many documents
await collection.deleteMany({ status: 'inactive' });
```

## Advanced Queries

### Query Operators

```typescript
// Comparison
await collection.find({ age: { $gt: 25, $lt: 50 } });
await collection.find({ status: { $in: ['active', 'pending'] } });
await collection.find({ email: { $exists: true } });

// Logical
await collection.find({
  $and: [
    { age: { $gte: 18 } },
    { status: 'active' }
  ]
});

await collection.find({
  $or: [
    { age: { $lt: 18 } },
    { age: { $gt: 65 } }
  ]
});

// Array
await collection.find({ tags: { $all: ['mongodb', 'database'] } });
await collection.find({ scores: { $elemMatch: { $gte: 80, $lt: 90 } } });

// Regex
await collection.find({ email: { $regex: /@example\.com$/ } });
```

### Projection

```typescript
// Include fields
const users = await collection.find({})
  .project({ name: 1, email: 1, _id: 0 })
  .toArray();

// Exclude fields
const users = await collection.find({})
  .project({ password: 0, internal: 0 })
  .toArray();
```

### Sorting

```typescript
// Single field
await collection.find({}).sort({ name: 1 }).toArray();

// Multiple fields
await collection.find({}).sort({ age: -1, name: 1 }).toArray();
```

## Aggregation

### Aggregation Pipeline

```typescript
const results = await collection.aggregate([
  { $match: { status: 'active' } },
  { $group: {
      _id: '$department',
      avgAge: { $avg: '$age' },
      count: { $sum: 1 },
      total: { $sum: '$salary' }
    }
  },
  { $sort: { total: -1 } },
  { $limit: 10 }
]).toArray();
```

### Common Stages

```typescript
// $match - Filter documents
{ $match: { status: 'active' } }

// $group - Group by field
{ $group: { _id: '$category', count: { $sum: 1 } } }

// $project - Shape documents
{ $project: { name: 1, fullName: { $concat: ['$firstName', ' ', '$lastName'] } } }

// $sort - Sort documents
{ $sort: { age: -1, name: 1 } }

// $limit - Limit results
{ $limit: 10 }

// $skip - Skip documents
{ $skip: 20 }

// $lookup - Join collections
{ $lookup: {
    from: 'orders',
    localField: '_id',
    foreignField: 'userId',
    as: 'orders'
  }
}

// $unwind - Deconstruct arrays
{ $unwind: '$tags' }
```

## Indexes

### Creating Indexes

```typescript
// Single field index
await collection.createIndex({ email: 1 });

// Compound index
await collection.createIndex({ lastName: 1, firstName: 1 });

// Unique index
await collection.createIndex({ email: 1 }, { unique: true });

// Text index
await collection.createIndex({ description: 'text' });

// Geospatial index
await collection.createIndex({ location: '2dsphere' });
```

### Managing Indexes

```typescript
// List indexes
const indexes = await collection.listIndexes();

// Drop index
await collection.dropIndex('email_1');

// Drop all indexes
await collection.dropIndexes();
```

## Transactions

### Session Transactions

```typescript
const session = client.startSession();

await session.withTransaction(async () => {
  await collection1.insertOne({ data: 'value1' }, { session });
  await collection2.updateOne({ _id: 1 }, { $set: { updated: true } }, { session });
});

await session.endSession();
```

### Manual Transaction Control

```typescript
const session = client.startSession();

await session.startTransaction();

try {
  await collection.insertOne({ data: 'value' }, { session });
  await collection.updateOne({ _id: 1 }, { $set: { value: 2 } }, { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  await session.endSession();
}
```

## Best Practices

### 1. Use Projection

```typescript
// Bad - fetches all fields
const users = await collection.find({}).toArray();

// Good - fetches only needed fields
const users = await collection.find({})
  .project({ name: 1, email: 1, _id: 0 })
  .toArray();
```

### 2. Create Indexes

```typescript
// Index frequently queried fields
await collection.createIndex({ email: 1 });
await collection.createIndex({ status: 1, created: -1 });
```

### 3. Use Bulk Operations

```typescript
// Bad - multiple operations
for (const doc of documents) {
  await collection.insertOne(doc);
}

// Good - single batch operation
await collection.insertMany(documents);
```

### 4. Handle Errors

```typescript
try {
  await collection.insertOne({ _id: 1, data: 'value' });
} catch (error) {
  if (error.code === 11000) {
    // Duplicate key error
  }
}
```

### 5. Use Aggregation for Complex Queries

```typescript
// Instead of multiple queries
const users = await collection.find({}).toArray();
const stats = users.reduce(...);

// Use aggregation
const stats = await collection.aggregate([
  { $group: { _id: '$category', count: { $sum: 1 } } }
]).toArray();
```
