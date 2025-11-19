/**
 * Renewable Forecaster - Solar and wind power forecasting
 * Demonstrates Elide's TypeScript + Python integration with PVLib for solar modeling
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import pvlib from 'python:pvlib'
// @ts-ignore
import sklearn from 'python:sklearn'
// @ts-ignore
import scipy from 'python:scipy'

import type {
  RenewableForecasterOptions,
  SolarForecastParams,
  SolarForecast,
  WindForecastParams,
  WindForecast,
  WeatherForecast,
  Location,
  PowerCurve,
} from '../types'

/**
 * RenewableForecaster - Physics-based + ML hybrid forecasting for solar and wind
 *
 * Solar: PVLib physics models + ML residual learning
 * Wind: Power curve mapping + statistical corrections
 */
export class RenewableForecaster {
  private options: RenewableForecasterOptions
  private solarModels: Map<string, any> = new Map()
  private windModels: Map<string, any> = new Map()

  constructor(options: RenewableForecasterOptions) {
    this.options = {
      sources: ['solar', 'wind'],
      models: {
        solar: 'pvlib_ml_hybrid',
        wind: 'power_curve_ml',
      },
      ...options,
    }

    this.initializeModels()
  }

  /**
   * Initialize forecasting models
   */
  private initializeModels(): void {
    if (this.options.sources.includes('solar')) {
      this.initializeSolarModels()
    }

    if (this.options.sources.includes('wind')) {
      this.initializeWindModels()
    }
  }

  /**
   * Initialize solar forecasting models
   */
  private initializeSolarModels(): void {
    // PVLib location and system objects will be created per forecast
    // ML residual model
    const GradientBoostingRegressor = sklearn.ensemble.GradientBoostingRegressor

    this.solarModels.set(
      'ml_residual',
      new GradientBoostingRegressor({
        n_estimators: 500,
        max_depth: 5,
        learning_rate: 0.05,
        subsample: 0.8,
        random_state: 42,
      })
    )
  }

  /**
   * Initialize wind forecasting models
   */
  private initializeWindModels(): void {
    // Random Forest for power curve enhancement
    const RandomForestRegressor = sklearn.ensemble.RandomForestRegressor

    this.windModels.set(
      'power_curve_ml',
      new RandomForestRegressor({
        n_estimators: 300,
        max_depth: 10,
        min_samples_split: 5,
        random_state: 42,
      })
    )
  }

  /**
   * Forecast solar power generation
   */
  async forecastSolar(params: SolarForecastParams): Promise<SolarForecast> {
    const { location, capacity, panelSpecs, weather, horizon = 48 } = params

    // Create PVLib location object
    const pvLocation = pvlib.location.Location({
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude,
      tz: location.timezone || 'UTC',
    })

    // Extract weather data
    const weatherData = this.prepareWeatherData(weather)

    // Calculate solar position
    const solarPosition = pvLocation.get_solarposition(weatherData.index)

    // Calculate clear sky irradiance (baseline)
    const clearsky = pvLocation.get_clearsky(weatherData.index, model: 'ineichen')

    // Get total irradiance on tilted surface
    const irradiance = pvlib.irradiance.get_total_irradiance({
      surface_tilt: panelSpecs.tilt,
      surface_azimuth: panelSpecs.azimuth,
      solar_zenith: solarPosition['apparent_zenith'],
      solar_azimuth: solarPosition['azimuth'],
      dni: weatherData['dni'] || clearsky['dni'],
      ghi: weatherData['ghi'] || clearsky['ghi'],
      dhi: weatherData['dhi'] || clearsky['dhi'],
    })

    // Calculate cell temperature
    const cellTemp = this.calculateCellTemperature(
      irradiance['poa_global'],
      weatherData['temperature'],
      weatherData['wind_speed']
    )

    // Calculate DC power
    const dcPower = this.calculateDCPower(
      irradiance['poa_global'],
      cellTemp,
      panelSpecs,
      capacity
    )

    // Convert to AC power
    const acPower = this.calculateACPower(dcPower, panelSpecs.inverterEfficiency || 0.96)

    // Apply ML correction for residuals
    const correctedPower = await this.applyMLCorrection(
      acPower,
      irradiance['poa_global'],
      cellTemp,
      weatherData
    )

    // Calculate confidence intervals
    const confidence = this.calculateSolarConfidence(correctedPower, weatherData)

    // Compute capacity factor
    const capacityFactor = numpy.mean(correctedPower) / capacity

    const timestamps = this.extractTimestamps(weatherData.index, horizon)

    return {
      timestamps,
      predictions: Array.from(correctedPower.slice(0, horizon)),
      confidence: confidence.slice(0, horizon),
      irradiance: Array.from(irradiance['poa_global'].slice(0, horizon)),
      cellTemperature: Array.from(cellTemp.slice(0, horizon)),
      dcPower: Array.from(dcPower.slice(0, horizon)),
      acPower: Array.from(acPower.slice(0, horizon)),
      capacity_factor: capacityFactor,
      metadata: {
        model: 'pvlib_ml_hybrid',
        trainedAt: new Date(),
        horizon,
        features: ['irradiance', 'temperature', 'wind_speed', 'cloud_cover'],
      },
    }
  }

