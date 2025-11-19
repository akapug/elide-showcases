/**
 * Feature Engineering with pandas and numpy in TypeScript
 *
 * Demonstrates importing pandas and numpy for advanced data preprocessing
 * and feature engineering directly in TypeScript using Elide's polyglot.
 */

// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import scipy from 'python:scipy';

/**
 * Main Feature Engineering Pipeline
 */
export class FeatureEngineer {
  private df: any;
  private feature_transformers: Record<string, any>;
  private scaler: any;
  private encoder: any;

  constructor(df?: any) {
    this.df = df;
    this.feature_transformers = {};
  }

  /**
   * Load data from various sources
   */
  loadData(path: string): any {
    console.log(`Loading data from ${path}`);

    if (path.endsWith('.csv')) {
      this.df = pandas.read_csv(path);
    } else if (path.endsWith('.json')) {
      this.df = pandas.read_json(path);
    } else if (path.endsWith('.parquet')) {
      this.df = pandas.read_parquet(path);
    } else if (path.endsWith('.xlsx')) {
      this.df = pandas.read_excel(path);
    } else if (path.endsWith('.sql')) {
      // @ts-ignore
      const sqlite3 = require('python:sqlite3');
      const conn = sqlite3.connect(path);
      this.df = pandas.read_sql_query('SELECT * FROM table_name', conn);
    }

    console.log(`Loaded ${this.df.shape[0]} rows and ${this.df.shape[1]} columns`);
    return this.df;
  }

  /**
   * Basic data cleaning
   */
  cleanData(): any {
    console.log('Cleaning data...');

    // Remove duplicate rows
    const n_duplicates = this.df.duplicated().sum();
    if (n_duplicates > 0) {
      console.log(`Removing ${n_duplicates} duplicate rows`);
      this.df = this.df.drop_duplicates();
    }

    // Handle missing values
    this.handleMissingValues();

    // Remove outliers
    this.removeOutliers();

    // Fix data types
    this.fixDataTypes();

    console.log('Data cleaning completed');
    return this.df;
  }

  /**
   * Handle missing values intelligently
   */
  handleMissingValues(strategy: 'drop' | 'impute' | 'predict' = 'impute'): void {
    console.log('Handling missing values...');

    const missing_counts = this.df.isnull().sum();
    const total_missing = missing_counts.sum();

    if (total_missing === 0) {
      console.log('No missing values found');
      return;
    }

    console.log(`Total missing values: ${total_missing}`);

    if (strategy === 'drop') {
      // Drop rows with any missing values
      this.df = this.df.dropna();
    } else if (strategy === 'impute') {
      // Separate numeric and categorical columns
      const numeric_cols = this.df.select_dtypes({ include: ['number'] }).columns.tolist();
      const categorical_cols = this.df.select_dtypes({
        include: ['object', 'category']
      }).columns.tolist();

      // Numeric: impute with median
      for (const col of numeric_cols) {
        if (this.df[col].isnull().any()) {
          const median = this.df[col].median();
          this.df[col] = this.df[col].fillna(median);
        }
      }

      // Categorical: impute with mode
      for (const col of categorical_cols) {
        if (this.df[col].isnull().any()) {
          const mode = this.df[col].mode()[0];
          this.df[col] = this.df[col].fillna(mode);
        }
      }
    } else if (strategy === 'predict') {
      // Use KNN imputation
      const imputer = new sklearn.impute.KNNImputer({ n_neighbors: 5 });
      const numeric_cols = this.df.select_dtypes({ include: ['number'] }).columns.tolist();

      if (numeric_cols.length > 0) {
        this.df[numeric_cols] = imputer.fit_transform(this.df[numeric_cols]);
      }
    }

    console.log('Missing values handled');
  }

  /**
   * Remove outliers using IQR method
   */
  removeOutliers(multiplier: number = 1.5): void {
    console.log('Removing outliers...');

    const numeric_cols = this.df.select_dtypes({ include: ['number'] }).columns.tolist();
    let total_outliers = 0;

    for (const col of numeric_cols) {
      const Q1 = this.df[col].quantile(0.25);
      const Q3 = this.df[col].quantile(0.75);
      const IQR = Q3 - Q1;

      const lower_bound = Q1 - multiplier * IQR;
      const upper_bound = Q3 + multiplier * IQR;

      const outlier_mask = this.df[col].lt(lower_bound) | this.df[col].gt(upper_bound);
      const n_outliers = outlier_mask.sum();

      if (n_outliers > 0) {
        console.log(`  ${col}: ${n_outliers} outliers`);
        total_outliers += n_outliers;

        // Cap outliers instead of removing
        this.df[col] = this.df[col].clip({ lower: lower_bound, upper: upper_bound });
      }
    }

    console.log(`Total outliers capped: ${total_outliers}`);
  }

