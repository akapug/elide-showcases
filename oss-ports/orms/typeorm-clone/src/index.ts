/**
 * @elide/typeorm-clone - TypeScript ORM with decorators
 */

import 'reflect-metadata';

// Core exports
export { DataSource, createConnection, getConnection, getConnectionManager } from './connection';
export { EntityManager, getManager } from './entity-manager';
export { Repository, TreeRepository, MongoRepository } from './repository';
export { QueryBuilder, SelectQueryBuilder } from './query-builder';
export { QueryRunner } from './query-runner';

// Decorators
export * from './decorator';

// Types
export * from './types';

// Migrations
export { Migration, MigrationInterface } from './migration';
export { MigrationExecutor } from './migration/executor';

// Subscribers
export { EntitySubscriberInterface, EventSubscriber } from './subscriber';

// Metadata
export { getMetadataArgsStorage } from './metadata';

// Error handling
export * from './error';

// Utilities
export { EntitySchema } from './entity-schema';
export { SelectQueryBuilder as BaseQueryBuilder } from './query-builder';

// Version
export const VERSION = '1.0.0';
