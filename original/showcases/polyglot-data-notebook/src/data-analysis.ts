/**
 * Advanced Data Analysis with Pandas in TypeScript
 *
 * This module demonstrates advanced data manipulation, analysis, and exploration
 * using pandas directly in TypeScript through Elide's polyglot syntax.
 */

// ============================================================================
// PYTHON LIBRARY IMPORTS - Polyglot Magic!
// ============================================================================

// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import matplotlib from 'python:matplotlib.pyplot';
// @ts-ignore
import seaborn from 'python:seaborn';

/**
 * Advanced DataFrame Operations
 */
class AdvancedDataFrameOps {
  /**
   * Multi-level indexing (hierarchical indexing)
   */
  static multiIndexing(): void {
    console.log('=== Multi-Level Indexing ===\n');

    // Create multi-index DataFrame
    const arrays = [
      ['A', 'A', 'B', 'B', 'C', 'C'],
      ['one', 'two', 'one', 'two', 'one', 'two']
    ];
    const tuples = arrays[0].map((item, i) => [item, arrays[1][i]]);
    const index = pandas.MultiIndex.from_tuples(tuples, { names: ['first', 'second'] });

    const df = pandas.DataFrame({
      data1: numpy.random.randn(6),
      data2: numpy.random.randn(6)
    }, { index });

    console.log('Multi-indexed DataFrame:');
    console.log(df.toString());

    // Access data
    console.log('\nAccess level "A":');
    console.log(df.loc['A'].toString());

    console.log('\nAccess "B", "one":');
    console.log(df.loc[['B', 'one']].toString());

    // Stacking and unstacking
    console.log('\nUnstacked:');
    console.log(df.unstack().toString());

    console.log('\nStacked back:');
    console.log(df.unstack().stack().toString());

    // Swapping levels
    console.log('\nSwap levels:');
    console.log(df.swaplevel().toString());
  }

  /**
   * Pivot tables and cross-tabulation
   */
  static pivotTables(): void {
    console.log('\n=== Pivot Tables ===\n');

    // Create sample sales data
    const df = pandas.DataFrame({
      date: pandas.date_range('2024-01-01', { periods: 100, freq: 'D' }),
      region: numpy.random.choice(['North', 'South', 'East', 'West'], 100),
      product: numpy.random.choice(['A', 'B', 'C'], 100),
      sales: numpy.random.randint(100, 1000, 100),
      quantity: numpy.random.randint(1, 20, 100)
    });

    // Add month column
    df['month'] = df['date'].dt.month;

    console.log('Sample data:');
    console.log(df.head(10).toString());

    // Simple pivot table
    console.log('\nPivot: Sales by region and product:');
    const pivot1 = pandas.pivot_table(
      df,
      { values: 'sales', index: 'region', columns: 'product', aggfunc: 'sum' }
    );
    console.log(pivot1.toString());

    // Multi-value pivot table
    console.log('\nPivot: Multiple aggregations:');
    const pivot2 = pandas.pivot_table(
      df,
      {
        values: ['sales', 'quantity'],
        index: 'region',
        columns: 'product',
        aggfunc: { sales: 'sum', quantity: 'mean' }
      }
    );
    console.log(pivot2.toString());

    // Pivot with margins
    console.log('\nPivot with totals:');
    const pivot3 = pandas.pivot_table(
      df,
      {
        values: 'sales',
        index: 'region',
        columns: 'product',
        aggfunc: 'sum',
        margins: true
      }
    );
    console.log(pivot3.toString());

    // Cross-tabulation
    console.log('\nCross-tabulation:');
    const crosstab = pandas.crosstab(df['region'], df['product']);
    console.log(crosstab.toString());
  }

