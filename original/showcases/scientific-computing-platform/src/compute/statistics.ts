/**
 * Statistical Analysis Bridge
 *
 * Comprehensive statistical analysis using SciPy and NumPy through Elide's
 * Python bridge. Provides descriptive statistics, hypothesis testing, correlation
 * analysis, distribution fitting, and advanced statistical methods.
 *
 * Features:
 * - Descriptive statistics (mean, median, std, percentiles, etc.)
 * - Hypothesis testing (t-tests, chi-square, ANOVA, etc.)
 * - Correlation and regression analysis
 * - Distribution fitting and testing
 * - Non-parametric statistics
 * - Bayesian statistics
 * - Time series analysis
 */

import Python from 'python';

// Type definitions
export interface DescriptiveStats {
  count: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  variance: number;
  skewness: number;
  kurtosis: number;
}

export interface TestResult {
  statistic: number;
  pvalue: number;
  df?: number;
}

export interface CorrelationResult {
  coefficient: number;
  pvalue: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  rvalue: number;
  pvalue: number;
  stderr: number;
  intercept_stderr: number;
}

export interface DistributionFit {
  params: number[];
  ksStatistic: number;
  pvalue: number;
}

export interface ANOVAResult {
  F: number;
  pvalue: number;
  dfBetween: number;
  dfWithin: number;
}

export interface ContingencyResult {
  chi2: number;
  pvalue: number;
  dof: number;
  expected: number[][];
}

/**
 * Statistics Class
 */
export class Statistics {
  private numpy: any;
  private scipy: any;
  private stats: any;

  constructor() {
    this.numpy = Python.import('numpy');
    this.scipy = Python.import('scipy');
    this.stats = this.scipy.stats;
  }

  // ============================================================================
  // Descriptive Statistics
  // ============================================================================

  /**
   * Comprehensive descriptive statistics
   */
  describe(data: number[]): DescriptiveStats {
    const npData = this.numpy.array(data);

    return {
      count: data.length,
      mean: this.numpy.mean(npData),
      std: this.numpy.std(npData, { ddof: 1 }),
      min: this.numpy.min(npData),
      q25: this.numpy.percentile(npData, 25),
      median: this.numpy.median(npData),
      q75: this.numpy.percentile(npData, 75),
      max: this.numpy.max(npData),
      variance: this.numpy.var(npData, { ddof: 1 }),
      skewness: this.stats.skew(npData),
      kurtosis: this.stats.kurtosis(npData)
    };
  }

  /**
   * Arithmetic mean
   */
  mean(data: number[], axis?: number): number | number[] {
    const npData = this.numpy.array(data);
    const result = axis !== undefined
      ? this.numpy.mean(npData, { axis })
      : this.numpy.mean(npData);
    return this.toJs(result);
  }

  /**
   * Median
   */
  median(data: number[], axis?: number): number | number[] {
    const npData = this.numpy.array(data);
    const result = axis !== undefined
      ? this.numpy.median(npData, { axis })
      : this.numpy.median(npData);
    return this.toJs(result);
  }

  /**
   * Standard deviation
   */
  std(data: number[], ddof: number = 0, axis?: number): number | number[] {
    const npData = this.numpy.array(data);
    const result = axis !== undefined
      ? this.numpy.std(npData, { ddof, axis })
      : this.numpy.std(npData, { ddof });
    return this.toJs(result);
  }

  /**
   * Variance
   */
  var(data: number[], ddof: number = 0, axis?: number): number | number[] {
    const npData = this.numpy.array(data);
    const result = axis !== undefined
      ? this.numpy.var(npData, { ddof, axis })
      : this.numpy.var(npData, { ddof });
    return this.toJs(result);
  }

  /**
   * Percentile
   */
  percentile(data: number[], q: number | number[], axis?: number): number | number[] {
    const npData = this.numpy.array(data);
    const result = axis !== undefined
      ? this.numpy.percentile(npData, q, { axis })
      : this.numpy.percentile(npData, q);
    return this.toJs(result);
  }

