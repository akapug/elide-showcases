/**
 * Backend-for-Frontend (BFF) Polyglot
 *
 * Demonstrates BFF pattern with different backends optimized for
 * different frontend clients:
 * - TypeScript: Web BFF
 * - Swift/Kotlin: Mobile BFF (simulated in TypeScript)
 * - Go: IoT/Embedded BFF
 * - Python: Admin Dashboard BFF
 *
 * Each BFF tailors APIs to specific client needs.
 */

// Shared backend services
class BackendServices {
  async getUserData(userId: string): Promise<any> {
    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://example.com/avatar.jpg',
      preferences: { theme: 'dark', notifications: true },
      stats: { followers: 150, following: 200 },
    };
  }

  async getProducts(filters?: any): Promise<any[]> {
    return [
      { id: 'p1', name: 'Product 1', price: 29.99, image: 'https://example.com/p1.jpg', description: 'Great product with many features and benefits' },
      { id: 'p2', name: 'Product 2', price: 49.99, image: 'https://example.com/p2.jpg', description: 'Another excellent product' },
      { id: 'p3', name: 'Product 3', price: 99.99, image: 'https://example.com/p3.jpg', description: 'Premium quality product' },
    ];
  }

  async getOrders(userId: string): Promise<any[]> {
    return [
      { id: 'o1', date: '2024-11-01', total: 79.98, status: 'delivered', items: 2 },
      { id: 'o2', date: '2024-11-10', total: 49.99, status: 'shipped', items: 1 },
    ];
  }

  async getAnalytics(): Promise<any> {
    return {
      users: { total: 10000, active: 5000, new: 500 },
      orders: { total: 50000, pending: 100, revenue: 250000 },
      products: { total: 500, outOfStock: 20 },
    };
  }
}

// Web BFF (TypeScript) - Optimized for web browsers
class WebBFF {
  constructor(private backend: BackendServices) {}

  async getHomePage(userId?: string): Promise<any> {
    console.log('  [TypeScript Web BFF] Building home page');

    const products = await this.backend.getProducts();
    let userData = null;

    if (userId) {
      userData = await this.backend.getUserData(userId);
    }

    // Web-optimized response (full data, SEO-friendly)
    return {
      meta: {
        title: 'Home - My Store',
        description: 'Welcome to our store',
        canonical: 'https://example.com/',
      },
      user: userData ? {
        name: userData.name,
        avatar: userData.avatar,
      } : null,
      hero: {
        title: 'Welcome to Our Store',
        subtitle: 'Find amazing products',
        cta: { text: 'Shop Now', link: '/products' },
      },
      featuredProducts: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        description: p.description, // Full description for web
      })),
      layout: 'grid', // Web prefers grid layout
    };
  }

  async getUserProfile(userId: string): Promise<any> {
    console.log('  [TypeScript Web BFF] Building user profile');

    const [userData, orders] = await Promise.all([
      this.backend.getUserData(userId),
      this.backend.getOrders(userId),
    ]);

    // Web-optimized profile (rich data for complex UI)
    return {
      meta: {
        title: `${userData.name}'s Profile`,
        description: `View ${userData.name}'s profile`,
      },
      user: {
        ...userData,
        badges: ['Verified Buyer', 'Top Reviewer'],
      },
      recentOrders: orders.map(o => ({
        ...o,
        formattedDate: new Date(o.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      })),
      sections: ['overview', 'orders', 'reviews', 'settings'],
    };
  }
}

// Mobile BFF (Swift/Kotlin-style, simulated in TypeScript)
class MobileBFF {
  constructor(private backend: BackendServices) {}

