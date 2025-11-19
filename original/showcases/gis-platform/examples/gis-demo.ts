/**
 * GIS Platform Demo
 *
 * Comprehensive demonstration of GIS platform capabilities including
 * vector processing, raster analysis, spatial operations, routing,
 * geocoding, terrain analysis, and visualization.
 */

import { FeatureProcessor } from '../src/vector/feature-processor';
import { RasterProcessor } from '../src/raster/raster-processor';
import { SpatialAnalyzer } from '../src/analysis/spatial-analyzer';
import { RoutePlanner } from '../src/routing/route-planner';
import { Geocoder } from '../src/geocoding/geocoder';
import { CoordinateTransformer } from '../src/projection/coordinate-transformer';
import { MapRenderer } from '../src/visualization/map-renderer';
import { ElevationAnalyzer } from '../src/terrain/elevation-analyzer';
import { ImageryProcessor } from '../src/satellite/imagery-processor';
import { SpatialClustering } from '../src/clustering/spatial-clustering';

import type { Feature, Point, Polygon, LineString } from '../src/types';

/**
 * Demo 1: Vector Feature Processing
 */
async function demoVectorProcessing() {
  console.log('\n=== Demo 1: Vector Feature Processing ===\n');

  const processor = new FeatureProcessor();

  // Create sample features
  const buildings: Feature<Polygon>[] = [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.4194, 37.7749],
          [-122.4184, 37.7749],
          [-122.4184, 37.7739],
          [-122.4194, 37.7739],
          [-122.4194, 37.7749],
        ]],
      },
      properties: { id: 1, type: 'residential', height: 15 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.4194, 37.7759],
          [-122.4184, 37.7759],
          [-122.4184, 37.7749],
          [-122.4194, 37.7749],
          [-122.4194, 37.7759],
        ]],
      },
      properties: { id: 2, type: 'commercial', height: 25 },
    },
  ];

  console.log(`Loaded ${buildings.length} building features`);

  // Buffer buildings by 50 meters
  console.log('\nBuffering buildings by 50 meters...');
  const buffered = await processor.buffer(buildings, 50);
  console.log(`Created ${buffered.length} buffered features`);

  // Calculate areas
  console.log('\nCalculating areas...');
  const areas = await processor.calculateAreas(buildings);
  buildings.forEach((b, i) => {
    console.log(`  Building ${b.properties.id}: ${areas[i].toFixed(2)} sq meters`);
  });

  // Calculate centroids
  console.log('\nCalculating centroids...');
  const centroids = await processor.centroids(buildings);
  console.log(`Created ${centroids.length} centroid points`);

  // Spatial join
  console.log('\nPerforming spatial join...');
  const joined = await processor.spatialJoin(buildings, buffered, {
    predicate: 'intersects' as any,
    how: 'inner',
  });
  console.log(`Joined features: ${joined.length}`);

  // Simplify geometries
  console.log('\nSimplifying geometries...');
  const simplified = await processor.simplify(buildings, {
    tolerance: 0.0001,
    preserveTopology: true,
  });
  console.log(`Simplified ${simplified.length} features`);

  console.log('\n✓ Vector processing demo completed');
}

/**
 * Demo 2: Spatial Analysis
 */
