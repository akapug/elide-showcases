/**
 * IoT Device Simulator
 *
 * Simulates multiple IoT devices sending telemetry data:
 * - Configurable device count and types
 * - Realistic sensor data patterns
 * - Anomaly injection
 * - Variable message rates
 * - Multiple sensor types
 */

import mqtt from 'mqtt';
import { nanoid } from 'nanoid';
import pino from 'pino';

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

// Configuration
const CONFIG = {
  mqttBroker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
  deviceCount: parseInt(process.env.DEVICE_COUNT || '100'),
  messageInterval: parseInt(process.env.MESSAGE_INTERVAL || '5000'),
  anomalyProbability: parseFloat(process.env.ANOMALY_PROBABILITY || '0.05'),
};

/**
 * Base device class
 */
abstract class SimulatedDevice {
  protected id: string;
  protected type: string;
  protected client: mqtt.MqttClient | null = null;
  protected interval: NodeJS.Timeout | null = null;
  protected messageCount = 0;
  protected anomalyMode = false;

  constructor(id: string, type: string) {
    this.id = id;
    this.type = type;
  }

  /**
   * Connect to MQTT broker
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(CONFIG.mqttBroker, {
        clientId: this.id,
        clean: true,
        reconnectPeriod: 1000,
        username: this.id,
        password: 'simulated-password',
      });

      this.client.on('connect', () => {
        logger.info({ deviceId: this.id, type: this.type }, 'Device connected');
        this.subscribeToCommands();
        resolve();
      });

      this.client.on('error', (error) => {
        logger.error({ deviceId: this.id, error }, 'Connection error');
        reject(error);
      });

      this.client.on('message', (topic, payload) => {
        this.handleCommand(topic, payload);
      });
    });
  }

  /**
   * Subscribe to device commands
   */
  private subscribeToCommands(): void {
    if (!this.client) return;

    const topics = [
      `devices/${this.id}/commands`,
      `shadow/${this.id}/update`,
    ];

    topics.forEach(topic => {
      this.client!.subscribe(topic, (err) => {
        if (err) {
          logger.error({ deviceId: this.id, topic, err }, 'Subscription failed');
        }
      });
    });
  }

  /**
   * Handle incoming commands
   */
  private handleCommand(topic: string, payload: Buffer): void {
    try {
      const message = JSON.parse(payload.toString());
      logger.info({ deviceId: this.id, topic, message }, 'Command received');

      if (message.command === 'restart') {
        this.restart();
      } else if (message.command === 'toggle_anomaly') {
        this.anomalyMode = !this.anomalyMode;
        logger.info({ deviceId: this.id, anomalyMode: this.anomalyMode }, 'Anomaly mode toggled');
      }
    } catch (error) {
      logger.error({ deviceId: this.id, error }, 'Failed to handle command');
    }
  }

  /**
   * Start sending telemetry
   */
  start(): void {
    this.interval = setInterval(() => {
      this.sendTelemetry();
    }, CONFIG.messageInterval);

    logger.info({ deviceId: this.id }, 'Device started');
  }

  /**
   * Stop sending telemetry
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.client) {
      this.client.end();
      this.client = null;
    }

    logger.info({ deviceId: this.id, messages: this.messageCount }, 'Device stopped');
  }

  /**
   * Restart device
   */
  restart(): void {
    logger.info({ deviceId: this.id }, 'Device restarting');
    this.stop();
    setTimeout(() => {
      this.connect().then(() => this.start());
    }, 1000);
  }

  /**
   * Send telemetry data
   */
  protected sendTelemetry(): void {
    if (!this.client || !this.client.connected) {
      return;
    }

    const metrics = this.generateMetrics();
    const telemetry = {
      timestamp: Date.now(),
      metrics,
    };

    const topic = `devices/${this.id}/telemetry`;
    this.client.publish(topic, JSON.stringify(telemetry), { qos: 1 }, (err) => {
      if (err) {
        logger.error({ deviceId: this.id, err }, 'Failed to publish telemetry');
      } else {
        this.messageCount++;
        if (this.messageCount % 100 === 0) {
          logger.debug({ deviceId: this.id, count: this.messageCount }, 'Telemetry sent');
        }
      }
    });

    // Periodically update shadow
    if (this.messageCount % 20 === 0) {
      this.updateShadow(metrics);
    }
  }

  /**
   * Update device shadow
   */
  protected updateShadow(metrics: Record<string, any>): void {
    if (!this.client) return;

    const shadowUpdate = {
      state: {
        firmware_version: '1.2.3',
        uptime: Math.floor(Date.now() / 1000),
        last_metrics: metrics,
      },
    };

    const topic = `devices/${this.id}/shadow/update`;
    this.client.publish(topic, JSON.stringify(shadowUpdate), { qos: 1 });
  }

  /**
   * Generate metrics (to be implemented by subclasses)
   */
  protected abstract generateMetrics(): Record<string, any>;

  /**
   * Add random noise to a value
   */
  protected addNoise(value: number, noise: number): number {
    return value + (Math.random() - 0.5) * 2 * noise;
  }

  /**
   * Check if should inject anomaly
   */
  protected shouldInjectAnomaly(): boolean {
    return this.anomalyMode || Math.random() < CONFIG.anomalyProbability;
  }
}

/**
 * Temperature sensor device
 */
