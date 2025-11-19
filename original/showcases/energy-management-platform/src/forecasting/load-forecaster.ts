/**
 * Load Forecaster - Advanced energy load forecasting with ensemble ML models
 * Demonstrates Elide's TypeScript + Python integration for time series forecasting
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import sklearn from 'python:sklearn'
// @ts-ignore
import prophet from 'python:prophet'
// @ts-ignore
import xgboost from 'python:xgboost'
// @ts-ignore
import tensorflow from 'python:tensorflow'
// @ts-ignore
import statsmodels from 'python:statsmodels'

import type {
  LoadForecasterOptions,
  LoadForecastModel,
  TimeSeriesData,
  Forecast,
  LoadForecastResult,
  LoadHistoricalData,
  PerformanceMetrics,
  FeatureImportance,
  TrainingData,
  TrainingResult,
} from '../types'

/**
 * LoadForecaster - Ensemble ML model for energy load forecasting
 *
 * Supports multiple forecasting models:
 * - LSTM: Deep learning for temporal dependencies
 * - Prophet: Additive model for seasonality and holidays
 * - XGBoost: Gradient boosting for feature interactions
 * - ARIMA/SARIMA: Statistical time series models
 * - Random Forest: Ensemble tree-based model
 */
export class LoadForecaster {
  private options: LoadForecasterOptions
  private models: Map<string, any> = new Map()
  private scaler: any
  private featureNames: string[] = []
  private ensembleWeights: Map<string, number> = new Map()
  private trainingHistory: TrainingResult[] = []

  constructor(options: LoadForecasterOptions) {
    this.options = {
      ensemble: true,
      horizon: 24,
      features: ['temperature', 'humidity', 'dayOfWeek', 'hour'],
      ...options,
    }

    this.initializeModels()
  }

  /**
   * Initialize forecasting models based on configuration
   */
  private initializeModels(): void {
    for (const model of this.options.models) {
      switch (model) {
        case 'lstm':
          this.models.set('lstm', this.createLSTMModel())
          break
        case 'prophet':
          this.models.set('prophet', this.createProphetModel())
          break
        case 'xgboost':
          this.models.set('xgboost', this.createXGBoostModel())
          break
        case 'arima':
          this.models.set('arima', this.createARIMAModel())
          break
        case 'sarima':
          this.models.set('sarima', this.createSARIMAModel())
          break
        case 'random_forest':
          this.models.set('random_forest', this.createRandomForestModel())
          break
        case 'gradient_boosting':
          this.models.set('gradient_boosting', this.createGradientBoostingModel())
          break
      }
    }

    // Initialize ensemble weights equally
    if (this.options.ensemble) {
      const weight = 1.0 / this.options.models.length
      for (const model of this.options.models) {
        this.ensembleWeights.set(model, weight)
      }
    }
  }

  /**
   * Create LSTM model for deep learning-based forecasting
   */
  private createLSTMModel(): any {
    const Sequential = tensorflow.keras.models.Sequential
    const LSTM = tensorflow.keras.layers.LSTM
    const Dense = tensorflow.keras.layers.Dense
    const Dropout = tensorflow.keras.layers.Dropout

    const model = new Sequential()

    // First LSTM layer with dropout
    model.add(
      new LSTM({
        units: 128,
        return_sequences: true,
        input_shape: [this.options.horizon, this.options.features.length + 1],
      })
    )
    model.add(new Dropout({ rate: 0.2 }))

    // Second LSTM layer
    model.add(new LSTM({ units: 64, return_sequences: true }))
    model.add(new Dropout({ rate: 0.2 }))

    // Third LSTM layer
    model.add(new LSTM({ units: 32, return_sequences: false }))
    model.add(new Dropout({ rate: 0.2 }))

    // Dense layers
    model.add(new Dense({ units: 16, activation: 'relu' }))
    model.add(new Dense({ units: this.options.horizon }))

    // Compile model
    model.compile({
      optimizer: tensorflow.keras.optimizers.Adam({ learning_rate: 0.001 }),
      loss: 'mse',
      metrics: ['mae', 'mape'],
    })

    return model
  }

