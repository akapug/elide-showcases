/**
 * Data Models
 * TypeScript interfaces and types for the application
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

// Transform User to UserResponse (remove sensitive fields)
export function userToResponse(user: User): UserResponse {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Simple password hashing (in production, use bcrypt or similar)
export function hashPassword(password: string): string {
  // This is a simple example - in production, use proper crypto
  // For demonstration purposes only
  const hash = Array.from(password)
    .reduce((hash, char) => {
      const chr = char.charCodeAt(0);
      hash = (hash << 5) - hash + chr;
      return hash & hash;
    }, 0)
    .toString(16);

  return `hashed_${hash}_${password.length}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Generate JWT-like token (simplified for demo)
export function generateToken(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${userId}.${timestamp}.${random}`;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate username format
export function isValidUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 50;
}

// Validate password strength
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}
