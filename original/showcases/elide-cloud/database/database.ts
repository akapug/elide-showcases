/**
 * Database Layer for Elide Cloud Platform
 *
 * In-memory database for demonstration (easily replaceable with PostgreSQL/MySQL)
 */

import type {
  User,
  Organization,
  TeamMember,
  Application,
  Deployment,
  Build,
  Process,
  Dyno,
  ScalingPolicy,
  Addon,
  AddonAttachment,
  ConfigVar,
  Release,
  Domain,
  Route,
  Metric,
  LogEntry,
  Invoice,
  UsageRecord,
  CollaboratorAccess,
  Webhook,
  WebhookDelivery,
  DatabaseConnection,
  StorageBlob,
} from '../core/types.ts';
import { generateId, Logger } from '../core/utils.ts';

const logger = new Logger('Database');

// =============================================================================
// In-Memory Database
// =============================================================================

class Database {
  // Core tables
  public users: Map<string, User> = new Map();
  public organizations: Map<string, Organization> = new Map();
  public teamMembers: Map<string, TeamMember> = new Map();

  // Application tables
  public applications: Map<string, Application> = new Map();
  public deployments: Map<string, Deployment> = new Map();
  public builds: Map<string, Build> = new Map();
  public releases: Map<string, Release> = new Map();

  // Runtime tables
  public processes: Map<string, Process> = new Map();
  public dynos: Map<string, Dyno> = new Map();
  public scalingPolicies: Map<string, ScalingPolicy> = new Map();

  // Configuration tables
  public configVars: Map<string, ConfigVar> = new Map();
  public domains: Map<string, Domain> = new Map();
  public routes: Map<string, Route> = new Map();

  // Add-ons tables
  public addons: Map<string, Addon> = new Map();
  public addonAttachments: Map<string, AddonAttachment> = new Map();
  public databaseConnections: Map<string, DatabaseConnection> = new Map();

  // Monitoring tables
  public metrics: Metric[] = [];
  public logs: LogEntry[] = [];

  // Billing tables
  public invoices: Map<string, Invoice> = new Map();
  public usageRecords: UsageRecord[] = [];

  // Collaboration tables
  public collaboratorAccess: Map<string, CollaboratorAccess> = new Map();
  public webhooks: Map<string, Webhook> = new Map();
  public webhookDeliveries: Map<string, WebhookDelivery> = new Map();

  // Storage
  public storageBlobs: Map<string, StorageBlob> = new Map();

  // Indices for fast lookups
  private usersByEmail: Map<string, User> = new Map();
  private applicationsBySlug: Map<string, Application> = new Map();
  private deploymentsByApplication: Map<string, Deployment[]> = new Map();
  private addonsByApplication: Map<string, Addon[]> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  // ===========================================================================
  // User Operations
  // ===========================================================================

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: generateId('usr'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(newUser.id, newUser);
    this.usersByEmail.set(newUser.email, newUser);

    logger.info(`Created user: ${newUser.email}`);
    return newUser;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.usersByEmail.get(email);
  }

