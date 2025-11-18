import type { Transaction, FraudCheckResult, FraudSignal, VelocityProfile } from './types.js';

/**
 * Real-Time Fraud Detector
 * Target: <5ms detection latency
 */
export class FraudDetector {
  private velocityProfiles: Map<string, VelocityProfile> = new Map();
  private blocklist: Set<string> = new Set();
  private deviceFingerprints: Map<string, string[]> = new Map();

  constructor(private fraudScoreThreshold: number = 0.75) {}

  async detectFraud(transaction: Transaction): Promise<FraudCheckResult> {
    const startTime = process.hrtime.bigint();
    const signals: FraudSignal[] = [];
    let fraudScore = 0;

    // Rule-based checks (ultra-fast)

    // 1. Blocklist check
    if (this.isBlocked(transaction)) {
      signals.push({
        type: 'BLOCKLIST',
        severity: 'CRITICAL',
        score: 100,
        message: 'Card/Account on blocklist',
      });
      fraudScore = 100;
    }

    // 2. Amount anomaly
    const amountSignal = this.checkAmountAnomaly(transaction);
    if (amountSignal) {
      signals.push(amountSignal);
      fraudScore += amountSignal.score;
    }

    // 3. Velocity checks
    const velocitySignal = this.checkVelocity(transaction);
    if (velocitySignal) {
      signals.push(velocitySignal);
      fraudScore += velocitySignal.score;
    }

    // 4. Geolocation anomaly
    const geoSignal = this.checkGeolocationAnomaly(transaction);
    if (geoSignal) {
      signals.push(geoSignal);
      fraudScore += geoSignal.score;
    }

    // 5. Time-based patterns
    const timeSignal = this.checkTimePatterns(transaction);
    if (timeSignal) {
      signals.push(timeSignal);
      fraudScore += timeSignal.score;
    }

    // 6. Device fingerprint
    const deviceSignal = this.checkDeviceFingerprint(transaction);
    if (deviceSignal) {
      signals.push(deviceSignal);
      fraudScore += deviceSignal.score;
    }

    const endTime = process.hrtime.bigint();
    const latencyMs = Number(endTime - startTime) / 1_000_000;

    const normalizedScore = Math.min(fraudScore, 100);

    return {
      transactionId: transaction.id,
      fraudScore: normalizedScore,
      decision: this.makeDecision(normalizedScore),
      signals,
      latencyMs,
      timestamp: Date.now(),
      requiresReview: normalizedScore >= 50 && normalizedScore < this.fraudScoreThreshold,
    };
  }

  private isBlocked(tx: Transaction): boolean {
    return (
      this.blocklist.has(tx.cardNumber) ||
      this.blocklist.has(tx.accountId) ||
      this.blocklist.has(tx.merchantId)
    );
  }

  private checkAmountAnomaly(tx: Transaction): FraudSignal | null {
    // Check for suspiciously round amounts
    if (tx.amount === Math.floor(tx.amount / 100) * 100 && tx.amount > 500) {
      return {
        type: 'AMOUNT_ANOMALY',
        severity: 'MEDIUM',
        score: 15,
        message: 'Suspiciously round amount',
      };
    }

    // Check for very high amounts
    if (tx.amount > 10000) {
      return {
        type: 'HIGH_AMOUNT',
        severity: 'HIGH',
        score: 25,
        message: 'Unusually high transaction amount',
      };
    }

    return null;
  }

  private checkVelocity(tx: Transaction): FraudSignal | null {
    const profile = this.getVelocityProfile(tx.accountId);
    const now = Date.now();

    // Add current transaction
    profile.recentTransactions.push({ amount: tx.amount, timestamp: now });

    // Keep only last hour
    profile.recentTransactions = profile.recentTransactions.filter(
      t => now - t.timestamp < 3600_000
    );

    const last5min = profile.recentTransactions.filter(
      t => now - t.timestamp < 300_000
    );

    // Too many transactions in 5 minutes
    if (last5min.length > 5) {
      return {
        type: 'HIGH_VELOCITY',
        severity: 'HIGH',
        score: 30,
        message: `${last5min.length} transactions in 5 minutes`,
      };
    }

    return null;
  }

  private checkGeolocationAnomaly(tx: Transaction): FraudSignal | null {
    if (!tx.location) return null;

    const profile = this.getVelocityProfile(tx.accountId);

    if (profile.lastLocation) {
      const distance = this.calculateDistance(
        profile.lastLocation,
        tx.location
      );
      const timeDiff = (Date.now() - profile.lastLocationTime) / 1000 / 3600; // hours

      // Impossible travel speed (>800 km/h)
      if (distance / timeDiff > 800) {
        return {
          type: 'IMPOSSIBLE_TRAVEL',
          severity: 'CRITICAL',
          score: 40,
          message: `Transaction ${distance.toFixed(0)}km away in ${timeDiff.toFixed(1)}h`,
        };
      }
    }

    profile.lastLocation = tx.location;
    profile.lastLocationTime = Date.now();

    return null;
  }

  private checkTimePatterns(tx: Transaction): FraudSignal | null {
    const hour = new Date(tx.timestamp).getHours();

    // Unusual hour (2-5 AM)
    if (hour >= 2 && hour < 5) {
      return {
        type: 'UNUSUAL_TIME',
        severity: 'LOW',
        score: 10,
        message: 'Transaction during unusual hours',
      };
    }

    return null;
  }

  private checkDeviceFingerprint(tx: Transaction): FraudSignal | null {
    if (!tx.deviceFingerprint) return null;

    const knownDevices = this.deviceFingerprints.get(tx.accountId) || [];

    if (knownDevices.length > 0 && !knownDevices.includes(tx.deviceFingerprint)) {
      return {
        type: 'NEW_DEVICE',
        severity: 'MEDIUM',
        score: 20,
        message: 'Transaction from new device',
      };
    }

    // Track device
    if (!knownDevices.includes(tx.deviceFingerprint)) {
      knownDevices.push(tx.deviceFingerprint);
      this.deviceFingerprints.set(tx.accountId, knownDevices.slice(-5)); // Keep last 5
    }

    return null;
  }

  private getVelocityProfile(accountId: string): VelocityProfile {
    if (!this.velocityProfiles.has(accountId)) {
      this.velocityProfiles.set(accountId, {
        accountId,
        recentTransactions: [],
        lastLocation: null,
        lastLocationTime: 0,
      });
    }
    return this.velocityProfiles.get(accountId)!;
  }

  private calculateDistance(
    loc1: { lat: number; lon: number },
    loc2: { lat: number; lon: number }
  ): number {
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLon = this.toRad(loc2.lon - loc1.lon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(loc1.lat)) *
        Math.cos(this.toRad(loc2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private makeDecision(score: number): 'APPROVE' | 'DECLINE' | 'REVIEW' {
    if (score >= 90) return 'DECLINE';
    if (score >= this.fraudScoreThreshold) return 'REVIEW';
    return 'APPROVE';
  }

  addToBlocklist(identifier: string): void {
    this.blocklist.add(identifier);
  }

  removeFromBlocklist(identifier: string): void {
    this.blocklist.delete(identifier);
  }
}
