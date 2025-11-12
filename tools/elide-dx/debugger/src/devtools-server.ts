/**
 * Chrome DevTools Server
 * WebSocket server for DevTools frontend connection
 */

import { EventEmitter } from 'events';
import type ElideDebugger from './debugger';

export interface DevToolsMessage {
  id: number;
  method: string;
  params?: any;
}

export interface DevToolsResponse {
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface DevToolsSession {
  id: string;
  connected: boolean;
  debugger: ElideDebugger;
}

/**
 * Chrome DevTools Protocol Server
 */
export class DevToolsServer extends EventEmitter {
  private sessions: Map<string, DevToolsSession> = new Map();
  private port: number;
  private host: string;
  private messageId: number = 0;

  constructor(port: number = 9229, host: string = '127.0.0.1') {
    super();
    this.port = port;
    this.host = host;
  }

  /**
   * Start DevTools server
   */
  async start(): Promise<void> {
    console.log(`[DevTools] Starting server on ${this.host}:${this.port}`);
    // In production, this would start a WebSocket server
    this.emit('started', { port: this.port, host: this.host });
  }

  /**
   * Stop DevTools server
   */
  async stop(): Promise<void> {
    console.log('[DevTools] Stopping server');

    // Close all sessions
    for (const session of this.sessions.values()) {
      await session.debugger.disconnect();
    }
    this.sessions.clear();

    this.emit('stopped');
  }

  /**
   * Create new debug session
   */
  createSession(debugger: ElideDebugger): string {
    const sessionId = `session_${Date.now()}_${Math.random()}`;
    const session: DevToolsSession = {
      id: sessionId,
      connected: true,
      debugger
    };

    this.sessions.set(sessionId, session);
    this.setupDebuggerListeners(session);

    console.log(`[DevTools] Session created: ${sessionId}`);
    return sessionId;
  }

  /**
   * Setup listeners for debugger events
   */
  private setupDebuggerListeners(session: DevToolsSession): void {
    const { debugger } = session;

    debugger.on('paused', (data) => {
      this.sendEvent(session.id, 'Debugger.paused', data);
    });

    debugger.on('resumed', () => {
      this.sendEvent(session.id, 'Debugger.resumed', {});
    });

    debugger.on('breakpointSet', (breakpoint) => {
      this.sendEvent(session.id, 'Debugger.breakpointResolved', {
        breakpointId: breakpoint.id,
        location: breakpoint.location
      });
    });

    debugger.on('scriptParsed', (script) => {
      this.sendEvent(session.id, 'Debugger.scriptParsed', script);
    });
  }

  /**
   * Handle incoming CDP message
   */
  async handleMessage(sessionId: string, message: DevToolsMessage): Promise<DevToolsResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        id: message.id,
        error: {
          code: -32000,
          message: 'Session not found'
        }
      };
    }

    try {
      const result = await this.processMethod(session, message.method, message.params);
      return {
        id: message.id,
        result
      };
    } catch (error) {
      return {
        id: message.id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Process CDP method
   */
  private async processMethod(session: DevToolsSession, method: string, params: any): Promise<any> {
    const [domain, command] = method.split('.');
    const { debugger } = session;

    switch (domain) {
      case 'Debugger':
        return this.handleDebuggerMethod(debugger, command, params);
      case 'Runtime':
        return this.handleRuntimeMethod(debugger, command, params);
      case 'Profiler':
        return this.handleProfilerMethod(debugger, command, params);
      default:
        throw new Error(`Unknown domain: ${domain}`);
    }
  }

  /**
   * Handle Debugger domain methods
   */
  private async handleDebuggerMethod(debugger: ElideDebugger, command: string, params: any): Promise<any> {
    switch (command) {
      case 'enable':
        await debugger.connect();
        return {};

      case 'setBreakpointByUrl':
        const bp = await debugger.setBreakpoint(
          params.url,
          params.lineNumber,
          params.columnNumber,
          params.condition
        );
        return { breakpointId: bp.id, locations: [bp.location] };

      case 'removeBreakpoint':
        await debugger.removeBreakpoint(params.breakpointId);
        return {};

      case 'resume':
        await debugger.resume();
        return {};

      case 'pause':
        await debugger.pause();
        return {};

      case 'stepInto':
        await debugger.stepInto();
        return {};

      case 'stepOver':
        await debugger.stepOver();
        return {};

      case 'stepOut':
        await debugger.stepOut();
        return {};

      case 'evaluateOnCallFrame':
        const result = await debugger.evaluate(params.expression, params.callFrameId);
        return { result };

      case 'setPauseOnExceptions':
        debugger.setPauseOnExceptions(params.state);
        return {};

      case 'setSkipAllPauses':
        return {};

      default:
        throw new Error(`Unknown Debugger command: ${command}`);
    }
  }

  /**
   * Handle Runtime domain methods
   */
  private async handleRuntimeMethod(debugger: ElideDebugger, command: string, params: any): Promise<any> {
    switch (command) {
      case 'enable':
        return {};

      case 'evaluate':
        const result = await debugger.evaluate(params.expression);
        return { result };

      case 'getProperties':
        const properties = await debugger.getProperties(params.objectId);
        return { result: properties };

      case 'callFunctionOn':
        return { result: { type: 'undefined' } };

      default:
        throw new Error(`Unknown Runtime command: ${command}`);
    }
  }

  /**
   * Handle Profiler domain methods
   */
  private async handleProfilerMethod(debugger: ElideDebugger, command: string, params: any): Promise<any> {
    switch (command) {
      case 'enable':
        return {};

      case 'disable':
        return {};

      case 'start':
        console.log('[Profiler] Starting profile');
        return {};

      case 'stop':
        console.log('[Profiler] Stopping profile');
        return {
          profile: {
            nodes: [],
            startTime: 0,
            endTime: Date.now()
          }
        };

      default:
        throw new Error(`Unknown Profiler command: ${command}`);
    }
  }

  /**
   * Send event to frontend
   */
  private sendEvent(sessionId: string, method: string, params: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const event = {
      method,
      params
    };

    this.emit('event', { sessionId, event });
    console.log(`[DevTools] Event: ${method}`, params);
  }

  /**
   * Get session info
   */
  getSession(sessionId: string): DevToolsSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getSessions(): DevToolsSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Close session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.connected = false;
      this.sessions.delete(sessionId);
      console.log(`[DevTools] Session closed: ${sessionId}`);
    }
  }

  /**
   * Get server URL
   */
  getUrl(): string {
    return `ws://${this.host}:${this.port}`;
  }

  /**
   * Get DevTools frontend URL
   */
  getDevToolsUrl(sessionId: string): string {
    return `devtools://devtools/bundled/inspector.html?ws=${this.host}:${this.port}/${sessionId}`;
  }
}

export default DevToolsServer;