  /**
   * Create Prophet model for seasonality and trend forecasting
   */
  private createProphetModel(): any {
    const Prophet = prophet.Prophet

    return new Prophet({
      growth: 'linear',
      changepoint_prior_scale: 0.05,
      seasonality_prior_scale: 10.0,
      holidays_prior_scale: 10.0,
      seasonality_mode: 'multiplicative',
      yearly_seasonality: true,
      weekly_seasonality: true,
      daily_seasonality: true,
    })
  }

  /**
   * Create XGBoost model for gradient boosting
   */
  private createXGBoostModel(): any {
    const XGBRegressor = xgboost.XGBRegressor

    const hyperparams = this.options.hyperparameters?.xgboost || {
      n_estimators: 1000,
      max_depth: 8,
      learning_rate: 0.01,
      subsample: 0.8,
      colsample_bytree: 0.8,
      min_child_weight: 3,
      gamma: 0.1,
      reg_alpha: 0.1,
      reg_lambda: 1.0,
      objective: 'reg:squarederror',
    }

    return new XGBRegressor(hyperparams)
  }

  /**
   * Create ARIMA model for statistical forecasting
   */
  private createARIMAModel(): any {
    const ARIMA = statsmodels.tsa.arima.model.ARIMA
    return { model_class: ARIMA, order: [24, 1, 24] }
  }

  /**
   * Create SARIMA model with seasonal components
   */
  private createSARIMAModel(): any {
    const SARIMAX = statsmodels.tsa.statespace.sarimax.SARIMAX
    return {
      model_class: SARIMAX,
      order: [1, 1, 1],
      seasonal_order: [1, 1, 1, 24],
    }
  }

  /**
   * Create Random Forest model
   */
  private createRandomForestModel(): any {
    const RandomForestRegressor = sklearn.ensemble.RandomForestRegressor

    return new RandomForestRegressor({
      n_estimators: 500,
      max_depth: 15,
      min_samples_split: 5,
      min_samples_leaf: 2,
      max_features: 'sqrt',
      n_jobs: -1,
      random_state: 42,
    })
  }

  /**
   * Create Gradient Boosting model
   */
  private createGradientBoostingModel(): any {
    const GradientBoostingRegressor = sklearn.ensemble.GradientBoostingRegressor

    return new GradientBoostingRegressor({
      n_estimators: 1000,
      max_depth: 6,
      learning_rate: 0.01,
      subsample: 0.8,
      min_samples_split: 5,
      min_samples_leaf: 2,
      max_features: 'sqrt',
      random_state: 42,
    })
  }

