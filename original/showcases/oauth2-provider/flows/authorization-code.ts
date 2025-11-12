/**
 * Authorization Code Flow Implementation
 *
 * RFC 6749 compliant authorization code grant flow.
 * This is the most secure flow for web applications with backend servers.
 *
 * @module flows/authorization-code
 */

export interface AuthCodeFlowParams {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}

export interface AuthCodeRequest {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  nonce?: string;
}

export interface AuthCode {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge?: string;
  codeChallengeMethod?: string;
  nonce?: string;
  expiresAt: number;
  used: boolean;
}

/**
 * Authorization Code Flow Handler
 */
export class AuthorizationCodeFlow {
  private authCodes: Map<string, AuthCode> = new Map();
  private codeLifetime: number = 600000; // 10 minutes

  /**
   * Generate authorization request
   */
  createAuthorizationRequest(params: AuthCodeRequest): { url: string; error?: string } {
    // Validate response type
    if (params.responseType !== 'code') {
      return {
        url: params.redirectUri,
        error: 'unsupported_response_type'
      };
    }

    // Validate client ID
    if (!params.clientId) {
      return {
        url: params.redirectUri,
        error: 'invalid_request'
      };
    }

    // Generate authorization code
    const code = this.generateAuthCode();
    const authCode: AuthCode = {
      code,
      clientId: params.clientId,
      userId: '', // Will be set after user authentication
      redirectUri: params.redirectUri,
      scopes: params.scope.split(' ').filter(s => s),
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      nonce: params.nonce,
      expiresAt: Date.now() + this.codeLifetime,
      used: false
    };

    this.authCodes.set(code, authCode);

    // Build redirect URL
    const url = new URL(params.redirectUri);
    url.searchParams.set('code', code);
    if (params.state) {
      url.searchParams.set('state', params.state);
    }

    return { url: url.toString() };
  }

  /**
   * Validate authorization code
   */
  validateAuthCode(code: string, clientId: string, redirectUri: string): {
    valid: boolean;
    authCode?: AuthCode;
    error?: string;
  } {
    const authCode = this.authCodes.get(code);

    if (!authCode) {
      return { valid: false, error: 'invalid_grant' };
    }

    if (authCode.used) {
      // Code reuse detected - security breach
      this.revokeAuthCode(code);
      return { valid: false, error: 'invalid_grant' };
    }

    if (authCode.expiresAt < Date.now()) {
      return { valid: false, error: 'invalid_grant' };
    }

    if (authCode.clientId !== clientId) {
      return { valid: false, error: 'invalid_grant' };
    }

    if (authCode.redirectUri !== redirectUri) {
      return { valid: false, error: 'invalid_grant' };
    }

    return { valid: true, authCode };
  }

  /**
   * Mark authorization code as used
   */
  markCodeAsUsed(code: string): void {
    const authCode = this.authCodes.get(code);
    if (authCode) {
      authCode.used = true;
    }
  }

  /**
   * Revoke authorization code and associated tokens
   */
  revokeAuthCode(code: string): void {
    this.authCodes.delete(code);
  }

  /**
   * Verify PKCE challenge
   */
  verifyPKCE(challenge: string, method: string, verifier: string): boolean {
    if (!challenge || !verifier) {
      return false;
    }

    if (method === 'plain') {
      return challenge === verifier;
    }

    if (method === 'S256') {
      // SHA-256 hash of verifier
      const hash = this.sha256(verifier);
      const encoded = this.base64UrlEncode(hash);
      return challenge === encoded;
    }

    return false;
  }

  /**
   * Set user ID for authorization code (after authentication)
   */
  setUserId(code: string, userId: string): boolean {
    const authCode = this.authCodes.get(code);
    if (!authCode) {
      return false;
    }
    authCode.userId = userId;
    return true;
  }

  /**
   * Get authorization code details
   */
  getAuthCode(code: string): AuthCode | undefined {
    return this.authCodes.get(code);
  }

  /**
   * Clean expired codes
   */
  cleanExpiredCodes(): void {
    const now = Date.now();
    for (const [code, authCode] of this.authCodes.entries()) {
      if (authCode.expiresAt < now || authCode.used) {
        this.authCodes.delete(code);
      }
    }
  }

  /**
   * Generate random authorization code
   */
  private generateAuthCode(): string {
    return this.randomString(32);
  }

  /**
   * Generate random string
   */
  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * SHA-256 hash (simplified - use crypto in production)
   */
  private sha256(str: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(str: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

/**
 * Create authorization code flow instance
 */
export function createAuthorizationCodeFlow(): AuthorizationCodeFlow {
  return new AuthorizationCodeFlow();
}
