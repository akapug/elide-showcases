/**
 * Socket.IO Emitter - Emit Events from Outside Socket.IO
 *
 * Emit Socket.IO events from non-Socket.IO processes via Redis.
 * **POLYGLOT SHOWCASE**: Emit Socket.IO events in ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/socket.io-emitter (~100K+ downloads/week)
 *
 * Features:
 * - Emit events from any process
 * - Redis-based event publishing
 * - Room targeting
 * - Namespace support
 * - Broadcast to all clients
 * - Zero dependencies (simulated)
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java can emit Socket.IO events
 * - ONE implementation works everywhere on Elide
 * - Trigger real-time events from any service
 * - Share event emitter across your stack
 *
 * Use cases:
 * - Background job notifications
 * - Microservice event broadcasting
 * - System-wide notifications
 * - Cross-service real-time updates
 *
 * Package has ~100K+ downloads/week on npm - essential for distributed systems!
 */

export interface EmitterOptions {
  host?: string;
  port?: number;
  key?: string;
  password?: string;
}

export interface BroadcastFlags {
  volatile?: boolean;
  broadcast?: boolean;
  local?: boolean;
  compress?: boolean;
}

/**
 * Socket.IO event emitter for external processes
 */
export class Emitter {
  private key: string;
  private nsp: string;
  private rooms: string[];
  private flags: BroadcastFlags;
  private opts: EmitterOptions;

  constructor(opts: EmitterOptions = {}) {
    this.opts = opts;
    this.key = opts.key || 'socket.io';
    this.nsp = '/';
    this.rooms = [];
    this.flags = {};

    console.log(`[Emitter] Connected to Redis at ${opts.host || 'localhost'}:${opts.port || 6379}`);
  }

  /**
   * Set namespace
   */
  public of(nsp: string): this {
    this.nsp = nsp;
    return this;
  }

  /**
   * Target specific room(s)
   */
  public to(...rooms: string[]): this {
    this.rooms.push(...rooms);
    return this;
  }

  /**
   * Alias for to()
   */
  public in(...rooms: string[]): this {
    return this.to(...rooms);
  }

  /**
   * Set volatile flag
   */
  public get volatile(): this {
    this.flags.volatile = true;
    return this;
  }

  /**
   * Set compress flag
   */
  public get compress(): this {
    this.flags.compress = true;
    return this;
  }

  /**
   * Emit an event
   */
  public emit(event: string, ...args: any[]): this {
    const packet = {
      type: 2, // EVENT
      data: [event, ...args],
      nsp: this.nsp
    };

    const msg = {
      type: 'event',
      data: {
        packet,
        rooms: this.rooms,
        flags: this.flags
      }
    };

    this.publishMessage(msg);
    this.reset();

    return this;
  }

  /**
   * Publish message to Redis
   */
  private publishMessage(msg: any): void {
    const channel = this.getChannel();
    const message = JSON.stringify(msg);

    console.log(`[Emitter] Publishing to channel: ${channel}`);
    console.log(`[Emitter] Message:`, msg);

    // In real implementation, would use Redis PUBLISH
    // redis.publish(channel, message);
  }

  /**
   * Get Redis channel name
   */
  private getChannel(): string {
    const room = this.rooms.length > 0 ? this.rooms[0] : '';
    return `${this.key}#${this.nsp}#${room}#`;
  }

  /**
   * Reset state after emit
   */
  private reset(): void {
    this.rooms = [];
    this.flags = {};
  }
}

/**
 * Create a new emitter instance
 */
export function createEmitter(opts?: EmitterOptions): Emitter {
  return new Emitter(opts);
}

export default createEmitter;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📡 Socket.IO Emitter - External Event Broadcasting for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Create Emitter ===");
  const emitter = createEmitter({
    host: 'localhost',
    port: 6379,
    key: 'socket.io'
  });
  console.log("Emitter connected to Redis");
  console.log();

  console.log("=== Example 2: Emit to All Clients ===");
  emitter.emit('notification', {
    title: 'System Update',
    message: 'Server will restart in 5 minutes'
  });
  console.log();

  console.log("=== Example 3: Emit to Specific Room ===");
  emitter.to('room1').emit('message', {
    user: 'System',
    text: 'Welcome to room1!'
  });
  console.log();

  console.log("=== Example 4: Emit to Multiple Rooms ===");
  emitter
    .to('admins')
    .to('moderators')
    .emit('alert', {
      level: 'warning',
      message: 'Unusual activity detected'
    });
  console.log();

  console.log("=== Example 5: Emit with Namespace ===");
  emitter
    .of('/admin')
    .emit('stats', {
      users: 1234,
      rooms: 56,
      messages: 98765
    });
  console.log();

  console.log("=== Example 6: Volatile Event ===");
  emitter.volatile.emit('typing', { user: 'Alice', isTyping: true });
  console.log("(Volatile events won't be buffered if client is disconnected)");
  console.log();

  console.log("=== Example 7: Background Job Notification ===");
  console.log("Scenario: Background job processing completion");
  const jobEmitter = createEmitter({ key: 'jobs' });

  function notifyJobComplete(jobId: string, userId: string, result: any) {
    jobEmitter
      .to(`user:${userId}`)
      .emit('job:complete', {
        jobId,
        result,
        timestamp: Date.now()
      });
  }

  notifyJobComplete('job-123', 'user-456', {
    status: 'success',
    output: 'Report generated successfully'
  });
  console.log();

  console.log("=== Example 8: Microservice Event Broadcasting ===");
  console.log("Scenario: Order service notifying customers");

  const orderEmitter = createEmitter({ key: 'orders' });

  function broadcastOrderUpdate(orderId: string, customerId: string, status: string) {
    orderEmitter
      .of('/orders')
      .to(`customer:${customerId}`)
      .emit('order:update', {
        orderId,
        status,
        timestamp: Date.now()
      });
  }

  broadcastOrderUpdate('order-789', 'customer-101', 'shipped');
  console.log();

  console.log("=== Example 9: System-Wide Announcements ===");
  const announceEmitter = createEmitter();

  announceEmitter.emit('announcement', {
    type: 'maintenance',
    message: 'Scheduled maintenance tonight at midnight',
    duration: '2 hours'
  });
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Same Socket.IO emitter works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide) - emit from Django/Flask");
  console.log("  • Ruby (via Elide) - emit from Rails");
  console.log("  • Java (via Elide) - emit from Spring Boot");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Any service can emit Socket.IO events");
  console.log("  ✓ Consistent event format across all languages");
  console.log("  ✓ Share real-time infrastructure across your stack");
  console.log("  ✓ Trigger notifications from any microservice");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Background job notifications");
  console.log("- Microservice event broadcasting");
  console.log("- System-wide announcements");
  console.log("- Cross-service real-time updates");
  console.log("- Scheduled task notifications");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Redis-backed pub/sub");
  console.log("- Fire-and-forget event emission");
  console.log("- Instant execution on Elide");
  console.log("- ~100K+ downloads/week on npm!");
}