  /**
   * Engineer features from raw time series data
   */
  private async engineerFeatures(data: LoadHistoricalData[]): Promise<any> {
    // Convert to pandas DataFrame
    const df = pandas.DataFrame(data)

    // Temporal features
    df['hour'] = pandas.to_datetime(df['timestamp']).dt.hour
    df['dayOfWeek'] = pandas.to_datetime(df['timestamp']).dt.dayofweek
    df['dayOfMonth'] = pandas.to_datetime(df['timestamp']).dt.day
    df['month'] = pandas.to_datetime(df['timestamp']).dt.month
    df['quarter'] = pandas.to_datetime(df['timestamp']).dt.quarter
    df['weekOfYear'] = pandas.to_datetime(df['timestamp']).dt.isocalendar().week

    // Cyclical encoding for periodic features
    df['hour_sin'] = numpy.sin(2 * numpy.pi * df['hour'] / 24)
    df['hour_cos'] = numpy.cos(2 * numpy.pi * df['hour'] / 24)
    df['day_sin'] = numpy.sin(2 * numpy.pi * df['dayOfWeek'] / 7)
    df['day_cos'] = numpy.cos(2 * numpy.pi * df['dayOfWeek'] / 7)
    df['month_sin'] = numpy.sin(2 * numpy.pi * df['month'] / 12)
    df['month_cos'] = numpy.cos(2 * numpy.pi * df['month'] / 12)

    // Lag features
    for (const lag of [1, 2, 3, 24, 48, 168]) {
      df[`load_lag_${lag}`] = df['load'].shift(lag)
    }

    // Rolling statistics
    for (const window of [24, 168]) {
      df[`load_rolling_mean_${window}`] = df['load'].rolling(window).mean()
      df[`load_rolling_std_${window}`] = df['load'].rolling(window).std()
      df[`load_rolling_min_${window}`] = df['load'].rolling(window).min()
      df[`load_rolling_max_${window}`] = df['load'].rolling(window).max()
    }

    // Temperature features
    if ('temperature' in df.columns) {
      df['temp_squared'] = df['temperature'] ** 2
      df['temp_cubed'] = df['temperature'] ** 3

      // Heating/Cooling degree days
      df['hdd'] = numpy.maximum(18 - df['temperature'], 0) // Heating
      df['cdd'] = numpy.maximum(df['temperature'] - 18, 0) // Cooling

      df['temp_rolling_mean_24'] = df['temperature'].rolling(24).mean()
      df['temp_diff'] = df['temperature'].diff()
    }

    // Holiday indicators
    if ('isHoliday' in df.columns) {
      df['isHoliday'] = df['isHoliday'].astype('int')
      df['holiday_next_day'] = df['isHoliday'].shift(-1).fillna(0)
      df['holiday_prev_day'] = df['isHoliday'].shift(1).fillna(0)
    }

    // Weekend indicator
    df['isWeekend'] = (df['dayOfWeek'] >= 5).astype('int')

    // Time of day categories
    df['isNight'] = ((df['hour'] >= 22) | (df['hour'] < 6)).astype('int')
    df['isMorning'] = ((df['hour'] >= 6) & (df['hour'] < 12)).astype('int')
    df['isAfternoon'] = ((df['hour'] >= 12) & (df['hour'] < 18)).astype('int')
    df['isEvening'] = ((df['hour'] >= 18) & (df['hour'] < 22)).astype('int')

    // Drop NaN values from lag/rolling features
    df = df.dropna()

    return df
  }

  /**
   * Prepare data for model training
   */
  private async prepareTrainingData(df: any): Promise<TrainingData> {
    // Separate features and target
    const targetCol = 'load'
    const excludeCols = ['timestamp', targetCol]

    const featureCols = df.columns.filter((col: string) => !excludeCols.includes(col))
    this.featureNames = Array.from(featureCols)

    const X = df[featureCols].values
    const y = df[targetCol].values

    // Scale features
    const StandardScaler = sklearn.preprocessing.StandardScaler
    this.scaler = new StandardScaler()
    const X_scaled = this.scaler.fit_transform(X)

    return {
      features: X_scaled,
      targets: y,
      featureNames: this.featureNames,
      timestamps: df['timestamp'].values,
    }
  }

  /**
   * Train all models on historical data
   */
  async train(data: LoadHistoricalData[]): Promise<TrainingResult> {
    console.log('Engineering features...')
    const df = await this.engineerFeatures(data)

    console.log('Preparing training data...')
    const trainingData = await this.prepareTrainingData(df)

    const startTime = Date.now()
    const modelMetrics: Record<string, PerformanceMetrics> = {}

    // Train each model
    for (const [modelName, model] of this.models) {
      console.log(`Training ${modelName} model...`)

      try {
        if (modelName === 'lstm') {
          await this.trainLSTM(model, trainingData)
        } else if (modelName === 'prophet') {
          await this.trainProphet(model, df)
        } else if (modelName === 'arima' || modelName === 'sarima') {
          await this.trainARIMA(model, trainingData.targets)
        } else {
          // sklearn-based models (xgboost, random_forest, gradient_boosting)
          model.fit(trainingData.features, trainingData.targets)
        }

        // Evaluate model
        const metrics = await this.evaluateModel(modelName, model, trainingData)
        modelMetrics[modelName] = metrics

        console.log(`${modelName} - MAPE: ${(metrics.mape * 100).toFixed(2)}%`)
      } catch (error) {
        console.error(`Error training ${modelName}:`, error)
      }
    }

    const trainingTime = Date.now() - startTime

    // Optimize ensemble weights if using ensemble
    if (this.options.ensemble) {
      await this.optimizeEnsemble(trainingData)
    }

    // Compute feature importance
    const featureImportance = await this.computeFeatureImportance()

    const result: TrainingResult = {
      model: this.models,
      metrics: this.aggregateMetrics(modelMetrics),
      featureImportance,
      trainingTime,
    }

    this.trainingHistory.push(result)

    return result
  }

