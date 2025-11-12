/**
 * CLI Simulator
 *
 * Simulates a serverless framework CLI tool for deployment and management.
 * Demonstrates CLI commands and interactions.
 */

// =============================================================================
// Type Definitions
// =============================================================================

export interface CLICommand {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  handler: (args: string[]) => Promise<CLIResult>;
}

export interface CLIResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface DeployConfig {
  name: string;
  runtime: "typescript" | "python" | "ruby";
  handler: string;
  memory?: number;
  timeout?: number;
  environment?: Record<string, string>;
}

// =============================================================================
// CLI Simulator
// =============================================================================

export class CLISimulator {
  private apiEndpoint: string;
  private authToken?: string;
  private currentProject?: string;

  constructor(apiEndpoint: string = "http://localhost:3000") {
    this.apiEndpoint = apiEndpoint;
  }

  // ==========================================================================
  // Available Commands
  // ==========================================================================

  getCommands(): CLICommand[] {
    return [
      {
        name: "deploy",
        description: "Deploy a function to the serverless platform",
        usage: "serverless deploy [options]",
        examples: [
          "serverless deploy",
          "serverless deploy --function hello",
          "serverless deploy --stage production",
        ],
        handler: (args) => this.deploy(args),
      },
      {
        name: "invoke",
        description: "Invoke a deployed function",
        usage: "serverless invoke --function <name> [options]",
        examples: [
          "serverless invoke --function hello",
          'serverless invoke --function api --data \'{"name":"John"}\'',
          "serverless invoke --function cron --log",
        ],
        handler: (args) => this.invoke(args),
      },
      {
        name: "logs",
        description: "View function logs",
        usage: "serverless logs --function <name> [options]",
        examples: [
          "serverless logs --function hello",
          "serverless logs --function api --tail",
          "serverless logs --function worker --startTime 1h",
        ],
        handler: (args) => this.logs(args),
      },
      {
        name: "remove",
        description: "Remove a deployed function",
        usage: "serverless remove --function <name>",
        examples: [
          "serverless remove --function hello",
          "serverless remove --all",
        ],
        handler: (args) => this.remove(args),
      },
      {
        name: "info",
        description: "Display function information",
        usage: "serverless info [options]",
        examples: [
          "serverless info",
          "serverless info --function hello",
          "serverless info --verbose",
        ],
        handler: (args) => this.info(args),
      },
      {
        name: "metrics",
        description: "View function metrics",
        usage: "serverless metrics [options]",
        examples: [
          "serverless metrics",
          "serverless metrics --function hello",
          "serverless metrics --startTime 24h",
        ],
        handler: (args) => this.metrics(args),
      },
      {
        name: "rollback",
        description: "Rollback to a previous version",
        usage: "serverless rollback --function <name> --version <version>",
        examples: [
          "serverless rollback --function hello --version 2",
          "serverless rollback --timestamp 2024-01-15T10:30:00Z",
        ],
        handler: (args) => this.rollback(args),
      },
      {
        name: "config",
        description: "Configure CLI settings",
        usage: "serverless config <key> <value>",
        examples: [
          "serverless config endpoint https://api.serverless.io",
          "serverless config token YOUR_AUTH_TOKEN",
        ],
        handler: (args) => this.config(args),
      },
      {
        name: "marketplace",
        description: "Browse and deploy functions from marketplace",
        usage: "serverless marketplace [command] [options]",
        examples: [
          "serverless marketplace list",
          "serverless marketplace search image",
          "serverless marketplace install hello-world",
        ],
        handler: (args) => this.marketplace(args),
      },
    ];
  }

  // ==========================================================================
  // Command Implementations
  // ==========================================================================

  private async deploy(args: string[]): Promise<CLIResult> {
    const functionName = this.getArgValue(args, "--function") || "default";
    const stage = this.getArgValue(args, "--stage") || "dev";

    console.log(`\n📦 Deploying function: ${functionName}`);
    console.log(`🌍 Stage: ${stage}`);
    console.log("");

    // Simulate deployment steps
    const steps = [
      "Validating configuration...",
      "Packaging function code...",
      "Optimizing dependencies...",
      "Uploading to platform...",
      "Creating function endpoint...",
      "Configuring triggers...",
      "Warming instances...",
    ];

    for (const step of steps) {
      process.stdout.write(`⏳ ${step} `);
      await this.sleep(300);
      console.log("✅");
    }

    console.log("");
    console.log("✨ Deployment successful!");
    console.log("");
    console.log("📍 Function Details:");
    console.log(`   Name:     ${functionName}`);
    console.log(`   Runtime:  typescript`);
    console.log(`   Memory:   256 MB`);
    console.log(`   Timeout:  30s`);
    console.log(`   Endpoint: https://${functionName}.serverless.app`);
    console.log("");
    console.log("⚡ Cold start: < 20ms (powered by Elide)");
    console.log("");

    return {
      success: true,
      message: "Function deployed successfully",
      data: {
        functionId: `fn-${Date.now()}`,
        endpoint: `https://${functionName}.serverless.app`,
      },
    };
  }

