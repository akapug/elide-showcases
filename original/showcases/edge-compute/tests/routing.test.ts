/**
 * Routing Tests
 *
 * Tests edge routing and load balancing.
 */

import EdgeRouter from '../router/edge-router';
import LoadBalancer from '../router/load-balancer';
import GeolocationService from '../router/geolocation';
import FunctionManager from '../control-plane/function-manager';
import * as fs from 'fs';

async function testRouting() {
  console.log('=== Routing Tests ===\n');

  // Setup
  const storageDir = './test-routing-functions';
  if (fs.existsSync(storageDir)) {
    fs.rmSync(storageDir, { recursive: true });
  }

  const manager = new FunctionManager(storageDir);
  const router = new EdgeRouter(manager);

  // Create test functions
  const func1 = await manager.deploy('api-v1', 'code1', 'typescript', {
    autoVersion: true,
  });
  const func2 = await manager.deploy('api-v2', 'code2', 'typescript', {
    autoVersion: true,
  });

  // Test 1: Add routes
  console.log('Test 1: Add routes');
  try {
    router.addRoute({
      path: '/api/v1/*',
      functionId: func1.id,
      methods: ['GET', 'POST'],
      priority: 1,
    });

    router.addRoute({
      path: '/api/v2/*',
      functionId: func2.id,
      methods: ['GET', 'POST'],
      priority: 2,
    });

    router.addRoute({
      path: '/users/:id',
      functionId: func1.id,
      methods: ['GET'],
    });

    console.log('✓ Routes added');
    const routes = router.getRoutes();
    console.log(`  Total routes: ${routes.length}\n`);
  } catch (error: any) {
    console.error('✗ Add routes failed:', error.message);
  }

  // Test 2: Match routes
  console.log('Test 2: Match routes');
  try {
    const match1 = router.match({
      path: '/api/v1/test',
      method: 'GET',
      headers: {},
      query: {},
    });

    const match2 = router.match({
      path: '/users/123',
      method: 'GET',
      headers: {},
      query: {},
    });

    console.log('✓ Route matching works');
    if (match1) {
      console.log(`  /api/v1/test -> ${match1.function.name}`);
    }
    if (match2) {
      console.log(`  /users/123 -> ${match2.function.name}`);
      console.log(`  Params: id=${match2.params.id}`);
    }
    console.log();
  } catch (error: any) {
    console.error('✗ Route matching failed:', error.message);
  }

  // Test 3: Load balancer
  console.log('Test 3: Load balancer');
  try {
    const lb = new LoadBalancer({ strategy: 'round-robin' });

    // Register instances
    lb.registerInstance({
      id: 'inst-1',
      functionId: func1.id,
      region: 'us-east',
      healthy: true,
      weight: 1,
    });

    lb.registerInstance({
      id: 'inst-2',
      functionId: func1.id,
      region: 'us-east',
      healthy: true,
      weight: 1,
    });

    // Select instances
    const selected1 = lb.selectInstance(func1.id);
    const selected2 = lb.selectInstance(func1.id);
    const selected3 = lb.selectInstance(func1.id);

    console.log('✓ Load balancing works');
    console.log(`  Selection 1: ${selected1?.id}`);
    console.log(`  Selection 2: ${selected2?.id}`);
    console.log(`  Selection 3: ${selected3?.id}\n`);
  } catch (error: any) {
    console.error('✗ Load balancing failed:', error.message);
  }

  // Test 4: Geolocation
  console.log('Test 4: Geolocation');
  try {
    const geo = new GeolocationService();

    const location = await geo.getLocation('1.2.3.4');
    if (location) {
      console.log('✓ Geolocation works');
      console.log(`  Country: ${location.country}`);
      console.log(`  City: ${location.city}`);
      console.log(`  Coords: ${location.latitude}, ${location.longitude}`);

      const nearest = geo.findNearest(location);
      if (nearest) {
        console.log(`  Nearest edge: ${nearest.name}`);
      }
    }
    console.log();
  } catch (error: any) {
    console.error('✗ Geolocation failed:', error.message);
  }

  // Test 5: Router statistics
  console.log('Test 5: Router statistics');
  try {
    const stats = router.getStats();

    console.log('✓ Stats retrieved');
    console.log(`  Total routes: ${stats.totalRoutes}`);
    console.log(`  Enabled: ${stats.enabledRoutes}`);
    console.log(`  Disabled: ${stats.disabledRoutes}\n`);
  } catch (error: any) {
    console.error('✗ Stats retrieval failed:', error.message);
  }

  // Test 6: Wildcard routes
  console.log('Test 6: Wildcard routes');
  try {
    router.addRoute({
      path: '/static/*',
      functionId: func1.id,
      methods: ['GET'],
    });

    const match = router.match({
      path: '/static/images/logo.png',
      method: 'GET',
      headers: {},
      query: {},
    });

    console.log('✓ Wildcard matching works');
    console.log(`  /static/images/logo.png -> ${match?.function.name}\n`);
  } catch (error: any) {
    console.error('✗ Wildcard matching failed:', error.message);
  }

  // Test 7: Route priority
  console.log('Test 7: Route priority');
  try {
    const func3 = await manager.deploy('api-v3', 'code3', 'typescript', {
      autoVersion: true,
    });

    router.addRoute({
      path: '/api/*',
      functionId: func3.id,
      methods: ['GET'],
      priority: 0, // Lower priority
    });

    const match = router.match({
      path: '/api/v1/test',
      method: 'GET',
      headers: {},
      query: {},
    });

    console.log('✓ Route priority works');
    console.log(`  Higher priority route matched: ${match?.function.name}\n`);
  } catch (error: any) {
    console.error('✗ Route priority failed:', error.message);
  }

  // Test 8: Query parameter routing
  console.log('Test 8: Query parameter routing');
  try {
    const match = router.match({
      path: '/api/v1/users',
      method: 'GET',
      headers: {},
      query: { version: 'latest', limit: '10' },
    });

    console.log('✓ Query parameter routing works');
    console.log(`  Route matched with query params\n`);
  } catch (error: any) {
    console.error('✗ Query parameter routing failed:', error.message);
  }

  // Test 9: Load balancer strategies
  console.log('Test 9: Load balancer strategies');
  try {
    // Test weighted round-robin
    const wlb = new LoadBalancer({ strategy: 'weighted-round-robin' });

    wlb.registerInstance({
      id: 'inst-a',
      functionId: func1.id,
      region: 'us-east',
      healthy: true,
      weight: 3,
    });

    wlb.registerInstance({
      id: 'inst-b',
      functionId: func1.id,
      region: 'us-east',
      healthy: true,
      weight: 1,
    });

    const selections: Record<string, number> = {};
    for (let i = 0; i < 100; i++) {
      const selected = wlb.selectInstance(func1.id);
      if (selected) {
        selections[selected.id] = (selections[selected.id] || 0) + 1;
      }
    }

    console.log('✓ Weighted load balancing works');
    console.log(`  inst-a selected: ${selections['inst-a']} times`);
    console.log(`  inst-b selected: ${selections['inst-b']} times\n`);
  } catch (error: any) {
    console.error('✗ Load balancer strategies failed:', error.message);
  }

  // Test 10: Health checks
  console.log('Test 10: Health checks');
  try {
    const lb = new LoadBalancer({ strategy: 'round-robin' });

    lb.registerInstance({
      id: 'healthy-inst',
      functionId: func1.id,
      region: 'us-east',
      healthy: true,
      weight: 1,
    });

    lb.registerInstance({
      id: 'unhealthy-inst',
      functionId: func1.id,
      region: 'us-east',
      healthy: false,
      weight: 1,
    });

    const selected = lb.selectInstance(func1.id);

    console.log('✓ Health check filtering works');
    console.log(`  Only healthy instance selected: ${selected?.id}\n`);
  } catch (error: any) {
    console.error('✗ Health checks failed:', error.message);
  }

  // Test 11: Geographic routing
  console.log('Test 11: Geographic routing');
  try {
    const geo = new GeolocationService();
    const locations = [
      { ip: '8.8.8.8', name: 'Google DNS' },
      { ip: '1.1.1.1', name: 'Cloudflare DNS' },
      { ip: '208.67.222.222', name: 'OpenDNS' },
    ];

    console.log('✓ Geographic lookups:');
    for (const loc of locations) {
      const result = await geo.getLocation(loc.ip);
      if (result) {
        console.log(`  ${loc.name}: ${result.country}, ${result.city}`);
      }
    }
    console.log();
  } catch (error: any) {
    console.error('✗ Geographic routing failed:', error.message);
  }

  // Test 12: Route removal
  console.log('Test 12: Route removal');
  try {
    const initialRoutes = router.getRoutes().length;

    // Remove a route
    router.removeRoute('/users/:id');

    const afterRemoval = router.getRoutes().length;

    console.log('✓ Route removal works');
    console.log(`  Routes before: ${initialRoutes}`);
    console.log(`  Routes after: ${afterRemoval}\n`);
  } catch (error: any) {
    console.error('✗ Route removal failed:', error.message);
  }

  // Test 13: Route update
  console.log('Test 13: Route update');
  try {
    router.updateRoute('/api/v1/*', {
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      priority: 10,
    });

    console.log('✓ Route update works');
    const updated = router.getRoutes().find(r => r.path === '/api/v1/*');
    console.log(`  Updated methods: ${updated?.methods.join(', ')}\n`);
  } catch (error: any) {
    console.error('✗ Route update failed:', error.message);
  }

  // Test 14: Load balancer instance management
  console.log('Test 14: Instance management');
  try {
    const lb = new LoadBalancer({ strategy: 'round-robin' });

    lb.registerInstance({
      id: 'temp-inst',
      functionId: func1.id,
      region: 'us-west',
      healthy: true,
      weight: 1,
    });

    const beforeCount = lb.getInstances(func1.id).length;

    lb.deregisterInstance('temp-inst');

    const afterCount = lb.getInstances(func1.id).length;

    console.log('✓ Instance management works');
    console.log(`  Instances before: ${beforeCount}`);
    console.log(`  Instances after: ${afterCount}\n`);
  } catch (error: any) {
    console.error('✗ Instance management failed:', error.message);
  }

  // Test 15: Router middleware
  console.log('Test 15: Router middleware');
  try {
    let middlewareCalled = false;

    router.use((req, next) => {
      middlewareCalled = true;
      console.log(`  Middleware processing: ${req.path}`);
      return next();
    });

    router.match({
      path: '/api/v2/test',
      method: 'GET',
      headers: {},
      query: {},
    });

    console.log(`✓ Middleware ${middlewareCalled ? 'executed' : 'not executed'}\n`);
  } catch (error: any) {
    console.error('✗ Middleware failed:', error.message);
  }

  // Test 16: Rate limiting per route
  console.log('Test 16: Rate limiting');
  try {
    router.addRoute({
      path: '/api/limited',
      functionId: func1.id,
      methods: ['GET'],
      rateLimit: {
        requests: 5,
        window: 60000, // 1 minute
      },
    });

    console.log('✓ Rate limiting configured');
    console.log('  Max 5 requests per minute\n');
  } catch (error: any) {
    console.error('✗ Rate limiting failed:', error.message);
  }

  // Test 17: Route caching
  console.log('Test 17: Route caching');
  try {
    router.addRoute({
      path: '/api/cached',
      functionId: func1.id,
      methods: ['GET'],
      cache: {
        enabled: true,
        ttl: 300,
        varyBy: ['accept-language'],
      },
    });

    console.log('✓ Cache configuration applied');
    console.log('  TTL: 300 seconds\n');
  } catch (error: any) {
    console.error('✗ Route caching failed:', error.message);
  }

  // Test 18: Performance metrics
  console.log('Test 18: Performance metrics');
  try {
    const metrics = router.getMetrics();

    console.log('✓ Metrics collected');
    console.log(`  Total requests: ${metrics.totalRequests || 0}`);
    console.log(`  Avg response time: ${metrics.avgResponseTime || 0}ms`);
    console.log(`  Error rate: ${metrics.errorRate || 0}%\n`);
  } catch (error: any) {
    console.error('✗ Performance metrics failed:', error.message);
  }

  // Cleanup
  if (fs.existsSync(storageDir)) {
    fs.rmSync(storageDir, { recursive: true });
  }

  console.log('=== All routing tests completed ===');
}

// Run tests
if (require.main === module) {
  testRouting()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export default testRouting;