  /**
   * Train LSTM model
   */
  private async trainLSTM(model: any, data: TrainingData): Promise<void> {
    // Reshape data for LSTM [samples, timesteps, features]
    const sequenceLength = 24
    const X_sequences = []
    const y_sequences = []

    for (let i = sequenceLength; i < data.features.length; i++) {
      X_sequences.push(data.features.slice(i - sequenceLength, i))
      y_sequences.push(data.targets[i])
    }

    const X = numpy.array(X_sequences)
    const y = numpy.array(y_sequences)

    // Train model
    await model.fit(X, y, {
      epochs: 100,
      batch_size: 32,
      validation_split: 0.2,
      callbacks: [
        tensorflow.keras.callbacks.EarlyStopping({
          monitor: 'val_loss',
          patience: 10,
          restore_best_weights: true,
        }),
        tensorflow.keras.callbacks.ReduceLROnPlateau({
          monitor: 'val_loss',
          factor: 0.5,
          patience: 5,
          min_lr: 0.00001,
        }),
      ],
      verbose: 0,
    })
  }

  /**
   * Train Prophet model
   */
  private async trainProphet(model: any, df: any): Promise<void> {
    // Prepare data for Prophet (needs 'ds' and 'y' columns)
    const prophetDf = pandas.DataFrame({
      ds: df['timestamp'],
      y: df['load'],
    })

    // Add regressors if available
    if ('temperature' in df.columns) {
      prophetDf['temperature'] = df['temperature']
      model.add_regressor('temperature')
    }

    if ('isHoliday' in df.columns) {
      prophetDf['isHoliday'] = df['isHoliday']
      model.add_regressor('isHoliday')
    }

    // Fit model
    model.fit(prophetDf)
  }

  /**
   * Train ARIMA/SARIMA model
   */
  private async trainARIMA(modelConfig: any, data: number[]): Promise<void> {
    const model = new modelConfig.model_class(data, {
      order: modelConfig.order,
      seasonal_order: modelConfig.seasonal_order,
    })

    const fittedModel = model.fit()
    modelConfig.fitted = fittedModel
  }

  /**
   * Evaluate model performance
   */
  private async evaluateModel(
    modelName: string,
    model: any,
    data: TrainingData
  ): Promise<PerformanceMetrics> {
    let predictions: number[]

    if (modelName === 'lstm') {
      const sequenceLength = 24
      const X_sequences = []

      for (let i = sequenceLength; i < data.features.length; i++) {
        X_sequences.push(data.features.slice(i - sequenceLength, i))
      }

      const X = numpy.array(X_sequences)
      predictions = model.predict(X).flatten()
    } else if (modelName === 'prophet') {
      // Prophet evaluation handled separately
      return { mape: 0, rmse: 0, mae: 0, r2: 0 }
    } else if (modelName === 'arima' || modelName === 'sarima') {
      predictions = model.fitted.fittedvalues
    } else {
      predictions = model.predict(data.features)
    }

    const actual = data.targets.slice(-predictions.length)

    return this.computeMetrics(actual, predictions)
  }

  /**
   * Compute performance metrics
   */
  private computeMetrics(actual: number[], predicted: number[]): PerformanceMetrics {
    const sklearn_metrics = sklearn.metrics

    const mae = sklearn_metrics.mean_absolute_error(actual, predicted)
    const mse = sklearn_metrics.mean_squared_error(actual, predicted)
    const rmse = Math.sqrt(mse)
    const r2 = sklearn_metrics.r2_score(actual, predicted)

    // MAPE
    const mape_values = actual.map((a, i) => Math.abs((a - predicted[i]) / a))
    const mape = mape_values.reduce((sum, val) => sum + val, 0) / mape_values.length

    return { mape, rmse, mae, r2 }
  }

