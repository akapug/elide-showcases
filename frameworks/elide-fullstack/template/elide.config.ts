/**
 * Elide Full-Stack Framework Configuration
 *
 * Configure your application settings here.
 */

export default {
  /**
   * Server configuration
   */
  server: {
    port: 3000,
    hostname: "localhost",
  },

  /**
   * Database configuration
   */
  database: {
    path: "./app.db",
    // For PostgreSQL:
    // url: "postgresql://user:password@localhost:5432/mydb",
    // For MySQL:
    // url: "mysql://user:password@localhost:3306/mydb",
  },

  /**
   * Authentication configuration
   */
  auth: {
    jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
    jwtExpiration: 86400, // 1 day in seconds
    sessionExpiration: 604800, // 7 days in seconds
    passwordMinLength: 8,
    enableOAuth: false,
    oauthProviders: [
      // {
      //   name: "google",
      //   clientId: process.env.GOOGLE_CLIENT_ID,
      //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      //   authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      //   tokenUrl: "https://oauth2.googleapis.com/token",
      //   userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      //   scopes: ["email", "profile"],
      // },
    ],
  },

  /**
   * Job queue configuration
   */
  jobs: {
    queues: {
      default: {
        concurrency: 5,
      },
      email: {
        concurrency: 10,
        rateLimit: {
          max: 100,
          duration: 60000, // 1 minute
        },
      },
      notifications: {
        concurrency: 20,
      },
    },
  },

  /**
   * Real-time configuration
   */
  realtime: {
    enabled: true,
    channels: {
      chat: {
        presence: true,
        historySize: 100,
      },
      notifications: {
        private: true,
      },
    },
  },

  /**
   * Caching configuration
   */
  cache: {
    enabled: true,
    defaultMaxAge: 300, // 5 minutes
    defaultSWR: 60, // 1 minute
  },

  /**
   * CORS configuration
   */
  cors: {
    enabled: true,
    origins: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },

  /**
   * Rate limiting
   */
  rateLimit: {
    enabled: true,
    windowMs: 900000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },

  /**
   * Logging configuration
   */
  logging: {
    level: "info", // "debug", "info", "warn", "error"
    format: "json", // "json" or "pretty"
  },

  /**
   * Build configuration
   */
  build: {
    target: "esnext",
    minify: true,
    sourcemap: true,
    outDir: "./dist",
  },
};