  /**
   * Window functions
   */
  static windowFunctions(): void {
    console.log('\n=== Window Functions ===\n');

    // Create time series data
    const dates = pandas.date_range('2024-01-01', { periods: 60, freq: 'D' });
    const values = numpy.cumsum(numpy.random.randn(60)) + 100;

    const df = pandas.DataFrame({
      date: dates,
      value: values
    });

    console.log('Time series data:');
    console.log(df.head(10).toString());

    // Rolling mean
    df['rolling_mean_7'] = df['value'].rolling({ window: 7 }).mean();
    df['rolling_mean_14'] = df['value'].rolling({ window: 14 }).mean();

    console.log('\nWith rolling means:');
    console.log(df.head(20).toString());

    // Rolling standard deviation
    df['rolling_std_7'] = df['value'].rolling({ window: 7 }).std();

    // Exponential moving average
    df['ema_7'] = df['value'].ewm({ span: 7 }).mean();
    df['ema_14'] = df['value'].ewm({ span: 14 }).mean();

    console.log('\nWith EMA:');
    console.log(df.tail(10).toString());

    // Expanding window
    df['expanding_mean'] = df['value'].expanding().mean();
    df['expanding_max'] = df['value'].expanding().max();

    console.log('\nWith expanding window:');
    console.log(df.tail(10).toString());

    // Custom rolling function
    const rolling_range = df['value'].rolling({ window: 7 }).apply(
      (x: any) => numpy.max(x) - numpy.min(x)
    );
    df['rolling_range'] = rolling_range;

    console.log('\nWith rolling range:');
    console.log(df.tail(10).toString());
  }

  /**
   * String operations
   */
  static stringOperations(): void {
    console.log('\n=== String Operations ===\n');

    const df = pandas.DataFrame({
      name: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams'],
      email: ['john@example.com', 'jane@test.org', 'bob@demo.net', 'alice@sample.io'],
      phone: ['123-456-7890', '987-654-3210', '555-123-4567', '444-987-6543']
    });

    console.log('Original data:');
    console.log(df.toString());

    // String case operations
    df['name_upper'] = df['name'].str.upper();
    df['name_lower'] = df['name'].str.lower();
    df['name_title'] = df['name'].str.title();

    console.log('\nCase operations:');
    console.log(df[['name', 'name_upper', 'name_lower']].toString());

    // String splitting
    const name_parts = df['name'].str.split(' ', { expand: true });
    df['first_name'] = name_parts[0];
    df['last_name'] = name_parts[1];

    console.log('\nSplit names:');
    console.log(df[['name', 'first_name', 'last_name']].toString());

    // Extract patterns
    df['email_domain'] = df['email'].str.extract('(@.+)');
    df['area_code'] = df['phone'].str.extract('(\\d{3})');

    console.log('\nExtracted patterns:');
    console.log(df[['email', 'email_domain', 'phone', 'area_code']].toString());

    // String contains
    const has_com = df['email'].str.contains('.com');
    console.log('\nEmails with .com:');
    console.log(df[has_com].toString());

    // String replacement
    df['phone_clean'] = df['phone'].str.replace('-', '');

    console.log('\nCleaned phone numbers:');
    console.log(df[['phone', 'phone_clean']].toString());

    // String length
    df['name_length'] = df['name'].str.len();

    console.log('\nName lengths:');
    console.log(df[['name', 'name_length']].toString());
  }

  /**
   * Categorical data
   */
  static categoricalData(): void {
    console.log('\n=== Categorical Data ===\n');

    const df = pandas.DataFrame({
      id: numpy.arange(1, 101),
      size: numpy.random.choice(['Small', 'Medium', 'Large', 'XLarge'], 100),
      color: numpy.random.choice(['Red', 'Blue', 'Green'], 100),
      rating: numpy.random.choice(['Poor', 'Fair', 'Good', 'Excellent'], 100)
    });

    console.log('Original data:');
    console.log(df.head(10).toString());
    console.log(`\nMemory usage: ${df.memory_usage({ deep: true }).sum()} bytes`);

    // Convert to categorical
    df['size'] = pandas.Categorical(
      df['size'],
      { categories: ['Small', 'Medium', 'Large', 'XLarge'], ordered: true }
    );
    df['color'] = pandas.Categorical(df['color']);
    df['rating'] = pandas.Categorical(
      df['rating'],
      { categories: ['Poor', 'Fair', 'Good', 'Excellent'], ordered: true }
    );

    console.log('\nAfter converting to categorical:');
    console.log(df.dtypes.toString());
    console.log(`\nMemory usage: ${df.memory_usage({ deep: true }).sum()} bytes`);

    // Categorical operations
    console.log('\nSize categories:');
    console.log(df['size'].cat.categories);

    console.log('\nRating value counts:');
    console.log(df['rating'].value_counts().sort_index().toString());

    // Comparison (only works for ordered categorical)
    const large_items = df[df['size'] >= 'Large'];
    console.log('\nLarge and XLarge items:');
    console.log(large_items.head(10).toString());

    // Add categories
    df['size'] = df['size'].cat.add_categories(['XXLarge']);
    console.log('\nUpdated categories:', df['size'].cat.categories);
  }

