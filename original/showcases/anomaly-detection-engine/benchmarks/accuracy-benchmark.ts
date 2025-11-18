/**
 * Accuracy benchmark across different data distributions and scenarios.
 */

import { ModelManager } from '../core/model-manager.js';

interface ScenarioResult {
  scenario: string;
  algorithm: string;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
}

class AccuracyBenchmark {
  private modelManager!: ModelManager;

  async run(): Promise<void> {
    console.log('🎯 Accuracy Benchmark - Different Data Scenarios\n');
    console.log('='.repeat(80));

    await this.initialize();

    const results: ScenarioResult[] = [];

    // Test different scenarios
    results.push(...await this.testScenario('Gaussian', this.generateGaussian));
    results.push(...await this.testScenario('Clustered', this.generateClustered));
    results.push(...await this.testScenario('High-Dimensional', this.generateHighDim));

    this.printResults(results);
  }

  async initialize(): Promise<void> {
    this.modelManager = new ModelManager('./models');
    await this.modelManager.initialize();
  }

  async testScenario(
    name: string,
    generator: (n: number, contamination: number) => { data: number[][], labels: number[] }
  ): Promise<ScenarioResult[]> {
    console.log(`\nTesting scenario: ${name}`);

    const { data, labels } = generator.call(this, 1000, 0.1);
    const trainData = data.slice(0, 800);
    const testData = data.slice(800);
    const testLabels = labels.slice(800);

    const algorithms = ['isolation_forest', 'lof', 'one_class_svm'];
    const results: ScenarioResult[] = [];

    for (const algorithm of algorithms) {
      console.log(`  Testing ${algorithm}...`);

      try {
        // Train
        await this.modelManager.trainModel(algorithm, trainData, {
          contamination: 0.1,
          novelty: algorithm === 'lof' ? true : undefined
        });

        // Predict
        await this.modelManager.loadModel(algorithm);
        const result = await this.modelManager.predict(testData, algorithm as any);

        if (result.status !== 'success' || !result.results) {
          console.log(`    ⚠️  Skipped (prediction failed)`);
          continue;
        }

        // Calculate metrics
        const predictions = result.results.map(r => r.is_anomaly ? 1 : 0);
        const metrics = this.calculateMetrics(testLabels, predictions);

        results.push({
          scenario: name,
          algorithm,
          ...metrics
        });

        console.log(`    Precision: ${(metrics.precision * 100).toFixed(1)}%, Recall: ${(metrics.recall * 100).toFixed(1)}%, F1: ${metrics.f1Score.toFixed(3)}`);
      } catch (error: any) {
        console.log(`    ⚠️  Skipped (${error.message})`);
      }
    }

    return results;
  }

  calculateMetrics(
    actual: number[],
    predicted: number[]
  ): { precision: number; recall: number; f1Score: number; accuracy: number } {
    let tp = 0, fp = 0, tn = 0, fn = 0;

    for (let i = 0; i < actual.length; i++) {
      if (actual[i] === 1 && predicted[i] === 1) tp++;
      else if (actual[i] === 0 && predicted[i] === 1) fp++;
      else if (actual[i] === 0 && predicted[i] === 0) tn++;
      else if (actual[i] === 1 && predicted[i] === 0) fn++;
    }

    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const accuracy = (tp + tn) / actual.length;

    return { precision, recall, f1Score, accuracy };
  }

  generateGaussian(nSamples: number, contamination: number): { data: number[][], labels: number[] } {
    const nNormal = Math.floor(nSamples * (1 - contamination));
    const nAnomalies = nSamples - nNormal;

    // Normal: Gaussian around origin
    const normalData = Array.from({ length: nNormal }, () =>
      Array.from({ length: 10 }, () => this.randomGaussian(0, 1))
    );

    // Anomalies: Gaussian far from origin
    const anomalyData = Array.from({ length: nAnomalies }, () =>
      Array.from({ length: 10 }, () => this.randomGaussian(10, 2))
    );

    return this.shuffleData([...normalData, ...anomalyData], nNormal, nAnomalies);
  }

