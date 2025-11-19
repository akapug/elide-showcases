/**
 * Data Analysis Examples
 *
 * Comprehensive data analysis workflows using the scientific computing platform.
 * Demonstrates statistical analysis, time series, exploratory data analysis,
 * and data visualization techniques.
 */

import { Statistics } from '../src/compute/statistics';
import { LinearAlgebra } from '../src/compute/linear-algebra';
import { SignalProcessing } from '../src/compute/signal-processing';
import { Plotter } from '../src/visualization/plotter';
import Python from 'python';

export interface Dataset {
  data: number[][];
  columns: string[];
  index?: any[];
}

export interface AnalysisResult {
  summary: any;
  correlations: number[][];
  distribution: any;
  tests: any;
}

export class DataAnalysis {
  private stats: Statistics;
  private linalg: LinearAlgebra;
  private signal: SignalProcessing;
  private plotter: Plotter;
  private pandas: any;
  private numpy: any;

  constructor() {
    this.stats = new Statistics();
    this.linalg = new LinearAlgebra();
    this.signal = new SignalProcessing();
    this.plotter = new Plotter();
    this.pandas = Python.import('pandas');
    this.numpy = Python.import('numpy');
  }

  // ==========================================================================
  // Data Loading and Preprocessing
  // ==========================================================================

  loadCSV(filepath: string): Dataset {
    const df = this.pandas.read_csv(filepath);
    return {
      data: df.values.tolist(),
      columns: df.columns.tolist(),
      index: df.index.tolist()
    };
  }

  summarize(data: Dataset): any {
    const df = this.pandas.DataFrame(data.data, { columns: data.columns });
    const description = df.describe();

    return {
      count: description.loc['count'].tolist(),
      mean: description.loc['mean'].tolist(),
      std: description.loc['std'].tolist(),
      min: description.loc['min'].tolist(),
      q25: description.loc['25%'].tolist(),
      median: description.loc['50%'].tolist(),
      q75: description.loc['75%'].tolist(),
      max: description.loc['max'].tolist()
    };
  }

  removeMissing(data: Dataset): Dataset {
    const df = this.pandas.DataFrame(data.data, { columns: data.columns });
    const cleaned = df.dropna();

    return {
      data: cleaned.values.tolist(),
      columns: cleaned.columns.tolist(),
      index: cleaned.index.tolist()
    };
  }

  normalize(data: Dataset, method: 'zscore' | 'minmax' | 'robust' = 'zscore'): Dataset {
    const df = this.pandas.DataFrame(data.data, { columns: data.columns });

    let normalized;
    if (method === 'zscore') {
      normalized = (df - df.mean()) / df.std();
    } else if (method === 'minmax') {
      normalized = (df - df.min()) / (df.max() - df.min());
    } else {
      const q1 = df.quantile(0.25);
      const q3 = df.quantile(0.75);
      normalized = (df - df.median()) / (q3 - q1);
    }

    return {
      data: normalized.values.tolist(),
      columns: normalized.columns.tolist()
    };
  }

  // ==========================================================================
  // Feature Engineering
  // ==========================================================================

  extractFeatures(data: Dataset, config: {
    polynomial?: number;
    interactions?: boolean;
    pca?: { nComponents: number };
  }): Dataset {
    let df = this.pandas.DataFrame(data.data, { columns: data.columns });
    const features = [];
    const featureNames = [];

    // Original features
    features.push(...df.values.tolist());
    featureNames.push(...df.columns.tolist());

    // Polynomial features
    if (config.polynomial && config.polynomial > 1) {
      for (let deg = 2; deg <= config.polynomial; deg++) {
        for (const col of df.columns.tolist()) {
          const polyFeature = df[col].pow(deg).tolist();
          features.push(polyFeature);
          featureNames.push(`${col}^${deg}`);
        }
      }
    }

    // Interaction features
    if (config.interactions) {
      const cols = df.columns.tolist();
      for (let i = 0; i < cols.length; i++) {
        for (let j = i + 1; j < cols.length; j++) {
          const interaction = (df[cols[i]] * df[cols[j]]).tolist();
          features.push(interaction);
          featureNames.push(`${cols[i]}_x_${cols[j]}`);
        }
      }
    }

    let result = this.pandas.DataFrame(
      this.numpy.column_stack(features),
      { columns: featureNames }
    );

    // PCA
    if (config.pca) {
      const sklearn = Python.import('sklearn.decomposition');
      const pca = sklearn.PCA({ n_components: config.pca.nComponents });
      const transformed = pca.fit_transform(result.values);

      result = this.pandas.DataFrame(
        transformed,
        {
          columns: Array.from(
            { length: config.pca.nComponents },
            (_, i) => `PC${i + 1}`
          )
        }
      );
    }

    return {
      data: result.values.tolist(),
      columns: result.columns.tolist()
    };
  }