  /**
   * Fix data types
   */
  fixDataTypes(): void {
    console.log('Fixing data types...');

    for (const col of this.df.columns) {
      const dtype = this.df[col].dtype;

      // Convert object columns that should be numeric
      if (dtype === 'object') {
        try {
          this.df[col] = pandas.to_numeric(this.df[col], { errors: 'ignore' });
        } catch (e) {
          // Keep as is
        }
      }

      // Convert to datetime if column name suggests it
      if (col.toLowerCase().includes('date') || col.toLowerCase().includes('time')) {
        try {
          this.df[col] = pandas.to_datetime(this.df[col], { errors: 'ignore' });
        } catch (e) {
          // Keep as is
        }
      }

      // Convert to category for low cardinality object columns
      if (dtype === 'object' && this.df[col].nunique() < 50) {
        this.df[col] = this.df[col].astype('category');
      }
    }

    console.log('Data types fixed');
  }

  /**
   * Create polynomial features
   */
  createPolynomialFeatures(columns: string[], degree: number = 2): any {
    console.log(`Creating polynomial features (degree ${degree})...`);

    const poly = new sklearn.preprocessing.PolynomialFeatures({
      degree: degree,
      include_bias: false
    });

    const X = this.df[columns];
    const X_poly = poly.fit_transform(X);
    const feature_names = poly.get_feature_names_out(columns);

    // Add polynomial features to dataframe
    const poly_df = pandas.DataFrame(X_poly, {
      columns: feature_names,
      index: this.df.index
    });

    this.df = pandas.concat([this.df, poly_df], { axis: 1 });

    console.log(`Created ${feature_names.length} polynomial features`);
    return this.df;
  }

  /**
   * Create interaction features
   */
  createInteractionFeatures(column_pairs: [string, string][]): any {
    console.log('Creating interaction features...');

    for (const [col1, col2] of column_pairs) {
      const interaction_name = `${col1}_x_${col2}`;
      this.df[interaction_name] = this.df[col1] * this.df[col2];

      console.log(`  Created ${interaction_name}`);
    }

    return this.df;
  }

  /**
   * Create ratio features
   */
  createRatioFeatures(column_pairs: [string, string][]): any {
    console.log('Creating ratio features...');

    for (const [numerator, denominator] of column_pairs) {
      const ratio_name = `${numerator}_div_${denominator}`;

      // Avoid division by zero
      this.df[ratio_name] = this.df[numerator] / (this.df[denominator] + 1e-10);

      console.log(`  Created ${ratio_name}`);
    }

    return this.df;
  }

  /**
   * Create mathematical transformation features
   */
  createMathTransformations(columns: string[]): any {
    console.log('Creating mathematical transformations...');

    for (const col of columns) {
      const values = this.df[col];

      // Log transformation (for positive values)
      if (values.min() > 0) {
        this.df[`log_${col}`] = numpy.log1p(values);
      }

      // Square root transformation (for non-negative values)
      if (values.min() >= 0) {
        this.df[`sqrt_${col}`] = numpy.sqrt(values);
      }

      // Square transformation
      this.df[`square_${col}`] = numpy.square(values);

      // Cube root transformation
      this.df[`cbrt_${col}`] = numpy.cbrt(values);

      // Reciprocal transformation (avoid division by zero)
      this.df[`reciprocal_${col}`] = 1 / (values + 1e-10);
    }

    console.log(`Created transformations for ${columns.length} columns`);
    return this.df;
  }

  /**
   * Create binning features
   */
  createBinningFeatures(
    columns: string[],
    n_bins: number = 5,
    strategy: 'uniform' | 'quantile' = 'quantile'
  ): any {
    console.log('Creating binning features...');

    for (const col of columns) {
      if (strategy === 'uniform') {
        this.df[`${col}_binned`] = pandas.cut(this.df[col], {
          bins: n_bins,
          labels: false
        });
      } else {
        this.df[`${col}_binned`] = pandas.qcut(
          this.df[col],
          { q: n_bins, labels: false, duplicates: 'drop' }
        );
      }

      console.log(`  Created ${col}_binned`);
    }

    return this.df;
  }

