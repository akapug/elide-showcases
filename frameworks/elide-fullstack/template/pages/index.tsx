/**
 * Home Page - Main landing page
 *
 * This is a Server Component that renders on the server.
 * It can fetch data directly during render without client-side JavaScript.
 */

import { Request, Response } from "elide:http";
import type { RouteContext } from "../../router.ts";
import { renderToResponse } from "../../server-components.ts";

// Server Component
async function HomePage() {
  // Fetch data on the server
  const stats = {
    routes: 12,
    components: 8,
    users: 1337,
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Elide Full-Stack Framework</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .container {
            max-width: 800px;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          h1 {
            font-size: 3em;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .subtitle {
            font-size: 1.4em;
            color: #666;
            margin-bottom: 30px;
          }

          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
          }

          .feature {
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }

          .feature h3 {
            color: #667eea;
            margin-bottom: 10px;
          }

          .stats {
            display: flex;
            justify-content: space-around;
            margin: 40px 0;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 8px;
          }

          .stat {
            text-align: center;
          }

          .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
          }

          .stat-label {
            color: #666;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 1px;
          }

          .cta {
            text-align: center;
            margin-top: 40px;
          }

          .btn {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            transition: transform 0.2s;
          }

          .btn:hover {
            transform: translateY(-2px);
          }

          code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>Elide Full-Stack Framework</h1>
          <p className="subtitle">
            The Rails/Next.js killer built with Elide
          </p>

          <div className="features">
            <div className="feature">
              <h3>File-Based Routing</h3>
              <p>Convention over configuration. Just create files in <code>pages/</code></p>
            </div>

            <div className="feature">
              <h3>Server Components</h3>
              <p>React Server Components with streaming and Suspense support</p>
            </div>

            <div className="feature">
              <h3>Type-Safe ORM</h3>
              <p>Prisma-like database layer with full TypeScript support</p>
            </div>

            <div className="feature">
              <h3>Built-in Auth</h3>
              <p>JWT, sessions, OAuth, and role-based permissions</p>
            </div>

            <div className="feature">
              <h3>Background Jobs</h3>
              <p>Sidekiq-inspired job queue with scheduling and retries</p>
            </div>

            <div className="feature">
              <h3>Real-time</h3>
              <p>WebSocket support with channels and presence tracking</p>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-value">{stats.routes}</div>
              <div className="stat-label">Routes</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.components}</div>
              <div className="stat-label">Components</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.users}</div>
              <div className="stat-label">Users</div>
            </div>
          </div>

          <div className="cta">
            <a href="/api/hello" className="btn">
              Try API Endpoint
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

// Route handler
export async function GET(req: Request, ctx: RouteContext) {
  return renderToResponse(
    HomePage,
    {},
    {
      streaming: true,
      head: {
        title: "Elide Full-Stack Framework",
        description: "The Rails/Next.js killer built with Elide",
        meta: [
          { name: "viewport", content: "width=device-width, initial-scale=1" },
        ],
      },
    }
  );
}
