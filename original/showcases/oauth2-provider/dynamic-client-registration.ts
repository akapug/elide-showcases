/**
 * Dynamic Client Registration
 *
 * RFC 7591 - OAuth 2.0 Dynamic Client Registration Protocol
 * Allows clients to register dynamically without manual intervention.
 *
 * @module dynamic-client-registration
 */

export interface ClientRegistrationRequest {
  redirect_uris: string[];
  token_endpoint_auth_method?: string;
  grant_types?: string[];
  response_types?: string[];
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  scope?: string;
  contacts?: string[];
  tos_uri?: string;
  policy_uri?: string;
  jwks_uri?: string;
  jwks?: any;
  software_id?: string;
  software_version?: string;
}

export interface ClientRegistrationResponse {
  client_id: string;
  client_secret?: string;
  client_id_issued_at: number;
  client_secret_expires_at?: number;
  redirect_uris: string[];
  token_endpoint_auth_method: string;
  grant_types: string[];
  response_types: string[];
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  scope?: string;
  contacts?: string[];
  tos_uri?: string;
  policy_uri?: string;
  registration_access_token?: string;
  registration_client_uri?: string;
}

export interface Client {
  id: string;
  secret?: string;
  name: string;
  redirectUris: string[];
  allowedScopes: string[];
  allowedGrants: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: string;
  clientUri?: string;
  logoUri?: string;
  contacts?: string[];
  tosUri?: string;
  policyUri?: string;
  trusted: boolean;
  createdAt: number;
  expiresAt?: number;
  registrationAccessToken?: string;
}

/**
 * Dynamic Client Registration Manager
 */
export class DynamicClientRegistration {
  private clients: Map<string, Client> = new Map();
  private registrationTokens: Map<string, string> = new Map(); // token -> clientId
  private defaultScopes: string[] = ['openid', 'profile', 'email'];
  private allowedGrantTypes: string[] = [
    'authorization_code',
    'implicit',
    'refresh_token',
    'client_credentials'
  ];
  private allowedResponseTypes: string[] = ['code', 'token', 'id_token'];

  /**
   * Register new client
   */
  registerClient(request: ClientRegistrationRequest): ClientRegistrationResponse | { error: string } {
    // Validate request
    const validation = this.validateRegistrationRequest(request);
    if (!validation.valid) {
      return { error: validation.error! };
    }

    // Generate client credentials
    const clientId = this.generateClientId();
    const clientSecret = this.generateClientSecret();
    const registrationAccessToken = this.generateRegistrationToken();

    // Determine authentication method
    const authMethod = request.token_endpoint_auth_method || 'client_secret_basic';

    // Determine grant types
    let grantTypes = request.grant_types || ['authorization_code'];
    grantTypes = grantTypes.filter(gt => this.allowedGrantTypes.includes(gt));

    // Determine response types
    let responseTypes = request.response_types || ['code'];
    responseTypes = responseTypes.filter(rt => this.allowedResponseTypes.includes(rt));

    // Parse scopes
    const scopes = request.scope
      ? request.scope.split(' ').filter(s => s)
      : this.defaultScopes;

    // Create client
    const client: Client = {
      id: clientId,
      secret: authMethod !== 'none' ? clientSecret : undefined,
      name: request.client_name || `Client ${clientId}`,
      redirectUris: request.redirect_uris,
      allowedScopes: scopes,
      allowedGrants: grantTypes,
      responseTypes: responseTypes,
      tokenEndpointAuthMethod: authMethod,
      clientUri: request.client_uri,
      logoUri: request.logo_uri,
      contacts: request.contacts,
      tosUri: request.tos_uri,
      policyUri: request.policy_uri,
      trusted: false,
      createdAt: Math.floor(Date.now() / 1000),
      registrationAccessToken
    };

    // Store client
    this.clients.set(clientId, client);
    this.registrationTokens.set(registrationAccessToken, clientId);

    // Build response
    const response: ClientRegistrationResponse = {
      client_id: clientId,
      client_id_issued_at: client.createdAt,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: authMethod,
      grant_types: grantTypes,
      response_types: responseTypes,
      registration_access_token: registrationAccessToken,
      registration_client_uri: `http://localhost:3000/oauth/register/${clientId}`
    };

    // Add client secret if applicable
    if (client.secret) {
      response.client_secret = client.secret;
      response.client_secret_expires_at = 0; // 0 means never expires
    }

    // Add optional fields
    if (client.name) response.client_name = client.name;
    if (client.clientUri) response.client_uri = client.clientUri;
    if (client.logoUri) response.logo_uri = client.logoUri;
    if (client.contacts) response.contacts = client.contacts;
    if (client.tosUri) response.tos_uri = client.tosUri;
    if (client.policyUri) response.policy_uri = client.policyUri;
    if (scopes.length > 0) response.scope = scopes.join(' ');

    return response;
  }

