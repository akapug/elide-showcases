/**
 * Stock Market Analysis Example
 *
 * This example demonstrates financial data analysis using pandas, numpy,
 * and matplotlib directly in TypeScript through Elide's polyglot syntax.
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
 * Stock Data Generator
 */
class StockDataGenerator {
  /**
   * Generate synthetic stock price data
   */
  static generateStockData(
    ticker: string,
    startDate: string,
    periods: number
  ): any {
    const dates = pandas.date_range(startDate, { periods, freq: 'D' });

    // Generate realistic stock prices with trend, volatility, and mean reversion
    const trend = numpy.linspace(100, 150, periods);
    const volatility = numpy.random.randn(periods).cumsum() * 2;
    const seasonal = 10 * numpy.sin(numpy.linspace(0, 4 * Math.PI, periods));
    const noise = numpy.random.randn(periods) * 3;

    const close = trend + volatility + seasonal + noise;

    // Generate OHLC data
    const open = close + numpy.random.randn(periods) * 2;
    const high = numpy.maximum(open, close) + numpy.random.rand(periods) * 5;
    const low = numpy.minimum(open, close) - numpy.random.rand(periods) * 5;
    const volume = numpy.random.randint(1000000, 10000000, periods);

    const df = pandas.DataFrame({
      Date: dates,
      Open: open,
      High: high,
      Low: low,
      Close: close,
      Volume: volume,
      Ticker: ticker
    });

    df.set_index('Date', { inplace: true });

    return df;
  }

  /**
   * Generate multiple stock datasets
   */
  static generateMultipleStocks(
    tickers: string[],
    startDate: string,
    periods: number
  ): Map<string, any> {
    const stocks = new Map<string, any>();

    for (const ticker of tickers) {
      stocks.set(ticker, this.generateStockData(ticker, startDate, periods));
    }

    return stocks;
  }
}

/**
 * Technical Indicators
 */
class TechnicalIndicators {
  /**
   * Simple Moving Average
   */
  static calculateSMA(data: any, window: number): any {
    return data.rolling({ window }).mean();
  }

  /**
   * Exponential Moving Average
   */
  static calculateEMA(data: any, span: number): any {
    return data.ewm({ span, adjust: false }).mean();
  }

  /**
   * Bollinger Bands
   */
  static calculateBollingerBands(data: any, window: number, num_std: number): any {
    const sma = this.calculateSMA(data, window);
    const std = data.rolling({ window }).std();

    return {
      upper: sma + (std * num_std),
      middle: sma,
      lower: sma - (std * num_std)
    };
  }

  /**
   * Relative Strength Index (RSI)
   */
  static calculateRSI(data: any, window: number = 14): any {
    const delta = data.diff();
    const gain = delta.clip({ lower: 0 });
    const loss = -delta.clip({ upper: 0 });

    const avg_gain = gain.rolling({ window }).mean();
    const avg_loss = loss.rolling({ window }).mean();

    const rs = avg_gain / avg_loss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  /**
   * Moving Average Convergence Divergence (MACD)
   */
  static calculateMACD(data: any, fast: number = 12, slow: number = 26, signal: number = 9): any {
    const ema_fast = this.calculateEMA(data, fast);
    const ema_slow = this.calculateEMA(data, slow);
    const macd_line = ema_fast - ema_slow;
    const signal_line = macd_line.ewm({ span: signal, adjust: false }).mean();
    const histogram = macd_line - signal_line;

    return {
      macd: macd_line,
      signal: signal_line,
      histogram
    };
  }

  /**
   * Average True Range (ATR)
   */
  static calculateATR(high: any, low: any, close: any, window: number = 14): any {
    const hl = high - low;
    const hc = (high - close.shift(1)).abs();
    const lc = (low - close.shift(1)).abs();

    const tr = pandas.concat([hl, hc, lc], { axis: 1 }).max({ axis: 1 });
    const atr = tr.rolling({ window }).mean();

    return atr;
  }

  /**
   * Stochastic Oscillator
   */
  static calculateStochastic(high: any, low: any, close: any, window: number = 14): any {
    const lowest_low = low.rolling({ window }).min();
    const highest_high = high.rolling({ window }).max();

    const k = ((close - lowest_low) / (highest_high - lowest_low)) * 100;
    const d = k.rolling({ window: 3 }).mean();

    return { k, d };
  }
}

/**
 * Stock Analysis
 */
class StockAnalysis {
  /**
   * Basic statistics
   */
  static analyzeBasicStats(df: any, ticker: string): void {
    console.log(`\n=== Basic Statistics for ${ticker} ===\n`);

    const close = df['Close'];

    console.log('Price Statistics:');
    console.log(`Mean: $${close.mean().toFixed(2)}`);
    console.log(`Median: $${close.median().toFixed(2)}`);
    console.log(`Std Dev: $${close.std().toFixed(2)}`);
    console.log(`Min: $${close.min().toFixed(2)}`);
    console.log(`Max: $${close.max().toFixed(2)}`);

    // Daily returns
    const returns = close.pct_change();
    console.log('\nDaily Returns:');
    console.log(`Mean: ${(returns.mean() * 100).toFixed(4)}%`);
    console.log(`Std Dev: ${(returns.std() * 100).toFixed(4)}%`);
    console.log(`Min: ${(returns.min() * 100).toFixed(2)}%`);
    console.log(`Max: ${(returns.max() * 100).toFixed(2)}%`);

    // Volume statistics
    const volume = df['Volume'];
    console.log('\nVolume Statistics:');
    console.log(`Average: ${(volume.mean() / 1000000).toFixed(2)}M`);
    console.log(`Max: ${(volume.max() / 1000000).toFixed(2)}M`);
  }

