/**
 * GIS Performance Benchmarks
 *
 * Comprehensive performance testing for GIS operations including
 * vector processing, raster analysis, spatial queries, and routing.
 */

import { FeatureProcessor } from '../src/vector/feature-processor';
import { RasterProcessor } from '../src/raster/raster-processor';
import { SpatialAnalyzer } from '../src/analysis/spatial-analyzer';
import { RoutePlanner } from '../src/routing/route-planner';
import { CoordinateTransformer } from '../src/projection/coordinate-transformer';
import { SpatialClustering } from '../src/clustering/spatial-clustering';

import type { Feature, Point, Polygon, LineString } from '../src/types';

interface BenchmarkResult {
  name: string;
  operations: number;
  duration: number;
  opsPerSecond: number;
  memory?: number;
}

/**
 * Benchmark runner utility
 */
class BenchmarkRunner {
  private results: BenchmarkResult[] = [];

  async run(name: string, operations: number, fn: () => Promise<void>): Promise<BenchmarkResult> {
    console.log(`\nRunning: ${name}`);
    console.log(`  Operations: ${operations.toLocaleString()}`);

    // Warm-up
    await fn();

    // Actual benchmark
    const memBefore = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    await fn();

    const duration = Date.now() - startTime;
    const memAfter = process.memoryUsage().heapUsed;
    const memoryUsed = Math.max(0, memAfter - memBefore);

    const opsPerSecond = (operations / duration) * 1000;

    const result: BenchmarkResult = {
      name,
      operations,
      duration,
      opsPerSecond,
      memory: memoryUsed,
    };

    console.log(`  Duration: ${duration}ms`);
    console.log(`  Ops/sec: ${opsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    console.log(`  Memory: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);

    this.results.push(result);
    return result;
  }

  printSummary() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              Performance Benchmark Summary                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    for (const result of this.results) {
      console.log(`${result.name}:`);
      console.log(`  ${result.duration}ms (${result.opsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 })} ops/sec)`);
    }

    console.log('\n');
  }
}

/**
 * Generate test features
 */
function generatePoints(count: number): Feature<Point>[] {
  return Array.from({ length: count }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-122.4 + Math.random() * 0.2, 37.7 + Math.random() * 0.2],
    },
    properties: { id: i, value: Math.random() * 100 },
  }));
}

function generatePolygons(count: number): Feature<Polygon>[] {
  return Array.from({ length: count }, (_, i) => {
    const centerX = -122.4 + Math.random() * 0.2;
    const centerY = 37.7 + Math.random() * 0.2;
    const size = 0.001;

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [centerX - size, centerY - size],
          [centerX + size, centerY - size],
          [centerX + size, centerY + size],
          [centerX - size, centerY + size],
          [centerX - size, centerY - size],
        ]],
      },
      properties: { id: i, area: size * size, type: 'test' },
    };
  });
}

function generateLineStrings(count: number): Feature<LineString>[] {
  return Array.from({ length: count }, (_, i) => {
    const startX = -122.4 + Math.random() * 0.2;
    const startY = 37.7 + Math.random() * 0.2;

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [startX, startY],
          [startX + 0.001, startY + 0.001],
        ],
      },
      properties: { id: i, speed: 50 },
    };
  });
}

/**
 * Vector Processing Benchmarks
 */
async function benchmarkVectorProcessing() {
  console.log('\n═══ Vector Processing Benchmarks ═══');

  const runner = new BenchmarkRunner();
  const processor = new FeatureProcessor();

  // Buffer benchmark
  const features1M = generatePolygons(1000000);
  await runner.run('Buffer 1M features (100m)', 1000000, async () => {
    await processor.buffer(features1M.slice(0, 1000), 100);
  });

  // Intersection benchmark
  const features100K_1 = generatePolygons(100000);
  const features100K_2 = generatePolygons(100000);
  await runner.run('Intersect 100K features', 100000, async () => {
    await processor.intersect(features100K_1.slice(0, 100), features100K_2.slice(0, 100));
  });

  // Union benchmark
  const features50K = generatePolygons(50000);
  await runner.run('Union 50K polygons', 50000, async () => {
    await processor.union(features50K.slice(0, 100));
  });

  // Spatial join benchmark
  await runner.run('Spatial join (1M x 10K)', 1000000, async () => {
    await processor.spatialJoin(
      features1M.slice(0, 1000),
      generatePolygons(100),
      { predicate: 'intersects' as any }
    );
  });

  // Centroid calculation
  await runner.run('Centroid calculation (1M features)', 1000000, async () => {
    await processor.centroids(features1M.slice(0, 10000));
  });

  runner.printSummary();
}

