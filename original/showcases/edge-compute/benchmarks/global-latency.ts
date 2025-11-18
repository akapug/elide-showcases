/**
 * Global Latency Testing
 *
 * Comprehensive latency benchmarking across global edge locations:
 * - Multi-region latency measurement
 * - Network path optimization
 * - Latency distribution analysis
 * - Geographic performance comparison
 * - Edge location selection validation
 */

interface EdgeLocation {
  id: string;
  name: string;
  region: string;
  latitude: float;
  longitude: number;
  endpoint: string;
}

interface LatencyMeasurement {
  location: string;
  target: string;
  latency: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

interface LatencyStats {
  location: string;
  target: string;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  samples: number;
  successRate: number;
}

/**
 * Latency Tester
 */
class LatencyTester {
  private measurements: LatencyMeasurement[] = [];

  /**
   * Measure latency to a target
   */
  async measureLatency(
    source: string,
    target: string,
    endpoint: string
  ): Promise<LatencyMeasurement> {
    const startTime = performance.now();
    let success = false;
    let error: string | undefined;

    try {
      // Simulate HTTP request (in production, use actual HTTP client)
      await this.simulateRequest(endpoint);
      success = true;
    } catch (err: any) {
      error = err.message;
    }

    const latency = performance.now() - startTime;

    const measurement: LatencyMeasurement = {
      location: source,
      target,
      latency,
      timestamp: Date.now(),
      success,
      error,
    };

    this.measurements.push(measurement);
    return measurement;
  }

  /**
   * Simulate network request
   */
  private async simulateRequest(endpoint: string): Promise<void> {
    // Simulate network delay based on geographic distance
    const baseLatency = 10;
    const variance = Math.random() * 20;
    const delay = baseLatency + variance;

    await new Promise((resolve) => setTimeout(resolve, delay));

    // Simulate occasional failures (2%)
    if (Math.random() < 0.02) {
      throw new Error('Network timeout');
    }
  }

  /**
   * Calculate statistics for measurements
   */
  calculateStats(location: string, target: string): LatencyStats {
    const filtered = this.measurements.filter(
      (m) => m.location === location && m.target === target && m.success
    );

    if (filtered.length === 0) {
      return {
        location,
        target,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        samples: 0,
        successRate: 0,
      };
    }

    const latencies = filtered.map((m) => m.latency).sort((a, b) => a - b);
    const total = this.measurements.filter(
      (m) => m.location === location && m.target === target
    ).length;

    return {
      location,
      target,
      min: latencies[0],
      max: latencies[latencies.length - 1],
      avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50: latencies[Math.floor(latencies.length * 0.5)],
      p95: latencies[Math.floor(latencies.length * 0.95)],
      p99: latencies[Math.floor(latencies.length * 0.99)],
      samples: latencies.length,
      successRate: latencies.length / total,
    };
  }

  /**
   * Get all measurements
   */
  getMeasurements(): LatencyMeasurement[] {
    return this.measurements;
  }

  /**
   * Clear measurements
   */
  clear(): void {
    this.measurements = [];
  }
}

/**
 * Geographic Distance Calculator
 */
class GeoCalculator {
  /**
   * Calculate distance between two points (Haversine formula)
   */
  static distance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Estimate latency from distance
   */
  static estimateLatency(distanceKm: number): number {
    // Speed of light in fiber: ~200,000 km/s
    // Round-trip time + routing overhead
    const lightSpeed = 200000; // km/s
    const rttMs = (distanceKm / lightSpeed) * 2 * 1000;
    const routingOverhead = 5; // ms
    return rttMs + routingOverhead;
  }
}

/**
 * Global Latency Benchmark
 */
class GlobalLatencyBenchmark {
  private tester: LatencyTester;
  private locations: EdgeLocation[];

  constructor(locations: EdgeLocation[]) {
    this.tester = new LatencyTester();
    this.locations = locations;
  }

  /**
   * Run comprehensive latency tests
   */
  async runBenchmark(iterations: number = 10): Promise<void> {
    console.log(`Running global latency benchmark (${iterations} iterations)...\n`);

    // Test from each location to every other location
    for (const source of this.locations) {
      for (const target of this.locations) {
        if (source.id === target.id) continue;

        console.log(`Testing ${source.name} -> ${target.name}...`);

        for (let i = 0; i < iterations; i++) {
          await this.tester.measureLatency(
            source.id,
            target.id,
            target.endpoint
          );
        }
      }
    }
  }

