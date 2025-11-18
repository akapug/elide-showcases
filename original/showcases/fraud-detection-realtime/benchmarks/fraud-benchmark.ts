import { FraudDetector } from '../core/fraud-detector.js';
import type { Transaction } from '../core/types.js';

function generateTransaction(index: number): Transaction {
  return {
    id: `TX-${Date.now()}-${index}`,
    accountId: `ACC-${Math.floor(Math.random() * 1000)}`,
    cardNumber: `**** **** **** ${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    amount: Math.random() * 5000 + 10,
    currency: 'USD',
    merchantId: `MERCHANT-${Math.floor(Math.random() * 100)}`,
    merchantCategory: ['retail', 'grocery', 'gas', 'restaurant', 'online'][Math.floor(Math.random() * 5)],
    location: {
      lat: (Math.random() * 180) - 90,
      lon: (Math.random() * 360) - 180,
      country: 'US',
    },
    timestamp: Date.now(),
  };
}

async function runBenchmark() {
  console.log('🔍 Fraud Detection Benchmark');
  console.log('='.repeat(60));

  const detector = new FraudDetector();

  // Warm up
  for (let i = 0; i < 100; i++) {
    await detector.detectFraud(generateTransaction(i));
  }

  console.log('📊 Performance Test');
  console.log('-'.repeat(60));

  const latencies: number[] = [];
  const iterations = 10000;

  for (let i = 0; i < iterations; i++) {
    const tx = generateTransaction(i);
    const result = await detector.detectFraud(tx);
    latencies.push(result.latencyMs);
  }

  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  console.log(`Iterations: ${iterations.toLocaleString()}`);
  console.log(`Average:    ${avg.toFixed(3)}ms`);
  console.log(`Median:     ${p50.toFixed(3)}ms`);
  console.log(`P95:        ${p95.toFixed(3)}ms`);
  console.log(`P99:        ${p99.toFixed(3)}ms`);

  const sub5ms = latencies.filter(l => l < 5).length;
  console.log(`\n✅ Sub-5ms Success Rate: ${((sub5ms / iterations) * 100).toFixed(2)}%`);

  if (avg < 3) {
    console.log('🏆 EXCELLENT: Average <3ms!');
  } else if (avg < 5) {
    console.log('✅ GOOD: Average <5ms');
  }

  console.log('\n✅ Benchmark complete!');
}

runBenchmark().catch(console.error);