  private async invoke(args: string[]): Promise<CLIResult> {
    const functionName = this.getArgValue(args, "--function");
    const data = this.getArgValue(args, "--data");
    const showLog = args.includes("--log");

    if (!functionName) {
      return {
        success: false,
        message: "Function name is required",
        error: "Use --function <name> to specify the function",
      };
    }

    console.log(`\n🚀 Invoking function: ${functionName}`);
    if (data) {
      console.log(`📝 Payload: ${data}`);
    }
    console.log("");

    // Simulate invocation
    const startTime = Date.now();
    await this.sleep(100);
    const duration = Date.now() - startTime;

    console.log("✅ Invocation successful");
    console.log("");
    console.log("📊 Execution Details:");
    console.log(`   Duration:    ${duration}ms`);
    console.log(`   Memory Used: 128 MB`);
    console.log(`   Status:      200`);
    console.log(`   Cold Start:  No`);
    console.log("");

    if (showLog) {
      console.log("📜 Logs:");
      console.log("   [INFO] Function started");
      console.log("   [INFO] Processing request...");
      console.log("   [INFO] Function completed successfully");
      console.log("");
    }

    console.log("📤 Response:");
    console.log("   {");
    console.log('     "statusCode": 200,');
    console.log(`     "body": "Function executed successfully"`);
    console.log("   }");
    console.log("");

    return {
      success: true,
      message: "Function invoked successfully",
      data: {
        statusCode: 200,
        duration,
      },
    };
  }

  private async logs(args: string[]): Promise<CLIResult> {
    const functionName = this.getArgValue(args, "--function");
    const tail = args.includes("--tail");

    if (!functionName) {
      return {
        success: false,
        message: "Function name is required",
        error: "Use --function <name> to specify the function",
      };
    }

    console.log(`\n📜 Logs for function: ${functionName}`);
    console.log("");

    // Simulate log entries
    const logs = [
      { time: "2024-01-15T10:30:00Z", level: "INFO", message: "Function started" },
      { time: "2024-01-15T10:30:00Z", level: "INFO", message: "Processing request..." },
      { time: "2024-01-15T10:30:00Z", level: "DEBUG", message: "Validating input" },
      { time: "2024-01-15T10:30:01Z", level: "INFO", message: "Request processed successfully" },
      { time: "2024-01-15T10:30:01Z", level: "INFO", message: "Function completed" },
    ];

    for (const log of logs) {
      console.log(`${log.time} [${log.level}] ${log.message}`);
    }

    console.log("");

    if (tail) {
      console.log("👀 Tailing logs... (Press Ctrl+C to stop)");
      console.log("");
    }

    return {
      success: true,
      message: "Logs retrieved successfully",
      data: { logs },
    };
  }

  private async remove(args: string[]): Promise<CLIResult> {
    const functionName = this.getArgValue(args, "--function");
    const removeAll = args.includes("--all");

    if (!functionName && !removeAll) {
      return {
        success: false,
        message: "Function name is required",
        error: "Use --function <name> or --all",
      };
    }

    console.log(`\n🗑️  Removing function: ${functionName || "all"}`);
    console.log("");

    // Simulate removal
    const steps = [
      "Stopping active instances...",
      "Removing endpoints...",
      "Deleting function code...",
      "Cleaning up resources...",
    ];

    for (const step of steps) {
      process.stdout.write(`⏳ ${step} `);
      await this.sleep(200);
      console.log("✅");
    }

    console.log("");
    console.log("✨ Function removed successfully");
    console.log("");

    return {
      success: true,
      message: "Function removed successfully",
    };
  }

