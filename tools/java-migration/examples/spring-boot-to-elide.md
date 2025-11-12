# Spring Boot to Elide Migration Example

This example demonstrates how to migrate a typical Spring Boot REST API to Elide.

## Original Spring Boot Application

### Spring Boot Controller

```java
// UserController.java
package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User created = userService.create(user);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
        @PathVariable Long id,
        @RequestBody User user
    ) {
        return userService.update(id, user)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Spring Boot Service

```java
// UserService.java
package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User create(User user) {
        return userRepository.save(user);
    }

    public Optional<User> update(Long id, User userData) {
        return userRepository.findById(id)
            .map(user -> {
                user.setName(userData.getName());
                user.setEmail(userData.getEmail());
                return userRepository.save(user);
            });
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}
```

### JPA Entity

```java
// User.java
package com.example.demo.model;

import javax.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    // Constructors, getters, setters...
}
```

### Repository

```java
// UserRepository.java
package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
```

## Migrated Elide Application

### Approach 1: Native Elide (Recommended)

```typescript
// api/users.ts
import { Handler, HttpRequest, HttpResponse } from '@elide-dev/elide';
import { Status } from '@elide-dev/elide/http';

// Data model
interface User {
  id: number;
  name: string;
  email: string;
}

// In-memory store (replace with actual database)
const users: Map<number, User> = new Map();
let nextId = 1;

// GET /api/users
export const getAllUsers: Handler = async (req: HttpRequest): Promise<HttpResponse> => {
  const userList = Array.from(users.values());

  return new HttpResponse({
    status: Status.OK,
    body: JSON.stringify(userList),
    headers: { 'Content-Type': 'application/json' },
  });
};

