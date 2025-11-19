/**
 * E-Commerce Platform Load Testing & Performance Benchmarks
 *
 * Comprehensive performance testing suite featuring:
 * - Concurrent user simulation
 * - API endpoint benchmarking
 * - Database query performance
 * - Cart operations stress testing
 * - Checkout flow performance
 * - Payment processing load
 * - Inventory concurrency testing
 * - Analytics query optimization
 * - Memory and CPU profiling
 * - Response time tracking
 *
 * This demonstrates performance testing and optimization
 * for production e-commerce systems.
 */

import { Database } from '../backend/db/database.ts';
import { CartManager } from '../backend/services/cart-manager.ts';
import { CheckoutManager } from '../examples/complete-checkout-flow.ts';
import { AdvancedInventoryManager } from '../examples/inventory-management.ts';
import { AdminDashboard } from '../examples/admin-dashboard.ts';
import { v4 as uuidv4 } from '../shared/uuid.ts';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
  percentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
}

interface LoadTestResult {
  testName: string;
  concurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  averageResponseTime: number;
  requestsPerSecond: number;
  errors: string[];
}

// ============================================================================
// Benchmark Runner
// ============================================================================

class BenchmarkRunner {
  private results: BenchmarkResult[] = [];

  async runBenchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations: number = 1000
  ): Promise<BenchmarkResult> {
    console.log(`Running benchmark: ${name} (${iterations} iterations)...`);

    const times: number[] = [];
    let totalTime = 0;

    // Warm-up
    for (let i = 0; i < 10; i++) {
      await fn();
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const duration = performance.now() - start;

      times.push(duration);
      totalTime += duration;
    }

    // Calculate statistics
    times.sort((a, b) => a - b);

    const averageTime = totalTime / iterations;
    const minTime = times[0];
    const maxTime = times[times.length - 1];

    const p50 = times[Math.floor(iterations * 0.5)];
    const p95 = times[Math.floor(iterations * 0.95)];
    const p99 = times[Math.floor(iterations * 0.99)];

    const opsPerSecond = 1000 / averageTime;

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      opsPerSecond,
      percentiles: { p50, p95, p99 },
    };

    this.results.push(result);

    console.log(`  Average: ${averageTime.toFixed(2)}ms`);
    console.log(`  Ops/sec: ${opsPerSecond.toFixed(0)}`);
    console.log(`  P95: ${p95.toFixed(2)}ms`);
    console.log();

    return result;
  }

  getResults(): BenchmarkResult[] {
    return this.results;
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('BENCHMARK SUMMARY');
    console.log('='.repeat(80));

    for (const result of this.results) {
      console.log(`\n${result.name}:`);
      console.log(`  Iterations:     ${result.iterations}`);
      console.log(`  Average:        ${result.averageTime.toFixed(2)}ms`);
      console.log(`  Min:            ${result.minTime.toFixed(2)}ms`);
      console.log(`  Max:            ${result.maxTime.toFixed(2)}ms`);
      console.log(`  P50 (median):   ${result.percentiles.p50.toFixed(2)}ms`);
      console.log(`  P95:            ${result.percentiles.p95.toFixed(2)}ms`);
      console.log(`  P99:            ${result.percentiles.p99.toFixed(2)}ms`);
      console.log(`  Ops/sec:        ${result.opsPerSecond.toFixed(0)}`);
    }

    console.log('\n' + '='.repeat(80));
  }
}

// ============================================================================
// Load Test Runner
// ============================================================================

class LoadTestRunner {
  private results: LoadTestResult[] = [];

  async runLoadTest(
    testName: string,
    fn: () => Promise<boolean>,
    concurrentUsers: number,
    requestsPerUser: number
  ): Promise<LoadTestResult> {
    console.log(
      `Running load test: ${testName} (${concurrentUsers} users, ${requestsPerUser} req/user)...`
    );

    const totalRequests = concurrentUsers * requestsPerUser;
    let successfulRequests = 0;
    let failedRequests = 0;
    const errors: string[] = [];
    const responseTimes: number[] = [];

    const startTime = performance.now();

    // Create user tasks
    const userTasks = Array.from({ length: concurrentUsers }, async () => {
      for (let i = 0; i < requestsPerUser; i++) {
        const reqStart = performance.now();

        try {
          const success = await fn();
          const reqDuration = performance.now() - reqStart;

          responseTimes.push(reqDuration);

          if (success) {
            successfulRequests++;
          } else {
            failedRequests++;
          }
        } catch (error: any) {
          failedRequests++;
          errors.push(error.message);
          responseTimes.push(performance.now() - reqStart);
        }
      }
    });

    // Run all user tasks concurrently
    await Promise.all(userTasks);

    const totalDuration = performance.now() - startTime;
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const requestsPerSecond = (totalRequests / totalDuration) * 1000;

    const result: LoadTestResult = {
      testName,
      concurrentUsers,
      totalRequests,
      successfulRequests,
      failedRequests,
      totalDuration,
      averageResponseTime,
      requestsPerSecond,
      errors,
    };

    this.results.push(result);

    console.log(`  Total Duration: ${totalDuration.toFixed(0)}ms`);
    console.log(`  Successful:     ${successfulRequests}/${totalRequests}`);
    console.log(`  Failed:         ${failedRequests}`);
    console.log(`  Avg Response:   ${averageResponseTime.toFixed(2)}ms`);
    console.log(`  Req/sec:        ${requestsPerSecond.toFixed(0)}`);
    console.log();

    return result;
  }

