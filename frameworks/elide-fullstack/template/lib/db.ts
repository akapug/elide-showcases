/**
 * Database Configuration
 *
 * Define your database schema and create the data layer instance.
 */

import { createDataLayer } from "../../data-layer.ts";

/**
 * Database Schema
 *
 * Define your models here. Each model becomes a table in the database.
 */
export const schema = {
  users: {
    id: { type: "number", primary: true, autoIncrement: true },
    email: { type: "string", unique: true, required: true, index: true },
    password: { type: "string", required: true },
    name: { type: "string", required: true },
    emailVerified: { type: "boolean", default: false },
    roles: { type: "json", default: "[]" },
    createdAt: { type: "date", default: new Date().toISOString() },
    updatedAt: { type: "date", default: new Date().toISOString() },
  },

  sessions: {
    id: { type: "number", primary: true, autoIncrement: true },
    userId: { type: "number", required: true, index: true },
    token: { type: "string", required: true, unique: true, index: true },
    expiresAt: { type: "date", required: true },
    createdAt: { type: "date", default: new Date().toISOString() },
  },

  password_resets: {
    id: { type: "number", primary: true, autoIncrement: true },
    userId: { type: "number", required: true },
    token: { type: "string", required: true, unique: true },
    expiresAt: { type: "date", required: true },
    createdAt: { type: "date", default: new Date().toISOString() },
  },

  posts: {
    id: { type: "number", primary: true, autoIncrement: true },
    title: { type: "string", required: true },
    content: { type: "string", required: true },
    published: { type: "boolean", default: false },
    authorId: {
      type: "number",
      required: true,
      references: { model: "users", field: "id", onDelete: "cascade" },
    },
    createdAt: { type: "date", default: new Date().toISOString() },
    updatedAt: { type: "date", default: new Date().toISOString() },
  },

  jobs: {
    id: { type: "string", primary: true },
    queue: { type: "string", required: true, index: true },
    name: { type: "string", required: true },
    status: { type: "string", required: true, index: true },
    data: { type: "json" },
    result: { type: "json" },
    error: { type: "string" },
    priority: { type: "number", default: 5 },
    attempts: { type: "number", default: 0 },
    maxAttempts: { type: "number", default: 3 },
    progress: { type: "number", default: 0 },
    scheduledFor: { type: "date" },
    completedAt: { type: "date" },
    failedAt: { type: "date" },
    createdAt: { type: "date", default: new Date().toISOString() },
  },

  messages: {
    id: { type: "number", primary: true, autoIncrement: true },
    userId: { type: "number", required: true },
    channelId: { type: "string", required: true, index: true },
    content: { type: "string", required: true },
    createdAt: { type: "date", default: new Date().toISOString() },
  },
};

/**
 * Create and export the database instance
 */
export const db = createDataLayer("./app.db", schema);

/**
 * Initialize database (run migrations)
 *
 * Call this when your application starts to ensure tables exist.
 */
export async function initDatabase() {
  console.log("Running database migrations...");
  await db.migrate();
  console.log("Database ready!");
}

/**
 * Example queries:
 *
 * // Create a user
 * const user = await db.model("users").create({
 *   email: "john@example.com",
 *   name: "John Doe",
 *   password: "hashed_password",
 * });
 *
 * // Find users
 * const users = await db.model("users").findMany({
 *   where: {
 *     emailVerified: true,
 *   },
 *   orderBy: { createdAt: "desc" },
 *   limit: 10,
 * });
 *
 * // Update a user
 * await db.model("users").update(
 *   { id: user.id },
 *   { emailVerified: true }
 * );
 *
 * // Delete a user
 * await db.model("users").delete({ id: user.id });
 *
 * // Complex query
 * const recentPosts = await db.model("posts").findMany({
 *   where: {
 *     published: true,
 *     createdAt: {
 *       gte: new Date("2024-01-01").toISOString(),
 *     },
 *     title: {
 *       contains: "Elide",
 *     },
 *   },
 *   orderBy: { createdAt: "desc" },
 * });
 *
 * // Transaction
 * await db.transaction(async () => {
 *   const user = await db.model("users").create({
 *     email: "jane@example.com",
 *     name: "Jane",
 *   });
 *
 *   await db.model("posts").create({
 *     title: "First Post",
 *     content: "Hello World",
 *     authorId: user.id,
 *   });
 * });
 */
