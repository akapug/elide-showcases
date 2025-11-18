/**
 * Socket.IO Adapter - Room and Event Broadcasting
 *
 * Default in-memory adapter for Socket.IO room management and broadcasting.
 * **POLYGLOT SHOWCASE**: Manage Socket.IO rooms in ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/socket.io-adapter (~2M+ downloads/week)
 *
 * Features:
 * - Room management (join/leave)
 * - Event broadcasting to rooms
 * - Socket namespacing
 * - Client tracking
 * - Multi-room broadcasting
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java can all manage Socket.IO rooms
 * - ONE implementation works everywhere on Elide
 * - Consistent room logic across languages
 * - Share adapter implementations across your stack
 *
 * Use cases:
 * - Socket.IO server implementation
 * - Chat room management
 * - Broadcast messaging
 * - Real-time collaboration
 *
 * Package has ~2M+ downloads/week on npm - core Socket.IO infrastructure!
 */

export interface BroadcastOptions {
  except?: Set<string>;
  rooms?: Set<string>;
  flags?: Record<string, any>;
}

export type Room = Set<string>;

/**
 * In-memory adapter for Socket.IO
 */
export class Adapter {
  public rooms: Map<string, Room>;
  public sids: Map<string, Set<string>>;
  public nsp: any;

  constructor(nsp: any) {
    this.nsp = nsp;
    this.rooms = new Map();
    this.sids = new Map();
  }

  /**
   * Add a socket to a room
   */
  public addAll(id: string, rooms: Set<string>): void {
    if (!this.sids.has(id)) {
      this.sids.set(id, new Set());
    }

    for (const room of rooms) {
      this.sids.get(id)!.add(room);

      if (!this.rooms.has(room)) {
        this.rooms.set(room, new Set());
      }
      this.rooms.get(room)!.add(id);
    }
  }