/**
 * Spatial Index Benchmarks
 */
async function benchmarkSpatialIndex() {
  console.log('\n═══ Spatial Index Benchmarks ═══');

  const runner = new BenchmarkRunner();
  const processor = new FeatureProcessor();

  const features1M = generatePolygons(1000000);

  // R-tree index creation
  await runner.run('R-tree index creation (1M features)', 1000000, async () => {
    await processor.createSpatialIndex(features1M);
  });

  // Create index once for query benchmarks
  const index = await processor.createSpatialIndex(features1M);

  // Bounding box query
  await runner.run('R-tree bbox query (1M features)', 1000, async () => {
    for (let i = 0; i < 1000; i++) {
      await processor.queryBounds(features1M, [-122.45, 37.75, -122.35, 37.85]);
    }
  });

  // Radius query
  await runner.run('R-tree radius query (1M features)', 1000, async () => {
    const center: Point = { type: 'Point', coordinates: [-122.4, 37.77] };
    for (let i = 0; i < 1000; i++) {
      await processor.queryRadius(features1M, center, 1000);
    }
  });

  runner.printSummary();
}

/**
 * Raster Processing Benchmarks
 */
async function benchmarkRasterProcessing() {
  console.log('\n═══ Raster Processing Benchmarks ═══');

  const runner = new BenchmarkRunner();
  const processor = new RasterProcessor();

  // Create test raster (10K x 10K)
  const width = 10000;
  const height = 10000;
  const rasterData = new Float32Array(width * height);

  for (let i = 0; i < rasterData.length; i++) {
    rasterData[i] = Math.random() * 1000;
  }

  const testRaster = {
    metadata: {
      width,
      height,
      bands: 1,
      dataType: 'float32' as any,
      crs: 'EPSG:4326',
      transform: [-122.5, 0.001, 0, 38.0, 0, -0.001] as any,
      bounds: [-122.5, 37.0, -121.5, 38.0] as any,
      resolution: [0.001, 0.001] as [number, number],
    },
    bands: [{ index: 1, dataType: 'float32' as any }],
    data: rasterData,
  };

  // Resample benchmark
  await runner.run('Resample 10K x 10K (bilinear)', width * height, async () => {
    await processor.resample(testRaster, {
      width: 5000,
      height: 5000,
      method: 'bilinear' as any,
    });
  });

  // Reproject benchmark
  await runner.run('Reproject EPSG:4326 -> 3857', width * height, async () => {
    await processor.reproject(testRaster, {
      targetCRS: 'EPSG:3857',
      method: 'bilinear' as any,
    });
  });

  // Statistics calculation
  await runner.run('Calculate statistics', width * height, async () => {
    await processor.calculateStatistics(testRaster);
  });

  runner.printSummary();
}

/**
 * Routing Benchmarks
 */
async function benchmarkRouting() {
  console.log('\n═══ Routing Benchmarks ═══');

  const runner = new BenchmarkRunner();
  const planner = new RoutePlanner();

  // Create test network (100K nodes)
  const roads = generateLineStrings(100000);

  const network = await planner.createNetwork(roads, {
    directed: true,
    bidirectional: true,
  });

  console.log(`\nNetwork: ${network.nodes.length} nodes, ${network.edges.length} edges`);

  // Dijkstra benchmark
  await runner.run('Dijkstra (100K nodes)', network.nodes.length, async () => {
    const start: Point = { type: 'Point', coordinates: [-122.42, 37.77] };
    const end: Point = { type: 'Point', coordinates: [-122.38, 37.79] };

    for (let i = 0; i < 10; i++) {
      await planner.shortestPath(network, start, end, {
        algorithm: 'dijkstra' as any,
      });
    }
  });

  // A* benchmark
  await runner.run('A* search (100K nodes)', network.nodes.length, async () => {
    const start: Point = { type: 'Point', coordinates: [-122.42, 37.77] };
    const end: Point = { type: 'Point', coordinates: [-122.38, 37.79] };

    for (let i = 0; i < 10; i++) {
      await planner.shortestPath(network, start, end, {
        algorithm: 'astar' as any,
      });
    }
  });

  runner.printSummary();
}

/**
 * Coordinate Transformation Benchmarks
 */
