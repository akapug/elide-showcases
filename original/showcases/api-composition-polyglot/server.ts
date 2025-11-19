/**
 * API Composition Polyglot
 *
 * Demonstrates API composition pattern where a composite API aggregates
 * data from multiple microservices in different languages:
 * - TypeScript: Composition layer
 * - Python: User service
 * - Go: Product service
 * - Java: Order service
 * - Ruby: Review service
 */

// Service clients
class UserServiceClient {
  async getUser(userId: string): Promise<any> {
    console.log(`  [Python] Fetching user: ${userId}`);
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      joinedAt: '2024-01-01',
    };
  }

  async getUserPreferences(userId: string): Promise<any> {
    console.log(`  [Python] Fetching user preferences: ${userId}`);
    return {
      theme: 'dark',
      language: 'en',
      notifications: true,
    };
  }
}

class ProductServiceClient {
  async getProduct(productId: string): Promise<any> {
    console.log(`  [Go] Fetching product: ${productId}`);
    return {
      id: productId,
      name: 'Awesome Product',
      price: 99.99,
      category: 'electronics',
      inStock: true,
    };
  }

  async getProductRecommendations(userId: string): Promise<any[]> {
    console.log(`  [Go] Fetching recommendations for: ${userId}`);
    return [
      { id: 'prod-1', score: 0.95 },
      { id: 'prod-2', score: 0.87 },
      { id: 'prod-3', score: 0.82 },
    ];
  }
}

class OrderServiceClient {
  async getOrders(userId: string): Promise<any[]> {
    console.log(`  [Java] Fetching orders for: ${userId}`);
    return [
      { id: 'order-1', total: 149.99, status: 'delivered', date: '2024-11-01' },
      { id: 'order-2', total: 79.99, status: 'shipped', date: '2024-11-10' },
    ];
  }

  async getOrderDetails(orderId: string): Promise<any> {
    console.log(`  [Java] Fetching order details: ${orderId}`);
    return {
      id: orderId,
      items: [
        { productId: 'prod-1', quantity: 2, price: 49.99 },
        { productId: 'prod-2', quantity: 1, price: 29.99 },
      ],
      total: 129.97,
      status: 'delivered',
    };
  }
}

class ReviewServiceClient {
  async getProductReviews(productId: string): Promise<any[]> {
    console.log(`  [Ruby] Fetching reviews for product: ${productId}`);
    return [
      { id: 'rev-1', rating: 5, comment: 'Excellent product!', userId: 'user-1' },
      { id: 'rev-2', rating: 4, comment: 'Good value', userId: 'user-2' },
    ];
  }

  async getUserReviews(userId: string): Promise<any[]> {
    console.log(`  [Ruby] Fetching reviews by user: ${userId}`);
    return [
      { id: 'rev-1', productId: 'prod-1', rating: 5, comment: 'Great!' },
    ];
  }
}

// API Composition Layer (TypeScript)
class APIComposer {
  constructor(
    private userService: UserServiceClient,
    private productService: ProductServiceClient,
    private orderService: OrderServiceClient,
    private reviewService: ReviewServiceClient
  ) {}

  // Composite API: User Dashboard
  async getUserDashboard(userId: string): Promise<any> {
    console.log(`[Composer] Building user dashboard for: ${userId}\n`);

    // Fetch data in parallel
    const [user, preferences, orders, reviews] = await Promise.all([
      this.userService.getUser(userId),
      this.userService.getUserPreferences(userId),
      this.orderService.getOrders(userId),
      this.reviewService.getUserReviews(userId),
    ]);

    console.log();

    return {
      user: { ...user, preferences },
      recentOrders: orders,
      recentReviews: reviews,
      stats: {
        totalOrders: orders.length,
        totalReviews: reviews.length,
        totalSpent: orders.reduce((sum: number, o: any) => sum + o.total, 0),
      },
    };
  }

