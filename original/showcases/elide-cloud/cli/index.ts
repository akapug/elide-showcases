#!/usr/bin/env elide
/**
 * Elide Cloud CLI
 *
 * Command-line interface for managing applications on Elide Cloud
 * Similar to Heroku CLI but better!
 */

import { APIClient } from './api-client.ts';
import { ConfigManager } from './config.ts';
import { Logger } from '../core/utils.ts';

const logger = new Logger('CLI');

// =============================================================================
// CLI Main
// =============================================================================

class ElideCloudCLI {
  private client: APIClient;
  private config: ConfigManager;

  constructor() {
    this.config = new ConfigManager();
    this.client = new APIClient(this.config);
  }

  async run(args: string[]): Promise<void> {
    const command = args[0];
    const subcommand = args[1];
    const restArgs = args.slice(2);

    try {
      switch (command) {
        case 'login':
          await this.handleLogin();
          break;

        case 'logout':
          await this.handleLogout();
          break;

        case 'whoami':
          await this.handleWhoami();
          break;

        case 'apps':
          if (!subcommand || subcommand === 'list') {
            await this.handleAppsList();
          } else if (subcommand === 'create') {
            await this.handleAppsCreate(restArgs);
          } else if (subcommand === 'info') {
            await this.handleAppsInfo(restArgs);
          } else if (subcommand === 'destroy') {
            await this.handleAppsDestroy(restArgs);
          } else {
            this.showHelp();
          }
          break;

        case 'deploy':
          await this.handleDeploy(args.slice(1));
          break;

        case 'logs':
          await this.handleLogs(args.slice(1));
          break;

        case 'scale':
          await this.handleScale(args.slice(1));
          break;

        case 'restart':
          await this.handleRestart(args.slice(1));
          break;

        case 'ps':
          await this.handlePs(args.slice(1));
          break;

        case 'config':
          if (!subcommand) {
            await this.handleConfigList(restArgs);
          } else if (subcommand === 'set') {
            await this.handleConfigSet(restArgs);
          } else if (subcommand === 'unset') {
            await this.handleConfigUnset(restArgs);
          } else if (subcommand === 'get') {
            await this.handleConfigGet(restArgs);
          } else {
            this.showHelp();
          }
          break;

        case 'domains':
          if (!subcommand || subcommand === 'list') {
            await this.handleDomainsList(restArgs);
          } else if (subcommand === 'add') {
            await this.handleDomainsAdd(restArgs);
          } else if (subcommand === 'remove') {
            await this.handleDomainsRemove(restArgs);
          } else {
            this.showHelp();
          }
          break;

        case 'addons':
          if (!subcommand || subcommand === 'list') {
            await this.handleAddonsList(restArgs);
          } else if (subcommand === 'create') {
            await this.handleAddonsCreate(restArgs);
          } else if (subcommand === 'destroy') {
            await this.handleAddonsDestroy(restArgs);
          } else if (subcommand === 'info') {
            await this.handleAddonsInfo(restArgs);
          } else {
            this.showHelp();
          }
          break;

        case 'releases':
          await this.handleReleases(args.slice(1));
          break;

        case 'rollback':
          await this.handleRollback(args.slice(1));
          break;

        case 'maintenance':
          if (subcommand === 'on') {
            await this.handleMaintenanceOn(restArgs);
          } else if (subcommand === 'off') {
            await this.handleMaintenanceOff(restArgs);
          } else {
            this.showHelp();
          }
          break;

        case 'version':
        case '--version':
        case '-v':
          this.showVersion();
          break;

        case 'help':
        case '--help':
        case '-h':
        default:
          this.showHelp();
          break;
      }
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }

  // ===========================================================================
  // Auth Commands
  // ===========================================================================

  private async handleLogin(): Promise<void> {
    console.log('Elide Cloud Login');
    console.log('================\n');

    const email = await this.prompt('Email: ');
    const password = await this.prompt('Password: ', true);

    const response = await this.client.login(email, password);

    if (response.success && response.data) {
      this.config.setToken(response.data.token);
      this.config.setUser(response.data.user);

      console.log(`\nLogged in as ${response.data.user.email}`);
      console.log(`API Key: ${response.data.user.apiKey}`);
    } else {
      throw new Error(response.error?.message || 'Login failed');
    }
  }

  private async handleLogout(): Promise<void> {
    this.config.clearToken();
    this.config.clearUser();
    console.log('Logged out successfully');
  }

  private async handleWhoami(): Promise<void> {
    const response = await this.client.getCurrentUser();

    if (response.success && response.data) {
      console.log(`Email:    ${response.data.email}`);
      console.log(`Name:     ${response.data.name}`);
      console.log(`Role:     ${response.data.role}`);
      console.log(`Verified: ${response.data.verified ? 'Yes' : 'No'}`);
      console.log(`API Key:  ${response.data.apiKey}`);
    } else {
      throw new Error('Not logged in');
    }
  }

  // ===========================================================================
  // App Commands
  // ===========================================================================

  private async handleAppsList(): Promise<void> {
    const response = await this.client.listApplications();

    if (response.success && response.data) {
      console.log('\nYour Applications:');
      console.log('==================\n');

      if (response.data.length === 0) {
        console.log('No applications yet. Create one with: elide-cloud apps create');
        return;
      }

      for (const app of response.data) {
        console.log(`${app.name} (${app.slug})`);
        console.log(`  Region: ${app.region}`);
        console.log(`  Created: ${new Date(app.createdAt).toLocaleString()}`);
        if (app.repository) {
          console.log(`  Repo: ${app.repository}`);
        }
        console.log('');
      }
    }
  }

  private async handleAppsCreate(args: string[]): Promise<void> {
    const name = args[0] || await this.prompt('App name: ');

    const response = await this.client.createApplication({
      name,
      region: 'us-east-1',
    });

    if (response.success && response.data) {
      console.log(`\nCreated ${response.data.name}!`);
      console.log(`Slug: ${response.data.slug}`);
      console.log(`URL: https://${response.data.slug}.elide-cloud.io`);
      console.log(`\nTo deploy your app:`);
      console.log(`  cd your-app`);
      console.log(`  elide-cloud deploy --app ${response.data.slug}`);
    }
  }

  private async handleAppsInfo(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const response = await this.client.getApplication(appId);

    if (response.success && response.data) {
      const app = response.data;
      console.log(`\n${app.name}`);
      console.log('='.repeat(app.name.length) + '\n');
      console.log(`Slug:        ${app.slug}`);
      console.log(`Region:      ${app.region}`);
      console.log(`Stack:       ${app.stack}`);
      console.log(`Maintenance: ${app.maintenance ? 'ON' : 'OFF'}`);
      console.log(`Created:     ${new Date(app.createdAt).toLocaleString()}`);
      console.log(`Updated:     ${new Date(app.updatedAt).toLocaleString()}`);
      console.log(`\nStats:`);
      console.log(`  Deployments: ${app.stats.deployments}`);
      console.log(`  Add-ons:     ${app.stats.addons}`);
      console.log(`  Domains:     ${app.stats.domains}`);
      console.log(`  Processes:   ${app.stats.processes}`);
    }
  }

  private async handleAppsDestroy(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const app = await this.client.getApplication(appId);
    if (!app.success || !app.data) {
      throw new Error('Application not found');
    }

    console.log(`\nWARNING: This will permanently delete ${app.data.name} and all its resources!`);
    const confirm = await this.prompt(`Type "${app.data.name}" to confirm: `);

    if (confirm !== app.data.name) {
      console.log('Aborted.');
      return;
    }

    const response = await this.client.deleteApplication(appId);

    if (response.success) {
      console.log(`\nDeleted ${app.data.name}`);
    }
  }

  // ===========================================================================
  // Deploy Command
  // ===========================================================================

  private async handleDeploy(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    console.log('Starting deployment...\n');

    const response = await this.client.createDeployment(appId, {
      source: 'git',
      branch: 'main',
      message: 'Deploy via CLI',
    });

    if (response.success && response.data) {
      const deployment = response.data;
      console.log(`Deployment v${deployment.version} created`);
      console.log(`Status: ${deployment.status}`);
      console.log(`\nView logs: elide-cloud logs --app ${appId}`);
      console.log(`Check status: elide-cloud releases --app ${appId}`);
    }
  }

  // ===========================================================================
  // Logs Command
  // ===========================================================================

  private async handleLogs(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const tailArg = args.find(a => a.startsWith('--tail='));
    const tail = tailArg ? parseInt(tailArg.split('=')[1]) : 100;

    const response = await this.client.getLogs(appId, tail);

    if (response.success && response.data) {
      console.log(`\nShowing last ${tail} log entries:\n`);

      for (const log of response.data) {
        const timestamp = new Date(log.timestamp).toISOString();
        const level = log.level.toUpperCase().padEnd(5);
        const source = log.source.padEnd(10);
        console.log(`${timestamp} ${level} [${source}] ${log.message}`);
      }
    }
  }

  // ===========================================================================
  // Scale Command
  // ===========================================================================

  private async handleScale(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    // Parse scale arguments: web=2:standard-1x worker=1:standard-2x
    const scaleConfigs: Array<{ type: string; quantity: number; size: string }> = [];

    for (const arg of args) {
      if (arg.startsWith('--app=')) continue;

      const match = arg.match(/^(\w+)=(\d+)(?::([a-z0-9-]+))?$/);
      if (match) {
        const [, type, quantity, size] = match;
        scaleConfigs.push({
          type,
          quantity: parseInt(quantity),
          size: size || 'standard-1x',
        });
      }
    }

    if (scaleConfigs.length === 0) {
      console.log('Usage: elide-cloud scale web=2:standard-1x worker=1');
      return;
    }

    for (const config of scaleConfigs) {
      const response = await this.client.scaleApplication(appId, {
        processType: config.type,
        quantity: config.quantity,
        size: config.size,
      });

      if (response.success) {
        console.log(`Scaled ${config.type} to ${config.quantity}x ${config.size}`);
      }
    }
  }

  // ===========================================================================
  // Restart Command
  // ===========================================================================

  private async handleRestart(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const response = await this.client.restartApplication(appId);

    if (response.success) {
      console.log('Restarting application...');
    }
  }

  // ===========================================================================
  // Process Status Command
  // ===========================================================================

  private async handlePs(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const response = await this.client.listProcesses(appId);

    if (response.success && response.data) {
      console.log('\nProcesses:');
      console.log('==========\n');

      for (const process of response.data.processes) {
        console.log(`${process.type}: ${process.quantity}x ${process.size}`);
        console.log(`  Status: ${process.status}`);
        console.log(`  Command: ${process.command}`);
        console.log(`  Restarts: ${process.restarts}`);
        console.log('');
      }

      if (response.data.dynos && response.data.dynos.length > 0) {
        console.log('Dynos:');
        for (const dyno of response.data.dynos) {
          console.log(`  ${dyno.id}: ${dyno.status}`);
        }
      }
    }
  }

  // ===========================================================================
  // Config Commands
  // ===========================================================================

  private async handleConfigList(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const response = await this.client.listConfigVars(appId);

    if (response.success && response.data) {
      console.log('\nConfig Vars:');
      console.log('============\n');

      const vars = Object.entries(response.data);
      if (vars.length === 0) {
        console.log('No config vars set');
        return;
      }

      for (const [key, value] of vars) {
        console.log(`${key}=${value}`);
      }
    }
  }

  private async handleConfigSet(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    // Parse KEY=VALUE pairs
    const vars: Array<{ key: string; value: string }> = [];

    for (const arg of args) {
      if (arg.startsWith('--app=')) continue;

      const [key, ...valueParts] = arg.split('=');
      if (key && valueParts.length > 0) {
        vars.push({ key, value: valueParts.join('=') });
      }
    }

    if (vars.length === 0) {
      console.log('Usage: elide-cloud config set KEY=VALUE KEY2=VALUE2');
      return;
    }

    for (const { key, value } of vars) {
      const response = await this.client.setConfigVar(appId, key, value);

      if (response.success) {
        console.log(`Set ${key}`);
      }
    }
  }

  private async handleConfigUnset(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const keys = args.filter(a => !a.startsWith('--'));

    if (keys.length === 0) {
      console.log('Usage: elide-cloud config unset KEY1 KEY2');
      return;
    }

    for (const key of keys) {
      const response = await this.client.deleteConfigVar(appId, key);

      if (response.success) {
        console.log(`Unset ${key}`);
      }
    }
  }

  private async handleConfigGet(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);
    const key = args.find(a => !a.startsWith('--'));

    if (!key) {
      console.log('Usage: elide-cloud config get KEY');
      return;
    }

    const response = await this.client.listConfigVars(appId);

    if (response.success && response.data) {
      const value = response.data[key];
      if (value !== undefined) {
        console.log(value);
      } else {
        console.log(`Config var ${key} not found`);
      }
    }
  }