async function benchmarkProjections() {
  console.log('\n═══ Coordinate Transformation Benchmarks ═══');

  const runner = new BenchmarkRunner();
  const transformer = new CoordinateTransformer();

  // Single transformation benchmark
  await runner.run('Single transform WGS84 -> Web Mercator', 10000, async () => {
    for (let i = 0; i < 10000; i++) {
      await transformer.transform(
        [-122.4 + Math.random() * 0.1, 37.77 + Math.random() * 0.1],
        'EPSG:4326',
        'EPSG:3857'
      );
    }
  });

  // Batch transformation benchmark
  const coords = generatePoints(100000).map((p) => p.geometry.coordinates as [number, number]);

  await runner.run('Batch transform (100K coords)', 100000, async () => {
    await transformer.transformBatch(coords, {
      sourceCRS: 'EPSG:4326',
      targetCRS: 'EPSG:3857',
    });
  });

  runner.printSummary();
}

/**
 * Spatial Analysis Benchmarks
 */
async function benchmarkSpatialAnalysis() {
  console.log('\n═══ Spatial Analysis Benchmarks ═══');

  const runner = new BenchmarkRunner();
  const analyzer = new SpatialAnalyzer();

  const points1M = generatePoints(1000000);
  const reference: Point = { type: 'Point', coordinates: [-122.4, 37.77] };

  // Distance calculation
  await runner.run('Distance calculation (1M features)', 1000000, async () => {
    await analyzer.calculateDistances(points1M.slice(0, 10000), reference);
  });

  // K-nearest neighbors
  await runner.run('K-nearest neighbors (10K features, k=5)', 10000, async () => {
    await analyzer.findNearestNeighbors(points1M.slice(0, 10000), 5);
  });

  // Voronoi polygons
  await runner.run('Voronoi polygons (1K features)', 1000, async () => {
    await analyzer.voronoiPolygons(points1M.slice(0, 1000));
  });

  // Delaunay triangulation
  await runner.run('Delaunay triangulation (1K features)', 1000, async () => {
    await analyzer.delaunayTriangulation(points1M.slice(0, 1000));
  });

  // Kernel density estimation
  await runner.run('Kernel density (10K features)', 10000, async () => {
    await analyzer.kernelDensity(points1M.slice(0, 10000), {
      bandwidth: 0.005,
      cellSize: 0.01,
    });
  });

  runner.printSummary();
}

/**
 * Clustering Benchmarks
 */
async function benchmarkClustering() {
  console.log('\n═══ Clustering Benchmarks ═══');

  const runner = new BenchmarkRunner();
  const clustering = new SpatialClustering();

  const points100K = generatePoints(100000);

  // DBSCAN benchmark
  await runner.run('DBSCAN (100K features)', 100000, async () => {
    await clustering.dbscan(points100K.slice(0, 10000), {
      eps: 500,
      minSamples: 5,
      metric: 'haversine',
    });
  });

  // K-Means benchmark
  await runner.run('K-Means (100K features, k=10)', 100000, async () => {
    await clustering.kmeans(points100K.slice(0, 10000), {
      nClusters: 10,
      maxIterations: 300,
    });
  });

  // Hierarchical clustering
  await runner.run('Hierarchical clustering (10K features)', 10000, async () => {
    await clustering.hierarchical(points100K.slice(0, 1000), {
      nClusters: 5,
      method: 'ward',
    });
  });

  // Hot spot analysis
  await runner.run('Hot spot analysis (10K features)', 10000, async () => {
    await clustering.hotspotAnalysis(points100K.slice(0, 10000), 'value', {
      distanceBand: 1000,
    });
  });

  runner.printSummary();
}

/**
 * Main benchmark suite
 */
async function runAllBenchmarks() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         GIS Platform Performance Benchmarks               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  try {
    await benchmarkVectorProcessing();
    await benchmarkSpatialIndex();
    await benchmarkRasterProcessing();
    await benchmarkRouting();
    await benchmarkProjections();
    await benchmarkSpatialAnalysis();
    await benchmarkClustering();

    const totalTime = Date.now() - startTime;

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║           All Benchmarks Completed!                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log(`\nTotal benchmark time: ${(totalTime / 1000).toFixed(2)} seconds\n`);

    console.log('System Information:');
    console.log(`  Node.js: ${process.version}`);
    console.log(`  Platform: ${process.platform}`);
    console.log(`  Architecture: ${process.arch}`);
    console.log(`  Memory: ${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB\n`);
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Run benchmarks
if (require.main === module) {
  runAllBenchmarks().catch(console.error);
}

export {
  benchmarkVectorProcessing,
  benchmarkSpatialIndex,
  benchmarkRasterProcessing,
  benchmarkRouting,
  benchmarkProjections,
  benchmarkSpatialAnalysis,
  benchmarkClustering,
};
