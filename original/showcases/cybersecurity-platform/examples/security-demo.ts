/**
 * Cybersecurity Platform Demo
 *
 * Comprehensive demonstration of all security features:
 * - Network intrusion detection
 * - Malware analysis
 * - Threat hunting
 * - Incident response
 * - Vulnerability scanning
 */

import PacketAnalyzer from '../src/network/packet-analyzer';
import IntrusionDetector from '../src/detection/intrusion-detector';
import MalwareDetector from '../src/detection/malware-detector';
import ThreatIntelligence from '../src/threat/threat-intelligence';
import TrafficAnalyzer from '../src/analysis/traffic-analyzer';
import LogAnalyzer from '../src/forensics/log-analyzer';
import VulnerabilityScanner from '../src/vulnerability/scanner';
import CryptoAnalyzer from '../src/encryption/crypto-analyzer';
import FirewallRuleEngine from '../src/firewall/rule-engine';
import IncidentResponseOrchestrator from '../src/incident/response-orchestrator';

/**
 * Demo 1: Network Intrusion Detection
 */
async function demoIntrusionDetection() {
  console.log('\n=== Network Intrusion Detection Demo ===\n');

  const analyzer = new PacketAnalyzer({
    interface: 'eth0',
    promiscuous: true,
  });

  const ids = new IntrusionDetector({
    mode: 'hybrid',
    sensitivity: 'high',
    rulesets: ['emerging-threats'],
  });

  console.log('1. Capturing network packets...');
  const packets = await analyzer.capturePackets({
    count: 1000,
    timeout: 10,
  });

  console.log(`   Captured ${packets.length} packets`);

  console.log('\n2. Analyzing packets for intrusions...');
  await ids.loadRules('./rules/');

  const alerts = await ids.detectIntrusions(packets);
  console.log(`   Found ${alerts.length} potential intrusions`);

  for (const alert of alerts.slice(0, 5)) {
    console.log(`\n   [${alert.severity.toUpperCase()}] ${alert.signature}`);
    console.log(`   Source: ${alert.srcIP}:${alert.srcPort || 0}`);
    console.log(`   Destination: ${alert.dstIP}:${alert.dstPort || 0}`);
    console.log(`   Confidence: ${(alert.confidence * 100).toFixed(1)}%`);
  }

  console.log('\n3. Training anomaly detection model...');
  const trainingPackets = await analyzer.capturePackets({
    count: 10000,
    timeout: 30,
  });

  await ids.trainAnomalyModel(trainingPackets, {
    algorithm: 'isolation-forest',
    contamination: 0.01,
  });

  console.log('\n4. Detecting anomalies...');
  const testPackets = await analyzer.capturePackets({
    count: 1000,
    timeout: 10,
  });

  const anomalies = await ids.detectAnomalies(testPackets);
  console.log(`   Found ${anomalies.length} anomalies`);

  for (const anomaly of anomalies.slice(0, 3)) {
    console.log(`\n   Anomaly Score: ${anomaly.score.toFixed(3)}`);
    console.log(`   Type: ${anomaly.type}`);
    console.log(`   Description: ${anomaly.description}`);
  }

  console.log('\n5. Behavioral analysis...');
  const behavior = await ids.analyzeBehavior(packets, {
    windowSize: 60,
  });

  console.log(`   Port Scans: ${behavior.portScans.length}`);
  console.log(`   DDoS Attacks: ${behavior.ddosAttacks.length}`);
  console.log(`   Brute Force: ${behavior.bruteForceAttempts.length}`);

  if (behavior.portScans.length > 0) {
    const scan = behavior.portScans[0];
    console.log(`\n   Port Scan Detected:`);
    console.log(`   Source: ${scan.srcIP}`);
    console.log(`   Target: ${scan.targetIP}`);
    console.log(`   Ports Scanned: ${scan.ports.length}`);
    console.log(`   Confidence: ${(scan.confidence * 100).toFixed(1)}%`);
  }
}

/**
 * Demo 2: Malware Detection and Analysis
 */
