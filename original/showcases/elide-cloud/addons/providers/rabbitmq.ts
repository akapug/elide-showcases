/**
 * RabbitMQ Add-on Provider
 */

import { generateId, Logger } from '../../core/utils.ts';
import type { IAddonProvider } from '../addon-manager.ts';
import type { AddonPlan } from '../../core/types.ts';

const logger = new Logger('RabbitMQProvider');

export class RabbitMQProvider implements IAddonProvider {
  name = 'RabbitMQ';
  slug = 'rabbitmq';
  description = 'Message broker for asynchronous processing';

  plans: AddonPlan[] = [
    {
      id: 'lemur',
      name: 'Lemur',
      slug: 'lemur',
      description: 'Small message queue',
      price: 19,
      priceUnit: 'month',
      features: {
        maxConnections: 20,
        maxChannels: 40,
      },
    },
    {
      id: 'tiger',
      name: 'Tiger',
      slug: 'tiger',
      description: 'Production message queue',
      price: 99,
      priceUnit: 'month',
      features: {
        maxConnections: 100,
        maxChannels: 200,
      },
    },
  ];

  async provision(plan: string, config: Record<string, any>): Promise<{
    config: Record<string, any>;
    credentials: Record<string, string>;
  }> {
    logger.info(`Provisioning RabbitMQ ${plan}`);

    const username = `user_${generateId().substring(0, 12)}`;
    const password = generateId();
    const host = `rmq-${generateId().substring(0, 8)}.elide-cloud.io`;
    const vhost = generateId().substring(0, 8);

    return {
      config: {
        host,
        vhost,
      },
      credentials: {
        RABBITMQ_URL: `amqp://${username}:${password}@${host}/${vhost}`,
        RABBITMQ_VHOST: vhost,
      },
    };
  }

  async deprovision(addonId: string, config: Record<string, any>): Promise<void> {
    logger.info(`Deprovisioning RabbitMQ ${addonId}`);
  }

  async getInfo(addonId: string): Promise<Record<string, any>> {
    return {
      version: '3.12',
      queues: Math.floor(Math.random() * 10),
      messages: Math.floor(Math.random() * 10000),
    };
  }
}
