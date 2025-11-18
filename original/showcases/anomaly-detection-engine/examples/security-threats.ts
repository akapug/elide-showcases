/**
 * Security Threat Detection Example
 * Detect suspicious network activity and potential security breaches.
 */

import { ModelManager } from '../core/model-manager.js';
import { RealtimeScorer } from '../core/scorer.js';
import { AlertManager } from '../core/alert-manager.js';
import { Event } from '../core/event-buffer.js';

interface NetworkEvent {
  timestamp: number;
  sourceIp: string;
  destinationIp: string;
  port: number;
  packetSize: number;
  connectionDuration: number;
  requestsPerMinute: number;
  failedLogins: number;
  dataTransferred: number;
}

class SecurityMonitor {
  private modelManager: ModelManager;
  private scorer: RealtimeScorer;
  private alertManager: AlertManager;

  constructor() {
    this.modelManager = new ModelManager('./models');
    this.scorer = new RealtimeScorer(this.modelManager, 100);
    this.alertManager = new AlertManager();

    this.configureSecurityAlerts();
  }

  async initialize(): Promise<void> {
    console.log('🔒 Security Threat Detection System');
    console.log('='.repeat(80));
    console.log('Initializing...\n');

    await this.modelManager.initialize();

    // Generate training data from normal network traffic
    console.log('Analyzing normal network traffic patterns...');
    const trainingData = this.generateNormalTraffic(2000);

    // Train model
    console.log('Training threat detection model...');
    const metadata = await this.modelManager.trainModel(
      'isolation_forest',
      trainingData,
      { contamination: 0.02 } // Expect 2% anomalies in security
    );

    console.log(`Model trained: ${metadata.nSamples} samples`);
    console.log(`Training time: ${metadata.performance?.trainingTime.toFixed(0)}ms\n`);

    await this.modelManager.loadModel('isolation_forest');
  }

  async monitorNetwork(): Promise<void> {
    console.log('Starting real-time network monitoring...\n');
    console.log('='.repeat(80));

    let eventCount = 0;
    let threatCount = 0;
    const threats: Array<{ type: string; event: NetworkEvent; score: number }> = [];

    // Listen for critical security alerts
    this.alertManager.on('alert', (alert) => {
      if (alert.severity === 'critical') {
        console.log(`\n🚨 SECURITY ALERT: ${alert.message}`);
        console.log(`   Threat Level: ${alert.severity.toUpperCase()}`);
        console.log(`   Confidence: ${(alert.confidence * 100).toFixed(1)}%`);
        console.log(`   Immediate action required!\n`);
      }
    });

    // Simulate network monitoring
    const duration = 20000;
    const interval = 100;
    const startTime = Date.now();

    console.log('Monitoring network activity...\n');

    while (Date.now() - startTime < duration) {
      // Generate network events
      let networkEvent: NetworkEvent;

      // Randomly inject different types of attacks
      const rand = Math.random();

      if (rand < 0.05) {
        // DDoS attack
        networkEvent = this.simulateDDoS();
        threats.push({ type: 'DDoS', event: networkEvent, score: 0 });
      } else if (rand < 0.08) {
        // Port scanning
        networkEvent = this.simulatePortScan();
        threats.push({ type: 'Port Scan', event: networkEvent, score: 0 });
      } else if (rand < 0.10) {
        // Brute force login
        networkEvent = this.simulateBruteForce();
        threats.push({ type: 'Brute Force', event: networkEvent, score: 0 });
      } else if (rand < 0.12) {
        // Data exfiltration
        networkEvent = this.simulateDataExfiltration();
        threats.push({ type: 'Data Exfiltration', event: networkEvent, score: 0 });
      } else {
        // Normal traffic
        networkEvent = this.generateNormalEvent();
      }

      // Convert to detection event
      const event = this.networkEventToEvent(networkEvent);

      try {
        const result = await this.scorer.scoreEvent(event);

        if (result.isAnomaly) {
          threatCount++;

          // Update threat score if this was a simulated attack
          if (threats.length > 0 && threats[threats.length - 1].score === 0) {
            threats[threats.length - 1].score = result.score;
          }
        }

        eventCount++;

        // Process alert
        await this.alertManager.processResult(result);

        // Display status
        if (eventCount % 20 === 0) {
          const stats = this.scorer.getStats();
          process.stdout.write(
            `\r📊 Events: ${eventCount} | Threats: ${threatCount} | ` +
            `Detection Rate: ${(threatCount / eventCount * 100).toFixed(1)}% | ` +
            `Latency: ${stats.avgLatencyMs.toFixed(1)}ms`
          );
        }
      } catch (error: any) {
        console.error(`\nError processing event:`, error.message);
      }

      await this.sleep(interval);
    }

    console.log('\n\n' + '='.repeat(80));
    this.printSummary(eventCount, threatCount, threats);
  }

