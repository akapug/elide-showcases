/**
 * Time Series Forecasting Example
 *
 * This example demonstrates time series analysis and forecasting
 * using statsmodels, pandas, and scikit-learn in TypeScript.
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
// @ts-ignore
import sklearn from 'python:sklearn';

/**
 * Time Series Data Generator
 */
class TimeSeriesGenerator {
  /**
   * Generate synthetic time series with trend, seasonality, and noise
   */
  static generateTimeSeries(
    start_date: string,
    periods: number,
    freq: string = 'D'
  ): any {
    console.log('=== Generating Time Series Data ===\n');
    console.log(`Start date: ${start_date}`);
    console.log(`Periods: ${periods}`);
    console.log(`Frequency: ${freq}\n`);

    const dates = pandas.date_range(start_date, { periods, freq });

    // Components
    const t = numpy.arange(periods);

    // Trend (linear + polynomial)
    const trend = 100 + 0.5 * t + 0.001 * numpy.power(t, 2);

    // Seasonality (daily and weekly patterns)
    const daily_season = 10 * numpy.sin(2 * Math.PI * t / 7);
    const yearly_season = 15 * numpy.sin(2 * Math.PI * t / 365);

    // Noise
    const noise = numpy.random.normal(0, 5, periods);

    // Combine components
    const values = trend + daily_season + yearly_season + noise;

    const df = pandas.DataFrame({
      date: dates,
      value: values,
      trend,
      seasonality: daily_season + yearly_season,
      noise
    });

    df.set_index('date', { inplace: true });

    console.log('Generated time series components:');
    console.log('- Trend: Linear + Quadratic');
    console.log('- Seasonality: Weekly + Yearly');
    console.log('- Noise: Gaussian (σ=5)\n');

    return df;
  }

  /**
   * Generate multiple related time series
   */
  static generateMultivariate(
    start_date: string,
    periods: number,
    n_series: number = 3
  ): any {
    console.log('\n=== Generating Multivariate Time Series ===\n');

    const dates = pandas.date_range(start_date, { periods, freq: 'D' });
    const data: any = { date: dates };

    for (let i = 0; i < n_series; i++) {
      const t = numpy.arange(periods);
      const trend = 100 * (i + 1) + 0.3 * t;
      const season = 10 * (i + 1) * numpy.sin(2 * Math.PI * t / 7);
      const noise = numpy.random.normal(0, 5 * (i + 1), periods);

      data[`series_${i + 1}`] = trend + season + noise;
    }

    const df = pandas.DataFrame(data);
    df.set_index('date', { inplace: true });

    console.log(`Generated ${n_series} correlated time series`);
    console.log(`Shape: ${df.shape}\n`);

    return df;
  }
}

/**
 * Time Series Analysis
 */
class TimeSeriesAnalysis {
  /**
   * Decompose time series
   */
  static decomposeTimeSeries(df: any): void {
    console.log('\n=== Time Series Decomposition ===\n');

    // Manual decomposition (already have components)
    console.log('Time series components:');
    console.log('- Observed: Original time series');
    console.log('- Trend: Long-term progression');
    console.log('- Seasonal: Repeating patterns');
    console.log('- Residual: Random noise\n');

    console.log('Component statistics:');
    console.log(df[['trend', 'seasonality', 'noise']].describe().toString());
  }

  /**
   * Stationarity tests
   */
  static testStationarity(series: any): void {
    console.log('\n=== Stationarity Analysis ===\n');

    console.log('Testing for stationarity...\n');

    // Rolling statistics
    const window = 30;
    const rolling_mean = series.rolling({ window }).mean();
    const rolling_std = series.rolling({ window }).std();

    console.log('Rolling statistics (window=30):');
    console.log(`Mean range: ${rolling_mean.min().toFixed(2)} to ${rolling_mean.max().toFixed(2)}`);
    console.log(`Std range: ${rolling_std.min().toFixed(2)} to ${rolling_std.max().toFixed(2)}\n`);

    // First difference
    const diff = series.diff().dropna();
    console.log('First difference statistics:');
    console.log(`Mean: ${diff.mean().toFixed(4)}`);
    console.log(`Std: ${diff.std().toFixed(4)}`);

    console.log('\nNote: Use statsmodels.tsa.stattools.adfuller for formal ADF test');
  }

  /**
   * Autocorrelation analysis
   */
  static analyzeAutocorrelation(series: any, lags: number = 40): void {
    console.log('\n=== Autocorrelation Analysis ===\n');

    console.log(`Computing autocorrelation for ${lags} lags...\n`);

    // Manual autocorrelation calculation
    const autocorr: number[] = [];
    const mean = series.mean();
    const variance = series.var();

    for (let lag = 0; lag <= lags; lag++) {
      const shifted = series.shift(lag);
      const covariance = ((series - mean) * (shifted - mean)).mean();
      const corr = covariance / variance;
      autocorr.push(corr);
    }

    console.log('Significant autocorrelations (|r| > 0.2):');
    for (let i = 0; i < autocorr.length; i++) {
      if (Math.abs(autocorr[i]) > 0.2) {
        console.log(`Lag ${i}: ${autocorr[i].toFixed(4)}`);
      }
    }
  }

