/**
 * Demand Predictor
 *
 * ML-powered demand forecasting for logistics planning.
 * Uses scikit-learn models to predict delivery volumes,
 * capacity requirements, and seasonal patterns.
 */

// @ts-ignore - Elide Python interop
import sklearn from 'python:sklearn';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';

import {
  DemandForecast,
  CapacityRecommendation,
  ForecastingModelConfig,
} from '../types';

/**
 * Historical demand data point
 */
interface HistoricalDemand {
  date: Date;
  orderCount: number;
  totalVolume: number;
  totalWeight: number;
  region?: string;
  dayOfWeek: number;
  month: number;
  isHoliday: boolean;
  weatherCondition?: string;
  temperature?: number;
  promotionActive: boolean;
}

/**
 * Demand Predictor class
 */
export class DemandPredictor {
  private model: any = null;
  private scaler: any = null;
  private featureColumns: string[] = [];
  private modelConfig: ForecastingModelConfig | null = null;

  /**
   * Train demand forecasting model
   */
  async train(params: {
    historicalData: HistoricalDemand[];
    features: string[];
    targetVariable: string;
    validationSplit?: number;
    modelType?: 'linear' | 'tree' | 'ensemble';
  }): Promise<{
    accuracy: number;
    rmse: number;
    mae: number;
    r2Score: number;
  }> {
    console.log('Training demand forecasting model...');

    const {
      historicalData,
      features,
      targetVariable,
      validationSplit = 0.2,
      modelType = 'ensemble',
    } = params;

    this.featureColumns = features;

    // Prepare data using pandas
    const df = this.prepareDataFrame(historicalData);

    // Extract features and target
    const X = df[features];
    const y = df[targetVariable];

    // Split data
    const splitIndex = Math.floor(historicalData.length * (1 - validationSplit));
    const X_train = X.slice(0, splitIndex);
    const X_test = X.slice(splitIndex);
    const y_train = y.slice(0, splitIndex);
    const y_test = y.slice(splitIndex);

    // Scale features
    this.scaler = sklearn.preprocessing.StandardScaler();
    const X_train_scaled = this.scaler.fit_transform(X_train);
    const X_test_scaled = this.scaler.transform(X_test);

    // Train model based on type
    switch (modelType) {
      case 'linear':
        this.model = sklearn.linear_model.Ridge({ alpha: 1.0 });
        break;
      case 'tree':
        this.model = sklearn.tree.DecisionTreeRegressor({ max_depth: 10 });
        break;
      case 'ensemble':
        this.model = sklearn.ensemble.RandomForestRegressor({
          n_estimators: 100,
          max_depth: 15,
          random_state: 42,
        });
        break;
    }

    this.model.fit(X_train_scaled, y_train);

    // Evaluate model
    const y_pred = this.model.predict(X_test_scaled);

    const rmse = this.calculateRMSE(y_test, y_pred);
    const mae = this.calculateMAE(y_test, y_pred);
    const r2Score = this.model.score(X_test_scaled, y_test);
    const accuracy = Math.max(0, (1 - rmse / this.mean(y_test)) * 100);

    console.log(`Model trained: ${modelType}`);
    console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
    console.log(`RMSE: ${rmse.toFixed(2)}`);
    console.log(`MAE: ${mae.toFixed(2)}`);
    console.log(`R² Score: ${r2Score.toFixed(3)}`);

    this.modelConfig = {
      modelType,
      features,
      targetVariable,
      trainingPeriodDays: historicalData.length,
      validationSplit,
    };

    return { accuracy, rmse, mae, r2Score };
  }