  // Composite API: Product Page
  async getProductPage(productId: string, userId?: string): Promise<any> {
    console.log(`[Composer] Building product page for: ${productId}\n`);

    // Fetch product and reviews in parallel
    const [product, reviews] = await Promise.all([
      this.productService.getProduct(productId),
      this.reviewService.getProductReviews(productId),
    ]);

    // Optionally fetch recommendations if user is logged in
    let recommendations = [];
    if (userId) {
      recommendations = await this.productService.getProductRecommendations(userId);
    }

    console.log();

    return {
      product,
      reviews: {
        items: reviews,
        averageRating: reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length,
        totalCount: reviews.length,
      },
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  // Composite API: Order Summary
  async getOrderSummary(orderId: string): Promise<any> {
    console.log(`[Composer] Building order summary for: ${orderId}\n`);

    // Fetch order details
    const order = await this.orderService.getOrderDetails(orderId);

    // Fetch product details for each item
    const productPromises = order.items.map((item: any) =>
      this.productService.getProduct(item.productId)
    );
    const products = await Promise.all(productPromises);

    console.log();

    // Enrich order items with product details
    const enrichedItems = order.items.map((item: any, index: number) => ({
      ...item,
      product: products[index],
    }));

    return {
      order: {
        ...order,
        items: enrichedItems,
      },
    };
  }

  // Composite API: Search Results with multiple data sources
  async searchProducts(query: string, userId?: string): Promise<any> {
    console.log(`[Composer] Searching products: "${query}"\n`);

    // In a real system, this would query the product service
    const products = [
      await this.productService.getProduct('prod-1'),
      await this.productService.getProduct('prod-2'),
    ];

    // Fetch reviews for each product
    const reviewPromises = products.map(p => this.reviewService.getProductReviews(p.id));
    const reviewsPerProduct = await Promise.all(reviewPromises);

    console.log();

    // Combine product and review data
    const enrichedProducts = products.map((product, index) => {
      const reviews = reviewsPerProduct[index];
      return {
        ...product,
        reviewCount: reviews.length,
        averageRating: reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
          : 0,
      };
    });

    return {
      query,
      results: enrichedProducts,
      totalResults: enrichedProducts.length,
    };
  }
}

export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║    API Composition Polyglot - Elide Showcase            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('API Composition Architecture:');
  console.log('  • Composition Layer:  TypeScript');
  console.log('  • User Service:       Python');
  console.log('  • Product Service:    Go');
  console.log('  • Order Service:      Java');
  console.log('  • Review Service:     Ruby');
  console.log();
  console.log('Benefits:');
  console.log('  → Single API for complex queries');
  console.log('  → Parallel data fetching');
  console.log('  → Service coordination');
  console.log('  → Reduced client complexity');
  console.log();

  const composer = new APIComposer(
    new UserServiceClient(),
    new ProductServiceClient(),
    new OrderServiceClient(),
    new ReviewServiceClient()
  );

  console.log('════════════════════════════════════════════════════════════');
  console.log('Demo: Composite APIs');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  // Example 1: User Dashboard
  console.log('[Example 1] User Dashboard (Aggregates multiple services)\n');
  const dashboard = await composer.getUserDashboard('user-123');
  console.log('Dashboard Data:');
  console.log(`  User: ${dashboard.user.name}`);
  console.log(`  Recent Orders: ${dashboard.recentOrders.length}`);
  console.log(`  Recent Reviews: ${dashboard.recentReviews.length}`);
  console.log(`  Total Spent: $${dashboard.stats.totalSpent}`);
  console.log();

  // Example 2: Product Page
  console.log('[Example 2] Product Page (Product + Reviews + Recommendations)\n');
  const productPage = await composer.getProductPage('prod-1', 'user-123');
  console.log('Product Page Data:');
  console.log(`  Product: ${productPage.product.name}`);
  console.log(`  Average Rating: ${productPage.reviews.averageRating.toFixed(1)}/5`);
  console.log(`  Total Reviews: ${productPage.reviews.totalCount}`);
  console.log(`  Recommendations: ${productPage.recommendations?.length || 0}`);
  console.log();

  // Example 3: Order Summary
  console.log('[Example 3] Order Summary (Order + Product Details)\n');
  const orderSummary = await composer.getOrderSummary('order-1');
  console.log('Order Summary:');
  console.log(`  Order ID: ${orderSummary.order.id}`);
  console.log(`  Items: ${orderSummary.order.items.length}`);
  console.log(`  Total: $${orderSummary.order.total}`);
  console.log('  Items with product details:');
  for (const item of orderSummary.order.items) {
    console.log(`    - ${item.product.name} (${item.quantity}x $${item.price})`);
  }
  console.log();

  // Example 4: Search Results
  console.log('[Example 4] Search Results (Products + Reviews)\n');
  const searchResults = await composer.searchProducts('electronics', 'user-123');
  console.log('Search Results:');
  console.log(`  Query: "${searchResults.query}"`);
  console.log(`  Found: ${searchResults.totalResults} products`);
  for (const product of searchResults.results) {
    console.log(`    - ${product.name}: ${product.averageRating.toFixed(1)}/5 (${product.reviewCount} reviews)`);
  }
  console.log();

  console.log('════════════════════════════════════════════════════════════');
  console.log('API Composition Demo Complete!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Single API endpoint for complex data');
  console.log('  ✓ Parallel service calls for performance');
  console.log('  ✓ Data enrichment and aggregation');
  console.log('  ✓ Reduced client complexity');
  console.log('  ✓ Language-specific service implementations');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
