/**
 * Leader Elector - High Availability Leader Election
 *
 * Implements distributed leader election for operator HA:
 * - Lease-based leader election
 * - Automatic failover
 * - Graceful leadership transition
 * - Health monitoring
 * - Leader callbacks for lifecycle events
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface LeaderElectionConfig {
  leaseName: string;
  leaseNamespace: string;
  identity: string;
  leaseDuration: number; // milliseconds
  renewDeadline: number; // milliseconds
  retryPeriod: number; // milliseconds
}

export interface Lease {
  holderIdentity: string;
  leaseDuration: number;
  acquireTime: string;
  renewTime: string;
  leaderTransitions: number;
}

export interface LeaderCallbacks {
  onStartedLeading(): void;
  onStoppedLeading(): void;
  onNewLeader(identity: string): void;
}

// ============================================================================
// Leader Elector
// ============================================================================

export class LeaderElector {
  private config: LeaderElectionConfig;
  private callbacks: LeaderCallbacks;
  private isLeader = false;
  private lease?: Lease;
  private running = false;
  private leaseCheckTimer?: NodeJS.Timeout;
  private renewTimer?: NodeJS.Timeout;

  // In-memory lease storage (would be K8s Lease resource in production)
  private static leaseStore = new Map<string, Lease>();

  constructor(config: LeaderElectionConfig, callbacks: LeaderCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Start leader election
   */
  start(): void {
    if (this.running) {
      console.log("[LEADER] Already running");
      return;
    }

    this.running = true;
    console.log(`[LEADER] Starting leader election for ${this.config.identity}`);

    // Start the election loop
    this.tryAcquireOrRenew();
  }

  /**
   * Stop leader election
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;
    console.log(`[LEADER] Stopping leader election for ${this.config.identity}`);

    // Clear timers
    if (this.leaseCheckTimer) {
      clearTimeout(this.leaseCheckTimer);
      this.leaseCheckTimer = undefined;
    }

    if (this.renewTimer) {
      clearTimeout(this.renewTimer);
      this.renewTimer = undefined;
    }

    // Release leadership
    if (this.isLeader) {
      this.releaseLeadership();
    }
  }

  /**
   * Check if this instance is the leader
   */
  isLeaderInstance(): boolean {
    return this.isLeader;
  }

  /**
   * Get current leader identity
   */
  getLeader(): string | undefined {
    const lease = this.getLease();
    return lease?.holderIdentity;
  }

  /**
   * Get lease information
   */
  getLeaseInfo(): Lease | undefined {
    return this.getLease();
  }

  /**
   * Try to acquire or renew leadership
   */
  private async tryAcquireOrRenew(): Promise<void> {
    if (!this.running) {
      return;
    }

    try {
      const lease = this.getLease();

      if (!lease) {
        // No lease exists, try to acquire
        await this.acquireLease();
      } else if (lease.holderIdentity === this.config.identity) {
        // We hold the lease, renew it
        await this.renewLease();
      } else {
        // Another instance holds the lease, check if expired
        await this.checkAndAcquireLease(lease);
      }
    } catch (error) {
      console.error("[LEADER] Error in leader election:", error);
    }

    // Schedule next check
    const delay = this.isLeader ? this.config.renewDeadline : this.config.retryPeriod;
    this.leaseCheckTimer = setTimeout(() => this.tryAcquireOrRenew(), delay);
  }

  /**
   * Acquire new lease
   */
  private async acquireLease(): Promise<void> {
    console.log(`[LEADER] Attempting to acquire lease`);

    const now = new Date().toISOString();
    const newLease: Lease = {
      holderIdentity: this.config.identity,
      leaseDuration: this.config.leaseDuration,
      acquireTime: now,
      renewTime: now,
      leaderTransitions: 0,
    };

    this.setLease(newLease);
    this.lease = newLease;

    this.becomeLeader();
  }

  /**
   * Renew existing lease
   */
  private async renewLease(): Promise<void> {
    const lease = this.getLease();
    if (!lease || lease.holderIdentity !== this.config.identity) {
      // Lost leadership
      this.loseLeadership();
      return;
    }

    // Renew the lease
    lease.renewTime = new Date().toISOString();
    this.setLease(lease);
    this.lease = lease;

    console.log(`[LEADER] Renewed lease`);
  }

  /**
   * Check if lease is expired and try to acquire
   */
  private async checkAndAcquireLease(lease: Lease): Promise<void> {
    const renewTime = new Date(lease.renewTime).getTime();
    const now = Date.now();
    const elapsed = now - renewTime;

    if (elapsed > lease.leaseDuration) {
      // Lease has expired, try to acquire
      console.log(
        `[LEADER] Lease held by ${lease.holderIdentity} has expired ` +
        `(${elapsed}ms > ${lease.leaseDuration}ms)`
      );

      const newLease: Lease = {
        holderIdentity: this.config.identity,
        leaseDuration: this.config.leaseDuration,
        acquireTime: new Date().toISOString(),
        renewTime: new Date().toISOString(),
        leaderTransitions: lease.leaderTransitions + 1,
      };

      this.setLease(newLease);
      this.lease = newLease;

      this.becomeLeader();
    } else {
      // Lease is still valid, check if leader changed
      if (!this.isLeader && this.lease?.holderIdentity !== lease.holderIdentity) {
        this.onLeaderChanged(lease.holderIdentity);
      }

      this.lease = lease;
    }
  }

  /**
   * Become the leader
   */
  private becomeLeader(): void {
    if (this.isLeader) {
      return;
    }

    console.log(`[LEADER] ${this.config.identity} became the leader`);
    this.isLeader = true;

    try {
      this.callbacks.onStartedLeading();
    } catch (error) {
      console.error("[LEADER] Error in onStartedLeading callback:", error);
    }
  }

  /**
   * Lose leadership
   */
  private loseLeadership(): void {
    if (!this.isLeader) {
      return;
    }

    console.log(`[LEADER] ${this.config.identity} lost leadership`);
    this.isLeader = false;

    try {
      this.callbacks.onStoppedLeading();
    } catch (error) {
      console.error("[LEADER] Error in onStoppedLeading callback:", error);
    }
  }

  /**
   * Release leadership voluntarily
   */
  private releaseLeadership(): void {
    if (!this.isLeader) {
      return;
    }

    console.log(`[LEADER] ${this.config.identity} releasing leadership`);

    // Delete the lease to allow immediate transition
    this.deleteLease();
    this.lease = undefined;

    this.loseLeadership();
  }

  /**
   * Handle leader change notification
   */
  private onLeaderChanged(newLeader: string): void {
    console.log(`[LEADER] New leader elected: ${newLeader}`);

    try {
      this.callbacks.onNewLeader(newLeader);
    } catch (error) {
      console.error("[LEADER] Error in onNewLeader callback:", error);
    }
  }

  /**
   * Get lease from storage
   */
  private getLease(): Lease | undefined {
    const key = this.getLeaseKey();
    return LeaderElector.leaseStore.get(key);
  }

  /**
   * Set lease in storage
   */
  private setLease(lease: Lease): void {
    const key = this.getLeaseKey();
    LeaderElector.leaseStore.set(key, lease);
  }

  /**
   * Delete lease from storage
   */
  private deleteLease(): void {
    const key = this.getLeaseKey();
    LeaderElector.leaseStore.delete(key);
  }

  /**
   * Get lease key
   */
  private getLeaseKey(): string {
    return `${this.config.leaseNamespace}/${this.config.leaseName}`;
  }
}

