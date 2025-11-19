/**
 * Add-ons Manager for Elide Cloud
 *
 * Provision and manage add-ons (databases, queues, storage, etc.)
 */

import { Logger, generateId } from '../core/utils.ts';
import type { Addon, AddonProvider, AddonPlan, Application } from '../core/types.ts';
import { db } from '../database/database.ts';
import { PostgresProvider } from './providers/postgres.ts';
import { RedisProvider } from './providers/redis.ts';
import { MongoDBProvider } from './providers/mongodb.ts';
import { MySQLProvider } from './providers/mysql.ts';
import { ElasticsearchProvider } from './providers/elasticsearch.ts';
import { RabbitMQProvider } from './providers/rabbitmq.ts';
import { S3Provider } from './providers/s3.ts';

const logger = new Logger('AddonManager');

// =============================================================================
// Add-on Provider Interface
// =============================================================================

export interface IAddonProvider {
  name: string;
  slug: string;
  description: string;
  plans: AddonPlan[];

  provision(plan: string, config: Record<string, any>): Promise<{
    config: Record<string, any>;
    credentials: Record<string, string>;
  }>;

  deprovision(addonId: string, config: Record<string, any>): Promise<void>;

  getInfo(addonId: string): Promise<Record<string, any>>;

  updatePlan?(addonId: string, newPlan: string): Promise<void>;
}

// =============================================================================
// Add-on Manager
// =============================================================================

export class AddonManager {
  private providers: Map<string, IAddonProvider> = new Map();

  constructor() {
    this.registerProviders();
  }

  /**
   * Register all add-on providers
   */
  private registerProviders(): void {
    const providers = [
      new PostgresProvider(),
      new RedisProvider(),
      new MongoDBProvider(),
      new MySQLProvider(),
      new ElasticsearchProvider(),
      new RabbitMQProvider(),
      new S3Provider(),
    ];

    for (const provider of providers) {
      this.providers.set(provider.slug, provider);
      logger.info(`Registered provider: ${provider.name}`);
    }
  }

  /**
   * Get available providers
   */
  getProviders(): AddonProvider[] {
    return Array.from(this.providers.values()).map(p => ({
      id: generateId('prv'),
      name: p.name,
      slug: p.slug,
      description: p.description,
      plans: p.plans,
      configVars: this.getConfigVars(p.slug),
      supportsSharing: true,
      supportsSingleTenancy: true,
    }));
  }

  /**
   * Get provider by slug
   */
  getProvider(slug: string): IAddonProvider | undefined {
    return this.providers.get(slug);
  }

