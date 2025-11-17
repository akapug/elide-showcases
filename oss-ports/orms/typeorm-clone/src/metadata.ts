/**
 * Metadata storage for decorators
 */

class MetadataArgsStorage {
  tables: any[] = [];
  columns: any[] = [];
  relations: any[] = [];
  indices: any[] = [];
  checks: any[] = [];
  exclusions: any[] = [];
  generations: any[] = [];
  joinColumns: any[] = [];
  joinTables: any[] = [];
  relationIds: any[] = [];
  inheritances: any[] = [];
  discriminators: any[] = [];
  entityListeners: any[] = [];
  trees: any[] = [];
  entityRepositories: any[] = [];
  transactionEntityManagers: any[] = [];
  transactionRepositories: any[] = [];
}

let globalMetadata: MetadataArgsStorage | undefined;

export function getMetadataArgsStorage(): MetadataArgsStorage {
  if (!globalMetadata) {
    globalMetadata = new MetadataArgsStorage();
  }
  return globalMetadata;
}
