/**
 * MongoDB Add-on Provider
 */

import { generateId, Logger } from '../../core/utils.ts';
import type { IAddonProvider } from '../addon-manager.ts';
import type { AddonPlan } from '../../core/types.ts';

const logger = new Logger('MongoDBProvider');

export class MongoDBProvider implements IAddonProvider {
  name = 'MongoDB';
  slug = 'mongodb';
  description = 'Document-oriented NoSQL database';

  plans: AddonPlan[] = [
    {
      id: 'sandbox',
      name: 'Sandbox',
      slug: 'sandbox',
      description: 'Free tier for development',
      price: 0,
      priceUnit: 'month',
      features: {
        storage: '512MB',
        backups: false,
        replication: false,
      },
    },
    {
      id: 'shared',
      name: 'Shared',
      slug: 'shared',
      description: 'Shared cluster for small apps',
      price: 15,
      priceUnit: 'month',
      features: {
        storage: '10GB',
        backups: true,
        replication: false,
      },
    },
    {
      id: 'dedicated',
      name: 'Dedicated',
      slug: 'dedicated',
      description: 'Dedicated cluster with replication',
      price: 100,
      priceUnit: 'month',
      features: {
        storage: '80GB',
        backups: true,
        replication: true,
      },
    },
  ];

  async provision(plan: string, config: Record<string, any>): Promise<{
    config: Record<string, any>;
    credentials: Record<string, string>;
  }> {
    logger.info(`Provisioning MongoDB ${plan}`);

    const dbName = `db_${generateId().substring(0, 16).replace(/-/g, '_')}`;
    const username = `user_${generateId().substring(0, 12)}`;
    const password = generateId();
    const host = `mongo-${generateId().substring(0, 8)}.elide-cloud.io`;
    const port = 27017;

    return {
      config: {
        host,
        port,
        database: dbName,
      },
      credentials: {
        MONGODB_URI: `mongodb://${username}:${password}@${host}:${port}/${dbName}`,
        MONGODB_DATABASE: dbName,
      },
    };
  }

  async deprovision(addonId: string, config: Record<string, any>): Promise<void> {
    logger.info(`Deprovisioning MongoDB ${addonId}`);
  }

  async getInfo(addonId: string): Promise<Record<string, any>> {
    return {
      version: '6.0',
      dataSize: `${Math.floor(Math.random() * 1000)}MB`,
      collections: Math.floor(Math.random() * 20),
      documents: Math.floor(Math.random() * 100000),
    };
  }
}
