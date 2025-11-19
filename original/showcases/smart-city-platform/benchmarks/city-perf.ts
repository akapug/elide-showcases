/**
 * Smart City Platform - Performance Benchmarks
 *
 * Comprehensive performance testing for all city systems.
 * Tests TypeScript + Python interop performance and scalability.
 */

import { TrafficNetworkOptimizer } from '../src/traffic/traffic-optimizer.ts';
import { AirQualityMonitor } from '../src/environment/air-quality-monitor.ts';
import { WasteManagementOptimizer } from '../src/environment/waste-management.ts';
import { SmartLightingController } from '../src/utilities/smart-lighting.ts';
import { WaterManagementController } from '../src/utilities/water-management.ts';
import { EmergencyResponseCoordinator } from '../src/safety/emergency-response.ts';
import { CitizenServicesManager } from '../src/citizen/citizen-services.ts';
import { CityAnalyticsDashboard } from '../src/analytics/city-analytics.ts';

/**
 * Benchmark result structure
 */
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number; // milliseconds
  avgTime: number; // milliseconds
  minTime: number;
  maxTime: number;
  throughput: number; // ops/sec
  memoryUsed?: number; // MB
}

/**
 * Benchmark suite
 */
class SmartCityBenchmarks {
  private results: BenchmarkResult[] = [];