  // ==========================================================================
  // Statistical Analysis
  // ==========================================================================

  correlationMatrix(data: Dataset): number[][] {
    const numericData = data.data.map(row =>
      row.filter(val => typeof val === 'number')
    );

    return this.stats.correlationMatrix(numericData);
  }

  principalComponentAnalysis(data: Dataset, nComponents: number = 2): {
    components: number[][];
    explainedVariance: number[];
    cumulativeVariance: number[];
  } {
    const sklearn = Python.import('sklearn.decomposition');
    const pca = sklearn.PCA({ n_components: nComponents });

    const X = this.numpy.array(data.data);
    const transformed = pca.fit_transform(X);

    return {
      components: transformed.tolist(),
      explainedVariance: pca.explained_variance_ratio_.tolist(),
      cumulativeVariance: this.numpy.cumsum(pca.explained_variance_ratio_).tolist()
    };
  }

  multipleComparisons(data: Dataset, config: {
    groups: string;
    method: 'anova' | 'kruskal';
    posthoc?: 'tukey' | 'bonferroni';
  }): any {
    const df = this.pandas.DataFrame(data.data, { columns: data.columns });

    if (config.method === 'anova') {
      const scipy = Python.import('scipy.stats');
      const groups = df.groupby(config.groups);
      const groupArrays = [];

      for (const [name, group] of groups) {
        groupArrays.push(group.values);
      }

      const result = scipy.f_oneway(...groupArrays);

      return {
        method: 'ANOVA',
        statistic: result.statistic,
        pvalue: result.pvalue,
        groups: groups.ngroups
      };
    } else {
      const scipy = Python.import('scipy.stats');
      const groups = df.groupby(config.groups);
      const groupArrays = Array.from(groups).map(([_, g]) => g.values);

      const result = scipy.kruskal(...groupArrays);

      return {
        method: 'Kruskal-Wallis',
        statistic: result.statistic,
        pvalue: result.pvalue
      };
    }
  }

  // ==========================================================================
  // Time Series Analysis
  // ==========================================================================

  decomposeTimeSeries(data: number[], period: number): {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } {
    const statsmodels = Python.import('statsmodels.api');
    const result = statsmodels.tsa.seasonal.seasonal_decompose(
      this.numpy.array(data),
      { model: 'additive', period }
    );

    return {
      trend: result.trend.tolist(),
      seasonal: result.seasonal.tolist(),
      residual: result.resid.tolist()
    };
  }

  autoRegression(data: number[], lags: number = 5): {
    coefficients: number[];
    predictions: number[];
    residuals: number[];
  } {
    const statsmodels = Python.import('statsmodels.api');
    const model = statsmodels.tsa.ar_model.AutoReg(
      this.numpy.array(data),
      { lags }
    );
    const fitted = model.fit();

    return {
      coefficients: fitted.params.tolist(),
      predictions: fitted.predict().tolist(),
      residuals: fitted.resid.tolist()
    };
  }

  movingAverage(data: number[], window: number, type: 'simple' | 'exponential' = 'simple'): number[] {
    if (type === 'simple') {
      return this.stats.movingAverage(data, window);
    } else {
      const alpha = 2 / (window + 1);
      return this.stats.exponentialMovingAverage(data, alpha);
    }
  }

