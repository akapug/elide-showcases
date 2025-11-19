/**
 * Elide AMQPLIB Clone - Main Entry Point
 * Production-ready RabbitMQ/AMQP client for Elide
 */

import { ConnectionImpl } from './connection';
import { ConnectionOptions, Connection } from './types';

/**
 * Connect to RabbitMQ server
 */
export async function connect(url: string | ConnectionOptions): Promise<Connection> {
  let options: ConnectionOptions;

  if (typeof url === 'string') {
    options = parseConnectionUrl(url);
  } else {
    options = url;
  }

  const connection = new ConnectionImpl(options);
  await connection.connect();

  return connection;
}

/**
 * Parse AMQP connection URL
 */
function parseConnectionUrl(url: string): ConnectionOptions {
  const urlPattern = /^(amqps?):\/\/(?:([^:]+):([^@]+)@)?([^:/]+)(?::(\d+))?(\/.*)?$/;
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error(`Invalid AMQP URL: ${url}`);
  }

  const [, protocol, username, password, hostname, port, vhost] = match;

  return {
    protocol: protocol as 'amqp' | 'amqps',
    hostname: hostname || 'localhost',
    port: port ? parseInt(port) : protocol === 'amqps' ? 5671 : 5672,
    username: username || 'guest',
    password: password || 'guest',
    vhost: vhost || '/',
  };
}

// Export types and classes
export * from './types';
export { ConnectionImpl } from './connection';
export { ChannelImpl } from './channel';
export { ConfirmChannelImpl } from './confirm-channel';

// Default export
export default { connect };