  networkEventToEvent(networkEvent: NetworkEvent): Event {
    return {
      id: `net_${networkEvent.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: networkEvent.timestamp,
      features: [
        networkEvent.packetSize,
        networkEvent.connectionDuration,
        networkEvent.requestsPerMinute,
        networkEvent.failedLogins,
        networkEvent.dataTransferred,
        this.portToFeature(networkEvent.port)
      ],
      metadata: {
        sourceIp: networkEvent.sourceIp,
        destinationIp: networkEvent.destinationIp,
        port: networkEvent.port
      }
    };
  }

  generateNormalEvent(): NetworkEvent {
    return {
      timestamp: Date.now(),
      sourceIp: this.randomIp(),
      destinationIp: this.randomIp(),
      port: this.randomNormalPort(),
      packetSize: this.randomNormal(500, 200),
      connectionDuration: this.randomNormal(5000, 2000),
      requestsPerMinute: this.randomNormal(10, 5),
      failedLogins: 0,
      dataTransferred: this.randomNormal(50000, 20000)
    };
  }

  simulateDDoS(): NetworkEvent {
    return {
      timestamp: Date.now(),
      sourceIp: this.randomIp(),
      destinationIp: '192.168.1.100',
      port: 80,
      packetSize: this.randomNormal(64, 10),        // Small packets
      connectionDuration: this.randomNormal(100, 50), // Short connections
      requestsPerMinute: this.randomNormal(1000, 200), // High request rate
      failedLogins: 0,
      dataTransferred: this.randomNormal(5000, 1000)
    };
  }

  simulatePortScan(): NetworkEvent {
    return {
      timestamp: Date.now(),
      sourceIp: this.randomIp(),
      destinationIp: '192.168.1.100',
      port: Math.floor(Math.random() * 65535),      // Random ports
      packetSize: this.randomNormal(40, 5),          // Minimal packets
      connectionDuration: this.randomNormal(50, 20), // Very short
      requestsPerMinute: this.randomNormal(500, 100), // Many different ports
      failedLogins: 0,
      dataTransferred: this.randomNormal(100, 50)    // Minimal data
    };
  }

  simulateBruteForce(): NetworkEvent {
    return {
      timestamp: Date.now(),
      sourceIp: this.randomIp(),
      destinationIp: '192.168.1.100',
      port: 22, // SSH
      packetSize: this.randomNormal(300, 50),
      connectionDuration: this.randomNormal(2000, 500),
      requestsPerMinute: this.randomNormal(100, 20),
      failedLogins: Math.floor(this.randomNormal(50, 10)), // Many failed attempts
      dataTransferred: this.randomNormal(10000, 2000)
    };
  }

  simulateDataExfiltration(): NetworkEvent {
    return {
      timestamp: Date.now(),
      sourceIp: '192.168.1.50', // Internal
      destinationIp: this.randomIp(), // External
      port: 443,
      packetSize: this.randomNormal(1500, 100),
      connectionDuration: this.randomNormal(60000, 10000), // Long connection
      requestsPerMinute: this.randomNormal(5, 2),
      failedLogins: 0,
      dataTransferred: this.randomNormal(500000, 100000)  // Large data transfer
    };
  }

  generateNormalTraffic(nSamples: number): number[][] {
    return Array.from({ length: nSamples }, () => {
      const event = this.generateNormalEvent();
      return [
        event.packetSize,
        event.connectionDuration,
        event.requestsPerMinute,
        event.failedLogins,
        event.dataTransferred,
        this.portToFeature(event.port)
      ];
    });
  }

  configureSecurityAlerts(): void {
    this.alertManager.addRule({
      id: 'security_critical',
      name: 'Critical Security Threat',
      enabled: true,
      scoreThreshold: 0.9,
      confidenceThreshold: 0.8,
      severity: 'critical',
      cooldownMs: 10000 // 10 seconds for security
    });

    this.alertManager.addRule({
      id: 'security_high',
      name: 'High Security Risk',
      enabled: true,
      scoreThreshold: 0.7,
      confidenceThreshold: 0.7,
      severity: 'high',
      cooldownMs: 30000
    });

    this.alertManager.addChannel({
      type: 'log',
      enabled: true,
      config: {}
    });
  }

  printSummary(eventCount: number, threatCount: number, threats: any[]): void {
    console.log('SECURITY MONITORING SUMMARY');
    console.log('='.repeat(80));

    const stats = this.scorer.getStats();
    const alertStats = this.alertManager.getStats();

    console.log(`Total Events Analyzed: ${eventCount.toLocaleString()}`);
    console.log(`Threats Detected:      ${threatCount} (${(threatCount / eventCount * 100).toFixed(2)}%)`);
    console.log(`Average Latency:       ${stats.avgLatencyMs.toFixed(2)}ms`);
    console.log(`\nAlert Summary:`);
    console.log(`  Total Alerts:        ${alertStats.total}`);
    console.log(`  Critical:            ${alertStats.bySeverity.critical}`);
    console.log(`  High:                ${alertStats.bySeverity.high}`);

    console.log(`\nThreat Types Detected:`);
    const threatTypes = threats.reduce((acc: any, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});

    for (const [type, count] of Object.entries(threatTypes)) {
      console.log(`  ${type}: ${count}`);
    }

    console.log('='.repeat(80));
    console.log('\n✅ Security monitoring complete!');
  }

  randomIp(): string {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.` +
           `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  randomNormalPort(): number {
    const common = [80, 443, 22, 21, 25, 3306, 5432];
    return common[Math.floor(Math.random() * common.length)];
  }

  portToFeature(port: number): number {
    // Normalize port number to 0-1 range
    return port / 65535;
  }

  randomNormal(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, mean + z * std);
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run example
async function main() {
  const monitor = new SecurityMonitor();

  try {
    await monitor.initialize();
    await monitor.monitorNetwork();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
