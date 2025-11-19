/**
 * Elide KafkaJS Clone - Main Entry Point
 * Production-ready Apache Kafka client for Elide
 */

import { Producer } from './producer';
import { Consumer } from './consumer';
import { Admin } from './admin';
import { createLogger } from './logger';
import {
  KafkaConfig,
  ProducerConfig,
  ConsumerConfig,
  AdminConfig,
  LogLevel,
  Logger,
} from './types';

export class Kafka {
  private logger: Logger;

  constructor(private config: KafkaConfig) {
    const logLevel = config.logLevel ?? LogLevel.INFO;
    this.logger = createLogger(logLevel);

    this.logger.info('Kafka client initialized', {
      clientId: config.clientId,
      brokers: config.brokers,
    });
  }

  /**
   * Create a producer instance
   */
  producer(config: ProducerConfig = {}): Producer {
    this.logger.debug('Creating producer');
    return new Producer(config, this.config.brokers, this.logger);
  }

  /**
   * Create a consumer instance
   */
  consumer(config: ConsumerConfig): Consumer {
    this.logger.debug('Creating consumer', { groupId: config.groupId });
    return new Consumer(config, this.config.brokers, this.logger);
  }

  /**
   * Create an admin instance
   */
  admin(config: AdminConfig = {}): Admin {
    this.logger.debug('Creating admin client');
    return new Admin(config, this.config.brokers, this.logger);
  }

  /**
   * Get logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }
}

// Export types
export * from './types';
export { Producer } from './producer';
export { Consumer } from './consumer';
export { Admin } from './admin';
export { createLogger, createDefaultLogger } from './logger';

// Default export
export default Kafka;
