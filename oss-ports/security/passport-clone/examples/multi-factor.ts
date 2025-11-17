/**
 * @elide/passport - Multi-Factor Authentication Example
 * Demonstrates 2FA/MFA implementation with TOTP
 */

import passport, { LocalStrategy } from '@elide/passport';
import * as crypto from 'crypto';

// Mock user database with MFA support
interface UserWithMFA {
  id: string;
  username: string;
  email: string;
  password: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  backupCodes?: string[];
  trustedDevices?: string[];
}

const usersWithMFA: UserWithMFA[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: 'hashed_password',
    mfaEnabled: true,
    mfaSecret: 'BASE32ENCODEDSECRET',
    backupCodes: ['123456', '789012'],
    trustedDevices: []
  }
];

// TOTP generator (simplified)
class TOTP {
  static generate(secret: string): string {
    // In real implementation, use actual TOTP algorithm
    // This is a simplified mock
    const timestamp = Math.floor(Date.now() / 30000);
    const hash = crypto.createHmac('sha1', secret)
      .update(String(timestamp))
      .digest('hex');

    const code = parseInt(hash.substring(0, 6), 16) % 1000000;
    return code.toString().padStart(6, '0');
  }

  static verify(secret: string, code: string, window: number = 1): boolean {
    // Check current code and window codes before/after
    for (let i = -window; i <= window; i++) {
      const timestamp = Math.floor(Date.now() / 30000) + i;
      const hash = crypto.createHmac('sha1', secret)
        .update(String(timestamp))
        .digest('hex');

      const expectedCode = parseInt(hash.substring(0, 6), 16) % 1000000;

      if (expectedCode.toString().padStart(6, '0') === code) {
        return true;
      }
    }

    return false;
  }

  static generateSecret(): string {
    return crypto.randomBytes(20).toString('base64');
  }
}

// Configure Local Strategy with MFA check
passport.use('local-mfa', new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  async (req, username, password, done) => {
    try {
      // Find user
      const user = usersWithMFA.find(u => u.username === username);

      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      // Verify password (simplified)
      if (password !== 'password') {
        return done(null, false, { message: 'Invalid credentials' });
      }

      // Check if MFA is enabled
      if (user.mfaEnabled) {
        // Store user in session for MFA verification
        (req as any).session.pendingMFA = {
          userId: user.id,
          timestamp: Date.now()
        };

        return done(null, false, { message: 'MFA required', mfaRequired: true });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser((id: string, done) => {
  const user = usersWithMFA.find(u => u.id === id);
  done(null, user || null);
});

// Generate QR code URL for TOTP setup
function generateQRCodeURL(email: string, secret: string, issuer: string = 'MyApp'): string {
  const otpauth = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
  return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpauth)}`;
}

// Generate backup codes
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex');
    codes.push(code);
  }

  return codes;
}

// Example Express app setup
export function setupMFAApp(app: any) {
  app.use(passport.initialize());
  app.use(passport.session());

  // Step 1: Initial login
  app.post('/auth/login', (req: any, res: any, next: any) => {
    passport.authenticate('local-mfa', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (info?.mfaRequired) {
        return res.json({
          mfaRequired: true,
          message: 'Please provide MFA code'
        });
      }

      if (!user) {
        return res.status(401).json({ error: info?.message || 'Authentication failed' });
      }

      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        return res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      });
    })(req, res, next);
  });

  // Step 2: Verify MFA code
  app.post('/auth/mfa/verify', (req: any, res: any) => {
    const { code, trustDevice } = req.body;

    // Check if there's a pending MFA
    if (!req.session.pendingMFA) {
      return res.status(400).json({ error: 'No pending MFA verification' });
    }

    const { userId, timestamp } = req.session.pendingMFA;

    // Check if MFA request is not too old (5 minutes)
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      delete req.session.pendingMFA;
      return res.status(400).json({ error: 'MFA verification expired' });
    }

    // Find user
    const user = usersWithMFA.find(u => u.id === userId);

    if (!user || !user.mfaEnabled) {
      return res.status(400).json({ error: 'Invalid MFA setup' });
    }

    // Verify TOTP code
    const isValidTOTP = user.mfaSecret && TOTP.verify(user.mfaSecret, code);

    // Check backup codes
    const backupCodeIndex = user.backupCodes?.indexOf(code) ?? -1;
    const isValidBackupCode = backupCodeIndex !== -1;

    if (!isValidTOTP && !isValidBackupCode) {
      return res.status(401).json({ error: 'Invalid MFA code' });
    }

    // Remove used backup code
    if (isValidBackupCode && user.backupCodes) {
      user.backupCodes.splice(backupCodeIndex, 1);
    }

    // Trust device if requested
    if (trustDevice) {
      const deviceId = crypto.randomBytes(16).toString('hex');
      user.trustedDevices = user.trustedDevices || [];
      user.trustedDevices.push(deviceId);

      // Set device cookie
      res.cookie('deviceId', deviceId, {
        httpOnly: true,
        secure: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    // Clear pending MFA
    delete req.session.pendingMFA;

    // Login user
    req.login(user, (err: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    });
  });

  // Enable MFA for user
  app.post('/api/mfa/enable', (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = usersWithMFA.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate MFA secret
    const secret = TOTP.generateSecret();
    user.mfaSecret = secret;

    // Generate backup codes
    user.backupCodes = generateBackupCodes();

    // Generate QR code URL
    const qrCodeURL = generateQRCodeURL(user.email, secret);

    return res.json({
      secret,
      qrCodeURL,
      backupCodes: user.backupCodes,
      message: 'Scan QR code with authenticator app and verify with code'
    });
  });

  // Confirm MFA setup
  app.post('/api/mfa/confirm', (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { code } = req.body;
    const user = usersWithMFA.find(u => u.id === req.user.id);

    if (!user || !user.mfaSecret) {
      return res.status(400).json({ error: 'MFA not initiated' });
    }

    // Verify code
    if (!TOTP.verify(user.mfaSecret, code)) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Enable MFA
    user.mfaEnabled = true;

    return res.json({
      success: true,
      message: 'MFA enabled successfully',
      backupCodes: user.backupCodes
    });
  });

  // Disable MFA
  app.post('/api/mfa/disable', (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { password } = req.body;
    const user = usersWithMFA.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password (simplified)
    if (password !== 'password') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Disable MFA
    user.mfaEnabled = false;
    delete user.mfaSecret;
    delete user.backupCodes;

    return res.json({
      success: true,
      message: 'MFA disabled successfully'
    });
  });

  // Get MFA status
  app.get('/api/mfa/status', (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = usersWithMFA.find(u => u.id === req.user.id);

    return res.json({
      enabled: user?.mfaEnabled || false,
      backupCodesRemaining: user?.backupCodes?.length || 0
    });
  });
}