  /**
   * Memory optimization
   */
  static memoryOptimization(): void {
    console.log('\n=== Memory Optimization ===\n');

    // Create large DataFrame
    const n = 100000;
    const df = pandas.DataFrame({
      int_col: numpy.random.randint(0, 100, n),
      float_col: numpy.random.randn(n),
      string_col: numpy.random.choice(['A', 'B', 'C', 'D', 'E'], n),
      bool_col: numpy.random.choice([true, false], n)
    });

    console.log('Original dtypes:');
    console.log(df.dtypes.toString());
    console.log(`\nOriginal memory: ${df.memory_usage({ deep: true }).sum()} bytes`);

    // Optimize integer column
    df['int_col'] = pandas.to_numeric(df['int_col'], { downcast: 'integer' });

    // Optimize float column
    df['float_col'] = pandas.to_numeric(df['float_col'], { downcast: 'float' });

    // Convert string to category
    df['string_col'] = df['string_col'].astype('category');

    console.log('\nOptimized dtypes:');
    console.log(df.dtypes.toString());
    console.log(`\nOptimized memory: ${df.memory_usage({ deep: true }).sum()} bytes`);

    const reduction = (1 - df.memory_usage({ deep: true }).sum() /
                      df.memory_usage({ deep: true }).sum()) * 100;
    console.log(`\nMemory reduction: ~${reduction.toFixed(1)}%`);
  }
}

/**
 * Advanced Data Analysis Techniques
 */
class DataAnalysisTechniques {
  /**
   * Exploratory Data Analysis (EDA)
   */
  static exploratoryAnalysis(): void {
    console.log('\n=== Exploratory Data Analysis ===\n');

    // Create sample dataset
    const n = 1000;
    const df = pandas.DataFrame({
      age: numpy.random.randint(18, 80, n),
      income: numpy.random.lognormal(10, 1, n),
      education: numpy.random.choice(['HS', 'BA', 'MA', 'PhD'], n),
      employed: numpy.random.choice([true, false], n, { p: [0.7, 0.3] }),
      satisfaction: numpy.random.randint(1, 11, n)
    });

    console.log('Dataset overview:');
    console.log(df.head(10).toString());

    // Basic statistics
    console.log('\nDescriptive statistics:');
    console.log(df.describe().toString());

    // Distribution of categorical variables
    console.log('\nEducation distribution:');
    console.log(df['education'].value_counts().toString());

    console.log('\nEmployment rate:');
    console.log(df['employed'].value_counts(normalize=true).toString());

    // Correlation analysis
    const numeric_cols = df.select_dtypes({ include: ['number'] });
    console.log('\nCorrelation matrix:');
    console.log(numeric_cols.corr().toString());

    // Percentiles
    console.log('\nIncome percentiles:');
    for (const p of [10, 25, 50, 75, 90]) {
      const value = df['income'].quantile(p / 100);
      console.log(`${p}th: $${value.toFixed(2)}`);
    }

    // Outlier detection (IQR method)
    const Q1 = df['income'].quantile(0.25);
    const Q3 = df['income'].quantile(0.75);
    const IQR = Q3 - Q1;
    const lower_bound = Q1 - 1.5 * IQR;
    const upper_bound = Q3 + 1.5 * IQR;

    const outliers = df[(df['income'] < lower_bound) | (df['income'] > upper_bound)];
    console.log(`\nIncome outliers: ${outliers.shape[0]} (${(outliers.shape[0] / n * 100).toFixed(1)}%)`);
  }

