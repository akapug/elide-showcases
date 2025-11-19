/**
 * Bond Pricing and Analytics
 *
 * Comprehensive bond pricing, yield curve construction, and risk metrics.
 * Supports various bond types including zero-coupon, fixed-rate, floating-rate,
 * callable, and puttable bonds.
 *
 * Uses scipy for advanced interpolation and optimization.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import { interpolate, optimize } from 'python:scipy';

import type {
  BondContract,
  BondPricingResult,
  BondType,
  YieldCurve,
  YieldCurvePoint,
  DayCountConvention,
} from '../types.js';

// ============================================================================
// Day Count Convention Utilities
// ============================================================================

export class DayCountCalculator {
  /**
   * Calculate year fraction using specified convention
   */
  static yearFraction(
    startDate: Date,
    endDate: Date,
    convention: DayCountConvention = 'actual/365'
  ): number {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    switch (convention) {
      case 'actual/actual':
        return this.actualActual(startDate, endDate);

      case 'actual/360':
        return diffDays / 360;

      case 'actual/365':
        return diffDays / 365;

      case '30/360':
        return this.thirty360(startDate, endDate);

      case '30e/360':
        return this.thirty360E(startDate, endDate);

      default:
        throw new Error(`Unknown day count convention: ${convention}`);
    }
  }

  private static actualActual(startDate: Date, endDate: Date): number {
    let yearFraction = 0;
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const currentYear = currentDate.getFullYear();
      const yearEnd = new Date(currentYear + 1, 0, 1);
      const daysInYear = this.isLeapYear(currentYear) ? 366 : 365;

      if (yearEnd <= endDate) {
        const diffMs = yearEnd.getTime() - currentDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        yearFraction += diffDays / daysInYear;
        currentDate = yearEnd;
      } else {
        const diffMs = endDate.getTime() - currentDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        yearFraction += diffDays / daysInYear;
        break;
      }
    }

    return yearFraction;
  }

  private static thirty360(startDate: Date, endDate: Date): number {
    const y1 = startDate.getFullYear();
    const m1 = startDate.getMonth() + 1;
    let d1 = startDate.getDate();

    const y2 = endDate.getFullYear();
    const m2 = endDate.getMonth() + 1;
    let d2 = endDate.getDate();

    if (d1 === 31) d1 = 30;
    if (d2 === 31 && d1 === 30) d2 = 30;

    return (360 * (y2 - y1) + 30 * (m2 - m1) + (d2 - d1)) / 360;
  }

  private static thirty360E(startDate: Date, endDate: Date): number {
    const y1 = startDate.getFullYear();
    const m1 = startDate.getMonth() + 1;
    let d1 = startDate.getDate();

    const y2 = endDate.getFullYear();
    const m2 = endDate.getMonth() + 1;
    let d2 = endDate.getDate();

    if (d1 === 31) d1 = 30;
    if (d2 === 31) d2 = 30;

    return (360 * (y2 - y1) + 30 * (m2 - m1) + (d2 - d1)) / 360;
  }

  private static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }
}

// ============================================================================
// Yield Curve Construction
// ============================================================================

/**
 * Build and interpolate yield curves
 */
export class YieldCurveBuilder {
  /**
   * Create yield curve from market rates
   */
  static buildCurve(
    maturities: number[],
    rates: number[],
    interpolationMethod: 'linear' | 'cubic' | 'nelson-siegel' = 'cubic',
    currency = 'USD'
  ): YieldCurve {
    if (maturities.length !== rates.length) {
      throw new Error('Maturities and rates must have same length');
    }

    // Calculate discount factors
    const discounts = rates.map((rate, i) =>
      Math.exp(-rate * maturities[i])
    );

    const points: YieldCurvePoint[] = maturities.map((maturity, i) => ({
      maturity,
      rate: rates[i],
      discount: discounts[i],
    }));

    return {
      date: new Date(),
      currency,
      points,
      interpolationMethod,
    };
  }