  /**
   * Quantile
   */
  quantile(data: number[], q: number | number[], axis?: number): number | number[] {
    const npData = this.numpy.array(data);
    const result = axis !== undefined
      ? this.numpy.quantile(npData, q, { axis })
      : this.numpy.quantile(npData, q);
    return this.toJs(result);
  }

  /**
   * Mode
   */
  mode(data: number[]): { mode: number; count: number } {
    const npData = this.numpy.array(data);
    const result = this.stats.mode(npData);
    return {
      mode: this.toJs(result.mode[0]),
      count: this.toJs(result.count[0])
    };
  }

  /**
   * Skewness
   */
  skew(data: number[], bias: boolean = true): number {
    const npData = this.numpy.array(data);
    return this.stats.skew(npData, bias);
  }

  /**
   * Kurtosis
   */
  kurtosis(data: number[], fisher: boolean = true, bias: boolean = true): number {
    const npData = this.numpy.array(data);
    return this.stats.kurtosis(npData, fisher, bias);
  }

  /**
   * Geometric mean
   */
  geometricMean(data: number[]): number {
    const npData = this.numpy.array(data);
    return this.stats.gmean(npData);
  }

  /**
   * Harmonic mean
   */
  harmonicMean(data: number[]): number {
    const npData = this.numpy.array(data);
    return this.stats.hmean(npData);
  }

  /**
   * Coefficient of variation
   */
  coefficientOfVariation(data: number[], ddof: number = 0): number {
    const npData = this.numpy.array(data);
    return this.stats.variation(npData, { ddof });
  }

  // ============================================================================
  // Hypothesis Testing
  // ============================================================================

  /**
   * Independent samples t-test
   */
  ttest(a: number[], b: number[], alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'): TestResult {
    const npA = this.numpy.array(a);
    const npB = this.numpy.array(b);
    const result = this.stats.ttest_ind(npA, npB, { alternative });

    return {
      statistic: result.statistic,
      pvalue: result.pvalue
    };
  }

  /**
   * One-sample t-test
   */
  ttest1Samp(data: number[], popmean: number, alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'): TestResult {
    const npData = this.numpy.array(data);
    const result = this.stats.ttest_1samp(npData, popmean, { alternative });

    return {
      statistic: result.statistic,
      pvalue: result.pvalue
    };
  }

  /**
   * Paired samples t-test
   */
  ttestRel(a: number[], b: number[], alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'): TestResult {
    const npA = this.numpy.array(a);
    const npB = this.numpy.array(b);
    const result = this.stats.ttest_rel(npA, npB, { alternative });

    return {
      statistic: result.statistic,
      pvalue: result.pvalue
    };
  }

  /**
   * Kolmogorov-Smirnov test
   */
  kstest(data: number[], distribution: string = 'norm', args: any[] = []): TestResult {
    const npData = this.numpy.array(data);
    const result = this.stats.kstest(npData, distribution, args);

    return {
      statistic: result.statistic,
      pvalue: result.pvalue
    };
  }

  /**
   * Shapiro-Wilk test for normality
   */
  shapiro(data: number[]): TestResult {
    const npData = this.numpy.array(data);
    const result = this.stats.shapiro(npData);

    return {
      statistic: result.statistic,
      pvalue: result.pvalue
    };
  }

  /**
   * Anderson-Darling test
   */
  anderson(data: number[], dist: string = 'norm'): {
    statistic: number;
    criticalValues: number[];
    significanceLevels: number[];
  } {
    const npData = this.numpy.array(data);
    const result = this.stats.anderson(npData, dist);

    return {
      statistic: result.statistic,
      criticalValues: this.toJs(result.critical_values),
      significanceLevels: this.toJs(result.significance_level)
    };
  }

  /**
   * Chi-square test
   */
  chisquare(observed: number[], expected?: number[]): TestResult {
    const npObserved = this.numpy.array(observed);
    const result = expected
      ? this.stats.chisquare(npObserved, this.numpy.array(expected))
      : this.stats.chisquare(npObserved);

    return {
      statistic: result.statistic,
      pvalue: result.pvalue,
      df: result.df || observed.length - 1
    };
  }

