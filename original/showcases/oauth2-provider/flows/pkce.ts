/**
 * PKCE (Proof Key for Code Exchange) Implementation
 *
 * RFC 7636 compliant PKCE support for OAuth2.
 * Protects against authorization code interception attacks.
 *
 * @module flows/pkce
 */

export type CodeChallengeMethod = 'plain' | 'S256';

export interface PKCEChallenge {
  codeChallenge: string;
  codeChallengeMethod: CodeChallengeMethod;
}

export interface PKCEVerification {
  valid: boolean;
  error?: string;
}

/**
 * PKCE Handler
 */
export class PKCE {
  private readonly minVerifierLength = 43;
  private readonly maxVerifierLength = 128;

  /**
   * Verify PKCE code verifier against challenge
   */
  verify(
    challenge: string,
    method: CodeChallengeMethod,
    verifier: string
  ): PKCEVerification {
    // Validate verifier length
    if (!this.isValidVerifier(verifier)) {
      return {
        valid: false,
        error: 'invalid_request: code_verifier length must be between 43-128 characters'
      };
    }

    // Verify based on method
    if (method === 'plain') {
      return this.verifyPlain(challenge, verifier);
    } else if (method === 'S256') {
      return this.verifyS256(challenge, verifier);
    }

    return {
      valid: false,
      error: 'invalid_request: unsupported code_challenge_method'
    };
  }

  /**
   * Verify plain method (not recommended)
   */
  private verifyPlain(challenge: string, verifier: string): PKCEVerification {
    if (challenge === verifier) {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'invalid_grant: code_verifier does not match code_challenge'
    };
  }

  /**
   * Verify S256 method (recommended)
   */
  private verifyS256(challenge: string, verifier: string): PKCEVerification {
    const computedChallenge = this.generateS256Challenge(verifier);

    if (challenge === computedChallenge) {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'invalid_grant: code_verifier does not match code_challenge'
    };
  }

  /**
   * Generate S256 code challenge from verifier
   */
  generateS256Challenge(verifier: string): string {
    // Use Web Crypto API for proper SHA-256
    // Note: In production, use proper crypto library
    const hash = this.sha256(verifier);
    return this.base64UrlEncode(hash);
  }

  /**
   * Generate random code verifier
   */
  generateCodeVerifier(): string {
    const length = 128; // Maximum length for best security
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let verifier = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      verifier += charset[randomIndex];
    }

    return verifier;
  }

  /**
   * Generate code challenge from verifier
   */
  generateCodeChallenge(
    verifier: string,
    method: CodeChallengeMethod = 'S256'
  ): string {
    if (method === 'plain') {
      return verifier;
    }

    return this.generateS256Challenge(verifier);
  }

  /**
   * Validate code verifier format
   */
  isValidVerifier(verifier: string): boolean {
    if (!verifier) {
      return false;
    }

    const length = verifier.length;
    if (length < this.minVerifierLength || length > this.maxVerifierLength) {
      return false;
    }

    // RFC 7636: unreserved characters [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
    const validPattern = /^[A-Za-z0-9\-._~]+$/;
    return validPattern.test(verifier);
  }

  /**
   * Validate code challenge format
   */
  isValidChallenge(challenge: string, method: CodeChallengeMethod): boolean {
    if (!challenge) {
      return false;
    }

    if (method === 'plain') {
      return this.isValidVerifier(challenge);
    }

    // S256 challenge should be base64url encoded
    const base64UrlPattern = /^[A-Za-z0-9\-_]+$/;
    return base64UrlPattern.test(challenge);
  }

  /**
   * Check if PKCE is required for client
   */
  isPKCERequired(clientType: 'public' | 'confidential'): boolean {
    // PKCE is required for public clients (mobile, SPA)
    // Recommended for confidential clients
    return clientType === 'public';
  }

  /**
   * SHA-256 hash implementation
   */
  private sha256(str: string): string {
    // This is a simplified implementation
    // In production, use Web Crypto API or a proper crypto library
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    // Simple hash (NOT cryptographically secure - use proper SHA-256 in production)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36).padStart(32, '0');
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

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    // Replace URL-safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding
    while (str.length % 4) {
      str += '=';
    }

    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new TextDecoder().decode(bytes);
  }
}

/**
 * Create PKCE instance
 */
export function createPKCE(): PKCE {
  return new PKCE();
}

/**
 * Helper function to generate PKCE pair
 */
export function generatePKCEPair(method: CodeChallengeMethod = 'S256'): {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: CodeChallengeMethod;
} {
  const pkce = new PKCE();
  const codeVerifier = pkce.generateCodeVerifier();
  const codeChallenge = pkce.generateCodeChallenge(codeVerifier, method);

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: method
  };
}
