/**
 * continuation-local-storage - CLS for Node.js
 *
 * Continuation-local storage for managing context across async callbacks.
 * **POLYGLOT SHOWCASE**: Universal async context for ALL languages on Elide!
 *
 * Features:
 * - Continuation-local storage
 * - Callback context tracking
 * - Request isolation
 * - Context binding
 * - Namespace support
 * - EventEmitter integration
 * - Simple API
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need async context
 * - ONE context library works everywhere on Elide
 * - Consistent async patterns across languages
 * - Share context management across services
 *
 * Use cases:
 * - Request tracking
 * - Session management
 * - Transaction context
 * - User identification
 * - Async logging
 *
 * Package has ~8M downloads/week on npm!
 */

export interface Namespace {
  active: Map<string, any> | null;

  run<T>(fn: () => T): T;
  bind<F extends Function>(fn: F, context?: Map<string, any>): F;
  bindEmitter(emitter: any): void;

  get(key: string): any;
  set(key: string, value: any): void;

  createContext(): Map<string, any>;
}

class NamespaceImpl implements Namespace {
  active: Map<string, any> | null = null;
  private contexts: Map<string, any>[] = [];

  constructor(public name: string) {}

  createContext(): Map<string, any> {
    return new Map(this.active || undefined);
  }

  run<T>(fn: () => T): T {
    const context = this.createContext();
    const oldActive = this.active;
    this.active = context;

    try {
      return fn();
    } finally {
      this.active = oldActive;
    }
  }

  bind<F extends Function>(fn: F, context?: Map<string, any>): F {
    const boundContext = context || this.active;
    const self = this;

    const bound = function (this: any, ...args: any[]) {
      const oldActive = self.active;
      self.active = boundContext;

      try {
        return fn.apply(this, args);
      } finally {
        self.active = oldActive;
      }
    };

    return bound as any as F;
  }

  bindEmitter(emitter: any): void {
    if (!emitter || !emitter.on) return;

    const self = this;
    const originalOn = emitter.on;
    const originalAddListener = emitter.addListener;
    const originalOnce = emitter.once;

    emitter.on = emitter.addListener = function (event: string, listener: Function) {
      return originalOn.call(this, event, self.bind(listener));
    };

    if (originalOnce) {
      emitter.once = function (event: string, listener: Function) {
        return originalOnce.call(this, event, self.bind(listener));
      };
    }
  }

  get(key: string): any {
    if (!this.active) return undefined;
    return this.active.get(key);
  }

  set(key: string, value: any): void {
    if (!this.active) {
      throw new Error('No context available. Please call run() first.');
    }
    this.active.set(key, value);
  }
}

const namespaces = new Map<string, Namespace>();

export function createNamespace(name: string): Namespace {
  if (namespaces.has(name)) {
    throw new Error(`Namespace '${name}' already exists. Use getNamespace() instead.`);
  }

  const namespace = new NamespaceImpl(name);
  namespaces.set(name, namespace);
  return namespace;
}

export function getNamespace(name: string): Namespace | undefined {
  return namespaces.get(name);
}

export function destroyNamespace(name: string): void {
  namespaces.delete(name);
}

export function reset(): void {
  namespaces.clear();
}

// Default export
export default {
  createNamespace,
  getNamespace,
  destroyNamespace,
  reset,
};

// CLI Demo
if (import.meta.url.includes("elide-continuation-local-storage.ts")) {
  console.log("🔄 continuation-local-storage - CLS for Node.js (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Context ===");
  const session = createNamespace('session');
  session.run(() => {
    session.set('userId', '12345');
    session.set('sessionId', 'sess-abc');
    console.log('User ID:', session.get('userId'));
    console.log('Session ID:', session.get('sessionId'));
  });
  console.log();

  console.log("=== Example 2: Nested Contexts ===");
  const request = createNamespace('request');
  request.run(() => {
    request.set('path', '/api/users');
    console.log('Outer path:', request.get('path'));

    request.run(() => {
      request.set('path', '/api/users/123');
      console.log('Inner path:', request.get('path'));
    });

    console.log('Back to outer path:', request.get('path'));
  });
  console.log();

  console.log("=== Example 3: Callback Binding ===");
  const logging = createNamespace('logging');

  function logMessage(message: string) {
    const requestId = logging.get('requestId');
    console.log(`[${requestId}] ${message}`);
  }

  logging.run(() => {
    logging.set('requestId', 'req-001');

    const boundLog = logging.bind(logMessage);
    boundLog('Synchronous message');

    // Simulated async callback
    setTimeout(() => {
      boundLog('Async message (context preserved!)');
    }, 10);
  });

  // Wait for async message
  await new Promise(resolve => setTimeout(resolve, 20));
  console.log();

  console.log("=== Example 4: Request Handling ===");
  const ctx = createNamespace('http-context');

  function handleRequest(requestId: string, userId: string) {
    ctx.run(() => {
      ctx.set('requestId', requestId);
      ctx.set('userId', userId);
      ctx.set('startTime', Date.now());

      authenticate();
      processRequest();
      logCompletion();
    });
  }

  function authenticate() {
    const requestId = ctx.get('requestId');
    const userId = ctx.get('userId');
    console.log(`[${requestId}] Authenticating user: ${userId}`);
  }

  function processRequest() {
    const requestId = ctx.get('requestId');
    console.log(`[${requestId}] Processing request...`);
  }

  function logCompletion() {
    const requestId = ctx.get('requestId');
    const startTime = ctx.get('startTime');
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Request completed in ${duration}ms`);
  }

  handleRequest('req-12345', 'user-789');
  console.log();

  console.log("=== Example 5: Multiple Contexts ===");
  const db = createNamespace('database');
  const auth = createNamespace('auth');

  db.run(() => {
    db.set('connection', 'postgres://localhost');
    db.set('pool', 'main');

    auth.run(() => {
      auth.set('role', 'admin');
      auth.set('permissions', ['read', 'write']);

      console.log('DB Connection:', db.get('connection'));
      console.log('DB Pool:', db.get('pool'));
      console.log('Auth Role:', auth.get('role'));
      console.log('Auth Permissions:', auth.get('permissions'));
    });
  });
  console.log();

  console.log("=== Example 6: EventEmitter Binding ===");
  const events = createNamespace('events');

  class SimpleEmitter {
    private listeners: Map<string, Function[]> = new Map();

    on(event: string, listener: Function) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event)!.push(listener);
      return this;
    }

    emit(event: string, ...args: any[]) {
      const listeners = this.listeners.get(event) || [];
      listeners.forEach(listener => listener(...args));
    }
  }

  const emitter = new SimpleEmitter();

  events.run(() => {
    events.set('context', 'event-context-1');
    events.bindEmitter(emitter);

    emitter.on('data', (data: any) => {
      const context = events.get('context');
      console.log(`[${context}] Received data:`, data);
    });
  });

  // Emit event (context should be preserved)
  emitter.emit('data', { message: 'Hello' });
  console.log();

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("🔄 Same CLS works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One context API, all languages");
  console.log("  ✓ Consistent async patterns");
  console.log("  ✓ Request isolation everywhere");
  console.log("  ✓ Share context management across services");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Request tracking");
  console.log("- Session management");
  console.log("- Transaction context");
  console.log("- User identification");
  console.log("- Async logging");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Simple callback binding");
  console.log("- Lightweight implementation");
  console.log("- ~8M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java via Elide");
  console.log("- Track context across callbacks");
  console.log("- One async pattern for all services");
  console.log("- Perfect for request handling!");
}
