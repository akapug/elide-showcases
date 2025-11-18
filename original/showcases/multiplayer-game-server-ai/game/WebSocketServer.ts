/**
 * WebSocketServer - Manages WebSocket connections for multiplayer
 */

import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { GameEngine } from './GameEngine.js';
import { Tank } from './entities/Tank.js';

export interface Player {
  id: string;
  ws: WebSocket;
  tankId: string;
  lastPing: number;
}

export class WebSocketGameServer {
  private wss: WSServer;
  private engine: GameEngine;
  private players: Map<string, Player> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(port: number, engine: GameEngine) {
    this.engine = engine;
    this.wss = new WSServer({ port });

    console.log(`🔌 WebSocket server listening on port ${port}`);

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    const playerId = this.generatePlayerId();
    console.log(`👤 Player ${playerId} connected`);

    // Spawn tank for player
    const tankId = `tank_${playerId}`;
    const tank = this.engine.spawnTank(tankId, false, playerId);

    // Create player record
    const player: Player = {
      id: playerId,
      ws,
      tankId,
      lastPing: Date.now()
    };

    this.players.set(playerId, player);

    // Send initial state
    this.sendToPlayer(player, {
      type: 'init',
      playerId,
      tankId,
      gameState: this.engine.getState().serialize()
    });

    // Handle messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(player, message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      console.log(`👋 Player ${playerId} disconnected`);
      this.engine.removeTank(tankId);
      this.players.delete(playerId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`Player ${playerId} error:`, error);
    });

    // Pong response
    ws.on('pong', () => {
      player.lastPing = Date.now();
    });
  }

  /**
   * Handle player message
   */
  private handleMessage(player: Player, message: any): void {
    switch (message.type) {
      case 'input':
        this.handleInput(player, message);
        break;

      case 'fire':
        this.engine.fireTank(player.tankId);
        break;

      case 'respawn':
        this.engine.respawnTank(player.tankId);
        break;

      case 'ping':
        this.sendToPlayer(player, { type: 'pong', timestamp: Date.now() });
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle player input (movement, aiming)
   */
  private handleInput(player: Player, message: any): void {
    const tank = this.engine.getState().getTank(player.tankId);
    if (!tank || !tank.alive) return;

    // Apply movement
    if (message.move) {
      const { dx, dy } = message.move;
      this.engine.moveTank(player.tankId, dx, dy, 1 / 60);
    }

    // Apply turret rotation
    if (message.turretAngle !== undefined) {
      this.engine.rotateTankTurret(player.tankId, message.turretAngle, 1 / 60);
    }
  }

  /**
   * Broadcast game state to all players
   */
  public broadcastGameState(state: any): void {
    const message = JSON.stringify({
      type: 'gameState',
      state
    });

    this.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(message);
      }
    });
  }

  /**
   * Send message to specific player
   */
  private sendToPlayer(player: Player, data: any): void {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast message to all players
   */
  public broadcast(data: any): void {
    const message = JSON.stringify(data);
    this.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(message);
      }
    });
  }

  /**
   * Start heartbeat to detect disconnected clients
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds

      this.players.forEach((player, playerId) => {
        if (now - player.lastPing > timeout) {
          console.log(`💀 Player ${playerId} timed out`);
          player.ws.close();
          this.players.delete(playerId);
          this.engine.removeTank(player.tankId);
        } else if (player.ws.readyState === WebSocket.OPEN) {
          player.ws.ping();
        }
      });
    }, 10000); // Check every 10 seconds
  }

  /**
   * Generate unique player ID
   */
  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected player count
   */
  public getPlayerCount(): number {
    return this.players.size;
  }

  /**
   * Close server
   */
  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
    console.log('🔌 WebSocket server closed');
  }
}
