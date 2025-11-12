# Quick Start Guide

Get up and running with Elide Full-Stack Framework in 5 minutes!

## Prerequisites

- Elide runtime (version >= 1.0.0-beta11)
- Basic knowledge of TypeScript and web development

## Installation

### Option 1: Try the Example

Clone the repository and run the example:

```bash
cd frameworks/elide-fullstack
elide run example.ts
```

Visit `http://localhost:3000` to see the framework in action!

### Option 2: Create a New Project

Use the CLI to scaffold a new project:

```bash
# Create new project
elide run cli.ts create my-awesome-app

# Navigate to your project
cd my-awesome-app

# Run migrations
elide run cli.ts db:migrate

# Start development server
elide run cli.ts dev
```

## Your First Route

Create a new file `pages/hello.ts`:

```typescript
import { Request, Response } from "elide:http";
import type { RouteContext } from "../router.ts";

export async function GET(req: Request, ctx: RouteContext) {
  return Response.json({
    message: "Hello, World!",
    timestamp: new Date().toISOString(),
  });
}
```

This automatically creates a route at `/hello`!

## Your First API

Create `pages/api/posts.ts`:

```typescript
import { Request, Response } from "elide:http";
import type { RouteContext } from "../../router.ts";
import { db } from "../../lib/db.ts";

export async function GET(req: Request, ctx: RouteContext) {
  const posts = await db.model("posts").findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(posts);
}

export async function POST(req: Request, ctx: RouteContext) {
  const data = await req.json();

  const post = await db.model("posts").create({
    ...data,
    authorId: ctx.user?.id,
  });

  return Response.json(post, { status: 201 });
}
```

Now you have a RESTful API at `/api/posts`!

## Database Queries

Update `lib/db.ts` to add your schema:

```typescript
export const schema = {
  users: {
    id: { type: "number", primary: true, autoIncrement: true },
    email: { type: "string", unique: true, required: true },
    name: { type: "string", required: true },
    createdAt: { type: "date", default: new Date().toISOString() },
  },

  posts: {
    id: { type: "number", primary: true, autoIncrement: true },
    title: { type: "string", required: true },
    content: { type: "string", required: true },
    published: { type: "boolean", default: false },
    authorId: { type: "number", required: true },
    createdAt: { type: "date", default: new Date().toISOString() },
  },
};
```

Use the ORM in your routes:

```typescript
// Create
const user = await db.model("users").create({
  email: "user@example.com",
  name: "John Doe",
});

// Find
const users = await db.model("users").findMany({
  where: { email: { contains: "@example.com" } },
  limit: 10,
});

// Update
await db.model("users").update(
  { id: 1 },
  { name: "Jane Doe" }
);

// Delete
await db.model("users").delete({ id: 1 });
```

## Authentication

Enable authentication in your app:

```typescript
import { startApp } from "./index.ts";
import { schema } from "./lib/db.ts";

const app = await startApp({
  port: 3000,
  databaseSchema: schema,
  auth: {
    jwtSecret: "your-secret-key",
  },
});
```

Create login/register endpoints:

```typescript
// pages/api/auth/register.ts
import { Request, Response } from "elide:http";
import type { RouteContext } from "../../../router.ts";

export async function POST(req: Request, ctx: RouteContext) {
  const { email, password, name } = await req.json();

  // Get auth from global app instance
  const user = await auth.register(email, password, name);

  return Response.json({ user });
}

// pages/api/auth/login.ts
export async function POST(req: Request, ctx: RouteContext) {
  const { email, password } = await req.json();

  const { user, token } = await auth.login(email, password);

  return Response.json({ user, token });
}
```

Protect routes with middleware:

```typescript
import { requireAuth, requireRoles } from "../auth.ts";

export const middleware = [requireAuth(), requireRoles("admin")];

export async function GET(req: Request, ctx: RouteContext) {
  // ctx.user is available here
  return Response.json({ user: ctx.user });
}
```

## Background Jobs