  getUserByApiKey(apiKey: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.apiKey === apiKey);
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);

    if (updates.email && updates.email !== user.email) {
      this.usersByEmail.delete(user.email);
      this.usersByEmail.set(updates.email, updatedUser);
    }

    return updatedUser;
  }

  deleteUser(id: string): boolean {
    const user = this.users.get(id);
    if (!user) return false;

    this.users.delete(id);
    this.usersByEmail.delete(user.email);

    logger.info(`Deleted user: ${user.email}`);
    return true;
  }

  // ===========================================================================
  // Organization Operations
  // ===========================================================================

  createOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Organization {
    const newOrg: Organization = {
      ...org,
      id: generateId('org'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.organizations.set(newOrg.id, newOrg);
    logger.info(`Created organization: ${newOrg.name}`);
    return newOrg;
  }

  getOrganizationById(id: string): Organization | undefined {
    return this.organizations.get(id);
  }

  updateOrganization(id: string, updates: Partial<Organization>): Organization | undefined {
    const org = this.organizations.get(id);
    if (!org) return undefined;

    const updatedOrg = { ...org, ...updates, updatedAt: new Date() };
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }

  // ===========================================================================
  // Application Operations
  // ===========================================================================

  createApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Application {
    const newApp: Application = {
      ...app,
      id: generateId('app'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.applications.set(newApp.id, newApp);
    this.applicationsBySlug.set(newApp.slug, newApp);

    logger.info(`Created application: ${newApp.name}`);
    return newApp;
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications.get(id);
  }

  getApplicationBySlug(slug: string): Application | undefined {
    return this.applicationsBySlug.get(slug);
  }

  getApplicationsByOrganization(organizationId: string): Application[] {
    return Array.from(this.applications.values())
      .filter(app => app.organizationId === organizationId);
  }

  updateApplication(id: string, updates: Partial<Application>): Application | undefined {
    const app = this.applications.get(id);
    if (!app) return undefined;

    const updatedApp = { ...app, ...updates, updatedAt: new Date() };
    this.applications.set(id, updatedApp);

    if (updates.slug && updates.slug !== app.slug) {
      this.applicationsBySlug.delete(app.slug);
      this.applicationsBySlug.set(updates.slug, updatedApp);
    }

    return updatedApp;
  }

  deleteApplication(id: string): boolean {
    const app = this.applications.get(id);
    if (!app) return false;

    this.applications.delete(id);
    this.applicationsBySlug.delete(app.slug);

    // Clean up related data
    this.deleteDeploymentsByApplication(id);
    this.deleteAddonsByApplication(id);

    logger.info(`Deleted application: ${app.name}`);
    return true;
  }

  // ===========================================================================
  // Deployment Operations
  // ===========================================================================

  createDeployment(deployment: Omit<Deployment, 'id' | 'version' | 'createdAt'>): Deployment {
    const appDeployments = this.getDeploymentsByApplication(deployment.applicationId);
    const version = appDeployments.length + 1;

    const newDeployment: Deployment = {
      ...deployment,
      id: generateId('dep'),
      version,
      createdAt: new Date(),
    };

    this.deployments.set(newDeployment.id, newDeployment);

    // Update index
    if (!this.deploymentsByApplication.has(deployment.applicationId)) {
      this.deploymentsByApplication.set(deployment.applicationId, []);
    }
    this.deploymentsByApplication.get(deployment.applicationId)!.push(newDeployment);

    logger.info(`Created deployment v${version} for application ${deployment.applicationId}`);
    return newDeployment;
  }

  getDeploymentById(id: string): Deployment | undefined {
    return this.deployments.get(id);
  }

  getDeploymentsByApplication(applicationId: string): Deployment[] {
    return this.deploymentsByApplication.get(applicationId) || [];
  }

  updateDeployment(id: string, updates: Partial<Deployment>): Deployment | undefined {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;

    const updatedDeployment = { ...deployment, ...updates };
    this.deployments.set(id, updatedDeployment);

    // Update index
    const appDeployments = this.deploymentsByApplication.get(deployment.applicationId) || [];
    const index = appDeployments.findIndex(d => d.id === id);
    if (index !== -1) {
      appDeployments[index] = updatedDeployment;
    }

    return updatedDeployment;
  }

  deleteDeploymentsByApplication(applicationId: string): void {
    const deployments = this.getDeploymentsByApplication(applicationId);
    for (const deployment of deployments) {
      this.deployments.delete(deployment.id);
    }
    this.deploymentsByApplication.delete(applicationId);
  }

  // ===========================================================================
  // Build Operations
  // ===========================================================================

  createBuild(build: Omit<Build, 'id'>): Build {
    const newBuild: Build = {
      ...build,
      id: generateId('bld'),
    };

    this.builds.set(newBuild.id, newBuild);
    logger.info(`Created build for deployment ${build.deploymentId}`);
    return newBuild;
  }

  getBuildById(id: string): Build | undefined {
    return this.builds.get(id);
  }

  getBuildByDeployment(deploymentId: string): Build | undefined {
    return Array.from(this.builds.values())
      .find(b => b.deploymentId === deploymentId);
  }

  updateBuild(id: string, updates: Partial<Build>): Build | undefined {
    const build = this.builds.get(id);
    if (!build) return undefined;

    const updatedBuild = { ...build, ...updates };
    this.builds.set(id, updatedBuild);
    return updatedBuild;
  }

  // ===========================================================================
  // Process & Dyno Operations
  // ===========================================================================

  createProcess(process: Omit<Process, 'id' | 'createdAt' | 'updatedAt'>): Process {
    const newProcess: Process = {
      ...process,
      id: generateId('prc'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.processes.set(newProcess.id, newProcess);
    logger.info(`Created process ${process.type} for application ${process.applicationId}`);
    return newProcess;
  }

  getProcessById(id: string): Process | undefined {
    return this.processes.get(id);
  }

  getProcessesByApplication(applicationId: string): Process[] {
    return Array.from(this.processes.values())
      .filter(p => p.applicationId === applicationId);
  }

  updateProcess(id: string, updates: Partial<Process>): Process | undefined {
    const process = this.processes.get(id);
    if (!process) return undefined;

    const updatedProcess = { ...process, ...updates, updatedAt: new Date() };
    this.processes.set(id, updatedProcess);
    return updatedProcess;
  }

  deleteProcess(id: string): boolean {
    return this.processes.delete(id);
  }

  createDyno(dyno: Omit<Dyno, 'id' | 'createdAt'>): Dyno {
    const newDyno: Dyno = {
      ...dyno,
      id: generateId('dyn'),
      createdAt: new Date(),
    };

    this.dynos.set(newDyno.id, newDyno);
    return newDyno;
  }

  getDynoById(id: string): Dyno | undefined {
    return this.dynos.get(id);
  }

  getDynosByApplication(applicationId: string): Dyno[] {
    return Array.from(this.dynos.values())
      .filter(d => d.applicationId === applicationId);
  }

  updateDyno(id: string, updates: Partial<Dyno>): Dyno | undefined {
    const dyno = this.dynos.get(id);
    if (!dyno) return undefined;

    const updatedDyno = { ...dyno, ...updates };
    this.dynos.set(id, updatedDyno);
    return updatedDyno;
  }

  // ===========================================================================
  // Addon Operations
  // ===========================================================================

  createAddon(addon: Omit<Addon, 'id' | 'createdAt' | 'updatedAt'>): Addon {
    const newAddon: Addon = {
      ...addon,
      id: generateId('adn'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.addons.set(newAddon.id, newAddon);

    // Update index
    if (!this.addonsByApplication.has(addon.applicationId)) {
      this.addonsByApplication.set(addon.applicationId, []);
    }
    this.addonsByApplication.get(addon.applicationId)!.push(newAddon);

    logger.info(`Created addon ${addon.name} for application ${addon.applicationId}`);
    return newAddon;
  }

  getAddonById(id: string): Addon | undefined {
    return this.addons.get(id);
  }

  getAddonsByApplication(applicationId: string): Addon[] {
    return this.addonsByApplication.get(applicationId) || [];
  }

  updateAddon(id: string, updates: Partial<Addon>): Addon | undefined {
    const addon = this.addons.get(id);
    if (!addon) return undefined;

    const updatedAddon = { ...addon, ...updates, updatedAt: new Date() };
    this.addons.set(id, updatedAddon);

    // Update index
    const appAddons = this.addonsByApplication.get(addon.applicationId) || [];
    const index = appAddons.findIndex(a => a.id === id);
    if (index !== -1) {
      appAddons[index] = updatedAddon;
    }

    return updatedAddon;
  }

  deleteAddon(id: string): boolean {
    const addon = this.addons.get(id);
    if (!addon) return false;

    this.addons.delete(id);

    // Update index
    const appAddons = this.addonsByApplication.get(addon.applicationId) || [];
    const index = appAddons.findIndex(a => a.id === id);
    if (index !== -1) {
      appAddons.splice(index, 1);
    }

    logger.info(`Deleted addon ${addon.name}`);
    return true;
  }

  deleteAddonsByApplication(applicationId: string): void {
    const addons = this.getAddonsByApplication(applicationId);
    for (const addon of addons) {
      this.addons.delete(addon.id);
    }
    this.addonsByApplication.delete(applicationId);
  }

  // ===========================================================================
  // Config Var Operations
  // ===========================================================================

  createConfigVar(configVar: Omit<ConfigVar, 'createdAt' | 'updatedAt'>): ConfigVar {
    const key = `${configVar.applicationId}:${configVar.key}`;
    const newConfigVar: ConfigVar = {
      ...configVar,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.configVars.set(key, newConfigVar);
    return newConfigVar;
  }

  getConfigVarsByApplication(applicationId: string): ConfigVar[] {
    return Array.from(this.configVars.values())
      .filter(cv => cv.applicationId === applicationId);
  }

  getConfigVar(applicationId: string, key: string): ConfigVar | undefined {
    return this.configVars.get(`${applicationId}:${key}`);
  }

  updateConfigVar(applicationId: string, key: string, value: string): ConfigVar | undefined {
    const configVar = this.getConfigVar(applicationId, key);
    if (!configVar) return undefined;

    const updated: ConfigVar = {
      ...configVar,
      value,
      updatedAt: new Date(),
    };

    this.configVars.set(`${applicationId}:${key}`, updated);
    return updated;
  }

  deleteConfigVar(applicationId: string, key: string): boolean {
    return this.configVars.delete(`${applicationId}:${key}`);
  }

  // ===========================================================================
  // Domain Operations
  // ===========================================================================

  createDomain(domain: Omit<Domain, 'id' | 'createdAt' | 'updatedAt'>): Domain {
    const newDomain: Domain = {
      ...domain,
      id: generateId('dmn'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.domains.set(newDomain.id, newDomain);
    logger.info(`Created domain ${domain.hostname} for application ${domain.applicationId}`);
    return newDomain;
  }

  getDomainById(id: string): Domain | undefined {
    return this.domains.get(id);
  }

  getDomainsByApplication(applicationId: string): Domain[] {
    return Array.from(this.domains.values())
      .filter(d => d.applicationId === applicationId);
  }

  updateDomain(id: string, updates: Partial<Domain>): Domain | undefined {
    const domain = this.domains.get(id);
    if (!domain) return undefined;

    const updatedDomain = { ...domain, ...updates, updatedAt: new Date() };
    this.domains.set(id, updatedDomain);
    return updatedDomain;
  }

  deleteDomain(id: string): boolean {
    return this.domains.delete(id);
  }

  // ===========================================================================
  // Metrics & Logs
  // ===========================================================================

  addMetric(metric: Metric): void {
    this.metrics.push(metric);

    // Keep only last 10000 metrics to prevent memory issues
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
  }

  getMetrics(applicationId: string, type?: string, since?: Date): Metric[] {
    let filtered = this.metrics.filter(m => m.applicationId === applicationId);

    if (type) {
      filtered = filtered.filter(m => m.type === type);
    }

    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since);
    }

    return filtered;
  }

  addLog(log: Omit<LogEntry, 'id'>): LogEntry {
    const newLog: LogEntry = {
      ...log,
      id: generateId('log'),
    };

    this.logs.push(newLog);

    // Keep only last 100000 logs to prevent memory issues
    if (this.logs.length > 100000) {
      this.logs = this.logs.slice(-100000);
    }

    return newLog;
  }

  getLogs(applicationId: string, options: {
    processId?: string;
    level?: string;
    since?: Date;
    limit?: number;
  } = {}): LogEntry[] {
    let filtered = this.logs.filter(l => l.applicationId === applicationId);

    if (options.processId) {
      filtered = filtered.filter(l => l.processId === options.processId);
    }

    if (options.level) {
      filtered = filtered.filter(l => l.level === options.level);
    }

    if (options.since) {
      filtered = filtered.filter(l => l.timestamp >= options.since);
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  // ===========================================================================
  // Sample Data
  // ===========================================================================

  private initializeSampleData(): void {
    // Create demo user
    this.createUser({
      email: 'demo@elide-cloud.io',
      name: 'Demo User',
      passwordHash: 'demo:hashed', // In reality, this would be properly hashed
      apiKey: 'elide_demo_key_12345',
      verified: true,
      role: 'developer',
      metadata: {},
    });

    logger.info('Sample data initialized');
  }
}

// Export singleton instance
export const db = new Database();
