import { FraudDetector } from '../core/fraud-detector.js';
import type { Transaction } from '../core/types.js';

async function main() {
  console.log('🔍 Fraud Detection Examples\n');

  const detector = new FraudDetector();

  // Example 1: Normal transaction
  const tx1: Transaction = {
    id: 'TX-001',
    accountId: 'ACC-12345',
    cardNumber: '**** 1234',
    amount: 49.99,
    currency: 'USD',
    merchantId: 'MERCHANT-GROCERY',
    merchantCategory: 'grocery',
    timestamp: Date.now(),
  };

  const result1 = await detector.detectFraud(tx1);
  console.log('Example 1: Normal Transaction');
  console.log(`Decision: ${result1.decision}`);
  console.log(`Fraud Score: ${result1.fraudScore.toFixed(2)}/100`);
  console.log(`Latency: ${result1.latencyMs.toFixed(3)}ms\n`);

  // Example 2: High amount
  const tx2: Transaction = {
    id: 'TX-002',
    accountId: 'ACC-12345',
    cardNumber: '**** 1234',
    amount: 15000,
    currency: 'USD',
    merchantId: 'MERCHANT-ELECTRONICS',
    merchantCategory: 'electronics',
    timestamp: Date.now(),
  };

  const result2 = await detector.detectFraud(tx2);
  console.log('Example 2: High Amount Transaction');
  console.log(`Decision: ${result2.decision}`);
  console.log(`Fraud Score: ${result2.fraudScore.toFixed(2)}/100`);
  console.log(`Signals: ${result2.signals.map(s => s.type).join(', ')}`);
  console.log(`Latency: ${result2.latencyMs.toFixed(3)}ms\n`);

  console.log('✅ Examples complete!');
}

main().catch(console.error);