  /**
   * One-way ANOVA
   */
  anova(...groups: number[][]): ANOVAResult {
    const npGroups = groups.map(g => this.numpy.array(g));
    const result = this.stats.f_oneway(...npGroups);

    const totalN = groups.reduce((sum, g) => sum + g.length, 0);
    const dfBetween = groups.length - 1;
    const dfWithin = totalN - groups.length;

    return {
      F: result.statistic,
      pvalue: result.pvalue,
      dfBetween,
      dfWithin
    };
  }

  /**
   * Mann-Whitney U test
   */
  mannwhitneyu(a: number[], b: number[], alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'): TestResult {
    const npA = this.numpy.array(a);
    const npB = this.numpy.array(b);
    const result = this.stats.mannwhitneyu(npA, npB, { alternative });

    return {
      statistic: result.statistic,
      pvalue: result.pvalue
    };
  }

  /**
   * Wilcoxon signed-rank test
   */
  wilcoxon(a: number[], b?: number[], alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'): TestResult {
    const npA = this.numpy.array(a);
    const result = b
      ? this.stats.wilcoxon(npA, this.numpy.array(b), { alternative })
      : this.stats.wilcoxon(npA, { alternative });

    return {
      statistic: result.statistic,
      pvalue: result.pvalue
    };
  }

  /**
   * Kruskal-Wallis H test
   */
  kruskal(...groups: number[][]): TestResult {
    const npGroups = groups.map(g => this.numpy.array(g));
    const result = this.stats.kruskal(...npGroups);

    return {
      statistic: result.statistic,
      pvalue: result.pvalue
    };
  }

  /**
   * Friedman test
   */
  friedman(...groups: number[][]): TestResult {
    const npGroups = groups.map(g => this.numpy.array(g));
    const result = this.stats.friedmanchisquare(...npGroups);

    return {
      statistic: result.statistic,
      pvalue: result.pvalue
    };
  }

  // ============================================================================
  // Correlation and Regression
  // ============================================================================

  /**
   * Pearson correlation coefficient
   */
  pearsonr(x: number[], y: number[]): CorrelationResult {
    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);
    const result = this.stats.pearsonr(npX, npY);

