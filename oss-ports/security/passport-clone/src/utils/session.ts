/**
 * @elide/passport - Session Utilities
 * Helper functions for session management
 */

import { Request, User, DoneCallback } from '../types';

/**
 * Session store interface
 */
export interface SessionStore {
  get(sid: string, callback: (err: any, session?: any) => void): void;
  set(sid: string, session: any, callback: (err?: any) => void): void;
  destroy(sid: string, callback: (err?: any) => void): void;
  touch?(sid: string, session: any, callback: (err?: any) => void): void;
}

/**
 * In-memory session store (for development only)
 */
export class MemoryStore implements SessionStore {
  private sessions: Map<string, any> = new Map();

  get(sid: string, callback: (err: any, session?: any) => void): void {
    const session = this.sessions.get(sid);
    callback(null, session);
  }

  set(sid: string, session: any, callback: (err?: any) => void): void {
    this.sessions.set(sid, session);
    callback();
  }

  destroy(sid: string, callback: (err?: any) => void): void {
    this.sessions.delete(sid);
    callback();
  }

  touch(sid: string, session: any, callback: (err?: any) => void): void {
    // Update session timestamp
    if (this.sessions.has(sid)) {
      session.lastAccess = Date.now();
      this.sessions.set(sid, session);
    }
    callback();
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * Get number of sessions
   */
  length(): number {
    return this.sessions.size;
  }
}

/**
 * Session manager class
 */
export class SessionManager {
  private store: SessionStore;

  constructor(store?: SessionStore) {
    this.store = store || new MemoryStore();
  }

  /**
   * Create a new session
   */
  createSession(req: Request, user: User, callback: DoneCallback): void {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      user: user,
      createdAt: Date.now(),
      lastAccess: Date.now()
    };

    this.store.set(sessionId, session, (err) => {
      if (err) return callback(err);

      if (req.session) {
        req.session.id = sessionId;
      }

      callback(null);
    });
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string, callback: (err: any, session?: any) => void): void {
    this.store.get(sessionId, callback);
  }

  /**
   * Update session
   */
  updateSession(sessionId: string, data: any, callback: DoneCallback): void {
    this.store.get(sessionId, (err, session) => {
      if (err) return callback(err);
      if (!session) return callback(new Error('Session not found'));

      const updatedSession = {
        ...session,
        ...data,
        lastAccess: Date.now()
      };

      this.store.set(sessionId, updatedSession, callback);
    });
  }

  /**
   * Destroy session
   */
  destroySession(sessionId: string, callback: DoneCallback): void {
    this.store.destroy(sessionId, callback);
  }

  /**
   * Touch session (update last access time)
   */
  touchSession(sessionId: string, callback: DoneCallback): void {
    if (this.store.touch) {
      this.store.get(sessionId, (err, session) => {
        if (err) return callback(err);
        if (!session) return callback(null);

        this.store.touch!(sessionId, session, callback);
      });
    } else {
      callback(null);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }
}

/**
 * Create session regeneration function
 */
export function regenerateSession(req: Request, callback: DoneCallback): void {
  if (!req.session) {
    return callback(new Error('Session not available'));
  }

  const oldSessionId = req.session.id;
  const sessionManager = new SessionManager();

  // Create new session with existing data
  sessionManager.createSession(req, req.user!, (err) => {
    if (err) return callback(err);

    // Destroy old session
    if (oldSessionId) {
      sessionManager.destroySession(oldSessionId, callback);
    } else {
      callback(null);
    }
  });
}

/**
 * Session middleware configuration
 */
export interface SessionConfig {
  secret: string;
  resave?: boolean;
  saveUninitialized?: boolean;
  cookie?: {
    secure?: boolean;
    httpOnly?: boolean;
    maxAge?: number;
    domain?: string;
    path?: string;
    sameSite?: 'strict' | 'lax' | 'none';
  };
  store?: SessionStore;
  name?: string;
  rolling?: boolean;
}

/**
 * Create session configuration with defaults
 */
export function createSessionConfig(config: Partial<SessionConfig>): SessionConfig {
  return {
    secret: config.secret || 'keyboard cat',
    resave: config.resave !== false,
    saveUninitialized: config.saveUninitialized !== false,
    cookie: {
      secure: config.cookie?.secure || false,
      httpOnly: config.cookie?.httpOnly !== false,
      maxAge: config.cookie?.maxAge || 24 * 60 * 60 * 1000, // 24 hours
      path: config.cookie?.path || '/',
      sameSite: config.cookie?.sameSite || 'lax',
      ...config.cookie
    },
    store: config.store,
    name: config.name || 'connect.sid',
    rolling: config.rolling || false
  };
}
