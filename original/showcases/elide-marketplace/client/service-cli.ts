#!/usr/bin/env elide

/**
 * Elide Service Marketplace CLI
 *
 * Command-line tool for managing service deployments
 */

const API_URL = Deno.env.get("ELIDE_API_URL") || "http://localhost:3000";
const MARKETPLACE_URL = Deno.env.get("ELIDE_MARKETPLACE_URL") || "http://localhost:3001";

interface Config {
  apiToken?: string;
  username?: string;
}

class ServiceCLI {
  private config: Config = {};
  private configPath: string;

  constructor() {
    const home = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || "";
    this.configPath = `${home}/.elide-marketplace`;
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const data = Deno.readTextFileSync(this.configPath);
      this.config = JSON.parse(data);
    } catch {
      // Config doesn't exist
    }
  }

  /**
   * List available services
   */
  async listServices(category?: string): Promise<void> {
    let url = `${MARKETPLACE_URL}/api/services`;
    if (category) {
      url += `?category=${category}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch services");
      Deno.exit(1);
    }

    const data = await response.json();

    if (data.services.length === 0) {
      console.log("No services found");
      return;
    }

    console.log(`Available Services (${data.total}):\n`);

    data.services.forEach((service: any) => {
      console.log(`${service.name} (${service.category})`);
      console.log(`  ${service.description}`);
      console.log(`  Provider: ${service.provider}`);
      console.log(`  Rating: ${"★".repeat(Math.round(service.averageRating))}${"☆".repeat(5 - Math.round(service.averageRating))} (${service.totalReviews} reviews)`);
      console.log(`  Deployments: ${service.activeDeployments}`);
      console.log(`  Pricing: ${service.pricing.model}`);
      console.log();
    });
  }

  /**
   * Show service details
   */
  async serviceInfo(slug: string): Promise<void> {
    const response = await fetch(`${MARKETPLACE_URL}/api/services/${slug}`);

    if (!response.ok) {
      console.error("Service not found");
      Deno.exit(1);
    }

    const service = await response.json();

    console.log(`${service.name} v${service.version}`);
    console.log(`${"-".repeat(service.name.length + service.version.length + 2)}`);
    console.log();
    console.log(service.description);
    console.log();
    console.log(`Category: ${service.category}`);
    console.log(`Provider: ${service.provider}`);
    console.log(`Status: ${service.status}`);
    console.log();
    console.log("Features:");
    service.features.forEach((f: string) => console.log(`  • ${f}`));
    console.log();
    console.log("Pricing:");
    service.pricing.tiers.forEach((tier: any) => {
      const highlighted = tier.highlighted ? " ⭐" : "";
      console.log(`  ${tier.name}${highlighted}: $${tier.price}/${tier.period}`);
      console.log(`    ${tier.description}`);
    });
    console.log();
    console.log(`Rating: ${service.averageRating.toFixed(1)}/5.0 (${service.totalReviews} reviews)`);
    console.log(`Active Deployments: ${service.activeDeployments}`);
  }

  /**
   * Deploy a service
   */
  async deploy(serviceSlug: string, options: any = {}): Promise<void> {
    if (!this.config.apiToken) {
      console.error("Not logged in. Run: elide-service login");
      Deno.exit(1);
    }

    // Get service details first
    const serviceResponse = await fetch(`${MARKETPLACE_URL}/api/services/${serviceSlug}`);

    if (!serviceResponse.ok) {
      console.error("Service not found");
      Deno.exit(1);
    }

    const service = await serviceResponse.json();

    // Prompt for deployment name
    const name = options.name || prompt(`Deployment name (default: ${service.name}-1):`) || `${service.name}-1`;

    // Prompt for tier
    console.log("\nAvailable tiers:");
    service.pricing.tiers.forEach((tier: any, index: number) => {
      console.log(`  ${index + 1}. ${tier.name} - $${tier.price}/${tier.period}`);
    });

    const tierIndex = parseInt(prompt("Select tier (1):") || "1") - 1;
    const tier = service.pricing.tiers[tierIndex] || service.pricing.tiers[0];

    // Prompt for region
    const regions = service.specifications.regions || ["us-east-1", "us-west-2", "eu-west-1"];
    console.log("\nAvailable regions:");
    regions.forEach((region: string, index: number) => {
      console.log(`  ${index + 1}. ${region}`);
    });

    const regionIndex = parseInt(prompt("Select region (1):") || "1") - 1;
    const region = regions[regionIndex] || regions[0];

    console.log("\nDeploying...");

    // Deploy the service
    const response = await fetch(`${MARKETPLACE_URL}/api/deployments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        serviceId: service.id,
        name,
        config: {
          tier: tier.id,
          region,
          ...options
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Deployment failed:", error.error);
      Deno.exit(1);
    }

    const deployment = await response.json();

    console.log(`\n✓ Deployment created: ${deployment.deploymentId}`);
    console.log(`  Name: ${name}`);
    console.log(`  Status: ${deployment.status}`);
    console.log(`  Endpoint: ${deployment.endpoint}`);
    console.log(`  Estimated time: ${deployment.estimatedTime}`);

    if (deployment.credentials) {
      console.log("\n🔐 Credentials:");
      Object.entries(deployment.credentials).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }

    console.log(`\nView deployment: elide-service status ${deployment.deploymentId}`);
  }

  /**
   * List user's deployments
   */
  async listDeployments(): Promise<void> {
    if (!this.config.apiToken) {
      console.error("Not logged in. Run: elide-service login");
      Deno.exit(1);
    }

    const response = await fetch(`${MARKETPLACE_URL}/api/deployments`, {
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`
      }
    });

    if (!response.ok) {
      console.error("Failed to fetch deployments");
      Deno.exit(1);
    }

    const data = await response.json();

    if (data.deployments.length === 0) {
      console.log("No deployments found");
      return;
    }

    console.log(`Your Deployments (${data.deployments.length}):\n`);

    data.deployments.forEach((deployment: any) => {
      const statusIcon = {
        running: "🟢",
        stopped: "🔴",
        pending: "🟡",
        provisioning: "🟡",
        failed: "❌"
      }[deployment.status] || "⚪";

      console.log(`${statusIcon} ${deployment.name}`);
      console.log(`  ID: ${deployment.id}`);
      console.log(`  Service: ${deployment.serviceName}`);
      console.log(`  Status: ${deployment.status}`);
      console.log(`  Endpoint: ${deployment.endpoint || "N/A"}`);
      console.log(`  Region: ${deployment.region} | Tier: ${deployment.tier}`);
      console.log(`  Created: ${new Date(deployment.createdAt).toLocaleString()}`);
      console.log();
    });
  }

  /**
   * Get deployment status
   */
  async deploymentStatus(deploymentId: string): Promise<void> {
    if (!this.config.apiToken) {
      console.error("Not logged in. Run: elide-service login");
      Deno.exit(1);
    }

    const response = await fetch(`${MARKETPLACE_URL}/api/deployments/${deploymentId}`, {
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`
      }
    });

    if (!response.ok) {
      console.error("Deployment not found");
      Deno.exit(1);
    }

    const deployment = await response.json();

    console.log(`Deployment: ${deployment.name}`);
    console.log(`${"=".repeat(deployment.name.length + 12)}`);
    console.log();
    console.log(`ID: ${deployment.id}`);
    console.log(`Service: ${deployment.serviceName}`);
    console.log(`Status: ${deployment.status}`);
    console.log(`Endpoint: ${deployment.endpoint || "N/A"}`);
    console.log(`Region: ${deployment.region}`);
    console.log(`Tier: ${deployment.tier}`);
    console.log();

    if (deployment.metrics) {
      console.log("Metrics:");
      console.log(`  Requests: ${deployment.metrics.requests.toLocaleString()}`);
      console.log(`  Errors: ${deployment.metrics.errors.toLocaleString()}`);
      console.log(`  Avg Response Time: ${deployment.metrics.avgResponseTime}ms`);
      console.log(`  P95 Response Time: ${deployment.metrics.p95ResponseTime}ms`);
      console.log(`  Data Transfer: ${(deployment.metrics.dataTransfer / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Uptime: ${deployment.metrics.uptime.toFixed(2)}%`);
      console.log();
    }

    if (deployment.billing) {
      console.log("Billing:");
      console.log(`  Current Cost: $${deployment.billing.currentCost.toFixed(2)}`);
      console.log(`  Projected Cost: $${deployment.billing.projectedCost.toFixed(2)}`);
      console.log(`  Billing Cycle: ${deployment.billing.billingCycle}`);
      console.log(`  Next Billing: ${deployment.billing.nextBillingAt || "N/A"}`);
      console.log();
    }

    console.log(`Created: ${new Date(deployment.createdAt).toLocaleString()}`);
    console.log(`Updated: ${new Date(deployment.updatedAt).toLocaleString()}`);
  }

  /**
   * Stop a deployment
   */
  async stopDeployment(deploymentId: string): Promise<void> {
    if (!this.config.apiToken) {
      console.error("Not logged in. Run: elide-service login");
      Deno.exit(1);
    }

    const confirm = prompt(`Stop deployment ${deploymentId}? (yes/no):`);
    if (confirm?.toLowerCase() !== "yes") {
      console.log("Cancelled");
      return;
    }

    const response = await fetch(`${MARKETPLACE_URL}/api/deployments/${deploymentId}/stop`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiToken}`
      }
    });

    if (!response.ok) {
      console.error("Failed to stop deployment");
      Deno.exit(1);
    }

    console.log("✓ Deployment stopped");
  }

  /**
   * List service categories
   */
  async listCategories(): Promise<void> {
    const response = await fetch(`${MARKETPLACE_URL}/api/categories`);

    if (!response.ok) {
      console.error("Failed to fetch categories");
      Deno.exit(1);
    }

    const data = await response.json();

    console.log("Service Categories:\n");

    data.categories.forEach((cat: any) => {
      console.log(`${cat.name} (${cat.service_count} services)`);
      console.log(`  ${cat.description}`);
      console.log(`  Browse: elide-service list --category ${cat.slug}`);
      console.log();
    });
  }
}

// Main CLI
const cli = new ServiceCLI();
const args = Deno.args;
const command = args[0];

switch (command) {
  case "list":
    const category = args.find(arg => arg.startsWith("--category="))?.split("=")[1];
    await cli.listServices(category);
    break;

  case "info":
    if (!args[1]) {
      console.error("Usage: elide-service info <service-slug>");
      Deno.exit(1);
    }
    await cli.serviceInfo(args[1]);
    break;

  case "deploy":
    if (!args[1]) {
      console.error("Usage: elide-service deploy <service-slug>");
      Deno.exit(1);
    }
    await cli.deploy(args[1]);
    break;

  case "deployments":
    await cli.listDeployments();
    break;

  case "status":
    if (!args[1]) {
      console.error("Usage: elide-service status <deployment-id>");
      Deno.exit(1);
    }
    await cli.deploymentStatus(args[1]);
    break;

  case "stop":
    if (!args[1]) {
      console.error("Usage: elide-service stop <deployment-id>");
      Deno.exit(1);
    }
    await cli.stopDeployment(args[1]);
    break;

  case "categories":
    await cli.listCategories();
    break;

  case "help":
  case undefined:
    console.log(`
Elide Service Marketplace CLI

Usage: elide-service <command> [options]

Commands:
  list [--category=<cat>]        List available services
  info <service-slug>            Show service details
  deploy <service-slug>          Deploy a service
  deployments                    List your deployments
  status <deployment-id>         Show deployment status
  stop <deployment-id>           Stop a deployment
  categories                     List service categories
  help                           Show this help

Examples:
  elide-service list
  elide-service list --category=database
  elide-service info postgres-managed
  elide-service deploy postgres-managed
  elide-service deployments
  elide-service status dep-123456
`);
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.error("Run 'elide-service help' for usage");
    Deno.exit(1);
}
