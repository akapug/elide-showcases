/**
 * Elide IoT Platform - Advanced Scenarios
 *
 * Advanced use cases demonstrating complex IoT platform capabilities.
 */

import { DeviceManager } from '../src/devices/device-manager';
import { SensorProcessor } from '../src/sensors/sensor-processor';
import { TimeSeriesAnalyzer } from '../src/analytics/timeseries-analyzer';
import { AnomalyDetector, MultiSensorAnomalyDetector } from '../src/ml/anomaly-detector';
import { PredictiveMaintenance } from '../src/ml/predictive-maintenance';
import { EdgeProcessor } from '../src/edge/edge-processor';
import { MQTTHandler } from '../src/protocols/mqtt-handler';
import { TimeSeriesDB } from '../src/storage/timeseries-db';
import { Dashboard } from '../src/visualization/dashboard';

// ============================================================================
// Scenario 1: Healthcare IoT - Patient Monitoring System
// ============================================================================

async function healthcarePatientMonitoring() {
  console.log('\n=== Healthcare IoT - Patient Monitoring ===\n');

  const deviceManager = new DeviceManager({
    maxDevices: 10000,
    protocols: ['mqtt' as any, 'https' as any],
    authentication: 'certificate',
    healthCheckInterval: 10000, // 10 seconds for critical systems
    reconnectAttempts: 5,
    reconnectDelay: 2000,
    enableShadow: true,
    enableFirmwareUpdate: true
  });

  // Register patient monitoring devices
  const patientDevices = [];

  for (let i = 1; i <= 500; i++) {
    const device = await deviceManager.registerDevice({
      deviceId: `patient-monitor-${String(i).padStart(4, '0')}`,
      type: 'sensor' as any,
      protocol: 'mqtt' as any,
      metadata: {
        manufacturer: 'MedTech Inc',
        model: 'PM-3000',
        firmwareVersion: '3.2.1',
        hardwareVersion: '2.0',
        location: {
          latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.1
        },
        zone: `ICU-${Math.floor(i / 50) + 1}`,
        tags: ['critical', 'medical', 'fda-approved'],
        customProperties: {
          tenantId: 'hospital-001',
          department: 'intensive-care',
          room: `ICU-${i}`,
          patientId: `PATIENT-${String(i).padStart(6, '0')}`
        }
      },
      capabilities: {
        sensors: [
          {
            type: 'heart-rate' as any,
            range: [30, 220],
            accuracy: 1,
            resolution: 1,
            unit: 'bpm'
          },
          {
            type: 'blood-pressure' as any,
            range: [40, 300],
            accuracy: 2,
            resolution: 1,
            unit: 'mmHg'
          },
          {
            type: 'oxygen-saturation' as any,
            range: [70, 100],
            accuracy: 1,
            resolution: 0.1,
            unit: '%'
          },
          {
            type: 'temperature' as any,
            range: [35, 42],
            accuracy: 0.1,
            resolution: 0.01,
            unit: 'celsius'
          },
          {
            type: 'respiratory-rate' as any,
            range: [0, 60],
            accuracy: 1,
            resolution: 1,
            unit: 'breaths/min'
          }
        ],
        actuators: [],
        protocols: ['mqtt' as any],
        maxSampleRate: 100, // 100 Hz for real-time monitoring
        bufferSize: 10000,
        processingPower: 'medium' as any,
        storage: {
          type: 'persistent',
          capacity: 100 * 1024 * 1024, // 100MB
          writeSpeed: 10 * 1024 * 1024, // 10MB/s
          readSpeed: 10 * 1024 * 1024
        }
      }
    });

    patientDevices.push(device);
  }

  console.log(`Registered ${patientDevices.length} patient monitoring devices\n`);

  // Setup time series database for vital signs
  const vitalSignsDB = new TimeSeriesDB({
    retention: [
      {
        name: 'realtime',
        duration: 24 * 3600000, // 24 hours at full resolution
        replication: 3, // High availability for medical data
        shardDuration: 3600000, // 1 hour shards
        default: true
      },
      {
        name: 'hourly',
        duration: 30 * 24 * 3600000, // 30 days hourly aggregates
        replication: 2,
        shardDuration: 24 * 3600000,
        default: false
      },
      {
        name: 'daily',
        duration: 365 * 24 * 3600000, // 1 year daily aggregates
        replication: 2,
        shardDuration: 30 * 24 * 3600000,
        default: false
      }
    ],
    compression: 'gorilla',
    downsampling: [
      {
        sourceResolution: 1000, // 1 second
        targetResolution: 60000, // 1 minute
        aggregation: 'mean' as any,
        retention: 7 * 24 * 3600000 // 7 days
      },
      {
        sourceResolution: 60000, // 1 minute
        targetResolution: 3600000, // 1 hour
        aggregation: 'mean' as any,
        retention: 30 * 24 * 3600000 // 30 days
      }
    ],
    cacheSize: 500 * 1024 * 1024 // 500MB cache for fast queries
  });

  // Setup anomaly detection for each vital sign
  const vitalSignAnomalyDetectors = new Map<string, AnomalyDetector>();

  const vitalSigns = ['heart-rate', 'blood-pressure-systolic', 'blood-pressure-diastolic', 'oxygen-saturation', 'temperature', 'respiratory-rate'];

  for (const vitalSign of vitalSigns) {
    const detector = new AnomalyDetector({
      algorithm: 'ensemble' as any,
      contamination: 0.01, // Very low for medical - 1% anomalies expected
      sensitivity: 0.95, // Very high sensitivity
      trainingSize: 10000,
      updateInterval: 3600000, // Update hourly
      features: [vitalSign, `${vitalSign}_rate_of_change`, `${vitalSign}_variance`],
      enableOnlineLearning: true,
      ensembleVoting: 'soft'
    });

    // Train with historical normal data
    const historicalData = await generateHistoricalVitalSigns(vitalSign, 10000);
    await detector.train({ features: historicalData });

    vitalSignAnomalyDetectors.set(vitalSign, detector);
  }

  console.log('Trained anomaly detectors for all vital signs\n');

  // Setup MQTT for real-time monitoring
  const mqtt = new MQTTHandler({
    broker: 'mqtt://medical-iot.hospital.local:8883',
    port: 8883,
    clientId: 'icu-monitoring-system',
    qos: 2, // Exactly once for medical data
    retain: false,
    cleanSession: false, // Persistent session
    keepAlive: 30,
    reconnectPeriod: 1000,
    connectTimeout: 10000,
    tls: {
      ca: Buffer.from(''), // CA certificate
      cert: Buffer.from(''), // Client certificate
      key: Buffer.from(''), // Private key
      rejectUnauthorized: true
    }
  });

  await mqtt.connect();

  // Setup alert system
  interface VitalAlert {
    patientId: string;
    deviceId: string;
    vitalSign: string;
    value: number;
    severity: 'critical' | 'warning' | 'info';
    timestamp: number;
    anomalyScore?: number;
  }

  const activeAlerts: VitalAlert[] = [];
  const alertHistory: VitalAlert[] = [];

  // Subscribe to patient vital signs
  await mqtt.subscribe('patients/+/vitals', async (topic, message) => {
    const data = JSON.parse(message.toString());
    const patientId = topic.split('/')[1];

    // Store in time series database
    await vitalSignsDB.write({
      measurement: 'vital_signs',
      tags: {
        patient_id: patientId,
        device_id: data.deviceId,
        department: 'ICU'
      },
      fields: {
        heart_rate: data.heartRate,
        bp_systolic: data.bloodPressure.systolic,
        bp_diastolic: data.bloodPressure.diastolic,
        oxygen_saturation: data.oxygenSaturation,
        temperature: data.temperature,
        respiratory_rate: data.respiratoryRate
      },
      timestamp: data.timestamp
    });

    // Check for anomalies in each vital sign
    for (const [vitalSign, detector] of vitalSignAnomalyDetectors) {
      const value = getVitalSignValue(data, vitalSign);
      const rateOfChange = await calculateRateOfChange(patientId, vitalSign, value);
      const variance = await calculateVariance(patientId, vitalSign);

      const features = [value, rateOfChange, variance];
      const anomalyResult = await detector.detect(features);

      if (anomalyResult.isAnomaly) {
        const severity = determineSeverity(vitalSign, value, anomalyResult.score);

        const alert: VitalAlert = {
          patientId,
          deviceId: data.deviceId,
          vitalSign,
          value,
          severity,
          timestamp: Date.now(),
          anomalyScore: anomalyResult.score
        };

        activeAlerts.push(alert);
        alertHistory.push(alert);

        // Send alert to medical staff
        await sendMedicalAlert(alert);

        // Log alert
        console.log(`[${severity.toUpperCase()}] Patient ${patientId}: Abnormal ${vitalSign} = ${value}`);
        console.log(`  Anomaly score: ${anomalyResult.score.toFixed(4)}`);
        console.log(`  Confidence: ${(anomalyResult.confidence * 100).toFixed(1)}%`);
      }
    }

    // Check for critical combinations
    await checkVitalSignCombinations(data, patientId);
  });

  // Simulate patient monitoring
  console.log('Monitoring 500 patients...\n');

  let normalReadings = 0;
  let anomalousReadings = 0;
  let criticalAlerts = 0;

  for (let iteration = 0; iteration < 100; iteration++) {
    for (const device of patientDevices.slice(0, 10)) { // Monitor first 10 for demo
      const vitals = generateVitalSigns(device.id, iteration);

      await mqtt.publish(`patients/${device.metadata.customProperties?.patientId}/vitals`, vitals);

      if (vitals.anomalous) {
        anomalousReadings++;
        if (vitals.critical) criticalAlerts++;
      } else {
        normalReadings++;
      }
    }

    // Wait 1 second between readings
    await sleep(1000);
  }

  console.log('\nMonitoring Summary:');
  console.log(`  Total readings: ${normalReadings + anomalousReadings}`);
  console.log(`  Normal readings: ${normalReadings}`);
  console.log(`  Anomalous readings: ${anomalousReadings}`);
  console.log(`  Critical alerts: ${criticalAlerts}`);
  console.log(`  Active alerts: ${activeAlerts.length}`);
  console.log(`  Alert history: ${alertHistory.length}\n`);

  await mqtt.disconnect();
}

