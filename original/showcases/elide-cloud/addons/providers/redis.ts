/**
 * Redis Add-on Provider
 */

import { generateId, Logger } from '../../core/utils.ts';
import type { IAddonProvider } from '../addon-manager.ts';
import type { AddonPlan } from '../../core/types.ts';

const logger = new Logger('RedisProvider');

export class RedisProvider implements IAddonProvider {
  name = 'Redis';
  slug = 'redis';
  description = 'In-memory data structure store for caching and queues';

  plans: AddonPlan[] = [
    {
      id: 'hobby',
      name: 'Hobby Dev',
      slug: 'hobby',
      description: 'Free tier for development',
      price: 0,
      priceUnit: 'month',
      features: {
        maxMemory: '25MB',
        maxConnections: 20,
        persistence: false,
        highAvailability: false,
      },
    },
    {
      id: 'standard',
      name: 'Standard',
      slug: 'standard',
      description: 'Production caching',
      price: 30,
      priceUnit: 'month',
      features: {
        maxMemory: '1GB',
        maxConnections: 100,
        persistence: true,
        highAvailability: false,
      },
    },
    {
      id: 'premium',
      name: 'Premium',
      slug: 'premium',
      description: 'High availability Redis cluster',
      price: 150,
      priceUnit: 'month',
      features: {
        maxMemory: '10GB',
        maxConnections: 500,
        persistence: true,
        highAvailability: true,
      },
    },
  ];

  async provision(plan: string, config: Record<string, any>): Promise<{
    config: Record<string, any>;
    credentials: Record<string, string>;
  }> {
    logger.info(`Provisioning Redis ${plan}`);

    const password = generateId();
    const host = `redis-${generateId().substring(0, 8)}.elide-cloud.io`;
    const port = 6379;
    const tlsPort = 6380;

    const planInfo = this.plans.find(p => p.slug === plan)!;

    return {
      config: {
        host,
        port,
        tlsPort,
        maxMemory: planInfo.features.maxMemory,
      },
      credentials: {
        REDIS_URL: `redis://:${password}@${host}:${port}`,
        REDIS_TLS_URL: `rediss://:${password}@${host}:${tlsPort}`,
      },
    };
  }

  async deprovision(addonId: string, config: Record<string, any>): Promise<void> {
    logger.info(`Deprovisioning Redis ${addonId}`);
    // Simulate deprovisioning
  }

  async getInfo(addonId: string): Promise<Record<string, any>> {
    return {
      version: '7.0',
      usedMemory: `${Math.floor(Math.random() * 500)}MB`,
      keyCount: Math.floor(Math.random() * 10000),
      uptime: '99.95%',
    };
  }
}
