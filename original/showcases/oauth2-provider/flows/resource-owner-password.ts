/**
 * Resource Owner Password Credentials Flow
 *
 * RFC 6749 Section 4.3 - Resource Owner Password Credentials Grant
 * Note: This flow should only be used when there is high trust between user and client.
 * Prefer Authorization Code flow for most use cases.
 *
 * @module flows/resource-owner-password
 */

export interface PasswordFlowParams {
  username: string;
  password: string;
  clientId: string;
  clientSecret?: string;
  scope?: string;
}

export interface PasswordFlowResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}

/**
 * Resource Owner Password Credentials Flow Handler
 *
 * WARNING: This flow is not recommended for most use cases.
 * Use only when:
 * - The client is highly trusted (e.g., first-party mobile app)
 * - Other flows are not viable
 * - Migrating from legacy authentication to OAuth2
 */
export class ResourceOwnerPasswordFlow {
  private maxFailedAttempts: number = 5;
  private lockoutDuration: number = 900000; // 15 minutes
  private failedAttempts: Map<string, { count: number; lockoutUntil?: number }> = new Map();

  /**
   * Process password grant request
   */
  async processGrant(
    params: PasswordFlowParams,
    authenticator: (username: string, password: string) => Promise<any>,
    tokenGenerator: (userId: string, clientId: string, scopes: string[]) => any
  ): Promise<any> {
    // Validate parameters
    const validation = this.validateParams(params);
    if (!validation.valid) {
      return {
        error: 'invalid_request',
        error_description: validation.error
      };
    }

    // Check rate limiting / account lockout
    const lockoutCheck = this.checkLockout(params.username);
    if (!lockoutCheck.allowed) {
      return {
        error: 'invalid_grant',
        error_description: lockoutCheck.error
      };
    }

    try {
      // Authenticate user
      const user = await authenticator(params.username, params.password);

      if (!user) {
        // Record failed attempt
        this.recordFailedAttempt(params.username);

        return {
          error: 'invalid_grant',
          error_description: 'Invalid username or password'
        };
      }

      // Clear failed attempts on successful login
      this.clearFailedAttempts(params.username);

      // Parse scopes
      const scopes = params.scope ? params.scope.split(' ').filter(s => s) : [];

      // Generate tokens
      return tokenGenerator(user.id, params.clientId, scopes);
    } catch (error) {
      return {
        error: 'server_error',
        error_description: 'Authentication failed'
      };
    }
  }

  /**
   * Validate password grant parameters
   */
  validateParams(params: PasswordFlowParams): { valid: boolean; error?: string } {
    if (!params.username) {
      return { valid: false, error: 'username is required' };
    }

    if (!params.password) {
      return { valid: false, error: 'password is required' };
    }

    if (!params.clientId) {
      return { valid: false, error: 'client_id is required' };
    }

    // Validate username format (email or username)
    if (!this.isValidUsername(params.username)) {
      return { valid: false, error: 'invalid username format' };
    }

    // Validate password strength
    if (!this.isValidPassword(params.password)) {
      return { valid: false, error: 'password does not meet requirements' };
    }

    return { valid: true };
  }

  /**
   * Check if account is locked out
   */
  private checkLockout(username: string): { allowed: boolean; error?: string } {
    const attempts = this.failedAttempts.get(username);

    if (!attempts) {
      return { allowed: true };
    }

    // Check if lockout is active
    if (attempts.lockoutUntil && attempts.lockoutUntil > Date.now()) {
      const remainingMinutes = Math.ceil((attempts.lockoutUntil - Date.now()) / 60000);
      return {
        allowed: false,
        error: `Account is locked. Try again in ${remainingMinutes} minutes.`
      };
    }

    // Check if max attempts reached
    if (attempts.count >= this.maxFailedAttempts) {
      // Activate lockout
      attempts.lockoutUntil = Date.now() + this.lockoutDuration;
      return {
        allowed: false,
        error: `Too many failed attempts. Account locked for 15 minutes.`
      };
    }

    return { allowed: true };
  }

