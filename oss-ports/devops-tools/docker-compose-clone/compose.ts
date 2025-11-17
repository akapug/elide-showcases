#!/usr/bin/env elide

/**
 * Docker Compose Clone - Container Orchestration for Elide
 *
 * A production-ready container orchestration tool inspired by Docker Compose,
 * built with Elide for superior performance.
 *
 * @author Elide Team
 * @license MIT
 */

import { spawn, exec, ChildProcess, execSync } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import * as os from 'os';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface ComposeConfig {
  version: string;
  services: Record<string, ServiceConfig>;
  networks?: Record<string, NetworkConfig>;
  volumes?: Record<string, VolumeConfig>;
  secrets?: Record<string, SecretConfig>;
  configs?: Record<string, ConfigConfig>;
}

interface ServiceConfig {
  image?: string;
  build?: string | BuildConfig;
  command?: string | string[];
  entrypoint?: string | string[];
  environment?: Record<string, string> | string[];
  env_file?: string | string[];
  ports?: string[];
  expose?: string[];
  volumes?: string[];
  networks?: string[] | Record<string, NetworkAttachment>;
  depends_on?: string[] | Record<string, DependencyConfig>;
  healthcheck?: HealthCheck;
  restart?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  deploy?: DeployConfig;
  labels?: Record<string, string> | string[];
  logging?: LoggingConfig;
  hostname?: string;
  dns?: string | string[];
  extra_hosts?: string[];
  profiles?: string[];
  secrets?: string[] | Record<string, SecretReference>;
  configs?: string[] | Record<string, ConfigReference>;
  container_name?: string;
  working_dir?: string;
  user?: string;
  stdin_open?: boolean;
  tty?: boolean;
  privileged?: boolean;
}

interface BuildConfig {
  context: string;
  dockerfile?: string;
  args?: Record<string, string> | string[];
  target?: string;
  cache_from?: string[];
  labels?: Record<string, string>;
}

interface NetworkConfig {
  driver?: string;
  driver_opts?: Record<string, string>;
  ipam?: IPAMConfig;
  external?: boolean;
  internal?: boolean;
  name?: string;
  labels?: Record<string, string>;
}

interface IPAMConfig {
  driver?: string;
  config?: Array<{
    subnet?: string;
    ip_range?: string;
    gateway?: string;
  }>;
}

interface VolumeConfig {
  driver?: string;
  driver_opts?: Record<string, string>;
  external?: boolean;
  name?: string;
  labels?: Record<string, string>;
}

interface SecretConfig {
  file?: string;
  external?: boolean;
  name?: string;
}

interface ConfigConfig {
  file?: string;
  external?: boolean;
  name?: string;
}

interface SecretReference {
  source: string;
  target?: string;
  uid?: string;
  gid?: string;
  mode?: number;
}

interface ConfigReference {
  source: string;
  target?: string;
  uid?: string;
  gid?: string;
  mode?: number;
}

interface NetworkAttachment {
  aliases?: string[];
  ipv4_address?: string;
  ipv6_address?: string;
}

interface DependencyConfig {
  condition: 'service_started' | 'service_healthy' | 'service_completed_successfully';
}

interface HealthCheck {
  test: string | string[];
  interval?: string;
  timeout?: string;
  retries?: number;
  start_period?: string;
  disable?: boolean;
}

interface DeployConfig {
  resources?: {
    limits?: {
      cpus?: string;
      memory?: string;
    };
    reservations?: {
      cpus?: string;
      memory?: string;
    };
  };
  replicas?: number;
  placement?: {
    constraints?: string[];
  };
}

interface LoggingConfig {
  driver?: string;
  options?: Record<string, string>;
}

interface Container {
  id: string;
  name: string;
  service: string;
  status: ContainerStatus;
  ports: PortMapping[];
  created: Date;
  startedAt?: Date;
  health?: HealthStatus;
  exitCode?: number;
}

