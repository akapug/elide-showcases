/**
 * OpenID Connect (OIDC) Handler
 *
 * Implements OpenID Connect 1.0 specification on top of OAuth2.
 * Provides identity layer with ID tokens and UserInfo endpoint.
 *
 * @module oidc-handler
 */

export interface OIDCClaims {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  nickname?: string;
  preferred_username?: string;
  profile?: string;
  picture?: string;
  website?: string;
  email?: string;
  email_verified?: boolean;
  gender?: string;
  birthdate?: string;
  zoneinfo?: string;
  locale?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  address?: Address;
  updated_at?: number;
}

export interface Address {
  formatted?: string;
  street_address?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

export interface IDTokenPayload extends OIDCClaims {
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  auth_time?: number;
  nonce?: string;
  acr?: string;
  amr?: string[];
  azp?: string;
  at_hash?: string;
  c_hash?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified?: boolean;
  address?: Address;
  locale?: string;
  zoneinfo?: string;
  updatedAt?: number;
}

/**
 * OpenID Connect Handler
 */
export class OIDCHandler {
  private issuer: string;

  constructor(issuer: string = 'http://localhost:3000') {
    this.issuer = issuer;
  }

  /**
   * Generate ID Token
   */
  generateIdToken(
    user: User,
    clientId: string,
    scopes: string[],
    nonce?: string,
    authTime?: number
  ): IDTokenPayload {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour

    const payload: IDTokenPayload = {
      iss: this.issuer,
      sub: user.id,
      aud: clientId,
      exp: now + expiresIn,
      iat: now,
      auth_time: authTime || now
    };

    // Add nonce for replay protection
    if (nonce) {
      payload.nonce = nonce;
    }

    // Add claims based on scopes
    if (scopes.includes('profile')) {
      payload.name = user.name;
      payload.given_name = user.givenName;
      payload.family_name = user.familyName;
      payload.picture = user.picture;
      payload.locale = user.locale;
      payload.zoneinfo = user.zoneinfo;
      payload.updated_at = user.updatedAt;
    }

    if (scopes.includes('email')) {
      payload.email = user.email;
      payload.email_verified = user.emailVerified;
    }

    if (scopes.includes('phone')) {
      payload.phone_number = user.phoneNumber;
      payload.phone_number_verified = user.phoneVerified;
    }

    if (scopes.includes('address')) {
      payload.address = user.address;
    }

    return payload;
  }

  /**
   * Get UserInfo claims
   */
  getUserInfo(user: User, scopes: string[]): OIDCClaims {
    const claims: OIDCClaims = {
      sub: user.id
    };

    // Add claims based on scopes
    if (scopes.includes('profile')) {
      claims.name = user.name;
      claims.given_name = user.givenName;
      claims.family_name = user.familyName;
      claims.picture = user.picture;
      claims.locale = user.locale;
      claims.zoneinfo = user.zoneinfo;
      claims.updated_at = user.updatedAt;
    }

    if (scopes.includes('email')) {
      claims.email = user.email;
      claims.email_verified = user.emailVerified;
    }

    if (scopes.includes('phone')) {
      claims.phone_number = user.phoneNumber;
      claims.phone_number_verified = user.phoneVerified;
    }

    if (scopes.includes('address')) {
      claims.address = user.address;
    }

    return claims;
  }