  /**
   * Calculate returns
   */
  static calculateReturns(df: any, ticker: string): void {
    console.log(`\n=== Returns Analysis for ${ticker} ===\n`);

    const close = df['Close'];

    // Daily returns
    df['Daily_Return'] = close.pct_change();

    // Cumulative returns
    df['Cumulative_Return'] = (1 + df['Daily_Return']).cumprod() - 1;

    // Log returns
    df['Log_Return'] = numpy.log(close / close.shift(1));

    console.log('Latest returns:');
    console.log(df[['Daily_Return', 'Cumulative_Return', 'Log_Return']].tail().toString());

    // Total return
    const total_return = (close.iloc(-1) / close.iloc(0) - 1) * 100;
    console.log(`\nTotal Return: ${total_return.toFixed(2)}%`);

    // Annualized return (assuming 252 trading days)
    const n_days = df.shape[0];
    const annualized = ((close.iloc(-1) / close.iloc(0)) ** (252 / n_days) - 1) * 100;
    console.log(`Annualized Return: ${annualized.toFixed(2)}%`);
  }

  /**
   * Risk metrics
   */
  static analyzeRisk(df: any, ticker: string): void {
    console.log(`\n=== Risk Metrics for ${ticker} ===\n`);

    const returns = df['Close'].pct_change().dropna();

    // Volatility (annualized)
    const volatility = returns.std() * Math.sqrt(252) * 100;
    console.log(`Annualized Volatility: ${volatility.toFixed(2)}%`);

    // Value at Risk (VaR) - 95% confidence
    const var_95 = returns.quantile(0.05) * 100;
    console.log(`VaR (95%): ${var_95.toFixed(2)}%`);

    // Conditional VaR (CVaR) - Expected Shortfall
    const cvar_95 = returns[returns <= returns.quantile(0.05)].mean() * 100;
    console.log(`CVaR (95%): ${cvar_95.toFixed(2)}%`);

    // Maximum Drawdown
    const cumulative = (1 + returns).cumprod();
    const running_max = cumulative.cummax();
    const drawdown = (cumulative - running_max) / running_max;
    const max_drawdown = drawdown.min() * 100;

    console.log(`Maximum Drawdown: ${max_drawdown.toFixed(2)}%`);

    // Sharpe Ratio (assuming 2% risk-free rate)
    const risk_free_rate = 0.02;
    const excess_returns = returns.mean() * 252 - risk_free_rate;
    const sharpe = excess_returns / (returns.std() * Math.sqrt(252));
    console.log(`Sharpe Ratio: ${sharpe.toFixed(2)}`);
  }