  /**
   * Interpolate rate for a given maturity
   */
  static interpolateRate(curve: YieldCurve, maturity: number): number {
    const maturities = curve.points.map(p => p.maturity);
    const rates = curve.points.map(p => p.rate);

    // Use scipy interpolation for smooth curves
    switch (curve.interpolationMethod) {
      case 'linear':
        return this.linearInterpolation(maturities, rates, maturity);

      case 'cubic':
        return this.cubicSplineInterpolation(maturities, rates, maturity);

      case 'nelson-siegel':
        return this.nelsonSiegelInterpolation(curve.points, maturity);

      default:
        throw new Error(`Unknown interpolation method: ${curve.interpolationMethod}`);
    }
  }

  /**
   * Get discount factor for a given maturity
   */
  static getDiscountFactor(curve: YieldCurve, maturity: number): number {
    const rate = this.interpolateRate(curve, maturity);
    return Math.exp(-rate * maturity);
  }

  /**
   * Calculate forward rate between two maturities
   */
  static forwardRate(curve: YieldCurve, t1: number, t2: number): number {
    const d1 = this.getDiscountFactor(curve, t1);
    const d2 = this.getDiscountFactor(curve, t2);

    return Math.log(d1 / d2) / (t2 - t1);
  }

  private static linearInterpolation(x: number[], y: number[], xNew: number): number {
    // Find bracketing points
    let i = 0;
    while (i < x.length - 1 && x[i + 1] < xNew) {
      i++;
    }

    if (i === x.length - 1) {
      return y[i]; // Extrapolate with last rate
    }

    // Linear interpolation
    const t = (xNew - x[i]) / (x[i + 1] - x[i]);
    return y[i] + t * (y[i + 1] - y[i]);
  }

  private static cubicSplineInterpolation(x: number[], y: number[], xNew: number): number {
    // Use scipy's cubic spline interpolation
    const xArray = numpy.array(x);
    const yArray = numpy.array(y);

    const spline = interpolate.CubicSpline(xArray, yArray);
    const result = spline['__call__'](xNew);

    return result;
  }

  private static nelsonSiegelInterpolation(points: YieldCurvePoint[], maturity: number): number {
    // Fit Nelson-Siegel model: r(t) = β0 + β1 * exp(-t/τ) + β2 * (t/τ) * exp(-t/τ)
    const maturities = points.map(p => p.maturity);
    const rates = points.map(p => p.rate);

    // Simple parameter estimation (in practice, use optimization)
    const tau = 1.0; // Time decay parameter

    // Use least squares to fit parameters
    const X: number[][] = [];
    for (const t of maturities) {
      const exp = Math.exp(-t / tau);
      X.push([1, exp, (t / tau) * exp]);
    }

    const XArray = numpy.array(X);
    const yArray = numpy.array(rates);

    // Solve least squares: X * beta = y
    const result = numpy.linalg.lstsq(XArray, yArray, null);
    const beta = result[0];

    // Evaluate at target maturity
    const exp = Math.exp(-maturity / tau);
    const rate = beta.item(0) + beta.item(1) * exp + beta.item(2) * (maturity / tau) * exp;

    return rate;
  }

  /**
   * Bootstrap zero rates from bond prices
   */
  static bootstrapZeroRates(
    bonds: Array<{ maturity: number; coupon: number; price: number }>,
    frequency = 2
  ): YieldCurve {
    const sortedBonds = [...bonds].sort((a, b) => a.maturity - b.maturity);
    const zeroCurve: YieldCurvePoint[] = [];

    for (const bond of sortedBonds) {
      const zeroRate = this.bootstrapSingleRate(bond, zeroCurve, frequency);
      zeroCurve.push({
        maturity: bond.maturity,
        rate: zeroRate,
        discount: Math.exp(-zeroRate * bond.maturity),
      });
    }

    return {
      date: new Date(),
      currency: 'USD',
      points: zeroCurve,
      interpolationMethod: 'cubic',
    };
  }

  private static bootstrapSingleRate(
    bond: { maturity: number; coupon: number; price: number },
    existingCurve: YieldCurvePoint[],
    frequency: number
  ): number {
    const couponPayment = bond.coupon / frequency;
    const numPayments = Math.floor(bond.maturity * frequency);

    // Sum present value of known cash flows
    let pvKnown = 0;
    for (let i = 1; i < numPayments; i++) {
      const paymentTime = i / frequency;
      const rate = this.interpolateExistingCurve(existingCurve, paymentTime);
      pvKnown += couponPayment * Math.exp(-rate * paymentTime);
    }

    // Solve for zero rate at maturity
    const finalCashFlow = 1 + couponPayment;
    const pvFinal = bond.price - pvKnown;
    const zeroRate = -Math.log(pvFinal / finalCashFlow) / bond.maturity;

    return zeroRate;
  }