  private async info(args: string[]): Promise<CLIResult> {
    const functionName = this.getArgValue(args, "--function");
    const verbose = args.includes("--verbose");

    console.log("\n📊 Serverless Platform Information");
    console.log("━".repeat(50));
    console.log("");

    if (functionName) {
      console.log(`Function: ${functionName}`);
      console.log("");
      console.log("Configuration:");
      console.log(`  Runtime:     typescript`);
      console.log(`  Memory:      256 MB`);
      console.log(`  Timeout:     30s`);
      console.log(`  Handler:     index.handler`);
      console.log("");
      console.log("Endpoints:");
      console.log(`  HTTPS:       https://${functionName}.serverless.app`);
      console.log(`  WebSocket:   wss://${functionName}.serverless.app`);
      console.log("");
      console.log("Triggers:");
      console.log(`  HTTP:        GET, POST /`);
      console.log(`  Scheduled:   cron(0 0 * * *)`);
      console.log("");
      console.log("Statistics:");
      console.log(`  Invocations: 1,234`);
      console.log(`  Errors:      12 (0.97%)`);
      console.log(`  Cold Starts: 45 (3.65%)`);
      console.log(`  Avg Duration: 145ms`);
      console.log("");
    } else {
      console.log("Platform: Serverless Framework");
      console.log("Version:  1.0.0");
      console.log("Region:   us-east-1");
      console.log("");
      console.log("Functions:");
      console.log("  Total:    5");
      console.log("  Active:   4");
      console.log("  Inactive: 1");
      console.log("");
      console.log("Platform Metrics:");
      console.log("  Total Invocations: 12,345");
      console.log("  Avg Response Time: 125ms");
      console.log("  Cold Start Time:   18ms ⚡");
      console.log("  Success Rate:      99.2%");
      console.log("  Total Cost:        $0.42");
      console.log("");
    }

    return {
      success: true,
      message: "Info retrieved successfully",
    };
  }

  private async metrics(args: string[]): Promise<CLIResult> {
    const functionName = this.getArgValue(args, "--function");

    console.log("\n📊 Function Metrics");
    console.log("━".repeat(50));
    console.log("");

    if (functionName) {
      console.log(`Function: ${functionName}`);
      console.log("");
    }

    console.log("Invocations:");
    console.log("  Total:     1,234");
    console.log("  Success:   1,222 (99.03%)");
    console.log("  Errors:    12 (0.97%)");
    console.log("");
    console.log("Performance:");
    console.log("  Avg:       145ms");
    console.log("  Min:       45ms");
    console.log("  Max:       890ms");
    console.log("  P50:       120ms");
    console.log("  P95:       320ms");
    console.log("  P99:       650ms");
    console.log("");
    console.log("Cold Starts:");
    console.log("  Count:     45 (3.65%)");
    console.log("  Avg Time:  18ms ⚡");
    console.log("  Min Time:  12ms");
    console.log("  Max Time:  25ms");
    console.log("");
    console.log("Cost:");
    console.log("  Total:     $0.08");
    console.log("  Per 1M:    $64.80");
    console.log("");

    return {
      success: true,
      message: "Metrics retrieved successfully",
    };
  }

  private async rollback(args: string[]): Promise<CLIResult> {
    const functionName = this.getArgValue(args, "--function");
    const version = this.getArgValue(args, "--version");

    if (!functionName || !version) {
      return {
        success: false,
        message: "Function name and version are required",
        error: "Use --function <name> --version <version>",
      };
    }

    console.log(`\n⏮️  Rolling back function: ${functionName}`);
    console.log(`📦 Target version: ${version}`);
    console.log("");

    // Simulate rollback
    const steps = [
      "Fetching version history...",
      "Validating target version...",
      "Stopping current instances...",
      "Deploying previous version...",
      "Warming new instances...",
    ];

    for (const step of steps) {
      process.stdout.write(`⏳ ${step} `);
      await this.sleep(300);
      console.log("✅");
    }

    console.log("");
    console.log("✨ Rollback successful!");
    console.log("");
    console.log(`Current version: ${version}`);
    console.log("");

    return {
      success: true,
      message: "Rollback completed successfully",
      data: { version },
    };
  }

  private async config(args: string[]): Promise<CLIResult> {
    const key = args[0];
    const value = args[1];

    if (!key) {
      // Show current config
      console.log("\n⚙️  Current Configuration:");
      console.log("");
      console.log(`  Endpoint:    ${this.apiEndpoint}`);
      console.log(`  Auth Token:  ${this.authToken ? "***" + this.authToken.slice(-4) : "Not set"}`);
      console.log(`  Project:     ${this.currentProject || "Not set"}`);
      console.log("");

      return {
        success: true,
        message: "Configuration displayed",
      };
    }

    if (!value) {
      return {
        success: false,
        message: "Value is required",
        error: "Usage: serverless config <key> <value>",
      };
    }

    // Set config
    switch (key) {
      case "endpoint":
        this.apiEndpoint = value;
        break;
      case "token":
        this.authToken = value;
        break;
      case "project":
        this.currentProject = value;
        break;
      default:
        return {
          success: false,
          message: "Unknown configuration key",
          error: `Key '${key}' is not valid`,
        };
    }

    console.log(`\n✅ Configuration updated: ${key} = ${value}`);
    console.log("");

    return {
      success: true,
      message: "Configuration updated",
    };
  }