  /**
   * Trend analysis
   */
  static analyzeTrend(df: any): void {
    console.log('\n=== Trend Analysis ===\n');

    const series = df['value'];

    // Moving averages
    const ma7 = series.rolling({ window: 7 }).mean();
    const ma30 = series.rolling({ window: 30 }).mean();
    const ma90 = series.rolling({ window: 90 }).mean();

    console.log('Moving Averages:');
    console.log(`7-day MA: ${ma7.tail(1).values[0].toFixed(2)}`);
    console.log(`30-day MA: ${ma30.tail(1).values[0].toFixed(2)}`);
    console.log(`90-day MA: ${ma90.tail(1).values[0].toFixed(2)}\n`);

    // Trend direction
    const recent_trend = ma30.tail(30);
    const trend_direction = recent_trend.diff().mean();

    if (trend_direction > 0) {
      console.log('Trend: UPWARD');
    } else if (trend_direction < 0) {
      console.log('Trend: DOWNWARD');
    } else {
      console.log('Trend: FLAT');
    }

    console.log(`Trend strength: ${Math.abs(trend_direction).toFixed(4)}`);
  }
}

/**
 * Forecasting Models
 */
class ForecastingModels {
  /**
   * Simple moving average forecast
   */
  static movingAverageForecast(series: any, window: number = 30, horizon: number = 30): any {
    console.log('\n=== Moving Average Forecast ===\n');

    const ma = series.rolling({ window }).mean();
    const last_value = ma.iloc(-1);

    // Simple forecast: extend last MA value
    const forecast = Array(horizon).fill(last_value);

    console.log(`Window: ${window} days`);
    console.log(`Forecast horizon: ${horizon} days`);
    console.log(`Forecast value: ${last_value.toFixed(2)}\n`);

    return forecast;
  }

  /**
   * Exponential smoothing forecast
   */
  static exponentialSmoothing(series: any, alpha: number = 0.3, horizon: number = 30): any {
    console.log('\n=== Exponential Smoothing ===\n');

    // Simple exponential smoothing
    const smoothed = series.ewm({ alpha, adjust: false }).mean();
    const last_value = smoothed.iloc(-1);

    // Level-based forecast
    const forecast = Array(horizon).fill(last_value);

    console.log(`Alpha: ${alpha}`);
    console.log(`Forecast horizon: ${horizon} days`);
    console.log(`Forecast level: ${last_value.toFixed(2)}\n`);

    return forecast;
  }

  /**
   * Linear regression forecast
   */
  static linearRegressionForecast(series: any, horizon: number = 30): any {
    console.log('\n=== Linear Regression Forecast ===\n');

    const { LinearRegression } = sklearn.linear_model;

    // Prepare data
    const n = series.shape[0];
    const X = numpy.arange(n).reshape([-1, 1]);
    const y = series.values;

    // Train model
    const model = LinearRegression();
    model.fit(X, y);

    // Forecast
    const future_X = numpy.arange(n, n + horizon).reshape([-1, 1]);
    const forecast = model.predict(future_X);

    console.log(`Slope: ${model.coef_[0].toFixed(4)}`);
    console.log(`Intercept: ${model.intercept_.toFixed(2)}`);
    console.log(`Forecast horizon: ${horizon} days\n`);

    return forecast;
  }

  /**
   * Polynomial regression forecast
   */
  static polynomialForecast(series: any, degree: number = 2, horizon: number = 30): any {
    console.log('\n=== Polynomial Regression Forecast ===\n');

    const { LinearRegression } = sklearn.linear_model;
    const { PolynomialFeatures } = sklearn.preprocessing;

    // Prepare data
    const n = series.shape[0];
    const X = numpy.arange(n).reshape([-1, 1]);
    const y = series.values;

    // Transform features
    const poly = PolynomialFeatures({ degree });
    const X_poly = poly.fit_transform(X);

    // Train model
    const model = LinearRegression();
    model.fit(X_poly, y);

    // Forecast
    const future_X = numpy.arange(n, n + horizon).reshape([-1, 1]);
    const future_X_poly = poly.transform(future_X);
    const forecast = model.predict(future_X_poly);

    console.log(`Polynomial degree: ${degree}`);
    console.log(`Forecast horizon: ${horizon} days`);
    console.log(`R² score: ${model.score(X_poly, y).toFixed(4)}\n`);

    return forecast;
  }

