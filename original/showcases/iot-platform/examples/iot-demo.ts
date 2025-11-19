/**
 * Elide IoT Platform - Complete Demos
 *
 * Demonstrates the full IoT platform capabilities with real-world scenarios.
 */

import { DeviceManager } from '../src/devices/device-manager';
import { SensorProcessor } from '../src/sensors/sensor-processor';
import { TimeSeriesAnalyzer } from '../src/analytics/timeseries-analyzer';
import { AnomalyDetector } from '../src/ml/anomaly-detector';
import { PredictiveMaintenance } from '../src/ml/predictive-maintenance';
import { EdgeProcessor } from '../src/edge/edge-processor';
import { MQTTHandler } from '../src/protocols/mqtt-handler';
import { TimeSeriesDB } from '../src/storage/timeseries-db';
import { Dashboard } from '../src/visualization/dashboard';

import {
  DeviceType,
  ProtocolType,
  SensorType,
  ProcessingMode,
  SyncStrategy,
  AnomalyDetectionAlgorithm,
  MLModelType,
  MaintenanceRecommendation,
  AggregationType,
  ForecastMethod,
  WidgetType
} from '../src/types';

// ============================================================================
// Demo 1: Smart Factory Monitoring
// ============================================================================

async function smartFactoryDemo() {
  console.log('=== Smart Factory Demo ===\n');

  // Initialize device manager
  const deviceManager = new DeviceManager({
    maxDevices: 500,
    protocols: [ProtocolType.MQTT, ProtocolType.COAP],
    authentication: 'certificate',
    healthCheckInterval: 30000,
    reconnectAttempts: 3,
    reconnectDelay: 5000,
    enableShadow: true,
    enableFirmwareUpdate: true
  });

  // Register factory devices
  console.log('Registering factory devices...');

  for (let i = 1; i <= 100; i++) {
    await deviceManager.registerDevice({
      deviceId: `machine-${i}`,
      type: DeviceType.SENSOR,
      protocol: ProtocolType.MQTT,
      metadata: {
        manufacturer: 'Industrial Corp',
        model: 'IM-3000',
        firmwareVersion: '2.1.0',
        hardwareVersion: '1.0',
        location: { latitude: 37.7749, longitude: -122.4194 },
        zone: `zone-${Math.floor(i / 10) + 1}`,
        tags: ['production', 'critical'],
        customProperties: {
          tenantId: 'factory-001',
          productionLine: Math.floor(i / 20) + 1
        }
      }
    });
  }

  console.log(`Registered ${deviceManager.getDeviceCount()} devices\n`);

  // Initialize sensor processor
  const sensorProcessor = new SensorProcessor({
    sampleRate: 1000,
    filterType: 'butterworth',
    cutoffFrequency: 50,
    bufferSize: 10000,
    enableNoiseReduction: true,
    enableSpikeDetection: true,
    qualityThreshold: 0.8
  });

  // Simulate sensor readings
  console.log('Processing sensor data...');

  const sensorData = Array.from({ length: 1000 }, (_, i) =>
    22 + Math.sin(i / 10) * 2 + Math.random() * 0.5
  );

  // Apply signal processing
  const filtered = await sensorProcessor.applyLowpassFilter(sensorData, 50, 4);
  console.log(`Filtered ${filtered.length} data points`);

  // Detect spikes
  const spikes = await sensorProcessor.detectSpikes(filtered, {
    threshold: 3,
    method: 'zscore'
  });
  console.log(`Detected ${spikes.spikes.length} spikes\n`);

  // Initialize anomaly detector
  const anomalyDetector = new AnomalyDetector({
    algorithm: AnomalyDetectionAlgorithm.ISOLATION_FOREST,
    contamination: 0.1,
    sensitivity: 0.8,
    trainingSize: 1000,
    updateInterval: 3600000,
    features: ['temperature', 'vibration', 'pressure'],
    enableOnlineLearning: true,
    ensembleVoting: 'soft'
  });

  // Train anomaly detector
  const trainingData = Array.from({ length: 1000 }, () => [
    20 + Math.random() * 10,  // temperature
    0.1 + Math.random() * 0.2, // vibration
    100 + Math.random() * 20   // pressure
  ]);

  await anomalyDetector.train({ features: trainingData });
  console.log('Trained anomaly detector\n');

  // Detect anomalies
  const testReading = [35, 0.5, 85]; // Anomalous reading
  const anomaly = await anomalyDetector.detect(testReading);

  console.log('Anomaly Detection Result:');
  console.log(`  Is Anomaly: ${anomaly.isAnomaly}`);
  console.log(`  Score: ${anomaly.score.toFixed(4)}`);
  console.log(`  Confidence: ${(anomaly.confidence * 100).toFixed(1)}%`);
  if (anomaly.explanation) {
    console.log(`  Explanation: ${anomaly.explanation}`);
  }
  console.log();

  // Initialize predictive maintenance
  const predictiveMaintenance = new PredictiveMaintenance({
    features: ['temperature', 'vibration', 'pressure', 'runtime'],
    model: MLModelType.RANDOM_FOREST,
    lookAhead: 168, // 7 days
    maintenanceThreshold: 0.7,
    warningThreshold: 0.4,
    updateInterval: 86400000, // 24 hours
    enableRUL: true
  });

  // Train predictive maintenance model
  const maintenanceTrainingData = Array.from({ length: 1000 }, (_, i) => ({
    features: [
      20 + Math.random() * 10,
      0.1 + Math.random() * 0.2,
      100 + Math.random() * 20,
      i * 10
    ],
    label: Math.random() < 0.1 ? 1 : 0 // 10% failure rate
  }));

  await predictiveMaintenance.train({
    features: maintenanceTrainingData.map(d => d.features),
    labels: maintenanceTrainingData.map(d => d.label),
    rul: maintenanceTrainingData.map((_, i) => 1000 - i)
  });

  console.log('Trained predictive maintenance model\n');

  // Predict maintenance
  const maintenancePrediction = await predictiveMaintenance.predict([32, 0.4, 90, 5000]);

  console.log('Predictive Maintenance Result:');
  console.log(`  Failure Probability: ${(maintenancePrediction.probability * 100).toFixed(1)}%`);
  console.log(`  Recommendation: ${maintenancePrediction.recommendation}`);
  if (maintenancePrediction.timeToFailure) {
    console.log(`  Time to Failure: ${maintenancePrediction.timeToFailure.toFixed(0)} hours`);
  }
  console.log(`  Risk Factors:`);
  maintenancePrediction.riskFactors.forEach(rf => {
    console.log(`    - ${rf.description}`);
  });
  console.log();

  console.log('=== Smart Factory Demo Complete ===\n');
}

