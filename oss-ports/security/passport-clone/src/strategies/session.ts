/**
 * @elide/passport - Session Strategy
 * Session-based authentication strategy
 */

import { Strategy } from './strategy';
import { Request } from '../types';

/**
 * Session authentication strategy
 * Authenticates users based on session data
 */
export class SessionStrategy extends Strategy {
  constructor() {
    super('session');
  }

  /**
   * Authenticate request based on session
   * @param req - Request object
   */
  authenticate(req: Request, options: any = {}): void {
    if (!req.session) {
      return this.fail({ message: 'Session not available' });
    }

    const sessionKey = 'passport';
    const sessionData = req.session[sessionKey];

    if (!sessionData || !sessionData.user) {
      return this.fail({ message: 'No session user' });
    }

    // Deserialize user from session
    const deserializeUser = (req as any)._passport?.instance?.deserializeUser;

    if (!deserializeUser) {
      return this.fail({ message: 'Deserialize user not configured' });
    }

    deserializeUser(sessionData.user, (err: Error | null, user: any) => {
      if (err) {
        return this.error(err);
      }

      if (!user) {
        delete req.session![sessionKey].user;
        return this.fail({ message: 'User not found' });
      }

      this.success(user);
    });
  }
}

/**
 * Create a new SessionStrategy instance
 */
export function createSessionStrategy(): SessionStrategy {
  return new SessionStrategy();
}
