# @elide/drizzle-clone

TypeScript ORM with SQL-like syntax, full type inference, and zero runtime dependencies.

## Features

- **SQL-Like Syntax** - Write queries that look like SQL
- **Full Type Inference** - Infer types from schema automatically
- **Zero Dependencies** - No runtime dependencies
- **Type-Safe** - Catch errors at compile time
- **Performan Focus** - Minimal overhead, maximum speed
- **Migrations** - Schema migrations with full TypeScript support
- **Multiple Databases** - PostgreSQL, MySQL, SQLite
- **Relational Queries** - Intuitive API for joins and relations
- **Prepared Statements** - Automatic query preparation
- **Schema Introspection** - Generate schema from existing database

## Installation

```bash
elide install @elide/drizzle-clone
```

## Quick Start

### 1. Define Schema

```typescript
import { pgTable, serial, text, integer, timestamp, boolean } from '@elide/drizzle-clone/pg-core';
import { relations } from '@elide/drizzle-clone';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  age: integer('age'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  published: boolean('published').default(false),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts)
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id]
  })
}));
```

### 2. Create Database Instance

```typescript
import { drizzle } from '@elide/drizzle-clone/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'mydb'
});

const db = drizzle(pool, { schema: { users, posts } });
```

### 3. Query Data

```typescript
// Select all
const allUsers = await db.select().from(users);

// Select with where
const activeUsers = await db
  .select()
  .from(users)
  .where(eq(users.active, true));

// Select specific columns
const userEmails = await db
  .select({ email: users.email, name: users.name })
  .from(users);

// Select with join
const usersWithPosts = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId));

// Insert
const newUser = await db
  .insert(users)
  .values({
    email: 'alice@example.com',
    name: 'Alice',
    age: 25
  })
  .returning();

// Update
await db
  .update(users)
  .set({ name: 'Alice Smith' })
  .where(eq(users.id, 1));

// Delete
await db
  .delete(users)
  .where(eq(users.id, 1));
```

## Queries

### Select

```typescript
// Simple select
const users = await db.select().from(users);

// Select specific fields
const result = await db
  .select({
    id: users.id,
    email: users.email
  })
  .from(users);

// With where conditions
const filtered = await db
  .select()
  .from(users)
  .where(and(
    eq(users.active, true),
    gte(users.age, 18)
  ));

// With ordering
const sorted = await db
  .select()
  .from(users)
  .orderBy(desc(users.createdAt));

// With limit and offset
const paginated = await db
  .select()
  .from(users)
  .limit(10)
  .offset(20);

// With aggregation
const stats = await db
  .select({
    count: count(),
    avgAge: avg(users.age),
    maxAge: max(users.age)
  })
  .from(users);

// Group by
const grouped = await db
  .select({
    active: users.active,
    count: count()
  })
  .from(users)
  .groupBy(users.active);
```

### Insert

```typescript
// Insert one
await db.insert(users).values({
  email: 'bob@example.com',
  name: 'Bob'
});

// Insert multiple
await db.insert(users).values([
  { email: 'alice@example.com', name: 'Alice' },
  { email: 'bob@example.com', name: 'Bob' },
  { email: 'charlie@example.com', name: 'Charlie' }
]);

// Insert with returning
const [user] = await db
  .insert(users)
  .values({ email: 'dave@example.com', name: 'Dave' })
  .returning();

// Insert with on conflict
await db
  .insert(users)
  .values({ email: 'alice@example.com', name: 'Alice Updated' })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: 'Alice Updated' }
  });
```

### Update

```typescript
// Update all
await db
  .update(users)
  .set({ active: false });

// Update with where
await db
  .update(users)
  .set({ name: 'Updated Name' })
  .where(eq(users.id, 1));

// Update with returning
const [updated] = await db
  .update(users)
  .set({ age: 26 })
  .where(eq(users.id, 1))
  .returning();

// Conditional update
await db
  .update(users)
  .set({ active: sql`CASE WHEN age >= 18 THEN true ELSE false END` })
  .where(isNotNull(users.age));
```

### Delete

```typescript
// Delete all
await db.delete(users);

// Delete with where
await db
  .delete(users)
  .where(eq(users.id, 1));

// Delete with returning
const deleted = await db
  .delete(users)
  .where(eq(users.active, false))
  .returning();
```

## Joins

