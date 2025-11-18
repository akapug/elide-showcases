/**
 * DI - Dependency Injection Framework
 *
 * Simple dependency injection framework for Node.js.
 * **POLYGLOT SHOWCASE**: Simple DI for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/di (~50K+ downloads/week)
 *
 * Features:
 * - Constructor injection
 * - Auto-wiring
 * - Circular dependency detection
 * - Module system
 * - Lazy instantiation
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need simple DI
 * - ONE implementation works everywhere on Elide
 * - Module-based organization
 * - Share dependency graphs
 *
 * Use cases:
 * - Module organization
 * - Testing
 * - Plugin systems
 * - Application structure
 *
 * Package has ~50K+ downloads/week on npm!
 */

/**
 * Annotation for dependencies
 */
export class Annotate {
  constructor(public dependencies: any[]) {}
}

/**
 * Injector
 */
export class Injector {
  private providers = new Map<any, any>();
  private instances = new Map<any, any>();
  private loading = new Set<any>();

  constructor(modules: Module[] = []) {
    modules.forEach(mod => this.loadModule(mod));
  }

  /**
   * Load module
   */
  private loadModule(module: Module): void {
    module.forEach(binding => {
      if (Array.isArray(binding)) {
        const [token, provider] = binding;
        this.providers.set(token, provider);
      } else {
        this.providers.set(binding, binding);
      }
    });
  }

  /**
   * Get instance
   */
  get<T>(token: any): T {
    // Check cache
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    // Detect circular dependencies
    if (this.loading.has(token)) {
      throw new Error(`Circular dependency detected: ${String(token)}`);
    }

    const provider = this.providers.get(token) || token;

    if (typeof provider !== 'function') {
      return provider;
    }

    this.loading.add(token);

    try {
      // Get dependencies
      const deps = (provider as any).$inject || [];
      const resolvedDeps = deps.map((dep: any) => this.get(dep));

      // Create instance
      const instance = new provider(...resolvedDeps);

      // Cache
      this.instances.set(token, instance);
      this.loading.delete(token);

      return instance;
    } catch (error) {
      this.loading.delete(token);
      throw error;
    }
  }

  /**
   * Create child injector
   */
  createChild(modules: Module[] = []): Injector {
    const child = new Injector(modules);
    // Copy providers
    this.providers.forEach((value, key) => {
      if (!child.providers.has(key)) {
        child.providers.set(key, value);
      }
    });
    return child;
  }
}

type Module = Array<any | [any, any]>;

/**
 * Inject annotation
 */
export function inject(...dependencies: any[]) {
  return function(target: any) {
    target.$inject = dependencies;
    return target;
  };
}

export default Injector;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💉 DI - Simple DI Framework for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Injection ===");
  class Logger {
    log(msg: string) {
      console.log(`[LOG] ${msg}`);
    }
  }

  const injector1 = new Injector([[Logger, Logger]]);
  const logger = injector1.get(Logger);
  logger.log("Hello from DI!");
  console.log();

  console.log("=== Example 2: Constructor Injection ===");
  class Database {
    query(sql: string) {
      return `DB: ${sql}`;
    }
  }

  @inject(Database, Logger)
  class UserService {
    constructor(private db: Database, private logger: Logger) {}

    getUser(id: number) {
      const result = this.db.query(`SELECT * FROM users WHERE id = ${id}`);
      this.logger.log(result);
      return result;
    }
  }

  const injector2 = new Injector([[Database, Database], [Logger, Logger], [UserService, UserService]]);
  const service = injector2.get(UserService);
  service.getUser(42);
  console.log();

  console.log("=== Example 3: Modules ===");
  const databaseModule: Module = [
    [Database, Database]
  ];

  const loggingModule: Module = [
    [Logger, Logger]
  ];

  const appModule: Module = [
    [UserService, UserService]
  ];

  const injector3 = new Injector([databaseModule, loggingModule, appModule]);
  const userSvc = injector3.get(UserService);
  console.log("Service loaded from modules");
  console.log();

  console.log("=== Example 4: Singleton Behavior ===");
  class Counter {
    private count = 0;
    increment() { this.count++; }
    getCount() { return this.count; }
  }

  const injector4 = new Injector([[Counter, Counter]]);

  const c1 = injector4.get(Counter);
  c1.increment();
  const c2 = injector4.get(Counter);
  c2.increment();

  console.log("Counter 1:", c1.getCount());
  console.log("Counter 2:", c2.getCount());
  console.log("Same instance:", c1 === c2);
  console.log();

  console.log("=== Example 5: Value Providers ===");
  const config = {
    apiUrl: 'https://api.example.com',
    timeout: 5000
  };

  const injector5 = new Injector([['Config', config]]);
  const retrievedConfig = injector5.get('Config');
  console.log("Config:", retrievedConfig);
  console.log();

  console.log("=== Example 6: Child Injectors ===");
  const parent = new Injector([[Logger, Logger], ['AppName', 'MyApp']]);
  const child = parent.createChild([['Feature', 'UserManagement']]);

  console.log("Parent app:", parent.get('AppName'));
  console.log("Child app:", child.get('AppName'));
  console.log("Child feature:", child.get('Feature'));
  console.log();

  console.log("=== Example 7: Testing with Mocks ===");
  class MockDatabase {
    query(sql: string) {
      return `Mock: ${sql}`;
    }
  }

  const testInjector = new Injector([[Database, MockDatabase], [Logger, Logger]]);
  testInjector.get(Database);
  console.log("Using mock database for testing");
  console.log();

  console.log("=== Example 8: Lazy Instantiation ===");
  class ExpensiveService {
    constructor() {
      console.log("ExpensiveService created");
    }
  }

  const injector8 = new Injector([[ExpensiveService, ExpensiveService]]);
  console.log("Injector created (service not instantiated yet)");
  injector8.get(ExpensiveService);
  console.log("Service instantiated on first get()");
  console.log();

  console.log("=== Example 9: Complex Dependencies ===");
  @inject()
  class ConfigService {
    getApiUrl() { return 'https://api.example.com'; }
  }

  @inject(ConfigService)
  class HttpClient {
    constructor(private config: ConfigService) {}
    get(url: string) {
      return `GET ${this.config.getApiUrl()}${url}`;
    }
  }

  @inject(HttpClient, Logger)
  class ApiService {
    constructor(private http: HttpClient, private logger: Logger) {}

    fetchData() {
      const url = this.http.get('/data');
      this.logger.log(url);
      return url;
    }
  }

  const injector9 = new Injector([
    [ConfigService, ConfigService],
    [HttpClient, HttpClient],
    [Logger, Logger],
    [ApiService, ApiService]
  ]);

  const api = injector9.get(ApiService);
  api.fetchData();
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Same DI framework works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Simple module system");
  console.log("  ✓ Circular dependency detection");
  console.log("  ✓ Lazy instantiation");
  console.log("  ✓ Child injectors");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Module organization");
  console.log("- Testing with mocks");
  console.log("- Plugin systems");
  console.log("- Application structure");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Efficient caching");
  console.log("- ~50K+ downloads/week on npm!");
}
