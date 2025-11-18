/**
 * IoT Device Monitoring Example
 * Monitor sensor data from IoT devices and detect anomalies in real-time.
 */

import { ModelManager } from '../core/model-manager.js';
import { RealtimeScorer } from '../core/scorer.js';
import { AlertManager } from '../core/alert-manager.js';
import { Event } from '../core/event-buffer.js';

interface SensorReading {
  deviceId: string;
  timestamp: number;
  temperature: number;
  humidity: number;
  pressure: number;
  vibration: number;
  powerConsumption: number;
}

class IoTMonitor {
  private modelManager: ModelManager;
  private scorer: RealtimeScorer;
  private alertManager: AlertManager;
  private deviceBaselines: Map<string, number[]> = new Map();

  constructor() {
    this.modelManager = new ModelManager('./models');
    this.scorer = new RealtimeScorer(this.modelManager, 100);
    this.alertManager = new AlertManager();

    // Configure alerts for IoT monitoring
    this.configureAlerts();
  }

  async initialize(): Promise<void> {
    console.log('🌐 IoT Device Monitoring System');
    console.log('='.repeat(80));
    console.log('Initializing...\n');

    await this.modelManager.initialize();

    // Generate training data from normal device operation
    console.log('Collecting baseline data from devices...');
    const trainingData = this.generateNormalDeviceData(1000);

    // Train model
    console.log('Training anomaly detection model...');
    const metadata = await this.modelManager.trainModel(
      'isolation_forest',
      trainingData,
      { contamination: 0.05 } // Expect 5% anomalies in IoT
    );

    console.log(`Model trained: ${metadata.nSamples} samples, ${metadata.nFeatures} features`);
    console.log(`Training time: ${metadata.performance?.trainingTime.toFixed(0)}ms\n`);

    await this.modelManager.loadModel('isolation_forest');
  }

  async monitorDevices(): Promise<void> {
    console.log('Starting real-time monitoring...\n');
    console.log('='.repeat(80));

    const devices = ['sensor-001', 'sensor-002', 'sensor-003', 'sensor-004'];
    let readingCount = 0;
    let anomalyCount = 0;

    // Listen for alerts
    this.alertManager.on('alert', (alert) => {
      console.log(`\n🚨 ALERT: ${alert.severity.toUpperCase()}`);
      console.log(`   ${alert.message}`);
      console.log(`   Event ID: ${alert.eventId}`);
      console.log(`   Confidence: ${(alert.confidence * 100).toFixed(1)}%\n`);
    });

    // Simulate monitoring for 30 seconds
    const duration = 30000;
    const interval = 1000; // Read every second
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      // Generate readings from all devices
      for (const deviceId of devices) {
        const reading = this.generateSensorReading(deviceId);

        // Occasionally inject anomalies for demonstration
        if (Math.random() < 0.05) {
          this.injectAnomaly(reading);
        }

        // Convert to event
        const event = this.sensorReadingToEvent(reading);

        // Score in real-time
        try {
          const result = await this.scorer.scoreEvent(event);

          if (result.isAnomaly) {
            anomalyCount++;
          }

          readingCount++;

          // Process alert
          await this.alertManager.processResult(result);

          // Display status
          if (readingCount % 10 === 0) {
            const stats = this.scorer.getStats();
            process.stdout.write(
              `\r📊 Readings: ${readingCount} | Anomalies: ${anomalyCount} | ` +
              `Avg Latency: ${stats.avgLatencyMs.toFixed(1)}ms`
            );
          }
        } catch (error: any) {
          console.error(`\nError processing ${deviceId}:`, error.message);
        }
      }

      await this.sleep(interval);
    }