```typescript
// Inner join
const result = await db
  .select()
  .from(users)
  .innerJoin(posts, eq(users.id, posts.userId));

// Left join
const result = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId));

// Right join
const result = await db
  .select()
  .from(users)
  .rightJoin(posts, eq(users.id, posts.userId));

// Multiple joins
const result = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId))
  .leftJoin(comments, eq(posts.id, comments.postId));

// Select specific fields from joins
const result = await db
  .select({
    userId: users.id,
    userName: users.name,
    postTitle: posts.title,
    postContent: posts.content
  })
  .from(users)
  .leftJoin(posts, eq(users.id, posts.userId));
```

## Relational Queries

```typescript
// Query with relations
const usersWithPosts = await db.query.users.findMany({
  with: {
    posts: true
  }
});

// Nested relations
const usersWithPostsAndComments = await db.query.users.findMany({
  with: {
    posts: {
      with: {
        comments: true
      }
    }
  }
});

// Filtered relations
const users = await db.query.users.findMany({
  with: {
    posts: {
      where: eq(posts.published, true),
      limit: 5
    }
  }
});

// Find one
const user = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {
    posts: true
  }
});
```

## Transactions

```typescript
// Simple transaction
await db.transaction(async (tx) => {
  await tx.insert(users).values({ email: 'test@example.com', name: 'Test' });
  await tx.insert(posts).values({ title: 'Test Post', userId: 1 });
});

// Transaction with error handling
try {
  await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email: 'test@example.com', name: 'Test' })
      .returning();

    await tx
      .insert(posts)
      .values({ title: 'Test Post', userId: user.id });

    // If error thrown, transaction rolls back
    if (someCondition) {
      throw new Error('Rollback');
    }
  });
} catch (error) {
  console.error('Transaction failed:', error);
}
```

## Operators

```typescript
import { eq, ne, gt, gte, lt, lte, isNull, isNotNull, inArray, notInArray, exists, notExists, between, notBetween, like, ilike, and, or, not } from '@elide/drizzle-clone';

// Comparison operators
eq(users.id, 1)
ne(users.id, 1)
gt(users.age, 18)
gte(users.age, 18)
lt(users.age, 65)
lte(users.age, 65)

// Null checks
isNull(users.deletedAt)
isNotNull(users.deletedAt)

// Array operators
inArray(users.id, [1, 2, 3])
notInArray(users.id, [1, 2, 3])

// Range
between(users.age, 18, 65)
notBetween(users.age, 18, 65)

// Pattern matching
like(users.email, '%@gmail.com')
ilike(users.email, '%@GMAIL.COM')

// Logical operators
and(eq(users.active, true), gt(users.age, 18))
or(eq(users.role, 'admin'), eq(users.role, 'moderator'))
not(eq(users.active, false))
```

## Migrations

```typescript
// drizzle.config.ts
import type { Config } from '@elide/drizzle-clone';

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  }
} satisfies Config;

// Generate migrations
// elide run drizzle-kit generate:pg

// Run migrations
import { migrate } from '@elide/drizzle-clone/node-postgres/migrator';

await migrate(db, { migrationsFolder: './drizzle' });
```

## Multiple Databases

```typescript
// PostgreSQL
import { drizzle } from '@elide/drizzle-clone/node-postgres';
import { pgTable, serial, text } from '@elide/drizzle-clone/pg-core';

// MySQL
import { drizzle } from '@elide/drizzle-clone/mysql2';
import { mysqlTable, int, varchar } from '@elide/drizzle-clone/mysql-core';

// SQLite
import { drizzle } from '@elide/drizzle-clone/better-sqlite3';
import { sqliteTable, integer, text } from '@elide/drizzle-clone/sqlite-core';
```

## Performance

Benchmarks (operations/second):

| Operation | PostgreSQL | MySQL | SQLite |
|-----------|-----------|-------|--------|
| Insert    | 16,200/s  | 14,800/s | 19,500/s |
| Select    | 44,500/s  | 40,200/s | 53,800/s |
| Update    | 13,900/s  | 12,400/s | 16,300/s |
| Delete    | 14,800/s  | 13,600/s | 17,400/s |

## Type Safety

```typescript
// Full type inference
const users = await db.select().from(users);
// Type: { id: number; email: string; name: string; ... }[]

// Partial selection
const partial = await db
  .select({ id: users.id, email: users.email })
  .from(users);
// Type: { id: number; email: string }[]

// Type-safe where conditions
await db
  .select()
  .from(users)
  .where(eq(users.age, '18')); // ❌ Type error: expected number, got string
```

## License

MIT © Elide Team