  /**
   * Data quality checks
   */
  static dataQuality(): void {
    console.log('\n=== Data Quality Checks ===\n');

    // Create dataset with quality issues
    const df = pandas.DataFrame({
      id: [1, 2, 3, 4, 5, 5, 6, 7, 8, 9],
      name: ['Alice', 'Bob', null, 'David', 'Eve', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy'],
      age: [25, 30, 35, -5, 45, 45, 200, 28, 32, 27],
      email: ['alice@test.com', 'bob@test', 'charlie@test.com', 'david@test.com',
              'eve@test.com', 'eve@test.com', 'frank@test.com', null, 'henry@test.com', 'ivy@test.com'],
      score: [85, 92, 88, 76, 150, 95, 89, 91, 87, 83]
    });

    console.log('Dataset:');
    console.log(df.toString());

    // Missing values check
    console.log('\nMissing values:');
    const missing = df.isnull().sum();
    console.log(missing[missing > 0].toString());

    // Duplicate rows check
    console.log('\nDuplicate rows:', df.duplicated().sum());
    console.log('Duplicate rows:');
    console.log(df[df.duplicated({ keep: false })].toString());

    // Duplicate IDs check
    console.log('\nDuplicate IDs:', df['id'].duplicated().sum());

    // Value range validation
    console.log('\nInvalid ages (< 0 or > 120):');
    const invalid_ages = df[(df['age'] < 0) | (df['age'] > 120)];
    console.log(invalid_ages.toString());

    // Score validation (should be 0-100)
    console.log('\nInvalid scores (not in 0-100):');
    const invalid_scores = df[(df['score'] < 0) | (df['score'] > 100)];
    console.log(invalid_scores.toString());

    // Email format validation (simple check)
    const email_pattern = /^[^@]+@[^@]+\.[^@]+$/;
    df['valid_email'] = df['email'].apply((x: string) =>
      x ? email_pattern.test(x) : false
    );

    console.log('\nInvalid emails:');
    console.log(df[!df['valid_email']][['email']].toString());

    // Data quality report
    const total_rows = df.shape[0];
    const missing_count = df.isnull().sum().sum();
    const duplicate_count = df.duplicated().sum();

    console.log('\n--- Data Quality Report ---');
    console.log(`Total rows: ${total_rows}`);
    console.log(`Missing values: ${missing_count}`);
    console.log(`Duplicate rows: ${duplicate_count}`);
    console.log(`Invalid ages: ${invalid_ages.shape[0]}`);
    console.log(`Invalid scores: ${invalid_scores.shape[0]}`);
    console.log(`Invalid emails: ${df[!df['valid_email']].shape[0]}`);
  }

  /**
   * Feature engineering
   */
  static featureEngineering(): void {
    console.log('\n=== Feature Engineering ===\n');

    // Create sample dataset
    const df = pandas.DataFrame({
      date: pandas.date_range('2024-01-01', { periods: 100, freq: 'D' }),
      sales: numpy.random.randint(1000, 5000, 100),
      customers: numpy.random.randint(50, 200, 100),
      temperature: numpy.random.randint(-10, 35, 100)
    });

    console.log('Original features:');
    console.log(df.head(10).toString());

    // Date features
    df['year'] = df['date'].dt.year;
    df['month'] = df['date'].dt.month;
    df['day'] = df['date'].dt.day;
    df['day_of_week'] = df['date'].dt.dayofweek;
    df['week_of_year'] = df['date'].dt.isocalendar().week;
    df['is_weekend'] = df['day_of_week'].isin([5, 6]);
    df['quarter'] = df['date'].dt.quarter;

    console.log('\nDate features:');
    console.log(df[['date', 'year', 'month', 'day_of_week', 'is_weekend']].head().toString());

    // Derived features
    df['sales_per_customer'] = df['sales'] / df['customers'];
    df['sales_per_customer'] = df['sales_per_customer'].round(2);

    console.log('\nDerived features:');
    console.log(df[['sales', 'customers', 'sales_per_customer']].head().toString());

    // Binning
    df['temp_category'] = pandas.cut(
      df['temperature'],
      { bins: [-20, 0, 10, 20, 40], labels: ['Cold', 'Cool', 'Mild', 'Hot'] }
    );

    console.log('\nBinned temperature:');
    console.log(df[['temperature', 'temp_category']].head(10).toString());

    // Lag features
    df['sales_lag_1'] = df['sales'].shift(1);
    df['sales_lag_7'] = df['sales'].shift(7);

    console.log('\nLag features:');
    console.log(df[['date', 'sales', 'sales_lag_1', 'sales_lag_7']].head(10).toString());

    // Rolling features
    df['sales_roll_7'] = df['sales'].rolling({ window: 7 }).mean();
    df['sales_roll_7_std'] = df['sales'].rolling({ window: 7 }).std();

    console.log('\nRolling features:');
    console.log(df[['sales', 'sales_roll_7', 'sales_roll_7_std']].tail(10).toString());

    // Interaction features
    df['sales_temp_interaction'] = df['sales'] * df['temperature'];

    console.log('\nInteraction features:');
    console.log(df[['sales', 'temperature', 'sales_temp_interaction']].head().toString());
  }

  /**
   * Data aggregation and summarization
   */
  static aggregationSummarization(): void {
    console.log('\n=== Aggregation and Summarization ===\n');

    // Create sales dataset
    const df = pandas.DataFrame({
      date: pandas.date_range('2024-01-01', { periods: 365, freq: 'D' }),
      product: numpy.random.choice(['A', 'B', 'C', 'D'], 365),
      region: numpy.random.choice(['North', 'South', 'East', 'West'], 365),
      sales: numpy.random.randint(100, 1000, 365),
      quantity: numpy.random.randint(1, 50, 365),
      cost: numpy.random.randint(50, 500, 365)
    });

    df['profit'] = df['sales'] - df['cost'];
    df['month'] = df['date'].dt.to_period('M');

    console.log('Dataset:');
    console.log(df.head(10).toString());

    // Simple aggregation
    console.log('\nTotal sales by product:');
    console.log(df.groupby('product')['sales'].sum().toString());

    // Multiple aggregations
    console.log('\nSales statistics by region:');
    console.log(df.groupby('region')['sales'].agg(['sum', 'mean', 'std', 'min', 'max']).toString());

    // Named aggregations
    console.log('\nCustom aggregations by product:');
    const agg_result = df.groupby('product').agg({
      sales: ['sum', 'mean'],
      quantity: ['sum', 'mean'],
      profit: ['sum', 'mean']
    });
    console.log(agg_result.toString());

    // Multiple groupby keys
    console.log('\nSales by region and product:');
    console.log(df.groupby(['region', 'product'])['sales'].sum().unstack().toString());

    // Time-based aggregation
    console.log('\nMonthly sales:');
    const monthly = df.groupby('month').agg({
      sales: 'sum',
      quantity: 'sum',
      profit: 'sum'
    });
    console.log(monthly.head(12).toString());

    // Conditional aggregation
    console.log('\nHigh-value sales (>500) by region:');
    const high_value = df[df['sales'] > 500];
    console.log(high_value.groupby('region')['sales'].agg(['count', 'mean']).toString());

    // Transform (keeping original shape)
    df['region_avg_sales'] = df.groupby('region')['sales'].transform('mean');
    df['sales_vs_region_avg'] = df['sales'] - df['region_avg_sales'];

    console.log('\nSales vs region average:');
    console.log(df[['region', 'sales', 'region_avg_sales', 'sales_vs_region_avg']].head(10).toString());
  }
}

/**
 * Time Series Analysis
 */
class TimeSeriesAnalysis {
  /**
   * Time series decomposition
   */
  static decomposition(): void {
    console.log('\n=== Time Series Decomposition ===\n');

    // Create time series with trend, seasonality, and noise
    const n = 365;
    const dates = pandas.date_range('2024-01-01', { periods: n, freq: 'D' });

    const trend = numpy.linspace(100, 200, n);
    const seasonal = 30 * numpy.sin(numpy.linspace(0, 4 * Math.PI, n));
    const noise = numpy.random.normal(0, 5, n);
    const values = trend + seasonal + noise;

    const df = pandas.DataFrame({
      date: dates,
      value: values
    });

    df.set_index('date', { inplace: true });

    console.log('Time series:');
    console.log(df.head(10).toString());

    // Calculate components manually
    df['trend'] = df['value'].rolling({ window: 30, center: true }).mean();
    df['detrended'] = df['value'] - df['trend'];
    df['seasonal'] = df['detrended'].rolling({ window: 7, center: true }).mean();
    df['residual'] = df['value'] - df['trend'] - df['seasonal'];

    console.log('\nDecomposed components:');
    console.log(df.tail(10).toString());

    // Statistics
    console.log('\nComponent statistics:');
    console.log(df[['trend', 'seasonal', 'residual']].describe().toString());
  }