  /**
   * Run benchmark with timing
   */
  async benchmark(
    name: string,
    fn: () => Promise<void>,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    console.log(`\n📊 Benchmarking: ${name} (${iterations} iterations)...`);

    const times: number[] = [];
    const startMemory = this.getMemoryUsage();

    // Warmup
    await fn();

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);

      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
      }
    }

    console.log(); // New line after progress

    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const throughput = 1000 / avgTime; // ops/sec

    const endMemory = this.getMemoryUsage();
    const memoryUsed = endMemory - startMemory;

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      throughput,
      memoryUsed
    };

    this.results.push(result);

    console.log(`  ✓ Avg: ${avgTime.toFixed(2)}ms`);
    console.log(`  ✓ Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
    console.log(`  ✓ Throughput: ${throughput.toFixed(2)} ops/sec`);
    if (memoryUsed > 0) {
      console.log(`  ✓ Memory: ${memoryUsed.toFixed(2)} MB`);
    }

    return result;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024;
    }
    return 0;
  }

  /**
   * Generate benchmark report
   */
  generateReport(): void {
    console.log('\n' + '═'.repeat(80));
    console.log('BENCHMARK SUMMARY');
    console.log('═'.repeat(80));

    console.log('\nResults:');
    console.log('─'.repeat(80));
    console.log(
      'Benchmark'.padEnd(40) +
      'Avg (ms)'.padEnd(12) +
      'Throughput'.padEnd(16) +
      'Memory (MB)'
    );
    console.log('─'.repeat(80));

    for (const result of this.results) {
      console.log(
        result.name.padEnd(40) +
        result.avgTime.toFixed(2).padEnd(12) +
        result.throughput.toFixed(2).padEnd(16) +
        (result.memoryUsed?.toFixed(2) || 'N/A')
      );
    }

    console.log('─'.repeat(80));

    // Overall statistics
    const totalOps = this.results.reduce((sum, r) => sum + r.iterations, 0);
    const totalTime = this.results.reduce((sum, r) => sum + r.totalTime, 0);
    const avgThroughput = this.results.reduce((sum, r) => sum + r.throughput, 0) / this.results.length;

    console.log(`\nTotal Operations: ${totalOps.toLocaleString()}`);
    console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`Average Throughput: ${avgThroughput.toFixed(2)} ops/sec`);
    console.log('\n' + '═'.repeat(80));
  }
}

/**
 * Main benchmark runner
 */
async function runBenchmarks() {
  console.log('🏙️  Smart City Platform - Performance Benchmarks\n');
  console.log('═'.repeat(80));
  console.log('Testing TypeScript + Python Polyglot Performance');
  console.log('═'.repeat(80));

  const suite = new SmartCityBenchmarks();

  // Create test data
  const trafficNetwork = createMockTrafficNetwork(100);
  const envNetwork = createMockEnvironmentalNetwork(50);
  const wasteSystem = createMockWasteSystem(300);
  const lightingSystem = createMockLightingSystem(1000);
  const waterSystem = createMockWaterSystem(200);
  const emergencySystem = createMockEmergencySystem(150);
  const citizenSystem = createMockCitizenSystem();
  const cityConfig = createMockCityConfig();

  // Initialize systems
  const trafficOptimizer = new TrafficNetworkOptimizer(trafficNetwork);
  const airQualityMonitor = new AirQualityMonitor(envNetwork);
  const wasteManager = new WasteManagementOptimizer(wasteSystem);
  const lightingController = new SmartLightingController(lightingSystem);
  const waterManager = new WaterManagementController(waterSystem);
  const emergencyCoordinator = new EmergencyResponseCoordinator(emergencySystem);
  const citizenServices = new CitizenServicesManager(citizenSystem);
  const analytics = new CityAnalyticsDashboard(cityConfig);

  analytics.registerComponents({
    traffic: trafficOptimizer,
    airQuality: airQualityMonitor,
    waste: wasteManager,
    lighting: lightingController,
    water: waterManager,
    emergency: emergencyCoordinator,
    citizen: citizenServices
  });

  // Benchmark 1: Traffic Optimization
  await suite.benchmark(
    'Traffic: Genetic Algorithm Optimization',
    async () => {
      await trafficOptimizer.optimizeWithGeneticAlgorithm(50, 20, 0.1);
    },
    10
  );

  await suite.benchmark(
    'Traffic: Anomaly Detection',
    async () => {
      await trafficOptimizer.detectAnomalies();
    },
    50
  );

  await suite.benchmark(
    'Traffic: Generate Report',
    () => Promise.resolve(trafficOptimizer.generateReport()),
    100
  );

  // Benchmark 2: Air Quality Monitoring
  await suite.benchmark(
    'Air Quality: Collect Measurements',
    async () => {
      await airQualityMonitor.collectMeasurements();
    },
    100
  );

  await suite.benchmark(
    'Air Quality: Predict 24h Ahead',
    async () => {
      await airQualityMonitor.predictAirQuality(24);
    },
    20
  );

  await suite.benchmark(
    'Air Quality: Detect Anomalies',
    async () => {
      await airQualityMonitor.detectAnomalies();
    },
    50
  );

  // Benchmark 3: Waste Management
  await suite.benchmark(
    'Waste: Monitor Bins',
    async () => {
      await wasteManager.monitorBins();
    },
    100
  );

  await suite.benchmark(
    'Waste: Optimize Routes',
    async () => {
      await wasteManager.optimizeRoutes();
    },
    20
  );

  await suite.benchmark(
    'Waste: Predict Fill Times',
    async () => {
      await wasteManager.predictFillTimes();
    },
    50
  );

  // Benchmark 4: Smart Lighting
  await suite.benchmark(
    'Lighting: Update All Lights',
    async () => {
      await lightingController.updateLighting();
    },
    100
  );

  await suite.benchmark(
    'Lighting: Predict Maintenance',
    async () => {
      await lightingController.predictMaintenance();
    },
    50
  );

  await suite.benchmark(
    'Lighting: Detect Faults',
    async () => {
      await lightingController.detectFaults();
    },
    100
  );

  // Benchmark 5: Water Management
  await suite.benchmark(
    'Water: Monitor Quality',
    async () => {
      await waterManager.monitorWaterQuality();
    },
    100
  );

  await suite.benchmark(
    'Water: Detect Leaks',
    async () => {
      await waterManager.detectLeaks();
    },
    50
  );

  await suite.benchmark(
    'Water: Predict Failures',
    async () => {
      await waterManager.predictPipeFailures();
    },
    20
  );

  // Benchmark 6: Emergency Response
  await suite.benchmark(
    'Emergency: Dispatch Response',
    async () => {
      await emergencyCoordinator.reportEmergency(
        'medical',
        { latitude: 40.7128, longitude: -74.0060 },
        'Test emergency'
      );
    },
    100
  );

  await suite.benchmark(
    'Emergency: Predict Hotspots',
    async () => {
      await emergencyCoordinator.predictHotspots();
    },
    20
  );

  // Benchmark 7: Citizen Services
  await suite.benchmark(
    'Citizen: Submit Request',
    async () => {
      await citizenServices.submitServiceRequest(
        'test-citizen',
        'infrastructure',
        'test',
        'Test request',
        { latitude: 40.7128, longitude: -74.0060 }
      );
    },
    100
  );

  await suite.benchmark(
    'Citizen: Get Transit Info',
    async () => {
      await citizenServices.getTransitInfo();
    },
    100
  );

  // Benchmark 8: City Analytics
  await suite.benchmark(
    'Analytics: Collect City Data',
    async () => {
      await analytics.collectCityAnalytics();
    },
    50
  );

  await suite.benchmark(
    'Analytics: Calculate KPIs',
    () => Promise.resolve(analytics.calculateKPIs()),
    100
  );

  await suite.benchmark(
    'Analytics: Predictive Insights',
    async () => {
      await analytics.generatePredictiveInsights();
    },
    20
  );

  await suite.benchmark(
    'Analytics: Detect Anomalies',
    async () => {
      await analytics.detectSystemAnomalies();
    },
    20
  );

  await suite.benchmark(
    'Analytics: Comprehensive Report',
    async () => {
      await analytics.generateComprehensiveReport();
    },
    10
  );

  // Generate final report
  suite.generateReport();

  console.log('\n✅ Benchmarks Complete!\n');
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function createMockTrafficNetwork(size: number): any {
  return {
    networkId: 'test-network',
    intersections: Array.from({ length: size }, (_, i) => ({
      intersectionId: `int-${i}`,
      location: { latitude: 40.7128 + Math.random() * 0.1, longitude: -74.0060 + Math.random() * 0.1 },
      type: 'signalized',
      signals: [],
      sensors: [],
      capacity: 1000,
      currentFlow: 500,
      congestionLevel: 'moderate',
      priority: 'medium'
    })),
    roads: Array.from({ length: size * 2 }, (_, i) => ({
      segmentId: `road-${i}`,
      name: `Road ${i}`,
      type: 'arterial',
      startPoint: { latitude: 40.7128, longitude: -74.0060 },
      endPoint: { latitude: 40.7138, longitude: -74.0070 },
      length: 1000,
      lanes: 2,
      speedLimit: 50,
      capacity: 800,
      currentFlow: { volume: 400, speed: 45, density: 20, levelOfService: 'C', timestamp: new Date() },
      condition: { surfaceQuality: 'good', weather: {}, visibility: 1000, hazards: [], maintenanceNeeded: false }
    })),
    zones: [],
    lastUpdated: new Date()
  };
}

function createMockEnvironmentalNetwork(size: number): any {
  return {
    networkId: 'test-env',
    airQualitySensors: Array.from({ length: size }, (_, i) => ({
      sensorId: `aqs-${i}`,
      location: { latitude: 40.7128 + Math.random() * 0.1, longitude: -74.0060 + Math.random() * 0.1 },
      status: 'active',
      measurements: {
        timestamp: new Date(),
        pm25: 25,
        pm10: 50,
        no2: 30,
        so2: 10,
        co: 1,
        o3: 40,
        voc: 150,
        temperature: 20,
        humidity: 60,
        pressure: 1013,
        aqi: 50,
        category: 'good'
      },
      calibration: new Date(),
      manufacturer: 'Test',
      model: 'Test'
    })),
    noiseSensors: [],
    weatherStations: [],
    wasteManagement: {}
  };
}

function createMockWasteSystem(size: number): any {
  return {
    systemId: 'test-waste',
    bins: Array.from({ length: size }, (_, i) => ({
      binId: `bin-${i}`,
      location: { latitude: 40.7128 + Math.random() * 0.1, longitude: -74.0060 + Math.random() * 0.1 },
      type: 'general',
      capacity: 1000,
      fillLevel: Math.random() * 100,
      temperature: 25,
      lastCollection: new Date(),
      nextScheduled: new Date(),
      status: 'normal',
      sensor: {}
    })),
    trucks: Array.from({ length: 10 }, (_, i) => ({
      truckId: `truck-${i}`,
      location: { latitude: 40.7128, longitude: -74.0060 },
      capacity: 10000,
      currentLoad: 0,
      status: 'idle',
      route: '',
      driver: `Driver ${i}`,
      fuelLevel: 90,
      lastMaintenance: new Date()
    })),
    facilities: [],
    routes: []
  };
}

function createMockLightingSystem(size: number): any {
  return {
    systemId: 'test-lighting',
    streetLights: Array.from({ length: size }, (_, i) => ({
      lightId: `light-${i}`,
      location: { latitude: 40.7128 + Math.random() * 0.1, longitude: -74.0060 + Math.random() * 0.1 },
      type: 'led',
      brightness: 0,
      status: 'off',
      energyConsumption: 0,
      motionDetected: false,
      lastMaintenance: new Date(),
      lifespan: 30000
    })),
    zones: [],
    schedule: {},
    energyUsage: { totalConsumption: 0, peakDemand: 0, efficiency: 0, cost: 0, carbonFootprint: 0, renewablePercentage: 0 }
  };
}

function createMockWaterSystem(size: number): any {
  return {
    systemId: 'test-water',
    network: {
      networkId: 'test-net',
      pipes: Array.from({ length: size }, (_, i) => ({
        pipeId: `pipe-${i}`,
        startPoint: { latitude: 40.7128, longitude: -74.0060 },
        endPoint: { latitude: 40.7138, longitude: -74.0070 },
        diameter: 300,
        material: 'ductile_iron',
        age: 20,
        condition: { status: 'good', leakProbability: 0.1, corrosion: 20, lastInspection: new Date(), nextInspection: new Date() },
        flowRate: 100,
        pressure: 4
      })),
      pumps: [],
      valves: [],
      totalLength: size * 1000,
      pressure: 4
    },
    sensors: [],
    reservoirs: [],
    treatmentPlants: []
  };
}

function createMockEmergencySystem(size: number): any {
  return {
    systemId: 'test-emergency',
    emergencies: [],
    responders: Array.from({ length: size }, (_, i) => ({
      responderId: `resp-${i}`,
      name: `Responder ${i}`,
      type: 'paramedic',
      currentLocation: { latitude: 40.7128, longitude: -74.0060 },
      status: 'available',
      skills: [],
      equipment: []
    })),
    facilities: [],
    dispatchCenter: { centerId: 'test-dispatch', location: { latitude: 40.7128, longitude: -74.0060 }, operators: 5, activeIncidents: 0, averageResponseTime: 8, performance: {} }
  };
}

function createMockCitizenSystem(): any {
  return {
    systemId: 'test-citizen',
    serviceRequests: [],
    publicTransport: { systemId: 'test-transit', routes: [], vehicles: [], stops: [], realtime: true },
    parking: { systemId: 'test-parking', lots: [], meters: [], regulations: [] },
    feedback: []
  };
}

function createMockCityConfig(): any {
  return {
    cityId: 'test-city',
    cityName: 'TestVille',
    population: 100000,
    area: 100,
    timezone: 'UTC',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    districts: [],
    metadata: {}
  };
}

// Run benchmarks
runBenchmarks().catch(console.error);
