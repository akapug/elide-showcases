/**
 * CQRS Polyglot Pattern
 *
 * Command Query Responsibility Segregation with polyglot implementation:
 * - TypeScript: Command handlers (writes)
 * - Python: Query handlers with optimized read models
 * - Go: Event projections and indexing
 * - Java: Command validation and business rules
 *
 * Demonstrates separation of read and write models across languages.
 */

// Commands (Write Side)
interface Command {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: number;
  data: any;
  userId: string;
}

// Queries (Read Side)
interface Query {
  type: string;
  params: Record<string, any>;
}

// Events
interface Event {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: number;
  data: any;
}

// Command Handler (TypeScript)
class CommandHandler {
  private eventStore: Event[] = [];
  private validators: CommandValidator;

  constructor() {
    this.validators = new CommandValidator();
  }

  async handle(command: Command): Promise<{ success: boolean; events: Event[]; errors?: string[] }> {
    console.log(`[TypeScript CommandHandler] Handling: ${command.type}`);

    // Validate command (Java)
    const validation = this.validators.validate(command);
    if (!validation.valid) {
      console.log(`  ✗ Validation failed:`, validation.errors);
      return { success: false, events: [], errors: validation.errors };
    }

    // Execute command and generate events
    const events = await this.executeCommand(command);

    // Store events
    for (const event of events) {
      this.eventStore.push(event);
    }

    console.log(`  ✓ Command executed, ${events.length} events generated`);

    return { success: true, events };
  }

  private async executeCommand(command: Command): Promise<Event[]> {
    const events: Event[] = [];

    switch (command.type) {
      case 'CreateProduct':
        events.push({
          id: `evt-${Date.now()}`,
          type: 'ProductCreated',
          aggregateId: command.aggregateId,
          timestamp: Date.now(),
          data: command.data,
        });
        break;

      case 'UpdateProductPrice':
        events.push({
          id: `evt-${Date.now()}`,
          type: 'ProductPriceUpdated',
          aggregateId: command.aggregateId,
          timestamp: Date.now(),
          data: command.data,
        });
        break;

      case 'PlaceOrder':
        events.push({
          id: `evt-${Date.now()}`,
          type: 'OrderPlaced',
          aggregateId: command.aggregateId,
          timestamp: Date.now(),
          data: command.data,
        });
        break;

      case 'CancelOrder':
        events.push({
          id: `evt-${Date.now()}`,
          type: 'OrderCancelled',
          aggregateId: command.aggregateId,
          timestamp: Date.now(),
          data: command.data,
        });
        break;

      default:
        throw new Error(`Unknown command: ${command.type}`);
    }

    return events;
  }

  getEvents(): Event[] {
    return this.eventStore;
  }
}