  // ===========================================================================
  // Domain Commands
  // ===========================================================================

  private async handleDomainsList(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const response = await this.client.listDomains(appId);

    if (response.success && response.data) {
      console.log('\nDomains:');
      console.log('========\n');

      if (response.data.length === 0) {
        console.log('No custom domains');
        return;
      }

      for (const domain of response.data) {
        console.log(`${domain.hostname}`);
        console.log(`  Status: ${domain.status}`);
        console.log(`  CNAME: ${domain.cname}`);
        console.log('');
      }
    }
  }

  private async handleDomainsAdd(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);
    const hostname = args.find(a => !a.startsWith('--'));

    if (!hostname) {
      console.log('Usage: elide-cloud domains add HOSTNAME');
      return;
    }

    const response = await this.client.addDomain(appId, hostname);

    if (response.success && response.data) {
      console.log(`\nAdded ${hostname}`);
      console.log(`Configure your DNS provider with:`);
      console.log(`  CNAME: ${response.data.cname}`);
    }
  }

  private async handleDomainsRemove(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);
    const hostname = args.find(a => !a.startsWith('--'));

    if (!hostname) {
      console.log('Usage: elide-cloud domains remove HOSTNAME');
      return;
    }

    // Find domain by hostname
    const domains = await this.client.listDomains(appId);
    if (!domains.success || !domains.data) {
      throw new Error('Failed to fetch domains');
    }

    const domain = domains.data.find(d => d.hostname === hostname);
    if (!domain) {
      throw new Error(`Domain ${hostname} not found`);
    }

    const response = await this.client.deleteDomain(appId, domain.id);

    if (response.success) {
      console.log(`Removed ${hostname}`);
    }
  }

  // ===========================================================================
  // Addon Commands
  // ===========================================================================

  private async handleAddonsList(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const response = await this.client.listAddons(appId);

    if (response.success && response.data) {
      console.log('\nAdd-ons:');
      console.log('========\n');

      if (response.data.length === 0) {
        console.log('No add-ons provisioned');
        console.log('\nAvailable add-ons:');
        console.log('  postgres - PostgreSQL database');
        console.log('  redis - Redis cache');
        console.log('  mongodb - MongoDB database');
        console.log('  mysql - MySQL database');
        return;
      }

      for (const addon of response.data) {
        console.log(`${addon.name} (${addon.provider}:${addon.plan})`);
        console.log(`  Status: ${addon.status}`);
        if (addon.webUrl) {
          console.log(`  URL: ${addon.webUrl}`);
        }
        console.log('');
      }
    }
  }

  private async handleAddonsCreate(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    // Parse addon:plan format
    const addonArg = args.find(a => !a.startsWith('--') && a.includes(':'));

    if (!addonArg) {
      console.log('Usage: elide-cloud addons create PROVIDER:PLAN');
      console.log('\nExamples:');
      console.log('  elide-cloud addons create postgres:standard');
      console.log('  elide-cloud addons create redis:premium');
      return;
    }

    const [provider, plan] = addonArg.split(':');

    const response = await this.client.provisionAddon(appId, provider, plan);

    if (response.success && response.data) {
      console.log(`\nProvisioning ${provider}:${plan}...`);
      console.log(`Name: ${response.data.name}`);
      console.log('Config vars will be automatically set');
    }
  }

  private async handleAddonsDestroy(args: string[]): Promise<void> {
    const addonName = args.find(a => !a.startsWith('--'));

    if (!addonName) {
      console.log('Usage: elide-cloud addons destroy ADDON_NAME');
      return;
    }

    const response = await this.client.deprovisionAddon(addonName);

    if (response.success) {
      console.log(`Destroying ${addonName}...`);
    }
  }

  private async handleAddonsInfo(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);
    const addonName = args.find(a => !a.startsWith('--'));

    if (!addonName) {
      console.log('Usage: elide-cloud addons info ADDON_NAME');
      return;
    }

    const response = await this.client.listAddons(appId);

    if (response.success && response.data) {
      const addon = response.data.find(a => a.name === addonName);
      if (!addon) {
        throw new Error(`Add-on ${addonName} not found`);
      }

      console.log(`\n${addon.name}`);
      console.log('='.repeat(addon.name.length) + '\n');
      console.log(`Provider: ${addon.provider}`);
      console.log(`Plan:     ${addon.plan}`);
      console.log(`Status:   ${addon.status}`);
      console.log(`Created:  ${new Date(addon.createdAt).toLocaleString()}`);
      if (addon.webUrl) {
        console.log(`URL:      ${addon.webUrl}`);
      }
      console.log('\nConfig:');
      for (const [key, value] of Object.entries(addon.config)) {
        console.log(`  ${key}: ${value}`);
      }
    }
  }

  // ===========================================================================
  // Release Commands
  // ===========================================================================

  private async handleReleases(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const response = await this.client.listDeployments(appId);

    if (response.success && response.data) {
      console.log('\nReleases:');
      console.log('=========\n');

      for (const deployment of response.data.slice(0, 10)) {
        const current = deployment.status === 'running' ? ' (current)' : '';
        console.log(`v${deployment.version} - ${deployment.status}${current}`);
        console.log(`  ${deployment.message || 'No message'}`);
        console.log(`  ${new Date(deployment.createdAt).toLocaleString()}`);
        console.log('');
      }
    }
  }

  private async handleRollback(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const response = await this.client.listDeployments(appId);

    if (!response.success || !response.data || response.data.length < 2) {
      throw new Error('No previous release to rollback to');
    }

    const current = response.data[0];
    const previous = response.data[1];

    console.log(`Rolling back from v${current.version} to v${previous.version}...`);

    const rollbackResponse = await this.client.rollbackDeployment(current.id);

    if (rollbackResponse.success) {
      console.log('Rollback initiated');
    }
  }

  // ===========================================================================
  // Maintenance Commands
  // ===========================================================================

  private async handleMaintenanceOn(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const response = await this.client.updateApplication(appId, { maintenance: true });

    if (response.success) {
      console.log('Maintenance mode enabled');
    }
  }

  private async handleMaintenanceOff(args: string[]): Promise<void> {
    const appId = await this.getAppId(args);

    const response = await this.client.updateApplication(appId, { maintenance: false });

    if (response.success) {
      console.log('Maintenance mode disabled');
    }
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private async getAppId(args: string[]): Promise<string> {
    // Check for --app flag
    const appArg = args.find(a => a.startsWith('--app='));
    if (appArg) {
      return appArg.split('=')[1];
    }

    // Check config for default app
    const defaultApp = this.config.getDefaultApp();
    if (defaultApp) {
      return defaultApp;
    }

    throw new Error('No app specified. Use --app=APP_ID or set a default app');
  }

  private async prompt(message: string, hidden: boolean = false): Promise<string> {
    // Simple prompt implementation
    // In a real CLI, use a proper library for password masking
    process.stdout.write(message);

    return new Promise((resolve) => {
      const stdin = process.stdin;
      stdin.setEncoding('utf8');

      let input = '';

      const onData = (chunk: string) => {
        if (chunk === '\n' || chunk === '\r\n') {
          stdin.off('data', onData);
          if (hidden) {
            process.stdout.write('\n');
          }
          resolve(input.trim());
        } else {
          input += chunk;
          if (!hidden) {
            process.stdout.write(chunk);
          }
        }
      };

      stdin.on('data', onData);
    });
  }

  private showVersion(): void {
    console.log('Elide Cloud CLI v1.0.0');
  }

  private showHelp(): void {
    console.log(`
Elide Cloud CLI - Production-ready cloud platform

Usage: elide-cloud COMMAND [options]

Authentication:
  login                     Login to Elide Cloud
  logout                    Logout
  whoami                    Show current user

Applications:
  apps                      List applications
  apps:create NAME          Create new application
  apps:info --app=ID        Show application info
  apps:destroy --app=ID     Delete application

Deployment:
  deploy --app=ID           Deploy application
  releases --app=ID         List releases
  rollback --app=ID         Rollback to previous release

Process Management:
  ps --app=ID               List processes
  scale TYPE=N --app=ID     Scale process (e.g., web=2:standard-1x)
  restart --app=ID          Restart all processes

Configuration:
  config --app=ID           List config vars
  config:set KEY=VAL        Set config var
  config:unset KEY          Remove config var
  config:get KEY            Get config var value

Domains:
  domains --app=ID          List domains
  domains:add HOSTNAME      Add custom domain
  domains:remove HOSTNAME   Remove domain

Add-ons:
  addons --app=ID           List add-ons
  addons:create TYPE:PLAN   Provision add-on
  addons:destroy NAME       Destroy add-on
  addons:info NAME          Show add-on info

Monitoring:
  logs --app=ID             Show application logs
                            (use --tail=N for number of lines)

Maintenance:
  maintenance:on --app=ID   Enable maintenance mode
  maintenance:off --app=ID  Disable maintenance mode

Available Add-ons:
  postgres:standard         PostgreSQL database
  postgres:premium          PostgreSQL with more resources
  redis:standard            Redis cache
  redis:premium             Redis with more memory
  mongodb:standard          MongoDB database
  mysql:standard            MySQL database

Examples:
  elide-cloud apps:create my-app
  elide-cloud deploy --app=my-app
  elide-cloud scale web=2:standard-2x --app=my-app
  elide-cloud addons:create postgres:standard --app=my-app
  elide-cloud config:set DATABASE_URL=postgres://... --app=my-app
  elide-cloud domains:add www.example.com --app=my-app
  elide-cloud logs --app=my-app --tail=100

Documentation: https://docs.elide-cloud.io
Support: https://support.elide-cloud.io
    `);
  }
}

// =============================================================================
// Main Entry Point
// =============================================================================

const cli = new ElideCloudCLI();
const args = process.argv.slice(2);

cli.run(args).catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
