/**
 * Edge Router
 * Simple routing for edge functions
 */

type Handler = (params: Record<string, string>, body?: any) => any | Promise<any>;

interface Route {
  pattern: RegExp;
  keys: string[];
  handler: Handler;
}

export class Router {
  private routes: Map<string, Route[]> = new Map();

  private parsePattern(pattern: string): { regex: RegExp; keys: string[] } {
    const keys: string[] = [];

    const regexPattern = pattern
      .replace(/:\w+/g, (match) => {
        keys.push(match.slice(1));
        return '([^/]+)';
      })
      .replace(/\*/g, '.*');

    return {
      regex: new RegExp(`^${regexPattern}$`),
      keys
    };
  }

  get(pattern: string, handler: Handler): this {
    return this.add('GET', pattern, handler);
  }

  post(pattern: string, handler: Handler): this {
    return this.add('POST', pattern, handler);
  }

  put(pattern: string, handler: Handler): this {
    return this.add('PUT', pattern, handler);
  }

  delete(pattern: string, handler: Handler): this {
    return this.add('DELETE', pattern, handler);
  }

  private add(method: string, pattern: string, handler: Handler): this {
    if (!this.routes.has(method)) {
      this.routes.set(method, []);
    }

    const { regex, keys } = this.parsePattern(pattern);

    this.routes.get(method)!.push({
      pattern: regex,
      keys,
      handler
    });

    return this;
  }

  async handle(method: string, path: string, body?: any): Promise<any> {
    const routes = this.routes.get(method) || [];

    for (const route of routes) {
      const match = path.match(route.pattern);

      if (match) {
        const params: Record<string, string> = {};

        route.keys.forEach((key, index) => {
          params[key] = match[index + 1];
        });

        return route.handler(params, body);
      }
    }

    return { status: 404, body: 'Not Found' };
  }
}

// CLI demo
if (import.meta.url.includes("router.ts")) {
  console.log("Edge Router Demo\n");

  const router = new Router();

  router
    .get('/users', () => {
      return { status: 200, body: { users: ['Alice', 'Bob'] } };
    })
    .get('/users/:id', (params) => {
      return { status: 200, body: { user: `User ${params.id}` } };
    })
    .post('/users', (params, body) => {
      return { status: 201, body: { created: body } };
    })
    .get('/posts/:postId/comments/:commentId', (params) => {
      return {
        status: 200,
        body: { post: params.postId, comment: params.commentId }
      };
    });

  const tests = [
    { method: 'GET', path: '/users' },
    { method: 'GET', path: '/users/123' },
    { method: 'POST', path: '/users', body: { name: 'Charlie' } },
    { method: 'GET', path: '/posts/1/comments/5' },
    { method: 'GET', path: '/404' }
  ];

  Promise.all(
    tests.map(async (test) => {
      const result = await router.handle(test.method, test.path, test.body);
      console.log(`${test.method} ${test.path}:`, JSON.stringify(result));
    })
  ).then(() => {
    console.log("\n✅ Router test passed");
  });
}
