/**
 * S3-Compatible Storage Add-on Provider
 */

import { generateId, Logger } from '../../core/utils.ts';
import type { IAddonProvider } from '../addon-manager.ts';
import type { AddonPlan } from '../../core/types.ts';

const logger = new Logger('S3Provider');

export class S3Provider implements IAddonProvider {
  name = 'S3 Storage';
  slug = 's3';
  description = 'S3-compatible object storage';

  plans: AddonPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      slug: 'basic',
      description: 'Basic object storage',
      price: 10,
      priceUnit: 'month',
      features: {
        storage: '50GB',
        bandwidth: '100GB',
      },
    },
    {
      id: 'standard',
      name: 'Standard',
      slug: 'standard',
      description: 'Standard object storage',
      price: 50,
      priceUnit: 'month',
      features: {
        storage: '500GB',
        bandwidth: '1TB',
      },
    },
  ];

  async provision(plan: string, config: Record<string, any>): Promise<{
    config: Record<string, any>;
    credentials: Record<string, string>;
  }> {
    logger.info(`Provisioning S3 Storage ${plan}`);

    const bucketName = `bucket-${generateId().substring(0, 16)}`;
    const accessKeyId = generateId().substring(0, 20).toUpperCase();
    const secretAccessKey = generateId();
    const region = 'us-east-1';

    return {
      config: {
        bucket: bucketName,
        region,
      },
      credentials: {
        S3_BUCKET: bucketName,
        S3_ACCESS_KEY_ID: accessKeyId,
        S3_SECRET_ACCESS_KEY: secretAccessKey,
        S3_REGION: region,
      },
    };
  }

  async deprovision(addonId: string, config: Record<string, any>): Promise<void> {
    logger.info(`Deprovisioning S3 Storage ${addonId}`);
  }

  async getInfo(addonId: string): Promise<Record<string, any>> {
    return {
      objects: Math.floor(Math.random() * 10000),
      storageUsed: `${Math.floor(Math.random() * 50)}GB`,
    };
  }
}
