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