  getResults(): LoadTestResult[] {
    return this.results;
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('LOAD TEST SUMMARY');
    console.log('='.repeat(80));

    for (const result of this.results) {
      console.log(`\n${result.testName}:`);
      console.log(`  Concurrent Users:      ${result.concurrentUsers}`);
      console.log(`  Total Requests:        ${result.totalRequests}`);
      console.log(`  Successful:            ${result.successfulRequests}`);
      console.log(`  Failed:                ${result.failedRequests}`);
      console.log(`  Total Duration:        ${result.totalDuration.toFixed(0)}ms`);
      console.log(`  Avg Response Time:     ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`  Requests/sec:          ${result.requestsPerSecond.toFixed(0)}`);

      if (result.errors.length > 0) {
        console.log(`  Errors (first 5):      ${result.errors.slice(0, 5).join(', ')}`);
      }
    }

    console.log('\n' + '='.repeat(80));
  }
}

// ============================================================================
// Benchmark Tests
// ============================================================================

async function runBenchmarks() {
  console.log('='.repeat(80));
  console.log('E-COMMERCE PLATFORM BENCHMARKS');
  console.log('='.repeat(80));
  console.log();

  const runner = new BenchmarkRunner();
  const db = new Database();
  const cartManager = new CartManager(db);
  const products = db.getProducts();

  // Database Operations
  await runner.runBenchmark('Get Product by ID', () => {
    db.getProduct(products[0].id);
  }, 10000);

  await runner.runBenchmark('List All Products', () => {
    db.getProducts();
  }, 1000);

  await runner.runBenchmark('Search Products', () => {
    db.searchProducts('laptop');
  }, 1000);

  await runner.runBenchmark('Create Product', () => {
    db.createProduct({
      name: 'Test Product',
      description: 'Test',
      price: 99.99,
      category: 'Test',
      stock: 100,
      sku: `TEST-${uuidv4()}`,
    });
  }, 1000);

  // Cart Operations
  const sessionId = uuidv4();
  await runner.runBenchmark('Add to Cart', () => {
    db.addToCart(sessionId, products[0].id, 1);
  }, 5000);

  await runner.runBenchmark('Get Cart Summary', () => {
    cartManager.getCartSummary(sessionId);
  }, 5000);

  await runner.runBenchmark('Validate Cart', () => {
    cartManager.validateCart(sessionId);
  }, 5000);

  // Wishlist Operations
  await runner.runBenchmark('Add to Wishlist', () => {
    cartManager.addToWishlist(sessionId, products[1].id);
  }, 5000);

  // Inventory Operations
  const inventoryManager = new AdvancedInventoryManager(db);

  await runner.runBenchmark('Get Product Inventory', () => {
    inventoryManager.getProductInventory(products[0].id);
  }, 5000);

  await runner.runBenchmark('Get Total Available Stock', () => {
    inventoryManager.getTotalAvailableStock(products[0].id);
  }, 5000);

  // Admin Operations
  const dashboard = new AdminDashboard(db);

  // Generate sample orders for dashboard
  for (let i = 0; i < 100; i++) {
    db.createOrder({
      customerId: `customer_${i % 20}`,
      items: [
        {
          productId: products[0].id,
          quantity: 1,
          price: products[0].price,
        },
      ],
      total: products[0].price,
      status: 'completed',
    });
  }

  await runner.runBenchmark('Get Dashboard Metrics', () => {
    dashboard.getDashboardMetrics();
  }, 1000);

  await runner.runBenchmark('Generate Sales Report', () => {
    dashboard.generateSalesReport('month');
  }, 1000);

  await runner.runBenchmark('Get Product Performance', () => {
    dashboard.getProductPerformance();
  }, 1000);

  runner.printSummary();

  return runner.getResults();
}

// ============================================================================
// Load Tests
// ============================================================================

async function runLoadTests() {
  console.log('\n' + '='.repeat(80));
  console.log('E-COMMERCE PLATFORM LOAD TESTS');
  console.log('='.repeat(80));
  console.log();

  const runner = new LoadTestRunner();
  const db = new Database();
  const products = db.getProducts();

  // Test 1: Product Browsing
  await runner.runLoadTest(
    'Product Browsing',
    async () => {
      db.getProducts();
      return true;
    },
    50, // 50 concurrent users
    20  // 20 requests per user
  );

  // Test 2: Cart Operations
  await runner.runLoadTest(
    'Cart Operations',
    async () => {
      const sessionId = uuidv4();
      db.addToCart(sessionId, products[0].id, 1);
      db.addToCart(sessionId, products[1].id, 2);
      db.getCart(sessionId);
      return true;
    },
    30, // 30 concurrent users
    10  // 10 requests per user
  );

  // Test 3: Checkout Flow
  await runner.runLoadTest(
    'Checkout Flow',
    async () => {
      const sessionId = uuidv4();
      const checkoutManager = new CheckoutManager(db);

      // Add items to cart
      db.addToCart(sessionId, products[0].id, 1);

      try {
        // Initialize checkout
        checkoutManager.createCheckoutSession(sessionId, 'test@example.com');

        // Set addresses
        checkoutManager.setShippingAddress(sessionId, {
          firstName: 'Test',
          lastName: 'User',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'CA',
          postalCode: '12345',
          country: 'US',
          phone: '555-0123',
        });

        checkoutManager.setBillingAddress(sessionId, {
          firstName: 'Test',
          lastName: 'User',
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'CA',
          postalCode: '12345',
          country: 'US',
          phone: '555-0123',
          sameAsShipping: true,
        });

        // Set shipping method
        checkoutManager.setShippingMethod(sessionId, 'standard');

        return true;
      } catch (error) {
        return false;
      }
    },
    10, // 10 concurrent users
    5   // 5 requests per user
  );

  // Test 4: Inventory Reservations
  await runner.runLoadTest(
    'Inventory Reservations',
    async () => {
      const inventoryManager = new AdvancedInventoryManager(db);

      try {
        const reservation = inventoryManager.reserveStock(products[0].id, 1);
        inventoryManager.releaseReservation(reservation.id);
        return true;
      } catch (error) {
        return false;
      }
    },
    20, // 20 concurrent users
    10  // 10 requests per user
  );

  // Test 5: Search Operations
  await runner.runLoadTest(
    'Product Search',
    async () => {
      db.searchProducts(['laptop', 'phone', 'tablet'][Math.floor(Math.random() * 3)]);
      return true;
    },
    40, // 40 concurrent users
    15  // 15 requests per user
  );

  runner.printSummary();

  return runner.getResults();
}

// ============================================================================
// Performance Monitoring
// ============================================================================

function monitorPerformance(): {
  memoryUsage: number;
  uptime: number;
} {
  let memoryUsage = 0;
  let uptime = 0;

  // Try to get Node.js process info if available
  if (typeof process !== 'undefined') {
    if (process.memoryUsage) {
      const mem = process.memoryUsage();
      memoryUsage = mem.heapUsed / 1024 / 1024; // MB
    }
    if (process.uptime) {
      uptime = process.uptime();
    }
  }

  return {
    memoryUsage,
    uptime,
  };
}

// ============================================================================
// Main Execution
// ============================================================================

export async function runPerformanceTests() {
  console.log('Starting performance tests...\n');

  const startMemory = monitorPerformance().memoryUsage;

  // Run benchmarks
  const benchmarkResults = await runBenchmarks();

  // Run load tests
  const loadTestResults = await runLoadTests();

  const endMemory = monitorPerformance().memoryUsage;

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nBenchmarks completed: ${benchmarkResults.length}`);
  console.log(`Load tests completed: ${loadTestResults.length}`);
  console.log(`Memory used: ${(endMemory - startMemory).toFixed(2)} MB`);

  console.log('\nKey Performance Indicators:');

  // Find fastest and slowest benchmarks
  const sortedBySpeed = [...benchmarkResults].sort(
    (a, b) => b.opsPerSecond - a.opsPerSecond
  );

  console.log(`\nFastest operation: ${sortedBySpeed[0].name}`);
  console.log(`  ${sortedBySpeed[0].opsPerSecond.toFixed(0)} ops/sec`);

  console.log(`\nSlowest operation: ${sortedBySpeed[sortedBySpeed.length - 1].name}`);
  console.log(`  ${sortedBySpeed[sortedBySpeed.length - 1].opsPerSecond.toFixed(0)} ops/sec`);

  // Load test summary
  const totalRequests = loadTestResults.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalSuccessful = loadTestResults.reduce((sum, r) => sum + r.successfulRequests, 0);
  const successRate = (totalSuccessful / totalRequests) * 100;

  console.log(`\nLoad Test Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${totalSuccessful}`);
  console.log(`Failed: ${totalRequests - totalSuccessful}`);

  console.log('\n' + '='.repeat(80));
  console.log('✓ PERFORMANCE TESTS COMPLETE');
  console.log('='.repeat(80));

  return {
    benchmarks: benchmarkResults,
    loadTests: loadTestResults,
    performance: {
      memoryUsed: endMemory - startMemory,
      successRate,
    },
  };
}

// Run tests if executed directly
if (import.meta.main) {
  runPerformanceTests().catch(console.error);
}