    return {
      coefficient: result.statistic || result[0],
      pvalue: result.pvalue || result[1]
    };
  }

  /**
   * Spearman rank correlation
   */
  spearmanr(x: number[], y: number[]): CorrelationResult {
    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);
    const result = this.stats.spearmanr(npX, npY);

    return {
      coefficient: result.statistic || result.correlation,
      pvalue: result.pvalue
    };
  }

  /**
   * Kendall's tau
   */
  kendalltau(x: number[], y: number[]): CorrelationResult {
    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);
    const result = this.stats.kendalltau(npX, npY);

    return {
      coefficient: result.statistic || result.correlation,
      pvalue: result.pvalue
    };
  }

  /**
   * Correlation matrix
   */
  correlationMatrix(data: number[][]): number[][] {
    const npData = this.numpy.array(data);
    const result = this.numpy.corrcoef(npData);
    return this.toJs(result);
  }

  /**
   * Covariance matrix
   */
  covarianceMatrix(data: number[][], rowvar: boolean = true): number[][] {
    const npData = this.numpy.array(data);
    const result = this.numpy.cov(npData, { rowvar });
    return this.toJs(result);
  }

  /**
   * Linear regression
   */
  linregress(x: number[], y: number[]): RegressionResult {
    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);
    const result = this.stats.linregress(npX, npY);

    return {
      slope: result.slope,
      intercept: result.intercept,
      rvalue: result.rvalue,
      pvalue: result.pvalue,
      stderr: result.stderr,
      intercept_stderr: result.intercept_stderr
    };
  }

  /**
   * Polynomial fitting
   */
  polyfit(x: number[], y: number[], deg: number): {
    coefficients: number[];
    residuals: number[];
    rank: number;
    singularValues: number[];
    rcond: number;
  } {
    const npX = this.numpy.array(x);
    const npY = this.numpy.array(y);
    const result = this.numpy.polyfit(npX, npY, deg, { full: true });

    return {
      coefficients: this.toJs(result[0]),
      residuals: this.toJs(result[1]),
      rank: result[2],
      singularValues: this.toJs(result[3]),
      rcond: result[4]
    };
  }

  /**
   * Polynomial evaluation
   */
  polyval(coefficients: number[], x: number[]): number[] {
    const npCoeffs = this.numpy.array(coefficients);
    const npX = this.numpy.array(x);
    const result = this.numpy.polyval(npCoeffs, npX);
    return this.toJs(result);
  }

  // ============================================================================
  // Distribution Operations
  // ============================================================================

  /**
   * Fit distribution to data
   */
  fitDistribution(data: number[], distribution: string): DistributionFit {
    const npData = this.numpy.array(data);
    const dist = (this.stats as any)[distribution];

    // Fit distribution
    const params = dist.fit(npData);

    // Perform Kolmogorov-Smirnov test
    const ksResult = this.stats.kstest(npData, distribution, params);

    return {
      params: this.toJs(params),
      ksStatistic: ksResult.statistic,
      pvalue: ksResult.pvalue
    };
  }

  /**
   * Generate random variates
   */
  rvs(distribution: string, size: number, params: any[] = []): number[] {
    const dist = (this.stats as any)[distribution];
    const result = dist.rvs(...params, size);
    return this.toJs(result);
  }

  /**
   * Probability density function
   */
  pdf(distribution: string, x: number[], params: any[] = []): number[] {
    const dist = (this.stats as any)[distribution];
    const npX = this.numpy.array(x);
    const result = dist.pdf(npX, ...params);
    return this.toJs(result);
  }

  /**
   * Cumulative distribution function
   */
  cdf(distribution: string, x: number[], params: any[] = []): number[] {
    const dist = (this.stats as any)[distribution];
    const npX = this.numpy.array(x);
    const result = dist.cdf(npX, ...params);
    return this.toJs(result);
  }

  /**
   * Percent point function (inverse CDF)
   */
  ppf(distribution: string, q: number[], params: any[] = []): number[] {
    const dist = (this.stats as any)[distribution];
    const npQ = this.numpy.array(q);
    const result = dist.ppf(npQ, ...params);
    return this.toJs(result);
  }

  /**
   * Survival function (1 - CDF)
   */
  sf(distribution: string, x: number[], params: any[] = []): number[] {
    const dist = (this.stats as any)[distribution];
    const npX = this.numpy.array(x);
    const result = dist.sf(npX, ...params);
    return this.toJs(result);
  }

  // ============================================================================
  // Contingency Tables
  // ============================================================================

  /**
   * Chi-square test for contingency tables
   */
  chi2Contingency(observed: number[][]): ContingencyResult {
    const npObserved = this.numpy.array(observed);
    const result = this.stats.chi2_contingency(npObserved);

    return {
      chi2: result[0],
      pvalue: result[1],
      dof: result[2],
      expected: this.toJs(result[3])
    };
  }

  /**
   * Fisher's exact test
   */
  fisherExact(table: number[][]): { oddsRatio: number; pvalue: number } {
    const npTable = this.numpy.array(table);
    const result = this.stats.fisher_exact(npTable);

    return {
      oddsRatio: result[0],
      pvalue: result[1]
    };
  }

  // ============================================================================
  // Advanced Statistical Methods
  // ============================================================================

  /**
   * Bootstrap confidence intervals
   */
  bootstrap(data: number[], statistic: (d: number[]) => number, nBootstrap: number = 10000, confidence: number = 0.95): {
    mean: number;
    lower: number;
    upper: number;
    distribution: number[];
  } {
    const npData = this.numpy.array(data);
    const bootstrapStats: number[] = [];

    for (let i = 0; i < nBootstrap; i++) {
      // Resample with replacement
      const indices = Array.from({ length: data.length }, () =>
        Math.floor(Math.random() * data.length)
      );
      const sample = indices.map(idx => data[idx]);
      bootstrapStats.push(statistic(sample));
    }

    const sorted = [...bootstrapStats].sort((a, b) => a - b);
    const alpha = 1 - confidence;
    const lowerIdx = Math.floor(alpha / 2 * nBootstrap);
    const upperIdx = Math.floor((1 - alpha / 2) * nBootstrap);

    return {
      mean: this.mean(bootstrapStats) as number,
      lower: sorted[lowerIdx],
      upper: sorted[upperIdx],
      distribution: bootstrapStats
    };
  }

  /**
   * Permutation test
   */
  permutationTest(
    a: number[],
    b: number[],
    statistic: (x: number[], y: number[]) => number,
    nPermutations: number = 10000
  ): { statistic: number; pvalue: number } {
    const combined = [...a, ...b];
    const nA = a.length;
    const observedStat = statistic(a, b);
    let extremeCount = 0;

    for (let i = 0; i < nPermutations; i++) {
      // Shuffle combined array
      const shuffled = [...combined].sort(() => Math.random() - 0.5);
      const permA = shuffled.slice(0, nA);
      const permB = shuffled.slice(nA);
      const permStat = statistic(permA, permB);

      if (Math.abs(permStat) >= Math.abs(observedStat)) {
        extremeCount++;
      }
    }

    return {
      statistic: observedStat,
      pvalue: extremeCount / nPermutations
    };
  }

  /**
   * Moving average
   */
  movingAverage(data: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length - window + 1; i++) {
      const windowData = data.slice(i, i + window);
      result.push(this.mean(windowData) as number);
    }
    return result;
  }

  /**
   * Exponential moving average
   */
  exponentialMovingAverage(data: number[], alpha: number): number[] {
    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
    }
    return result;
  }

  /**
   * Z-score normalization
   */
  zscore(data: number[], axis?: number): number[] | number[][] {
    const npData = this.numpy.array(data);
    const result = this.stats.zscore(npData, { axis });
    return this.toJs(result);
  }

  /**
   * Rank data
   */
  rankdata(data: number[], method: 'average' | 'min' | 'max' | 'dense' | 'ordinal' = 'average'): number[] {
    const npData = this.numpy.array(data);
    const result = this.stats.rankdata(npData, method);
    return this.toJs(result);
  }

  /**
   * Entropy
   */
  entropy(pk: number[], qk?: number[], base?: number): number {
    const npPk = this.numpy.array(pk);
    if (qk) {
      const npQk = this.numpy.array(qk);
      return base
        ? this.stats.entropy(npPk, npQk, base)
        : this.stats.entropy(npPk, npQk);
    }
    return base
      ? this.stats.entropy(npPk, null, base)
      : this.stats.entropy(npPk);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Convert Python object to JavaScript
   */
  private toJs(pyObj: any): any {
    if (pyObj === null || pyObj === undefined) {
      return pyObj;
    }

    if (typeof pyObj === 'number' || typeof pyObj === 'string' || typeof pyObj === 'boolean') {
      return pyObj;
    }

    if (pyObj.tolist) {
      return pyObj.tolist();
    }

    if (pyObj.item) {
      return pyObj.item();
    }

    return pyObj;
  }

  /**
   * Calculate effect size (Cohen's d)
   */
  cohensD(a: number[], b: number[]): number {
    const meanA = this.mean(a) as number;
    const meanB = this.mean(b) as number;
    const stdA = this.std(a, 1) as number;
    const stdB = this.std(b, 1) as number;

    const pooledStd = Math.sqrt(((a.length - 1) * stdA ** 2 + (b.length - 1) * stdB ** 2) / (a.length + b.length - 2));

    return (meanA - meanB) / pooledStd;
  }

  /**
   * Statistical power analysis
   */
  power(effectSize: number, nobs: number, alpha: number = 0.05, alternative: 'two-sided' | 'larger' | 'smaller' = 'two-sided'): number {
    // Simplified power calculation using normal approximation
    const z_alpha = alternative === 'two-sided' ? 1.96 : 1.645;
    const ncp = effectSize * Math.sqrt(nobs);
    const z_beta = ncp - z_alpha;

    // Use cumulative normal distribution
    const power = 1 - this.normalCDF(-z_beta);
    return power;
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }
}

export default Statistics;