  /**
   * Generate latency matrix
   */
  generateLatencyMatrix(): Record<string, Record<string, LatencyStats>> {
    const matrix: Record<string, Record<string, LatencyStats>> = {};

    for (const source of this.locations) {
      matrix[source.id] = {};

      for (const target of this.locations) {
        if (source.id === target.id) continue;

        const stats = this.tester.calculateStats(source.id, target.id);
        matrix[source.id][target.id] = stats;
      }
    }

    return matrix;
  }

  /**
   * Find optimal edge location for a client location
   */
  findOptimalEdge(clientLat: number, clientLon: number): EdgeLocation {
    let bestLocation = this.locations[0];
    let bestScore = Infinity;

    for (const location of this.locations) {
      const distance = GeoCalculator.distance(
        clientLat,
        clientLon,
        location.latitude,
        location.longitude
      );

      const estimatedLatency = GeoCalculator.estimateLatency(distance);

      // Score based on estimated latency
      if (estimatedLatency < bestScore) {
        bestScore = estimatedLatency;
        bestLocation = location;
      }
    }

    return bestLocation;
  }

  /**
   * Analyze inter-region latency
   */
  analyzeInterRegionLatency(): Map<string, number> {
    const regionPairs = new Map<string, number[]>();

    for (const source of this.locations) {
      for (const target of this.locations) {
        if (source.id === target.id) continue;

        const key = [source.region, target.region].sort().join('-');
        const stats = this.tester.calculateStats(source.id, target.id);

        if (!regionPairs.has(key)) {
          regionPairs.set(key, []);
        }

        regionPairs.get(key)!.push(stats.avg);
      }
    }

    // Calculate average latency per region pair
    const avgLatencies = new Map<string, number>();
    for (const [pair, latencies] of regionPairs.entries()) {
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      avgLatencies.set(pair, avg);
    }

    return avgLatencies;
  }

