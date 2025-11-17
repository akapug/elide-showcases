import { Connection } from './connection';
import { Pool } from './pool';
import { PoolCluster } from './cluster';

export function createConnection(config: any): Connection {
  return new Connection(config);
}

export function createPool(config: any): Pool {
  return new Pool(config);
}

export function createPoolCluster(config?: any): PoolCluster {
  return new PoolCluster();
}
