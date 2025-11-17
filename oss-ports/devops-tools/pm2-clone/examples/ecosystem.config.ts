/**
 * PM2 Clone Ecosystem Configuration Example
 *
 * This file demonstrates various configuration options
 * for managing multiple applications.
 */

export default {
  apps: [
    // Web API Server - Cluster Mode
    {
      name: 'api-server',
      script: './examples/api-server.js',
      instances: 4,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        DB_HOST: 'localhost',
        DB_PORT: 5432,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000,
        DB_HOST: 'prod-db.example.com',
        DB_PORT: 5432,
      },
      min_uptime: 5000,
      max_restarts: 10,
      restart_delay: 4000,
    },

    // Background Worker
    {
      name: 'queue-worker',
      script: './examples/worker.js',
      instances: 2,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      cron_restart: '0 */6 * * *', // Restart every 6 hours
      env: {
        WORKER_TYPE: 'queue',
        REDIS_URL: 'redis://localhost:6379',
      },
    },

    // Scheduled Job
    {
      name: 'cron-job',
      script: './examples/cron-job.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 0 * * *', // Run daily at midnight
      autorestart: false,
      env: {
        JOB_TYPE: 'cleanup',
      },
    },

    // Development Server with Watch
    {
      name: 'dev-server',
      script: './examples/dev-server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: true,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
    },

    // Microservice - User Service
    {
      name: 'user-service',
      script: './examples/user-service.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env: {
        SERVICE_NAME: 'user-service',
        PORT: 4001,
      },
    },

    // Microservice - Auth Service
    {
      name: 'auth-service',
      script: './examples/auth-service.js',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env: {
        SERVICE_NAME: 'auth-service',
        PORT: 4002,
      },
    },

    // WebSocket Server
    {
      name: 'ws-server',
      script: './examples/websocket-server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        WS_PORT: 8080,
      },
    },

    // Static File Server
    {
      name: 'static-server',
      script: './examples/static-server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        STATIC_DIR: './public',
        PORT: 8081,
      },
    },
  ],
};