  /**
   * Add technical indicators to dataframe
   */
  static addTechnicalIndicators(df: any): void {
    console.log('\n=== Adding Technical Indicators ===\n');

    const close = df['Close'];
    const high = df['High'];
    const low = df['Low'];

    // Moving averages
    df['SMA_20'] = TechnicalIndicators.calculateSMA(close, 20);
    df['SMA_50'] = TechnicalIndicators.calculateSMA(close, 50);
    df['EMA_12'] = TechnicalIndicators.calculateEMA(close, 12);
    df['EMA_26'] = TechnicalIndicators.calculateEMA(close, 26);

    // Bollinger Bands
    const bb = TechnicalIndicators.calculateBollingerBands(close, 20, 2);
    df['BB_Upper'] = bb.upper;
    df['BB_Middle'] = bb.middle;
    df['BB_Lower'] = bb.lower;

    // RSI
    df['RSI'] = TechnicalIndicators.calculateRSI(close, 14);

    // MACD
    const macd = TechnicalIndicators.calculateMACD(close);
    df['MACD'] = macd.macd;
    df['MACD_Signal'] = macd.signal;
    df['MACD_Histogram'] = macd.histogram;

    // ATR
    df['ATR'] = TechnicalIndicators.calculateATR(high, low, close, 14);

    // Stochastic
    const stoch = TechnicalIndicators.calculateStochastic(high, low, close, 14);
    df['Stoch_K'] = stoch.k;
    df['Stoch_D'] = stoch.d;

    console.log('Technical indicators added:');
    console.log('- SMA (20, 50)');
    console.log('- EMA (12, 26)');
    console.log('- Bollinger Bands (20, 2)');
    console.log('- RSI (14)');
    console.log('- MACD (12, 26, 9)');
    console.log('- ATR (14)');
    console.log('- Stochastic (14, 3)');
  }

  /**
   * Identify trading signals
   */
  static identifySignals(df: any, ticker: string): void {
    console.log(`\n=== Trading Signals for ${ticker} ===\n`);

    // Moving average crossover
    df['MA_Signal'] = 0;
    const ma_cross = (df['SMA_20'] > df['SMA_50']).astype('int');
    df['MA_Signal'] = ma_cross.diff();

    // RSI signals
    df['RSI_Signal'] = 0;
    df.loc[df['RSI'] < 30, 'RSI_Signal'] = 1; // Oversold - Buy
    df.loc[df['RSI'] > 70, 'RSI_Signal'] = -1; // Overbought - Sell

    // MACD signals
    df['MACD_Signal_Trade'] = 0;
    const macd_cross = (df['MACD'] > df['MACD_Signal']).astype('int');
    df['MACD_Signal_Trade'] = macd_cross.diff();

    // Count signals
    const buy_signals = df[df['MA_Signal'] === 1].shape[0];
    const sell_signals = df[df['MA_Signal'] === -1].shape[0];

    console.log('Moving Average Crossover:');
    console.log(`Buy signals: ${buy_signals}`);
    console.log(`Sell signals: ${sell_signals}`);

    const rsi_buy = df[df['RSI_Signal'] === 1].shape[0];
    const rsi_sell = df[df['RSI_Signal'] === -1].shape[0];

    console.log('\nRSI Signals:');
    console.log(`Oversold (Buy): ${rsi_buy}`);
    console.log(`Overbought (Sell): ${rsi_sell}`);

    const macd_buy = df[df['MACD_Signal_Trade'] === 1].shape[0];
    const macd_sell = df[df['MACD_Signal_Trade'] === -1].shape[0];

    console.log('\nMACD Signals:');
    console.log(`Bullish crossover: ${macd_buy}`);
    console.log(`Bearish crossover: ${macd_sell}`);
  }
}

/**
 * Portfolio Analysis
 */
class PortfolioAnalysis {
  /**
   * Analyze portfolio of multiple stocks
   */
  static analyzePortfolio(stocks: Map<string, any>): void {
    console.log('\n=== Portfolio Analysis ===\n');

    // Combine close prices
    const tickers = Array.from(stocks.keys());
    const close_prices: any = {};

    for (const ticker of tickers) {
      close_prices[ticker] = stocks.get(ticker)['Close'];
    }

    const portfolio_df = pandas.DataFrame(close_prices);

    console.log('Portfolio composition:', tickers.join(', '));
    console.log(`\nNumber of stocks: ${tickers.length}`);
    console.log(`Period: ${portfolio_df.shape[0]} days`);

    // Calculate returns
    const returns = portfolio_df.pct_change().dropna();

    console.log('\nAverage Daily Returns:');
    console.log(returns.mean().toString());

    console.log('\nAnnualized Returns:');
    const annual_returns = returns.mean() * 252 * 100;
    console.log(annual_returns.toString());

    // Correlation matrix
    console.log('\nCorrelation Matrix:');
    const corr = returns.corr();
    console.log(corr.toString());

    // Portfolio stats (equal weight)
    const n_stocks = tickers.length;
    const weights = Array(n_stocks).fill(1 / n_stocks);
    const portfolio_return = returns.mean().mul(weights).sum();
    const portfolio_volatility = Math.sqrt(
      returns.cov().mul(numpy.outer(weights, weights)).sum().sum()
    );

    console.log('\nEqual-Weight Portfolio:');
    console.log(`Expected Daily Return: ${(portfolio_return * 100).toFixed(4)}%`);
    console.log(`Daily Volatility: ${(portfolio_volatility * 100).toFixed(4)}%`);
    console.log(`Annualized Return: ${(portfolio_return * 252 * 100).toFixed(2)}%`);
    console.log(`Annualized Volatility: ${(portfolio_volatility * Math.sqrt(252) * 100).toFixed(2)}%`);

    // Sharpe ratio
    const risk_free = 0.02;
    const sharpe = (portfolio_return * 252 - risk_free) / (portfolio_volatility * Math.sqrt(252));
    console.log(`Sharpe Ratio: ${sharpe.toFixed(2)}`);
  }

