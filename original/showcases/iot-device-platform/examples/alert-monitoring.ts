/**
 * Alert Monitoring Example
 *
 * Real-time monitoring of alerts from the IoT platform:
 * - WebSocket connection to dashboard
 * - Alert filtering and categorization
 * - Alert statistics
 * - Notification formatting
 * - Console dashboard display
 */

import WebSocket from 'ws';
import pino from 'pino';
import chalk from 'chalk';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

// Configuration
const CONFIG = {
  websocketUrl: process.env.WS_URL || 'ws://localhost:8080',
  subscribeTo: process.env.SUBSCRIBE_TO || 'all',
  filterSeverity: process.env.FILTER_SEVERITY || null, // info, warning, error, critical
};

interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  deviceId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  context: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
}

/**
 * Alert Monitor
 */
class AlertMonitor {
  private ws: WebSocket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;

  // Statistics
  private stats = {
    totalAlerts: 0,
    bySevertiy: {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    },
    byStatus: {
      active: 0,
      acknowledged: 0,
      resolved: 0,
    },
    startTime: Date.now(),
  };

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info({ url: CONFIG.websocketUrl }, 'Connecting to WebSocket server');

      this.ws = new WebSocket(CONFIG.websocketUrl);

      this.ws.on('open', () => {
        logger.info('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.setupHandlers();
        this.subscribe();
        resolve();
      });

      this.ws.on('error', (error) => {
        logger.error({ error }, 'WebSocket error');
        if (!this.connected) {
          reject(error);
        }
      });

      this.ws.on('close', () => {
        logger.warn('WebSocket connection closed');
        this.connected = false;
        this.handleDisconnect();
      });
    });
  }

  /**
   * Setup message handlers
   */
  private setupHandlers(): void {
    if (!this.ws) return;

    this.ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        logger.error({ error }, 'Failed to parse message');
      }
    });
  }

  /**
   * Subscribe to channels
   */
  private subscribe(): void {
    if (!this.ws || !this.connected) return;

    const subscribeMessage = {
      type: 'subscribe',
      channel: CONFIG.subscribeTo,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(subscribeMessage));
    logger.info({ channel: CONFIG.subscribeTo }, 'Subscribed to channel');
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'welcome':
        logger.info({ clientId: message.payload.clientId }, 'Welcome message received');
        break;

      case 'broadcast':
        if (message.channel === 'alert' || message.channel === 'all') {
          this.handleAlert(message.payload);
        } else if (message.channel === 'stats') {
          this.handleStats(message.payload);
        }
        break;

      case 'subscribed':
        logger.info({ channel: message.payload.channel }, 'Subscription confirmed');
        break;

      case 'error':
        logger.error({ error: message.payload.error }, 'Server error');
        break;

      case 'pong':
        logger.debug('Pong received');
        break;

      default:
        logger.debug({ type: message.type }, 'Unknown message type');
    }
  }

  /**
   * Handle alert
   */
  private handleAlert(alert: Alert): void {
    // Filter by severity if configured
    if (CONFIG.filterSeverity && alert.severity !== CONFIG.filterSeverity) {
      return;
    }

    // Update statistics
    this.stats.totalAlerts++;
    this.stats.bySevertiy[alert.severity]++;
    this.stats.byStatus[alert.status]++;

    // Display alert
    this.displayAlert(alert);
  }

  /**
   * Display alert to console
   */
  private displayAlert(alert: Alert): void {
    const timestamp = new Date(alert.createdAt).toISOString();

    // Color based on severity
    let severityColor;
    switch (alert.severity) {
      case 'critical':
        severityColor = chalk.bgRed.white.bold;
        break;
      case 'error':
        severityColor = chalk.red.bold;
        break;
      case 'warning':
        severityColor = chalk.yellow.bold;
        break;
      default:
        severityColor = chalk.blue;
    }

    console.log('\n' + '='.repeat(80));
    console.log(severityColor(`ALERT [${alert.severity.toUpperCase()}]`));
    console.log('='.repeat(80));
    console.log(chalk.gray(`Timestamp: ${timestamp}`));
    console.log(chalk.cyan(`Device: ${alert.deviceId}`));
    console.log(chalk.cyan(`Rule: ${alert.ruleName}`));
    console.log(chalk.white(`Message: ${alert.message}`));

    if (alert.context && Object.keys(alert.context).length > 0) {
      console.log(chalk.gray('\nContext:'));
      for (const [key, value] of Object.entries(alert.context)) {
        console.log(chalk.gray(`  ${key}: ${JSON.stringify(value)}`));
      }
    }

    console.log(chalk.gray(`Status: ${alert.status}`));
    console.log('='.repeat(80) + '\n');

    // Play alert sound for critical alerts
    if (alert.severity === 'critical') {
      process.stdout.write('\x07'); // Bell sound
    }
  }

  /**
   * Handle platform stats
   */
  private handleStats(stats: any): void {
    // Update console title with stats
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const rate = (this.stats.totalAlerts / uptime).toFixed(2);

    logger.debug({
      devices: stats.devices,
      telemetryRate: stats.telemetryRate,
      alertCount: this.stats.totalAlerts,
      alertRate: rate,
    }, 'Platform statistics');
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnect attempts reached, giving up');
      process.exit(1);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    logger.info({ attempt: this.reconnectAttempts, delay }, 'Reconnecting');

    setTimeout(() => {
      this.connect().catch((error) => {
        logger.error({ error }, 'Reconnection failed');
      });
    }, delay);
  }

  /**
   * Send ping
   */
  private sendPing(): void {
    if (!this.ws || !this.connected) return;

    const pingMessage = {
      type: 'ping',
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(pingMessage));
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    await this.connect();

    // Send ping periodically
    setInterval(() => {
      this.sendPing();
    }, 30000);

    // Print statistics periodically
    setInterval(() => {
      this.printStats();
    }, 60000);

    // Display initial message
    this.displayWelcome();
  }

  /**
   * Display welcome message
   */
  private displayWelcome(): void {
    console.clear();
    console.log(chalk.cyan.bold('\n' + '='.repeat(80)));
    console.log(chalk.cyan.bold('  IoT Platform - Alert Monitor'));
    console.log(chalk.cyan.bold('='.repeat(80)));
    console.log(chalk.white(`\n  WebSocket: ${CONFIG.websocketUrl}`));
    console.log(chalk.white(`  Subscribed to: ${CONFIG.subscribeTo}`));
    if (CONFIG.filterSeverity) {
      console.log(chalk.white(`  Severity filter: ${CONFIG.filterSeverity}`));
    }
    console.log(chalk.gray(`\n  Press Ctrl+C to exit\n`));
    console.log(chalk.cyan.bold('='.repeat(80) + '\n'));
  }

  /**
   * Print statistics
   */
  private printStats(): void {
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const rate = (this.stats.totalAlerts / uptime).toFixed(2);

    console.log('\n' + chalk.cyan.bold('Statistics:'));
    console.log(chalk.white(`  Total Alerts: ${this.stats.totalAlerts}`));
    console.log(chalk.white(`  Alert Rate: ${rate} alerts/sec`));
    console.log(chalk.white(`  Uptime: ${uptime}s`));

    console.log(chalk.white('\n  By Severity:'));
    console.log(chalk.blue(`    Info: ${this.stats.bySevertiy.info}`));
    console.log(chalk.yellow(`    Warning: ${this.stats.bySevertiy.warning}`));
    console.log(chalk.red(`    Error: ${this.stats.bySevertiy.error}`));
    console.log(chalk.bgRed.white(`    Critical: ${this.stats.bySevertiy.critical}`));

    console.log(chalk.white('\n  By Status:'));
    console.log(chalk.white(`    Active: ${this.stats.byStatus.active}`));
    console.log(chalk.white(`    Acknowledged: ${this.stats.byStatus.acknowledged}`));
    console.log(chalk.white(`    Resolved: ${this.stats.byStatus.resolved}`));
    console.log('');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    logger.info('Stopping alert monitor');

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.printStats();
  }
}

// Main execution
async function main() {
  const monitor = new AlertMonitor();

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received');
    monitor.stop();
    process.exit(0);
  });

  try {
    await monitor.start();
  } catch (error) {
    logger.error({ error }, 'Failed to start monitor');
    process.exit(1);
  }
}

main();