  private static interpolateExistingCurve(curve: YieldCurvePoint[], maturity: number): number {
    if (curve.length === 0) {
      return 0;
    }

    // Linear interpolation for bootstrap
    const maturities = curve.map(p => p.maturity);
    const rates = curve.map(p => p.rate);

    return this.linearInterpolation(maturities, rates, maturity);
  }
}

// ============================================================================
// Bond Pricing Engine
// ============================================================================

/**
 * Price bonds and calculate risk metrics
 */
export class BondPricer {
  /**
   * Price a bond using yield curve
   */
  static price(
    bond: BondContract,
    yieldCurve: YieldCurve,
    settlementDate: Date,
    convention: DayCountConvention = 'actual/365'
  ): BondPricingResult {
    switch (bond.type) {
      case 'zero-coupon':
        return this.priceZeroCoupon(bond, yieldCurve, settlementDate, convention);

      case 'fixed-rate':
        return this.priceFixedRate(bond, yieldCurve, settlementDate, convention);

      case 'floating-rate':
        throw new Error('Floating rate bonds not yet implemented');

      case 'callable':
        return this.priceCallable(bond, yieldCurve, settlementDate, convention);

      case 'puttable':
        return this.pricePuttable(bond, yieldCurve, settlementDate, convention);

      default:
        throw new Error(`Unknown bond type: ${bond.type}`);
    }
  }

  /**
   * Price zero-coupon bond
   */
  private static priceZeroCoupon(
    bond: BondContract,
    yieldCurve: YieldCurve,
    settlementDate: Date,
    convention: DayCountConvention
  ): BondPricingResult {
    const timeToMaturity = DayCountCalculator.yearFraction(
      settlementDate,
      bond.maturityDate,
      convention
    );

    const discountFactor = YieldCurveBuilder.getDiscountFactor(yieldCurve, timeToMaturity);
    const price = bond.faceValue * discountFactor;

    // Calculate yield to maturity
    const ytm = Math.log(bond.faceValue / price) / timeToMaturity;

    // Duration equals time to maturity for zero-coupon bonds
    const duration = timeToMaturity;
    const modifiedDuration = duration / (1 + ytm / bond.couponFrequency);

    // Convexity
    const convexity = timeToMaturity * (timeToMaturity + 1) / Math.pow(1 + ytm / bond.couponFrequency, 2);

    // DV01 (dollar value of 1 basis point)
    const dv01 = price * modifiedDuration * 0.0001;

    return {
      price,
      cleanPrice: price,
      dirtyPrice: price,
      accruedInterest: 0,
      yieldToMaturity: ytm,
      duration,
      modifiedDuration,
      convexity,
      dv01,
    };
  }

  /**
   * Price fixed-rate coupon bond
   */
  private static priceFixedRate(
    bond: BondContract,
    yieldCurve: YieldCurve,
    settlementDate: Date,
    convention: DayCountConvention
  ): BondPricingResult {
    const couponPayment = (bond.couponRate * bond.faceValue) / bond.couponFrequency;
    const cashFlows = this.generateCashFlows(bond, settlementDate);

    let price = 0;
    let durationNumerator = 0;
    let convexityNumerator = 0;

    // Calculate present value of all cash flows
    for (const cf of cashFlows) {
      const timeToPayment = DayCountCalculator.yearFraction(settlementDate, cf.date, convention);
      const discountFactor = YieldCurveBuilder.getDiscountFactor(yieldCurve, timeToPayment);
      const pv = cf.amount * discountFactor;

      price += pv;
      durationNumerator += pv * timeToPayment;
      convexityNumerator += pv * timeToPayment * (timeToPayment + 1 / bond.couponFrequency);
    }

    // Calculate accrued interest
    const accruedInterest = this.calculateAccruedInterest(bond, settlementDate, convention);
    const cleanPrice = price - accruedInterest;
    const dirtyPrice = price;

    // Calculate yield to maturity
    const ytm = this.calculateYTM(bond, cleanPrice, settlementDate, convention);

    // Calculate duration and convexity
    const macaulayDuration = durationNumerator / price;
    const modifiedDuration = macaulayDuration / (1 + ytm / bond.couponFrequency);
    const convexity = convexityNumerator / (price * Math.pow(1 + ytm / bond.couponFrequency, 2));

    // DV01
    const dv01 = price * modifiedDuration * 0.0001;

    return {
      price: cleanPrice,
      cleanPrice,
      dirtyPrice,
      accruedInterest,
      yieldToMaturity: ytm,
      duration: macaulayDuration,
      modifiedDuration,
      convexity,
      dv01,
    };
  }