  /**
   * Predict demand for future dates
   */
  async predict(params: {
    startDate: Date;
    days: number;
    region?: string;
    externalFactors?: {
      holidays?: string[];
      events?: string[];
      weatherForecast?: any[];
      promotions?: any[];
    };
  }): Promise<DemandForecast[]> {
    if (!this.model || !this.scaler) {
      throw new Error('Model not trained. Call train() first.');
    }

    console.log(`Predicting demand for ${params.days} days...`);

    const { startDate, days, region, externalFactors } = params;

    const forecasts: DemandForecast[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Prepare features for this date
      const features = this.preparePredictionFeatures(date, region, externalFactors);

      // Scale features
      const featuresScaled = this.scaler.transform([features]);

      // Predict
      const prediction = this.model.predict(featuresScaled)[0];

      // Calculate confidence interval (simplified)
      const stdDev = prediction * 0.15; // 15% standard deviation
      const lower = Math.max(0, prediction - 1.96 * stdDev); // 95% CI
      const upper = prediction + 1.96 * stdDev;

      // Seasonal and trend factors
      const seasonalFactor = this.calculateSeasonalFactor(date);
      const trendFactor = 1.0 + (i / 365) * 0.05; // 5% annual growth

      forecasts.push({
        date,
        region,
        predictedOrders: Math.round(prediction),
        predictedVolume: prediction * 15, // Assume 15 m³ per order
        predictedWeight: prediction * 50, // Assume 50 kg per order
        confidenceInterval: {
          lower: Math.round(lower),
          upper: Math.round(upper),
          confidenceLevel: 0.95,
        },
        seasonalFactor,
        trendFactor,
      });
    }

    console.log('Forecast complete');

    return forecasts;
  }

  /**
   * Plan capacity based on forecast
   */
  async planCapacity(params: {
    forecast: DemandForecast[];
    currentFleetSize: number;
    targetServiceLevel: number;
  }): Promise<CapacityRecommendation[]> {
    console.log('Planning capacity recommendations...');

    const { forecast, currentFleetSize, targetServiceLevel } = params;

    const deliveriesPerVehicle = 25; // Average deliveries per vehicle per day

    const recommendations: CapacityRecommendation[] = [];

    forecast.forEach((demand) => {
      // Calculate required vehicles for target service level
      const demandWithBuffer = demand.predictedOrders * targetServiceLevel;
      const requiredVehicles = Math.ceil(demandWithBuffer / deliveriesPerVehicle);

      // Calculate additional drivers (assume 1:1 ratio with vehicles)
      const additionalDrivers = Math.max(0, requiredVehicles - currentFleetSize);

      // Capacity adjustment percentage
      const adjustment = ((requiredVehicles - currentFleetSize) / currentFleetSize) * 100;

      // Predicted utilization
      const utilization = Math.min(1.0, demand.predictedOrders / (requiredVehicles * deliveriesPerVehicle));

      recommendations.push({
        date: demand.date,
        forecast: demand,
        currentCapacity: {
          vehicles: currentFleetSize,
          drivers: currentFleetSize,
          maxOrders: currentFleetSize * deliveriesPerVehicle,
        },
        recommendedCapacity: {
          vehicles: requiredVehicles,
          drivers: requiredVehicles,
          adjustment,
        },
        utilizationPrediction: utilization,
        serviceLevel: targetServiceLevel,
      });
    });

    // Find peak day
    const peakRec = recommendations.reduce((max, rec) =>
      rec.forecast.predictedOrders > max.forecast.predictedOrders ? rec : max
    );

    console.log(`Peak demand: ${peakRec.forecast.predictedOrders} orders on ${peakRec.date.toISOString().split('T')[0]}`);

    return recommendations;
  }

  /**
   * Detect anomalies in demand patterns
   */
  async detectAnomalies(params: {
    historicalData: HistoricalDemand[];
    threshold?: number;
  }): Promise<Array<{
    date: Date;
    actualDemand: number;
    expectedDemand: number;
    deviation: number;
    anomalyScore: number;
  }>> {
    console.log('Detecting demand anomalies...');

    const { historicalData, threshold = 2.5 } = params;

    // Calculate rolling statistics
    const windowSize = 7; // 7-day window
    const anomalies: any[] = [];

    for (let i = windowSize; i < historicalData.length; i++) {
      const window = historicalData.slice(i - windowSize, i);
      const windowDemands = window.map((d) => d.orderCount);

      const mean = this.mean(windowDemands);
      const stdDev = this.std(windowDemands);

      const actual = historicalData[i].orderCount;
      const zScore = Math.abs((actual - mean) / stdDev);

      if (zScore > threshold) {
        anomalies.push({
          date: historicalData[i].date,
          actualDemand: actual,
          expectedDemand: mean,
          deviation: actual - mean,
          anomalyScore: zScore,
        });
      }
    }

    console.log(`Found ${anomalies.length} anomalies`);

    return anomalies;
  }

