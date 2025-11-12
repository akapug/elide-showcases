# Database Access with Elide

**Comprehensive guide to working with databases in Elide applications**

Learn how to connect to databases, execute queries, and implement data persistence patterns across all supported languages.

---

## Table of Contents

- [Database Options](#database-options)
- [HTTP-based Databases](#http-based-databases)
- [In-Memory Storage](#in-memory-storage)
- [TypeScript Patterns](#typescript-patterns)
- [Python Patterns](#python-patterns)
- [Java/JDBC Patterns](#javajdbc-patterns)
- [Caching Strategies](#caching-strategies)
- [Best Practices](#best-practices)

---

## Database Options

### Recommended Approaches

| Database Type | Access Method | Languages | Best For |
|---------------|---------------|-----------|----------|
| **PostgreSQL** | HTTP API (PostgREST) | All | REST API apps |
| **SQLite** | Java JDBC | TypeScript/Java | Embedded apps |
| **MongoDB** | HTTP API | All | Document storage |
| **Redis** | HTTP API | All | Caching, sessions |
| **In-Memory** | Native structures | All | Development, testing |
| **Supabase** | HTTP API | All | Modern apps |
| **Firebase** | HTTP API | All | Real-time apps |

---

## HTTP-based Databases

### Pattern: PostgreSQL via PostgREST

**Setup PostgREST** (external service):
```bash
# Run PostgREST container
docker run -d \
  -e PGRST_DB_URI="postgres://user:pass@localhost/db" \
  -e PGRST_DB_SCHEMA="public" \
  -e PGRST_DB_ANON_ROLE="anon" \
  -p 3000:3000 \
  postgrest/postgrest
```

**TypeScript client**:
```typescript
// database.ts
const DB_URL = "http://localhost:3000";

export class Database {
  async query(table: string, filter?: Record<string, any>): Promise<any[]> {
    let url = `${DB_URL}/${table}`;

    if (filter) {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        params.append(key, `eq.${value}`);
      });
      url += `?${params}`;
    }

    const response = await fetch(url);
    return response.json();
  }

  async insert(table: string, data: any): Promise<any> {
    const response = await fetch(`${DB_URL}/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(data)
    });

    return response.json();
  }

  async update(table: string, id: any, data: any): Promise<any> {
    const response = await fetch(`${DB_URL}/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(data)
    });

    return response.json();
  }

  async delete(table: string, id: any): Promise<void> {
    await fetch(`${DB_URL}/${table}?id=eq.${id}`, {
      method: "DELETE"
    });
  }
}
```

**Usage in server**:
```typescript
// server.ts
import { Database } from "./database.ts";

const db = new Database();

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Get all users
  if (url.pathname === "/api/users" && req.method === "GET") {
    const users = await db.query("users");
    return new Response(JSON.stringify(users), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Get user by ID
  if (url.pathname.startsWith("/api/users/") && req.method === "GET") {
    const id = url.pathname.split("/")[3];
    const users = await db.query("users", { id });
    const user = users[0];

    if (!user) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Create user
  if (url.pathname === "/api/users" && req.method === "POST") {
    const data = await req.json();
    const user = await db.insert("users", data);

    return new Response(JSON.stringify(user), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Update user
  if (url.pathname.startsWith("/api/users/") && req.method === "PUT") {
    const id = url.pathname.split("/")[3];
    const data = await req.json();
    const user = await db.update("users", id, data);

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Delete user
  if (url.pathname.startsWith("/api/users/") && req.method === "DELETE") {
    const id = url.pathname.split("/")[3];
    await db.delete("users", id);

    return new Response(null, { status: 204 });
  }

  return new Response("Not Found", { status: 404 });
}
```

### Pattern: Supabase

```typescript
// supabase.ts
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_KEY = "your-anon-key";

export class SupabaseClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = `${SUPABASE_URL}/rest/v1`;
    this.headers = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json"
    };
  }

  async select(table: string, options?: { filter?: any; order?: string }): Promise<any[]> {
    let url = `${this.baseUrl}/${table}`;
    const params = new URLSearchParams();

    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        params.append(key, `eq.${value}`);
      });
    }

    if (options?.order) {
      params.append("order", options.order);
    }

    if (params.toString()) {
      url += `?${params}`;
    }

    const response = await fetch(url, {
      headers: this.headers
    });

    return response.json();
  }

  async insert(table: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${table}`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  }

  async update(table: string, filter: any, data: any): Promise<any> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      params.append(key, `eq.${value}`);
    });

    const response = await fetch(`${this.baseUrl}/${table}?${params}`, {
      method: "PATCH",
      headers: {
        ...this.headers,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(data)
    });

    return response.json();
  }

  async delete(table: string, filter: any): Promise<void> {
    const params = new URLSearchParams();
    Object.entries(filter).forEach(([key, value]) => {
      params.append(key, `eq.${value}`);
    });

    await fetch(`${this.baseUrl}/${table}?${params}`, {
      method: "DELETE",
      headers: this.headers
    });
  }
}

// Usage
const db = new SupabaseClient();

// Select
const users = await db.select("users", {
  filter: { active: true },
  order: "created_at.desc"
});

// Insert
const newUser = await db.insert("users", {
  name: "Alice",
  email: "alice@example.com"
});

// Update
await db.update("users", { id: 1 }, {
  name: "Alice Updated"
});

// Delete
await db.delete("users", { id: 1 });
```

---

## In-Memory Storage

### Simple Key-Value Store

```typescript
// storage.ts
export class MemoryStore<T> {
  private data: Map<string, T> = new Map();

  set(key: string, value: T): void {
    this.data.set(key, value);
  }

  get(key: string): T | undefined {
    return this.data.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  delete(key: string): boolean {
    return this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  keys(): string[] {
    return Array.from(this.data.keys());
  }

  values(): T[] {
    return Array.from(this.data.values());
  }

  entries(): [string, T][] {
    return Array.from(this.data.entries());
  }

  size(): number {
    return this.data.size;
  }
}

// Usage
const users = new MemoryStore<{ id: string; name: string; email: string }>();

users.set("1", { id: "1", name: "Alice", email: "alice@example.com" });
users.set("2", { id: "2", name: "Bob", email: "bob@example.com" });

const user = users.get("1");
console.log(user);  // { id: "1", name: "Alice", ... }
```

### Document Store

```typescript
// document-store.ts
export class DocumentStore<T extends { id: string }> {
  private data: Map<string, T> = new Map();
  private indexes: Map<string, Map<any, Set<string>>> = new Map();

  insert(doc: T): T {
    this.data.set(doc.id, doc);
    this.updateIndexes(doc);
    return doc;
  }

  find(query: Partial<T>): T[] {
    const results: T[] = [];

    for (const doc of this.data.values()) {
      let matches = true;

      for (const [key, value] of Object.entries(query)) {
        if (doc[key as keyof T] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        results.push(doc);
      }
    }

    return results;
  }

  findOne(query: Partial<T>): T | undefined {
    return this.find(query)[0];
  }

  findById(id: string): T | undefined {
    return this.data.get(id);
  }

  update(id: string, updates: Partial<T>): T | undefined {
    const doc = this.data.get(id);
    if (!doc) return undefined;

    const updated = { ...doc, ...updates };
    this.data.set(id, updated);
    this.updateIndexes(updated);

    return updated;
  }

  delete(id: string): boolean {
    return this.data.delete(id);
  }

  count(query?: Partial<T>): number {
    if (!query) return this.data.size;
    return this.find(query).length;
  }

  private updateIndexes(doc: T): void {
    // Simple indexing implementation
    for (const [key, value] of Object.entries(doc)) {
      if (!this.indexes.has(key)) {
        this.indexes.set(key, new Map());
      }

      const index = this.indexes.get(key)!;
      if (!index.has(value)) {
        index.set(value, new Set());
      }

      index.get(value)!.add(doc.id);
    }
  }
}

// Usage
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const users = new DocumentStore<User>();

users.insert({
  id: "1",
  name: "Alice",
  email: "alice@example.com",
  role: "admin"
});

users.insert({
  id: "2",
  name: "Bob",
  email: "bob@example.com",
  role: "user"
});

// Query
const admins = users.find({ role: "admin" });
const alice = users.findOne({ email: "alice@example.com" });

// Update
users.update("1", { name: "Alice Updated" });

// Delete
users.delete("2");
```

---

## TypeScript Patterns

### Repository Pattern

```typescript
// repository.ts
export interface Repository<T> {
  find(query?: any): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: T): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export class HttpRepository<T extends { id: string }> implements Repository<T> {
  constructor(
    private baseUrl: string,
    private resource: string
  ) {}

  async find(query?: any): Promise<T[]> {
    const params = new URLSearchParams(query);
    const url = `${this.baseUrl}/${this.resource}?${params}`;
    const response = await fetch(url);
    return response.json();
  }

  async findById(id: string): Promise<T | null> {
    const response = await fetch(`${this.baseUrl}/${this.resource}/${id}`);
    if (response.status === 404) return null;
    return response.json();
  }

  async create(data: T): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${this.resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const response = await fetch(`${this.baseUrl}/${this.resource}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (response.status === 404) return null;
    return response.json();
  }

  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${this.resource}/${id}`, {
      method: "DELETE"
    });
    return response.ok;
  }
}

// Usage
interface User {
  id: string;
  name: string;
  email: string;
}

const userRepo = new HttpRepository<User>("https://api.example.com", "users");

// CRUD operations
const users = await userRepo.find({ active: "true" });
const user = await userRepo.findById("1");
const newUser = await userRepo.create({ id: "3", name: "Charlie", email: "charlie@example.com" });
await userRepo.update("3", { name: "Charlie Updated" });
await userRepo.delete("3");
```

---

## Python Patterns

### Python Database Access

```python
# database.py
import json
from urllib.request import urlopen, Request
from urllib.parse import urlencode

class Database:
    def __init__(self, base_url):
        self.base_url = base_url

    def query(self, table, filter=None):
        url = f"{self.base_url}/{table}"

        if filter:
            params = {key: f"eq.{value}" for key, value in filter.items()}
            url += f"?{urlencode(params)}"

        response = urlopen(url)
        return json.loads(response.read())

    def insert(self, table, data):
        url = f"{self.base_url}/{table}"
        request = Request(
            url,
            data=json.dumps(data).encode(),
            headers={
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            method="POST"
        )

        response = urlopen(request)
        return json.loads(response.read())

    def update(self, table, id, data):
        url = f"{self.base_url}/{table}?id=eq.{id}"
        request = Request(
            url,
            data=json.dumps(data).encode(),
            headers={
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            method="PATCH"
        )

        response = urlopen(request)
        return json.loads(response.read())

    def delete(self, table, id):
        url = f"{self.base_url}/{table}?id=eq.{id}"
        request = Request(url, method="DELETE")
        urlopen(request)

# Export for TypeScript import
db = Database("http://localhost:3000")
```

**TypeScript usage**:
```typescript
// Import Python database client
import { db } from "./database.py";

export default async function fetch(req: Request): Promise<Response> {
  if (req.url.includes("/api/users")) {
    // Use Python database access
    const users = db.query("users");

    return new Response(JSON.stringify(users), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## Java/JDBC Patterns

### JDBC Connection (Conceptual)

```java
// Database.java
import java.sql.*;
import java.util.*;

public class Database {
    private String connectionString;

    public Database(String connectionString) {
        this.connectionString = connectionString;
    }

    public List<Map<String, Object>> query(String sql, Object... params) throws SQLException {
        List<Map<String, Object>> results = new ArrayList<>();

        try (Connection conn = DriverManager.getConnection(connectionString);
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            for (int i = 0; i < params.length; i++) {
                stmt.setObject(i + 1, params[i]);
            }

            try (ResultSet rs = stmt.executeQuery()) {
                ResultSetMetaData meta = rs.getMetaData();
                int columnCount = meta.getColumnCount();

                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();
                    for (int i = 1; i <= columnCount; i++) {
                        row.put(meta.getColumnName(i), rs.getObject(i));
                    }
                    results.add(row);
                }
            }
        }

        return results;
    }

    public int execute(String sql, Object... params) throws SQLException {
        try (Connection conn = DriverManager.getConnection(connectionString);
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            for (int i = 0; i < params.length; i++) {
                stmt.setObject(i + 1, params[i]);
            }

            return stmt.executeUpdate();
        }
    }
}
```

---

## Caching Strategies

### LRU Cache

```typescript
// lru-cache.ts
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recent)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over limit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Usage with database
const cache = new LRUCache<string, any>(1000);

async function getUser(id: string) {
  // Check cache first
  if (cache.has(id)) {
    return cache.get(id);
  }

  // Query database
  const user = await db.findById(id);

  // Cache result
  if (user) {
    cache.set(id, user);
  }

  return user;
}
```

---

## Best Practices

### 1. Connection Pooling

```typescript
// Use HTTP-based access for automatic connection management
const db = new SupabaseClient();  // Handles connections internally
```

### 2. Error Handling

```typescript
async function safeQuery<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error("Database error:", error);
    return null;
  }
}

// Usage
const users = await safeQuery(() => db.select("users"));
if (!users) {
  return new Response("Database error", { status: 500 });
}
```

### 3. Data Validation

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function validateUser(data: any): User | null {
  if (!data.id || !data.name || !data.email) {
    return null;
  }

  if (typeof data.name !== "string" || data.name.length < 2) {
    return null;
  }

  if (!data.email.includes("@")) {
    return null;
  }

  return data as User;
}
```

### 4. Transactions (HTTP API Pattern)

```typescript
async function transferFunds(fromId: string, toId: string, amount: number) {
  try {
    // Start transaction (application-level)
    const from = await db.findById(fromId);
    const to = await db.findById(toId);

    if (from.balance < amount) {
      throw new Error("Insufficient funds");
    }

    // Update both accounts
    await db.update(fromId, { balance: from.balance - amount });
    await db.update(toId, { balance: to.balance + amount });

    return { success: true };
  } catch (error) {
    // Rollback would need to be implemented at application level
    console.error("Transaction failed:", error);
    return { success: false, error: String(error) };
  }
}
```

---

## Next Steps

- **[Authentication](./authentication.md)** - Secure database access
- **[Testing](./testing.md)** - Test database operations
- **[Performance Optimization](./performance-optimization.md)** - Optimize queries
- **[Deployment](./deployment.md)** - Deploy with databases

---

## Summary

**Database Access in Elide:**

- ✅ **HTTP APIs**: PostgREST, Supabase, Firebase (all languages)
- ✅ **In-Memory**: Fast development and testing
- ✅ **JDBC**: Java database drivers (limited)
- ✅ **Caching**: LRU and custom strategies
- ✅ **Polyglot**: Python/TypeScript/Java access same data

**Recommended Approach:**
1. Development: In-memory stores
2. Production: HTTP-based APIs (Supabase, PostgREST)
3. Caching: LRU cache for performance
4. Enterprise: Java JDBC for complex systems

🚀 **Build data-driven applications with Elide!**
