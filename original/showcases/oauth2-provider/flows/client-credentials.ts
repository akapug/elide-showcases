/**
 * Client Credentials Flow Implementation
 *
 * RFC 6749 compliant client credentials grant flow.
 * Used for machine-to-machine authentication.
 *
 * @module flows/client-credentials
 */

export interface ClientCredentialsParams {
  clientId: string;
  clientSecret: string;
  scope?: string;
}

export interface ClientCredentialsResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
}

export interface Client {
  id: string;
  secret: string;
  name: string;
  allowedScopes: string[];
  allowedGrants: string[];
  trusted: boolean;
}

/**
 * Client Credentials Flow Handler
 */
export class ClientCredentialsFlow {
  /**
   * Validate client credentials
   */
  validateClient(
    clientId: string,
    clientSecret: string,
    clients: Map<string, Client>
  ): { valid: boolean; client?: Client; error?: string } {
    const client = clients.get(clientId);

    if (!client) {
      return { valid: false, error: 'invalid_client' };
    }

    if (client.secret !== clientSecret) {
      return { valid: false, error: 'invalid_client' };
    }

    // Check if client credentials grant is allowed
    if (!client.allowedGrants.includes('client_credentials')) {
      return { valid: false, error: 'unauthorized_client' };
    }

    return { valid: true, client };
  }

  /**
   * Validate requested scopes
   */
  validateScopes(
    requestedScopes: string[],
    allowedScopes: string[]
  ): { valid: boolean; error?: string } {
    const invalidScopes = requestedScopes.filter(
      scope => !allowedScopes.includes(scope)
    );

    if (invalidScopes.length > 0) {
      return {
        valid: false,
        error: `invalid_scope: ${invalidScopes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Process client credentials grant
   */
  async processGrant(
    params: ClientCredentialsParams,
    clients: Map<string, Client>,
    tokenGenerator: (client: Client, scopes: string[]) => any
  ): Promise<any> {
    // Validate client
    const clientValidation = this.validateClient(
      params.clientId,
      params.clientSecret,
      clients
    );

    if (!clientValidation.valid) {
      return {
        error: clientValidation.error,
        error_description: 'Client authentication failed'
      };
    }

    const client = clientValidation.client!;

    // Parse and validate scopes
    const requestedScopes = params.scope
      ? params.scope.split(' ').filter(s => s)
      : [];

    const scopeValidation = this.validateScopes(
      requestedScopes,
      client.allowedScopes
    );

    if (!scopeValidation.valid) {
      return {
        error: 'invalid_scope',
        error_description: scopeValidation.error
      };
    }

    // Generate token
    return tokenGenerator(client, requestedScopes);
  }

  /**
   * Extract client credentials from Authorization header
   */
  extractClientCredentials(authHeader: string | null): {
    clientId?: string;
    clientSecret?: string;
  } {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return {};
    }

    try {
      const encoded = authHeader.substring(6);
      const decoded = atob(encoded);
      const [clientId, clientSecret] = decoded.split(':');
      return { clientId, clientSecret };
    } catch {
      return {};
    }
  }

  /**
   * Validate client authentication method
   */
  validateAuthMethod(
    method: 'client_secret_basic' | 'client_secret_post' | 'none',
    client: Client
  ): boolean {
    // For client credentials, only basic and post are allowed
    if (method === 'none') {
      return false;
    }

    // Trusted clients can use any method
    if (client.trusted) {
      return true;
    }

    // Non-trusted clients should use client_secret_basic
    return method === 'client_secret_basic';
  }

  /**
   * Rate limit check for client credentials
   */
  checkRateLimit(clientId: string, rateLimits: Map<string, number>): boolean {
    const now = Date.now();
    const lastRequest = rateLimits.get(clientId) || 0;
    const minInterval = 1000; // 1 second between requests

    if (now - lastRequest < minInterval) {
      return false;
    }

    rateLimits.set(clientId, now);
    return true;
  }
}

/**
 * Create client credentials flow instance
 */
export function createClientCredentialsFlow(): ClientCredentialsFlow {
  return new ClientCredentialsFlow();
}