  /**
   * Analyze seasonal patterns
   */
  async analyzeSeasonality(params: {
    historicalData: HistoricalDemand[];
  }): Promise<{
    monthlyPattern: Record<number, number>;
    weekdayPattern: Record<number, number>;
    holidayImpact: number;
  }> {
    console.log('Analyzing seasonal patterns...');

    const { historicalData } = params;

    // Monthly pattern
    const monthlyData: Record<number, number[]> = {};
    const weekdayData: Record<number, number[]> = {};
    const holidayDemands: number[] = [];
    const nonHolidayDemands: number[] = [];

    historicalData.forEach((data) => {
      const month = data.month;
      const dow = data.dayOfWeek;

      if (!monthlyData[month]) monthlyData[month] = [];
      if (!weekdayData[dow]) weekdayData[dow] = [];

      monthlyData[month].push(data.orderCount);
      weekdayData[dow].push(data.orderCount);

      if (data.isHoliday) {
        holidayDemands.push(data.orderCount);
      } else {
        nonHolidayDemands.push(data.orderCount);
      }
    });

    // Calculate averages
    const monthlyPattern: Record<number, number> = {};
    Object.entries(monthlyData).forEach(([month, demands]) => {
      monthlyPattern[parseInt(month)] = this.mean(demands);
    });

    const weekdayPattern: Record<number, number> = {};
    Object.entries(weekdayData).forEach(([dow, demands]) => {
      weekdayPattern[parseInt(dow)] = this.mean(demands);
    });

    // Holiday impact
    const holidayAvg = this.mean(holidayDemands);
    const nonHolidayAvg = this.mean(nonHolidayDemands);
    const holidayImpact = ((holidayAvg - nonHolidayAvg) / nonHolidayAvg) * 100;

    console.log('Seasonality analysis complete');
    console.log(`Holiday impact: ${holidayImpact.toFixed(1)}%`);

    return {
      monthlyPattern,
      weekdayPattern,
      holidayImpact,
    };
  }

  // ========== Helper Methods ==========

  /**
   * Prepare pandas DataFrame from historical data
   */
  private prepareDataFrame(data: HistoricalDemand[]): any {
    // Would create actual pandas DataFrame
    // Simplified here
    return data;
  }

  /**
   * Prepare features for prediction
   */
  private preparePredictionFeatures(
    date: Date,
    region?: string,
    externalFactors?: any
  ): number[] {
    const features: number[] = [];

    // Day of week (0-6)
    features.push(date.getDay());

    // Month (1-12)
    features.push(date.getMonth() + 1);

    // Is holiday (0 or 1)
    const isHoliday = externalFactors?.holidays?.some((h: string) =>
      date.toISOString().startsWith(h)
    ) ? 1 : 0;
    features.push(isHoliday);

    // Temperature (simulated)
    features.push(externalFactors?.weatherForecast?.[0]?.temperature || 20);

    // Weather condition (encoded)
    features.push(0); // clear=0, rain=1, etc.

    // Region (encoded)
    features.push(0);

    // Promotion active
    features.push(externalFactors?.promotions?.length > 0 ? 1 : 0);

    return features;
  }

  /**
   * Calculate seasonal factor for a date
   */
  private calculateSeasonalFactor(date: Date): number {
    const month = date.getMonth() + 1;

    // Simple seasonal pattern (higher in Nov-Dec, lower in Jan-Feb)
    const seasonalFactors: Record<number, number> = {
      1: 0.85,
      2: 0.90,
      3: 1.0,
      4: 1.0,
      5: 1.05,
      6: 1.05,
      7: 1.10,
      8: 1.10,
      9: 1.05,
      10: 1.10,
      11: 1.20,
      12: 1.30,
    };

    return seasonalFactors[month] || 1.0;
  }

  /**
   * Calculate RMSE
   */
  private calculateRMSE(actual: number[], predicted: number[]): number {
    const squaredErrors = actual.map((a, i) => Math.pow(a - predicted[i], 2));
    return Math.sqrt(this.mean(squaredErrors));
  }

  /**
   * Calculate MAE
   */
  private calculateMAE(actual: number[], predicted: number[]): number {
    const absErrors = actual.map((a, i) => Math.abs(a - predicted[i]));
    return this.mean(absErrors);
  }

  /**
   * Calculate mean
   */
  private mean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private std(values: number[]): number {
    const avg = this.mean(values);
    const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }

  /**
   * Get model information
   */
  getModelInfo(): ForecastingModelConfig | null {
    return this.modelConfig;
  }

  /**
   * Check if model is trained
   */
  isTrained(): boolean {
    return this.model !== null;
  }
}

export default DemandPredictor;