  /**
   * Get OpenID Configuration (Discovery Document)
   */
  getDiscoveryDocument(): any {
    return {
      issuer: this.issuer,
      authorization_endpoint: `${this.issuer}/oauth/authorize`,
      token_endpoint: `${this.issuer}/oauth/token`,
      userinfo_endpoint: `${this.issuer}/oauth/userinfo`,
      jwks_uri: `${this.issuer}/.well-known/jwks.json`,
      registration_endpoint: `${this.issuer}/oauth/register`,
      revocation_endpoint: `${this.issuer}/oauth/revoke`,
      introspection_endpoint: `${this.issuer}/oauth/introspect`,

      // Response types supported
      response_types_supported: [
        'code',
        'token',
        'id_token',
        'code token',
        'code id_token',
        'token id_token',
        'code token id_token'
      ],

      // Response modes supported
      response_modes_supported: [
        'query',
        'fragment',
        'form_post'
      ],

      // Grant types supported
      grant_types_supported: [
        'authorization_code',
        'implicit',
        'refresh_token',
        'client_credentials',
        'password'
      ],

      // Subject types
      subject_types_supported: ['public'],

      // ID token signing algorithms
      id_token_signing_alg_values_supported: ['RS256', 'HS256'],

      // Scopes supported
      scopes_supported: [
        'openid',
        'profile',
        'email',
        'address',
        'phone',
        'offline_access'
      ],

      // Token endpoint auth methods
      token_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_post',
        'client_secret_jwt',
        'private_key_jwt'
      ],

      // Claims supported
      claims_supported: [
        'sub',
        'name',
        'given_name',
        'family_name',
        'middle_name',
        'nickname',
        'preferred_username',
        'profile',
        'picture',
        'website',
        'email',
        'email_verified',
        'gender',
        'birthdate',
        'zoneinfo',
        'locale',
        'phone_number',
        'phone_number_verified',
        'address',
        'updated_at'
      ],

      // Code challenge methods
      code_challenge_methods_supported: ['plain', 'S256'],

      // Request parameter supported
      request_parameter_supported: false,
      request_uri_parameter_supported: false,

      // Claims parameter supported
      claims_parameter_supported: true,

      // Service documentation
      service_documentation: `${this.issuer}/docs`,

      // UI locales supported
      ui_locales_supported: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE'],

      // Claim types supported
      claim_types_supported: ['normal']
    };
  }

  /**
   * Validate ID Token
   */
  validateIdToken(
    token: IDTokenPayload,
    clientId: string,
    nonce?: string
  ): { valid: boolean; error?: string } {
    // Check issuer
    if (token.iss !== this.issuer) {
      return { valid: false, error: 'Invalid issuer' };
    }

    // Check audience
    if (Array.isArray(token.aud)) {
      if (!token.aud.includes(clientId)) {
        return { valid: false, error: 'Invalid audience' };
      }
    } else if (token.aud !== clientId) {
      return { valid: false, error: 'Invalid audience' };
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (token.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    // Check issued at
    if (token.iat > now + 60) {
      return { valid: false, error: 'Token issued in the future' };
    }

    // Check nonce if provided
    if (nonce && token.nonce !== nonce) {
      return { valid: false, error: 'Invalid nonce' };
    }

    return { valid: true };
  }

  /**
   * Generate access token hash (at_hash) for ID token
   */
  generateAtHash(accessToken: string): string {
    // Hash the access token and take left-most half
    const hash = this.sha256(accessToken);
    return hash.substring(0, hash.length / 2);
  }

  /**
   * Generate authorization code hash (c_hash) for ID token
   */
  generateCHash(code: string): string {
    // Hash the code and take left-most half
    const hash = this.sha256(code);
    return hash.substring(0, hash.length / 2);
  }

  /**
   * Check if scope is valid OIDC scope
   */
  isValidScope(scope: string): boolean {
    const validScopes = [
      'openid',
      'profile',
      'email',
      'address',
      'phone',
      'offline_access'
    ];
    return validScopes.includes(scope);
  }

  /**
   * Check if request requires OIDC (has openid scope)
   */
  isOIDCRequest(scopes: string[]): boolean {
    return scopes.includes('openid');
  }

  /**
   * Simple SHA-256 (use proper crypto in production)
   */
  private sha256(str: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).padStart(32, '0');
  }
}

/**
 * Create OIDC handler instance
 */
export function createOIDCHandler(issuer?: string): OIDCHandler {
  return new OIDCHandler(issuer);
}
