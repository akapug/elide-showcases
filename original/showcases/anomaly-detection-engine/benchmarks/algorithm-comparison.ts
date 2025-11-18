/**
 * Algorithm comparison benchmark.
 * Compare accuracy and performance across algorithms.
 */

import { ModelManager } from '../core/model-manager.js';

interface AlgorithmMetrics {
  algorithm: string;
  trainingTimeMs: number;
  scoringTimeMs: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
}

class AlgorithmComparison {
  private modelManager!: ModelManager;

  async run(): Promise<void> {
    console.log('📊 Algorithm Comparison Benchmark\n');
    console.log('='.repeat(80));

    await this.initialize();

    // Generate labeled data
    const { data, labels } = this.generateLabeledData(1000, 10, 0.1);
    const trainData = data.slice(0, 800);
    const testData = data.slice(800);
    const testLabels = labels.slice(800);

    const results: AlgorithmMetrics[] = [];

    results.push(await this.benchmarkAlgorithm('isolation_forest', trainData, testData, testLabels));
    results.push(await this.benchmarkAlgorithm('lof', trainData, testData, testLabels));
    results.push(await this.benchmarkAlgorithm('one_class_svm', trainData, testData, testLabels));

    this.printResults(results);
  }

  async initialize(): Promise<void> {
    this.modelManager = new ModelManager('./models');
    await this.modelManager.initialize();
  }

  async benchmarkAlgorithm(
    algorithm: string,
    trainData: number[][],
    testData: number[][],
    testLabels: number[]
  ): Promise<AlgorithmMetrics> {
    console.log(`\nBenchmarking ${algorithm}...`);

    // Train
    const trainStart = Date.now();
    await this.modelManager.trainModel(algorithm, trainData, {
      contamination: 0.1,
      novelty: algorithm === 'lof' ? true : undefined
    });
    const trainingTime = Date.now() - trainStart;

    console.log(`  Training time: ${trainingTime}ms`);

    // Predict
    await this.modelManager.loadModel(algorithm);

    const scoreStart = Date.now();
    const result = await this.modelManager.predict(testData, algorithm as any);
    const scoringTime = Date.now() - scoreStart;

    console.log(`  Scoring time: ${scoringTime}ms`);

    if (result.status !== 'success' || !result.results) {
      throw new Error(`Prediction failed for ${algorithm}`);
    }

    // Calculate metrics
    const predictions = result.results.map(r => r.is_anomaly ? 1 : 0);

    let tp = 0, fp = 0, tn = 0, fn = 0;

    for (let i = 0; i < testLabels.length; i++) {
      const actual = testLabels[i];
      const predicted = predictions[i];

      if (actual === 1 && predicted === 1) tp++;
      else if (actual === 0 && predicted === 1) fp++;
      else if (actual === 0 && predicted === 0) tn++;
      else if (actual === 1 && predicted === 0) fn++;
    }

    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    const accuracy = (tp + tn) / testLabels.length;

    console.log(`  TP: ${tp}, FP: ${fp}, TN: ${tn}, FN: ${fn}`);
    console.log(`  Precision: ${(precision * 100).toFixed(1)}%`);
    console.log(`  Recall: ${(recall * 100).toFixed(1)}%`);
    console.log(`  F1 Score: ${f1Score.toFixed(3)}`);

    return {
      algorithm,
      trainingTimeMs: trainingTime,
      scoringTimeMs: scoringTime,
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn,
      precision,
      recall,
      f1Score,
      accuracy
    };
  }

  printResults(results: AlgorithmMetrics[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('ALGORITHM COMPARISON RESULTS');
    console.log('='.repeat(80));

    // Performance comparison
    console.log('\nPERFORMANCE');
    console.log('-'.repeat(80));
    console.log(this.formatRow(['Algorithm', 'Training (ms)', 'Scoring (ms)', 'Total (ms)']));
    console.log('-'.repeat(80));

    for (const result of results) {
      console.log(this.formatRow([
        result.algorithm,
        result.trainingTimeMs.toFixed(0),
        result.scoringTimeMs.toFixed(0),
        (result.trainingTimeMs + result.scoringTimeMs).toFixed(0)
      ]));
    }

    // Accuracy comparison
    console.log('\nACCURACY METRICS');
    console.log('-'.repeat(80));
    console.log(this.formatRow(['Algorithm', 'Precision', 'Recall', 'F1 Score', 'Accuracy']));
    console.log('-'.repeat(80));

    for (const result of results) {
      console.log(this.formatRow([
        result.algorithm,
        `${(result.precision * 100).toFixed(1)}%`,
        `${(result.recall * 100).toFixed(1)}%`,
        result.f1Score.toFixed(3),
        `${(result.accuracy * 100).toFixed(1)}%`
      ]));
    }

    // Best performers
    console.log('\nBEST PERFORMERS');
    console.log('-'.repeat(80));

    const fastest = results.reduce((min, r) =>
      (r.trainingTimeMs + r.scoringTimeMs) < (min.trainingTimeMs + min.scoringTimeMs) ? r : min
    );

    const mostAccurate = results.reduce((max, r) =>
      r.f1Score > max.f1Score ? r : max
    );

    console.log(`Fastest:        ${fastest.algorithm} (${fastest.trainingTimeMs + fastest.scoringTimeMs}ms)`);
    console.log(`Most Accurate:  ${mostAccurate.algorithm} (F1: ${mostAccurate.f1Score.toFixed(3)})`);

    console.log('='.repeat(80));
  }

  formatRow(cells: string[]): string {
    return cells.map((cell, i) => {
      const width = i === 0 ? 20 : 15;
      return cell.padEnd(width);
    }).join(' ');
  }

  generateLabeledData(
    nSamples: number,
    nFeatures: number,
    contamination: number
  ): { data: number[][], labels: number[] } {
    const nNormal = Math.floor(nSamples * (1 - contamination));
    const nAnomalies = nSamples - nNormal;

    const normalData = Array.from({ length: nNormal }, () =>
      Array.from({ length: nFeatures }, () => Math.random() * 2)
    );

    const anomalyData = Array.from({ length: nAnomalies }, () =>
      Array.from({ length: nFeatures }, () => Math.random() * 20 + 10)
    );

    const data = [...normalData, ...anomalyData];
    const labels = [...Array(nNormal).fill(0), ...Array(nAnomalies).fill(1)];

    // Shuffle
    const indices = Array.from({ length: nSamples }, (_, i) => i);
    indices.sort(() => Math.random() - 0.5);

    return {
      data: indices.map(i => data[i]),
      labels: indices.map(i => labels[i])
    };
  }
}

// Run benchmark
const comparison = new AlgorithmComparison();
comparison.run().catch(console.error);
