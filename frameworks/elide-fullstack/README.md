# Elide Full-Stack Framework

> The Rails/Next.js killer built with Elide

A comprehensive, batteries-included full-stack framework for building modern web applications with Elide. Combines the best ideas from Rails, Next.js, Laravel, and Phoenix into a single, cohesive framework powered by Elide's high-performance runtime.

## Features

### 🚀 File-Based Routing
Convention over configuration with automatic route discovery:
- `pages/index.ts` → `/`
- `pages/blog/[id].ts` → `/blog/:id`
- `pages/api/users.ts` → `/api/users`
- `pages/docs/[...slug].ts` → `/docs/*`

### ⚛️ React Server Components
Zero client-side JavaScript by default with streaming support:
- Server Components for data fetching
- Client Components for interactivity
- Streaming SSR with Suspense
- Progressive enhancement

### 🗄️ Type-Safe ORM
Prisma-inspired database layer with full TypeScript support:
- Schema-first design
- Type-safe queries
- Automatic migrations
- Relations (one-to-one, one-to-many, many-to-many)
- Transaction support

### 🔐 Built-in Authentication
Complete auth solution out of the box:
- JWT token-based auth
- Session management
- OAuth providers (Google, GitHub, etc.)
- Role-based permissions
- Password reset flows
- Email verification

### 🔄 Background Jobs
Sidekiq-inspired job queue system:
- Async job processing
- Job scheduling (cron-like)
- Retries with exponential backoff
- Job priorities
- Concurrency control
- Dead letter queue

### 📡 Real-time Features
WebSocket-based real-time communication:
- Pub/sub messaging
- Room/channel system
- Presence tracking
- Broadcasting
- Auto-reconnection

### 🛠️ Framework CLI
Powerful command-line tools:
- Project scaffolding
- Code generators
- Database migrations
- Development server
- Production builds

## Quick Start

### Installation

```bash
# Create a new application
elide-app create my-app

# Navigate to your project
cd my-app

# Run migrations
elide-app db:migrate

# Start development server
elide-app dev
```

Your app is now running at `http://localhost:3000`!

## Project Structure

```
my-app/
├── pages/              # File-based routing
│   ├── index.tsx       # Home page (/)
│   ├── blog/
│   │   └── [id].ts     # Blog post page (/blog/:id)
│   └── api/            # API routes
│       └── users.ts    # API endpoint (/api/users)
├── components/         # React components
│   ├── Header.tsx
│   └── Footer.tsx
├── lib/                # Utility functions
│   ├── db.ts           # Database configuration
│   └── auth.ts         # Auth helpers
├── public/             # Static assets
├── elide.config.ts     # Framework configuration
└── package.json
```

## Usage Examples

### Creating Routes

**pages/blog/[id].ts** - Dynamic route with server-side data fetching:

```typescript
import { Request, Response } from "elide:http";
import type { RouteContext } from "../../router.ts";
import { db } from "../../lib/db.ts";

export async function GET(req: Request, ctx: RouteContext) {
  const { id } = ctx.params;

  const post = await db.model("posts").findUnique({ id });

  if (!post) {
    return new Response("Post not found", { status: 404 });
  }

  return Response.json(post);
}
```

### API Routes

**pages/api/users.ts** - RESTful API endpoint:

```typescript
import { Request, Response } from "elide:http";
import type { RouteContext } from "../../router.ts";
import { db } from "../../lib/db.ts";
import { requireAuth } from "../../auth.ts";

// Middleware: require authentication
export const middleware = [requireAuth()];

export async function GET(req: Request, ctx: RouteContext) {
  const users = await db.model("users").findMany({
    orderBy: { createdAt: "desc" },
    limit: 10,
  });

  return Response.json(users);
}

export async function POST(req: Request, ctx: RouteContext) {
  const data = await req.json();

  const user = await db.model("users").create(data);

  return Response.json(user, { status: 201 });
}
```

### Database Queries

```typescript
import { db } from "./lib/db.ts";

// Create
const user = await db.model("users").create({
  email: "john@example.com",
  name: "John Doe",
  password: "hashed_password",
});

// Find many with filters
const posts = await db.model("posts").findMany({
  where: {
    published: true,
    authorId: user.id,
    createdAt: {
      gte: new Date("2024-01-01").toISOString(),
    },
  },
  orderBy: { createdAt: "desc" },
  limit: 10,
});

// Update
await db.model("users").update(
  { id: user.id },
  { emailVerified: true }
);

// Delete
await db.model("users").delete({ id: user.id });

// Transactions
await db.transaction(async () => {
  const user = await db.model("users").create({
    email: "jane@example.com",
    name: "Jane",
  });

  await db.model("posts").create({
    title: "First Post",
    content: "Hello World",
    authorId: user.id,
  });
});
```

### Authentication

```typescript
import { createAuthSystem } from "./auth.ts";
import { db } from "./lib/db.ts";

const auth = createAuthSystem(db, {
  jwtSecret: "your-secret-key",
  passwordMinLength: 10,
});

// Register
const user = await auth.register(
  "user@example.com",
  "password123",
  "John Doe"
);

// Login
const { user, token } = await auth.login(
  "user@example.com",
  "password123"
);

// Verify token
const user = await auth.verifyToken(token);

// Protected routes
export const middleware = [
  requireAuth(),
  requireRoles("admin"),
];

export async function GET(req: Request, ctx: RouteContext) {
  // ctx.user is available here
  return Response.json({ user: ctx.user });
}
```

### Background Jobs