async function demoSpatialAnalysis() {
  console.log('\n=== Demo 2: Spatial Analysis ===\n');

  const analyzer = new SpatialAnalyzer();

  // Create sample points
  const points: Feature<Point>[] = Array.from({ length: 100 }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-122.4 + Math.random() * 0.1, 37.77 + Math.random() * 0.1],
    },
    properties: { id: i, value: Math.random() * 100 },
  }));

  console.log(`Created ${points.length} random points`);

  // Distance calculations
  console.log('\nCalculating distances to reference point...');
  const reference: Point = {
    type: 'Point',
    coordinates: [-122.4194, 37.7749],
  };

  const distances = await analyzer.calculateDistances(points, reference);
  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
  console.log(`  Average distance: ${avgDistance.toFixed(2)} meters`);
  console.log(`  Min distance: ${Math.min(...distances).toFixed(2)} meters`);
  console.log(`  Max distance: ${Math.max(...distances).toFixed(2)} meters`);

  // K-nearest neighbors
  console.log('\nFinding 5 nearest neighbors for each point...');
  const neighbors = await analyzer.findNearestNeighbors(points, 5);
  console.log(`  Point 0 neighbors: ${neighbors[0].join(', ')}`);

  // Voronoi polygons
  console.log('\nGenerating Voronoi polygons...');
  const voronoi = await analyzer.voronoiPolygons(points.slice(0, 20));
  console.log(`  Created ${voronoi.length} Voronoi polygons`);

  // Delaunay triangulation
  console.log('\nGenerating Delaunay triangulation...');
  const delaunay = await analyzer.delaunayTriangulation(points.slice(0, 20));
  console.log(`  Created ${delaunay.length} triangles`);

  // Create grid
  console.log('\nCreating spatial grid...');
  const grid = await analyzer.createGrid([-122.45, 37.77, -122.40, 37.80] as any, {
    cellSize: 0.01,
  });
  console.log(`  Created ${grid.length} grid cells`);

  // Kernel density estimation
  console.log('\nPerforming kernel density estimation...');
  const kde = await analyzer.kernelDensity(points.slice(0, 50), {
    bandwidth: 0.005,
    cellSize: 0.001,
  });
  console.log(`  Created density surface: ${kde.values.length} x ${kde.values[0].length}`);

  console.log('\n✓ Spatial analysis demo completed');
}

/**
 * Demo 3: Routing and Network Analysis
 */
async function demoRouting() {
  console.log('\n=== Demo 3: Routing and Network Analysis ===\n');

  const planner = new RoutePlanner();

  // Create sample road network
  const roads: Feature<LineString>[] = [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.4194, 37.7749],
          [-122.4184, 37.7749],
        ],
      },
      properties: { id: 1, speed: 50, name: 'Main St' },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.4184, 37.7749],
          [-122.4184, 37.7759],
        ],
      },
      properties: { id: 2, speed: 40, name: 'Oak Ave' },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-122.4184, 37.7759],
          [-122.4194, 37.7759],
        ],
      },
      properties: { id: 3, speed: 50, name: 'Elm St' },
    },
  ];

  console.log(`Created road network with ${roads.length} segments`);

  // Create network
  console.log('\nCreating network graph...');
  const network = await planner.createNetwork(roads, {
    directed: true,
    bidirectional: true,
  });
  console.log(`  Nodes: ${network.nodes.length}`);
  console.log(`  Edges: ${network.edges.length}`);

  // Find shortest path
  console.log('\nFinding shortest path...');
  const start: Point = { type: 'Point', coordinates: [-122.4194, 37.7749] };
  const end: Point = { type: 'Point', coordinates: [-122.4194, 37.7759] };

  const route = await planner.shortestPath(network, start, end, {
    algorithm: 'dijkstra' as any,
  });

  console.log(`  Distance: ${route.distance.toFixed(2)} meters`);
  console.log(`  Duration: ${(route.duration / 60).toFixed(2)} minutes`);
  console.log(`  Nodes: ${route.nodes.length}`);

  // Service area analysis
  console.log('\nCalculating 10-minute service area...');
  const serviceArea = await planner.serviceArea(network, start, {
    maxTime: 600, // 10 minutes in seconds
    intervals: [300, 600], // 5 and 10 minutes
  });
  console.log(`  Created ${serviceArea.length} isochrone polygons`);

  // Network statistics
  console.log('\nAnalyzing network connectivity...');
  const connectivity = await planner.analyzeConnectivity(network);
  console.log(`  Is connected: ${connectivity.isConnected}`);
  console.log(`  Components: ${connectivity.componentCount}`);
  console.log(`  Average degree: ${connectivity.averageDegree.toFixed(2)}`);

  console.log('\n✓ Routing demo completed');
}