// ============================================================================
// Scenario 2: Smart Agriculture - Precision Farming
// ============================================================================

async function smartAgriculturePrecisionFarming() {
  console.log('\n=== Smart Agriculture - Precision Farming ===\n');

  const farmDeviceManager = new DeviceManager({
    maxDevices: 50000,
    protocols: ['lorawan' as any, 'mqtt' as any],
    authentication: 'psk',
    healthCheckInterval: 300000, // 5 minutes for outdoor sensors
    reconnectAttempts: 10,
    reconnectDelay: 10000,
    enableShadow: true,
    enableFirmwareUpdate: true
  });

  // Register farm sensors across multiple fields
  const fieldSensors = [];
  const numberOfFields = 20;
  const sensorsPerField = 100;

  for (let field = 1; field <= numberOfFields; field++) {
    for (let sensor = 1; sensor <= sensorsPerField; sensor++) {
      const deviceId = `farm-sensor-f${String(field).padStart(2, '0')}-s${String(sensor).padStart(3, '0')}`;

      const device = await farmDeviceManager.registerDevice({
        deviceId,
        type: 'sensor' as any,
        protocol: 'lorawan' as any,
        metadata: {
          manufacturer: 'AgriTech Solutions',
          model: 'AS-5000',
          firmwareVersion: '2.3.0',
          hardwareVersion: '1.5',
          location: {
            latitude: 36.7783 + (field * 0.01) + (Math.random() - 0.5) * 0.001,
            longitude: -119.4179 + (sensor * 0.01) + (Math.random() - 0.5) * 0.001
          },
          zone: `field-${field}`,
          tags: ['agriculture', 'outdoor', 'solar-powered'],
          customProperties: {
            tenantId: 'farm-001',
            fieldId: `field-${field}`,
            cropType: getCropType(field),
            soilType: getSoilType(field),
            irrigationZone: Math.floor(sensor / 10)
          }
        },
        capabilities: {
          sensors: [
            { type: 'soil-moisture' as any, range: [0, 100], accuracy: 2, resolution: 0.1, unit: '%' },
            { type: 'soil-temperature' as any, range: [-10, 50], accuracy: 0.5, resolution: 0.1, unit: 'celsius' },
            { type: 'soil-ph' as any, range: [0, 14], accuracy: 0.1, resolution: 0.01, unit: 'pH' },
            { type: 'soil-ec' as any, range: [0, 10], accuracy: 0.1, resolution: 0.01, unit: 'mS/cm' },
            { type: 'ambient-temperature' as any, range: [-20, 60], accuracy: 0.5, resolution: 0.1, unit: 'celsius' },
            { type: 'humidity' as any, range: [0, 100], accuracy: 3, resolution: 1, unit: '%' },
            { type: 'light' as any, range: [0, 200000], accuracy: 5, resolution: 1, unit: 'lux' },
            { type: 'rainfall' as any, range: [0, 500], accuracy: 1, resolution: 0.1, unit: 'mm' }
          ],
          actuators: [],
          protocols: ['lorawan' as any],
          maxSampleRate: 0.017, // Once per minute
          bufferSize: 1440, // 24 hours of data
          processingPower: 'low' as any,
          storage: {
            type: 'persistent',
            capacity: 1 * 1024 * 1024, // 1MB
            writeSpeed: 10 * 1024, // 10KB/s
            readSpeed: 10 * 1024
          }
        }
      });

      fieldSensors.push(device);
    }
  }

  console.log(`Registered ${fieldSensors.length} farm sensors across ${numberOfFields} fields\n`);

  // Setup edge processing for data aggregation
  const edgeGateways = [];

  for (let field = 1; field <= numberOfFields; field++) {
    const gateway = new EdgeProcessor({
      processingMode: 'hybrid' as any,
      localStorageLimit: 100 * 1024 * 1024, // 100MB per gateway
      syncInterval: 600000, // Sync every 10 minutes
      syncStrategy: 'smart' as any,
      offlineCapability: true,
      compressionEnabled: true
    });

    edgeGateways.push({ fieldId: field, gateway });
  }

  // Setup time series analyzer for soil moisture prediction
  const soilMoistureAnalyzer = new TimeSeriesAnalyzer({
    defaultPeriod: 24, // Daily patterns
    forecastHorizon: 168, // 1 week ahead
    confidenceLevel: 0.90,
    minDataPoints: 168,
    enableCaching: true
  });

  // Setup irrigation optimization
  interface IrrigationRecommendation {
    fieldId: number;
    zone: number;
    action: 'irrigate' | 'wait' | 'reduce';
    duration: number; // minutes
    waterAmount: number; // liters
    confidence: number;
    reasoning: string[];
  }

  const optimizeIrrigation = async (fieldId: number, sensorData: any[]): Promise<IrrigationRecommendation[]> => {
    const recommendations: IrrigationRecommendation[] = [];

    // Group by irrigation zone
    const zoneData = new Map<number, any[]>();

    for (const sensor of sensorData) {
      const zone = sensor.irrigationZone;
      if (!zoneData.has(zone)) {
        zoneData.set(zone, []);
      }
      zoneData.get(zone)!.push(sensor);
    }

    // Analyze each zone
    for (const [zone, sensors] of zoneData) {
      const avgMoisture = sensors.reduce((sum, s) => sum + s.soilMoisture, 0) / sensors.length;
      const avgTemperature = sensors.reduce((sum, s) => sum + s.soilTemperature, 0) / sensors.length;
      const avgRainfall = sensors.reduce((sum, s) => sum + s.rainfall, 0) / sensors.length;

      // Historical moisture data
      const moistureHistory = sensors[0].moistureHistory || [];

      // Forecast moisture for next 7 days
      let forecast;
      if (moistureHistory.length >= 168) {
        forecast = await soilMoistureAnalyzer.forecast(moistureHistory, {
          horizon: 168,
          method: 'exponential-smoothing' as any,
          seasonalPeriods: 24
        });
      }

      // Decision logic
      const reasoning: string[] = [];
      let action: 'irrigate' | 'wait' | 'reduce' = 'wait';
      let duration = 0;
      let waterAmount = 0;

      // Check current moisture
      if (avgMoisture < 30) {
        action = 'irrigate';
        reasoning.push('Current moisture below optimal (30%)');
        duration = 60;
        waterAmount = 1000 * (sensors.length / 10); // 100L per sensor
      } else if (avgMoisture > 70) {
        action = 'reduce';
        reasoning.push('Soil moisture too high, risk of overwatering');
      }

      // Check forecast
      if (forecast) {
        const forecastAvg = forecast.predictions.slice(0, 24).reduce((a, b) => a + b, 0) / 24;
        if (forecastAvg < 25 && action === 'wait') {
          action = 'irrigate';
          reasoning.push('Forecast shows moisture dropping below 25%');
          duration = 45;
          waterAmount = 750 * (sensors.length / 10);
        }
      }

      // Check rainfall forecast
      if (avgRainfall > 10 && action === 'irrigate') {
        action = 'wait';
        reasoning.push('Recent rainfall detected, wait for absorption');
      }

      // Check temperature
      if (avgTemperature > 35 && avgMoisture < 40) {
        action = 'irrigate';
        reasoning.push('High temperature increasing evaporation');
        duration = Math.max(duration, 30);
        waterAmount = Math.max(waterAmount, 500 * (sensors.length / 10));
      }

      recommendations.push({
        fieldId,
        zone,
        action,
        duration,
        waterAmount,
        confidence: forecast ? forecast.metrics.mape : 0.8,
        reasoning
      });
    }

    return recommendations;
  };

  // Simulate precision farming operations
  console.log('Running precision farming optimization...\n');

  for (let day = 0; day < 7; day++) {
    console.log(`\n--- Day ${day + 1} ---\n`);

    for (let field = 1; field <= 5; field++) { // First 5 fields for demo
      const fieldDevices = fieldSensors.filter(d =>
        d.metadata.customProperties?.fieldId === `field-${field}`
      );

      // Collect sensor data
      const sensorData = fieldDevices.map(device => ({
        deviceId: device.id,
        soilMoisture: 40 + Math.random() * 30 - (day * 2), // Decreasing over days
        soilTemperature: 20 + Math.random() * 10,
        soilPH: 6.5 + Math.random() * 0.5,
        soilEC: 2 + Math.random() * 0.5,
        ambientTemperature: 25 + Math.random() * 10,
        humidity: 50 + Math.random() * 30,
        light: 50000 + Math.random() * 100000,
        rainfall: Math.random() < 0.2 ? Math.random() * 20 : 0,
        irrigationZone: device.metadata.customProperties?.irrigationZone,
        moistureHistory: Array.from({ length: 168 }, (_, i) =>
          45 - i * 0.1 + Math.random() * 5
        )
      }));

      // Get irrigation recommendations
      const recommendations = await optimizeIrrigation(field, sensorData);

      console.log(`Field ${field} (${fieldDevices[0].metadata.customProperties?.cropType}):`);

      for (const rec of recommendations) {
        console.log(`  Zone ${rec.zone}: ${rec.action.toUpperCase()}`);
        if (rec.action === 'irrigate') {
          console.log(`    Duration: ${rec.duration} minutes`);
          console.log(`    Water: ${rec.waterAmount.toFixed(0)} liters`);
        }
        console.log(`    Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
        console.log(`    Reasoning:`);
        rec.reasoning.forEach(r => console.log(`      - ${r}`));
      }

      // Calculate water savings
      const totalWater = recommendations.reduce((sum, r) => sum + r.waterAmount, 0);
      const optimizedWater = totalWater * 0.8; // 20% savings with precision irrigation
      const waterSaved = totalWater - optimizedWater;

      console.log(`  Water usage: ${totalWater.toFixed(0)}L (saved ${waterSaved.toFixed(0)}L with optimization)`);
    }

    await sleep(100); // Simulate day passing
  }

  console.log('\n=== Smart Agriculture Demo Complete ===\n');
}

// ============================================================================
// Helper Functions
// ============================================================================

async function generateHistoricalVitalSigns(vitalSign: string, count: number): Promise<number[][]> {
  const ranges = {
    'heart-rate': [60, 100],
    'blood-pressure-systolic': [110, 130],
    'blood-pressure-diastolic': [70, 85],
    'oxygen-saturation': [95, 100],
    'temperature': [36.5, 37.5],
    'respiratory-rate': [12, 20]
  };

  const range = ranges[vitalSign as keyof typeof ranges] || [0, 100];
  const data: number[][] = [];

  for (let i = 0; i < count; i++) {
    const value = range[0] + Math.random() * (range[1] - range[0]);
    const rateOfChange = (Math.random() - 0.5) * 0.1;
    const variance = Math.random() * 0.05;

    data.push([value, rateOfChange, variance]);
  }

  return data;
}

function getVitalSignValue(data: any, vitalSign: string): number {
  const mapping: Record<string, () => number> = {
    'heart-rate': () => data.heartRate,
    'blood-pressure-systolic': () => data.bloodPressure.systolic,
    'blood-pressure-diastolic': () => data.bloodPressure.diastolic,
    'oxygen-saturation': () => data.oxygenSaturation,
    'temperature': () => data.temperature,
    'respiratory-rate': () => data.respiratoryRate
  };

  return mapping[vitalSign]?.() || 0;
}

async function calculateRateOfChange(patientId: string, vitalSign: string, currentValue: number): Promise<number> {
  // Simplified - in production, query historical data
  return (Math.random() - 0.5) * 0.2;
}

async function calculateVariance(patientId: string, vitalSign: string): Promise<number> {
  // Simplified - in production, calculate from historical data
  return Math.random() * 0.1;
}

function determineSeverity(vitalSign: string, value: number, anomalyScore: number): 'critical' | 'warning' | 'info' {
  // Critical ranges
  const criticalRanges: Record<string, [number, number]> = {
    'heart-rate': [40, 150],
    'oxygen-saturation': [85, 100],
    'temperature': [35, 40]
  };

  const range = criticalRanges[vitalSign];
  if (range && (value < range[0] || value > range[1])) {
    return 'critical';
  }

  if (anomalyScore > 0.9) {
    return 'critical';
  } else if (anomalyScore > 0.7) {
    return 'warning';
  }

  return 'info';
}

async function sendMedicalAlert(alert: VitalAlert): Promise<void> {
  // In production: send to nurse station, mobile app, etc.
  console.log(`  [ALERT SENT] ${alert.severity}: ${alert.vitalSign} = ${alert.value}`);
}

async function checkVitalSignCombinations(data: any, patientId: string): Promise<void> {
  // Check for dangerous combinations
  if (data.oxygenSaturation < 90 && data.heartRate > 120) {
    console.log(`  [CRITICAL] Patient ${patientId}: Low O2 + High HR - Possible respiratory distress`);
  }

  if (data.temperature > 38.5 && data.heartRate > 110) {
    console.log(`  [WARNING] Patient ${patientId}: Fever + Tachycardia - Possible infection`);
  }
}

function generateVitalSigns(deviceId: string, iteration: number): any {
  const anomalous = Math.random() < 0.05; // 5% anomaly rate
  const critical = anomalous && Math.random() < 0.3; // 30% of anomalies are critical

  const heartRate = anomalous
    ? (critical ? 40 + Math.random() * 20 : 110 + Math.random() * 30)
    : 60 + Math.random() * 40;

  const oxygenSaturation = anomalous
    ? (critical ? 80 + Math.random() * 10 : 90 + Math.random() * 5)
    : 95 + Math.random() * 5;

  return {
    deviceId,
    heartRate,
    bloodPressure: {
      systolic: 110 + Math.random() * 30,
      diastolic: 70 + Math.random() * 20
    },
    oxygenSaturation,
    temperature: 36.5 + Math.random() * 1,
    respiratoryRate: 12 + Math.random() * 8,
    timestamp: Date.now(),
    anomalous,
    critical
  };
}

function getCropType(field: number): string {
  const crops = ['corn', 'wheat', 'soybeans', 'cotton', 'rice'];
  return crops[field % crops.length];
}

function getSoilType(field: number): string {
  const soilTypes = ['loam', 'clay', 'sandy', 'silt'];
  return soilTypes[field % soilTypes.length];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Run Advanced Scenarios
// ============================================================================

async function runAdvancedScenarios() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Elide IoT Platform - Advanced Scenarios                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    await healthcarePatientMonitoring();
    await smartAgriculturePrecisionFarming();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  All Advanced Scenarios Completed Successfully!           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('Advanced scenario failed:', error);
    process.exit(1);
  }
}

// Run scenarios
runAdvancedScenarios();
