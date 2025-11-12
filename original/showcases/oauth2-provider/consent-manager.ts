/**
 * Consent Manager
 *
 * Manages user consent for OAuth2 authorization requests.
 * Handles consent screens, consent storage, and consent validation.
 *
 * @module consent-manager
 */

export interface ConsentRequest {
  userId: string;
  clientId: string;
  scopes: string[];
  timestamp: number;
}

export interface ConsentDecision {
  userId: string;
  clientId: string;
  scopes: string[];
  approved: boolean;
  timestamp: number;
  expiresAt?: number;
}

export interface ConsentScreenData {
  client: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    privacyPolicy?: string;
    termsOfService?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  scopes: ScopeDescription[];
  previousConsent?: ConsentDecision;
}

export interface ScopeDescription {
  scope: string;
  title: string;
  description: string;
  required: boolean;
  sensitive: boolean;
}

/**
 * Consent Manager Class
 */
export class ConsentManager {
  private consents: Map<string, ConsentDecision> = new Map();
  private scopeDescriptions: Map<string, ScopeDescription> = new Map();

  constructor() {
    this.initializeScopeDescriptions();
  }

  /**
   * Check if user has previously consented
   */
  hasConsent(userId: string, clientId: string, scopes: string[]): boolean {
    const key = this.getConsentKey(userId, clientId);
    const consent = this.consents.get(key);

    if (!consent || !consent.approved) {
      return false;
    }

    // Check if consent is expired
    if (consent.expiresAt && consent.expiresAt < Date.now()) {
      return false;
    }

    // Check if all requested scopes are covered
    return scopes.every(scope => consent.scopes.includes(scope));
  }

  /**
   * Get previous consent decision
   */
  getConsent(userId: string, clientId: string): ConsentDecision | undefined {
    const key = this.getConsentKey(userId, clientId);
    return this.consents.get(key);
  }

  /**
   * Store consent decision
   */
  storeConsent(decision: ConsentDecision): void {
    const key = this.getConsentKey(decision.userId, decision.clientId);

    // Set expiration (default: 1 year)
    if (!decision.expiresAt) {
      decision.expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    }

    this.consents.set(key, decision);
  }

  /**
   * Revoke consent
   */
  revokeConsent(userId: string, clientId: string): boolean {
    const key = this.getConsentKey(userId, clientId);
    return this.consents.delete(key);
  }