  /**
   * Record failed login attempt
   */
  private recordFailedAttempt(username: string): void {
    const attempts = this.failedAttempts.get(username) || { count: 0 };
    attempts.count++;
    this.failedAttempts.set(username, attempts);
  }

  /**
   * Clear failed attempts
   */
  private clearFailedAttempts(username: string): void {
    this.failedAttempts.delete(username);
  }

  /**
   * Validate username format
   */
  private isValidUsername(username: string): boolean {
    // Allow email or username format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;

    return emailRegex.test(username) || usernameRegex.test(username);
  }

  /**
   * Validate password (basic checks)
   */
  private isValidPassword(password: string): boolean {
    // Minimum length check
    if (password.length < 8) {
      return false;
    }

    // Maximum length check (prevent DoS)
    if (password.length > 128) {
      return false;
    }

    return true;
  }

  /**
   * Get security recommendations
   */
  getSecurityRecommendations(): string[] {
    return [
      'Only use this flow when absolutely necessary',
      'Prefer Authorization Code flow with PKCE',
      'Never store user passwords - hash with bcrypt or Argon2',
      'Implement rate limiting and account lockout',
      'Use strong password requirements',
      'Implement multi-factor authentication (MFA)',
      'Log all authentication attempts',
      'Use HTTPS for all communications',
      'Rotate tokens regularly',
      'Monitor for suspicious login patterns',
      'Consider migrating to OAuth2 Authorization Code flow',
      'Educate users about phishing risks'
    ];
  }

  /**
   * Get migration guide
   */
  getMigrationGuide(): string {
    return `
      Migration from Password Flow to Authorization Code Flow

      1. Update mobile apps to use Authorization Code flow with PKCE
      2. Implement in-app browser (ASWebAuthenticationSession, Chrome Custom Tabs)
      3. Update web applications to redirect-based flow
      4. Deprecate password endpoints gradually
      5. Notify users about improved security

      Benefits:
      - Users never share passwords with third-party apps
      - Support for social login providers
      - Better security with PKCE
      - Support for MFA without custom implementation
      - Reduced liability for credential handling
    `.trim();
  }

  /**
   * Generate security warning
   */
  getSecurityWarning(): string {
    return `
      ⚠️ SECURITY WARNING: Resource Owner Password Flow

      This flow requires users to share their credentials with clients:

      Risks:
      1. Credentials exposed to potentially untrusted clients
      2. No support for MFA without custom implementation
      3. Difficult to revoke access
      4. Passwords may be stored by client
      5. Phishing risk increases

      RECOMMENDATION: Use Authorization Code flow with PKCE instead.

      Only use this flow for:
      - Highly trusted first-party clients
      - Legacy system migration
      - Cases where redirect-based flows are not possible

      For more information, see RFC 6749 Section 10.7
    `.trim();
  }

  /**
   * Clean up expired lockouts
   */
  cleanupExpiredLockouts(): number {
    const now = Date.now();
    let count = 0;

    for (const [username, attempts] of this.failedAttempts.entries()) {
      if (attempts.lockoutUntil && attempts.lockoutUntil < now) {
        this.failedAttempts.delete(username);
        count++;
      }
    }

    return count;
  }

  /**
   * Get failed attempts statistics
   */
  getStatistics(): any {
    return {
      totalAccounts: this.failedAttempts.size,
      lockedAccounts: Array.from(this.failedAttempts.values()).filter(
        a => a.lockoutUntil && a.lockoutUntil > Date.now()
      ).length,
      attemptsInProgress: Array.from(this.failedAttempts.values()).filter(
        a => !a.lockoutUntil && a.count > 0
      ).length
    };
  }
}

/**
 * Create resource owner password flow instance
 */
export function createResourceOwnerPasswordFlow(): ResourceOwnerPasswordFlow {
  return new ResourceOwnerPasswordFlow();
}