/**
 * Demo 4: Geocoding
 */
async function demoGeocoding() {
  console.log('\n=== Demo 4: Geocoding ===\n');

  const geocoder = new Geocoder({
    provider: 'nominatim' as any,
    userAgent: 'gis-platform-demo/1.0',
  });

  // Forward geocoding
  console.log('Forward geocoding...');
  const addresses = [
    '1600 Amphitheatre Parkway, Mountain View, CA',
    'One Apple Park Way, Cupertino, CA',
    '1 Microsoft Way, Redmond, WA',
  ];

  for (const address of addresses) {
    console.log(`\n  Address: ${address}`);
    try {
      const location = await geocoder.geocode(address);
      console.log(`    → Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`);
      console.log(`    → ${location.displayName}`);
    } catch (error) {
      console.log(`    → Error: ${error}`);
    }
  }

  // Reverse geocoding
  console.log('\n\nReverse geocoding...');
  const coordinates: Array<[number, number]> = [
    [37.4224764, -122.0842499],
    [37.3346, -122.0090],
  ];

  for (const [lat, lon] of coordinates) {
    console.log(`\n  Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    try {
      const location = await geocoder.reverseGeocode(lat, lon);
      console.log(`    → ${location.address}`);
    } catch (error) {
      console.log(`    → Error: ${error}`);
    }
  }

  // Address parsing
  console.log('\n\nAddress parsing...');
  const testAddress = '123 Main Street, Apt 4B, San Francisco, CA 94102';
  console.log(`  Input: ${testAddress}`);
  try {
    const parsed = await geocoder.parseAddress(testAddress);
    console.log('  Parsed components:');
    console.log(`    Street: ${parsed.street}`);
    console.log(`    Unit: ${parsed.unit}`);
    console.log(`    City: ${parsed.city}`);
    console.log(`    State: ${parsed.state}`);
    console.log(`    Postal Code: ${parsed.postalCode}`);
  } catch (error) {
    console.log(`    → Error: ${error}`);
  }

  console.log('\n✓ Geocoding demo completed');
}

/**
 * Demo 5: Coordinate Transformations
 */
async function demoProjections() {
  console.log('\n=== Demo 5: Coordinate Transformations ===\n');

  const transformer = new CoordinateTransformer();

  // WGS84 to Web Mercator
  console.log('Transforming WGS84 to Web Mercator...');
  const wgs84 = [-122.4194, 37.7749] as [number, number];
  const webMercator = await transformer.toWebMercator(wgs84);
  console.log(`  WGS84: ${wgs84[0]}, ${wgs84[1]}`);
  console.log(`  Web Mercator: ${webMercator[0].toFixed(2)}, ${webMercator[1].toFixed(2)}`);

  // WGS84 to UTM
  console.log('\nTransforming WGS84 to UTM...');
  const utm = await transformer.toUTM(wgs84);
  console.log(`  UTM Zone ${utm.zone} (${utm.epsg})`);
  console.log(`  Easting: ${utm.coordinates[0].toFixed(2)}, Northing: ${utm.coordinates[1].toFixed(2)}`);

  // Batch transformation
  console.log('\nBatch transforming 1000 coordinates...');
  const coords = Array.from({ length: 1000 }, (_, i) => [
    -122.4 + Math.random() * 0.1,
    37.77 + Math.random() * 0.1,
  ] as [number, number]);

  const startTime = Date.now();
  const transformed = await transformer.transformBatch(coords, {
    sourceCRS: 'EPSG:4326',
    targetCRS: 'EPSG:3857',
  });
  const elapsed = Date.now() - startTime;

  console.log(`  Transformed ${transformed.length} coordinates in ${elapsed}ms`);
  console.log(`  Rate: ${(transformed.length / (elapsed / 1000)).toFixed(0)} coords/sec`);

  // CRS information
  console.log('\nGetting CRS information...');
  const crsInfo = await transformer.getCRSInfo('EPSG:4326');
  console.log(`  Name: ${crsInfo.name}`);
  console.log(`  Type: ${crsInfo.type}`);
  console.log(`  Authority: ${crsInfo.authority}:${crsInfo.code}`);

  console.log('\n✓ Projection demo completed');
}

/**
 * Demo 6: Terrain Analysis
 */
async function demoTerrain() {
  console.log('\n=== Demo 6: Terrain Analysis ===\n');

  const analyzer = new ElevationAnalyzer();

  // Create synthetic DEM
  console.log('Creating synthetic DEM (100x100)...');
  const width = 100;
  const height = 100;
  const demData = new Float32Array(width * height);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      // Create synthetic terrain
      demData[row * width + col] =
        Math.sin((row / height) * Math.PI * 2) * 100 +
        Math.cos((col / width) * Math.PI * 2) * 100 +
        500;
    }
  }

  const dem = {
    metadata: {
      width,
      height,
      bands: 1,
      dataType: 'float32' as any,
      crs: 'EPSG:4326',
      transform: [-122.5, 0.001, 0, 38.0, 0, -0.001] as any,
      bounds: [-122.5, 37.9, -122.4, 38.0] as any,
      resolution: [0.001, 0.001] as [number, number],
    },
    bands: [{ index: 1, dataType: 'float32' as any }],
    data: demData,
  };

  console.log(`  Created ${width}x${height} DEM`);

  // Calculate slope
  console.log('\nCalculating slope...');
  const slope = await analyzer.calculateSlope(dem, {
    unit: 'degrees' as any,
    algorithm: 'horn' as any,
  });
  console.log(`  Slope raster: ${slope.metadata.width}x${slope.metadata.height}`);

  // Calculate aspect
  console.log('\nCalculating aspect...');
  const aspect = await analyzer.calculateAspect(dem);
  console.log(`  Aspect raster: ${aspect.metadata.width}x${aspect.metadata.height}`);

  // Calculate hillshade
  console.log('\nCalculating hillshade...');
  const hillshade = await analyzer.calculateHillshade(dem, {
    azimuth: 315,
    altitude: 45,
  });
  console.log(`  Hillshade raster: ${hillshade.metadata.width}x${hillshade.metadata.height}`);

  // Generate contours
  console.log('\nGenerating contours...');
  const contours = await analyzer.generateContours(dem, {
    interval: 20,
    simplify: true,
    tolerance: 0.0001,
  });
  console.log(`  Created ${contours.length} contour lines`);

  // Terrain ruggedness
  console.log('\nCalculating Terrain Ruggedness Index...');
  const tri = await analyzer.terrainRuggednessIndex(dem);
  console.log(`  TRI raster: ${tri.metadata.width}x${tri.metadata.height}`);

  console.log('\n✓ Terrain analysis demo completed');
}

/**
 * Demo 7: Spatial Clustering
 */
async function demoClustering() {
  console.log('\n=== Demo 7: Spatial Clustering ===\n');

  const clustering = new SpatialClustering();

  // Create sample points with clusters
  const points: Feature<Point>[] = [
    // Cluster 1
    ...Array.from({ length: 50 }, (_, i) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [-122.42 + Math.random() * 0.01, 37.775 + Math.random() * 0.01],
      },
      properties: { id: i, value: 50 + Math.random() * 20 },
    })),
    // Cluster 2
    ...Array.from({ length: 50 }, (_, i) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [-122.40 + Math.random() * 0.01, 37.775 + Math.random() * 0.01],
      },
      properties: { id: i + 50, value: 30 + Math.random() * 20 },
    })),
  ];

  console.log(`Created ${points.length} points in 2 clusters`);

  // DBSCAN clustering
  console.log('\nPerforming DBSCAN clustering...');
  const dbscanClusters = await clustering.dbscan(points, {
    eps: 500,
    minSamples: 5,
    metric: 'haversine',
  });
  console.log(`  Found ${dbscanClusters.length} clusters`);
  dbscanClusters.forEach((c) => {
    console.log(`    Cluster ${c.id}: ${c.size} points`);
  });

  // K-Means clustering
  console.log('\nPerforming K-Means clustering (k=2)...');
  const kmeansClusters = await clustering.kmeans(points, {
    nClusters: 2,
    maxIterations: 300,
  });
  console.log(`  Found ${kmeansClusters.length} clusters`);
  kmeansClusters.forEach((c) => {
    console.log(`    Cluster ${c.id}: ${c.size} points`);
  });

  // Hot spot analysis
  console.log('\nPerforming hot spot analysis (Getis-Ord Gi*)...');
  const hotspots = await clustering.hotspotAnalysis(points, 'value', {
    distanceBand: 1000,
    confidenceLevel: 0.95,
  });
  const hotCount = hotspots.filter((h) => h.properties.type === 'hot').length;
  const coldCount = hotspots.filter((h) => h.properties.type === 'cold').length;
  console.log(`  Hot spots: ${hotCount}`);
  console.log(`  Cold spots: ${coldCount}`);

  // Outlier detection
  console.log('\nDetecting spatial outliers...');
  const outliers = await clustering.detectOutliers(points, {
    method: 'isolation_forest',
    contamination: 0.1,
  });
  console.log(`  Found ${outliers.length} outliers`);

  console.log('\n✓ Clustering demo completed');
}

/**
 * Demo 8: Visualization
 */
async function demoVisualization() {
  console.log('\n=== Demo 8: Visualization ===\n');

  const renderer = new MapRenderer();

  // Create map
  console.log('Creating interactive map...');
  const mapId = await renderer.createMap({
    center: [-122.4194, 37.7749],
    zoom: 13,
    width: 1024,
    height: 768,
  });
  console.log(`  Map created: ${mapId}`);

  // Add vector layer
  console.log('\nAdding vector layer...');
  const features: Feature<Point>[] = Array.from({ length: 50 }, (_, i) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-122.4 + Math.random() * 0.05, 37.77 + Math.random() * 0.05],
    },
    properties: { id: i, name: `Point ${i}` },
  }));

  await renderer.addVectorLayer(mapId, features, {
    style: {
      fillColor: '#ff6b6b',
      fillOpacity: 0.6,
      strokeColor: '#c92a2a',
      strokeWidth: 2,
      radius: 8,
    },
    popup: (f) => `<b>${f.properties.name}</b>`,
  });
  console.log(`  Added ${features.length} points`);

  // Add heatmap
  console.log('\nAdding heatmap...');
  await renderer.createHeatmap(mapId, features, {
    intensity: 1,
    radius: 25,
    blur: 15,
  });
  console.log('  Heatmap added');

  // Export map
  console.log('\nExporting map...');
  await renderer.exportMap(mapId, '/tmp/gis_demo_map.html');
  console.log('  Map exported to /tmp/gis_demo_map.html');

  console.log('\n✓ Visualization demo completed');
}

/**
 * Main demo runner
 */
async function runAllDemos() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║    GIS Platform Comprehensive Demo Suite      ║');
  console.log('╚════════════════════════════════════════════════╝');

  const startTime = Date.now();

  try {
    await demoVectorProcessing();
    await demoSpatialAnalysis();
    await demoRouting();
    await demoGeocoding();
    await demoProjections();
    await demoTerrain();
    await demoClustering();
    await demoVisualization();

    const elapsed = Date.now() - startTime;

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║             All Demos Completed!              ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`\nTotal time: ${(elapsed / 1000).toFixed(2)} seconds\n`);
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run demos
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export {
  demoVectorProcessing,
  demoSpatialAnalysis,
  demoRouting,
  demoGeocoding,
  demoProjections,
  demoTerrain,
  demoClustering,
  demoVisualization,
};