  /**
   * Create aggregation features by group
   */
  createAggregationFeatures(
    group_cols: string[],
    agg_cols: string[],
    agg_funcs: string[] = ['mean', 'std', 'min', 'max', 'median']
  ): any {
    console.log('Creating aggregation features...');

    const grouped = this.df.groupby(group_cols);

    for (const col of agg_cols) {
      for (const func of agg_funcs) {
        const feature_name = `${group_cols.join('_')}_${col}_${func}`;
        const agg_values = grouped[col].transform(func);
        this.df[feature_name] = agg_values;

        console.log(`  Created ${feature_name}`);
      }
    }

    return this.df;
  }

  /**
   * Create time-based features
   */
  createTimeFeatures(datetime_col: string): any {
    console.log('Creating time-based features...');

    // Ensure column is datetime
    if (this.df[datetime_col].dtype !== 'datetime64[ns]') {
      this.df[datetime_col] = pandas.to_datetime(this.df[datetime_col]);
    }

    const dt = this.df[datetime_col];

    // Extract time components
    this.df[`${datetime_col}_year`] = dt.dt.year;
    this.df[`${datetime_col}_month`] = dt.dt.month;
    this.df[`${datetime_col}_day`] = dt.dt.day;
    this.df[`${datetime_col}_dayofweek`] = dt.dt.dayofweek;
    this.df[`${datetime_col}_dayofyear`] = dt.dt.dayofyear;
    this.df[`${datetime_col}_quarter`] = dt.dt.quarter;
    this.df[`${datetime_col}_weekofyear`] = dt.dt.isocalendar().week;
    this.df[`${datetime_col}_hour`] = dt.dt.hour;
    this.df[`${datetime_col}_minute`] = dt.dt.minute;

    // Cyclical encoding for periodic features
    this.df[`${datetime_col}_month_sin`] = numpy.sin(2 * numpy.pi * dt.dt.month / 12);
    this.df[`${datetime_col}_month_cos`] = numpy.cos(2 * numpy.pi * dt.dt.month / 12);
    this.df[`${datetime_col}_day_sin`] = numpy.sin(2 * numpy.pi * dt.dt.day / 31);
    this.df[`${datetime_col}_day_cos`] = numpy.cos(2 * numpy.pi * dt.dt.day / 31);
    this.df[`${datetime_col}_hour_sin`] = numpy.sin(2 * numpy.pi * dt.dt.hour / 24);
    this.df[`${datetime_col}_hour_cos`] = numpy.cos(2 * numpy.pi * dt.dt.hour / 24);

    // Is weekend
    this.df[`${datetime_col}_is_weekend`] = (dt.dt.dayofweek >= 5).astype('int');

    // Is month start/end
    this.df[`${datetime_col}_is_month_start`] = dt.dt.is_month_start.astype('int');
    this.df[`${datetime_col}_is_month_end`] = dt.dt.is_month_end.astype('int');

    // Is quarter start/end
    this.df[`${datetime_col}_is_quarter_start`] = dt.dt.is_quarter_start.astype('int');
    this.df[`${datetime_col}_is_quarter_end`] = dt.dt.is_quarter_end.astype('int');

    console.log('Time-based features created');
    return this.df;
  }

  /**
   * Create lag features for time series
   */
  createLagFeatures(
    columns: string[],
    lags: number[],
    group_col?: string
  ): any {
    console.log('Creating lag features...');

    for (const col of columns) {
      for (const lag of lags) {
        const feature_name = `${col}_lag_${lag}`;

        if (group_col) {
          this.df[feature_name] = this.df.groupby(group_col)[col].shift(lag);
        } else {
          this.df[feature_name] = this.df[col].shift(lag);
        }

        console.log(`  Created ${feature_name}`);
      }
    }

    return this.df;
  }

  /**
   * Create rolling window features
   */
  createRollingFeatures(
    columns: string[],
    windows: number[],
    agg_funcs: string[] = ['mean', 'std', 'min', 'max'],
    group_col?: string
  ): any {
    console.log('Creating rolling window features...');

    for (const col of columns) {
      for (const window of windows) {
        for (const func of agg_funcs) {
          const feature_name = `${col}_rolling_${window}_${func}`;

          if (group_col) {
            const rolling = this.df.groupby(group_col)[col].rolling(window);
            this.df[feature_name] = rolling[func]().reset_index({ level: 0, drop: true });
          } else {
            this.df[feature_name] = this.df[col].rolling(window)[func]();
          }

          console.log(`  Created ${feature_name}`);
        }
      }
    }

    return this.df;
  }