type ContainerStatus = 'created' | 'running' | 'paused' | 'stopped' | 'exited' | 'dead';
type HealthStatus = 'starting' | 'healthy' | 'unhealthy';

interface PortMapping {
  host: number;
  container: number;
  protocol: 'tcp' | 'udp';
}

interface Network {
  id: string;
  name: string;
  driver: string;
  containers: string[];
}

interface Volume {
  id: string;
  name: string;
  driver: string;
  mountpoint: string;
}

// ============================================================================
// Compose Manager
// ============================================================================

class ComposeManager extends EventEmitter {
  private config: ComposeConfig;
  private projectName: string;
  private projectDir: string;
  private containers: Map<string, Container> = new Map();
  private networks: Map<string, Network> = new Map();
  private volumes: Map<string, Volume> = new Map();
  private configFile: string;
  private profiles: string[] = [];

  constructor(configFile: string, projectName?: string, profiles: string[] = []) {
    super();
    this.configFile = path.resolve(configFile);
    this.projectDir = path.dirname(this.configFile);
    this.projectName = projectName || path.basename(this.projectDir);
    this.profiles = profiles;
    this.config = this.loadConfig();
  }

  /**
   * Load and parse compose configuration
   */
  private loadConfig(): ComposeConfig {
    if (!fs.existsSync(this.configFile)) {
      throw new Error(`Configuration file not found: ${this.configFile}`);
    }

    const content = fs.readFileSync(this.configFile, 'utf-8');
    const config = yaml.parse(content) as ComposeConfig;

    this.validateConfig(config);
    return this.resolveEnvironmentVariables(config);
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: ComposeConfig): void {
    if (!config.version) {
      throw new Error('Missing version field in compose file');
    }

    if (!config.services || Object.keys(config.services).length === 0) {
      throw new Error('No services defined in compose file');
    }

    // Validate services
    for (const [name, service] of Object.entries(config.services)) {
      if (!service.image && !service.build) {
        throw new Error(`Service ${name} must have either image or build`);
      }
    }
  }