  detectAnomalies(data: number[], method: 'zscore' | 'iqr' | 'isolation' = 'zscore', threshold: number = 3): {
    anomalies: number[];
    indices: number[];
    scores: number[];
  } {
    if (method === 'zscore') {
      const zscores = this.stats.zscore(data) as number[];
      const indices: number[] = [];
      const anomalies: number[] = [];

      zscores.forEach((z, i) => {
        if (Math.abs(z) > threshold) {
          indices.push(i);
          anomalies.push(data[i]);
        }
      });

      return { anomalies, indices, scores: zscores };
    } else if (method === 'iqr') {
      const q1 = this.stats.percentile(data, 25) as number;
      const q3 = this.stats.percentile(data, 75) as number;
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;

      const indices: number[] = [];
      const anomalies: number[] = [];

      data.forEach((val, i) => {
        if (val < lower || val > upper) {
          indices.push(i);
          anomalies.push(val);
        }
      });

      return {
        anomalies,
        indices,
        scores: data.map(v => Math.max(lower - v, v - upper, 0))
      };
    } else {
      const sklearn = Python.import('sklearn.ensemble');
      const iso = sklearn.IsolationForest({ contamination: 0.1 });
      const X = this.numpy.array(data).reshape(-1, 1);
      const predictions = iso.fit_predict(X);

      const indices: number[] = [];
      const anomalies: number[] = [];

      predictions.tolist().forEach((pred: number, i: number) => {
        if (pred === -1) {
          indices.push(i);
          anomalies.push(data[i]);
        }
      });

      return {
        anomalies,
        indices,
        scores: iso.score_samples(X).tolist()
      };
    }
  }

  // ==========================================================================
  // Clustering
  // ==========================================================================

  kmeansClustering(data: number[][], nClusters: number = 3): {
    labels: number[];
    centers: number[][];
    inertia: number;
  } {
    const sklearn = Python.import('sklearn.cluster');
    const kmeans = sklearn.KMeans({ n_clusters: nClusters, random_state: 42 });
    const X = this.numpy.array(data);

    kmeans.fit(X);

    return {
      labels: kmeans.labels_.tolist(),
      centers: kmeans.cluster_centers_.tolist(),
      inertia: kmeans.inertia_
    };
  }

  hierarchicalClustering(data: number[][], nClusters: number = 3, linkage: 'ward' | 'complete' | 'average' = 'ward'): {
    labels: number[];
    dendrogram: any;
  } {
    const sklearn = Python.import('sklearn.cluster');
    const scipy = Python.import('scipy.cluster.hierarchy');

    const X = this.numpy.array(data);
    const clustering = sklearn.AgglomerativeClustering({
      n_clusters: nClusters,
      linkage
    });

    const labels = clustering.fit_predict(X);
    const linkageMatrix = scipy.linkage(X, linkage);

    return {
      labels: labels.tolist(),
      dendrogram: linkageMatrix.tolist()
    };
  }

  dbscan(data: number[][], eps: number = 0.5, minSamples: number = 5): {
    labels: number[];
    nClusters: number;
    nNoise: number;
  } {
    const sklearn = Python.import('sklearn.cluster');
    const dbscan = sklearn.DBSCAN({ eps, min_samples: minSamples });
    const X = this.numpy.array(data);

    const labels = dbscan.fit_predict(X);
    const labelsList = labels.tolist();

    const nClusters = new Set(labelsList.filter((l: number) => l !== -1)).size;
    const nNoise = labelsList.filter((l: number) => l === -1).length;

    return {
      labels: labelsList,
      nClusters,
      nNoise
    };
  }

  // ==========================================================================
  // Dimensionality Reduction
  // ==========================================================================

  tsne(data: number[][], nComponents: number = 2, perplexity: number = 30): number[][] {
    const sklearn = Python.import('sklearn.manifold');
    const tsne = sklearn.TSNE({
      n_components: nComponents,
      perplexity,
      random_state: 42
    });

    const X = this.numpy.array(data);
    const embedded = tsne.fit_transform(X);

    return embedded.tolist();
  }

  umap(data: number[][], nComponents: number = 2, nNeighbors: number = 15): number[][] {
    try {
      const umap = Python.import('umap');
      const reducer = umap.UMAP({
        n_components: nComponents,
        n_neighbors: nNeighbors,
        random_state: 42
      });

      const X = this.numpy.array(data);
      const embedded = reducer.fit_transform(X);

      return embedded.tolist();
    } catch (error) {
      console.error('UMAP not available. Install with: pip install umap-learn');
      return this.tsne(data, nComponents);
    }
  }

  // ==========================================================================
  // Hypothesis Testing
  // ==========================================================================