// ============================================================================
// Demo 2: Smart City Environmental Monitoring
// ============================================================================

async function smartCityDemo() {
  console.log('=== Smart City Demo ===\n');

  // Initialize time series database
  const tsdb = new TimeSeriesDB({
    retention: {
      name: 'default',
      duration: 90 * 24 * 3600000, // 90 days
      replication: 1,
      shardDuration: 24 * 3600000, // 1 day
      default: true
    },
    compression: 'gorilla',
    downsampling: [
      {
        sourceResolution: 60000, // 1 minute
        targetResolution: 3600000, // 1 hour
        aggregation: AggregationType.MEAN,
        retention: 30 * 24 * 3600000 // 30 days
      }
    ],
    cacheSize: 100 * 1024 * 1024 // 100MB
  });

  console.log('Writing environmental sensor data...');

  // Write 10,000 data points
  const startTime = Date.now() - 24 * 3600000;

  for (let i = 0; i < 10000; i++) {
    await tsdb.write({
      measurement: 'air_quality',
      tags: {
        city: 'San Francisco',
        zone: 'downtown',
        sensor_id: `aq-${(i % 100) + 1}`
      },
      fields: {
        pm25: 10 + Math.random() * 20,
        pm10: 15 + Math.random() * 25,
        co2: 400 + Math.random() * 200,
        temperature: 20 + Math.random() * 10,
        humidity: 50 + Math.random() * 30
      },
      timestamp: startTime + i * 8640 // Every ~8.6 seconds
    });
  }

  console.log('Wrote 10,000 data points\n');

  // Query data
  console.log('Querying recent air quality...');

  const queryResult = await tsdb.query({
    measurement: 'air_quality',
    tags: { city: 'San Francisco' },
    start: Date.now() - 3600000, // Last hour
    end: Date.now(),
    aggregation: AggregationType.MEAN,
    groupBy: 300000 // 5-minute intervals
  });

  console.log(`Query returned ${queryResult.count} points`);
  console.log(`Execution time: ${queryResult.executionTime.toFixed(2)}ms`);
  console.log(`From cache: ${queryResult.fromCache}\n`);

  // Time series analysis
  const analyzer = new TimeSeriesAnalyzer({
    defaultPeriod: 24,
    forecastHorizon: 48,
    confidenceLevel: 0.95,
    minDataPoints: 50,
    enableCaching: true
  });

  // Generate sample data for analysis
  const tsData = Array.from({ length: 168 }, (_, i) =>
    10 + 5 * Math.sin(i / 12) + Math.random() * 2
  );

  console.log('Performing time series decomposition...');

  const decomposition = await analyzer.decompose(tsData, {
    period: 24,
    model: 'additive'
  });

  console.log(`Decomposed into trend, seasonal, and residual components`);
  console.log(`  Trend range: ${Math.min(...decomposition.trend).toFixed(2)} - ${Math.max(...decomposition.trend).toFixed(2)}`);
  console.log();

  // Forecasting
  console.log('Forecasting next 48 hours...');

  const forecast = await analyzer.forecast(tsData, {
    horizon: 48,
    method: ForecastMethod.EXPONENTIAL_SMOOTHING,
    confidence: 0.95,
    seasonalPeriods: 24
  });

  console.log(`Generated ${forecast.predictions.length} predictions`);
  console.log(`  Forecast range: ${Math.min(...forecast.predictions).toFixed(2)} - ${Math.max(...forecast.predictions).toFixed(2)}`);
  console.log(`  MAE: ${forecast.metrics.mae.toFixed(4)}`);
  console.log(`  RMSE: ${forecast.metrics.rmse.toFixed(4)}`);
  console.log();

  // Change point detection
  const changePoints = await analyzer.detectChangePoints(tsData, 'cusum');
  console.log(`Detected ${changePoints.length} change points: [${changePoints.join(', ')}]\n`);

  console.log('=== Smart City Demo Complete ===\n');
}

