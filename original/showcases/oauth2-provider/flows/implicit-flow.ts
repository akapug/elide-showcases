/**
 * Implicit Flow Implementation
 *
 * RFC 6749 Section 4.2 - Implicit Grant
 * Note: This flow is now considered legacy and less secure than Authorization Code with PKCE.
 * Use Authorization Code flow with PKCE for SPAs instead.
 *
 * @module flows/implicit-flow
 */

export interface ImplicitFlowParams {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
  state?: string;
  nonce?: string;
}

export interface ImplicitFlowResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  state?: string;
  idToken?: string; // For OpenID Connect implicit flow
}

/**
 * Implicit Flow Handler
 *
 * WARNING: The implicit flow is deprecated for security reasons.
 * It should only be used for legacy applications that cannot be updated.
 * New applications should use Authorization Code flow with PKCE.
 */
export class ImplicitFlow {
  private tokenLifetime: number = 3600; // 1 hour (shorter than auth code flow)

  /**
   * Process implicit flow authorization request
   */
  authorize(
    params: ImplicitFlowParams,
    userId: string,
    tokenGenerator: (userId: string, clientId: string, scopes: string[]) => any
  ): { redirectUri: string; error?: string } {
    // Validate response type
    const validResponseTypes = ['token', 'id_token', 'token id_token'];
    if (!validResponseTypes.includes(params.responseType)) {
      return {
        redirectUri: params.redirectUri,
        error: 'unsupported_response_type'
      };
    }

    // Parse scopes
    const scopes = params.scope.split(' ').filter(s => s);

    // Check for openid scope if requesting id_token
    if (params.responseType.includes('id_token') && !scopes.includes('openid')) {
      return {
        redirectUri: params.redirectUri,
        error: 'invalid_request'
      };
    }

    try {
      // Generate tokens based on response type
      const tokens = tokenGenerator(userId, params.clientId, scopes);

      // Build fragment with tokens
      const fragment = this.buildResponseFragment(
        params.responseType,
        tokens,
        params.state,
        scopes
      );

      // Return redirect URI with fragment
      const redirectUrl = new URL(params.redirectUri);
      redirectUrl.hash = fragment;

      return { redirectUri: redirectUrl.toString() };
    } catch (error) {
      return {
        redirectUri: params.redirectUri,
        error: 'server_error'
      };
    }
  }

  /**
   * Build response fragment for implicit flow
   */
  private buildResponseFragment(
    responseType: string,
    tokens: any,
    state?: string,
    scopes?: string[]
  ): string {
    const params = new URLSearchParams();

    // Add access token if requested
    if (responseType.includes('token')) {
      params.set('access_token', tokens.access_token);
      params.set('token_type', 'Bearer');
      params.set('expires_in', this.tokenLifetime.toString());
    }

    // Add ID token if requested
    if (responseType.includes('id_token') && tokens.id_token) {
      params.set('id_token', tokens.id_token);
    }

    // Add scope
    if (scopes && scopes.length > 0) {
      params.set('scope', scopes.join(' '));
    }

    // Add state for CSRF protection
    if (state) {
      params.set('state', state);
    }

    return params.toString();
  }

  /**
   * Validate implicit flow parameters
   */
  validateParams(params: ImplicitFlowParams): { valid: boolean; error?: string } {
    if (!params.clientId) {
      return { valid: false, error: 'invalid_request: client_id required' };
    }

    if (!params.redirectUri) {
      return { valid: false, error: 'invalid_request: redirect_uri required' };
    }

    if (!params.responseType) {
      return { valid: false, error: 'invalid_request: response_type required' };
    }

    if (!params.scope) {
      return { valid: false, error: 'invalid_request: scope required' };
    }

    // State is REQUIRED for implicit flow (CSRF protection)
    if (!params.state) {
      return { valid: false, error: 'invalid_request: state parameter is required for implicit flow' };
    }

    // Nonce is REQUIRED when requesting id_token (replay protection)
    if (params.responseType.includes('id_token') && !params.nonce) {
      return { valid: false, error: 'invalid_request: nonce required when requesting id_token' };
    }

    return { valid: true };
  }

  /**
   * Check if response type is valid for implicit flow
   */
  isValidResponseType(responseType: string): boolean {
    const validTypes = [
      'token',
      'id_token',
      'token id_token',
      'id_token token' // Same as above, different order
    ];
    return validTypes.includes(responseType);
  }

  /**
   * Get security recommendations for implicit flow
   */
  getSecurityRecommendations(): string[] {
    return [
      'The implicit flow is deprecated and should not be used for new applications',
      'Use Authorization Code flow with PKCE instead',
      'If you must use implicit flow, tokens are exposed in browser history and referrer headers',
      'Implicit flow tokens cannot be refreshed - users must re-authenticate',
      'Always use state parameter to prevent CSRF attacks',
      'Always use nonce parameter when requesting ID tokens',
      'Use short-lived access tokens (maximum 1 hour)',
      'Never store tokens in localStorage - use sessionStorage instead',
      'Implement proper Content Security Policy (CSP)',
      'Use HTTPS for all OAuth2 communications'
    ];
  }

  /**
   * Generate deprecation warning
   */
  getDeprecationWarning(): string {
    return `
      ⚠️ SECURITY WARNING: Implicit Flow is Deprecated

      The OAuth 2.0 Implicit flow is deprecated due to security concerns:

      1. Tokens are exposed in the URL fragment
      2. Tokens can leak through browser history and referrer headers
      3. No refresh tokens - poor user experience
      4. Vulnerable to token injection attacks

      RECOMMENDATION: Use Authorization Code flow with PKCE instead.

      For more information, see:
      - OAuth 2.0 Security Best Current Practice
      - RFC 6749 Section 10.3 and 10.16
    `.trim();
  }
}

/**
 * Create implicit flow instance
 */
export function createImplicitFlow(): ImplicitFlow {
  return new ImplicitFlow();
}
