/**
 * Data Source Configurations
 */

import type { DatasourceConfig } from './types';

/**
 * Create a Prometheus data source
 */
export function createPrometheusDatasource(options: {
  name: string;
  url: string;
  isDefault?: boolean;
  basicAuth?: boolean;
  basicAuthUser?: string;
  basicAuthPassword?: string;
  scrapeInterval?: string;
  queryTimeout?: string;
  httpMethod?: string;
}): DatasourceConfig {
  return {
    name: options.name,
    type: 'prometheus',
    url: options.url,
    access: 'proxy',
    isDefault: options.isDefault || false,
    basicAuth: options.basicAuth || false,
    basicAuthUser: options.basicAuthUser,
    basicAuthPassword: options.basicAuthPassword,
    jsonData: {
      scrapeInterval: options.scrapeInterval || '15s',
      queryTimeout: options.queryTimeout || '60s',
      httpMethod: options.httpMethod || 'POST',
    },
  };
}

/**
 * Create an InfluxDB data source
 */
export function createInfluxDBDatasource(options: {
  name: string;
  url: string;
  database?: string;
  user?: string;
  password?: string;
  isDefault?: boolean;
}): DatasourceConfig {
  return {
    name: options.name,
    type: 'influxdb',
    url: options.url,
    access: 'proxy',
    isDefault: options.isDefault || false,
    jsonData: {
      database: options.database || 'metrics',
      httpMode: 'GET',
    },
    secureJsonData: options.user
      ? {
          user: options.user,
          password: options.password,
        }
      : undefined,
  };
}

/**
 * Create an Elasticsearch data source
 */
export function createElasticsearchDatasource(options: {
  name: string;
  url: string;
  index?: string;
  timeField?: string;
  version?: string;
  isDefault?: boolean;
  basicAuth?: boolean;
  basicAuthUser?: string;
  basicAuthPassword?: string;
}): DatasourceConfig {
  return {
    name: options.name,
    type: 'elasticsearch',
    url: options.url,
    access: 'proxy',
    isDefault: options.isDefault || false,
    basicAuth: options.basicAuth || false,
    basicAuthUser: options.basicAuthUser,
    basicAuthPassword: options.basicAuthPassword,
    jsonData: {
      index: options.index || '[metrics-]YYYY.MM.DD',
      timeField: options.timeField || '@timestamp',
      esVersion: options.version || '7.10.0',
      interval: 'Daily',
    },
  };
}

/**
 * Create a Loki data source
 */
export function createLokiDatasource(options: {
  name: string;
  url: string;
  maxLines?: number;
  isDefault?: boolean;
}): DatasourceConfig {
  return {
    name: options.name,
    type: 'loki',
    url: options.url,
    access: 'proxy',
    isDefault: options.isDefault || false,
    jsonData: {
      maxLines: options.maxLines || 1000,
    },
  };
}

/**
 * Create a Graphite data source
 */
export function createGraphiteDatasource(options: {
  name: string;
  url: string;
  graphiteVersion?: string;
  isDefault?: boolean;
}): DatasourceConfig {
  return {
    name: options.name,
    type: 'graphite',
    url: options.url,
    access: 'proxy',
    isDefault: options.isDefault || false,
    jsonData: {
      graphiteVersion: options.graphiteVersion || '1.1',
    },
  };
}

/**
 * Create a MySQL data source
 */
export function createMySQLDatasource(options: {
  name: string;
  host: string;
  database: string;
  user: string;
  password: string;
  isDefault?: boolean;
}): DatasourceConfig {
  return {
    name: options.name,
    type: 'mysql',
    url: options.host,
    access: 'proxy',
    isDefault: options.isDefault || false,
    jsonData: {
      database: options.database,
      maxOpenConns: 0,
      maxIdleConns: 2,
      connMaxLifetime: 14400,
    },
    secureJsonData: {
      user: options.user,
      password: options.password,
    },
  };
}

/**
 * Create a PostgreSQL data source
 */
export function createPostgresDatasource(options: {
  name: string;
  host: string;
  database: string;
  user: string;
  password: string;
  sslmode?: string;
  isDefault?: boolean;
}): DatasourceConfig {
  return {
    name: options.name,
    type: 'postgres',
    url: options.host,
    access: 'proxy',
    isDefault: options.isDefault || false,
    jsonData: {
      database: options.database,
      sslmode: options.sslmode || 'disable',
      maxOpenConns: 0,
      maxIdleConns: 2,
      connMaxLifetime: 14400,
    },
    secureJsonData: {
      user: options.user,
      password: options.password,
    },
  };
}

/**
 * Create a Cloudwatch data source
 */
export function createCloudwatchDatasource(options: {
  name: string;
  defaultRegion: string;
  authType?: string;
  accessKey?: string;
  secretKey?: string;
  isDefault?: boolean;
}): DatasourceConfig {
  return {
    name: options.name,
    type: 'cloudwatch',
    access: 'proxy',
    isDefault: options.isDefault || false,
    jsonData: {
      defaultRegion: options.defaultRegion,
      authType: options.authType || 'keys',
    },
    secureJsonData: options.accessKey
      ? {
          accessKey: options.accessKey,
          secretKey: options.secretKey,
        }
      : undefined,
  };
}