async function demoMalwareAnalysis() {
  console.log('\n=== Malware Detection Demo ===\n');

  const detector = new MalwareDetector({
    engines: ['static', 'ml'],
    timeout: 300,
  });

  console.log('1. Analyzing suspicious file...');
  // In a real scenario, this would be an actual file path
  const sampleFile = './samples/suspicious.exe';

  try {
    const analysis = await detector.analyzeFile(sampleFile);

    console.log(`\n   File: ${analysis.filename}`);
    console.log(`   Size: ${analysis.size} bytes`);
    console.log(`   MD5: ${analysis.md5}`);
    console.log(`   SHA256: ${analysis.sha256}`);
    console.log(`   Type: ${analysis.fileType}`);
    console.log(`\n   Malware: ${analysis.isMalware ? 'YES' : 'NO'}`);
    console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);

    if (analysis.isMalware) {
      console.log(`   Family: ${analysis.malwareFamily || 'Unknown'}`);
      console.log(`   Type: ${analysis.malwareType || 'Unknown'}`);
    }

    console.log(`\n   Static Analysis:`);
    console.log(`   Entropy: ${analysis.static.entropy.toFixed(2)}`);
    console.log(`   Sections: ${analysis.static.sections.length}`);
    console.log(`   Imports: ${analysis.static.imports.length}`);
    console.log(`   Suspicious Strings: ${analysis.static.strings.suspicious.length}`);
    console.log(`   Anti-VM: ${analysis.static.antiVM ? 'YES' : 'NO'}`);
    console.log(`   Anti-Debug: ${analysis.static.antiDebug ? 'YES' : 'NO'}`);

    if (analysis.static.packers.length > 0) {
      console.log(`   Packers Detected: ${analysis.static.packers.join(', ')}`);
    }
  } catch (error) {
    console.log(`   (Demo mode: simulated analysis)`);
  }

  console.log('\n2. Training malware classifier...');
  const trainingData = await detector.loadTrainingData({
    malwarePath: './datasets/malware/',
    benignPath: './datasets/benign/',
  });

  await detector.trainClassifier(trainingData, {
    algorithm: 'random-forest',
    validation: 0.2,
  });

  console.log('\n3. Batch classification...');
  const files = ['./samples/file1.exe', './samples/file2.exe', './samples/file3.exe'];

  const results = await detector.classifyBatch(files);

  for (const result of results) {
    console.log(`\n   ${result.filepath}:`);
    console.log(`   Classification: ${result.classification}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  }
}

/**
 * Demo 3: Threat Intelligence and Hunting
 */
async function demoThreatIntelligence() {
  console.log('\n=== Threat Intelligence Demo ===\n');

  const threatIntel = new ThreatIntelligence({
    sources: ['misp', 'otx', 'threatconnect'],
    updateInterval: 3600,
  });

  console.log('1. Loading threat intelligence feeds...');
  await threatIntel.loadFeeds();

  const stats = await threatIntel.getStatistics();
  console.log(`   Total IOCs: ${stats.totalIOCs.toLocaleString()}`);
  console.log(`   Last Update: ${stats.lastUpdate.toISOString()}`);

  console.log('\n2. Checking IOCs...');
  const iocs = {
    ips: ['192.0.2.1', '198.51.100.1'],
    domains: ['malicious.example.com'],
    hashes: ['5f4dcc3b5aa765d61d8327deb882cf99'],
  };

  const matches = await threatIntel.checkIOCs(iocs);
  console.log(`   Matches Found: ${matches.length}`);

  for (const match of matches.slice(0, 3)) {
    console.log(`\n   IOC: ${match.value} (${match.type})`);
    if (match.threat) {
      console.log(`   Threat: ${match.threat.name}`);
      console.log(`   Severity: ${match.threat.severity}`);
      console.log(`   Category: ${match.threat.category}`);
    }
    console.log(`   Source: ${match.source}`);
    console.log(`   Confidence: ${(match.confidence * 100).toFixed(1)}%`);
  }

  console.log('\n3. Event correlation...');
  const events = [
    {
      eventId: 'E1',
      timestamp: Date.now(),
      type: 'phishing-email',
      severity: 'high' as const,
      source: 'email-gateway',
      data: { srcIP: '192.0.2.1' },
    },
    {
      eventId: 'E2',
      timestamp: Date.now() + 1000,
      type: 'malware-download',
      severity: 'high' as const,
      source: 'endpoint',
      data: { srcIP: '192.0.2.1' },
    },
    {
      eventId: 'E3',
      timestamp: Date.now() + 2000,
      type: 'c2-callback',
      severity: 'critical' as const,
      source: 'firewall',
      data: { dstIP: '198.51.100.1' },
    },
  ];

  const correlations = await threatIntel.correlateEvents(events, {
    timeWindow: 300,
    minEvents: 2,
  });

  console.log(`   Correlations Found: ${correlations.length}`);

  for (const correlation of correlations) {
    console.log(`\n   Attack Chain: ${correlation.attackChain}`);
    console.log(`   Confidence: ${(correlation.confidence * 100).toFixed(1)}%`);
    console.log(`   Events: ${correlation.events.length}`);
    console.log(`   MITRE Tactics: ${correlation.mitreTactics.join(', ')}`);
    console.log(`   MITRE Techniques: ${correlation.mitreTechniques.join(', ')}`);
  }

  console.log('\n4. Risk scoring...');
  const entity = { type: 'ip', value: '192.0.2.1' };
  const risk = await threatIntel.calculateRisk(entity);

  console.log(`\n   Entity: ${risk.entity}`);
  console.log(`   Risk Score: ${risk.score.toFixed(1)}/100`);
  console.log(`   Risk Level: ${risk.level.toUpperCase()}`);
  console.log(`\n   Risk Factors:`);
  for (const factor of risk.factors) {
    console.log(`   - ${factor.name}: ${factor.value.toFixed(1)} (weight: ${factor.weight})`);
  }
  console.log(`\n   Recommendations:`);
  for (const rec of risk.recommendations) {
    console.log(`   - ${rec}`);
  }
}

/**
 * Demo 4: Complete Security Platform
 */
async function demoFullPlatform() {
  console.log('\n=== Full Security Platform Demo ===\n');

  console.log('1. Initializing security components...');
  const packetAnalyzer = new PacketAnalyzer({ interface: 'eth0' });
  const ids = new IntrusionDetector({
    mode: 'hybrid',
    sensitivity: 'high',
    rulesets: ['emerging-threats'],
  });
  const threatIntel = new ThreatIntelligence({
    sources: ['misp', 'otx'],
  });
  const trafficAnalyzer = new TrafficAnalyzer();
  const scanner = new VulnerabilityScanner({
    databases: ['nvd', 'exploit-db'],
  });
  const firewall = new FirewallRuleEngine({
    defaultPolicy: 'deny',
    stateful: true,
  });
  const soar = new IncidentResponseOrchestrator({
    playbooks: './playbooks/',
    integrations: ['siem', 'edr'],
  });

  console.log('\n2. Monitoring network traffic...');
  const packets = await packetAnalyzer.capturePackets({ count: 1000 });
  const trafficStats = await trafficAnalyzer.analyzeTraffic(packets);

  console.log(`   Packets: ${trafficStats.totalPackets.toLocaleString()}`);
  console.log(`   Bytes: ${trafficStats.totalBytes.toLocaleString()}`);
  console.log(`   Average Rate: ${trafficStats.averageRate.toFixed(0)} packets/sec`);
  console.log(`   Peak Rate: ${trafficStats.peakRate.toFixed(0)} packets/sec`);

  console.log('\n3. Detecting threats...');
  await ids.loadRules('./rules/');
  const alerts = await ids.detectIntrusions(packets);

  console.log(`   Intrusion Alerts: ${alerts.length}`);

  if (alerts.length > 0) {
    const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
    console.log(`   Critical Alerts: ${criticalAlerts.length}`);

    for (const alert of criticalAlerts.slice(0, 3)) {
      console.log(`\n   Creating incident for: ${alert.signature}`);

      const incident = await soar.createIncident({
        title: alert.signature,
        severity: alert.severity,
        description: alert.description,
        indicators: {
          srcIP: alert.srcIP,
          dstIP: alert.dstIP,
        },
      });

      console.log(`   Incident ID: ${incident.incidentId}`);

      // Auto-block malicious IP
      await firewall.blockHost(alert.srcIP);
      console.log(`   Blocked IP: ${alert.srcIP}`);
    }
  }

  console.log('\n4. Vulnerability assessment...');
  const scanResults = await scanner.scanNetwork({
    targets: ['192.168.1.0/24'],
    ports: 'common',
  });

  console.log(`   Hosts Scanned: ${scanResults.hostsScanned}`);
  console.log(`   Vulnerabilities Found: ${scanResults.summary.totalVulnerabilities}`);
  console.log(`   Critical: ${scanResults.summary.criticalVulnerabilities}`);
  console.log(`   High: ${scanResults.summary.highVulnerabilities}`);

  console.log('\n5. Generating security report...');
  const report = await trafficAnalyzer.generateReport(packets);

  console.log(`\n   === Security Report ===`);
  console.log(`   Generated: ${report.generatedAt}`);
  console.log(`   Duration: ${report.summary.duration.toFixed(1)}s`);
  console.log(`   Total Packets: ${report.summary.totalPackets.toLocaleString()}`);
  console.log(`   Total Bytes: ${report.summary.totalBytes.toLocaleString()}`);
  console.log(`   Flows: ${report.flows.total}`);
  console.log(`   Traffic Entropy: ${report.entropy.toFixed(2)}`);

  console.log('\n   Top Protocols:`);
  const protocols = Object.entries(report.protocols)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);

  for (const [protocol, count] of protocols) {
    console.log(`   - ${protocol}: ${count}`);
  }

  console.log('\n=== Demo Complete ===\n');
}

/**
 * Main demo runner
 */
async function main() {
  const args = process.argv.slice(2);
  const demo = args[0] || 'full';

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Cybersecurity Platform - Elide Polyglot Showcase            ║');
  console.log('║   TypeScript + Python (Scapy, scikit-learn, Pandas)           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  try {
    switch (demo) {
      case 'intrusion':
        await demoIntrusionDetection();
        break;
      case 'malware':
        await demoMalwareAnalysis();
        break;
      case 'hunting':
        await demoThreatIntelligence();
        break;
      case 'full':
        await demoFullPlatform();
        break;
      default:
        console.log('Unknown demo:', demo);
        console.log('Available demos: intrusion, malware, hunting, full');
    }
  } catch (error) {
    console.error('Demo error:', error);
    process.exit(1);
  }
}

// Run demo
if (require.main === module) {
  main().catch(console.error);
}

export { demoIntrusionDetection, demoMalwareAnalysis, demoThreatIntelligence, demoFullPlatform };