  /**
   * Resolve environment variables in configuration
   */
  private resolveEnvironmentVariables(config: ComposeConfig): ComposeConfig {
    const resolved = JSON.parse(JSON.stringify(config));

    const resolve = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/\$\{(\w+)(?::([^}]+))?\}/g, (match, key, defaultValue) => {
          return process.env[key] || defaultValue || match;
        });
      }

      if (Array.isArray(obj)) {
        return obj.map(resolve);
      }

      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = resolve(value);
        }
        return result;
      }

      return obj;
    };

    return resolve(resolved);
  }

  /**
   * Get services filtered by profiles
   */
  private getActiveServices(): Record<string, ServiceConfig> {
    const services: Record<string, ServiceConfig> = {};

    for (const [name, service] of Object.entries(this.config.services)) {
      // Include if no profiles specified or profile matches
      if (!service.profiles || service.profiles.length === 0 ||
          service.profiles.some(p => this.profiles.includes(p))) {
        services[name] = service;
      }
    }

    return services;
  }

  /**
   * Start services
   */
  async up(options: {
    detach?: boolean;
    build?: boolean;
    forceRecreate?: boolean;
    scale?: Record<string, number>;
    removeOrphans?: boolean;
    services?: string[];
  } = {}): Promise<void> {
    console.log(`Starting ${this.projectName}...`);

    const services = this.getActiveServices();
    const serviceNames = options.services && options.services.length > 0
      ? options.services
      : Object.keys(services);

    // Create networks
    await this.createNetworks();

    // Create volumes
    await this.createVolumes();

    // Build images if needed
    if (options.build) {
      await this.build({ services: serviceNames });
    }

    // Pull images
    await this.pullImages(serviceNames);

    // Start services in dependency order
    const startOrder = this.resolveStartOrder(serviceNames);

    for (const serviceName of startOrder) {
      const service = services[serviceName];
      if (!service) continue;

      const replicas = options.scale?.[serviceName] || 1;

      for (let i = 0; i < replicas; i++) {
        const containerName = replicas > 1
          ? `${this.projectName}_${serviceName}_${i + 1}`
          : `${this.projectName}_${serviceName}_1`;

        await this.startContainer(serviceName, service, containerName, i);
      }
    }

    console.log(`\n${this.projectName} started successfully`);

    if (!options.detach) {
      // Stream logs
      await this.streamLogs();
    }
  }

  /**
   * Stop and remove services
   */
  async down(options: {
    volumes?: boolean;
    removeOrphans?: boolean;
    rmi?: 'all' | 'local';
  } = {}): Promise<void> {
    console.log(`Stopping ${this.projectName}...`);

    // Stop all containers
    for (const container of this.containers.values()) {
      await this.stopContainer(container.id);
      await this.removeContainer(container.id);
    }

    this.containers.clear();

    // Remove networks
    for (const network of this.networks.values()) {
      await this.removeNetwork(network.id);
    }

    this.networks.clear();

    // Remove volumes if requested
    if (options.volumes) {
      for (const volume of this.volumes.values()) {
        await this.removeVolume(volume.id);
      }

      this.volumes.clear();
    }

    // Remove images if requested
    if (options.rmi) {
      await this.removeImages(options.rmi);
    }

    console.log(`${this.projectName} stopped`);
  }

  /**
   * List services
   */
  ps(options: { all?: boolean; quiet?: boolean; services?: string[] } = {}): void {
    const containers = Array.from(this.containers.values());

    if (options.quiet) {
      containers.forEach(c => console.log(c.id));
      return;
    }

    console.log('\n┌────────────────────────────────────────────────────────────────┐');
    console.log('│ Name                Service      Status      Ports             │');
    console.log('├────────────────────────────────────────────────────────────────┤');

    containers.forEach(container => {
      if (!options.all && container.status !== 'running') {
        return;
      }

      const name = container.name.slice(0, 19).padEnd(19);
      const service = container.service.slice(0, 12).padEnd(12);
      const status = container.status.padEnd(11);
      const ports = this.formatPorts(container.ports).slice(0, 18);

      console.log(`│ ${name} ${service} ${status} ${ports} │`);
    });

    console.log('└────────────────────────────────────────────────────────────────┘\n');
  }

  /**
   * View logs
   */
  async logs(options: {
    follow?: boolean;
    tail?: number;
    timestamps?: boolean;
    services?: string[];
  } = {}): Promise<void> {
    const containers = Array.from(this.containers.values());
    const filtered = options.services
      ? containers.filter(c => options.services!.includes(c.service))
      : containers;

    for (const container of filtered) {
      console.log(`\n=== ${container.name} ===`);
      await this.getContainerLogs(container.id, options);
    }
  }

  /**
   * Build services
   */
  async build(options: {
    noCache?: boolean;
    pull?: boolean;
    parallel?: boolean;
    services?: string[];
  } = {}): Promise<void> {
    const services = this.getActiveServices();
    const toBuild = options.services || Object.keys(services);

    console.log('Building services...');

    const buildPromises = toBuild.map(async (serviceName) => {
      const service = services[serviceName];
      if (!service || !service.build) {
        return;
      }

      await this.buildService(serviceName, service, options);
    });

    if (options.parallel) {
      await Promise.all(buildPromises);
    } else {
      for (const promise of buildPromises) {
        await promise;
      }
    }

    console.log('Build complete');
  }

  /**
   * Execute command in service
   */
  async exec(service: string, command: string[], options: {
    user?: string;
    workdir?: string;
    env?: Record<string, string>;
    tty?: boolean;
  } = {}): Promise<void> {
    const container = Array.from(this.containers.values())
      .find(c => c.service === service && c.status === 'running');

    if (!container) {
      throw new Error(`Service ${service} is not running`);
    }

    await this.execInContainer(container.id, command, options);
  }

  /**
   * Pull service images
   */
  async pull(options: {
    ignorePullFailures?: boolean;
    quiet?: boolean;
    services?: string[];
  } = {}): Promise<void> {
    const services = this.getActiveServices();
    const toPull = options.services || Object.keys(services);

    for (const serviceName of toPull) {
      const service = services[serviceName];
      if (!service.image) continue;

      try {
        await this.pullImage(service.image, options.quiet);
      } catch (err) {
        if (!options.ignorePullFailures) {
          throw err;
        }
        console.error(`Failed to pull ${service.image}:`, err);
      }
    }
  }

  /**
   * Validate configuration
   */
  validateConfiguration(): void {
    console.log('Validating configuration...');

    try {
      this.validateConfig(this.config);
      console.log('Configuration is valid');
      console.log(yaml.stringify(this.config));
    } catch (err) {
      console.error('Configuration error:', err);
      process.exit(1);
    }
  }

  // ============================================================================
  // Container Operations
  // ============================================================================

  private async startContainer(
    serviceName: string,
    service: ServiceConfig,
    containerName: string,
    index: number
  ): Promise<void> {
    console.log(`Starting ${containerName}...`);

    // Check dependencies
    await this.waitForDependencies(service);

    const container: Container = {
      id: this.generateContainerId(),
      name: containerName,
      service: serviceName,
      status: 'created',
      ports: this.parsePorts(service.ports || []),
      created: new Date(),
    };

    this.containers.set(container.id, container);

    // Create container
    await this.createContainer(container, service, index);

    // Start container
    container.status = 'running';
    container.startedAt = new Date();

    // Setup health check
    if (service.healthcheck) {
      this.setupHealthCheck(container, service.healthcheck);
    }

    this.emit('container:start', container);
  }

  private async createContainer(
    container: Container,
    service: ServiceConfig,
    index: number
  ): Promise<void> {
    // Build docker run command
    const args: string[] = ['run', '-d'];

    // Container name
    args.push('--name', container.name);

    // Environment variables
    if (service.environment) {
      const env = Array.isArray(service.environment)
        ? service.environment
        : Object.entries(service.environment).map(([k, v]) => `${k}=${v}`);

      env.forEach(e => args.push('-e', e));
    }

    // Ports
    service.ports?.forEach(port => {
      args.push('-p', port);
    });

    // Volumes
    service.volumes?.forEach(volume => {
      args.push('-v', this.resolveVolume(volume));
    });

    // Networks
    const networks = this.getServiceNetworks(service);
    if (networks.length > 0) {
      args.push('--network', networks[0]);
    }

    // Restart policy
    if (service.restart) {
      args.push('--restart', service.restart);
    }

    // Resource limits
    if (service.deploy?.resources?.limits) {
      const limits = service.deploy.resources.limits;
      if (limits.cpus) {
        args.push('--cpus', limits.cpus);
      }
      if (limits.memory) {
        args.push('--memory', limits.memory);
      }
    }

    // Hostname
    if (service.hostname) {
      args.push('--hostname', service.hostname);
    }

    // DNS
    if (service.dns) {
      const dns = Array.isArray(service.dns) ? service.dns : [service.dns];
      dns.forEach(d => args.push('--dns', d));
    }

    // Extra hosts
    service.extra_hosts?.forEach(host => {
      args.push('--add-host', host);
    });

    // Labels
    if (service.labels) {
      const labels = Array.isArray(service.labels)
        ? service.labels
        : Object.entries(service.labels).map(([k, v]) => `${k}=${v}`);

      labels.forEach(l => args.push('--label', l));
    }

    // Working directory
    if (service.working_dir) {
      args.push('-w', service.working_dir);
    }

    // User
    if (service.user) {
      args.push('-u', service.user);
    }

    // TTY and stdin
    if (service.tty) args.push('-t');
    if (service.stdin_open) args.push('-i');

    // Privileged
    if (service.privileged) {
      args.push('--privileged');
    }

    // Image
    const image = service.image || `${this.projectName}_${container.service}`;
    args.push(image);

    // Command
    if (service.command) {
      const command = Array.isArray(service.command)
        ? service.command
        : service.command.split(' ');
      args.push(...command);
    }

    // Execute docker run
    await this.execCommand('docker', args);
  }

  private async stopContainer(containerId: string): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) return;

    console.log(`Stopping ${container.name}...`);

    await this.execCommand('docker', ['stop', container.name]);

    container.status = 'stopped';
    this.emit('container:stop', container);
  }

  private async removeContainer(containerId: string): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) return;

    await this.execCommand('docker', ['rm', '-f', container.name]);
    this.emit('container:remove', container);
  }

  private async execInContainer(
    containerId: string,
    command: string[],
    options: any
  ): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) {
      throw new Error('Container not found');
    }

    const args = ['exec'];

    if (options.user) args.push('-u', options.user);
    if (options.workdir) args.push('-w', options.workdir);
    if (options.tty !== false) args.push('-it');

    if (options.env) {
      Object.entries(options.env).forEach(([k, v]) => {
        args.push('-e', `${k}=${v}`);
      });
    }

    args.push(container.name, ...command);

    await this.execCommandInteractive('docker', args);
  }

  private async getContainerLogs(
    containerId: string,
    options: any
  ): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) return;

    const args = ['logs'];

    if (options.follow) args.push('-f');
    if (options.tail) args.push('--tail', String(options.tail));
    if (options.timestamps) args.push('-t');

    args.push(container.name);

    await this.execCommandInteractive('docker', args);
  }

  // ============================================================================
  // Network Operations
  // ============================================================================

  private async createNetworks(): Promise<void> {
    if (!this.config.networks) return;

    for (const [name, config] of Object.entries(this.config.networks)) {
      if (config.external) continue;

      const networkName = `${this.projectName}_${name}`;

      const args = ['network', 'create'];

      if (config.driver) {
        args.push('--driver', config.driver);
      }

      if (config.internal) {
        args.push('--internal');
      }

      if (config.ipam?.config) {
        config.ipam.config.forEach(ipamConfig => {
          if (ipamConfig.subnet) {
            args.push('--subnet', ipamConfig.subnet);
          }
          if (ipamConfig.gateway) {
            args.push('--gateway', ipamConfig.gateway);
          }
        });
      }

      args.push(networkName);

      try {
        await this.execCommand('docker', args);

        this.networks.set(name, {
          id: networkName,
          name: networkName,
          driver: config.driver || 'bridge',
          containers: [],
        });
      } catch (err) {
        // Network might already exist
        console.warn(`Network ${networkName} already exists`);
      }
    }
  }

  private async removeNetwork(networkId: string): Promise<void> {
    try {
      await this.execCommand('docker', ['network', 'rm', networkId]);
    } catch (err) {
      // Ignore errors
    }
  }

  private getServiceNetworks(service: ServiceConfig): string[] {
    const networks: string[] = [];

    if (service.networks) {
      if (Array.isArray(service.networks)) {
        networks.push(...service.networks.map(n => `${this.projectName}_${n}`));
      } else {
        networks.push(...Object.keys(service.networks).map(n => `${this.projectName}_${n}`));
      }
    }

    // Default network
    if (networks.length === 0) {
      networks.push(`${this.projectName}_default`);
    }

    return networks;
  }

  // ============================================================================
  // Volume Operations
  // ============================================================================

  private async createVolumes(): Promise<void> {
    if (!this.config.volumes) return;

    for (const [name, config] of Object.entries(this.config.volumes)) {
      if (config.external) continue;

      const volumeName = `${this.projectName}_${name}`;

      const args = ['volume', 'create'];

      if (config.driver) {
        args.push('--driver', config.driver);
      }

      if (config.driver_opts) {
        Object.entries(config.driver_opts).forEach(([k, v]) => {
          args.push('--opt', `${k}=${v}`);
        });
      }

      args.push(volumeName);

      try {
        await this.execCommand('docker', args);

        this.volumes.set(name, {
          id: volumeName,
          name: volumeName,
          driver: config.driver || 'local',
          mountpoint: `/var/lib/docker/volumes/${volumeName}/_data`,
        });
      } catch (err) {
        console.warn(`Volume ${volumeName} already exists`);
      }
    }
  }

  private async removeVolume(volumeId: string): Promise<void> {
    try {
      await this.execCommand('docker', ['volume', 'rm', volumeId]);
    } catch (err) {
      // Ignore errors
    }
  }

  private resolveVolume(volume: string): string {
    const parts = volume.split(':');

    if (parts.length < 2) {
      return volume;
    }

    const source = parts[0];

    // Named volume
    if (!source.startsWith('.') && !source.startsWith('/')) {
      parts[0] = `${this.projectName}_${source}`;
    }
    // Relative path
    else if (source.startsWith('.')) {
      parts[0] = path.resolve(this.projectDir, source);
    }

    return parts.join(':');
  }

  // ============================================================================
  // Build Operations
  // ============================================================================

  private async buildService(
    serviceName: string,
    service: ServiceConfig,
    options: any
  ): Promise<void> {
    console.log(`Building ${serviceName}...`);

    const buildConfig = typeof service.build === 'string'
      ? { context: service.build }
      : service.build!;

    const args = ['build'];

    if (options.noCache) {
      args.push('--no-cache');
    }

    if (options.pull) {
      args.push('--pull');
    }

    // Build args
    if (buildConfig.args) {
      const buildArgs = Array.isArray(buildConfig.args)
        ? buildConfig.args
        : Object.entries(buildConfig.args).map(([k, v]) => `${k}=${v}`);

      buildArgs.forEach(arg => args.push('--build-arg', arg));
    }

    // Target
    if (buildConfig.target) {
      args.push('--target', buildConfig.target);
    }

    // Dockerfile
    if (buildConfig.dockerfile) {
      args.push('-f', path.join(buildConfig.context, buildConfig.dockerfile));
    }

    // Tag
    const tag = service.image || `${this.projectName}_${serviceName}`;
    args.push('-t', tag);

    // Context
    args.push(path.resolve(this.projectDir, buildConfig.context));

    await this.execCommandInteractive('docker', args);
  }

  private async pullImages(services: string[]): Promise<void> {
    const serviceConfigs = this.getActiveServices();

    for (const serviceName of services) {
      const service = serviceConfigs[serviceName];
      if (!service || !service.image || service.build) {
        continue;
      }

      try {
        await this.pullImage(service.image, false);
      } catch (err) {
        console.warn(`Failed to pull image ${service.image}`);
      }
    }
  }

  private async pullImage(image: string, quiet: boolean): Promise<void> {
    const args = ['pull'];
    if (quiet) args.push('-q');
    args.push(image);

    await this.execCommand('docker', args);
  }

  private async removeImages(type: 'all' | 'local'): Promise<void> {
    const services = this.getActiveServices();

    for (const [serviceName, service] of Object.entries(services)) {
      const image = service.image || `${this.projectName}_${serviceName}`;

      if (type === 'local' && service.image) {
        continue; // Skip external images
      }

      try {
        await this.execCommand('docker', ['rmi', image]);
      } catch (err) {
        // Ignore errors
      }
    }
  }

  // ============================================================================
  // Dependency Resolution
  // ============================================================================

  private resolveStartOrder(services: string[]): string[] {
    const serviceConfigs = this.getActiveServices();
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (serviceName: string) => {
      if (visited.has(serviceName)) return;
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected: ${serviceName}`);
      }

      visiting.add(serviceName);

      const service = serviceConfigs[serviceName];
      if (service && service.depends_on) {
        const deps = Array.isArray(service.depends_on)
          ? service.depends_on
          : Object.keys(service.depends_on);

        deps.forEach(dep => {
          if (services.includes(dep)) {
            visit(dep);
          }
        });
      }

      visiting.delete(serviceName);
      visited.add(serviceName);
      order.push(serviceName);
    };

    services.forEach(visit);

    return order;
  }

  private async waitForDependencies(service: ServiceConfig): Promise<void> {
    if (!service.depends_on) return;

    const deps = Array.isArray(service.depends_on)
      ? service.depends_on.reduce((acc, dep) => {
          acc[dep] = { condition: 'service_started' };
          return acc;
        }, {} as Record<string, DependencyConfig>)
      : service.depends_on;

    for (const [depName, config] of Object.entries(deps)) {
      await this.waitForService(depName, config.condition);
    }
  }

  private async waitForService(serviceName: string, condition: string): Promise<void> {
    const maxWait = 60000; // 60 seconds
    const interval = 1000; // 1 second
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const container = Array.from(this.containers.values())
        .find(c => c.service === serviceName);

      if (!container) {
        await this.sleep(interval);
        continue;
      }

      if (condition === 'service_started' && container.status === 'running') {
        return;
      }

      if (condition === 'service_healthy' && container.health === 'healthy') {
        return;
      }

      await this.sleep(interval);
    }

    throw new Error(`Timeout waiting for ${serviceName} (${condition})`);
  }

  // ============================================================================
  // Health Checks
  // ============================================================================

  private setupHealthCheck(container: Container, healthcheck: HealthCheck): void {
    if (healthcheck.disable) return;

    container.health = 'starting';

    const interval = this.parseDuration(healthcheck.interval || '30s');
    const timeout = this.parseDuration(healthcheck.timeout || '30s');
    const retries = healthcheck.retries || 3;

    let failures = 0;

    const check = async () => {
      try {
        const test = Array.isArray(healthcheck.test)
          ? healthcheck.test
          : [healthcheck.test];

        // Execute health check
        await this.execHealthCheck(container, test);

        // Health check passed
        failures = 0;
        container.health = 'healthy';
      } catch (err) {
        failures++;

        if (failures >= retries) {
          container.health = 'unhealthy';
          console.error(`Health check failed for ${container.name}`);
        }
      }
    };

    // Start health checks
    const healthInterval = setInterval(check, interval);

    // Stop on container stop
    this.once(`container:stop:${container.id}`, () => {
      clearInterval(healthInterval);
    });
  }

  private async execHealthCheck(container: Container, test: string[]): Promise<void> {
    const command = test[0] === 'CMD' ? test.slice(1) : test;

    await this.execCommand('docker', [
      'exec',
      container.name,
      ...command,
    ]);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async execCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('exit', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });
    });
  }

  private async execCommandInteractive(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        stdio: 'inherit',
      });

      proc.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  }

  private async streamLogs(): Promise<void> {
    // Stream logs from all containers
    const promises = Array.from(this.containers.values()).map(container => {
      return this.getContainerLogs(container.id, { follow: true, timestamps: true });
    });

    await Promise.race(promises);
  }

  private generateContainerId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private parsePorts(ports: string[]): PortMapping[] {
    return ports.map(port => {
      const [hostPort, containerPort] = port.split(':');
      return {
        host: parseInt(hostPort) || 0,
        container: parseInt(containerPort) || parseInt(hostPort),
        protocol: 'tcp',
      };
    });
  }

  private formatPorts(ports: PortMapping[]): string {
    return ports
      .map(p => `${p.host}->${p.container}`)
      .join(', ');
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)(s|m|h)$/);
    if (!match) return 30000; // default 30s

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
    };

    return value * multipliers[unit];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

class CLI {
  async run(args: string[]): Promise<void> {
    const command = args[0];
    const params = args.slice(1);

    // Parse global options
    const options = this.parseOptions(params);
    const configFile = options.file || options.f || 'docker-compose.yml';
    const projectName = options['project-name'] || options.p;
    const profiles = options.profile ? [options.profile].flat() : [];

    try {
      const manager = new ComposeManager(configFile, projectName, profiles);

      switch (command) {
        case 'up':
          await this.cmdUp(manager, params);
          break;
        case 'down':
          await this.cmdDown(manager, params);
          break;
        case 'ps':
          manager.ps(this.parseOptions(params));
          break;
        case 'logs':
          await manager.logs(this.parseOptions(params));
          break;
        case 'build':
          await manager.build(this.parseOptions(params));
          break;
        case 'pull':
          await manager.pull(this.parseOptions(params));
          break;
        case 'exec':
          await this.cmdExec(manager, params);
          break;
        case 'config':
          manager.validateConfiguration();
          break;
        case 'version':
          this.showVersion();
          break;
        default:
          this.showHelp();
      }
    } catch (err) {
      console.error('Error:', err);
      process.exit(1);
    }
  }

  private async cmdUp(manager: ComposeManager, params: string[]): Promise<void> {
    const options = this.parseOptions(params);
    const services = params.filter(p => !p.startsWith('-'));

    await manager.up({
      detach: options.d || options.detach,
      build: options.build,
      forceRecreate: options['force-recreate'],
      scale: options.scale,
      removeOrphans: options['remove-orphans'],
      services,
    });
  }

  private async cmdDown(manager: ComposeManager, params: string[]): Promise<void> {
    const options = this.parseOptions(params);

    await manager.down({
      volumes: options.v || options.volumes,
      removeOrphans: options['remove-orphans'],
      rmi: options.rmi,
    });
  }

  private async cmdExec(manager: ComposeManager, params: string[]): Promise<void> {
    const options = this.parseOptions(params);
    const [service, ...command] = params.filter(p => !p.startsWith('-'));

    await manager.exec(service, command, options);
  }

  private parseOptions(params: string[]): any {
    const options: any = {};

    for (let i = 0; i < params.length; i++) {
      const param = params[i];

      if (param.startsWith('--')) {
        const key = param.slice(2);
        const value = params[i + 1] && !params[i + 1].startsWith('-')
          ? params[++i]
          : true;
        options[key] = value;
      } else if (param.startsWith('-') && param.length === 2) {
        const key = param.slice(1);
        const value = params[i + 1] && !params[i + 1].startsWith('-')
          ? params[++i]
          : true;
        options[key] = value;
      }
    }

    return options;
  }

  private showVersion(): void {
    console.log('Docker Compose Clone version 1.0.0 (Elide)');
  }

  private showHelp(): void {
    console.log(`
Docker Compose Clone - Container Orchestration for Elide

Usage: elide compose.ts [OPTIONS] COMMAND [ARGS...]

Options:
  -f, --file FILE            Compose configuration file
  -p, --project-name NAME    Project name
  --profile NAME             Specify profile

Commands:
  up [OPTIONS] [SERVICE...]  Start services
  down [OPTIONS]             Stop and remove services
  ps [OPTIONS] [SERVICE...]  List containers
  logs [OPTIONS] [SERVICE]   View logs
  build [OPTIONS] [SERVICE]  Build or rebuild services
  pull [SERVICE...]          Pull service images
  exec SERVICE COMMAND       Execute command in service
  config                     Validate configuration
  version                    Show version

Run 'elide compose.ts COMMAND --help' for more information on a command.
`);
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

if (require.main === module) {
  const cli = new CLI();
  const args = process.argv.slice(2);

  cli.run(args).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { ComposeManager, CLI, ComposeConfig, ServiceConfig };
