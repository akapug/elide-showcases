/**
 * Authentication Route Handler
 * Handles user authentication and authorization
 */

import { store } from '../db/store.js';
import {
  userToResponse,
  verifyPassword,
  generateToken,
  isValidEmail,
  LoginDTO,
  AuthResponse,
} from '../db/models.js';

export interface RouteContext {
  body?: any;
  headers?: Headers;
}

// POST /api/auth/login - User login
export function login(context: RouteContext): Response {
  const data = context.body as LoginDTO;

  // Validation
  if (!data.email || !isValidEmail(data.email)) {
    return new Response(
      JSON.stringify({
        error: 'Validation Error',
        message: 'Invalid email format',
        statusCode: 400,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!data.password) {
    return new Response(
      JSON.stringify({
        error: 'Validation Error',
        message: 'Password is required',
        statusCode: 400,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Find user by email
  const user = store.getUserByEmail(data.email);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Verify password
  if (!verifyPassword(data.password, user.passwordHash)) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Generate token
  const token = generateToken(user.id);
  store.createToken(user.id, token);

  const authResponse: AuthResponse = {
    token,
    user: userToResponse(user),
  };

  return new Response(JSON.stringify(authResponse), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/auth/logout - User logout
export function logout(context: RouteContext): Response {
  const authHeader = context.headers?.get('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    store.deleteToken(token);
  }

  return new Response(
    JSON.stringify({
      message: 'Logged out successfully',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// GET /api/auth/me - Get current user
export function getCurrentUser(context: RouteContext): Response {
  const authHeader = context.headers?.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authorization token required',
        statusCode: 401,
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const token = authHeader.substring(7);
  const userId = store.validateToken(token);

  if (!userId) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        statusCode: 401,
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const user = store.getUserById(userId);

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

// Middleware to validate JWT token
export function validateAuthToken(headers: Headers): string | null {
  const authHeader = headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return store.validateToken(token);
}