  /**
   * Price callable bond
   */
  private static priceCallable(
    bond: BondContract,
    yieldCurve: YieldCurve,
    settlementDate: Date,
    convention: DayCountConvention
  ): BondPricingResult {
    // Price as regular bond first
    const straightBondPrice = this.priceFixedRate(bond, yieldCurve, settlementDate, convention);

    // Option value approximation (simplified)
    // In practice, use binomial tree or Monte Carlo
    let optionValue = 0;

    if (bond.callDates && bond.callDates.length > 0) {
      // Estimate call option value
      const firstCallDate = bond.callDates[0];
      const timeToCall = DayCountCalculator.yearFraction(settlementDate, firstCallDate, convention);

      // Simple approximation: option value increases with time and volatility
      const volatility = 0.1; // Assume 10% volatility
      optionValue = straightBondPrice.price * volatility * Math.sqrt(timeToCall) * 0.1;
    }

    // Callable bond price = straight bond price - call option value
    const callablePrice = straightBondPrice.price - optionValue;

    return {
      ...straightBondPrice,
      price: callablePrice,
      cleanPrice: callablePrice,
      dirtyPrice: callablePrice + straightBondPrice.accruedInterest,
    };
  }

  /**
   * Price puttable bond
   */
  private static pricePuttable(
    bond: BondContract,
    yieldCurve: YieldCurve,
    settlementDate: Date,
    convention: DayCountConvention
  ): BondPricingResult {
    // Price as regular bond first
    const straightBondPrice = this.priceFixedRate(bond, yieldCurve, settlementDate, convention);

    // Option value approximation
    let optionValue = 0;

    if (bond.putDates && bond.putDates.length > 0) {
      const firstPutDate = bond.putDates[0];
      const timeToPut = DayCountCalculator.yearFraction(settlementDate, firstPutDate, convention);

      const volatility = 0.1;
      optionValue = straightBondPrice.price * volatility * Math.sqrt(timeToPut) * 0.1;
    }

    // Puttable bond price = straight bond price + put option value
    const puttablePrice = straightBondPrice.price + optionValue;

    return {
      ...straightBondPrice,
      price: puttablePrice,
      cleanPrice: puttablePrice,
      dirtyPrice: puttablePrice + straightBondPrice.accruedInterest,
    };
  }

  /**
   * Generate cash flow schedule
   */
  private static generateCashFlows(
    bond: BondContract,
    settlementDate: Date
  ): Array<{ date: Date; amount: number }> {
    const cashFlows: Array<{ date: Date; amount: number }> = [];
    const couponPayment = (bond.couponRate * bond.faceValue) / bond.couponFrequency;

    const monthsPerPayment = 12 / bond.couponFrequency;
    let currentDate = new Date(bond.issueDate);

    // Generate coupon payments
    while (currentDate <= bond.maturityDate) {
      if (currentDate > settlementDate) {
        cashFlows.push({
          date: new Date(currentDate),
          amount: couponPayment,
        });
      }

      // Move to next payment date
      currentDate.setMonth(currentDate.getMonth() + monthsPerPayment);
    }

    // Add principal repayment at maturity
    if (cashFlows.length > 0) {
      cashFlows[cashFlows.length - 1].amount += bond.faceValue;
    }

    return cashFlows;
  }