  /**
   * Forecast wind power generation
   */
  async forecastWind(params: WindForecastParams): Promise<WindForecast> {
    const { location, capacity, turbineSpecs, weather, horizon = 48 } = params

    // Extract weather data
    const weatherData = this.prepareWeatherData(weather)

    // Extrapolate wind speed to hub height
    const hubWindSpeed = this.extrapolateWindSpeed(
      weatherData['wind_speed'],
      10, // Reference height (typically 10m)
      turbineSpecs.hubHeight,
      location.altitude
    )

    // Apply power curve
    const theoreticalPower = this.applyPowerCurve(hubWindSpeed, turbineSpecs)

    // Apply wake effects (for wind farms)
    const wakeLosses = this.calculateWakeLosses(theoreticalPower, hubWindSpeed)
    const adjustedPower = theoreticalPower.map((p: number, i: number) => p * (1 - wakeLosses[i]))

    // Apply ML enhancement
    const finalPower = await this.applyWindMLCorrection(
      adjustedPower,
      hubWindSpeed,
      weatherData,
      turbineSpecs
    )

    // Apply availability factor
    const availablePower = finalPower.map(
      (p: number) => p * (turbineSpecs.availability || 0.97)
    )

    // Calculate confidence intervals
    const confidence = this.calculateWindConfidence(availablePower, hubWindSpeed)

    // Compute capacity factor
    const capacityFactor = numpy.mean(availablePower) / capacity

    const timestamps = this.extractTimestamps(weatherData.index, horizon)

    return {
      timestamps,
      predictions: Array.from(availablePower.slice(0, horizon)),
      confidence: confidence.slice(0, horizon),
      windSpeed: Array.from(hubWindSpeed.slice(0, horizon)),
      power: Array.from(availablePower.slice(0, horizon)),
      capacity_factor: capacityFactor,
      metadata: {
        model: 'power_curve_ml',
        trainedAt: new Date(),
        horizon,
        features: ['wind_speed', 'wind_direction', 'temperature', 'pressure'],
      },
    }
  }

  /**
   * Prepare weather data as pandas DataFrame
   */
  private prepareWeatherData(weather: WeatherForecast): any {
    const data: any = {
      temperature: [],
      wind_speed: [],
      wind_direction: [],
      pressure: [],
      humidity: [],
      cloud_cover: [],
    }

    const timestamps: Date[] = []

    for (const forecast of weather.forecasts) {
      timestamps.push(forecast.timestamp)
      data.temperature.push(forecast.temperature)
      data.wind_speed.push(forecast.windSpeed)
      data.wind_direction.push(forecast.windDirection)
      data.pressure.push(forecast.pressure)
      data.humidity.push(forecast.humidity)
      data.cloud_cover.push(forecast.cloudCover)

      if (forecast.ghi !== undefined) {
        data.ghi = data.ghi || []
        data.ghi.push(forecast.ghi)
      }
      if (forecast.dni !== undefined) {
        data.dni = data.dni || []
        data.dni.push(forecast.dni)
      }
      if (forecast.dhi !== undefined) {
        data.dhi = data.dhi || []
        data.dhi.push(forecast.dhi)
      }
    }

    const df = pandas.DataFrame(data, { index: timestamps })
    return df
  }