  /**
   * Calculate efficient frontier
   */
  static efficientFrontier(stocks: Map<string, any>): void {
    console.log('\n=== Efficient Frontier ===\n');

    const tickers = Array.from(stocks.keys());
    const close_prices: any = {};

    for (const ticker of tickers) {
      close_prices[ticker] = stocks.get(ticker)['Close'];
    }

    const portfolio_df = pandas.DataFrame(close_prices);
    const returns = portfolio_df.pct_change().dropna();

    const mean_returns = returns.mean() * 252;
    const cov_matrix = returns.cov() * 252;

    console.log('Expected Annual Returns:');
    console.log(mean_returns.toString());

    console.log('\nAnnual Covariance Matrix:');
    console.log(cov_matrix.toString());

    // Simulate random portfolios
    const n_portfolios = 5000;
    const n_assets = tickers.length;

    console.log(`\nSimulating ${n_portfolios} random portfolios...`);

    const results: number[][] = [];

    for (let i = 0; i < n_portfolios; i++) {
      // Random weights
      const weights = numpy.random.random(n_assets);
      const normalized_weights = weights / weights.sum();

      // Calculate portfolio return and risk
      const portfolio_return = mean_returns.mul(normalized_weights).sum();
      const portfolio_std = Math.sqrt(
        cov_matrix.mul(numpy.outer(normalized_weights, normalized_weights)).sum().sum()
      );

      const sharpe = (portfolio_return - 0.02) / portfolio_std;

      results.push([portfolio_return, portfolio_std, sharpe]);
    }

    const results_df = pandas.DataFrame(results, {
      columns: ['Return', 'Risk', 'Sharpe']
    });

    console.log('\nTop 5 Portfolios by Sharpe Ratio:');
    const top5 = results_df.sort_values('Sharpe', { ascending: false }).head(5);
    console.log(top5.toString());

    const max_sharpe = results_df.loc[results_df['Sharpe'].idxmax()];
    console.log('\nOptimal Portfolio (Max Sharpe):');
    console.log(`Return: ${(max_sharpe['Return'] * 100).toFixed(2)}%`);
    console.log(`Risk: ${(max_sharpe['Risk'] * 100).toFixed(2)}%`);
    console.log(`Sharpe: ${max_sharpe['Sharpe'].toFixed(2)}`);
  }
}

/**
 * Visualization
 */
class StockVisualization {
  /**
   * Plot stock price with moving averages
   */
  static plotPriceChart(df: any, ticker: string): void {
    console.log(`\n=== Plotting Price Chart for ${ticker} ===\n`);

    matplotlib.figure({ figsize: [14, 8] });

    // Price and moving averages
    matplotlib.subplot(2, 1, 1);
    matplotlib.plot(df.index, df['Close'], { label: 'Close Price', linewidth: 1.5 });
    matplotlib.plot(df.index, df['SMA_20'], { label: 'SMA 20', linewidth: 1, alpha: 0.7 });
    matplotlib.plot(df.index, df['SMA_50'], { label: 'SMA 50', linewidth: 1, alpha: 0.7 });

    matplotlib.fill_between(
      df.index,
      df['BB_Lower'],
      df['BB_Upper'],
      { alpha: 0.2, label: 'Bollinger Bands' }
    );

    matplotlib.title(`${ticker} - Price and Moving Averages`, { fontsize: 14 });
    matplotlib.ylabel('Price ($)');
    matplotlib.legend({ loc: 'upper left' });
    matplotlib.grid(true, { alpha: 0.3 });

    // Volume
    matplotlib.subplot(2, 1, 2);
    matplotlib.bar(df.index, df['Volume'], { alpha: 0.7, color: 'skyblue' });
    matplotlib.title('Volume');
    matplotlib.ylabel('Volume');
    matplotlib.grid(true, { alpha: 0.3 });

    matplotlib.tight_layout();
    matplotlib.savefig(`${ticker}_price_chart.png`, { dpi: 300 });
    matplotlib.close();

    console.log(`Chart saved to ${ticker}_price_chart.png`);
  }