  hypothesisTest(sample1: number[], sample2: number[], test: 'ttest' | 'mannwhitney' | 'ks' = 'ttest'): {
    statistic: number;
    pvalue: number;
    significant: boolean;
    effect_size?: number;
  } {
    let result;

    if (test === 'ttest') {
      result = this.stats.ttest(sample1, sample2);
      const effectSize = this.stats.cohensD(sample1, sample2);

      return {
        ...result,
        significant: result.pvalue < 0.05,
        effect_size: effectSize
      };
    } else if (test === 'mannwhitney') {
      result = this.stats.mannwhitneyu(sample1, sample2);
      return {
        ...result,
        significant: result.pvalue < 0.05
      };
    } else {
      const scipy = Python.import('scipy.stats');
      const ksResult = scipy.ks_2samp(
        this.numpy.array(sample1),
        this.numpy.array(sample2)
      );

      return {
        statistic: ksResult.statistic,
        pvalue: ksResult.pvalue,
        significant: ksResult.pvalue < 0.05
      };
    }
  }

  // ==========================================================================
  // Visualization
  // ==========================================================================

  plotDistributions(data: Dataset): void {
    const df = this.pandas.DataFrame(data.data, { columns: data.columns });
    const numericCols = df.select_dtypes({ include: ['number'] }).columns.tolist();

    const nCols = Math.min(numericCols.length, 4);
    const nRows = Math.ceil(numericCols.length / nCols);

    const { figId, axes } = this.plotter.subplots({ nrows: nRows, ncols: nCols, figsize: [16, 4 * nRows] });

    numericCols.forEach((col: string, i: number) => {
      const ax = Array.isArray(axes) ? axes[Math.floor(i / nCols)][i % nCols] : axes;
      const colData = df[col].dropna().tolist();

      this.plotter.histogram(colData, {
        bins: 30,
        title: `Distribution of ${col}`,
        xlabel: col,
        ylabel: 'Frequency',
        alpha: 0.7
      });
    });

    this.plotter.savefig(`distributions_${Date.now()}.png`);
  }

  plotCorrelationHeatmap(correlations: number[][]): void {
    this.plotter.figure([10, 8]);

    this.plotter.heatmap(correlations, {
      title: 'Correlation Matrix',
      cmap: 'coolwarm',
      vmin: -1,
      vmax: 1,
      center: 0,
      annot: true,
      square: true
    });

    this.plotter.savefig(`correlation_${Date.now()}.png`);
  }

  plotPCA(pcaResult: { components: number[][]; explainedVariance: number[] }): void {
    const { figId, axes } = this.plotter.subplots({ nrows: 1, ncols: 2, figsize: [16, 6] });

    // Scatter plot of first two components
    const pc1 = pcaResult.components.map(c => c[0]);
    const pc2 = pcaResult.components.map(c => c[1]);

    this.plotter.scatter(pc1, pc2, {
      title: 'PCA Projection',
      xlabel: `PC1 (${(pcaResult.explainedVariance[0] * 100).toFixed(1)}%)`,
      ylabel: `PC2 (${(pcaResult.explainedVariance[1] * 100).toFixed(1)}%)`,
      alpha: 0.6
    });

    // Scree plot
    const components = Array.from({ length: pcaResult.explainedVariance.length }, (_, i) => i + 1);
    this.plotter.bar(components, pcaResult.explainedVariance, {
      title: 'Explained Variance Ratio',
      xlabel: 'Principal Component',
      ylabel: 'Variance Explained'
    });

    this.plotter.savefig(`pca_${Date.now()}.png`);
  }

  plotTimeSeries(data: number[], dates?: string[]): void {
    this.plotter.figure([12, 6]);

    const x = dates ? dates : Array.from({ length: data.length }, (_, i) => i);

    this.plotter.plot(x, data, {
      title: 'Time Series Data',
      xlabel: 'Time',
      ylabel: 'Value',
      linewidth: 1.5
    });

    this.plotter.savefig(`timeseries_${Date.now()}.png`);
  }

  plotClusters(data: number[][], labels: number[]): void {
    this.plotter.figure([10, 8]);

    const uniqueLabels = [...new Set(labels)];
    const colors = ['red', 'blue', 'green', 'orange', 'purple', 'brown', 'pink', 'gray'];

    uniqueLabels.forEach((label, i) => {
      const clusterPoints = data.filter((_, idx) => labels[idx] === label);
      const x = clusterPoints.map(p => p[0]);
      const y = clusterPoints.map(p => p[1]);

      this.plotter.scatter(x, y, {
        color: colors[i % colors.length],
        label: `Cluster ${label}`,
        alpha: 0.6
      });
    });

    this.plotter.savefig(`clusters_${Date.now()}.png`);
  }
}

export default DataAnalysis;