  /**
   * Calculate cell temperature using Sandia model
   */
  private calculateCellTemperature(
    poa: any,
    airTemp: any,
    windSpeed: any
  ): any {
    // Sandia model: Tc = T_air + (POA * e^(a + b*WS))
    const a = -3.47 // Module-specific parameter
    const b = -0.0594 // Module-specific parameter
    const deltaT = 3 // Module-air temperature difference at 1000 W/m²

    const tempRise = poa.map((irr: number, i: number) => {
      const ws = windSpeed.iloc ? windSpeed.iloc[i] : windSpeed[i]
      return irr * Math.exp(a + b * ws) / 1000
    })

    return airTemp.map((temp: number, i: number) => temp + tempRise[i] * deltaT)
  }

  /**
   * Calculate DC power output
   */
  private calculateDCPower(
    irradiance: any,
    cellTemp: any,
    specs: any,
    capacity: number
  ): any {
    const referenceTemp = 25 // °C
    const referenceIrradiance = 1000 // W/m²

    return irradiance.map((irr: number, i: number) => {
      const temp = cellTemp.iloc ? cellTemp.iloc[i] : cellTemp[i]

      // Temperature derating
      const tempCoeff = specs.temperatureCoefficient || -0.004
      const tempDerate = 1 + tempCoeff * (temp - referenceTemp)

      // Basic power calculation
      const power = (capacity * irr / referenceIrradiance) * specs.efficiency * tempDerate

      return Math.max(0, power)
    })
  }

  /**
   * Convert DC to AC power using inverter model
   */
  private calculateACPower(dcPower: any, inverterEfficiency: number): any {
    return dcPower.map((dc: number) => {
      // Simple inverter model with efficiency curve
      if (dc === 0) return 0

      // Inverter efficiency decreases at low loads
      const loadRatio = dc / 1000 // Assuming 1000 kW inverter
      const efficiency = inverterEfficiency * (0.85 + 0.15 * Math.min(1, loadRatio / 0.2))

      return dc * efficiency
    })
  }

  /**
   * Apply ML correction for residuals
   */
  private async applyMLCorrection(
    power: any,
    irradiance: any,
    cellTemp: any,
    weather: any
  ): Promise<any> {
    // In production, this would use trained ML model to correct physics-based predictions
    // For now, return power as-is
    return power
  }

  /**
   * Extrapolate wind speed to hub height using power law
   */
  private extrapolateWindSpeed(
    refSpeed: any,
    refHeight: number,
    hubHeight: number,
    altitude: number
  ): any {
    // Power law exponent (depends on terrain and stability)
    const alpha = 0.143 // Typical for open terrain

    return refSpeed.map((speed: number) => {
      return speed * Math.pow(hubHeight / refHeight, alpha)
    })
  }

  /**
   * Apply power curve to convert wind speed to power
   */
  private applyPowerCurve(windSpeed: any, specs: any): any {
    const { cutInSpeed, cutOutSpeed, ratedPower, powerCurve } = specs

    return windSpeed.map((ws: number) => {
      // Below cut-in or above cut-out
      if (ws < cutInSpeed || ws > cutOutSpeed) {
        return 0
      }

      // Interpolate power curve
      if (powerCurve && powerCurve.windSpeeds && powerCurve.power) {
        return this.interpolatePowerCurve(ws, powerCurve)
      }

      // Simple cubic approximation
      const rated_ws = 12 // Typical rated wind speed
      if (ws >= rated_ws) {
        return ratedPower
      }

      // Cubic curve from cut-in to rated
      const normalizedSpeed = (ws - cutInSpeed) / (rated_ws - cutInSpeed)
      return ratedPower * Math.pow(normalizedSpeed, 3)
    })
  }

  /**
   * Interpolate power curve
   */
  private interpolatePowerCurve(windSpeed: number, powerCurve: PowerCurve): number {
    const { windSpeeds, power } = powerCurve

    // Find bracketing points
    let i = 0
    while (i < windSpeeds.length - 1 && windSpeeds[i + 1] < windSpeed) {
      i++
    }

    if (i === windSpeeds.length - 1) {
      return power[i]
    }

    // Linear interpolation
    const ws1 = windSpeeds[i]
    const ws2 = windSpeeds[i + 1]
    const p1 = power[i]
    const p2 = power[i + 1]

    const fraction = (windSpeed - ws1) / (ws2 - ws1)
    return p1 + fraction * (p2 - p1)
  }

  /**
   * Calculate wake losses for wind farm
   */
  private calculateWakeLosses(power: any, windSpeed: any): any {
    // Simplified wake model
    // In production, this would use Jensen wake model or similar
    return windSpeed.map((ws: number, i: number) => {
      // Wake losses increase with power
      const p = power.iloc ? power.iloc[i] : power[i]
      if (p === 0) return 0

      // 5-15% losses depending on wind speed
      const baseLoss = 0.1
      const wsNormalized = Math.min(1, ws / 15)
      return baseLoss * (1 - wsNormalized * 0.5)
    })
  }