// ============================================================================
// Leader Election Manager
// ============================================================================

export class LeaderElectionManager {
  private electors = new Map<string, LeaderElector>();

  /**
   * Create and start a leader elector
   */
  createElector(config: LeaderElectionConfig, callbacks: LeaderCallbacks): LeaderElector {
    const key = `${config.leaseNamespace}/${config.leaseName}`;

    // Check if elector already exists
    let elector = this.electors.get(key);
    if (elector) {
      console.warn(`[LEADER] Elector already exists for ${key}`);
      return elector;
    }

    // Create new elector
    elector = new LeaderElector(config, callbacks);
    this.electors.set(key, elector);

    return elector;
  }

  /**
   * Get elector by key
   */
  getElector(namespace: string, name: string): LeaderElector | undefined {
    const key = `${namespace}/${name}`;
    return this.electors.get(key);
  }

  /**
   * Stop and remove elector
   */
  removeElector(namespace: string, name: string): void {
    const key = `${namespace}/${name}`;
    const elector = this.electors.get(key);

    if (elector) {
      elector.stop();
      this.electors.delete(key);
      console.log(`[LEADER] Removed elector for ${key}`);
    }
  }

  /**
   * Stop all electors
   */
  stopAll(): void {
    for (const elector of this.electors.values()) {
      elector.stop();
    }
    this.electors.clear();
    console.log("[LEADER] Stopped all electors");
  }

  /**
   * Get all electors
   */
  getAllElectors(): Map<string, LeaderElector> {
    return new Map(this.electors);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create default leader election config
 */
export function createDefaultConfig(identity: string): LeaderElectionConfig {
  return {
    leaseName: "elide-operator-leader",
    leaseNamespace: "default",
    identity,
    leaseDuration: 15000, // 15 seconds
    renewDeadline: 10000, // 10 seconds
    retryPeriod: 2000, // 2 seconds
  };
}

/**
 * Generate unique identity for this instance
 */
export function generateIdentity(hostname?: string, pod?: string): string {
  const host = hostname || "localhost";
  const podName = pod || `pod-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();
  return `${host}-${podName}-${timestamp}`;
}

// ============================================================================
// Example Usage
// ============================================================================

export class OperatorLeaderElection {
  private elector?: LeaderElector;
  private isRunningAsLeader = false;

  constructor(private operatorName: string) {}

  /**
   * Start leader election
   */
  start(): void {
    const identity = generateIdentity(this.operatorName);
    const config = createDefaultConfig(identity);

    const callbacks: LeaderCallbacks = {
      onStartedLeading: () => {
        console.log(`[OPERATOR] Started leading, beginning reconciliation`);
        this.isRunningAsLeader = true;
        this.startOperatorWorkloads();
      },
      onStoppedLeading: () => {
        console.log(`[OPERATOR] Stopped leading, pausing reconciliation`);
        this.isRunningAsLeader = false;
        this.stopOperatorWorkloads();
      },
      onNewLeader: (leader: string) => {
        console.log(`[OPERATOR] New leader elected: ${leader}`);
      },
    };

    this.elector = new LeaderElector(config, callbacks);
    this.elector.start();
  }

  /**
   * Stop leader election
   */
  stop(): void {
    if (this.elector) {
      this.elector.stop();
      this.elector = undefined;
    }
  }

  /**
   * Check if running as leader
   */
  isLeader(): boolean {
    return this.isRunningAsLeader;
  }

  /**
   * Start operator workloads (controllers, reconcilers, etc.)
   */
  private startOperatorWorkloads(): void {
    // Start controllers, reconcilers, watchers, etc.
    console.log("[OPERATOR] Starting workloads...");
  }

  /**
   * Stop operator workloads
   */
  private stopOperatorWorkloads(): void {
    // Stop controllers, reconcilers, watchers, etc.
    console.log("[OPERATOR] Stopping workloads...");
  }
}
