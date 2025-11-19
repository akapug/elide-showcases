/**
 * MySQL Add-on Provider
 */

import { generateId, Logger } from '../../core/utils.ts';
import type { IAddonProvider } from '../addon-manager.ts';
import type { AddonPlan } from '../../core/types.ts';

const logger = new Logger('MySQLProvider');

export class MySQLProvider implements IAddonProvider {
  name = 'MySQL';
  slug = 'mysql';
  description = 'Popular open-source relational database';

  plans: AddonPlan[] = [
    {
      id: 'ignite',
      name: 'Ignite',
      slug: 'ignite',
      description: 'Development database',
      price: 0,
      priceUnit: 'month',
      features: {
        storage: '5GB',
        connections: 10,
        backups: false,
      },
    },
    {
      id: 'blaze',
      name: 'Blaze',
      slug: 'blaze',
      description: 'Production database',
      price: 60,
      priceUnit: 'month',
      features: {
        storage: '100GB',
        connections: 75,
        backups: true,
      },
    },
  ];

  async provision(plan: string, config: Record<string, any>): Promise<{
    config: Record<string, any>;
    credentials: Record<string, string>;
  }> {
    logger.info(`Provisioning MySQL ${plan}`);

    const dbName = `db_${generateId().substring(0, 16).replace(/-/g, '_')}`;
    const username = `user_${generateId().substring(0, 12)}`;
    const password = generateId();
    const host = `mysql-${generateId().substring(0, 8)}.elide-cloud.io`;
    const port = 3306;

    return {
      config: {
        host,
        port,
        database: dbName,
      },
      credentials: {
        MYSQL_URL: `mysql://${username}:${password}@${host}:${port}/${dbName}`,
        MYSQL_DATABASE: dbName,
      },
    };
  }

  async deprovision(addonId: string, config: Record<string, any>): Promise<void> {
    logger.info(`Deprovisioning MySQL ${addonId}`);
  }

  async getInfo(addonId: string): Promise<Record<string, any>> {
    return {
      version: '8.0',
      dataSize: `${Math.floor(Math.random() * 2000)}MB`,
      tables: Math.floor(Math.random() * 50),
    };
  }
}