  /**
   * Create expanding window features
   */
  createExpandingFeatures(
    columns: string[],
    agg_funcs: string[] = ['mean', 'std', 'min', 'max'],
    group_col?: string
  ): any {
    console.log('Creating expanding window features...');

    for (const col of columns) {
      for (const func of agg_funcs) {
        const feature_name = `${col}_expanding_${func}`;

        if (group_col) {
          const expanding = this.df.groupby(group_col)[col].expanding();
          this.df[feature_name] = expanding[func]().reset_index({ level: 0, drop: true });
        } else {
          this.df[feature_name] = this.df[col].expanding()[func]();
        }

        console.log(`  Created ${feature_name}`);
      }
    }

    return this.df;
  }

  /**
   * Create statistical features
   */
  createStatisticalFeatures(columns: string[]): any {
    console.log('Creating statistical features...');

    // Create matrix from columns
    const X = this.df[columns].values;

    // Row-wise statistics
    this.df['row_mean'] = numpy.mean(X, { axis: 1 });
    this.df['row_std'] = numpy.std(X, { axis: 1 });
    this.df['row_min'] = numpy.min(X, { axis: 1 });
    this.df['row_max'] = numpy.max(X, { axis: 1 });
    this.df['row_median'] = numpy.median(X, { axis: 1 });
    this.df['row_range'] = this.df['row_max'] - this.df['row_min'];
    this.df['row_q1'] = numpy.percentile(X, 25, { axis: 1 });
    this.df['row_q3'] = numpy.percentile(X, 75, { axis: 1 });
    this.df['row_iqr'] = this.df['row_q3'] - this.df['row_q1'];

    // Skewness and kurtosis
    this.df['row_skew'] = scipy.stats.skew(X, { axis: 1 });
    this.df['row_kurtosis'] = scipy.stats.kurtosis(X, { axis: 1 });

    console.log('Statistical features created');
    return this.df;
  }

  /**
   * Create frequency encoding
   */
  createFrequencyEncoding(columns: string[]): any {
    console.log('Creating frequency encoding...');

    for (const col of columns) {
      const freq = this.df[col].value_counts({ normalize: true });
      this.df[`${col}_freq`] = this.df[col].map(freq);

      console.log(`  Created ${col}_freq`);
    }

    return this.df;
  }

  /**
   * Create target encoding
   */
  createTargetEncoding(
    columns: string[],
    target_col: string,
    smoothing: number = 10
  ): any {
    console.log('Creating target encoding...');

    const global_mean = this.df[target_col].mean();

    for (const col of columns) {
      const agg = this.df.groupby(col)[target_col].agg(['mean', 'count']);
      const smooth_mean = (
        agg['mean'] * agg['count'] + global_mean * smoothing
      ) / (agg['count'] + smoothing);

      this.df[`${col}_target_enc`] = this.df[col].map(smooth_mean);

      console.log(`  Created ${col}_target_enc`);
    }

    return this.df;
  }

  /**
   * Create one-hot encoding
   */
  createOneHotEncoding(columns: string[], max_categories: number = 10): any {
    console.log('Creating one-hot encoding...');

    for (const col of columns) {
      const n_unique = this.df[col].nunique();

      if (n_unique <= max_categories) {
        const dummies = pandas.get_dummies(this.df[col], {
          prefix: col,
          drop_first: true
        });
        this.df = pandas.concat([this.df, dummies], { axis: 1 });

        console.log(`  Created ${dummies.shape[1]} dummy variables for ${col}`);
      } else {
        console.log(`  Skipped ${col} (${n_unique} categories > ${max_categories})`);
      }
    }

    return this.df;
  }

  /**
   * Create label encoding
   */
  createLabelEncoding(columns: string[]): any {
    console.log('Creating label encoding...');

    for (const col of columns) {
      const le = new sklearn.preprocessing.LabelEncoder();
      this.df[`${col}_label_enc`] = le.fit_transform(this.df[col]);
      this.feature_transformers[`${col}_label_enc`] = le;

      console.log(`  Created ${col}_label_enc`);
    }

    return this.df;
  }