// ============================================================================
// Demo 3: Edge Computing & MQTT
// ============================================================================

async function edgeComputingDemo() {
  console.log('=== Edge Computing Demo ===\n');

  // Initialize edge processor
  const edge = new EdgeProcessor({
    processingMode: ProcessingMode.HYBRID,
    localStorageLimit: 10 * 1024 * 1024, // 10MB
    syncInterval: 60000, // 1 minute
    syncStrategy: SyncStrategy.SMART,
    offlineCapability: true,
    compressionEnabled: true
  });

  console.log('Processing data at the edge...');

  // Simulate edge processing
  const sensorReadings = Array.from({ length: 1000 }, (_, i) => ({
    sensorId: `sensor-${(i % 10) + 1}`,
    deviceId: `edge-device-1`,
    timestamp: Date.now() + i * 1000,
    value: 20 + Math.random() * 10,
    unit: 'celsius',
    quality: 'good' as any
  }));

  const edgeResult = await edge.process(sensorReadings, {
    filters: ['lowpass', 'outlier-removal'],
    aggregation: AggregationType.MEAN,
    window: 60
  });

  console.log('Edge Processing Results:');
  console.log(`  Processed: ${edgeResult.processed}`);
  console.log(`  Filtered: ${edgeResult.filtered}`);
  console.log(`  Aggregated: ${edgeResult.aggregated}`);
  console.log(`  Stored: ${edgeResult.stored}`);
  console.log(`  Synced: ${edgeResult.synced}`);
  console.log(`  Processing Time: ${edgeResult.processingTime.toFixed(2)}ms`);
  console.log(`  Buffer Size: ${edge.getBufferSize()}`);
  console.log(`  Bytes Stored: ${edge.getBytesStored()}\n`);

  // Initialize MQTT handler
  const mqtt = new MQTTHandler({
    broker: 'mqtt://localhost:1883',
    port: 1883,
    clientId: 'iot-platform-demo',
    qos: 1,
    retain: false,
    cleanSession: true,
    keepAlive: 60,
    reconnectPeriod: 5000,
    connectTimeout: 30000
  });

  await mqtt.connect();
  console.log('Connected to MQTT broker\n');

  // Subscribe to device telemetry
  let messageCount = 0;

  await mqtt.subscribe('devices/+/telemetry', async (topic, message) => {
    messageCount++;
    const deviceId = topic.split('/')[1];
    console.log(`Received telemetry from ${deviceId}`);
  });

  console.log('Subscribed to device telemetry\n');

  // Publish test messages
  console.log('Publishing test messages...');

  for (let i = 1; i <= 10; i++) {
    await mqtt.publish(`devices/sensor-${i}/telemetry`, {
      temperature: 20 + Math.random() * 10,
      humidity: 50 + Math.random() * 30,
      timestamp: Date.now()
    });
  }

  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for messages

  console.log(`Processed ${messageCount} messages`);
  console.log(`MQTT Stats: ${JSON.stringify(mqtt.getStats(), null, 2)}\n`);

  await mqtt.disconnect();

  console.log('=== Edge Computing Demo Complete ===\n');
}