  /**
   * Read client configuration
   */
  readClient(clientId: string, accessToken: string): ClientRegistrationResponse | { error: string } {
    const client = this.clients.get(clientId);
    if (!client) {
      return { error: 'invalid_client_id' };
    }

    // Verify registration access token
    if (client.registrationAccessToken !== accessToken) {
      return { error: 'invalid_token' };
    }

    return this.clientToResponse(client);
  }

  /**
   * Update client configuration
   */
  updateClient(
    clientId: string,
    accessToken: string,
    request: ClientRegistrationRequest
  ): ClientRegistrationResponse | { error: string } {
    const client = this.clients.get(clientId);
    if (!client) {
      return { error: 'invalid_client_id' };
    }

    // Verify registration access token
    if (client.registrationAccessToken !== accessToken) {
      return { error: 'invalid_token' };
    }

    // Validate update request
    const validation = this.validateRegistrationRequest(request);
    if (!validation.valid) {
      return { error: validation.error! };
    }

    // Update client fields
    if (request.redirect_uris) {
      client.redirectUris = request.redirect_uris;
    }

    if (request.client_name) {
      client.name = request.client_name;
    }

    if (request.grant_types) {
      client.allowedGrants = request.grant_types.filter(gt =>
        this.allowedGrantTypes.includes(gt)
      );
    }

    if (request.response_types) {
      client.responseTypes = request.response_types.filter(rt =>
        this.allowedResponseTypes.includes(rt)
      );
    }

    if (request.scope) {
      client.allowedScopes = request.scope.split(' ').filter(s => s);
    }

    // Update optional fields
    client.clientUri = request.client_uri;
    client.logoUri = request.logo_uri;
    client.contacts = request.contacts;
    client.tosUri = request.tos_uri;
    client.policyUri = request.policy_uri;

    return this.clientToResponse(client);
  }

  /**
   * Delete client
   */
  deleteClient(clientId: string, accessToken: string): { success: boolean; error?: string } {
    const client = this.clients.get(clientId);
    if (!client) {
      return { success: false, error: 'invalid_client_id' };
    }

    // Verify registration access token
    if (client.registrationAccessToken !== accessToken) {
      return { success: false, error: 'invalid_token' };
    }

    // Delete client and token
    this.clients.delete(clientId);
    if (client.registrationAccessToken) {
      this.registrationTokens.delete(client.registrationAccessToken);
    }

    return { success: true };
  }

