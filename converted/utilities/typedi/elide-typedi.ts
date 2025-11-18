/**
 * TypeDI - Dependency Injection Container
 *
 * Simple yet powerful dependency injection container for TypeScript and JavaScript.
 * **POLYGLOT SHOWCASE**: Type-safe DI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/typedi (~300K+ downloads/week)
 *
 * Features:
 * - Type-safe dependency injection
 * - Property and constructor injection
 * - Token-based registration
 * - Service factories
 * - Multiple containers
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need type-safe DI
 * - ONE implementation works everywhere on Elide
 * - Share service tokens across languages
 * - Consistent injection patterns
 *
 * Use cases:
 * - Clean architecture (decoupling)
 * - Unit testing (mock injection)
 * - Modular applications
 * - Multi-tenant systems
 *
 * Package has ~300K+ downloads/week on npm - popular DI solution!
 */

// Service token for type-safe registration
export class Token<T = any> {
  constructor(public readonly name: string) {}
}

// Service metadata
interface ServiceMetadata<T = any> {
  type?: new (...args: any[]) => T;
  factory?: (container: Container) => T;
  value?: T;
  scope?: 'singleton' | 'transient';
  instance?: T;
}

/**
 * Main DI Container
 */
export class Container {
  private services = new Map<any, ServiceMetadata>();
  private static globalInstance = new Container();

  /**
   * Set a service in the container
   */
  set<T>(tokenOrType: Token<T> | (new (...args: any[]) => T), metadata: ServiceMetadata<T>): void {
    this.services.set(tokenOrType, { scope: 'singleton', ...metadata });
  }

  /**
   * Get a service from the container
   */
  get<T>(tokenOrType: Token<T> | (new (...args: any[]) => T)): T {
    const metadata = this.services.get(tokenOrType);

    if (!metadata) {
      // Try auto-registration for classes
      if (typeof tokenOrType === 'function') {
        return new tokenOrType();
      }
      throw new Error(`Service not found: ${String(tokenOrType)}`);
    }

    // Return cached instance for singletons
    if (metadata.scope === 'singleton' && metadata.instance) {
      return metadata.instance;
    }

    // Create instance
    let instance: T;

    if (metadata.value !== undefined) {
      instance = metadata.value;
    } else if (metadata.factory) {
      instance = metadata.factory(this);
    } else if (metadata.type) {
      instance = new metadata.type();
    } else {
      throw new Error(`No provider found for ${String(tokenOrType)}`);
    }

    // Cache for singletons
    if (metadata.scope === 'singleton') {
      metadata.instance = instance;
    }

    return instance;
  }

  /**
   * Check if service is registered
   */
  has(tokenOrType: any): boolean {
    return this.services.has(tokenOrType);
  }

  /**
   * Remove service from container
   */
  remove(tokenOrType: any): void {
    this.services.delete(tokenOrType);
  }

  /**
   * Reset container
   */
  reset(): void {
    this.services.clear();
  }

  /**
   * Get global container instance
   */
  static get instance(): Container {
    return Container.globalInstance;
  }

  /**
   * Reset global container
   */
  static resetGlobal(): void {
    Container.globalInstance = new Container();
  }
}

/**
 * Service decorator - marks class as injectable
 */
export function Service(options?: { scope?: 'singleton' | 'transient' }) {
  return function<T extends new (...args: any[]) => any>(constructor: T) {
    Container.instance.set(constructor, {
      type: constructor,
      scope: options?.scope || 'singleton'
    });
    return constructor;
  };
}

/**
 * Inject decorator - injects dependency into property
 */
export function Inject(tokenOrType?: any) {
  return function(target: any, propertyKey: string) {
    // Store injection metadata
    Object.defineProperty(target, propertyKey, {
      get() {
        const type = tokenOrType || Reflect.getMetadata?.('design:type', target, propertyKey);
        return Container.instance.get(type);
      },
      enumerable: true,
      configurable: true
    });
  };
}

// Minimal Reflect polyfill
const Reflect = (globalThis as any).Reflect || {
  getMetadata: () => undefined
};

// Utility functions
export const ContainerInstance = Container.instance;