  /**
   * Generate report
   */
  generateReport(): string {
    const matrix = this.generateLatencyMatrix();
    let report = '# Global Latency Report\n\n';

    report += '## Latency Matrix (P95 in ms)\n\n';
    report += 'Source \\ Target | ';
    report += this.locations.map((l) => l.name).join(' | ') + '\n';
    report += '---|' + this.locations.map(() => '---').join('|') + '\n';

    for (const source of this.locations) {
      report += source.name + ' | ';
      const values = this.locations.map((target) => {
        if (source.id === target.id) return '-';
        const stats = matrix[source.id]?.[target.id];
        return stats ? stats.p95.toFixed(1) : 'N/A';
      });
      report += values.join(' | ') + '\n';
    }

    report += '\n## Regional Analysis\n\n';
    const regionLatencies = this.analyzeInterRegionLatency();

    for (const [pair, latency] of regionLatencies.entries()) {
      report += `- ${pair}: ${latency.toFixed(1)} ms\n`;
    }

    report += '\n## Best Edge Locations for Major Cities\n\n';

    const cities = [
      { name: 'New York', lat: 40.7128, lon: -74.006 },
      { name: 'London', lat: 51.5074, lon: -0.1278 },
      { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
      { name: 'São Paulo', lat: -23.5505, lon: -46.6333 },
    ];

    for (const city of cities) {
      const best = this.findOptimalEdge(city.lat, city.lon);
      const distance = GeoCalculator.distance(
        city.lat,
        city.lon,
        best.latitude,
        best.longitude
      );
      const estimatedLatency = GeoCalculator.estimateLatency(distance);

      report += `- ${city.name}: ${best.name} (${distance.toFixed(0)} km, ~${estimatedLatency.toFixed(1)} ms)\n`;
    }

    return report;
  }
}

/**
 * Create sample edge locations
 */
function createGlobalEdgeLocations(): EdgeLocation[] {
  return [
    {
      id: 'us-east',
      name: 'US East (Virginia)',
      region: 'Americas',
      latitude: 37.4316,
      longitude: -78.6569,
      endpoint: 'https://us-east.edge.example.com',
    },
    {
      id: 'us-west',
      name: 'US West (California)',
      region: 'Americas',
      latitude: 37.3382,
      longitude: -121.8863,
      endpoint: 'https://us-west.edge.example.com',
    },
    {
      id: 'eu-west',
      name: 'EU West (Ireland)',
      region: 'Europe',
      latitude: 53.4129,
      longitude: -8.2439,
      endpoint: 'https://eu-west.edge.example.com',
    },
    {
      id: 'eu-central',
      name: 'EU Central (Frankfurt)',
      region: 'Europe',
      latitude: 50.1109,
      longitude: 8.6821,
      endpoint: 'https://eu-central.edge.example.com',
    },
    {
      id: 'ap-southeast',
      name: 'Asia Pacific (Singapore)',
      region: 'Asia',
      latitude: 1.3521,
      longitude: 103.8198,
      endpoint: 'https://ap-southeast.edge.example.com',
    },
    {
      id: 'ap-northeast',
      name: 'Asia Pacific (Tokyo)',
      region: 'Asia',
      latitude: 35.6762,
      longitude: 139.6503,
      endpoint: 'https://ap-northeast.edge.example.com',
    },
    {
      id: 'sa-east',
      name: 'South America (São Paulo)',
      region: 'Americas',
      latitude: -23.5505,
      longitude: -46.6333,
      endpoint: 'https://sa-east.edge.example.com',
    },
  ];
}

/**
 * Main benchmark execution
 */
async function main() {
  console.log('=== Global Edge Latency Benchmark ===\n');

  const locations = createGlobalEdgeLocations();
  const benchmark = new GlobalLatencyBenchmark(locations);

  console.log(`Testing ${locations.length} edge locations:\n`);
  for (const location of locations) {
    console.log(`- ${location.name} (${location.region})`);
  }
  console.log();

  // Run benchmark
  await benchmark.runBenchmark(20);

  // Generate and display report
  const report = benchmark.generateReport();
  console.log('\n' + report);

  // Additional analysis
  console.log('\n## Performance Summary\n');

  const matrix = benchmark.generateLatencyMatrix();
  const allStats: LatencyStats[] = [];

  for (const sourceId in matrix) {
    for (const targetId in matrix[sourceId]) {
      allStats.push(matrix[sourceId][targetId]);
    }
  }

  const avgLatencies = allStats.map((s) => s.avg);
  const p95Latencies = allStats.map((s) => s.p95);

  const globalAvg =
    avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length;
  const globalP95 =
    p95Latencies.reduce((a, b) => a + b, 0) / p95Latencies.length;

  console.log(`Global Average Latency: ${globalAvg.toFixed(1)} ms`);
  console.log(`Global P95 Latency: ${globalP95.toFixed(1)} ms`);
  console.log(
    `Success Rate: ${((allStats[0]?.successRate || 1) * 100).toFixed(1)}%`
  );

  // Find best and worst paths
  const sortedByLatency = allStats.sort((a, b) => b.avg - a.avg);

  console.log('\nFastest Paths:');
  for (let i = 0; i < Math.min(3, sortedByLatency.length); i++) {
    const stats = sortedByLatency[sortedByLatency.length - 1 - i];
    const source = locations.find((l) => l.id === stats.location);
    const target = locations.find((l) => l.id === stats.target);
    console.log(
      `  ${source?.name} -> ${target?.name}: ${stats.avg.toFixed(1)} ms`
    );
  }

  console.log('\nSlowest Paths:');
  for (let i = 0; i < Math.min(3, sortedByLatency.length); i++) {
    const stats = sortedByLatency[i];
    const source = locations.find((l) => l.id === stats.location);
    const target = locations.find((l) => l.id === stats.target);
    console.log(
      `  ${source?.name} -> ${target?.name}: ${stats.avg.toFixed(1)} ms`
    );
  }

  console.log('\n=== Benchmark Complete ===');
}

// Run benchmark
if (require.main === module) {
  main().catch(console.error);
}

export {
  LatencyTester,
  GlobalLatencyBenchmark,
  GeoCalculator,
  EdgeLocation,
  LatencyMeasurement,
  LatencyStats,
};