  /**
   * ARIMA-style forecast (simplified)
   */
  static arimaForecast(series: any, horizon: number = 30): any {
    console.log('\n=== ARIMA-style Forecast ===\n');

    console.log('For full ARIMA, use:');
    console.log('// @ts-ignore');
    console.log("import ARIMA from 'python:statsmodels.tsa.arima.model';");
    console.log('');
    console.log('const model = ARIMA(series, { order: [1, 1, 1] });');
    console.log('const fitted = model.fit();');
    console.log('const forecast = fitted.forecast({ steps: horizon });');
    console.log('');

    // Simple AR(1) approximation
    const diff = series.diff().dropna();
    const lag1 = diff.shift(1).dropna();
    const current = diff.iloc({ slice: [1, null] }).values;

    const correlation = numpy.corrcoef(lag1.values, current)[0][1];
    const last_diff = diff.iloc(-1);

    // Forecast
    const forecast: number[] = [];
    let current_level = series.iloc(-1);
    let current_diff = last_diff;

    for (let i = 0; i < horizon; i++) {
      current_diff = current_diff * correlation;
      current_level += current_diff;
      forecast.push(current_level);
    }

    console.log(`AR(1) coefficient: ${correlation.toFixed(4)}`);
    console.log(`Forecast horizon: ${horizon} days\n`);

    return forecast;
  }
}

/**
 * Forecast Evaluation
 */
class ForecastEvaluation {
  /**
   * Calculate forecast errors
   */
  static calculateErrors(actual: any, forecast: any): any {
    const errors = actual - forecast;
    const abs_errors = numpy.abs(errors);
    const squared_errors = numpy.power(errors, 2);

    const mae = numpy.mean(abs_errors);
    const mse = numpy.mean(squared_errors);
    const rmse = numpy.sqrt(mse);
    const mape = numpy.mean(numpy.abs(errors / actual)) * 100;

    return { mae, mse, rmse, mape, errors };
  }

  /**
   * Compare forecast methods
   */
  static compareMethods(
    actual: any,
    forecasts: Map<string, any>
  ): void {
    console.log('\n=== Forecast Method Comparison ===\n');

    const results: any[] = [];

    for (const [method, forecast] of forecasts.entries()) {
      const metrics = this.calculateErrors(actual, forecast);

      results.push({
        method,
        mae: metrics.mae,
        rmse: metrics.rmse,
        mape: metrics.mape
      });

      console.log(`${method}:`);
      console.log(`  MAE: ${metrics.mae.toFixed(4)}`);
      console.log(`  RMSE: ${metrics.rmse.toFixed(4)}`);
      console.log(`  MAPE: ${metrics.mape.toFixed(2)}%`);
    }

    // Find best method
    const maes = results.map((r: any) => r.mae);
    const best_idx = maes.indexOf(Math.min(...maes));

    console.log(`\nBest Method: ${results[best_idx].method} (MAE: ${results[best_idx].mae.toFixed(4)})`);
  }

  /**
   * Cross-validation for time series
   */
  static timeSeriesCV(series: any, n_splits: number = 5): void {
    console.log('\n=== Time Series Cross-Validation ===\n');

    const { TimeSeriesSplit } = sklearn.model_selection;

    const tscv = TimeSeriesSplit({ n_splits });

    console.log(`Number of splits: ${n_splits}`);
    console.log('Train/Test splits:\n');

    const splits = tscv.split(series.values);
    let split_num = 1;

    for (const [train_idx, test_idx] of splits) {
      console.log(`Split ${split_num}:`);
      console.log(`  Train: ${train_idx.length} samples`);
      console.log(`  Test: ${test_idx.length} samples`);
      split_num++;
    }
  }
}

/**
 * Visualization
 */
class TimeSeriesVisualization {
  /**
   * Plot time series with components
   */
  static plotDecomposition(df: any): void {
    console.log('\n=== Plotting Decomposition ===\n');

    matplotlib.figure({ figsize: [14, 10] });

    // Observed
    matplotlib.subplot(4, 1, 1);
    matplotlib.plot(df.index, df['value'], { linewidth: 1 });
    matplotlib.title('Observed', { fontsize: 12 });
    matplotlib.grid(true, { alpha: 0.3 });

    // Trend
    matplotlib.subplot(4, 1, 2);
    matplotlib.plot(df.index, df['trend'], { color: 'orange', linewidth: 2 });
    matplotlib.title('Trend', { fontsize: 12 });
    matplotlib.grid(true, { alpha: 0.3 });

    // Seasonality
    matplotlib.subplot(4, 1, 3);
    matplotlib.plot(df.index, df['seasonality'], { color: 'green', linewidth: 1 });
    matplotlib.title('Seasonality', { fontsize: 12 });
    matplotlib.grid(true, { alpha: 0.3 });

    // Noise
    matplotlib.subplot(4, 1, 4);
    matplotlib.plot(df.index, df['noise'], { color: 'red', linewidth: 0.5, alpha: 0.7 });
    matplotlib.title('Residual/Noise', { fontsize: 12 });
    matplotlib.grid(true, { alpha: 0.3 });

    matplotlib.tight_layout();
    matplotlib.savefig('time_series_decomposition.png', { dpi: 300 });
    matplotlib.close();

    console.log('Decomposition plot saved to time_series_decomposition.png');
  }

