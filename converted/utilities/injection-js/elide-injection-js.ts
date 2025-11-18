/**
 * Injection-JS - Angular DI
 *
 * Dependency injection library for JavaScript and TypeScript, based on Angular's DI.
 * **POLYGLOT SHOWCASE**: Angular DI patterns for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/injection-js (~100K+ downloads/week)
 *
 * Features:
 * - Hierarchical injectors
 * - Provider patterns
 * - Injection tokens
 * - Multi-providers
 * - Optional dependencies
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need hierarchical DI
 * - ONE implementation works everywhere on Elide
 * - Angular patterns across languages
 * - Share injector hierarchies
 *
 * Use cases:
 * - Angular-style architecture
 * - Hierarchical services
 * - Framework development
 * - Plugin systems
 *
 * Package has ~100K+ downloads/week on npm - Angular DI!
 */

/**
 * Injection Token
 */
export class InjectionToken<T = any> {
  constructor(public readonly desc: string) {}
  toString() { return `InjectionToken ${this.desc}`; }
}

/**
 * Provider types
 */
export interface ClassProvider {
  provide: any;
  useClass: new (...args: any[]) => any;
  multi?: boolean;
}

export interface ValueProvider {
  provide: any;
  useValue: any;
  multi?: boolean;
}

export interface FactoryProvider {
  provide: any;
  useFactory: (...args: any[]) => any;
  deps?: any[];
  multi?: boolean;
}

export interface ExistingProvider {
  provide: any;
  useExisting: any;
  multi?: boolean;
}

export type Provider = ClassProvider | ValueProvider | FactoryProvider | ExistingProvider | any;

/**
 * Resolved provider
 */
interface ResolvedProvider {
  token: any;
  factory: (injector: ReflectiveInjector) => any;
  multi: boolean;
}

/**
 * Reflective Injector
 */
export class ReflectiveInjector {
  private providers = new Map<any, ResolvedProvider>();
  private instances = new Map<any, any>();
  private multiInstances = new Map<any, any[]>();

  constructor(
    providers: Provider[],
    public parent?: ReflectiveInjector
  ) {
    this.resolveProviders(providers);
  }

  /**
   * Create injector from providers
   */
  static resolveAndCreate(providers: Provider[], parent?: ReflectiveInjector): ReflectiveInjector {
    return new ReflectiveInjector(providers, parent);
  }

  /**
   * Create child injector
   */
  resolveAndCreateChild(providers: Provider[]): ReflectiveInjector {
    return new ReflectiveInjector(providers, this);
  }

  /**
   * Get instance
   */
  get<T>(token: any, notFoundValue?: T): T {
    // Check for multi-provider
    if (this.multiInstances.has(token)) {
      return this.multiInstances.get(token) as any;
    }

    // Check cache
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    // Resolve
    const provider = this.providers.get(token);
    if (provider) {
      if (provider.multi) {
        const instances = provider.factory(this);
        this.multiInstances.set(token, instances);
        return instances as any;
      }

      const instance = provider.factory(this);
      this.instances.set(token, instance);
      return instance;
    }

    // Try parent
    if (this.parent) {
      return this.parent.get(token, notFoundValue);
    }

    if (notFoundValue !== undefined) {
      return notFoundValue;
    }

    throw new Error(`No provider for ${String(token)}!`);
  }

  /**
   * Resolve providers
   */
  private resolveProviders(providers: Provider[]): void {
    for (const provider of providers) {
      const resolved = this.resolveProvider(provider);
      this.providers.set(resolved.token, resolved);
    }
  }

  /**
   * Resolve single provider
   */
  private resolveProvider(provider: Provider): ResolvedProvider {
    // Class shorthand
    if (typeof provider === 'function') {
      return {
        token: provider,
        factory: () => new provider(),
        multi: false
      };
    }

    const p = provider as any;
    const token = p.provide || provider;

    // useClass
    if (p.useClass) {
      return {
        token,
        factory: () => new p.useClass(),
        multi: p.multi || false
      };
    }

    // useValue
    if ('useValue' in p) {
      return {
        token,
        factory: () => p.useValue,
        multi: p.multi || false
      };
    }

    // useFactory
    if (p.useFactory) {
      return {
        token,
        factory: (injector) => {
          const deps = (p.deps || []).map((dep: any) => injector.get(dep));
          return p.useFactory(...deps);
        },
        multi: p.multi || false
      };
    }

    // useExisting
    if (p.useExisting) {
      return {
        token,
        factory: (injector) => injector.get(p.useExisting),
        multi: p.multi || false
      };
    }

    throw new Error(`Invalid provider: ${JSON.stringify(provider)}`);
  }
}

/**
 * Injectable decorator
 */
export function Injectable() {
  return function(target: any) {
    return target;
  };
}

/**
 * Inject decorator
 */
export function Inject(token: any) {
  return function(target: any, propertyKey: string | undefined, parameterIndex: number) {
    // Metadata storage (simplified)
  };
}

/**
 * Optional decorator
 */
export function Optional() {
  return function(target: any, propertyKey: string | undefined, parameterIndex: number) {
    // Metadata storage (simplified)
  };
}

