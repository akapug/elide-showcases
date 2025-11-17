/**
 * @elide/passport - Anonymous Strategy
 * Anonymous authentication strategy (always succeeds)
 */

import { Strategy } from './strategy';
import { Request } from '../types';

/**
 * Anonymous authentication strategy
 * Always succeeds with an anonymous user
 * Useful for public endpoints with optional authentication
 */
export class AnonymousStrategy extends Strategy {
  constructor() {
    super('anonymous');
  }

  /**
   * Authenticate request (always succeeds)
   * @param req - Request object
   */
  authenticate(req: Request, options: any = {}): void {
    const anonymousUser = {
      id: 'anonymous',
      username: 'anonymous',
      isAnonymous: true
    };

    this.success(anonymousUser);
  }
}

/**
 * Create a new AnonymousStrategy instance
 */
export function createAnonymousStrategy(): AnonymousStrategy {
  return new AnonymousStrategy();
}