  /**
   * Remove a socket from a room
   */
  public del(id: string, room: string): void {
    if (this.sids.has(id)) {
      this.sids.get(id)!.delete(room);
    }

    if (this.rooms.has(room)) {
      this.rooms.get(room)!.delete(id);
      if (this.rooms.get(room)!.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  /**
   * Remove a socket from all rooms
   */
  public delAll(id: string): void {
    if (!this.sids.has(id)) {
      return;
    }

    for (const room of this.sids.get(id)!) {
      if (this.rooms.has(room)) {
        this.rooms.get(room)!.delete(id);
        if (this.rooms.get(room)!.size === 0) {
          this.rooms.delete(room);
        }
      }
    }

    this.sids.delete(id);
  }

  /**
   * Broadcast a packet to rooms
   */
  public broadcast(packet: any, opts: BroadcastOptions): void {
    const rooms = opts.rooms || new Set();
    const except = opts.except || new Set();
    const flags = opts.flags || {};

    const recipients = new Set<string>();

    if (rooms.size === 0) {
      // Broadcast to all
      for (const [id] of this.sids) {
        if (!except.has(id)) {
          recipients.add(id);
        }
      }
    } else {
      // Broadcast to specific rooms
      for (const room of rooms) {
        if (this.rooms.has(room)) {
          for (const id of this.rooms.get(room)!) {
            if (!except.has(id)) {
              recipients.add(id);
            }
          }
        }
      }
    }

    // Send to all recipients
    for (const id of recipients) {
      // In real implementation, would send packet to socket
      // Here we just track it
      console.log(`[Adapter] Broadcast to ${id}:`, packet);
    }
  }

  /**
   * Get sockets in a room
   */
  public sockets(rooms: Set<string>): Set<string> {
    const result = new Set<string>();

    if (rooms.size === 0) {
      // All sockets
      for (const [id] of this.sids) {
        result.add(id);
      }
    } else {
      // Sockets in specific rooms
      for (const room of rooms) {
        if (this.rooms.has(room)) {
          for (const id of this.rooms.get(room)!) {
            result.add(id);
          }
        }
      }
    }

    return result;
  }

  /**
   * Get all room names
   */
  public getRooms(): Set<string> {
    return new Set(this.rooms.keys());
  }

  /**
   * Get rooms a socket is in
   */
  public socketRooms(id: string): Set<string> | undefined {
    return this.sids.get(id);
  }
}

export default Adapter;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 Socket.IO Adapter - Room Management for Elide (POLYGLOT!)\n");

  const nsp = { name: '/' };
  const adapter = new Adapter(nsp);

  console.log("=== Example 1: Add Socket to Room ===");
  adapter.addAll('socket1', new Set(['room1', 'room2']));
  console.log("Socket1 rooms:", adapter.socketRooms('socket1'));
  console.log("Room1 sockets:", adapter.rooms.get('room1'));
  console.log();

  console.log("=== Example 2: Add Multiple Sockets ===");
  adapter.addAll('socket2', new Set(['room1']));
  adapter.addAll('socket3', new Set(['room2']));
  console.log("All rooms:", Array.from(adapter.getRooms()));
  console.log("Room1 sockets:", Array.from(adapter.rooms.get('room1')!));
  console.log("Room2 sockets:", Array.from(adapter.rooms.get('room2')!));
  console.log();

  console.log("=== Example 3: Broadcast to Room ===");
  adapter.broadcast(
    { type: 'message', data: 'Hello room1!' },
    { rooms: new Set(['room1']) }
  );
  console.log();

  console.log("=== Example 4: Broadcast to All Except ===");
  adapter.broadcast(
    { type: 'message', data: 'Hello everyone!' },
    { except: new Set(['socket1']) }
  );
  console.log();

  console.log("=== Example 5: Remove Socket from Room ===");
  adapter.del('socket1', 'room1');
  console.log("Socket1 rooms after removal:", adapter.socketRooms('socket1'));
  console.log("Room1 sockets after removal:", adapter.rooms.get('room1'));
  console.log();

  console.log("=== Example 6: Get Sockets in Rooms ===");
  const socketsInRoom1 = adapter.sockets(new Set(['room1']));
  console.log("Sockets in room1:", Array.from(socketsInRoom1));
  console.log();

  console.log("=== Example 7: Chat Room Simulation ===");
  const chatAdapter = new Adapter({ name: '/chat' });
  chatAdapter.addAll('alice', new Set(['general', 'announcements']));
  chatAdapter.addAll('bob', new Set(['general']));
  chatAdapter.addAll('charlie', new Set(['random']));

  console.log("Chat rooms:", Array.from(chatAdapter.getRooms()));
  console.log("General room users:", Array.from(chatAdapter.rooms.get('general')!));

  console.log("\nBroadcast to general room:");
  chatAdapter.broadcast(
    { event: 'chat', data: { user: 'alice', msg: 'Hi everyone!' } },
    { rooms: new Set(['general']) }
  );
  console.log();

  console.log("=== Example 8: Remove All Socket Rooms ===");
  chatAdapter.delAll('alice');
  console.log("Alice rooms after removal:", chatAdapter.socketRooms('alice'));
  console.log("General room after Alice left:", chatAdapter.rooms.get('general'));
  console.log();

  console.log("=== Example 9: POLYGLOT Use Case ===");
  console.log("🌐 Same Socket.IO adapter works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One room manager, all languages");
  console.log("  ✓ Consistent broadcast logic everywhere");
  console.log("  ✓ Share adapter implementations across your stack");
  console.log("  ✓ Build polyglot Socket.IO servers");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Socket.IO server implementation");
  console.log("- Chat room management");
  console.log("- Broadcast messaging");
  console.log("- Real-time collaboration");
  console.log("- Multi-room event distribution");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- In-memory room tracking");
  console.log("- Instant execution on Elide");
  console.log("- ~2M+ downloads/week on npm!");
}