  /**
   * Provision an add-on
   */
  async provisionAddon(
    application: Application,
    providerSlug: string,
    plan: string
  ): Promise<Addon> {
    logger.info(`Provisioning ${providerSlug}:${plan} for ${application.name}`);

    const provider = this.getProvider(providerSlug);
    if (!provider) {
      throw new Error(`Provider ${providerSlug} not found`);
    }

    // Check if plan exists
    const planInfo = provider.plans.find(p => p.slug === plan);
    if (!planInfo) {
      throw new Error(`Plan ${plan} not found for provider ${providerSlug}`);
    }

    // Create add-on record
    const addon = db.createAddon({
      applicationId: application.id,
      name: `${providerSlug}-${generateId().substring(0, 8)}`,
      provider: providerSlug,
      plan,
      config: {},
      attachments: [],
      status: 'provisioning',
      webUrl: `https://addon.elide-cloud.io/${providerSlug}`,
      metadata: {
        planPrice: planInfo.price,
        planFeatures: planInfo.features,
      },
    });

    try {
      // Provision with provider
      const result = await provider.provision(plan, {
        addonId: addon.id,
        applicationId: application.id,
        applicationName: application.name,
      });

      // Update add-on with configuration
      db.updateAddon(addon.id, {
        config: result.config,
        status: 'provisioned',
      });

      // Set config vars on application
      for (const [key, value] of Object.entries(result.credentials)) {
        db.createConfigVar({
          key,
          value,
          applicationId: application.id,
          createdBy: application.createdBy,
        });
      }

      logger.info(`Provisioned ${providerSlug}:${plan} -> ${addon.name}`);

      return db.getAddonById(addon.id)!;
    } catch (error: any) {
      logger.error(`Failed to provision ${providerSlug}:`, error);

      db.updateAddon(addon.id, {
        status: 'failed',
        metadata: {
          ...addon.metadata,
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Deprovision an add-on
   */
  async deprovisionAddon(addonId: string): Promise<void> {
    const addon = db.getAddonById(addonId);
    if (!addon) {
      throw new Error(`Add-on ${addonId} not found`);
    }

    logger.info(`Deprovisioning ${addon.name}`);

    const provider = this.getProvider(addon.provider);
    if (!provider) {
      throw new Error(`Provider ${addon.provider} not found`);
    }

    // Update status
    db.updateAddon(addonId, { status: 'deprovisioning' });

    try {
      // Deprovision with provider
      await provider.deprovision(addonId, addon.config);

      // Remove config vars
      const configVars = this.getConfigVars(addon.provider);
      for (const key of configVars) {
        db.deleteConfigVar(addon.applicationId, key);
      }

      // Delete add-on
      db.deleteAddon(addonId);

      logger.info(`Deprovisioned ${addon.name}`);
    } catch (error: any) {
      logger.error(`Failed to deprovision ${addon.name}:`, error);

      db.updateAddon(addonId, {
        status: 'failed',
        metadata: {
          ...addon.metadata,
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Get add-on info
   */
  async getAddonInfo(addonId: string): Promise<Record<string, any>> {
    const addon = db.getAddonById(addonId);
    if (!addon) {
      throw new Error(`Add-on ${addonId} not found`);
    }

    const provider = this.getProvider(addon.provider);
    if (!provider) {
      throw new Error(`Provider ${addon.provider} not found`);
    }

    return await provider.getInfo(addonId);
  }

  /**
   * Update add-on plan
   */
  async updateAddonPlan(addonId: string, newPlan: string): Promise<Addon> {
    const addon = db.getAddonById(addonId);
    if (!addon) {
      throw new Error(`Add-on ${addonId} not found`);
    }

    logger.info(`Updating ${addon.name} to plan ${newPlan}`);

    const provider = this.getProvider(addon.provider);
    if (!provider || !provider.updatePlan) {
      throw new Error(`Provider ${addon.provider} does not support plan updates`);
    }

    await provider.updatePlan(addonId, newPlan);

    db.updateAddon(addonId, { plan: newPlan });

    logger.info(`Updated ${addon.name} to plan ${newPlan}`);

    return db.getAddonById(addonId)!;
  }

  /**
   * Get config vars set by provider
   */
  private getConfigVars(providerSlug: string): string[] {
    const configVars: Record<string, string[]> = {
      postgres: ['DATABASE_URL', 'DATABASE_POOL_SIZE'],
      redis: ['REDIS_URL', 'REDIS_TLS_URL'],
      mongodb: ['MONGODB_URI', 'MONGODB_DATABASE'],
      mysql: ['MYSQL_URL', 'MYSQL_DATABASE'],
      elasticsearch: ['ELASTICSEARCH_URL', 'ELASTICSEARCH_INDEX'],
      rabbitmq: ['RABBITMQ_URL', 'RABBITMQ_VHOST'],
      s3: ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_REGION'],
    };

    return configVars[providerSlug] || [];
  }
}

// =============================================================================
// Add-on Metrics Collector
// =============================================================================

export class AddonMetricsCollector {
  /**
   * Collect metrics from all add-ons
   */
  async collectMetrics(): Promise<void> {
    const addons = Array.from(db.addons.values())
      .filter(a => a.status === 'provisioned');

    for (const addon of addons) {
      try {
        await this.collectAddonMetrics(addon);
      } catch (error: any) {
        logger.error(`Failed to collect metrics for ${addon.name}:`, error);
      }
    }
  }

  /**
   * Collect metrics for a specific add-on
   */
  private async collectAddonMetrics(addon: Addon): Promise<void> {
    // Simulate metrics collection
    const metrics = {
      connections: Math.floor(Math.random() * 100),
      queries_per_second: Math.floor(Math.random() * 1000),
      storage_used_mb: Math.floor(Math.random() * 10000),
    };

    for (const [key, value] of Object.entries(metrics)) {
      db.addMetric({
        applicationId: addon.applicationId,
        timestamp: new Date(),
        type: key as any,
        value,
        unit: key.includes('mb') ? 'mb' : 'count',
        dimensions: {
          addon: addon.name,
          provider: addon.provider,
        },
      });
    }
  }

  /**
   * Start metrics collection
   */
  startCollection(intervalMs: number = 60000): void {
    setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    logger.info('Started add-on metrics collection');
  }
}