  private async marketplace(args: string[]): Promise<CLIResult> {
    const command = args[0] || "list";

    console.log("\n🏪 Serverless Marketplace");
    console.log("━".repeat(50));
    console.log("");

    if (command === "list" || command === "search") {
      const query = args[1];

      console.log("Available Functions:");
      console.log("");

      const functions = [
        { name: "hello-world", category: "examples", downloads: 1000, rating: 4.8 },
        { name: "api-proxy", category: "utilities", downloads: 500, rating: 4.5 },
        { name: "image-resize", category: "media", downloads: 750, rating: 4.7 },
        { name: "email-sender", category: "communication", downloads: 850, rating: 4.6 },
        { name: "webhook-handler", category: "webhooks", downloads: 600, rating: 4.9 },
        { name: "data-transformer", category: "data", downloads: 450, rating: 4.4 },
      ];

      for (const func of functions) {
        if (!query || func.name.includes(query) || func.category.includes(query)) {
          console.log(`  📦 ${func.name}`);
          console.log(`     Category:  ${func.category}`);
          console.log(`     Downloads: ${func.downloads}`);
          console.log(`     Rating:    ${"⭐".repeat(Math.floor(func.rating))} ${func.rating}`);
          console.log("");
        }
      }

      console.log("💡 Use 'serverless marketplace install <name>' to install");
      console.log("");

    } else if (command === "install") {
      const functionName = args[1];

      if (!functionName) {
        return {
          success: false,
          message: "Function name is required",
          error: "Usage: serverless marketplace install <name>",
        };
      }

      console.log(`Installing: ${functionName}`);
      console.log("");

      await this.sleep(500);

      console.log("✅ Function installed successfully!");
      console.log("");
      console.log(`Run 'serverless deploy --function ${functionName}' to deploy`);
      console.log("");
    }

    return {
      success: true,
      message: "Marketplace command completed",
    };
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private getArgValue(args: string[], flag: string): string | undefined {
    const index = args.indexOf(flag);
    if (index === -1 || index === args.length - 1) {
      return undefined;
    }
    return args[index + 1];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // Execute Command
  // ==========================================================================

  async execute(commandLine: string): Promise<CLIResult> {
    const parts = commandLine.trim().split(/\s+/);
    const commandName = parts[0];
    const args = parts.slice(1);

    const command = this.getCommands().find((cmd) => cmd.name === commandName);

    if (!command) {
      return {
        success: false,
        message: "Unknown command",
        error: `Command '${commandName}' not found. Use 'help' to see available commands.`,
      };
    }

    try {
      return await command.handler(args);
    } catch (error) {
      return {
        success: false,
        message: "Command execution failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==========================================================================
  // Help
  // ==========================================================================

  showHelp(): void {
    console.log("\n⚡ Serverless Framework CLI");
    console.log("━".repeat(50));
    console.log("");
    console.log("Usage: serverless <command> [options]");
    console.log("");
    console.log("Commands:");
    console.log("");

    for (const cmd of this.getCommands()) {
      console.log(`  ${cmd.name.padEnd(15)} ${cmd.description}`);
    }

    console.log("");
    console.log("Examples:");
    console.log("");
    console.log("  serverless deploy");
    console.log("  serverless invoke --function hello");
    console.log("  serverless logs --function api --tail");
    console.log("  serverless marketplace list");
    console.log("");
    console.log("For more information: https://docs.serverless.io");
    console.log("");
  }
}

// =============================================================================
// CLI Demo
// =============================================================================

if (import.meta.main) {
  const cli = new CLISimulator();

  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║          ⚡ Serverless Framework CLI Simulator               ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("This is a demo of the Serverless Framework CLI.");
  console.log("Running sample commands...");
  console.log("");

  // Demo sequence
  (async () => {
    await cli.execute("deploy --function hello-world");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await cli.execute("invoke --function hello-world --log");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await cli.execute("metrics --function hello-world");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("✨ Demo completed!");
    console.log("");
    cli.showHelp();
  })();
}