class TemperatureSensor extends SimulatedDevice {
  private baseTemp = 22; // Base temperature in Celsius
  private humidity = 60; // Base humidity percentage

  protected generateMetrics(): Record<string, any> {
    let temperature = this.baseTemp + this.addNoise(0, 2);
    let humidity = this.humidity + this.addNoise(0, 5);

    // Inject anomaly
    if (this.shouldInjectAnomaly()) {
      temperature += Math.random() > 0.5 ? 15 : -10;
      logger.warn({ deviceId: this.id, temperature }, 'Anomaly injected');
    }

    // Add daily pattern
    const hour = new Date().getHours();
    temperature += Math.sin((hour / 24) * 2 * Math.PI) * 3;

    return {
      temperature: parseFloat(temperature.toFixed(2)),
      humidity: parseFloat(humidity.toFixed(2)),
      pressure: parseFloat((1013 + this.addNoise(0, 5)).toFixed(2)),
    };
  }
}

/**
 * Vibration sensor device
 */
class VibrationSensor extends SimulatedDevice {
  private baseVibration = 0.5;

  protected generateMetrics(): Record<string, any> {
    let vibrationX = this.baseVibration + this.addNoise(0, 0.1);
    let vibrationY = this.baseVibration + this.addNoise(0, 0.1);
    let vibrationZ = this.baseVibration + this.addNoise(0, 0.1);

    // Inject anomaly (bearing failure simulation)
    if (this.shouldInjectAnomaly()) {
      const spike = Math.random() * 5;
      vibrationX += spike;
      vibrationY += spike;
      vibrationZ += spike;
      logger.warn({ deviceId: this.id, vibration: spike }, 'Vibration anomaly injected');
    }

    return {
      vibration_x: parseFloat(vibrationX.toFixed(3)),
      vibration_y: parseFloat(vibrationY.toFixed(3)),
      vibration_z: parseFloat(vibrationZ.toFixed(3)),
      frequency: parseFloat((50 + this.addNoise(0, 1)).toFixed(2)),
    };
  }
}

/**
 * Energy meter device
 */
class EnergyMeter extends SimulatedDevice {
  private basePower = 1000; // Watts
  private totalEnergy = 0; // kWh

  protected generateMetrics(): Record<string, any> {
    let power = this.basePower + this.addNoise(0, 100);

    // Add load pattern
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 18) {
      power *= 1.5; // Higher load during work hours
    }

    // Inject anomaly (power surge)
    if (this.shouldInjectAnomaly()) {
      power *= 2.5;
      logger.warn({ deviceId: this.id, power }, 'Power surge anomaly injected');
    }

    // Update total energy (kWh)
    this.totalEnergy += (power / 1000) * (CONFIG.messageInterval / 3600000);

    return {
      power: parseFloat(power.toFixed(2)),
      voltage: parseFloat((230 + this.addNoise(0, 5)).toFixed(2)),
      current: parseFloat((power / 230).toFixed(2)),
      power_factor: parseFloat((0.95 + this.addNoise(0, 0.05)).toFixed(3)),
      total_energy: parseFloat(this.totalEnergy.toFixed(3)),
    };
  }
}

/**
 * Device simulator manager
 */
class DeviceSimulator {
  private devices: SimulatedDevice[] = [];

  /**
   * Create and start devices
   */
  async start(): Promise<void> {
    logger.info({ count: CONFIG.deviceCount }, 'Starting device simulation');

    const deviceTypes = [
      { type: 'temperature', class: TemperatureSensor, ratio: 0.5 },
      { type: 'vibration', class: VibrationSensor, ratio: 0.3 },
      { type: 'energy', class: EnergyMeter, ratio: 0.2 },
    ];

    let deviceIndex = 0;

    for (const { type, class: DeviceClass, ratio } of deviceTypes) {
      const count = Math.floor(CONFIG.deviceCount * ratio);

      for (let i = 0; i < count; i++) {
        const deviceId = `${type}-${String(deviceIndex++).padStart(4, '0')}`;
        const device = new DeviceClass(deviceId, type);

        try {
          await device.connect();
          device.start();
          this.devices.push(device);
        } catch (error) {
          logger.error({ deviceId, error }, 'Failed to start device');
        }
      }
    }

    logger.info({ total: this.devices.length }, 'All devices started');

    // Print statistics periodically
    setInterval(() => {
      this.printStats();
    }, 30000);
  }

  /**
   * Stop all devices
   */
  stop(): void {
    logger.info('Stopping all devices');

    for (const device of this.devices) {
      device.stop();
    }

    this.devices = [];
  }

  /**
   * Print statistics
   */
  private printStats(): void {
    const totalMessages = this.devices.reduce((sum, d) => sum + d['messageCount'], 0);
    const avgMessages = totalMessages / this.devices.length;

    logger.info(
      {
        devices: this.devices.length,
        totalMessages,
        avgMessages: avgMessages.toFixed(0),
        rate: (totalMessages / 30).toFixed(2) + ' msg/s',
      },
      'Simulation statistics'
    );
  }
}

// Main execution
async function main() {
  const simulator = new DeviceSimulator();

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping simulation');
    simulator.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping simulation');
    simulator.stop();
    process.exit(0);
  });

  try {
    await simulator.start();
  } catch (error) {
    logger.error({ error }, 'Simulation failed');
    process.exit(1);
  }
}

main();