// GET /api/users/:id
export const getUserById: Handler = async (req: HttpRequest): Promise<HttpResponse> => {
  const id = parseInt(req.pathParams.get('id') || '0');
  const user = users.get(id);

  if (!user) {
    return new HttpResponse({
      status: Status.NOT_FOUND,
      body: JSON.stringify({ error: 'User not found' }),
    });
  }

  return new HttpResponse({
    status: Status.OK,
    body: JSON.stringify(user),
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/users
export const createUser: Handler = async (req: HttpRequest): Promise<HttpResponse> => {
  const userData = await req.json();

  const user: User = {
    id: nextId++,
    name: userData.name,
    email: userData.email,
  };

  users.set(user.id, user);

  return new HttpResponse({
    status: Status.CREATED,
    body: JSON.stringify(user),
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT /api/users/:id
export const updateUser: Handler = async (req: HttpRequest): Promise<HttpResponse> => {
  const id = parseInt(req.pathParams.get('id') || '0');
  const user = users.get(id);

  if (!user) {
    return new HttpResponse({
      status: Status.NOT_FOUND,
      body: JSON.stringify({ error: 'User not found' }),
    });
  }

  const userData = await req.json();
  user.name = userData.name || user.name;
  user.email = userData.email || user.email;

  users.set(id, user);

  return new HttpResponse({
    status: Status.OK,
    body: JSON.stringify(user),
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE /api/users/:id
export const deleteUser: Handler = async (req: HttpRequest): Promise<HttpResponse> => {
  const id = parseInt(req.pathParams.get('id') || '0');

  if (!users.has(id)) {
    return new HttpResponse({
      status: Status.NOT_FOUND,
      body: JSON.stringify({ error: 'User not found' }),
    });
  }

  users.delete(id);

  return new HttpResponse({
    status: Status.NO_CONTENT,
  });
};
```

### Approach 2: Using Spring Bridge (Quick Migration)

```typescript
// api/users-bridge.ts
import {
  RestController,
  RequestMapping,
  GetMapping,
  PostMapping,
  PutMapping,
  DeleteMapping,
  PathVariable,
  RequestBody,
  Autowired,
  ResponseEntity,
} from '../spring-bridge';

interface User {
  id: number;
  name: string;
  email: string;
}

// Service class with dependency injection
class UserService {
  private users: Map<number, User> = new Map();
  private nextId = 1;

  findAll(): User[] {
    return Array.from(this.users.values());
  }

  findById(id: number): User | null {
    return this.users.get(id) || null;
  }

  create(user: Omit<User, 'id'>): User {
    const newUser: User = {
      id: this.nextId++,
      name: user.name,
      email: user.email,
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  update(id: number, userData: Partial<User>): User | null {
    const user = this.users.get(id);
    if (!user) return null;

    if (userData.name) user.name = userData.name;
    if (userData.email) user.email = userData.email;

    this.users.set(id, user);
    return user;
  }

  delete(id: number): boolean {
    return this.users.delete(id);
  }
}

// Controller using Spring-like decorators
@RestController('/api/users')
class UserController {
  @Autowired()
  private userService!: UserService;

  @GetMapping()
  async getAllUsers(): Promise<ResponseEntity<User[]>> {
    const users = this.userService.findAll();
    return ResponseEntity.ok(users);
  }

  @GetMapping('/:id')
  async getUserById(@PathVariable('id') id: string): Promise<ResponseEntity<User>> {
    const user = this.userService.findById(parseInt(id));

    if (!user) {
      return ResponseEntity.notFound();
    }

    return ResponseEntity.ok(user);
  }

  @PostMapping()
  async createUser(@RequestBody() user: Omit<User, 'id'>): Promise<ResponseEntity<User>> {
    const created = this.userService.create(user);
    return ResponseEntity.created(created);
  }

  @PutMapping('/:id')
  async updateUser(
    @PathVariable('id') id: string,
    @RequestBody() userData: Partial<User>
  ): Promise<ResponseEntity<User>> {
    const updated = this.userService.update(parseInt(id), userData);

    if (!updated) {
      return ResponseEntity.notFound();
    }

    return ResponseEntity.ok(updated);
  }

  @DeleteMapping('/:id')
  async deleteUser(@PathVariable('id') id: string): Promise<ResponseEntity<void>> {
    this.userService.delete(parseInt(id));
    return ResponseEntity.noContent();
  }
}

export default UserController;
```

## Key Differences

### 1. Handler Functions vs Controllers

**Spring Boot:**
- Controllers are classes with annotated methods
- Framework handles routing automatically
- Dependency injection via @Autowired

**Elide:**
- Handlers are individual async functions
- Explicit routing configuration needed
- Use modules or dependency containers for DI

### 2. Request/Response Handling

**Spring Boot:**
- Automatic JSON serialization
- ResponseEntity wrapper
- Exception handling via @ExceptionHandler

**Elide:**
- Manual JSON.stringify/parse
- Direct HttpResponse construction
- Explicit error handling in handlers

### 3. Data Access

**Spring Boot:**
- JPA/Hibernate for ORM
- Spring Data repositories
- @Transactional for transactions

**Elide:**
- Choice of ORM (TypeORM, Prisma, etc.)
- Manual query building or repository pattern
- Transaction management varies by ORM

## Migration Steps

1. **Analyze**: Run analyzer.ts on Spring Boot project
2. **Choose Approach**: Native Elide vs Spring Bridge
3. **Convert Data Models**: JPA entities → TypeScript interfaces
4. **Migrate Services**: @Service → TypeScript classes
5. **Convert Controllers**: @RestController → Elide handlers
6. **Set Up Database**: Configure database connection
7. **Test**: Comprehensive testing at each layer
8. **Deploy**: Gradual or big-bang deployment

## Testing Both Approaches

```typescript
// test/users.test.ts
import { describe, it, expect } from 'vitest';
import { createTestRequest } from '@elide-dev/elide/testing';
import { getAllUsers, createUser } from '../api/users';

describe('User API', () => {
  it('should get all users', async () => {
    const req = createTestRequest({ method: 'GET', url: '/api/users' });
    const res = await getAllUsers(req);

    expect(res.status).toBe(200);
    const users = JSON.parse(res.body);
    expect(Array.isArray(users)).toBe(true);
  });

  it('should create a user', async () => {
    const req = createTestRequest({
      method: 'POST',
      url: '/api/users',
      body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
    });

    const res = await createUser(req);

    expect(res.status).toBe(201);
    const user = JSON.parse(res.body);
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
  });
});
```

## Recommendations

1. **Use Native Elide** for new features and greenfield parts
2. **Use Spring Bridge** only for quick migrations or proof-of-concepts
3. **Test thoroughly** - behavior may differ subtly
4. **Refactor incrementally** - don't rewrite everything at once
5. **Monitor performance** - profile both old and new code