export { Token as ServiceToken };
export default Container;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💉 TypeDI - Dependency Injection for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Service Registration ===");
  const container1 = new Container();

  class Logger {
    log(message: string) {
      console.log(`[LOG] ${message}`);
    }
  }

  container1.set(Logger, { type: Logger });
  const logger = container1.get(Logger);
  logger.log("Hello from TypeDI!");
  console.log();

  console.log("=== Example 2: Token-based Services ===");
  const container2 = new Container();

  const DATABASE_URL = new Token<string>('DATABASE_URL');
  const API_KEY = new Token<string>('API_KEY');

  container2.set(DATABASE_URL, { value: 'postgresql://localhost/mydb' });
  container2.set(API_KEY, { value: 'secret-key-123' });

  console.log("Database URL:", container2.get(DATABASE_URL));
  console.log("API Key:", container2.get(API_KEY));
  console.log();

  console.log("=== Example 3: Factory Functions ===");
  const container3 = new Container();

  interface Config {
    env: string;
    debug: boolean;
  }

  const CONFIG_TOKEN = new Token<Config>('Config');

  container3.set(CONFIG_TOKEN, {
    factory: () => ({
      env: 'production',
      debug: false
    })
  });

  const config = container3.get(CONFIG_TOKEN);
  console.log("Config:", config);
  console.log();

  console.log("=== Example 4: Singleton vs Transient ===");
  const container4 = new Container();

  class Counter {
    private count = 0;
    increment() { this.count++; }
    getCount() { return this.count; }
  }

  // Singleton
  container4.set('SingletonCounter', { type: Counter, scope: 'singleton' });
  const s1 = container4.get<Counter>('SingletonCounter');
  s1.increment();
  const s2 = container4.get<Counter>('SingletonCounter');
  console.log("Singleton - s1 count:", s1.getCount()); // 1
  console.log("Singleton - s2 count:", s2.getCount()); // 1 (same instance)
  console.log("Same instance:", s1 === s2);

  // Transient
  container4.set('TransientCounter', { type: Counter, scope: 'transient' });
  const t1 = container4.get<Counter>('TransientCounter');
  t1.increment();
  const t2 = container4.get<Counter>('TransientCounter');
  console.log("Transient - t1 count:", t1.getCount()); // 1
  console.log("Transient - t2 count:", t2.getCount()); // 0 (different instance)
  console.log("Same instance:", t1 === t2);
  console.log();

  console.log("=== Example 5: Dependency Injection ===");
  const container5 = new Container();

  class DatabaseService {
    query(sql: string) {
      return `Result: ${sql}`;
    }
  }

  class UserRepository {
    constructor(private db: DatabaseService) {}

    findUser(id: number) {
      return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    }
  }

  container5.set(DatabaseService, { type: DatabaseService });
  container5.set(UserRepository, {
    factory: (c) => new UserRepository(c.get(DatabaseService))
  });

  const userRepo = container5.get(UserRepository);
  console.log(userRepo.findUser(42));
  console.log();

  console.log("=== Example 6: Multiple Containers ===");
  const appContainer = new Container();
  const testContainer = new Container();

  class ProductionDB {
    connect() { return "Connected to production"; }
  }

  class MockDB {
    connect() { return "Connected to mock"; }
  }

  appContainer.set('DB', { type: ProductionDB });
  testContainer.set('DB', { type: MockDB });

  const prodDb = appContainer.get<ProductionDB>('DB');
  const mockDb = testContainer.get<MockDB>('DB');

  console.log("Production:", prodDb.connect());
  console.log("Test:", mockDb.connect());
  console.log();

  console.log("=== Example 7: Service Replacement ===");
  const container7 = new Container();

  class EmailService {
    send(to: string, message: string) {
      console.log(`Email to ${to}: ${message}`);
    }
  }

  class SMSService {
    send(to: string, message: string) {
      console.log(`SMS to ${to}: ${message}`);
    }
  }

  container7.set('NotificationService', { type: EmailService });
  let notifier = container7.get<EmailService>('NotificationService');
  notifier.send('user@example.com', 'Hello!');

  // Replace with SMS
  container7.remove('NotificationService');
  container7.set('NotificationService', { type: SMSService });
  notifier = container7.get<SMSService>('NotificationService');
  notifier.send('+1234567890', 'Hello!');
  console.log();

  console.log("=== Example 8: Global Container ===");
  const LOGGER_TOKEN = new Token<Logger>('Logger');

  ContainerInstance.set(LOGGER_TOKEN, {
    factory: () => new Logger()
  });

  const globalLogger = ContainerInstance.get(LOGGER_TOKEN);
  globalLogger.log("Using global container");
  console.log();

  console.log("=== Example 9: Complex Dependencies ===");
  const container9 = new Container();

  class ConfigService {
    getApiUrl() { return 'https://api.example.com'; }
  }

  class HttpClient {
    constructor(private config: ConfigService) {}
    get(endpoint: string) {
      return `GET ${this.config.getApiUrl()}${endpoint}`;
    }
  }

  class ApiService {
    constructor(private http: HttpClient, private logger: Logger) {}

    fetchUsers() {
      const url = this.http.get('/users');
      this.logger.log(`Fetching: ${url}`);
      return url;
    }
  }

  container9.set(ConfigService, { type: ConfigService });
  container9.set(HttpClient, {
    factory: (c) => new HttpClient(c.get(ConfigService))
  });
  container9.set(Logger, { type: Logger });
  container9.set(ApiService, {
    factory: (c) => new ApiService(c.get(HttpClient), c.get(Logger))
  });

  const apiService = container9.get(ApiService);
  apiService.fetchUsers();
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Same TypeDI works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Type-safe dependency injection");
  console.log("  ✓ Consistent patterns across languages");
  console.log("  ✓ Easy testing with container replacement");
  console.log("  ✓ Clean separation of concerns");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Clean architecture implementation");
  console.log("- Unit testing with mock services");
  console.log("- Modular application design");
  console.log("- Multi-tenant systems");
  console.log("- Configuration management");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Type-safe at compile time");
  console.log("- Efficient singleton caching");
  console.log("- ~300K+ downloads/week on npm!");
}