  /**
   * Apply ML correction to wind power
   */
  private async applyWindMLCorrection(
    power: any,
    windSpeed: any,
    weather: any,
    specs: any
  ): Promise<any> {
    // In production, this would use trained ML model
    // For now, return power as-is
    return power
  }

  /**
   * Calculate solar forecast confidence intervals
   */
  private calculateSolarConfidence(power: any, weather: any): any[] {
    const confidence = []

    for (let i = 0; i < power.length; i++) {
      const p = power.iloc ? power.iloc[i] : power[i]
      const cloudCover = weather['cloud_cover'].iloc
        ? weather['cloud_cover'].iloc[i]
        : weather['cloud_cover'][i]

      // Uncertainty increases with cloud cover
      const uncertainty = p * (0.1 + cloudCover * 0.3)

      confidence.push({
        lower: Math.max(0, p - 1.96 * uncertainty),
        upper: p + 1.96 * uncertainty,
        level: 0.95,
      })
    }

    return confidence
  }

  /**
   * Calculate wind forecast confidence intervals
   */
  private calculateWindConfidence(power: any, windSpeed: any): any[] {
    const confidence = []

    for (let i = 0; i < power.length; i++) {
      const p = power.iloc ? power.iloc[i] : power[i]
      const ws = windSpeed.iloc ? windSpeed.iloc[i] : windSpeed[i]

      // Uncertainty increases with wind speed variability
      const uncertainty = p * (0.15 + Math.min(0.3, ws / 25 * 0.2))

      confidence.push({
        lower: Math.max(0, p - 1.96 * uncertainty),
        upper: p + 1.96 * uncertainty,
        level: 0.95,
      })
    }

    return confidence
  }

  /**
   * Extract timestamps from pandas index
   */
  private extractTimestamps(index: any, limit: number): Date[] {
    const timestamps: Date[] = []

    for (let i = 0; i < Math.min(limit, index.length); i++) {
      const ts = index.iloc ? index.iloc[i] : index[i]
      timestamps.push(new Date(ts))
    }

    return timestamps
  }

  /**
   * Compute uncertainty for forecasts
   */
  async computeUncertainty(forecast: any): Promise<any> {
    // Compute prediction intervals using quantile regression
    const predictions = forecast.predictions

    // Simple approach: assume normal distribution
    const mean = numpy.mean(predictions)
    const std = numpy.std(predictions)

    return {
      mean,
      std,
      intervals: {
        50: { lower: mean - 0.674 * std, upper: mean + 0.674 * std },
        80: { lower: mean - 1.282 * std, upper: mean + 1.282 * std },
        95: { lower: mean - 1.96 * std, upper: mean + 1.96 * std },
      },
    }
  }

  /**
   * Train solar ML residual model
   */
  async trainSolarModel(historicalData: any): Promise<void> {
    console.log('Training solar ML residual model...')

    // Extract features and residuals
    const features = []
    const residuals = []

    for (const data of historicalData) {
      features.push([
        data.irradiance,
        data.cellTemperature,
        data.cloudCover,
        data.humidity,
        data.hour,
        data.dayOfYear,
      ])

      residuals.push(data.actualPower - data.predictedPower)
    }

    const X = numpy.array(features)
    const y = numpy.array(residuals)

    // Train model
    const model = this.solarModels.get('ml_residual')
    model.fit(X, y)

    console.log('Solar ML model trained successfully')
  }

  /**
   * Train wind ML correction model
   */
  async trainWindModel(historicalData: any): Promise<void> {
    console.log('Training wind ML correction model...')

    // Extract features and corrections
    const features = []
    const corrections = []

    for (const data of historicalData) {
      features.push([
        data.windSpeed,
        data.windDirection,
        data.temperature,
        data.pressure,
        data.turbulenceIntensity,
      ])

      corrections.push(data.actualPower / (data.predictedPower + 0.001))
    }

    const X = numpy.array(features)
    const y = numpy.array(corrections)

    // Train model
    const model = this.windModels.get('power_curve_ml')
    model.fit(X, y)

    console.log('Wind ML model trained successfully')
  }

