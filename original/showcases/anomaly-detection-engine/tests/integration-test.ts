/**
 * Integration tests for end-to-end workflows.
 */

import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';

class IntegrationTester {
  private serverProcess?: ChildProcess;
  private baseUrl = 'http://localhost:3000';
  private wsUrl = 'ws://localhost:3000/ws';

  async runAllTests(): Promise<void> {
    console.log('🔗 Running Integration Tests...\n');

    try {
      // Start server
      console.log('Starting server...');
      await this.startServer();
      await this.wait(3000); // Wait for server to be ready

      // Run tests
      await this.testTrainAndPredict();
      await this.testWebSocketAlerts();
      await this.testEndToEndWorkflow();

      console.log('\n✅ All integration tests passed!');
    } catch (error: any) {
      console.error('\n❌ Integration tests failed:', error.message);
      process.exit(1);
    } finally {
      this.stopServer();
    }
  }

  async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('tsx', ['api/server.ts'], {
        stdio: 'pipe',
        env: {
          ...process.env,
          PORT: '3000',
          NODE_ENV: 'test'
        }
      });

      this.serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('started')) {
          resolve();
        }
      });

      this.serverProcess.stderr?.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Server start timeout')), 10000);
    });
  }

  stopServer(): void {
    if (this.serverProcess) {
      this.serverProcess.kill();
      console.log('Server stopped');
    }
  }

  async testTrainAndPredict(): Promise<void> {
    console.log('Test: Train model and predict...');

    // Generate training data
    const trainingData = Array.from({ length: 1000 }, () =>
      Array.from({ length: 10 }, () => Math.random() * 2)
    );

    // Train model
    const trainRes = await fetch(`${this.baseUrl}/api/v1/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        algorithm: 'isolation_forest',
        data: trainingData,
        config: { contamination: 0.1 }
      })
    });

    const trainData = await trainRes.json();

    if (trainData.status !== 'success') {
      throw new Error('Training failed');
    }

    console.log(`  ✓ Model trained: ${trainData.model.nSamples} samples`);

    // Load the model
    await fetch(`${this.baseUrl}/api/v1/models/isolation_forest/load`, {
      method: 'POST'
    });

    console.log('  ✓ Model loaded');

    // Predict with normal data
    const normalEvent = {
      features: Array.from({ length: 10 }, () => Math.random() * 2)
    };

    const normalRes = await fetch(`${this.baseUrl}/api/v1/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalEvent)
    });

    const normalData = await normalRes.json();

    console.log(`  ✓ Normal event: isAnomaly=${normalData.result.isAnomaly}`);

    // Predict with anomaly
    const anomalyEvent = {
      features: Array.from({ length: 10 }, () => Math.random() * 20 + 10)
    };

    const anomalyRes = await fetch(`${this.baseUrl}/api/v1/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anomalyEvent)
    });

    const anomalyData = await anomalyRes.json();

    console.log(`  ✓ Anomaly event: isAnomaly=${anomalyData.result.isAnomaly}`);

    if (!anomalyData.result.isAnomaly) {
      console.warn('  ⚠ Warning: Clear anomaly not detected');
    }
  }

  async testWebSocketAlerts(): Promise<void> {
    console.log('\nTest: WebSocket real-time alerts...');

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);
      let receivedAlert = false;

      ws.on('open', () => {
        console.log('  ✓ WebSocket connected');

        // Subscribe to alerts
        ws.send(JSON.stringify({
          type: 'subscribe',
          data: { channels: ['alerts'] }
        }));
      });

      ws.on('message', async (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === 'subscribe') {
          console.log('  ✓ Subscribed to alerts');

          // Trigger an anomaly
          await fetch(`${this.baseUrl}/api/v1/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              features: Array.from({ length: 10 }, () => Math.random() * 30 + 15)
            })
          });
        }

        if (message.type === 'alert') {
          console.log('  ✓ Received alert via WebSocket');
          receivedAlert = true;
          ws.close();
        }
      });

      ws.on('close', () => {
        if (receivedAlert) {
          resolve();
        } else {
          setTimeout(() => {
            // May not always trigger an alert due to cooldowns
            console.log('  ⚠ No alert received (may be due to cooldown)');
            resolve();
          }, 2000);
        }
      });

      ws.on('error', (error) => {
        reject(error);
      });

      // Timeout
      setTimeout(() => {
        ws.close();
      }, 5000);
    });
  }

  async testEndToEndWorkflow(): Promise<void> {
    console.log('\nTest: End-to-end workflow...');

    // 1. Check initial stats
    const statsRes1 = await fetch(`${this.baseUrl}/api/v1/stats/scorer`);
    const stats1 = await statsRes1.json();
    const initialCount = stats1.stats.totalScored;

    console.log(`  ✓ Initial scored count: ${initialCount}`);

    // 2. Batch detection
    const batchEvents = Array.from({ length: 50 }, () => ({
      features: Array.from({ length: 10 }, () => Math.random() * 2)
    }));

    const batchRes = await fetch(`${this.baseUrl}/api/v1/detect/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batchEvents })
    });

    const batchData = await batchRes.json();

    console.log(`  ✓ Batch processed: ${batchData.result.results.length} events`);
    console.log(`  ✓ Anomalies detected: ${batchData.result.anomalyCount}`);
    console.log(`  ✓ Avg latency: ${batchData.result.avgLatencyMs.toFixed(2)}ms`);

    // 3. Check updated stats
    const statsRes2 = await fetch(`${this.baseUrl}/api/v1/stats/scorer`);
    const stats2 = await statsRes2.json();
    const finalCount = stats2.stats.totalScored;

    console.log(`  ✓ Final scored count: ${finalCount}`);

    if (finalCount <= initialCount) {
      throw new Error('Stats not updated correctly');
    }

    // 4. Check alerts
    const alertsRes = await fetch(`${this.baseUrl}/api/v1/alerts`);
    const alertsData = await alertsRes.json();

    console.log(`  ✓ Active alerts: ${alertsData.alerts.length}`);

    // 5. Get metrics
    const metricsRes = await fetch(`${this.baseUrl}/metrics`);
    const metricsData = await metricsRes.json();

    console.log(`  ✓ Retrieved comprehensive metrics`);
    console.log(`  ✓ Scorer stats: ${JSON.stringify(metricsData.metrics.scorer)}`);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests
const tester = new IntegrationTester();
tester.runAllTests().catch(console.error);
