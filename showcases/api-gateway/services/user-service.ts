/**
 * User Service (TypeScript)
 *
 * Full CRUD service for user management.
 * Demonstrates TypeScript microservice using shared polyglot utilities.
 */

import { v4 as uuidv4, validate as validateUuid } from '../shared/uuid.ts';
import { isEmail, isAlphanumeric, isLength, trim } from '../shared/validator.ts';
import type { RequestContext, Response } from '../gateway/middleware.ts';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

/**
 * In-memory user database (for demo purposes)
 */
const users: Map<string, User> = new Map();

// Initialize with some sample users
function initUsers() {
  const sampleUsers: User[] = [
    {
      id: uuidv4(),
      email: 'alice@example.com',
      name: 'Alice Johnson',
      username: 'alice',
      role: 'admin',
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
      metadata: { department: 'Engineering', location: 'San Francisco' },
    },
    {
      id: uuidv4(),
      email: 'bob@example.com',
      name: 'Bob Smith',
      username: 'bob',
      role: 'user',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
      metadata: { department: 'Marketing', location: 'New York' },
    },
    {
      id: uuidv4(),
      email: 'charlie@example.com',
      name: 'Charlie Brown',
      username: 'charlie',
      role: 'user',
      createdAt: new Date('2024-02-01').toISOString(),
      updatedAt: new Date('2024-02-01').toISOString(),
      metadata: { department: 'Sales', location: 'Boston' },
    },
  ];

  sampleUsers.forEach(user => users.set(user.id, user));
}

// Initialize users
initUsers();

/**
 * List users with pagination
 */
export async function listUsers(
  ctx: RequestContext,
  pagination: { page: number; limit: number }
): Promise<Response> {
  console.log(`[UserService] Listing users: page=${pagination.page}, limit=${pagination.limit}`);

  const allUsers = Array.from(users.values());
  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;
  const paginatedUsers = allUsers.slice(start, end);

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      users: paginatedUsers,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: allUsers.length,
        pages: Math.ceil(allUsers.length / pagination.limit),
      },
    },
  };
}

/**
 * Get user by ID
 */
export async function getUser(ctx: RequestContext, userId: string): Promise<Response> {
  console.log(`[UserService] Getting user: ${userId}`);

  // Validate UUID using shared validator
  if (!validateUuid(userId)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid user ID format',
      },
    };
  }

  const user = users.get(userId);

  if (!user) {
    return {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Not Found',
        message: `User ${userId} not found`,
      },
    };
  }

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { user },
  };
}

/**
 * Create new user
 */
export async function createUser(
  ctx: RequestContext,
  data: { email: string; name: string; username: string; role?: string }
): Promise<Response> {
  console.log(`[UserService] Creating user:`, data);

  // Validate input using shared validators
  if (!data.email || !isEmail(data.email)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid email address',
      },
    };
  }

  if (!data.username || !isAlphanumeric(data.username) || !isLength(data.username, { min: 3, max: 30 })) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Username must be 3-30 alphanumeric characters',
      },
    };
  }

  if (!data.name || !isLength(data.name, { min: 1, max: 100 })) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Name must be 1-100 characters',
      },
    };
  }

  // Check if email already exists
  for (const user of users.values()) {
    if (user.email === data.email) {
      return {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Conflict',
          message: 'Email already exists',
        },
      };
    }
  }

  // Check if username already exists
  for (const user of users.values()) {
    if (user.username === data.username) {
      return {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Conflict',
          message: 'Username already exists',
        },
      };
    }
  }

  // Create user with UUID from shared utility
  const now = new Date().toISOString();
  const newUser: User = {
    id: uuidv4(),
    email: trim(data.email),
    name: trim(data.name),
    username: trim(data.username),
    role: (data.role as any) || 'user',
    createdAt: now,
    updatedAt: now,
  };

  users.set(newUser.id, newUser);

  return {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
    body: { user: newUser },
  };
}

/**
 * Update user
 */
export async function updateUser(
  ctx: RequestContext,
  userId: string,
  data: { email?: string; name?: string; username?: string; metadata?: Record<string, any> }
): Promise<Response> {
  console.log(`[UserService] Updating user: ${userId}`, data);

  // Validate UUID
  if (!validateUuid(userId)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid user ID format',
      },
    };
  }

  const user = users.get(userId);
  if (!user) {
    return {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Not Found',
        message: `User ${userId} not found`,
      },
    };
  }

  // Validate updates
  if (data.email && !isEmail(data.email)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid email address',
      },
    };
  }

  if (data.username && (!isAlphanumeric(data.username) || !isLength(data.username, { min: 3, max: 30 }))) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Username must be 3-30 alphanumeric characters',
      },
    };
  }

  // Update user
  const updatedUser: User = {
    ...user,
    email: data.email ? trim(data.email) : user.email,
    name: data.name ? trim(data.name) : user.name,
    username: data.username ? trim(data.username) : user.username,
    metadata: data.metadata || user.metadata,
    updatedAt: new Date().toISOString(),
  };

  users.set(userId, updatedUser);

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { user: updatedUser },
  };
}

/**
 * Delete user
 */
export async function deleteUser(ctx: RequestContext, userId: string): Promise<Response> {
  console.log(`[UserService] Deleting user: ${userId}`);

  // Validate UUID
  if (!validateUuid(userId)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid user ID format',
      },
    };
  }

  const user = users.get(userId);
  if (!user) {
    return {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Not Found',
        message: `User ${userId} not found`,
      },
    };
  }

  users.delete(userId);

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      message: 'User deleted successfully',
      userId,
    },
  };
}