  async getHomePage(userId?: string): Promise<any> {
    console.log('  [Mobile BFF] Building home page (optimized for mobile)');

    const products = await this.backend.getProducts();
    let userData = null;

    if (userId) {
      userData = await this.backend.getUserData(userId);
    }

    // Mobile-optimized response (minimal data, smaller payloads)
    return {
      user: userData ? {
        id: userData.id,
        name: userData.name,
        avatar: userData.avatar, // Smaller avatar for mobile
      } : null,
      hero: {
        title: 'My Store', // Shorter title for mobile
        cta: '/products',
      },
      featuredProducts: products.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        thumbnail: p.image, // Use thumbnail instead of full image
        // Omit description to reduce payload
      })),
      layout: 'list', // Mobile prefers list layout
      prefetchUrls: ['/products', '/cart'], // Help with navigation
    };
  }

  async getUserProfile(userId: string): Promise<any> {
    console.log('  [Mobile BFF] Building user profile (minimal payload)');

    const [userData, orders] = await Promise.all([
      this.backend.getUserData(userId),
      this.backend.getOrders(userId),
    ]);

    // Mobile-optimized profile (minimal data)
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      stats: userData.stats,
      recentOrders: orders.slice(0, 3).map(o => ({
        id: o.id,
        date: o.date, // Simple date string for mobile
        total: o.total,
        status: o.status,
      })),
      // Paginated data to reduce initial load
      hasMoreOrders: orders.length > 3,
    };
  }
}

// IoT BFF (Go-style, simulated in TypeScript)
class IoTBFF {
  constructor(private backend: BackendServices) {}

  async getDeviceStatus(deviceId: string): Promise<any> {
    console.log('  [Go IoT BFF] Getting device status (ultra-minimal)');

    // IoT devices need minimal, compact data
    return {
      id: deviceId,
      status: 'online',
      battery: 85,
      lastSync: Date.now(),
      // Ultra-compact format for constrained devices
    };
  }

  async getProductAvailability(productIds: string[]): Promise<any> {
    console.log('  [Go IoT BFF] Checking product availability');

    // For smart displays, vending machines, etc.
    const products = await this.backend.getProducts();

    return {
      items: productIds.map(id => {
        const product = products.find(p => p.id === id);
        return {
          id,
          available: !!product,
          price: product?.price,
          // Minimal data for IoT displays
        };
      }),
      timestamp: Date.now(),
    };
  }

  async recordPurchase(deviceId: string, productId: string): Promise<any> {
    console.log('  [Go IoT BFF] Recording IoT purchase');

    // Optimized for quick transactions
    return {
      ok: true,
      txId: `txn-${Date.now()}`,
      // Minimal response for fast processing
    };
  }
}

// Admin Dashboard BFF (Python-style, simulated in TypeScript)
class AdminBFF {
  constructor(private backend: BackendServices) {}

  async getDashboard(): Promise<any> {
    console.log('  [Python Admin BFF] Building analytics dashboard');

    const analytics = await this.backend.getAnalytics();

    // Admin-optimized response (rich analytics, complex aggregations)
    return {
      summary: {
        users: {
          total: analytics.users.total,
          active: analytics.users.active,
          new: analytics.users.new,
          growthRate: ((analytics.users.new / analytics.users.total) * 100).toFixed(2) + '%',
        },
        orders: {
          total: analytics.orders.total,
          pending: analytics.orders.pending,
          revenue: `$${analytics.orders.revenue.toLocaleString()}`,
          averageOrderValue: `$${(analytics.orders.revenue / analytics.orders.total).toFixed(2)}`,
        },
        products: {
          total: analytics.products.total,
          outOfStock: analytics.products.outOfStock,
          stockRate: ((1 - analytics.products.outOfStock / analytics.products.total) * 100).toFixed(1) + '%',
        },
      },
      charts: {
        revenue: { type: 'line', data: [10000, 15000, 20000, 25000] },
        orders: { type: 'bar', data: [100, 150, 200, 250] },
        users: { type: 'area', data: [500, 750, 1000, 1250] },
      },
      recentActivity: [
        { type: 'order', message: 'New order #12345', timestamp: Date.now() - 60000 },
        { type: 'user', message: 'New user registered', timestamp: Date.now() - 120000 },
      ],
      alerts: [
        { level: 'warning', message: '20 products out of stock' },
        { level: 'info', message: '100 pending orders' },
      ],
    };
  }