  /**
   * Validate registration request
   */
  private validateRegistrationRequest(
    request: ClientRegistrationRequest
  ): { valid: boolean; error?: string } {
    // Redirect URIs are required
    if (!request.redirect_uris || request.redirect_uris.length === 0) {
      return { valid: false, error: 'invalid_redirect_uri' };
    }

    // Validate each redirect URI
    for (const uri of request.redirect_uris) {
      if (!this.isValidRedirectUri(uri)) {
        return { valid: false, error: 'invalid_redirect_uri' };
      }
    }

    // Validate grant types
    if (request.grant_types) {
      for (const grantType of request.grant_types) {
        if (!this.allowedGrantTypes.includes(grantType)) {
          return { valid: false, error: `unsupported_grant_type: ${grantType}` };
        }
      }
    }

    // Validate response types
    if (request.response_types) {
      for (const responseType of request.response_types) {
        if (!this.allowedResponseTypes.includes(responseType)) {
          return { valid: false, error: `unsupported_response_type: ${responseType}` };
        }
      }
    }

    // Validate URIs
    if (request.client_uri && !this.isValidUri(request.client_uri)) {
      return { valid: false, error: 'invalid_client_metadata: client_uri' };
    }

    if (request.logo_uri && !this.isValidUri(request.logo_uri)) {
      return { valid: false, error: 'invalid_client_metadata: logo_uri' };
    }

    if (request.tos_uri && !this.isValidUri(request.tos_uri)) {
      return { valid: false, error: 'invalid_client_metadata: tos_uri' };
    }

    if (request.policy_uri && !this.isValidUri(request.policy_uri)) {
      return { valid: false, error: 'invalid_client_metadata: policy_uri' };
    }

    // Validate contacts
    if (request.contacts) {
      for (const contact of request.contacts) {
        if (!this.isValidEmail(contact)) {
          return { valid: false, error: 'invalid_client_metadata: contacts' };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Validate redirect URI
   */
  private isValidRedirectUri(uri: string): boolean {
    try {
      const url = new URL(uri);

      // Must use HTTPS in production (allow HTTP for localhost in development)
      if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
        return false;
      }

      // Reject fragment identifiers
      if (url.hash) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate URI
   */
  private isValidUri(uri: string): boolean {
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convert client to response format
   */
  private clientToResponse(client: Client): ClientRegistrationResponse {
    const response: ClientRegistrationResponse = {
      client_id: client.id,
      client_id_issued_at: client.createdAt,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: client.tokenEndpointAuthMethod,
      grant_types: client.allowedGrants,
      response_types: client.responseTypes,
      registration_client_uri: `http://localhost:3000/oauth/register/${client.id}`
    };

    if (client.secret) {
      response.client_secret = client.secret;
      response.client_secret_expires_at = client.expiresAt || 0;
    }

    if (client.name) response.client_name = client.name;
    if (client.clientUri) response.client_uri = client.clientUri;
    if (client.logoUri) response.logo_uri = client.logoUri;
    if (client.contacts) response.contacts = client.contacts;
    if (client.tosUri) response.tos_uri = client.tosUri;
    if (client.policyUri) response.policy_uri = client.policyUri;
    if (client.allowedScopes.length > 0) {
      response.scope = client.allowedScopes.join(' ');
    }
    if (client.registrationAccessToken) {
      response.registration_access_token = client.registrationAccessToken;
    }

    return response;
  }

  /**
   * Generate client ID
   */
  private generateClientId(): string {
    return 'client_' + this.randomString(24);
  }

  /**
   * Generate client secret
   */
  private generateClientSecret(): string {
    return this.randomString(48);
  }

  /**
   * Generate registration access token
   */
  private generateRegistrationToken(): string {
    return 'reg_' + this.randomString(32);
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
   * Get client by ID
   */
  getClient(clientId: string): Client | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all clients
   */
  getAllClients(): Client[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get statistics
   */
  getStatistics(): any {
    const clients = Array.from(this.clients.values());

    return {
      total: clients.length,
      trusted: clients.filter(c => c.trusted).length,
      untrusted: clients.filter(c => !c.trusted).length,
      byAuthMethod: this.groupBy(clients, c => c.tokenEndpointAuthMethod),
      byGrantType: this.countGrantTypes(clients)
    };
  }

  private groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const item of array) {
      const key = keyFn(item);
      result[key] = (result[key] || 0) + 1;
    }
    return result;
  }

  private countGrantTypes(clients: Client[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const client of clients) {
      for (const grantType of client.allowedGrants) {
        result[grantType] = (result[grantType] || 0) + 1;
      }
    }
    return result;
  }
}

/**
 * Create dynamic client registration instance
 */
export function createDynamicClientRegistration(): DynamicClientRegistration {
  return new DynamicClientRegistration();
}
