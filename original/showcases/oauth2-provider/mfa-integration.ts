/**
 * Multi-Factor Authentication (MFA) Integration
 *
 * Provides MFA support for OAuth2 authentication:
 * - TOTP (Time-based One-Time Password)
 * - SMS verification codes
 * - Email verification codes
 * - Backup codes
 * - WebAuthn/FIDO2 support structure
 *
 * @module mfa-integration
 */

export type MFAMethod = 'totp' | 'sms' | 'email' | 'backup_code' | 'webauthn';

export interface MFAConfig {
  userId: string;
  method: MFAMethod;
  enabled: boolean;
  verified: boolean;
  secret?: string; // For TOTP
  phone?: string; // For SMS
  email?: string; // For Email
  backupCodes?: string[]; // Backup codes
  createdAt: number;
  lastUsed?: number;
}

export interface MFAChallenge {
  userId: string;
  method: MFAMethod;
  code: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

export interface MFAVerificationResult {
  success: boolean;
  method?: MFAMethod;
  error?: string;
  remainingAttempts?: number;
}

/**
 * MFA Manager Class
 */
export class MFAManager {
  private mfaConfigs: Map<string, MFAConfig[]> = new Map();
  private activeChallenges: Map<string, MFAChallenge> = new Map();
  private codeLifetime: number = 300000; // 5 minutes
  private maxAttempts: number = 3;

  /**
   * Setup TOTP for user
   */
  setupTOTP(userId: string): { secret: string; qrCode: string; backupCodes: string[] } {
    const secret = this.generateTOTPSecret();
    const backupCodes = this.generateBackupCodes();

    const config: MFAConfig = {
      userId,
      method: 'totp',
      enabled: false,
      verified: false,
      secret,
      backupCodes,
      createdAt: Date.now()
    };

    this.addMFAConfig(userId, config);

    const qrCode = this.generateTOTPQRCode(userId, secret);

    return { secret, qrCode, backupCodes };
  }

  /**
   * Verify TOTP setup
   */
  verifyTOTPSetup(userId: string, code: string): MFAVerificationResult {
    const configs = this.mfaConfigs.get(userId) || [];
    const totpConfig = configs.find(c => c.method === 'totp' && !c.verified);

    if (!totpConfig || !totpConfig.secret) {
      return { success: false, error: 'TOTP not configured' };
    }

    if (this.verifyTOTPCode(totpConfig.secret, code)) {
      totpConfig.verified = true;
      totpConfig.enabled = true;
      return { success: true, method: 'totp' };
    }

    return { success: false, error: 'Invalid code' };
  }

  /**
   * Setup SMS MFA
   */
  setupSMS(userId: string, phoneNumber: string): { challengeId: string } {
    const code = this.generateVerificationCode();
    const challengeId = this.generateChallengeId();

    const config: MFAConfig = {
      userId,
      method: 'sms',
      enabled: false,
      verified: false,
      phone: phoneNumber,
      createdAt: Date.now()
    };

    this.addMFAConfig(userId, config);

    // Create challenge
    const challenge: MFAChallenge = {
      userId,
      method: 'sms',
      code,
      expiresAt: Date.now() + this.codeLifetime,
      attempts: 0,
      maxAttempts: this.maxAttempts
    };

    this.activeChallenges.set(challengeId, challenge);

    // In production, send SMS here
    console.log(`SMS code for ${phoneNumber}: ${code}`);

    return { challengeId };
  }

  /**
   * Setup Email MFA
   */
  setupEmail(userId: string, email: string): { challengeId: string } {
    const code = this.generateVerificationCode();
    const challengeId = this.generateChallengeId();

    const config: MFAConfig = {
      userId,
      method: 'email',
      enabled: false,
      verified: false,
      email,
      createdAt: Date.now()
    };

    this.addMFAConfig(userId, config);

    // Create challenge
    const challenge: MFAChallenge = {
      userId,
      method: 'email',
      code,
      expiresAt: Date.now() + this.codeLifetime,
      attempts: 0,
      maxAttempts: this.maxAttempts
    };

    this.activeChallenges.set(challengeId, challenge);

    // In production, send email here
    console.log(`Email code for ${email}: ${code}`);

    return { challengeId };
  }