  generateClustered(nSamples: number, contamination: number): { data: number[][], labels: number[] } {
    const nNormal = Math.floor(nSamples * (1 - contamination));
    const nAnomalies = nSamples - nNormal;

    // Normal: 3 clusters
    const normalData: number[][] = [];
    const clusterSize = Math.floor(nNormal / 3);

    for (let c = 0; c < 3; c++) {
      const center = c * 5;
      for (let i = 0; i < clusterSize; i++) {
        normalData.push(
          Array.from({ length: 10 }, () => this.randomGaussian(center, 0.5))
        );
      }
    }

    // Anomalies: Scattered points
    const anomalyData = Array.from({ length: nAnomalies }, () =>
      Array.from({ length: 10 }, () => Math.random() * 30 - 5)
    );

    return this.shuffleData([...normalData, ...anomalyData], nNormal, nAnomalies);
  }

  generateHighDim(nSamples: number, contamination: number): { data: number[][], labels: number[] } {
    const nNormal = Math.floor(nSamples * (1 - contamination));
    const nAnomalies = nSamples - nNormal;
    const nFeatures = 100; // High dimensional

    // Normal: Concentrated in subspace
    const normalData = Array.from({ length: nNormal }, () => {
      const features = Array.from({ length: nFeatures }, () => this.randomGaussian(0, 0.5));
      // Most dimensions near zero
      for (let i = 10; i < nFeatures; i++) {
        features[i] *= 0.1;
      }
      return features;
    });

    // Anomalies: Spread across all dimensions
    const anomalyData = Array.from({ length: nAnomalies }, () =>
      Array.from({ length: nFeatures }, () => this.randomGaussian(0, 3))
    );

    return this.shuffleData([...normalData, ...anomalyData], nNormal, nAnomalies);
  }

  shuffleData(
    data: number[][],
    nNormal: number,
    nAnomalies: number
  ): { data: number[][], labels: number[] } {
    const labels = [...Array(nNormal).fill(0), ...Array(nAnomalies).fill(1)];
    const indices = Array.from({ length: data.length }, (_, i) => i);
    indices.sort(() => Math.random() - 0.5);

    return {
      data: indices.map(i => data[i]),
      labels: indices.map(i => labels[i])
    };
  }

  randomGaussian(mean: number = 0, std: number = 1): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  }

  printResults(results: ScenarioResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('ACCURACY BENCHMARK RESULTS');
    console.log('='.repeat(80));

    const scenarios = [...new Set(results.map(r => r.scenario))];

    for (const scenario of scenarios) {
      console.log(`\nScenario: ${scenario}`);
      console.log('-'.repeat(80));
      console.log(this.formatRow(['Algorithm', 'Precision', 'Recall', 'F1 Score', 'Accuracy']));
      console.log('-'.repeat(80));

      const scenarioResults = results.filter(r => r.scenario === scenario);

      for (const result of scenarioResults) {
        console.log(this.formatRow([
          result.algorithm,
          `${(result.precision * 100).toFixed(1)}%`,
          `${(result.recall * 100).toFixed(1)}%`,
          result.f1Score.toFixed(3),
          `${(result.accuracy * 100).toFixed(1)}%`
        ]));
      }

      // Best for this scenario
      const best = scenarioResults.reduce((max, r) =>
        r.f1Score > max.f1Score ? r : max
      );

      console.log(`\nBest for ${scenario}: ${best.algorithm} (F1: ${best.f1Score.toFixed(3)})`);
    }

    // Overall best
    console.log('\n' + '='.repeat(80));
    console.log('OVERALL BEST PERFORMERS');
    console.log('='.repeat(80));

    const avgByAlgorithm = new Map<string, number>();

    for (const result of results) {
      const current = avgByAlgorithm.get(result.algorithm) || 0;
      avgByAlgorithm.set(result.algorithm, current + result.f1Score);
    }

    const algorithmCounts = new Map<string, number>();
    for (const result of results) {
      algorithmCounts.set(result.algorithm, (algorithmCounts.get(result.algorithm) || 0) + 1);
    }

    for (const [algorithm, total] of avgByAlgorithm.entries()) {
      const count = algorithmCounts.get(algorithm) || 1;
      const avg = total / count;
      console.log(`${algorithm}: ${avg.toFixed(3)} (average F1 across ${count} scenarios)`);
    }

    console.log('='.repeat(80));
  }

  formatRow(cells: string[]): string {
    return cells.map((cell, i) => {
      const width = i === 0 ? 20 : 15;
      return cell.padEnd(width);
    }).join(' ');
  }
}

// Run benchmark
const benchmark = new AccuracyBenchmark();
benchmark.run().catch(console.error);
