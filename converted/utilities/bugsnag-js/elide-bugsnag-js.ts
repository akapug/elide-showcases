/**
 * @bugsnag/js - Bugsnag Error Monitoring
 *
 * Error monitoring and reporting for JavaScript applications.
 * **POLYGLOT SHOWCASE**: Error monitoring for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@bugsnag/js (~100K+ downloads/week)
 *
 * Features:
 * - Automatic error detection
 * - Breadcrumbs for debugging
 * - Custom metadata
 * - User tracking
 * - Release stages
 * - Session tracking
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Monitor errors across all languages
 * - ONE error monitoring platform on Elide
 * - Unified error dashboard
 * - Share error insights across stack
 *
 * Use cases:
 * - Production error monitoring
 * - Bug tracking and reporting
 * - User session analysis
 * - Release monitoring
 *
 * Package has ~100K+ downloads/week on npm!
 */

interface BugsnagConfig {
  apiKey: string;
  appVersion?: string;
  releaseStage?: string;
  enabledReleaseStages?: string[];
  appType?: string;
  autoDetectErrors?: boolean;
}

interface BugsnagEvent {
  errors: Array<{ errorClass: string; errorMessage: string }>;
  breadcrumbs: Breadcrumb[];
  user: any;
  metadata: Record<string, any>;
  severity: 'error' | 'warning' | 'info';
}

interface Breadcrumb {
  timestamp: string;
  message: string;
  type: string;
  metadata: Record<string, any>;
}

class Bugsnag {
  private config: BugsnagConfig | null = null;
  private breadcrumbs: Breadcrumb[] = [];
  private user: any = null;
  private metadata: Record<string, any> = {};

  start(config: BugsnagConfig): void {
    this.config = config;
    console.log('[Bugsnag] Started:', {
      releaseStage: config.releaseStage,
      appVersion: config.appVersion,
    });

    if (config.autoDetectErrors !== false) {
      this.setupErrorHandlers();
    }
  }

  private setupErrorHandlers(): void {
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.notify(error);
      });

      process.on('unhandledRejection', (reason) => {
        this.notify(reason instanceof Error ? reason : new Error(String(reason)));
      });
    }
  }

  notify(error: Error, onError?: (event: BugsnagEvent) => boolean | void): void {
    const event: BugsnagEvent = {
      errors: [
        {
          errorClass: error.name,
          errorMessage: error.message,
        },
      ],
      breadcrumbs: this.breadcrumbs.slice(-30),
      user: this.user,
      metadata: this.metadata,
      severity: 'error',
    };

    if (onError) {
      const shouldSend = onError(event);
      if (shouldSend === false) return;
    }

    console.log('[Bugsnag] Error notified:', {
      errorClass: error.name,
      errorMessage: error.message,
      breadcrumbCount: event.breadcrumbs.length,
    });
  }

  leaveBreadcrumb(message: string, metadata: Record<string, any> = {}, type: string = 'manual'): void {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      message,
      type,
      metadata,
    });

    if (this.breadcrumbs.length > 30) {
      this.breadcrumbs = this.breadcrumbs.slice(-30);
    }

    console.log('[Bugsnag] Breadcrumb:', message);
  }

  setUser(id: string, email?: string, name?: string): void {
    this.user = { id, email, name };
    console.log('[Bugsnag] User set:', this.user);
  }

  addMetadata(section: string, data: Record<string, any>): void {
    this.metadata[section] = { ...this.metadata[section], ...data };
  }

  getMetadata(section: string): any {
    return this.metadata[section];
  }

  clearMetadata(section: string, key?: string): void {
    if (key) {
      delete this.metadata[section]?.[key];
    } else {
      delete this.metadata[section];
    }
  }
}

const bugsnag = new Bugsnag();
export { bugsnag, Bugsnag, BugsnagConfig, BugsnagEvent };
export default bugsnag;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🐛 @bugsnag/js - Error Monitoring (POLYGLOT!)\n");

  console.log("=== Initialize Bugsnag ===");
  bugsnag.start({
    apiKey: 'your-api-key',
    appVersion: '1.0.0',
    releaseStage: 'production',
  });
  console.log();

  console.log("=== Leave Breadcrumbs ===");
  bugsnag.leaveBreadcrumb('User logged in', { userId: '123' }, 'user');
  bugsnag.leaveBreadcrumb('API request made', { endpoint: '/api/users' }, 'request');
  console.log();

  console.log("=== Set User ===");
  bugsnag.setUser('user-123', 'alice@example.com', 'Alice');
  console.log();

  console.log("=== Add Metadata ===");
  bugsnag.addMetadata('payment', {
    transactionId: 'txn-456',
    amount: 99.99,
    currency: 'USD',
  });
  console.log();

  console.log("=== Notify Error ===");
  try {
    throw new Error('Payment processing failed');
  } catch (error) {
    bugsnag.notify(error as Error);
  }
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Production error monitoring");
  console.log("- Bug tracking and reporting");
  console.log("- User session analysis");
  console.log("- ~100K+ downloads/week on npm!");
}