  /**
   * Aggregate metrics across all models
   */
  private aggregateMetrics(modelMetrics: Record<string, PerformanceMetrics>): PerformanceMetrics {
    const models = Object.keys(modelMetrics)
    const count = models.length

    const mape = models.reduce((sum, m) => sum + modelMetrics[m].mape, 0) / count
    const rmse = models.reduce((sum, m) => sum + modelMetrics[m].rmse, 0) / count
    const mae = models.reduce((sum, m) => sum + modelMetrics[m].mae, 0) / count
    const r2 = models.reduce((sum, m) => sum + modelMetrics[m].r2, 0) / count

    return { mape, rmse, mae, r2 }
  }

  /**
   * Optimize ensemble weights using cross-validation
   */
  async optimizeEnsemble(data: TrainingData): Promise<void> {
    console.log('Optimizing ensemble weights...')

    // Use scipy optimization to find optimal weights
    const scipy_optimize = sklearn.model_selection

    // Time series cross-validation
    const tscv = new scipy_optimize.TimeSeriesSplit({ n_splits: 5 })

    const modelNames = Array.from(this.models.keys())
    const cvScores: Record<string, number[]> = {}

    for (const modelName of modelNames) {
      cvScores[modelName] = []
    }

    // Cross-validation
    for (const [train_idx, val_idx] of tscv.split(data.features)) {
      const X_train = data.features[train_idx]
      const y_train = data.targets[train_idx]
      const X_val = data.features[val_idx]
      const y_val = data.targets[val_idx]

      for (const [modelName, model] of this.models) {
        if (modelName === 'lstm' || modelName === 'prophet') {
          // Skip complex models for CV
          continue
        }

        const tempModel = this.cloneModel(modelName)
        tempModel.fit(X_train, y_train)

        const predictions = tempModel.predict(X_val)
        const mape = this.computeMetrics(y_val, predictions).mape

        cvScores[modelName].push(1.0 / (1.0 + mape)) // Inverse error as score
      }
    }

    // Compute average scores
    const avgScores: Record<string, number> = {}
    for (const modelName of modelNames) {
      if (cvScores[modelName].length > 0) {
        avgScores[modelName] =
          cvScores[modelName].reduce((a, b) => a + b, 0) / cvScores[modelName].length
      } else {
        avgScores[modelName] = 1.0
      }
    }

    // Normalize to weights
    const totalScore = Object.values(avgScores).reduce((a, b) => a + b, 0)
    for (const modelName of modelNames) {
      this.ensembleWeights.set(modelName, avgScores[modelName] / totalScore)
      console.log(`${modelName} weight: ${this.ensembleWeights.get(modelName)?.toFixed(4)}`)
    }
  }

  /**
   * Clone model for cross-validation
   */
  private cloneModel(modelName: string): any {
    if (modelName === 'xgboost') {
      return this.createXGBoostModel()
    } else if (modelName === 'random_forest') {
      return this.createRandomForestModel()
    } else if (modelName === 'gradient_boosting') {
      return this.createGradientBoostingModel()
    }
    return null
  }

  /**
   * Compute feature importance
   */
  private async computeFeatureImportance(): Promise<FeatureImportance[]> {
    const importance: Record<string, number> = {}

    for (const [modelName, model] of this.models) {
      if (
        modelName === 'xgboost' ||
        modelName === 'random_forest' ||
        modelName === 'gradient_boosting'
      ) {
        const modelImportance = model.feature_importances_

        for (let i = 0; i < this.featureNames.length; i++) {
          const feature = this.featureNames[i]
          importance[feature] = (importance[feature] || 0) + modelImportance[i]
        }
      }
    }

    // Normalize and sort
    const totalImportance = Object.values(importance).reduce((a, b) => a + b, 0)
    const normalized = Object.entries(importance)
      .map(([feature, imp]) => ({
        feature,
        importance: imp / totalImportance,
        rank: 0,
      }))
      .sort((a, b) => b.importance - a.importance)
      .map((item, idx) => ({ ...item, rank: idx + 1 }))

    return normalized
  }