  /**
   * Plot forecasts
   */
  static plotForecasts(
    historical: any,
    forecasts: Map<string, any>,
    horizon: number
  ): void {
    console.log('\n=== Plotting Forecasts ===\n');

    const n = historical.shape[0];
    const historical_dates = historical.index;
    const last_date = historical_dates[-1];

    // Generate future dates
    const future_dates = pandas.date_range(
      last_date,
      { periods: horizon + 1, freq: 'D' }
    ).slice([1, null]);

    matplotlib.figure({ figsize: [14, 8] });

    // Plot historical data
    matplotlib.plot(
      historical_dates,
      historical.values,
      { label: 'Historical', color: 'black', linewidth: 2 }
    );

    // Plot forecasts
    const colors = ['blue', 'red', 'green', 'orange', 'purple'];
    let color_idx = 0;

    for (const [method, forecast] of forecasts.entries()) {
      matplotlib.plot(
        future_dates,
        forecast,
        {
          label: method,
          color: colors[color_idx % colors.length],
          linewidth: 2,
          linestyle: '--'
        }
      );
      color_idx++;
    }

    matplotlib.title('Time Series Forecasts', { fontsize: 14, fontweight: 'bold' });
    matplotlib.xlabel('Date');
    matplotlib.ylabel('Value');
    matplotlib.legend({ loc: 'best' });
    matplotlib.grid(true, { alpha: 0.3 });

    matplotlib.tight_layout();
    matplotlib.savefig('forecasts.png', { dpi: 300 });
    matplotlib.close();

    console.log('Forecasts plot saved to forecasts.png');
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('='.repeat(80));
  console.log('TIME SERIES FORECASTING - POLYGLOT DATA SCIENCE');
  console.log('='.repeat(80));

  // Generate time series data
  const df = TimeSeriesGenerator.generateTimeSeries('2024-01-01', 365);

  console.log('\nTime series overview:');
  console.log(df.head().toString());

  // Decomposition
  TimeSeriesAnalysis.decomposeTimeSeries(df);
  TimeSeriesVisualization.plotDecomposition(df);

  // Stationarity analysis
  TimeSeriesAnalysis.testStationarity(df['value']);

  // Autocorrelation
  TimeSeriesAnalysis.analyzeAutocorrelation(df['value'], 40);

  // Trend analysis
  TimeSeriesAnalysis.analyzeTrend(df);

  // Split data for forecasting
  const train_size = 335; // 335 days for training, 30 for testing
  const train = df['value'].iloc({ slice: [0, train_size] });
  const test = df['value'].iloc({ slice: [train_size, null] });

  console.log(`\nTrain size: ${train.shape[0]} days`);
  console.log(`Test size: ${test.shape[0]} days`);

  // Generate forecasts
  const horizon = test.shape[0];
  const forecasts = new Map<string, any>();

  forecasts.set(
    'Moving Average',
    ForecastingModels.movingAverageForecast(train, 30, horizon)
  );

  forecasts.set(
    'Exponential Smoothing',
    ForecastingModels.exponentialSmoothing(train, 0.3, horizon)
  );

  forecasts.set(
    'Linear Regression',
    ForecastingModels.linearRegressionForecast(train, horizon)
  );

  forecasts.set(
    'Polynomial (degree 2)',
    ForecastingModels.polynomialForecast(train, 2, horizon)
  );

  forecasts.set(
    'ARIMA-style',
    ForecastingModels.arimaForecast(train, horizon)
  );

  // Evaluate forecasts
  ForecastEvaluation.compareMethods(test.values, forecasts);

  // Visualize forecasts
  TimeSeriesVisualization.plotForecasts(train, forecasts, horizon);

  // Cross-validation
  ForecastEvaluation.timeSeriesCV(df['value'], 5);

  console.log('\n' + '='.repeat(80));
  console.log('TIME SERIES FORECASTING COMPLETE');
  console.log('='.repeat(80));
}

// Run the analysis
if (require.main === module) {
  main();
}

export {
  TimeSeriesGenerator,
  TimeSeriesAnalysis,
  ForecastingModels,
  ForecastEvaluation,
  TimeSeriesVisualization
};