  /**
   * Verify MFA challenge
   */
  verifyChallenge(challengeId: string, code: string): MFAVerificationResult {
    const challenge = this.activeChallenges.get(challengeId);

    if (!challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    // Check expiration
    if (challenge.expiresAt < Date.now()) {
      this.activeChallenges.delete(challengeId);
      return { success: false, error: 'Challenge expired' };
    }

    // Check attempts
    if (challenge.attempts >= challenge.maxAttempts) {
      this.activeChallenges.delete(challengeId);
      return { success: false, error: 'Too many attempts' };
    }

    challenge.attempts++;

    // Verify code
    if (challenge.code === code) {
      // Mark method as verified
      const configs = this.mfaConfigs.get(challenge.userId) || [];
      const config = configs.find(c => c.method === challenge.method && !c.verified);

      if (config) {
        config.verified = true;
        config.enabled = true;
      }

      this.activeChallenges.delete(challengeId);
      return { success: true, method: challenge.method };
    }

    const remainingAttempts = challenge.maxAttempts - challenge.attempts;
    return {
      success: false,
      error: 'Invalid code',
      remainingAttempts
    };
  }

  /**
   * Create MFA challenge for authentication
   */
  createAuthenticationChallenge(userId: string, preferredMethod?: MFAMethod): {
    challengeId: string;
    method: MFAMethod;
    destination?: string;
  } | null {
    const configs = this.getMFAConfigs(userId);
    const enabledConfigs = configs.filter(c => c.enabled && c.verified);

    if (enabledConfigs.length === 0) {
      return null;
    }

    // Select method
    let config = enabledConfigs.find(c => c.method === preferredMethod);
    if (!config) {
      config = enabledConfigs[0]; // Use first available
    }

    const code = this.generateVerificationCode();
    const challengeId = this.generateChallengeId();

    const challenge: MFAChallenge = {
      userId,
      method: config.method,
      code,
      expiresAt: Date.now() + this.codeLifetime,
      attempts: 0,
      maxAttempts: this.maxAttempts
    };

    this.activeChallenges.set(challengeId, challenge);

    // Send code based on method
    let destination: string | undefined;
    if (config.method === 'sms' && config.phone) {
      destination = this.maskPhoneNumber(config.phone);
      console.log(`SMS code for ${config.phone}: ${code}`);
    } else if (config.method === 'email' && config.email) {
      destination = this.maskEmail(config.email);
      console.log(`Email code for ${config.email}: ${code}`);
    }

    return {
      challengeId,
      method: config.method,
      destination
    };
  }

  /**
   * Verify authentication challenge
   */
  verifyAuthenticationChallenge(
    challengeId: string,
    code: string,
    userId: string
  ): MFAVerificationResult {
    const challenge = this.activeChallenges.get(challengeId);

    if (!challenge || challenge.userId !== userId) {
      return { success: false, error: 'Invalid challenge' };
    }

    // Check for backup code
    if (this.verifyBackupCode(userId, code)) {
      this.activeChallenges.delete(challengeId);
      return { success: true, method: 'backup_code' };
    }

    // Verify regular code
    return this.verifyChallenge(challengeId, code);
  }

  /**
   * Verify backup code
   */
  private verifyBackupCode(userId: string, code: string): boolean {
    const configs = this.mfaConfigs.get(userId) || [];

    for (const config of configs) {
      if (config.backupCodes && config.backupCodes.includes(code)) {
        // Remove used backup code
        config.backupCodes = config.backupCodes.filter(c => c !== code);
        config.lastUsed = Date.now();
        return true;
      }
    }

    return false;
  }

  /**
   * Disable MFA method
   */
  disableMFA(userId: string, method: MFAMethod): boolean {
    const configs = this.mfaConfigs.get(userId) || [];
    const config = configs.find(c => c.method === method);

    if (!config) {
      return false;
    }

    config.enabled = false;
    return true;
  }

  /**
   * Get user's MFA methods
   */
  getMFAConfigs(userId: string): MFAConfig[] {
    return this.mfaConfigs.get(userId) || [];
  }

  /**
   * Check if user has MFA enabled
   */
  isMFAEnabled(userId: string): boolean {
    const configs = this.mfaConfigs.get(userId) || [];
    return configs.some(c => c.enabled && c.verified);
  }

  /**
   * Get available MFA methods for user
   */
  getAvailableMethods(userId: string): MFAMethod[] {
    const configs = this.mfaConfigs.get(userId) || [];
    return configs
      .filter(c => c.enabled && c.verified)
      .map(c => c.method);
  }

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes(userId: string): string[] {
    const backupCodes = this.generateBackupCodes();
    const configs = this.mfaConfigs.get(userId) || [];

    for (const config of configs) {
      if (config.method === 'totp') {
        config.backupCodes = backupCodes;
      }
    }

    return backupCodes;
  }

  /**
   * Add MFA config
   */
  private addMFAConfig(userId: string, config: MFAConfig): void {
    if (!this.mfaConfigs.has(userId)) {
      this.mfaConfigs.set(userId, []);
    }
    this.mfaConfigs.get(userId)!.push(config);
  }

  /**
   * Generate TOTP secret
   */
  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Generate TOTP QR code data
   */
  private generateTOTPQRCode(userId: string, secret: string): string {
    const issuer = 'OAuth2Provider';
    const label = `${issuer}:${userId}`;
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  }

  /**
   * Verify TOTP code
   */
  private verifyTOTPCode(secret: string, code: string): boolean {
    // In production, use a proper TOTP library
    // This is a simplified implementation
    const timeStep = 30; // 30 seconds
    const time = Math.floor(Date.now() / 1000 / timeStep);

    // Check current and adjacent time windows
    for (let i = -1; i <= 1; i++) {
      const expectedCode = this.generateTOTPCode(secret, time + i);
      if (expectedCode === code) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate TOTP code for time
   */
  private generateTOTPCode(secret: string, time: number): string {
    // Simplified TOTP generation (use proper crypto in production)
    const hash = this.simpleHash(secret + time.toString());
    return (hash % 1000000).toString().padStart(6, '0');
  }

  /**
   * Generate verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateBackupCode());
    }
    return codes;
  }

  /**
   * Generate single backup code
   */
  private generateBackupCode(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate challenge ID
   */
  private generateChallengeId(): string {
    return 'mfa_' + this.randomString(32);
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
   * Mask phone number
   */
  private maskPhoneNumber(phone: string): string {
    if (phone.length < 4) return phone;
    return '***-***-' + phone.slice(-4);
  }

  /**
   * Mask email
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const maskedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Clean expired challenges
   */
  cleanExpiredChallenges(): number {
    const now = Date.now();
    let count = 0;

    for (const [id, challenge] of this.activeChallenges.entries()) {
      if (challenge.expiresAt < now) {
        this.activeChallenges.delete(id);
        count++;
      }
    }

    return count;
  }
}

/**
 * Create MFA manager instance
 */
export function createMFAManager(): MFAManager {
  return new MFAManager();
}
