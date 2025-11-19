# Database Guide

Complete guide to working with the Elidebase database REST API.

## Table of Contents

- [Introduction](#introduction)
- [REST API](#rest-api)
- [Query Builder](#query-builder)
- [Row Level Security](#row-level-security)
- [Relationships](#relationships)
- [Migrations](#migrations)
- [Advanced Queries](#advanced-queries)
- [Performance Tips](#performance-tips)

## Introduction

Elidebase automatically generates a REST API from your PostgreSQL schema. Every table becomes an API endpoint with full CRUD operations.

## REST API

### Base URL

```
http://localhost:8000/database/rest/{schema}/{table}
```

### Authentication

Include JWT token in Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `select` | Columns to return | `select=id,title,created_at` |
| `{column}.eq` | Equals | `id.eq=123` |
| `{column}.neq` | Not equals | `status.neq=deleted` |
| `{column}.gt` | Greater than | `age.gt=18` |
| `{column}.gte` | Greater than or equal | `price.gte=100` |
| `{column}.lt` | Less than | `stock.lt=10` |
| `{column}.lte` | Less than or equal | `rating.lte=5` |
| `{column}.like` | Pattern match | `name.like=John%` |
| `{column}.ilike` | Case-insensitive match | `email.ilike=%@gmail.com` |
| `{column}.in` | In list | `status.in=active,pending` |
| `{column}.is` | Is null/not null | `deleted_at.is=null` |
| `order` | Sort results | `order=created_at.desc` |
| `limit` | Limit results | `limit=10` |
| `offset` | Skip results | `offset=20` |

### Examples

**Select all todos:**
```bash
GET /database/rest/public/todos
```

**Select specific columns:**
```bash
GET /database/rest/public/todos?select=id,title,completed
```

**Filter by user:**
```bash
GET /database/rest/public/todos?user_id.eq=abc-123
```

**Complex query:**
```bash
GET /database/rest/public/todos?completed.eq=false&priority.gte=3&order=created_at.desc&limit=10
```

**Insert data:**
```bash
POST /database/rest/public/todos
Content-Type: application/json

{
  "title": "Buy groceries",
  "user_id": "abc-123",
  "priority": 5
}
```

**Update data:**
```bash
PATCH /database/rest/public/todos?id.eq=todo-123
Content-Type: application/json

{
  "completed": true
}
```

**Delete data:**
```bash
DELETE /database/rest/public/todos?id.eq=todo-123
```

## Query Builder

The SDK provides a fluent query builder:

```kotlin
val client = ElidebaseClient("http://localhost:8000", apiKey)

// Select query
val todos = client.database
    .from("todos")
    .select("id", "title", "completed", "created_at")
    .eq("user_id", userId)
    .eq("completed", false)
    .order("priority", ascending = false)
    .limit(20)
    .execute()

// Insert
val newTodo = client.database
    .from("todos")
    .insert(JsonObject(mapOf(
        "title" to JsonPrimitive("New task"),
        "user_id" to JsonPrimitive(userId),
        "priority" to JsonPrimitive(5)
    )))

// Update
val updated = client.database
    .from("todos")
    .eq("id", todoId)
    .update(JsonObject(mapOf(
        "completed" to JsonPrimitive(true)
    )))

// Delete
client.database
    .from("todos")
    .eq("id", todoId)
    .delete()

// Complex filtering
val results = client.database
    .from("products")
    .select("*")
    .gte("price", 100)
    .lte("price", 500)
    .like("name", "%laptop%")
    .`in`("category", listOf("electronics", "computers"))
    .order("price", ascending = true)
    .range(0, 49) // First 50 results
    .execute()
```

## Row Level Security

Enable RLS to restrict data access at the database level:

### Basic RLS Setup

```sql
-- Enable RLS on table
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY todos_select_own ON todos
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY todos_insert_own ON todos
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY todos_update_own ON todos
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY todos_delete_own ON todos
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
```

### Advanced RLS Policies

**Public read, authenticated write:**
```sql
CREATE POLICY posts_select_public ON posts
    FOR SELECT
    USING (published = true OR auth.uid() = author_id);

CREATE POLICY posts_insert_auth ON posts
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);
```

**Role-based access:**
```sql
CREATE POLICY admin_all ON todos
    FOR ALL
    TO authenticated
    USING (auth.role() = 'admin');

CREATE POLICY moderator_update ON posts
    FOR UPDATE
    TO authenticated
    USING (auth.role() IN ('admin', 'moderator'));
```

**Team-based access:**
```sql
CREATE POLICY team_access ON documents
    FOR SELECT
    TO authenticated
    USING (
        team_id IN (
            SELECT team_id FROM team_members
            WHERE user_id = auth.uid()
        )
    );
```

## Relationships

### One-to-Many

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE
);
```

Query with relationship:
```kotlin
val posts = client.database
    .from("posts")
    .select("*, users(name)")
    .execute()
```

### Many-to-Many

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL
);

CREATE TABLE enrollments (
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, course_id)
);
```

## Migrations

### Creating Migrations

```bash
elidebase migrate create add_priority_to_todos
```

This creates a migration file:

```sql
-- migrations/1234567890_add_priority_to_todos.sql

-- +migrate Up
ALTER TABLE todos
ADD COLUMN priority INTEGER DEFAULT 0;

CREATE INDEX idx_todos_priority ON todos(priority);

-- +migrate Down
ALTER TABLE todos
DROP COLUMN priority;
```

### Running Migrations

```bash
# Apply all pending migrations
elidebase migrate up

# Rollback last migration
elidebase migrate down

# Apply specific number of migrations
elidebase migrate up --steps 2

# Rollback specific number
elidebase migrate down --steps 1

# Check status
elidebase migrate status
```

### Migration Best Practices

1. **Always provide down migrations** - Enable rollback
2. **Test migrations locally** - Before production
3. **Make migrations reversible** - When possible
4. **Avoid data loss** - Be careful with DROP/DELETE
5. **Use transactions** - For consistency
6. **Version control** - Commit migrations with code

### Example Migrations

**Add column with default:**
```sql
-- +migrate Up
ALTER TABLE users
ADD COLUMN phone VARCHAR(50),
ADD COLUMN phone_confirmed BOOLEAN DEFAULT FALSE;

-- +migrate Down
ALTER TABLE users
DROP COLUMN phone,
DROP COLUMN phone_confirmed;
```

**Create index:**
```sql
-- +migrate Up
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_author ON posts(author_id);

-- +migrate Down
DROP INDEX IF EXISTS idx_posts_created_at;
DROP INDEX IF EXISTS idx_posts_author;
```

**Add foreign key:**
```sql
-- +migrate Up
ALTER TABLE comments
ADD CONSTRAINT fk_comments_post
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- +migrate Down
ALTER TABLE comments
DROP CONSTRAINT IF EXISTS fk_comments_post;
```

## Advanced Queries

### Full-Text Search

```sql
-- Create text search column
ALTER TABLE posts
ADD COLUMN search_vector tsvector;

-- Create index
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- Update search vector on insert/update
CREATE TRIGGER posts_search_update
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);
```

Query:
```kotlin
val results = client.database
    .from("posts")
    .filter("search_vector", "FTS", "kotlin programming")
    .execute()
```

### JSON Queries

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY,
    data JSONB NOT NULL
);
```

```kotlin
// Query JSON field
val events = client.database
    .from("events")
    .filter("data->type", "EQ", "login")
    .execute()

// Query nested JSON
val events = client.database
    .from("events")
    .filter("data->user->age", "GT", "18")
    .execute()
```

### Array Operations

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    tags TEXT[] NOT NULL
);
```

```kotlin
// Contains any
val products = client.database
    .from("products")
    .filter("tags", "CS", "electronics")
    .execute()

// Overlaps
val products = client.database
    .from("products")
    .filter("tags", "OV", listOf("sale", "featured"))
    .execute()
```

### Window Functions

```kotlin
// Get recent posts with row numbers
val posts = client.database.rpc(
    "get_recent_posts",
    mapOf("limit" to 10)
)
```

SQL function:
```sql
CREATE FUNCTION get_recent_posts(limit_count INT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    created_at TIMESTAMP,
    row_num BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.created_at,
        ROW_NUMBER() OVER (ORDER BY p.created_at DESC) as row_num
    FROM posts p
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

## Performance Tips

### 1. Use Indexes

```sql
-- Index frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- Partial index for specific queries
CREATE INDEX idx_active_users ON users(last_login)
WHERE active = true;

-- Multi-column index
CREATE INDEX idx_posts_author_date ON posts(author_id, created_at DESC);
```

### 2. Select Only Needed Columns

```kotlin
// Good - Select specific columns
val todos = client.database
    .from("todos")
    .select("id", "title", "completed")
    .execute()

// Bad - Select all columns
val todos = client.database
    .from("todos")
    .select("*")
    .execute()
```

### 3. Use Pagination

```kotlin
// Offset-based pagination
val page1 = client.database
    .from("posts")
    .order("created_at", ascending = false)
    .range(0, 19) // First 20
    .execute()

val page2 = client.database
    .from("posts")
    .order("created_at", ascending = false)
    .range(20, 39) // Next 20
    .execute()

// Cursor-based pagination (better for large datasets)
val posts = client.database
    .from("posts")
    .order("created_at", ascending = false)
    .lt("created_at", lastSeenTimestamp)
    .limit(20)
    .execute()
```

### 4. Batch Operations

```kotlin
// Batch insert
val todos = listOf(
    mapOf("title" to "Task 1"),
    mapOf("title" to "Task 2"),
    mapOf("title" to "Task 3")
)

// Use transaction for consistency
client.database.transaction {
    todos.forEach { todo ->
        from("todos").insert(JsonObject(todo))
    }
}
```

### 5. Use Connection Pooling

Configure in `elidebase.json`:

```json
{
  "database": {
    "poolSize": 20,
    "maxLifetime": 1800000,
    "connectionTimeout": 30000
  }
}
```

### 6. Analyze Queries

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM posts
WHERE author_id = 'abc-123'
ORDER BY created_at DESC
LIMIT 10;

-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 7. Cache Frequently Accessed Data

Use application-level caching for data that doesn't change often:

```kotlin
val cache = Cache<String, List<JsonObject>>(ttlMillis = 60000) // 1 minute

fun getCachedPosts(category: String): List<JsonObject> {
    return cache.get(category) ?: run {
        val posts = client.database
            .from("posts")
            .eq("category", category)
            .execute()
            .data ?: emptyList()

        cache.put(category, posts)
        posts
    }
}
```

## Troubleshooting

### Common Issues

**RLS prevents access:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'todos';
```

**Slow queries:**
```sql
-- Add missing indexes
CREATE INDEX idx_slow_column ON table_name(slow_column);

-- Update table statistics
ANALYZE table_name;
```

**Connection pool exhausted:**
```json
{
  "database": {
    "poolSize": 50,  // Increase pool size
    "connectionTimeout": 60000  // Increase timeout
  }
}
```

## Next Steps

- [Authentication Guide](AUTH_GUIDE.md)
- [Storage Guide](STORAGE_GUIDE.md)
- [Real-time Guide](REALTIME_GUIDE.md)
- [Functions Guide](FUNCTIONS_GUIDE.md)