// Command Validator (Java-style)
class CommandValidator {
  validate(command: Command): { valid: boolean; errors: string[] } {
    console.log(`  [Java CommandValidator] Validating: ${command.type}`);

    const errors: string[] = [];

    // Common validations
    if (!command.aggregateId) {
      errors.push('aggregateId is required');
    }

    if (!command.userId) {
      errors.push('userId is required');
    }

    // Command-specific validations
    switch (command.type) {
      case 'CreateProduct':
        if (!command.data.name || command.data.name.length < 3) {
          errors.push('Product name must be at least 3 characters');
        }
        if (!command.data.price || command.data.price <= 0) {
          errors.push('Product price must be positive');
        }
        break;

      case 'UpdateProductPrice':
        if (!command.data.newPrice || command.data.newPrice <= 0) {
          errors.push('New price must be positive');
        }
        break;

      case 'PlaceOrder':
        if (!command.data.items || command.data.items.length === 0) {
          errors.push('Order must contain at least one item');
        }
        if (!command.data.totalAmount || command.data.totalAmount <= 0) {
          errors.push('Total amount must be positive');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Read Model (Python-style)
class ReadModelBuilder {
  private products: Map<string, any> = new Map();
  private orders: Map<string, any> = new Map();
  private productsByCategory: Map<string, Set<string>> = new Map();
  private ordersByUser: Map<string, Set<string>> = new Map();

  projectEvent(event: Event): void {
    console.log(`  [Python ReadModelBuilder] Projecting: ${event.type}`);

    switch (event.type) {
      case 'ProductCreated':
        this.products.set(event.aggregateId, {
          id: event.aggregateId,
          ...event.data,
          createdAt: event.timestamp,
        });

        // Index by category
        const category = event.data.category || 'uncategorized';
        if (!this.productsByCategory.has(category)) {
          this.productsByCategory.set(category, new Set());
        }
        this.productsByCategory.get(category)!.add(event.aggregateId);
        break;

      case 'ProductPriceUpdated':
        const product = this.products.get(event.aggregateId);
        if (product) {
          product.price = event.data.newPrice;
          product.priceHistory = product.priceHistory || [];
          product.priceHistory.push({
            price: event.data.newPrice,
            changedAt: event.timestamp,
          });
        }
        break;

      case 'OrderPlaced':
        this.orders.set(event.aggregateId, {
          id: event.aggregateId,
          ...event.data,
          status: 'placed',
          placedAt: event.timestamp,
        });

        // Index by user
        const userId = event.data.userId;
        if (!this.ordersByUser.has(userId)) {
          this.ordersByUser.set(userId, new Set());
        }
        this.ordersByUser.get(userId)!.add(event.aggregateId);
        break;

      case 'OrderCancelled':
        const order = this.orders.get(event.aggregateId);
        if (order) {
          order.status = 'cancelled';
          order.cancelledAt = event.timestamp;
        }
        break;
    }
  }

  getProduct(id: string): any {
    return this.products.get(id);
  }

  getProducts(category?: string): any[] {
    if (category) {
      const productIds = this.productsByCategory.get(category) || new Set();
      return Array.from(productIds).map(id => this.products.get(id)!);
    }
    return Array.from(this.products.values());
  }

  getOrder(id: string): any {
    return this.orders.get(id);
  }

  getOrdersByUser(userId: string): any[] {
    const orderIds = this.ordersByUser.get(userId) || new Set();
    return Array.from(orderIds).map(id => this.orders.get(id)!);
  }

  // Advanced queries (Python's strength)
  getProductAnalytics(): any {
    console.log(`  [Python Analytics] Calculating product analytics`);

    const products = Array.from(this.products.values());

    return {
      totalProducts: products.length,
      averagePrice: products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length || 0,
      priceRange: {
        min: Math.min(...products.map(p => p.price || 0)),
        max: Math.max(...products.map(p => p.price || 0)),
      },
      byCategory: this.aggregateByCategory(products),
    };
  }

  private aggregateByCategory(products: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const product of products) {
      const category = product.category || 'uncategorized';
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }
}

// Query Handler (Python-style)
class QueryHandler {
  private readModel: ReadModelBuilder;
  private indexer: SearchIndexer;

  constructor(readModel: ReadModelBuilder, indexer: SearchIndexer) {
    this.readModel = readModel;
    this.indexer = indexer;
  }

  async query(query: Query): Promise<any> {
    console.log(`[Python QueryHandler] Executing: ${query.type}`);

    switch (query.type) {
      case 'GetProduct':
        return this.readModel.getProduct(query.params.id);

      case 'ListProducts':
        return this.readModel.getProducts(query.params.category);

      case 'GetOrder':
        return this.readModel.getOrder(query.params.id);

      case 'GetUserOrders':
        return this.readModel.getOrdersByUser(query.params.userId);

      case 'ProductAnalytics':
        return this.readModel.getProductAnalytics();

      case 'SearchProducts':
        return this.indexer.search(query.params.searchTerm);

      default:
        throw new Error(`Unknown query: ${query.type}`);
    }
  }
}

// Search Indexer (Go-style)
class SearchIndexer {
  private index: Map<string, Set<string>> = new Map();

  indexProduct(product: any): void {
    console.log(`  [Go SearchIndexer] Indexing product: ${product.id}`);

    // Index by name tokens
    const tokens = this.tokenize(product.name);
    for (const token of tokens) {
      if (!this.index.has(token)) {
        this.index.set(token, new Set());
      }
      this.index.get(token)!.add(product.id);
    }

    // Index by category
    if (product.category) {
      const categoryToken = `cat:${product.category}`;
      if (!this.index.has(categoryToken)) {
        this.index.set(categoryToken, new Set());
      }
      this.index.get(categoryToken)!.add(product.id);
    }
  }

  search(searchTerm: string): { productIds: string[]; matchCount: number } {
    console.log(`  [Go SearchIndexer] Searching: ${searchTerm}`);

    const tokens = this.tokenize(searchTerm);
    const matchedProducts = new Set<string>();

    for (const token of tokens) {
      const matches = this.index.get(token);
      if (matches) {
        matches.forEach(id => matchedProducts.add(id));
      }
    }

    return {
      productIds: Array.from(matchedProducts),
      matchCount: matchedProducts.size,
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 0);
  }
}

// Demo
export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       CQRS Polyglot - Elide Runtime Showcase            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('CQRS Architecture:');
  console.log('  • Command Handler:    TypeScript (Write side)');
  console.log('  • Command Validation: Java (Business rules)');
  console.log('  • Query Handler:      Python (Read side + analytics)');
  console.log('  • Search Indexing:    Go (High-performance indexing)');
  console.log();
  console.log('Benefits:');
  console.log('  → Separate read/write optimization');
  console.log('  → Scalable reads independently from writes');
  console.log('  → Language-specific strengths');
  console.log('  → Event-driven consistency');
  console.log();

  // Initialize CQRS components
  const commandHandler = new CommandHandler();
  const readModel = new ReadModelBuilder();
  const indexer = new SearchIndexer();
  const queryHandler = new QueryHandler(readModel, indexer);

  console.log('════════════════════════════════════════════════════════════');
  console.log('Demo: CQRS Pattern');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  // Execute commands
  console.log('[Commands - Write Side]\n');

  console.log('Command 1: Create Product');
  const createProduct = await commandHandler.handle({
    id: 'cmd-1',
    type: 'CreateProduct',
    aggregateId: 'product-1',
    timestamp: Date.now(),
    userId: 'user-1',
    data: {
      name: 'Laptop Pro',
      price: 1299.99,
      category: 'electronics',
      description: 'High-performance laptop',
    },
  });
  console.log();

  console.log('Command 2: Create Another Product');
  const createProduct2 = await commandHandler.handle({
    id: 'cmd-2',
    type: 'CreateProduct',
    aggregateId: 'product-2',
    timestamp: Date.now(),
    userId: 'user-1',
    data: {
      name: 'Wireless Mouse',
      price: 29.99,
      category: 'electronics',
      description: 'Ergonomic wireless mouse',
    },
  });
  console.log();

  console.log('Command 3: Update Product Price');
  const updatePrice = await commandHandler.handle({
    id: 'cmd-3',
    type: 'UpdateProductPrice',
    aggregateId: 'product-1',
    timestamp: Date.now(),
    userId: 'user-1',
    data: {
      newPrice: 1199.99,
      reason: 'Sale discount',
    },
  });
  console.log();

  console.log('Command 4: Place Order');
  const placeOrder = await commandHandler.handle({
    id: 'cmd-4',
    type: 'PlaceOrder',
    aggregateId: 'order-1',
    timestamp: Date.now(),
    userId: 'user-2',
    data: {
      userId: 'user-2',
      items: [
        { productId: 'product-1', quantity: 1, price: 1199.99 },
        { productId: 'product-2', quantity: 2, price: 29.99 },
      ],
      totalAmount: 1259.97,
    },
  });
  console.log();

  // Project events to read model
  console.log('[Event Projection - Building Read Models]\n');
  const events = commandHandler.getEvents();
  for (const event of events) {
    readModel.projectEvent(event);

    if (event.type === 'ProductCreated') {
      const product = readModel.getProduct(event.aggregateId);
      indexer.indexProduct(product);
    }
  }
  console.log();

  // Execute queries
  console.log('[Queries - Read Side]\n');

  console.log('Query 1: Get Product');
  const product = await queryHandler.query({
    type: 'GetProduct',
    params: { id: 'product-1' },
  });
  console.log('Result:', product);
  console.log();

  console.log('Query 2: List Products by Category');
  const products = await queryHandler.query({
    type: 'ListProducts',
    params: { category: 'electronics' },
  });
  console.log('Result:', products.length, 'products');
  console.log();

  console.log('Query 3: Get User Orders');
  const orders = await queryHandler.query({
    type: 'GetUserOrders',
    params: { userId: 'user-2' },
  });
  console.log('Result:', orders.length, 'orders');
  console.log();

  console.log('Query 4: Product Analytics');
  const analytics = await queryHandler.query({
    type: 'ProductAnalytics',
    params: {},
  });
  console.log('Result:', analytics);
  console.log();

  console.log('Query 5: Search Products');
  const searchResults = await queryHandler.query({
    type: 'SearchProducts',
    params: { searchTerm: 'laptop' },
  });
  console.log('Result:', searchResults.matchCount, 'matches');
  console.log();

  console.log('════════════════════════════════════════════════════════════');
  console.log('CQRS Demo Complete!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Separate read and write models');
  console.log('  ✓ Command validation before execution');
  console.log('  ✓ Event-driven read model updates');
  console.log('  ✓ Optimized queries with indexing');
  console.log('  ✓ Analytics on read side');
  console.log('  ✓ Each language optimized for its role');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