  /**
   * Resampling and frequency conversion
   */
  static resampling(): void {
    console.log('\n=== Time Series Resampling ===\n');

    // Create hourly data
    const dates = pandas.date_range('2024-01-01', { periods: 24 * 7, freq: 'H' });
    const values = numpy.random.randn(24 * 7).cumsum() + 100;

    const df = pandas.DataFrame({
      date: dates,
      value: values
    });

    df.set_index('date', { inplace: true });

    console.log('Hourly data:');
    console.log(df.head(24).toString());

    // Downsample to daily (mean)
    const daily = df.resample('D').mean();
    console.log('\nDaily mean:');
    console.log(daily.toString());

    // Downsample with multiple aggregations
    const daily_agg = df.resample('D').agg(['mean', 'std', 'min', 'max']);
    console.log('\nDaily aggregations:');
    console.log(daily_agg.head().toString());

    // Upsample and forward fill
    const daily_data = pandas.DataFrame({
      date: pandas.date_range('2024-01-01', { periods: 7, freq: 'D' }),
      value: numpy.random.randint(100, 200, 7)
    });
    daily_data.set_index('date', { inplace: true });

    const hourly_ff = daily_data.resample('H').ffill();
    console.log('\nUpsampled to hourly (forward fill):');
    console.log(hourly_ff.head(48).toString());
  }

