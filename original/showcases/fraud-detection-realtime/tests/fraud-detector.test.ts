import { describe, it, expect, beforeEach } from 'vitest';
import { FraudDetector } from '../core/fraud-detector.js';
import type { Transaction } from '../core/types.js';

describe('FraudDetector', () => {
  let detector: FraudDetector;

  beforeEach(() => {
    detector = new FraudDetector(0.75);
  });

  it('should approve normal transaction', async () => {
    const tx: Transaction = {
      id: 'TX-001',
      accountId: 'ACC-001',
      cardNumber: '**** 1234',
      amount: 50,
      currency: 'USD',
      merchantId: 'MERCHANT-001',
      merchantCategory: 'grocery',
      timestamp: Date.now(),
    };

    const result = await detector.detectFraud(tx);

    expect(result.decision).toBe('APPROVE');
    expect(result.fraudScore).toBeLessThan(75);
    expect(result.latencyMs).toBeLessThan(5);
  });

  it('should detect high velocity', async () => {
    const accountId = 'ACC-002';

    for (let i = 0; i < 10; i++) {
      await detector.detectFraud({
        id: `TX-${i}`,
        accountId,
        cardNumber: '**** 5678',
        amount: 100,
        currency: 'USD',
        merchantId: 'MERCHANT-002',
        merchantCategory: 'online',
        timestamp: Date.now(),
      });
    }

    const results = await detector.detectFraud({
      id: 'TX-FINAL',
      accountId,
      cardNumber: '**** 5678',
      amount: 100,
      currency: 'USD',
      merchantId: 'MERCHANT-002',
      merchantCategory: 'online',
      timestamp: Date.now(),
    });

    expect(results.signals.some(s => s.type === 'HIGH_VELOCITY')).toBe(true);
  });

  it('should process in <5ms', async () => {
    const tx: Transaction = {
      id: 'TX-PERF',
      accountId: 'ACC-003',
      cardNumber: '**** 9999',
      amount: 250,
      currency: 'USD',
      merchantId: 'MERCHANT-003',
      merchantCategory: 'retail',
      timestamp: Date.now(),
    };

    const result = await detector.detectFraud(tx);
    expect(result.latencyMs).toBeLessThan(5);
  });
});
