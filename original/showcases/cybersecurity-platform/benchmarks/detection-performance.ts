/**
 * Performance Benchmarks
 *
 * Comprehensive performance testing for cybersecurity platform:
 * - Packet analysis throughput
 * - Intrusion detection speed
 * - Malware classification performance
 * - Threat intelligence lookups
 * - Overall system benchmarks
 */

import PacketAnalyzer from '../src/network/packet-analyzer';
import IntrusionDetector from '../src/detection/intrusion-detector';
import MalwareDetector from '../src/detection/malware-detector';
import ThreatIntelligence from '../src/threat/threat-intelligence';
import TrafficAnalyzer from '../src/analysis/traffic-analyzer';

import type { BenchmarkResult, NetworkPacket } from '../src/types';

/**
 * Benchmark packet analysis
 */
async function benchmarkPacketAnalysis(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  const analyzer = new PacketAnalyzer({ interface: 'eth0' });

  // Generate test packets
  const packets = generateTestPackets(100000);

  console.log('Benchmarking Packet Analysis...');

  // Benchmark: Packet capture
  const captureStart = Date.now();
  await analyzer.capturePackets({ count: 100000, timeout: 60 });
  const captureTime = Date.now() - captureStart;

  results.push({
    name: 'Packet Capture',
    description: '100K packet capture',
    iterations: 1,
    totalTime: captureTime,
    averageTime: captureTime,
    minTime: captureTime,
    maxTime: captureTime,
    throughput: 100000 / (captureTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  // Benchmark: Deep packet inspection
  const dpiStart = Date.now();
  await analyzer.analyzePackets(packets);
  const dpiTime = Date.now() - dpiStart;

  results.push({
    name: 'Deep Packet Inspection',
    description: '100K packet analysis',
    iterations: 1,
    totalTime: dpiTime,
    averageTime: dpiTime,
    minTime: dpiTime,
    maxTime: dpiTime,
    throughput: 100000 / (dpiTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  // Benchmark: Protocol parsing
  const parseStart = Date.now();
  await analyzer.extractHTTPFlows(packets);
  await analyzer.extractDNSQueries(packets);
  const parseTime = Date.now() - parseStart;

  results.push({
    name: 'Protocol Parsing',
    description: 'HTTP/DNS extraction',
    iterations: 1,
    totalTime: parseTime,
    averageTime: parseTime,
    minTime: parseTime,
    maxTime: parseTime,
    throughput: 100000 / (parseTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  return results;
}

/**
 * Benchmark intrusion detection
 */
async function benchmarkIntrusionDetection(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  const ids = new IntrusionDetector({
    mode: 'hybrid',
    sensitivity: 'high',
    rulesets: ['emerging-threats'],
  });

  const packets = generateTestPackets(100000);

  console.log('Benchmarking Intrusion Detection...');

  // Load rules
  await ids.loadRules('./rules/');

  // Benchmark: Signature matching
  const sigStart = Date.now();
  await ids.detectIntrusions(packets.slice(0, 10000));
  const sigTime = Date.now() - sigStart;

  results.push({
    name: 'Signature Matching',
    description: '10K packets',
    iterations: 1,
    totalTime: sigTime,
    averageTime: sigTime,
    minTime: sigTime,
    maxTime: sigTime,
    throughput: 10000 / (sigTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  // Benchmark: Anomaly detection training
  const trainStart = Date.now();
  await ids.trainAnomalyModel(packets, {
    algorithm: 'isolation-forest',
    contamination: 0.01,
  });
  const trainTime = Date.now() - trainStart;

  results.push({
    name: 'Anomaly Model Training',
    description: '100K training samples',
    iterations: 1,
    totalTime: trainTime,
    averageTime: trainTime,
    minTime: trainTime,
    maxTime: trainTime,
    throughput: 100000 / (trainTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  // Benchmark: Anomaly detection
  const anomalyStart = Date.now();
  await ids.detectAnomalies(packets.slice(0, 10000));
  const anomalyTime = Date.now() - anomalyStart;

  results.push({
    name: 'Anomaly Detection',
    description: '10K packets',
    iterations: 1,
    totalTime: anomalyTime,
    averageTime: anomalyTime,
    minTime: anomalyTime,
    maxTime: anomalyTime,
    throughput: 10000 / (anomalyTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  // Benchmark: Behavioral analysis
  const behaviorStart = Date.now();
  await ids.analyzeBehavior(packets.slice(0, 10000), { windowSize: 60 });
  const behaviorTime = Date.now() - behaviorStart;

  results.push({
    name: 'Behavioral Analysis',
    description: '10K packets',
    iterations: 1,
    totalTime: behaviorTime,
    averageTime: behaviorTime,
    minTime: behaviorTime,
    maxTime: behaviorTime,
    throughput: 10000 / (behaviorTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  return results;
}

/**
 * Benchmark malware detection
 */
async function benchmarkMalwareDetection(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  const detector = new MalwareDetector({
    engines: ['static', 'ml'],
    timeout: 300,
  });

  console.log('Benchmarking Malware Detection...');

  // Train classifier
  const trainingData = await detector.loadTrainingData({
    malwarePath: './datasets/malware/',
    benignPath: './datasets/benign/',
  });

  await detector.trainClassifier(trainingData, {
    algorithm: 'random-forest',
  });

  // Generate test files
  const testFiles = Array.from({ length: 1000 }, (_, i) => `./samples/test${i}.exe`);

  // Benchmark: Batch classification
  const classifyStart = Date.now();
  await detector.classifyBatch(testFiles);
  const classifyTime = Date.now() - classifyStart;

  results.push({
    name: 'ML Classification',
    description: '1000 files',
    iterations: 1,
    totalTime: classifyTime,
    averageTime: classifyTime / 1000,
    minTime: classifyTime / 1000,
    maxTime: classifyTime / 1000,
    throughput: 1000 / (classifyTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  return results;
}

/**
 * Benchmark threat intelligence
 */
async function benchmarkThreatIntelligence(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  const threatIntel = new ThreatIntelligence({
    sources: ['misp', 'otx'],
  });

  console.log('Benchmarking Threat Intelligence...');

  // Load feeds
  await threatIntel.loadFeeds();

  // Generate test IOCs
  const testIPs = Array.from({ length: 100000 }, (_, i) => `192.168.${Math.floor(i / 256)}.${i % 256}`);

  // Benchmark: IOC lookups
  const lookupStart = Date.now();
  await threatIntel.checkIOCs({ ips: testIPs });
  const lookupTime = Date.now() - lookupStart;

  results.push({
    name: 'IOC Hash Lookup',
    description: '100K lookups',
    iterations: 1,
    totalTime: lookupTime,
    averageTime: lookupTime / 100000,
    minTime: lookupTime / 100000,
    maxTime: lookupTime / 100000,
    throughput: 100000 / (lookupTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  // Benchmark: Event correlation
  const events = Array.from({ length: 10000 }, (_, i) => ({
    eventId: `E${i}`,
    timestamp: Date.now() + i * 1000,
    type: 'test-event',
    severity: 'medium' as const,
    source: 'test',
    data: {},
  }));

  const correlationStart = Date.now();
  await threatIntel.correlateEvents(events);
  const correlationTime = Date.now() - correlationStart;

  results.push({
    name: 'Threat Correlation',
    description: '10K events',
    iterations: 1,
    totalTime: correlationTime,
    averageTime: correlationTime,
    minTime: correlationTime,
    maxTime: correlationTime,
    throughput: 10000 / (correlationTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  return results;
}

/**
 * Benchmark network analysis
 */
async function benchmarkNetworkAnalysis(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  const analyzer = new TrafficAnalyzer();
  const packets = generateTestPackets(100000);

  console.log('Benchmarking Network Analysis...');

  // Benchmark: Flow extraction
  const flowStart = Date.now();
  await analyzer.extractFlows(packets);
  const flowTime = Date.now() - flowStart;

  results.push({
    name: 'Flow Extraction',
    description: '100K packets',
    iterations: 1,
    totalTime: flowTime,
    averageTime: flowTime,
    minTime: flowTime,
    maxTime: flowTime,
    throughput: 100000 / (flowTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  // Benchmark: Bandwidth analysis
  const bwStart = Date.now();
  await analyzer.analyzeBandwidth(packets, { interval: 1 });
  const bwTime = Date.now() - bwStart;

  results.push({
    name: 'Bandwidth Analysis',
    description: '100K packets',
    iterations: 1,
    totalTime: bwTime,
    averageTime: bwTime,
    minTime: bwTime,
    maxTime: bwTime,
    throughput: 100000 / (bwTime / 1000),
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
  });

  return results;
}

/**
 * Generate test packets
 */
function generateTestPackets(count: number): NetworkPacket[] {
  const packets: NetworkPacket[] = [];
  const protocols = ['TCP', 'UDP', 'ICMP'];
  const baseTime = Date.now() / 1000;

  for (let i = 0; i < count; i++) {
    packets.push({
      timestamp: baseTime + i * 0.001,
      length: 64 + Math.floor(Math.random() * 1436),
      captureLength: 1500,
      protocol: protocols[i % protocols.length],
      srcIP: `192.168.${Math.floor(i / 256)}.${i % 256}`,
      dstIP: `10.0.${Math.floor(i / 256)}.${i % 256}`,
      srcPort: 1024 + (i % 64512),
      dstPort: 80 + (i % 100),
      flags: ['SYN', 'ACK'],
      layers: [],
    });
  }

  return packets;
}

/**
 * Print benchmark results
 */
function printResults(category: string, results: BenchmarkResult[]) {
  console.log(`\n${category}:`);
  console.log('─'.repeat(80));

  for (const result of results) {
    const throughputStr = result.throughput >= 1000
      ? `${(result.throughput / 1000).toFixed(2)}K`
      : result.throughput.toFixed(0);

    console.log(`  ${result.name.padEnd(35)} ${result.totalTime.toFixed(0).padStart(6)}ms   ${throughputStr.padStart(10)} ops/sec`);
  }
}

/**
 * Main benchmark runner
 */
async function main() {
  const args = process.argv.slice(2);
  const benchmark = args[0] || 'all';

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         Cybersecurity Platform Performance Benchmarks         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

  try {
    if (benchmark === 'packets' || benchmark === 'all') {
      const results = await benchmarkPacketAnalysis();
      printResults('Packet Analysis', results);
    }

    if (benchmark === 'detection' || benchmark === 'all') {
      const results = await benchmarkIntrusionDetection();
      printResults('Intrusion Detection', results);
    }

    if (benchmark === 'malware' || benchmark === 'all') {
      const results = await benchmarkMalwareDetection();
      printResults('Malware Detection', results);
    }

    if (benchmark === 'all') {
      const threatResults = await benchmarkThreatIntelligence();
      printResults('Threat Intelligence', threatResults);

      const networkResults = await benchmarkNetworkAnalysis();
      printResults('Network Analysis', networkResults);
    }

    const totalTime = (Date.now() - startTime) / 1000;
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const memoryDelta = endMemory - startMemory;

    console.log('\n' + '═'.repeat(80));
    console.log(`Overall Performance:`);
    console.log(`  Memory Usage: ${endMemory.toFixed(0)} MB (Δ ${memoryDelta >= 0 ? '+' : ''}${memoryDelta.toFixed(0)} MB)`);
    console.log(`  CPU Usage: ${process.cpuUsage().user / 1000000}s user, ${process.cpuUsage().system / 1000000}s system`);
    console.log(`  Total Processing Time: ${totalTime.toFixed(1)}s`);
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('Benchmark error:', error);
    process.exit(1);
  }
}

// Run benchmarks
if (require.main === module) {
  main().catch(console.error);
}

export {
  benchmarkPacketAnalysis,
  benchmarkIntrusionDetection,
  benchmarkMalwareDetection,
  benchmarkThreatIntelligence,
  benchmarkNetworkAnalysis,
};