  /**
   * Create text features
   */
  createTextFeatures(text_col: string): any {
    console.log('Creating text features...');

    // Length features
    this.df[`${text_col}_length`] = this.df[text_col].str.len();
    this.df[`${text_col}_word_count`] = this.df[text_col].str.split().str.len();

    // Character counts
    this.df[`${text_col}_upper_count`] = this.df[text_col].str.count(r'[A-Z]');
    this.df[`${text_col}_lower_count`] = this.df[text_col].str.count(r'[a-z]');
    this.df[`${text_col}_digit_count`] = this.df[text_col].str.count(r'\d');
    this.df[`${text_col}_special_count`] = this.df[text_col].str.count(r'[^A-Za-z0-9\s]');
    this.df[`${text_col}_space_count`] = this.df[text_col].str.count(r'\s');

    // Ratios
    this.df[`${text_col}_upper_ratio`] = (
      this.df[`${text_col}_upper_count`] / (this.df[`${text_col}_length`] + 1)
    );
    this.df[`${text_col}_digit_ratio`] = (
      this.df[`${text_col}_digit_count`] / (this.df[`${text_col}_length`] + 1)
    );

    // Average word length
    this.df[`${text_col}_avg_word_length`] = (
      this.df[`${text_col}_length`] / (this.df[`${text_col}_word_count`] + 1)
    );

    console.log('Text features created');
    return this.df;
  }

  /**
   * Scale features
   */
  scaleFeatures(
    columns: string[],
    method: 'standard' | 'minmax' | 'robust' = 'standard'
  ): any {
    console.log(`Scaling features using ${method} scaler...`);

    if (method === 'standard') {
      this.scaler = new sklearn.preprocessing.StandardScaler();
    } else if (method === 'minmax') {
      this.scaler = new sklearn.preprocessing.MinMaxScaler();
    } else if (method === 'robust') {
      this.scaler = new sklearn.preprocessing.RobustScaler();
    }

    this.df[columns] = this.scaler.fit_transform(this.df[columns]);

    console.log('Features scaled');
    return this.df;
  }

  /**
   * Select top K features using feature importance
   */
  selectTopKFeatures(
    X: any,
    y: any,
    k: number,
    method: 'mutual_info' | 'f_classif' | 'chi2' = 'mutual_info'
  ): string[] {
    console.log(`Selecting top ${k} features using ${method}...`);

    let selector: any;

    if (method === 'mutual_info') {
      selector = sklearn.feature_selection.SelectKBest({
        score_func: sklearn.feature_selection.mutual_info_classif,
        k: k
      });
    } else if (method === 'f_classif') {
      selector = sklearn.feature_selection.SelectKBest({
        score_func: sklearn.feature_selection.f_classif,
        k: k
      });
    } else if (method === 'chi2') {
      selector = sklearn.feature_selection.SelectKBest({
        score_func: sklearn.feature_selection.chi2,
        k: k
      });
    }

    selector.fit(X, y);
    const selected_features = selector.get_support({ indices: true });
    const feature_names = X.columns[selected_features].tolist();

    console.log('Selected features:', feature_names);

    return feature_names;
  }

  /**
   * Remove highly correlated features
   */
  removeCorrelatedFeatures(threshold: number = 0.95): any {
    console.log('Removing highly correlated features...');

    const numeric_cols = this.df.select_dtypes({ include: ['number'] }).columns.tolist();
    const corr_matrix = this.df[numeric_cols].corr().abs();

    // Get upper triangle
    const upper = corr_matrix.where(
      numpy.triu(numpy.ones(corr_matrix.shape), { k: 1 }).astype('bool')
    );

    // Find features with correlation greater than threshold
    const to_drop: string[] = [];
    for (const column of upper.columns) {
      if (upper[column].max() > threshold) {
        to_drop.push(column);
      }
    }

    if (to_drop.length > 0) {
      console.log(`Dropping ${to_drop.length} highly correlated features`);
      this.df = this.df.drop(to_drop, { axis: 1 });
    }

    return this.df;
  }

  /**
   * Get transformed dataframe
   */
  getDataFrame(): any {
    return this.df;
  }

  /**
   * Save dataframe
   */
  saveDataFrame(path: string): void {
    if (path.endsWith('.csv')) {
      this.df.to_csv(path, { index: false });
    } else if (path.endsWith('.parquet')) {
      this.df.to_parquet(path, { index: false });
    } else if (path.endsWith('.json')) {
      this.df.to_json(path);
    }

    console.log(`DataFrame saved to ${path}`);
  }
}

export default FeatureEngineer;