// ============================================================================
// Demo 4: Real-time Dashboard
// ============================================================================

async function dashboardDemo() {
  console.log('=== Dashboard Demo ===\n');

  const dashboard = new Dashboard({
    id: 'main-dashboard',
    name: 'IoT Platform Dashboard',
    refreshRate: 5000,
    widgets: [
      {
        id: 'temp-chart',
        type: WidgetType.TIMESERIES,
        title: 'Temperature Over Time',
        dataSource: {
          type: 'static',
          staticData: {
            timestamps: Array.from({ length: 24 }, (_, i) => Date.now() - (24 - i) * 3600000),
            values: Array.from({ length: 24 }, () => 20 + Math.random() * 10)
          }
        },
        config: {},
        position: { x: 0, y: 0, width: 6, height: 3 }
      },
      {
        id: 'cpu-gauge',
        type: WidgetType.GAUGE,
        title: 'CPU Usage',
        dataSource: {
          type: 'static',
          staticData: { value: 65 }
        },
        config: { min: 0, max: 100 },
        position: { x: 6, y: 0, width: 3, height: 3 }
      },
      {
        id: 'device-count',
        type: WidgetType.STAT,
        title: 'Active Devices',
        dataSource: {
          type: 'static',
          staticData: { value: 1000 }
        },
        config: {},
        position: { x: 9, y: 0, width: 3, height: 3 }
      }
    ],
    layout: {
      columns: 12,
      rowHeight: 100,
      margin: [10, 10],
      containerPadding: [10, 10]
    },
    theme: {
      mode: 'dark',
      primaryColor: '#00bcd4',
      backgroundColor: '#121212',
      textColor: '#ffffff',
      gridColor: '#333333'
    }
  });

  console.log('Starting dashboard...');
  await dashboard.start();

  console.log('Dashboard running with widgets:');
  dashboard.getAllWidgets().forEach(w => {
    console.log(`  - ${w.title} (${w.type})`);
  });
  console.log();

  // Take snapshot
  const snapshot = await dashboard.snapshot();
  console.log(`Dashboard snapshot taken at ${new Date(snapshot.timestamp).toISOString()}`);
  console.log(`  Widgets: ${snapshot.widgets.length}\n`);

  await dashboard.stop();

  console.log('=== Dashboard Demo Complete ===\n');
}

// ============================================================================
// Run All Demos
// ============================================================================

async function runAllDemos() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Elide IoT Platform - Complete Demo Suite              ║');
  console.log('║     Demonstrating Polyglot ML & Signal Processing         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    await smartFactoryDemo();
    await smartCityDemo();
    await edgeComputingDemo();
    await dashboardDemo();

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     All Demos Completed Successfully!                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// Run demos
runAllDemos();