```typescript
import { createJobManager } from "./jobs.ts";
import { db } from "./lib/db.ts";

const jobs = createJobManager(db);

// Define job handler
const emailQueue = jobs.queue("email", { concurrency: 5 });

emailQueue.handle("welcome-email", async (data, job) => {
  console.log(`Sending welcome email to ${data.email}`);
  await sendEmail(data.email, "Welcome!", "Welcome to our app!");
  return { sent: true };
});

// Add jobs
await emailQueue.add("welcome-email", {
  email: "user@example.com",
  name: "John Doe",
});

// Schedule recurring jobs
emailQueue.schedule("daily-digest", {
  cron: "0 9 * * *", // Every day at 9am
  data: { type: "digest" },
});

// Listen to events
emailQueue.on("completed", (job) => {
  console.log(`Job ${job.id} completed:`, job.result);
});

// Start processing
await jobs.start();
```

### Real-time Communication

```typescript
import { createRealtimeSystem } from "./realtime.ts";

const realtime = createRealtimeSystem();

// Setup channels
const chatChannel = realtime.channel("chat", {
  presence: true,
  historySize: 50,
});

chatChannel.on("message", async (message, connection) => {
  console.log(`New message from ${connection.userId}:`, message.data);

  // Save to database
  await db.model("messages").create({
    userId: connection.userId,
    content: message.data.content,
    channelId: "chat",
  });
});

// WebSocket endpoint
export async function GET(req: Request, ctx: RouteContext) {
  return realtime.handleUpgrade(req, ctx);
}

// Broadcast from server
await realtime.broadcast("chat", "notification", {
  type: "system",
  message: "Server maintenance in 5 minutes",
});
```

### React Server Components

```typescript
import { renderToResponse } from "./server-components.ts";
import { db } from "./lib/db.ts";

// Server Component - runs on the server
async function UserList() {
  const users = await db.model("users").findMany();

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}

// Route handler
export async function GET(req: Request, ctx: RouteContext) {
  return renderToResponse(
    async () => (
      <html>
        <body>
          <h1>My App</h1>
          <UserList />
        </body>
      </html>
    ),
    {},
    {
      streaming: true,
      head: {
        title: "My App",
        description: "Built with Elide",
      },
    }
  );
}
```

## CLI Commands

```bash
# Create new application
elide-app create <name>

# Start development server
elide-app dev [--port 3000]

# Build for production
elide-app build

# Run database migrations
elide-app db:migrate

# Generate code
elide-app generate page <name>
elide-app generate api <name>
elide-app generate component <name>
elide-app generate model <name>

# Deploy application
elide-app deploy
```

## Configuration

**elide.config.ts**:

```typescript
export default {
  server: {
    port: 3000,
    hostname: "localhost",
  },

  database: {
    path: "./app.db",
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: 86400, // 1 day
    sessionExpiration: 604800, // 7 days
  },

  jobs: {
    queues: {
      default: { concurrency: 5 },
      email: { concurrency: 10 },
    },
  },

  realtime: {
    enabled: true,
  },
};
```

## Performance

Elide Full-Stack Framework is built on Elide's high-performance runtime:

- **Fast startup**: Millisecond cold starts
- **Low memory**: Minimal memory footprint
- **High throughput**: Handle thousands of requests per second
- **Native speed**: Compiled to native code
- **Efficient**: Zero-overhead abstractions

## Comparison

| Feature | Elide Framework | Next.js | Rails | Laravel |
|---------|----------------|---------|-------|---------|
| Language | TypeScript | TypeScript | Ruby | PHP |
| Runtime | Elide (Native) | Node.js | Ruby | PHP |
| Routing | File-based | File-based | DSL | DSL |
| Server Components | ✅ | ✅ | ❌ | ❌ |
| ORM | Built-in | External | Active Record | Eloquent |
| Auth | Built-in | External | Devise | Breeze |
| Jobs | Built-in | External | Sidekiq | Horizon |
| Real-time | Built-in | External | Action Cable | Broadcasting |
| Performance | 🔥🔥🔥 | 🔥🔥 | 🔥 | 🔥 |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   HTTP Request                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│                File-Based Router                     │
│  • Route discovery    • Dynamic routes              │
│  • Middleware chain   • Type-safe params            │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│  API Routes  │    │  Server Components│
└──────┬───────┘    └────────┬──────────┘
       │                     │
       ├─────────┬───────────┼─────────┐
       │         │           │         │
       ▼         ▼           ▼         ▼
┌──────────┐ ┌──────┐ ┌──────────┐ ┌──────────┐
│   Auth   │ │  ORM │ │   Jobs   │ │ Realtime │
└──────────┘ └──────┘ └──────────┘ └──────────┘
       │         │           │         │
       └─────────┴───────────┴─────────┘
                      │
                      ▼
            ┌─────────────────┐
            │    Database     │
            └─────────────────┘
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Inspired by the best ideas from:
- **Rails**: Convention over configuration, batteries included
- **Next.js**: File-based routing, Server Components
- **Laravel**: Elegant syntax, comprehensive features
- **Phoenix**: Real-time capabilities, performance
- **Prisma**: Type-safe database access

Built with ❤️ using [Elide](https://github.com/elide-dev/elide)

## Links

- [Documentation](https://elide-framework.dev/docs)
- [Examples](https://github.com/elide-dev/elide-framework-examples)
- [Discord Community](https://discord.gg/elide)
- [Twitter](https://twitter.com/elideframework)

---

**Ready to build something amazing? Let's go! 🚀**

```bash
elide-app create my-awesome-app
cd my-awesome-app
elide-app dev
```