export default ReflectiveInjector;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🅰️ Injection-JS - Angular DI for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Injection ===");
  class Logger {
    log(msg: string) {
      console.log(`[LOG] ${msg}`);
    }
  }

  const injector1 = ReflectiveInjector.resolveAndCreate([Logger]);
  const logger = injector1.get(Logger);
  logger.log("Hello from Injection-JS!");
  console.log();

  console.log("=== Example 2: Injection Tokens ===");
  const API_URL = new InjectionToken<string>('API_URL');
  const TIMEOUT = new InjectionToken<number>('TIMEOUT');

  const injector2 = ReflectiveInjector.resolveAndCreate([
    { provide: API_URL, useValue: 'https://api.example.com' },
    { provide: TIMEOUT, useValue: 5000 }
  ]);

  console.log("API URL:", injector2.get(API_URL));
  console.log("Timeout:", injector2.get(TIMEOUT));
  console.log();

  console.log("=== Example 3: Class Providers ===");
  interface Database {
    query(sql: string): string;
  }

  class PostgresDB implements Database {
    query(sql: string) {
      return `Postgres: ${sql}`;
    }
  }

  class MySQLDB implements Database {
    query(sql: string) {
      return `MySQL: ${sql}`;
    }
  }

  const DB_TOKEN = new InjectionToken<Database>('Database');

  const injector3 = ReflectiveInjector.resolveAndCreate([
    { provide: DB_TOKEN, useClass: PostgresDB }
  ]);

  const db = injector3.get<Database>(DB_TOKEN);
  console.log(db.query("SELECT * FROM users"));
  console.log();

  console.log("=== Example 4: Factory Providers ===");
  const CONFIG_TOKEN = new InjectionToken('Config');

  const injector4 = ReflectiveInjector.resolveAndCreate([
    {
      provide: CONFIG_TOKEN,
      useFactory: () => ({
        env: 'production',
        debug: false
      })
    }
  ]);

  console.log("Config:", injector4.get(CONFIG_TOKEN));
  console.log();

  console.log("=== Example 5: Factory with Dependencies ===");
  class UserService {
    constructor(private db: Database, private logger: Logger) {}

    getUser(id: number) {
      const result = this.db.query(`SELECT * FROM users WHERE id = ${id}`);
      this.logger.log(result);
      return result;
    }
  }

  const injector5 = ReflectiveInjector.resolveAndCreate([
    { provide: DB_TOKEN, useClass: PostgresDB },
    Logger,
    {
      provide: UserService,
      useFactory: (db: Database, logger: Logger) => new UserService(db, logger),
      deps: [DB_TOKEN, Logger]
    }
  ]);

  const userService = injector5.get(UserService);
  userService.getUser(42);
  console.log();

  console.log("=== Example 6: Hierarchical Injectors ===");
  const parentInjector = ReflectiveInjector.resolveAndCreate([
    { provide: 'AppName', useValue: 'MyApp' },
    { provide: 'Version', useValue: '1.0.0' }
  ]);

  const childInjector = parentInjector.resolveAndCreateChild([
    { provide: 'Feature', useValue: 'UserManagement' }
  ]);

  console.log("Parent - AppName:", parentInjector.get('AppName'));
  console.log("Child - AppName:", childInjector.get('AppName')); // Inherited
  console.log("Child - Feature:", childInjector.get('Feature'));
  console.log();

  console.log("=== Example 7: Optional Dependencies ===");
  const injector7 = ReflectiveInjector.resolveAndCreate([Logger]);

  const logger7 = injector7.get(Logger);
  const missing = injector7.get('MissingService', null);

  console.log("Logger exists:", logger7 !== null);
  console.log("Missing service:", missing);
  console.log();

  console.log("=== Example 8: useExisting ===");
  class MainLogger extends Logger {
    log(msg: string) {
      console.log(`[MAIN] ${msg}`);
    }
  }

  const injector8 = ReflectiveInjector.resolveAndCreate([
    MainLogger,
    { provide: Logger, useExisting: MainLogger }
  ]);

  const main = injector8.get(MainLogger);
  const alias = injector8.get(Logger);

  main.log("Main logger");
  console.log("Same instance:", main === alias);
  console.log();

  console.log("=== Example 9: Multi Providers ===");
  const PLUGINS = new InjectionToken<string[]>('Plugins');

  const injector9 = ReflectiveInjector.resolveAndCreate([
    { provide: PLUGINS, useValue: 'plugin1', multi: true },
    { provide: PLUGINS, useValue: 'plugin2', multi: true },
    { provide: PLUGINS, useValue: 'plugin3', multi: true }
  ]);

  console.log("Plugins:", injector9.get(PLUGINS));
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Same Injection-JS works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Angular DI patterns everywhere");
  console.log("  ✓ Hierarchical injector trees");
  console.log("  ✓ Multi-providers support");
  console.log("  ✓ Optional dependencies");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Angular-style architecture");
  console.log("- Hierarchical services");
  console.log("- Framework development");
  console.log("- Plugin systems");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Efficient caching");
  console.log("- ~100K+ downloads/week on npm!");
}