  /**
   * Time series statistics
   */
  static statistics(): void {
    console.log('\n=== Time Series Statistics ===\n');

    // Create time series
    const n = 200;
    const dates = pandas.date_range('2024-01-01', { periods: n, freq: 'D' });
    const values = numpy.random.randn(n).cumsum() + 100;

    const df = pandas.DataFrame({
      date: dates,
      value: values
    });

    df.set_index('date', { inplace: true });

    // Moving averages
    df['MA_7'] = df['value'].rolling({ window: 7 }).mean();
    df['MA_30'] = df['value'].rolling({ window: 30 }).mean();

    console.log('Moving averages:');
    console.log(df.tail(10).toString());

    // Percentage change
    df['pct_change'] = df['value'].pct_change() * 100;

    console.log('\nPercentage change:');
    console.log(df[['value', 'pct_change']].tail(10).toString());

    // Difference
    df['diff'] = df['value'].diff();

    console.log('\nFirst difference:');
    console.log(df[['value', 'diff']].tail(10).toString());

    // Cumulative sum
    const returns = pandas.DataFrame({
      date: pandas.date_range('2024-01-01', { periods: 100, freq: 'D' }),
      return: numpy.random.randn(100) * 0.01
    });
    returns.set_index('date', { inplace: true });
    returns['cumulative'] = (1 + returns['return']).cumprod() - 1;

    console.log('\nCumulative returns:');
    console.log(returns.tail(10).toString());
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('='.repeat(80));
  console.log('ADVANCED DATA ANALYSIS WITH PANDAS IN TYPESCRIPT');
  console.log('='.repeat(80));

  // Advanced DataFrame Operations
  AdvancedDataFrameOps.multiIndexing();
  AdvancedDataFrameOps.pivotTables();
  AdvancedDataFrameOps.windowFunctions();
  AdvancedDataFrameOps.stringOperations();
  AdvancedDataFrameOps.categoricalData();
  AdvancedDataFrameOps.memoryOptimization();

  // Data Analysis Techniques
  DataAnalysisTechniques.exploratoryAnalysis();
  DataAnalysisTechniques.dataQuality();
  DataAnalysisTechniques.featureEngineering();
  DataAnalysisTechniques.aggregationSummarization();

  // Time Series Analysis
  TimeSeriesAnalysis.decomposition();
  TimeSeriesAnalysis.resampling();
  TimeSeriesAnalysis.statistics();

  console.log('\n' + '='.repeat(80));
  console.log('DATA ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

// Run the analysis
if (require.main === module) {
  main();
}

export {
  AdvancedDataFrameOps,
  DataAnalysisTechniques,
  TimeSeriesAnalysis
};