  async getDetailedReport(reportType: string): Promise<any> {
    console.log(`  [Python Admin BFF] Generating ${reportType} report`);

    // Complex data processing and aggregation
    return {
      reportType,
      generatedAt: new Date().toISOString(),
      data: {
        // Rich, detailed data for admin analysis
        aggregations: { /* complex aggregations */ },
        timeSeries: { /* time series data */ },
        breakdowns: { /* detailed breakdowns */ },
      },
      exportFormats: ['pdf', 'excel', 'csv'],
    };
  }
}

export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║    Backend-for-Frontend Polyglot - Elide Showcase      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('BFF Architecture:');
  console.log('  • Web BFF:     TypeScript (Rich UI data)');
  console.log('  • Mobile BFF:  Swift/Kotlin (Minimal payloads)');
  console.log('  • IoT BFF:     Go (Ultra-compact data)');
  console.log('  • Admin BFF:   Python (Complex analytics)');
  console.log();
  console.log('Benefits:');
  console.log('  → Client-optimized APIs');
  console.log('  → Reduced payload sizes');
  console.log('  → Platform-specific features');
  console.log('  → Independent evolution');
  console.log();

  const backend = new BackendServices();
  const webBFF = new WebBFF(backend);
  const mobileBFF = new MobileBFF(backend);
  const iotBFF = new IoTBFF(backend);
  const adminBFF = new AdminBFF(backend);

  console.log('════════════════════════════════════════════════════════════');
  console.log('Demo: Different BFFs for Different Clients');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  // Web BFF
  console.log('[Example 1] Web BFF - Home Page\n');
  const webHome = await webBFF.getHomePage('user-1');
  console.log('Web Response:');
  console.log(`  Title: ${webHome.meta.title}`);
  console.log(`  Featured Products: ${webHome.featuredProducts.length}`);
  console.log(`  Layout: ${webHome.layout}`);
  console.log(`  Payload size: ~${JSON.stringify(webHome).length} bytes`);
  console.log();

  // Mobile BFF
  console.log('[Example 2] Mobile BFF - Home Page\n');
  const mobileHome = await mobileBFF.getHomePage('user-1');
  console.log('Mobile Response:');
  console.log(`  Featured Products: ${mobileHome.featuredProducts.length}`);
  console.log(`  Layout: ${mobileHome.layout}`);
  console.log(`  Payload size: ~${JSON.stringify(mobileHome).length} bytes (smaller!)`);
  console.log();

  // IoT BFF
  console.log('[Example 3] IoT BFF - Device Status\n');
  const iotStatus = await iotBFF.getDeviceStatus('device-123');
  console.log('IoT Response:');
  console.log(`  Status: ${iotStatus.status}`);
  console.log(`  Battery: ${iotStatus.battery}%`);
  console.log(`  Payload size: ~${JSON.stringify(iotStatus).length} bytes (minimal!)`);
  console.log();

  // Admin BFF
  console.log('[Example 4] Admin BFF - Dashboard\n');
  const adminDashboard = await adminBFF.getDashboard();
  console.log('Admin Response:');
  console.log(`  Users: ${adminDashboard.summary.users.total}`);
  console.log(`  Revenue: ${adminDashboard.summary.orders.revenue}`);
  console.log(`  Charts: ${Object.keys(adminDashboard.charts).length}`);
  console.log(`  Alerts: ${adminDashboard.alerts.length}`);
  console.log(`  Payload size: ~${JSON.stringify(adminDashboard).length} bytes (comprehensive!)`);
  console.log();

  console.log('════════════════════════════════════════════════════════════');
  console.log('BFF Pattern Demo Complete!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Web: Rich data for complex UI');
  console.log('  ✓ Mobile: Minimal payloads for bandwidth efficiency');
  console.log('  ✓ IoT: Ultra-compact for constrained devices');
  console.log('  ✓ Admin: Comprehensive data for analytics');
  console.log('  ✓ Each BFF optimized for its client');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