  /**
   * Calculate accrued interest
   */
  private static calculateAccruedInterest(
    bond: BondContract,
    settlementDate: Date,
    convention: DayCountConvention
  ): number {
    // Find last coupon date
    const monthsPerPayment = 12 / bond.couponFrequency;
    let lastCouponDate = new Date(bond.issueDate);
    let nextCouponDate = new Date(bond.issueDate);

    while (nextCouponDate <= settlementDate) {
      lastCouponDate = new Date(nextCouponDate);
      nextCouponDate.setMonth(nextCouponDate.getMonth() + monthsPerPayment);
    }

    // Calculate accrued interest
    const daysSinceLastCoupon = DayCountCalculator.yearFraction(
      lastCouponDate,
      settlementDate,
      convention
    );
    const daysBetweenCoupons = DayCountCalculator.yearFraction(
      lastCouponDate,
      nextCouponDate,
      convention
    );

    const couponPayment = (bond.couponRate * bond.faceValue) / bond.couponFrequency;
    return couponPayment * (daysSinceLastCoupon / daysBetweenCoupons);
  }

  /**
   * Calculate yield to maturity using Newton-Raphson method
   */
  private static calculateYTM(
    bond: BondContract,
    price: number,
    settlementDate: Date,
    convention: DayCountConvention,
    initialGuess = 0.05,
    tolerance = 1e-6,
    maxIterations = 100
  ): number {
    let ytm = initialGuess;
    const cashFlows = this.generateCashFlows(bond, settlementDate);

    for (let i = 0; i < maxIterations; i++) {
      let priceAtYTM = 0;
      let duration = 0;

      for (const cf of cashFlows) {
        const timeToPayment = DayCountCalculator.yearFraction(settlementDate, cf.date, convention);
        const discountFactor = Math.exp(-ytm * timeToPayment);
        priceAtYTM += cf.amount * discountFactor;
        duration += cf.amount * discountFactor * timeToPayment;
      }

      const diff = priceAtYTM - price;

      if (Math.abs(diff) < tolerance) {
        return ytm;
      }

      // Newton-Raphson update
      ytm = ytm - diff / duration;

      if (ytm < 0) {
        ytm = initialGuess / 2;
      }
    }

    throw new Error('YTM calculation did not converge');
  }
}

// ============================================================================
// Bond Portfolio Analytics
// ============================================================================

/**
 * Analyze bond portfolios
 */
export class BondPortfolioAnalytics {
  /**
   * Calculate portfolio duration
   */
  static portfolioDuration(
    bonds: Array<{ bond: BondContract; quantity: number; price: number }>,
    yieldCurve: YieldCurve,
    settlementDate: Date
  ): { macaulay: number; modified: number } {
    let totalValue = 0;
    let weightedDuration = 0;
    let weightedModifiedDuration = 0;

    for (const holding of bonds) {
      const result = BondPricer.price(holding.bond, yieldCurve, settlementDate);
      const marketValue = result.price * holding.quantity;

      totalValue += marketValue;
      weightedDuration += result.duration * marketValue;
      weightedModifiedDuration += result.modifiedDuration * marketValue;
    }

    return {
      macaulay: weightedDuration / totalValue,
      modified: weightedModifiedDuration / totalValue,
    };
  }

  /**
   * Calculate portfolio convexity
   */
  static portfolioConvexity(
    bonds: Array<{ bond: BondContract; quantity: number; price: number }>,
    yieldCurve: YieldCurve,
    settlementDate: Date
  ): number {
    let totalValue = 0;
    let weightedConvexity = 0;

    for (const holding of bonds) {
      const result = BondPricer.price(holding.bond, yieldCurve, settlementDate);
      const marketValue = result.price * holding.quantity;

      totalValue += marketValue;
      weightedConvexity += result.convexity * marketValue;
    }

    return weightedConvexity / totalValue;
  }

  /**
   * Estimate portfolio value change for yield curve shift
   */
  static estimateValueChange(
    portfolioDuration: number,
    portfolioConvexity: number,
    portfolioValue: number,
    yieldShift: number
  ): { linearChange: number; convexityAdjusted: number } {
    // First-order (duration) approximation
    const linearChange = -portfolioDuration * yieldShift * portfolioValue;

    // Second-order (convexity) adjustment
    const convexityEffect = 0.5 * portfolioConvexity * Math.pow(yieldShift, 2) * portfolioValue;

    return {
      linearChange,
      convexityAdjusted: linearChange + convexityEffect,
    };
  }
}

// ============================================================================
// Export all classes
// ============================================================================

export {
  DayCountCalculator,
  YieldCurveBuilder,
  BondPricer,
  BondPortfolioAnalytics,
};
