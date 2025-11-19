/**
 * Elide Full-Stack Framework - Complete Example
 *
 * This example demonstrates a full-featured application using
 * all the framework components together.
 */

import { startApp } from "./index.ts";

// Define database schema
const schema = {
  users: {
    id: { type: "number", primary: true, autoIncrement: true },
    email: { type: "string", unique: true, required: true, index: true },
    password: { type: "string", required: true },
    name: { type: "string", required: true },
    emailVerified: { type: "boolean", default: false },
    roles: { type: "json", default: "[]" },
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

// Create and start the application
const app = await startApp({
  port: 3000,
  hostname: "localhost",
  pagesDir: "./template/pages",
  databasePath: "./example.db",
  databaseSchema: schema,
  auth: {
    jwtSecret: process.env.JWT_SECRET || "dev-secret-key-change-in-production",
    jwtExpiration: 86400, // 1 day
    sessionExpiration: 604800, // 7 days
    passwordMinLength: 8,
  },
  jobs: {
    enabled: true,
  },
  realtime: {
    enabled: true,
  },
});

// Setup email queue
const emailQueue = app.jobs.queue("email", { concurrency: 5 });

emailQueue.handle("welcome-email", async (data, job) => {
  console.log(`📧 Sending welcome email to ${data.email}`);

  // Simulate email sending
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`✅ Welcome email sent to ${data.email}`);

  return { sent: true, timestamp: new Date().toISOString() };
});

emailQueue.handle("digest-email", async (data, job) => {
  console.log(`📧 Sending daily digest email`);

  // Get recent posts
  const posts = await app.db.model("posts").findMany({
    where: {
      published: true,
      createdAt: {
        gte: new Date(Date.now() - 86400000).toISOString(), // Last 24 hours
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`✅ Digest email sent with ${posts.length} posts`);

  return { sent: true, posts: posts.length };
});

// Schedule daily digest
emailQueue.schedule("digest-email", {
  cron: "0 9 * * *", // Every day at 9am
  data: { type: "digest" },
});

// Listen to job events
emailQueue.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.name} (${job.id})`);
});

emailQueue.on("failed", (job) => {
  console.error(`❌ Job failed: ${job.name} (${job.id}) - ${job.error}`);
});

// Setup real-time chat channel
const chatChannel = app.realtime.channel("chat", {
  presence: true,
  historySize: 100,
});

chatChannel.on("message", async (message, connection) => {
  console.log(`💬 New message from ${connection.userId}: ${message.data.content}`);

  // Save message to database
  if (connection.userId) {
    await app.db.model("messages").create({
      userId: connection.userId,
      channelId: "chat",
      content: message.data.content,
    });
  }
});

// Setup notifications channel (private)
const notificationsChannel = app.realtime.channel("notifications", {
  private: true,
  authorize: (connection) => {
    // Only authenticated users can access
    return !!connection.userId;
  },
});

// Listen for new connections
app.realtime.onConnection((connection) => {
  console.log(`🔌 New connection: ${connection.id} (User: ${connection.userId || "anonymous"})`);
});

app.realtime.onDisconnection((connection) => {
  console.log(`🔌 Disconnected: ${connection.id}`);
});

// Create sample data
setTimeout(async () => {
  console.log("\n📦 Creating sample data...\n");

  try {
    // Create a user
    const hashedPassword = await app.auth.constructor.PasswordHasher?.hashPassword("password123") ||
      "hashed_password";

    const user = await app.db.model("users").create({
      email: "demo@example.com",
      name: "Demo User",
      password: hashedPassword,
      emailVerified: true,
      roles: JSON.stringify(["user", "author"]),
    });

    console.log(`✅ Created user: ${user.email}`);

    // Create sample posts
    const posts = [
      {
        title: "Getting Started with Elide Full-Stack Framework",
        content: "Learn how to build modern web applications with Elide...",
        published: true,
        authorId: user.id,
      },
      {
        title: "Building Real-time Applications",
        content: "Discover the power of WebSocket-based real-time features...",
        published: true,
        authorId: user.id,
      },
      {
        title: "Type-Safe Database Access",
        content: "Explore the ORM and how it provides full type safety...",
        published: false,
        authorId: user.id,
      },
    ];

    for (const post of posts) {
      await app.db.model("posts").create(post);
      console.log(`✅ Created post: ${post.title}`);
    }

    // Queue a welcome email
    await emailQueue.add("welcome-email", {
      email: user.email,
      name: user.name,
    });

    console.log(`✅ Queued welcome email for ${user.email}`);

    console.log("\n✨ Sample data created!\n");
    console.log("Try these endpoints:");
    console.log("  - http://localhost:3000/");
    console.log("  - http://localhost:3000/api/hello");
    console.log("\nLogin credentials:");
    console.log("  Email: demo@example.com");
    console.log("  Password: password123\n");
  } catch (error: any) {
    if (error.message.includes("UNIQUE constraint failed")) {
      console.log("✅ Sample data already exists\n");
    } else {
      console.error("❌ Error creating sample data:", error.message);
    }
  }
}, 1000);

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Shutting down...");
  await app.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Display stats every 30 seconds
setInterval(async () => {
  const jobStats = await app.jobs.stats();
  const realtimeStats = app.realtime.stats();

  console.log("\n📊 System Stats:");
  console.log(`   Jobs: ${JSON.stringify(jobStats, null, 2)}`);
  console.log(`   Real-time: ${JSON.stringify(realtimeStats, null, 2)}\n`);
}, 30000);

console.log("\n💡 Tip: Check out the README.md for more examples and documentation!\n");