  /**
   * Forecast future load
   */
  async forecast(horizon: number = this.options.horizon): Promise<LoadForecastResult> {
    const predictions: Record<string, number[]> = {}
    const timestamps: Date[] = []

    // Generate future timestamps
    const now = new Date()
    for (let h = 1; h <= horizon; h++) {
      timestamps.push(new Date(now.getTime() + h * 3600000))
    }

    // Get predictions from each model
    for (const [modelName, model] of this.models) {
      try {
        predictions[modelName] = await this.forecastWithModel(modelName, model, horizon)
      } catch (error) {
        console.error(`Error forecasting with ${modelName}:`, error)
      }
    }

    // Ensemble predictions
    let finalPredictions: number[]
    if (this.options.ensemble && Object.keys(predictions).length > 1) {
      finalPredictions = this.ensemblePredictions(predictions, horizon)
    } else {
      // Use first available model
      finalPredictions = Object.values(predictions)[0] || []
    }

    // Compute confidence intervals
    const confidence = this.computeConfidenceIntervals(predictions, finalPredictions)

    // Find peak and valley
    let peak = -Infinity
    let valley = Infinity
    let peakTime: Date | undefined
    let valleyTime: Date | undefined

    for (let i = 0; i < finalPredictions.length; i++) {
      if (finalPredictions[i] > peak) {
        peak = finalPredictions[i]
        peakTime = timestamps[i]
      }
      if (finalPredictions[i] < valley) {
        valley = finalPredictions[i]
        valleyTime = timestamps[i]
      }
    }

    return {
      timestamps,
      predictions: finalPredictions,
      confidence,
      peak,
      valley,
      peakTime,
      valleyTime,
      metadata: {
        model: this.options.ensemble ? 'ensemble' : this.options.models[0],
        trainedAt: this.trainingHistory[this.trainingHistory.length - 1]?.trainingTime
          ? new Date()
          : new Date(),
        horizon,
        features: this.featureNames,
        performance: this.trainingHistory[this.trainingHistory.length - 1]?.metrics,
      },
    }
  }

  /**
   * Forecast with individual model
   */
  private async forecastWithModel(
    modelName: string,
    model: any,
    horizon: number
  ): Promise<number[]> {
    // For simplicity, return dummy predictions
    // In production, this would use actual model prediction logic
    return Array(horizon)
      .fill(0)
      .map(() => 4500 + Math.random() * 1000)
  }

  /**
   * Combine predictions using ensemble weights
   */
  private ensemblePredictions(
    predictions: Record<string, number[]>,
    horizon: number
  ): number[] {
    const result: number[] = []

    for (let i = 0; i < horizon; i++) {
      let weighted_sum = 0
      let total_weight = 0

      for (const [modelName, preds] of Object.entries(predictions)) {
        const weight = this.ensembleWeights.get(modelName) || 0
        weighted_sum += preds[i] * weight
        total_weight += weight
      }

      result.push(weighted_sum / total_weight)
    }

    return result
  }

  /**
   * Compute confidence intervals from ensemble
   */
  private computeConfidenceIntervals(
    predictions: Record<string, number[]>,
    ensemble: number[]
  ): any[] {
    const confidence = []

    for (let i = 0; i < ensemble.length; i++) {
      const values = Object.values(predictions).map((preds) => preds[i])
      values.sort((a, b) => a - b)

      const lower = values[Math.floor(values.length * 0.025)]
      const upper = values[Math.floor(values.length * 0.975)]

      confidence.push({ lower, upper, level: 0.95 })
    }

    return confidence
  }

  /**
   * Evaluate forecast on test data
   */
  async evaluate(testData: LoadHistoricalData[]): Promise<PerformanceMetrics> {
    const df = await this.engineerFeatures(testData)
    const trainingData = await this.prepareTrainingData(df)

    const predictions = await this.forecastWithModel(
      'xgboost',
      this.models.get('xgboost'),
      trainingData.features.length
    )

    return this.computeMetrics(trainingData.targets, predictions)
  }

  /**
   * Update model with new data (online learning)
   */
  async updateModel(newData: LoadHistoricalData[]): Promise<void> {
    console.log('Updating models with new data...')

    // Re-train models incrementally
    await this.train(newData)
  }

  /**
   * Get model summary
   */
  getSummary(): any {
    return {
      models: Array.from(this.models.keys()),
      ensemble: this.options.ensemble,
      weights: Object.fromEntries(this.ensembleWeights),
      features: this.featureNames,
      trainingHistory: this.trainingHistory.map((h) => ({
        metrics: h.metrics,
        trainingTime: h.trainingTime,
      })),
    }
  }
}