Setup job queues:

```typescript
const emailQueue = app.jobs.queue("email", { concurrency: 5 });

emailQueue.handle("welcome-email", async (data, job) => {
  console.log(`Sending email to ${data.email}`);
  await sendEmail(data.email, "Welcome!", "Welcome to our app!");
  return { sent: true };
});

// Add a job
await emailQueue.add("welcome-email", {
  email: "user@example.com",
});

// Schedule recurring jobs
emailQueue.schedule("daily-digest", {
  cron: "0 9 * * *", // Every day at 9am
  data: { type: "digest" },
});
```

## Real-time Features

Setup WebSocket channels:

```typescript
const chatChannel = app.realtime.channel("chat", {
  presence: true,
  historySize: 50,
});

chatChannel.on("message", async (message, connection) => {
  console.log(`New message: ${message.data.content}`);

  // Save to database
  await db.model("messages").create({
    userId: connection.userId,
    content: message.data.content,
  });
});

// WebSocket endpoint
// pages/ws.ts
export async function GET(req: Request, ctx: RouteContext) {
  return app.realtime.handleUpgrade(req, ctx);
}
```

## Project Structure

```
my-app/
├── pages/              # Routes (auto-discovered)
│   ├── index.ts        # Home page (/)
│   ├── blog/
│   │   └── [id].ts     # Dynamic route (/blog/:id)
│   └── api/            # API routes
│       └── users.ts    # API endpoint (/api/users)
├── components/         # Reusable components
├── lib/                # Utilities
│   ├── db.ts           # Database config
│   └── auth.ts         # Auth helpers
├── public/             # Static files
├── elide.config.ts     # Framework config
└── package.json
```

## Next Steps

- Read the [full documentation](README.md)
- Explore the [example application](example.ts)
- Check out the [template files](template/)
- Join our [Discord community](https://discord.gg/elide)

## Common Commands

```bash
# Development
elide run cli.ts dev                    # Start dev server
elide run cli.ts dev --port 8080        # Custom port

# Database
elide run cli.ts db:migrate             # Run migrations

# Code Generation
elide run cli.ts generate page about    # Generate page
elide run cli.ts generate api users     # Generate API route
elide run cli.ts generate component Nav # Generate component

# Production
elide run cli.ts build                  # Build for production
```

## Tips

1. **Hot Reload**: Changes to files in `pages/` are automatically picked up (restart the server)
2. **Type Safety**: Use TypeScript for full type checking
3. **Middleware**: Add middleware to routes for authentication, logging, etc.
4. **Caching**: Configure caching per-route for better performance
5. **Error Handling**: Always use try-catch blocks in your handlers

## Example: Complete CRUD API

```typescript
// pages/api/posts/[id].ts
import { Request, Response } from "elide:http";
import type { RouteContext } from "../../../router.ts";
import { db } from "../../../lib/db.ts";
import { requireAuth } from "../../../auth.ts";

export const middleware = [requireAuth()];

// GET /api/posts/:id
export async function GET(req: Request, ctx: RouteContext) {
  const post = await db.model("posts").findUnique({
    id: parseInt(ctx.params.id),
  });

  if (!post) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(post);
}

// PUT /api/posts/:id
export async function PUT(req: Request, ctx: RouteContext) {
  const data = await req.json();

  const post = await db.model("posts").update(
    { id: parseInt(ctx.params.id) },
    data
  );

  return Response.json(post);
}

// DELETE /api/posts/:id
export async function DELETE(req: Request, ctx: RouteContext) {
  await db.model("posts").delete({
    id: parseInt(ctx.params.id),
  });

  return new Response(null, { status: 204 });
}
```

## Need Help?

- Check the [README](README.md) for detailed documentation
- Look at [example.ts](example.ts) for a complete working example
- Ask questions in our [Discord](https://discord.gg/elide)
- Open an issue on [GitHub](https://github.com/elide-dev/elide-showcases)

---

**Happy building! 🚀**
