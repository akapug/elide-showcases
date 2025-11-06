/**
 * In-Memory Data Store
 * Simple in-memory database for demonstration
 * In production, replace with PostgreSQL, MongoDB, etc.
 */

import { v4 as uuidv4 } from 'uuid';
import { User, AuthToken } from './models.js';

export class DataStore {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, User> = new Map();
  private tokens: Map<string, AuthToken> = new Map();

  constructor() {
    this.seedData();
  }

  // Seed with initial data
  private seedData(): void {
    const demoUsers: Omit<User, 'id'>[] = [
      {
        username: 'alice',
        email: 'alice@example.com',
        passwordHash: 'hashed_demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        username: 'bob',
        email: 'bob@example.com',
        passwordHash: 'hashed_demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    demoUsers.forEach((userData) => {
      const user: User = {
        id: uuidv4(),
        ...userData,
      };
      this.users.set(user.id, user);
      this.usersByEmail.set(user.email.toLowerCase(), user);
    });
  }

  // User CRUD operations
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.usersByEmail.get(email.toLowerCase());
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const now = new Date().toISOString();
    const user: User = {
      id: uuidv4(),
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);
    this.usersByEmail.set(user.email.toLowerCase(), user);
    return user;
  }

  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    // Remove old email mapping if email is being updated
    if (updates.email && updates.email !== user.email) {
      this.usersByEmail.delete(user.email.toLowerCase());
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      id: user.id, // Ensure ID doesn't change
      createdAt: user.createdAt, // Ensure createdAt doesn't change
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updatedUser);
    if (updatedUser.email) {
      this.usersByEmail.set(updatedUser.email.toLowerCase(), updatedUser);
    }

    return updatedUser;
  }

  deleteUser(id: string): boolean {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }

    this.usersByEmail.delete(user.email.toLowerCase());
    this.users.delete(id);
    return true;
  }

  // Token operations
  createToken(userId: string, token: string, expiresInHours: number = 24): AuthToken {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

    const authToken: AuthToken = {
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };

    this.tokens.set(token, authToken);
    return authToken;
  }

  getToken(token: string): AuthToken | undefined {
    return this.tokens.get(token);
  }

  validateToken(token: string): string | null {
    const authToken = this.tokens.get(token);
    if (!authToken) {
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(authToken.expiresAt);

    if (now > expiresAt) {
      this.tokens.delete(token);
      return null;
    }

    return authToken.userId;
  }

  deleteToken(token: string): boolean {
    return this.tokens.delete(token);
  }

  // Statistics
  getUserCount(): number {
    return this.users.size;
  }

  getActiveTokenCount(): number {
    const now = new Date();
    let count = 0;

    for (const [token, authToken] of this.tokens.entries()) {
      const expiresAt = new Date(authToken.expiresAt);
      if (now <= expiresAt) {
        count++;
      } else {
        this.tokens.delete(token);
      }
    }

    return count;
  }
}

// Singleton instance
export const store = new DataStore();