  /**
   * Revoke all consents for user
   */
  revokeAllUserConsents(userId: string): number {
    let count = 0;
    for (const [key, consent] of this.consents.entries()) {
      if (consent.userId === userId) {
        this.consents.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get all consents for user
   */
  getUserConsents(userId: string): ConsentDecision[] {
    const consents: ConsentDecision[] = [];
    for (const consent of this.consents.values()) {
      if (consent.userId === userId) {
        consents.push(consent);
      }
    }
    return consents;
  }

  /**
   * Generate consent screen data
   */
  generateConsentScreen(
    clientData: any,
    userData: any,
    requestedScopes: string[]
  ): ConsentScreenData {
    const scopeDescriptions = requestedScopes.map(scope =>
      this.getScopeDescription(scope)
    );

    const previousConsent = this.getConsent(userData.id, clientData.id);

    return {
      client: {
        id: clientData.id,
        name: clientData.name,
        description: clientData.description,
        logo: clientData.logo,
        website: clientData.website,
        privacyPolicy: clientData.privacyPolicy,
        termsOfService: clientData.termsOfService
      },
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email
      },
      scopes: scopeDescriptions,
      previousConsent
    };
  }

  /**
   * Render consent screen HTML
   */
  renderConsentScreen(data: ConsentScreenData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorization Request</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .content { padding: 30px; }
    .client-info {
      display: flex;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 30px;
      border-bottom: 2px solid #f0f0f0;
    }
    .client-logo {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      background: #f0f0f0;
      margin-right: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .client-details h2 { font-size: 18px; margin-bottom: 5px; }
    .client-details p { color: #666; font-size: 14px; }
    .scopes-section h3 {
      font-size: 16px;
      margin-bottom: 15px;
      color: #333;
    }
    .scope-item {
      display: flex;
      align-items: start;
      margin-bottom: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .scope-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #667eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
      font-size: 12px;
    }
    .scope-details h4 {
      font-size: 14px;
      margin-bottom: 5px;
      color: #333;
    }
    .scope-details p {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
    }
    .scope-item.sensitive { border-left-color: #f59e0b; }
    .scope-item.sensitive .scope-icon { background: #f59e0b; }
    .user-info {
      background: #f0f7ff;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .user-info strong { color: #667eea; }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 30px;
    }
    button {
      flex: 1;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-approve {
      background: #667eea;
      color: white;
    }
    .btn-approve:hover { background: #5568d3; transform: translateY(-1px); }
    .btn-deny {
      background: #e5e7eb;
      color: #374151;
    }
    .btn-deny:hover { background: #d1d5db; }
    .footer {
      padding: 20px 30px;
      background: #f9fafb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Authorization Request</h1>
      <p>Review the permissions being requested</p>
    </div>

    <div class="content">
      <div class="client-info">
        <div class="client-logo">${data.client.logo || '🔐'}</div>
        <div class="client-details">
          <h2>${data.client.name}</h2>
          <p>${data.client.description || 'Third-party application'}</p>
        </div>
      </div>

      <div class="user-info">
        Signing in as <strong>${data.user.name}</strong> (${data.user.email})
      </div>

      <div class="scopes-section">
        <h3>This app would like to:</h3>
        ${data.scopes.map(scope => `
          <div class="scope-item ${scope.sensitive ? 'sensitive' : ''}">
            <div class="scope-icon">${scope.sensitive ? '⚠' : '✓'}</div>
            <div class="scope-details">
              <h4>${scope.title}</h4>
              <p>${scope.description}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <form method="POST" action="/oauth/consent">
        <div class="actions">
          <button type="submit" name="decision" value="deny" class="btn-deny">
            Deny
          </button>
          <button type="submit" name="decision" value="approve" class="btn-approve">
            Allow Access
          </button>
        </div>
      </form>
    </div>

    <div class="footer">
      By continuing, you agree to share this information with ${data.client.name}.
      ${data.client.privacyPolicy ? `<a href="${data.client.privacyPolicy}" target="_blank">Privacy Policy</a>` : ''}
      ${data.client.termsOfService ? `<a href="${data.client.termsOfService}" target="_blank">Terms of Service</a>` : ''}
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get scope description
   */
  private getScopeDescription(scope: string): ScopeDescription {
    return this.scopeDescriptions.get(scope) || {
      scope,
      title: scope,
      description: `Access to ${scope}`,
      required: false,
      sensitive: false
    };
  }

  /**
   * Initialize standard scope descriptions
   */
  private initializeScopeDescriptions(): void {
    const scopes: ScopeDescription[] = [
      {
        scope: 'openid',
        title: 'Verify your identity',
        description: 'Access your basic profile information',
        required: true,
        sensitive: false
      },
      {
        scope: 'profile',
        title: 'Access your profile',
        description: 'View your name, picture, and other profile information',
        required: false,
        sensitive: false
      },
      {
        scope: 'email',
        title: 'Access your email address',
        description: 'View your email address and verification status',
        required: false,
        sensitive: true
      },
      {
        scope: 'phone',
        title: 'Access your phone number',
        description: 'View your phone number and verification status',
        required: false,
        sensitive: true
      },
      {
        scope: 'address',
        title: 'Access your address',
        description: 'View your mailing address',
        required: false,
        sensitive: true
      },
      {
        scope: 'read',
        title: 'Read your data',
        description: 'View your information and settings',
        required: false,
        sensitive: false
      },
      {
        scope: 'write',
        title: 'Modify your data',
        description: 'Create, update, and delete your information',
        required: false,
        sensitive: true
      },
      {
        scope: 'offline_access',
        title: 'Maintain access',
        description: 'Access your data even when you are not using the app',
        required: false,
        sensitive: true
      }
    ];

    for (const scope of scopes) {
      this.scopeDescriptions.set(scope.scope, scope);
    }
  }

  /**
   * Generate consent key
   */
  private getConsentKey(userId: string, clientId: string): string {
    return `${userId}:${clientId}`;
  }

  /**
   * Clean expired consents
   */
  cleanExpiredConsents(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, consent] of this.consents.entries()) {
      if (consent.expiresAt && consent.expiresAt < now) {
        this.consents.delete(key);
        count++;
      }
    }

    return count;
  }
}

/**
 * Create consent manager instance
 */
export function createConsentManager(): ConsentManager {
  return new ConsentManager();
}
