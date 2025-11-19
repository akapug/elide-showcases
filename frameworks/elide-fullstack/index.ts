/**
 * Elide Full-Stack Framework - Main Entry Point
 *
 * This file exports all the framework components and provides
 * a simple API to bootstrap your application.
 */

// Core framework exports
export { createRouter, Router } from "./router.ts";
export type { RouteHandler, RouteContext, RouteMetadata, Middleware } from "./router.ts";

export {
  ServerRenderer,
  createRenderer,
  renderToResponse,
  clientComponent,
  registerClientComponent,
  Suspense,
} from "./server-components.ts";
export type {
  ServerComponent,
  ClientComponent,
  RenderOptions,
  HeadConfig,
} from "./server-components.ts";

export { createDataLayer, DataLayer, Model } from "./data-layer.ts";
export type {
  SchemaDefinition,
  ModelSchema,
  FieldDefinition,
  QueryOptions,
  WhereClause,
} from "./data-layer.ts";

export {
  createAuthSystem,
  AuthSystem,
  PasswordHasher,
  JWT,
  createAuthMiddleware,
  requireAuth,
  requireRoles,
} from "./auth.ts";
export type { AuthConfig, User, Session } from "./auth.ts";

export { createJobManager, JobManager, JobQueue } from "./jobs.ts";
export type { Job, JobOptions, JobHandler, QueueOptions } from "./jobs.ts";

export { createRealtimeSystem, RealtimeSystem, Channel } from "./realtime.ts";
export type {
  RealtimeMessage,
  Connection,
  ChannelOptions,
  PresenceData,
} from "./realtime.ts";

export { createCLI, CLI } from "./cli.ts";
export type { Command, CommandOption } from "./cli.ts";

/**
 * Application Configuration
 */
export interface AppConfig {
  port?: number;
  hostname?: string;
  pagesDir?: string;
  databasePath?: string;
  databaseSchema?: any;
  auth?: {
    jwtSecret: string;
    jwtExpiration?: number;
    sessionExpiration?: number;
    passwordMinLength?: number;
  };
  jobs?: {
    enabled?: boolean;
  };
  realtime?: {
    enabled?: boolean;
  };
}

/**
 * Application instance
 */
export class Application {
  public router: any;
  public db: any;
  public auth: any;
  public jobs: any;
  public realtime: any;

  constructor(private config: AppConfig) {}

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    const {
      pagesDir = "./pages",
      databasePath = "./app.db",
      databaseSchema,
      auth,
      jobs,
      realtime,
    } = this.config;

    // Initialize database
    if (databaseSchema) {
      const { createDataLayer } = await import("./data-layer.ts");
      this.db = createDataLayer(databasePath, databaseSchema);
      await this.db.migrate();
      console.log("Database initialized");
    }

    // Initialize authentication
    if (auth && this.db) {
      const { createAuthSystem, createAuthMiddleware } = await import("./auth.ts");
      this.auth = createAuthSystem(this.db, auth);
      console.log("Authentication initialized");
    }

    // Initialize job queue
    if (jobs?.enabled && this.db) {
      const { createJobManager } = await import("./jobs.ts");
      this.jobs = createJobManager(this.db);
      await this.jobs.start();
      console.log("Job queue initialized");
    }

    // Initialize real-time system
    if (realtime?.enabled) {
      const { createRealtimeSystem } = await import("./realtime.ts");
      this.realtime = createRealtimeSystem();
      console.log("Real-time system initialized");
    }

    // Initialize router
    const { createRouter, createAuthMiddleware } = await import("./router.ts");
    this.router = createRouter(pagesDir);

    // Add auth middleware if auth is enabled
    if (this.auth) {
      const { createAuthMiddleware } = await import("./auth.ts");
      this.router.use(createAuthMiddleware(this.auth));
    }

    await this.router.discover();
    console.log(`Discovered ${this.router.routes().length} routes`);
  }

  /**
   * Start the application server
   */
  async start(): Promise<void> {
    const { port = 3000, hostname = "localhost" } = this.config;

    const { serve } = await import("elide:http");

    serve({
      port,
      hostname,
      fetch: (req) => this.router.handle(req),
    });

    console.log(`\n🚀 Server running at http://${hostname}:${port}\n`);
  }

  /**
   * Stop the application
   */
  async stop(): Promise<void> {
    if (this.jobs) {
      this.jobs.stop();
    }

    if (this.db) {
      this.db.close();
    }

    console.log("Application stopped");
  }
}

/**
 * Create and initialize an application
 */
export async function createApp(config: AppConfig): Promise<Application> {
  const app = new Application(config);
  await app.init();
  return app;
}

/**
 * Quick start helper - Create and start an application
 */
export async function startApp(config: AppConfig): Promise<Application> {
  const app = await createApp(config);
  await app.start();
  return app;
}

// Example usage:
/**
 * // Simple usage
 * import { startApp } from "./index.ts";
 * import { schema } from "./lib/db.ts";
 *
 * await startApp({
 *   port: 3000,
 *   pagesDir: "./pages",
 *   databasePath: "./app.db",
 *   databaseSchema: schema,
 *   auth: {
 *     jwtSecret: "your-secret-key",
 *   },
 *   jobs: {
 *     enabled: true,
 *   },
 *   realtime: {
 *     enabled: true,
 *   },
 * });
 *
 * // Advanced usage
 * import { createApp } from "./index.ts";
 *
 * const app = await createApp({
 *   port: 3000,
 *   databaseSchema: schema,
 *   auth: { jwtSecret: "secret" },
 * });
 *
 * // Register custom job handlers
 * const emailQueue = app.jobs.queue("email");
 * emailQueue.handle("welcome", async (data) => {
 *   console.log("Sending welcome email to", data.email);
 * });
 *
 * // Setup real-time channels
 * const chatChannel = app.realtime.channel("chat");
 * chatChannel.on("message", (msg) => {
 *   console.log("New message:", msg);
 * });
 *
 * // Start the server
 * await app.start();
 */
