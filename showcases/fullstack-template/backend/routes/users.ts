/**
 * Users Route Handler
 * Handles CRUD operations for users
 */

import { store } from '../db/store.js';
import {
  userToResponse,
  hashPassword,
  isValidEmail,
  isValidUsername,
  isValidPassword,
  CreateUserDTO,
  UpdateUserDTO,
} from '../db/models.js';

export interface RouteContext {
  params?: Record<string, string>;
  body?: any;
  userId?: string;
}

// GET /api/users - Get all users
export function getAllUsers(context: RouteContext): Response {
  const users = store.getAllUsers();
  const userResponses = users.map(userToResponse);

  return new Response(JSON.stringify(userResponses), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/users/:id - Get user by ID
export function getUserById(context: RouteContext): Response {
  const { id } = context.params || {};

  if (!id) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'User ID is required',
        statusCode: 400,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const user = store.getUserById(id);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: 'User not found',
        statusCode: 404,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify(userToResponse(user)), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/users - Create new user
export function createUser(context: RouteContext): Response {
  const data = context.body as CreateUserDTO;

  // Validation
  const errors: string[] = [];

  if (!data.username || !isValidUsername(data.username)) {
    errors.push('Username must be between 3 and 50 characters');
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password || !isValidPassword(data.password)) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({
        error: 'Validation Error',
        message: errors.join(', '),
        statusCode: 400,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Check if email already exists
  if (store.getUserByEmail(data.email)) {
    return new Response(
      JSON.stringify({
        error: 'Conflict',
        message: 'Email already exists',
        statusCode: 409,
      }),
      {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const user = store.createUser({
    username: data.username,
    email: data.email,
    passwordHash: hashPassword(data.password),
  });

  return new Response(JSON.stringify(userToResponse(user)), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

// PUT /api/users/:id - Update user
export function updateUser(context: RouteContext): Response {
  const { id } = context.params || {};
  const data = context.body as UpdateUserDTO;

  if (!id) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'User ID is required',
        statusCode: 400,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const existingUser = store.getUserById(id);
  if (!existingUser) {
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: 'User not found',
        statusCode: 404,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Validation
  const errors: string[] = [];

  if (data.username !== undefined && !isValidUsername(data.username)) {
    errors.push('Username must be between 3 and 50 characters');
  }

  if (data.email !== undefined && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.password !== undefined && !isValidPassword(data.password)) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({
        error: 'Validation Error',
        message: errors.join(', '),
        statusCode: 400,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Check email uniqueness if being updated
  if (data.email && data.email !== existingUser.email) {
    const emailExists = store.getUserByEmail(data.email);
    if (emailExists) {
      return new Response(
        JSON.stringify({
          error: 'Conflict',
          message: 'Email already exists',
          statusCode: 409,
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  const updates: any = {};
  if (data.username) updates.username = data.username;
  if (data.email) updates.email = data.email;
  if (data.password) updates.passwordHash = hashPassword(data.password);

  const updatedUser = store.updateUser(id, updates);

  if (!updatedUser) {
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to update user',
        statusCode: 500,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(JSON.stringify(userToResponse(updatedUser)), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// DELETE /api/users/:id - Delete user
export function deleteUser(context: RouteContext): Response {
  const { id } = context.params || {};

  if (!id) {
    return new Response(
      JSON.stringify({
        error: 'Bad Request',
        message: 'User ID is required',
        statusCode: 400,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const deleted = store.deleteUser(id);

  if (!deleted) {
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: 'User not found',
        statusCode: 404,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(null, {
    status: 204,
  });
}