  /**
   * Plot technical indicators
   */
  static plotIndicators(df: any, ticker: string): void {
    console.log(`\n=== Plotting Indicators for ${ticker} ===\n`);

    matplotlib.figure({ figsize: [14, 12] });

    // RSI
    matplotlib.subplot(3, 1, 1);
    matplotlib.plot(df.index, df['RSI'], { linewidth: 1.5 });
    matplotlib.axhline({ y: 70, color: 'r', linestyle: '--', alpha: 0.5 });
    matplotlib.axhline({ y: 30, color: 'g', linestyle: '--', alpha: 0.5 });
    matplotlib.fill_between(df.index, 30, 70, { alpha: 0.1 });
    matplotlib.title(`${ticker} - RSI`, { fontsize: 12 });
    matplotlib.ylabel('RSI');
    matplotlib.grid(true, { alpha: 0.3 });

    // MACD
    matplotlib.subplot(3, 1, 2);
    matplotlib.plot(df.index, df['MACD'], { label: 'MACD', linewidth: 1.5 });
    matplotlib.plot(df.index, df['MACD_Signal'], { label: 'Signal', linewidth: 1.5 });
    matplotlib.bar(df.index, df['MACD_Histogram'], { label: 'Histogram', alpha: 0.5 });
    matplotlib.title('MACD', { fontsize: 12 });
    matplotlib.legend();
    matplotlib.grid(true, { alpha: 0.3 });

    // Stochastic
    matplotlib.subplot(3, 1, 3);
    matplotlib.plot(df.index, df['Stoch_K'], { label: '%K', linewidth: 1.5 });
    matplotlib.plot(df.index, df['Stoch_D'], { label: '%D', linewidth: 1.5 });
    matplotlib.axhline({ y: 80, color: 'r', linestyle: '--', alpha: 0.5 });
    matplotlib.axhline({ y: 20, color: 'g', linestyle: '--', alpha: 0.5 });
    matplotlib.title('Stochastic Oscillator', { fontsize: 12 });
    matplotlib.ylabel('Stochastic');
    matplotlib.legend();
    matplotlib.grid(true, { alpha: 0.3 });

    matplotlib.tight_layout();
    matplotlib.savefig(`${ticker}_indicators.png`, { dpi: 300 });
    matplotlib.close();

    console.log(`Indicators chart saved to ${ticker}_indicators.png`);
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('='.repeat(80));
  console.log('STOCK MARKET ANALYSIS - POLYGLOT DATA SCIENCE');
  console.log('='.repeat(80));

  // Generate stock data
  console.log('\n=== Generating Stock Data ===\n');
  const tickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
  const stocks = StockDataGenerator.generateMultipleStocks(
    tickers,
    '2024-01-01',
    252 // 1 year of trading days
  );

  console.log(`Generated data for ${tickers.length} stocks`);
  console.log(`Period: 252 trading days`);

  // Analyze individual stock
  const ticker = 'AAPL';
  const df = stocks.get(ticker);

  console.log(`\nAnalyzing ${ticker}...`);

  StockAnalysis.analyzeBasicStats(df, ticker);
  StockAnalysis.calculateReturns(df, ticker);
  StockAnalysis.analyzeRisk(df, ticker);
  StockAnalysis.addTechnicalIndicators(df);
  StockAnalysis.identifySignals(df, ticker);

  // Visualizations
  StockVisualization.plotPriceChart(df, ticker);
  StockVisualization.plotIndicators(df, ticker);

  // Portfolio analysis
  PortfolioAnalysis.analyzePortfolio(stocks);
  PortfolioAnalysis.efficientFrontier(stocks);

  console.log('\n' + '='.repeat(80));
  console.log('STOCK ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

// Run the analysis
if (require.main === module) {
  main();
}

export {
  StockDataGenerator,
  TechnicalIndicators,
  StockAnalysis,
  PortfolioAnalysis,
  StockVisualization
};