  /**
   * Evaluate solar forecast accuracy
   */
  async evaluateSolar(actualData: any, forecastData: any): Promise<any> {
    const actual = actualData.map((d: any) => d.power)
    const predicted = forecastData.predictions

    const sklearn_metrics = sklearn.metrics

    const mae = sklearn_metrics.mean_absolute_error(actual, predicted)
    const rmse = Math.sqrt(sklearn_metrics.mean_squared_error(actual, predicted))
    const mape = numpy.mean(numpy.abs((actual - predicted) / actual))

    return { mae, rmse, mape }
  }

  /**
   * Evaluate wind forecast accuracy
   */
  async evaluateWind(actualData: any, forecastData: any): Promise<any> {
    const actual = actualData.map((d: any) => d.power)
    const predicted = forecastData.predictions

    const sklearn_metrics = sklearn.metrics

    const mae = sklearn_metrics.mean_absolute_error(actual, predicted)
    const rmse = Math.sqrt(sklearn_metrics.mean_squared_error(actual, predicted))
    const mape = numpy.mean(numpy.abs((actual - predicted) / actual))

    return { mae, rmse, mape }
  }

  /**
   * Get combined renewable forecast
   */
  async forecastCombined(
    solarParams: SolarForecastParams,
    windParams: WindForecastParams
  ): Promise<any> {
    const solarForecast = await this.forecastSolar(solarParams)
    const windForecast = await this.forecastWind(windParams)

    // Combine forecasts
    const combined = solarForecast.predictions.map(
      (solar, i) => solar + windForecast.predictions[i]
    )

    return {
      timestamps: solarForecast.timestamps,
      predictions: combined,
      solar: solarForecast,
      wind: windForecast,
      total_capacity_factor:
        (solarForecast.capacity_factor! * solarParams.capacity +
          windForecast.capacity_factor! * windParams.capacity) /
        (solarParams.capacity + windParams.capacity),
    }
  }

  /**
   * Compute renewable penetration metrics
   */
  async computePenetrationMetrics(
    renewableForecast: any,
    loadForecast: any
  ): Promise<any> {
    const renewableGeneration = numpy.array(renewableForecast.predictions)
    const totalLoad = numpy.array(loadForecast.predictions)

    const penetration = renewableGeneration / totalLoad
    const averagePenetration = numpy.mean(penetration)
    const maxPenetration = numpy.max(penetration)

    // Curtailment analysis
    const oversupply = renewableGeneration - totalLoad
    const curtailment = oversupply.map((x: number) => Math.max(0, x))
    const totalCurtailment = numpy.sum(curtailment)
    const curtailmentRate = totalCurtailment / numpy.sum(renewableGeneration)

    return {
      averagePenetration,
      maxPenetration,
      totalCurtailment,
      curtailmentRate,
      hourlyPenetration: Array.from(penetration),
    }
  }

  /**
   * Optimize solar panel tilt angle for location
   */
  async optimizeTilt(location: Location): Promise<number> {
    // Simple heuristic: tilt ≈ latitude for annual optimization
    // For winter optimization: latitude + 15°
    // For summer optimization: latitude - 15°

    const tilt = Math.abs(location.latitude)

    // Clamp to reasonable range
    return Math.max(0, Math.min(60, tilt))
  }

  /**
   * Compute solar radiation statistics
   */
  async computeSolarStats(location: Location, year: number): Promise<any> {
    const pvLocation = pvlib.location.Location({
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude,
      tz: location.timezone || 'UTC',
    })

    // Generate timestamps for full year
    const times = pandas.date_range(`${year}-01-01`, `${year}-12-31`, freq: 'H')

    // Compute clear sky
    const clearsky = pvLocation.get_clearsky(times)

    // Annual statistics
    const annualGHI = numpy.sum(clearsky['ghi']) / 1000 // kWh/m²
    const annualDNI = numpy.sum(clearsky['dni']) / 1000
    const annualDHI = numpy.sum(clearsky['dhi']) / 1000

    return {
      annualGHI,
      annualDNI,
      annualDHI,
      averageDailyGHI: annualGHI / 365,
      peakSunHours: annualGHI / 365,
    }
  }

  /**
   * Get model summary
   */
  getSummary(): any {
    return {
      sources: this.options.sources,
      models: {
        solar: this.options.models.solar,
        wind: this.options.models.wind,
      },
      solarModels: Array.from(this.solarModels.keys()),
      windModels: Array.from(this.windModels.keys()),
    }
  }
}