    console.log('\n\n' + '='.repeat(80));
    this.printSummary(readingCount, anomalyCount);
  }

  sensorReadingToEvent(reading: SensorReading): Event {
    return {
      id: `${reading.deviceId}_${reading.timestamp}`,
      timestamp: reading.timestamp,
      features: [
        reading.temperature,
        reading.humidity,
        reading.pressure,
        reading.vibration,
        reading.powerConsumption
      ],
      metadata: {
        deviceId: reading.deviceId,
        type: 'sensor_reading'
      }
    };
  }

  generateSensorReading(deviceId: string): SensorReading {
    // Normal operating ranges
    return {
      deviceId,
      timestamp: Date.now(),
      temperature: this.randomNormal(22, 2),      // 22°C ± 2°C
      humidity: this.randomNormal(50, 10),        // 50% ± 10%
      pressure: this.randomNormal(1013, 5),       // 1013 hPa ± 5
      vibration: this.randomNormal(0.5, 0.2),     // Low vibration
      powerConsumption: this.randomNormal(100, 10) // 100W ± 10W
    };
  }

  injectAnomaly(reading: SensorReading): void {
    const type = Math.floor(Math.random() * 4);

    switch (type) {
      case 0: // Overheating
        reading.temperature = this.randomNormal(45, 5);
        reading.powerConsumption *= 1.5;
        break;
      case 1: // High vibration (mechanical issue)
        reading.vibration = this.randomNormal(3, 0.5);
        break;
      case 2: // Pressure anomaly
        reading.pressure = this.randomNormal(950, 10);
        break;
      case 3: // Power spike
        reading.powerConsumption = this.randomNormal(200, 20);
        break;
    }
  }

  generateNormalDeviceData(nSamples: number): number[][] {
    return Array.from({ length: nSamples }, () => [
      this.randomNormal(22, 2),
      this.randomNormal(50, 10),
      this.randomNormal(1013, 5),
      this.randomNormal(0.5, 0.2),
      this.randomNormal(100, 10)
    ]);
  }

  configureAlerts(): void {
    // Critical alert for severe anomalies
    this.alertManager.addRule({
      id: 'iot_critical',
      name: 'Critical IoT Anomaly',
      enabled: true,
      scoreThreshold: 0.8,
      confidenceThreshold: 0.7,
      severity: 'critical',
      cooldownMs: 30000 // 30 seconds
    });

    // High alert for significant deviations
    this.alertManager.addRule({
      id: 'iot_high',
      name: 'High IoT Anomaly',
      enabled: true,
      scoreThreshold: 0.6,
      confidenceThreshold: 0.6,
      severity: 'high',
      cooldownMs: 60000 // 1 minute
    });

    // Log channel
    this.alertManager.addChannel({
      type: 'log',
      enabled: true,
      config: {}
    });
  }

  printSummary(readingCount: number, anomalyCount: number): void {
    console.log('MONITORING SUMMARY');
    console.log('='.repeat(80));

    const stats = this.scorer.getStats();
    const alertStats = this.alertManager.getStats();

    console.log(`Total Readings:        ${readingCount.toLocaleString()}`);
    console.log(`Anomalies Detected:    ${anomalyCount} (${(anomalyCount / readingCount * 100).toFixed(2)}%)`);
    console.log(`Average Latency:       ${stats.avgLatencyMs.toFixed(2)}ms`);
    console.log(`Max Latency:           ${stats.maxLatencyMs.toFixed(2)}ms`);
    console.log(`\nAlerts Generated:      ${alertStats.total}`);
    console.log(`  Critical:            ${alertStats.bySeverity.critical}`);
    console.log(`  High:                ${alertStats.bySeverity.high}`);
    console.log(`  Medium:              ${alertStats.bySeverity.medium}`);
    console.log(`  Low:                 ${alertStats.bySeverity.low}`);
    console.log('='.repeat(80));

    console.log('\n✅ IoT monitoring complete!');
  }

  randomNormal(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run example
async function main() {
  const monitor = new IoTMonitor();

  try {
    await monitor.initialize();
    await monitor.monitorDevices();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
