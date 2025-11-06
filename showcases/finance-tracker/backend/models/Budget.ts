/**
 * Budget Model
 *
 * Represents a spending budget for a category or group of categories
 */

import Decimal from 'decimal.js';
import { nanoid } from 'nanoid';

export enum BudgetPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum BudgetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export interface IBudget {
  id: string;
  name: string;
  categoryIds: string[];
  amount: string;
  currency: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate?: Date;
  status: BudgetStatus;
  rollover: boolean; // Roll over unused budget to next period
  alertThreshold?: number; // Alert when spent % reaches this (0-100)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export class Budget implements IBudget {
  id: string;
  name: string;
  categoryIds: string[];
  amount: string;
  currency: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate?: Date;
  status: BudgetStatus;
  rollover: boolean;
  alertThreshold?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;

  constructor(data: Partial<IBudget>) {
    this.id = data.id || nanoid();
    this.name = data.name || '';
    this.categoryIds = data.categoryIds || [];
    this.amount = data.amount || '0';
    this.currency = data.currency || 'USD';
    this.period = data.period || BudgetPeriod.MONTHLY;
    this.startDate = data.startDate || new Date();
    this.endDate = data.endDate;
    this.status = data.status || BudgetStatus.ACTIVE;
    this.rollover = data.rollover ?? false;
    this.alertThreshold = data.alertThreshold;
    this.notes = data.notes;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.metadata = data.metadata || {};
  }

  /**
   * Get budget amount as Decimal
   */
  getAmount(): Decimal {
    return new Decimal(this.amount);
  }

  /**
   * Calculate spent percentage
   */
  getSpentPercentage(spent: Decimal): number {
    const amount = this.getAmount();
    if (amount.isZero()) return 0;

    return spent.dividedBy(amount).times(100).toNumber();
  }

  /**
   * Calculate remaining budget
   */
  getRemaining(spent: Decimal): Decimal {
    return this.getAmount().minus(spent);
  }

  /**
   * Is budget exceeded?
   */
  isExceeded(spent: Decimal): boolean {
    return spent.greaterThan(this.getAmount());
  }

  /**
   * Should alert?
   */
  shouldAlert(spent: Decimal): boolean {
    if (!this.alertThreshold) return false;

    const spentPercentage = this.getSpentPercentage(spent);
    return spentPercentage >= this.alertThreshold;
  }

  /**
   * Is budget active?
   */
  isActive(): boolean {
    return this.status === BudgetStatus.ACTIVE;
  }

  /**
   * Is budget current (within period)?
   */
  isCurrent(date: Date = new Date()): boolean {
    if (!this.isActive()) return false;
    if (date < this.startDate) return false;
    if (this.endDate && date > this.endDate) return false;

    return true;
  }

  /**
   * Get period dates
   */
  getCurrentPeriod(referenceDate: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(referenceDate);
    const end = new Date(referenceDate);

    switch (this.period) {
      case BudgetPeriod.WEEKLY:
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 6);
        break;

      case BudgetPeriod.MONTHLY:
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;

      case BudgetPeriod.QUARTERLY:
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3);
        start.setDate(1);
        end.setMonth(quarter * 3 + 3);
        end.setDate(0);
        break;

      case BudgetPeriod.YEARLY:
        start.setMonth(0);
        start.setDate(1);
        end.setMonth(11);
        end.setDate(31);
        break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Archive budget
   */
  archive(): void {
    this.status = BudgetStatus.ARCHIVED;
    this.updatedAt = new Date();
  }

  /**
   * Activate budget
   */
  activate(): void {
    this.status = BudgetStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Deactivate budget
   */
  deactivate(): void {
    this.status = BudgetStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  /**
   * Validate budget
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Budget name is required');
    }

    if (!this.categoryIds || this.categoryIds.length === 0) {
      errors.push('At least one category is required');
    }

    try {
      const amount = new Decimal(this.amount);
      if (amount.isNegative()) {
        errors.push('Budget amount cannot be negative');
      }
    } catch {
      errors.push('Invalid budget amount');
    }

    if (!this.period || !Object.values(BudgetPeriod).includes(this.period)) {
      errors.push('Valid budget period is required');
    }

    if (!this.startDate) {
      errors.push('Start date is required');
    }

    if (this.endDate && this.endDate < this.startDate) {
      errors.push('End date must be after start date');
    }

    if (this.alertThreshold !== undefined) {
      if (this.alertThreshold < 0 || this.alertThreshold > 100) {
        errors.push('Alert threshold must be between 0 and 100');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to JSON
   */
  toJSON(): IBudget {
    return {
      id: this.id,
      name: this.name,
      categoryIds: this.categoryIds,
      amount: this.amount,
      currency: this.currency,
      period: this.period,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
      rollover: this.rollover,
      alertThreshold: this.alertThreshold,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: any): Budget {
    return new Budget({
      ...json,
      startDate: new Date(json.startDate),
      endDate: json.endDate ? new Date(json.endDate) : undefined,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    });
  }

  /**
   * Get period display name
   */
  getPeriodDisplayName(): string {
    const names: Record<BudgetPeriod, string> = {
      [BudgetPeriod.WEEKLY]: 'Weekly',
      [BudgetPeriod.MONTHLY]: 'Monthly',
      [BudgetPeriod.QUARTERLY]: 'Quarterly',
      [BudgetPeriod.YEARLY]: 'Yearly'
    };

    return names[this.period];
  }

  /**
   * Get status color
   */
  getStatusColor(spent: Decimal): string {
    const percentage = this.getSpentPercentage(spent);

    if (percentage >= 100) return '#ef4444'; // Red
    if (percentage >= 90) return '#f59e0b'; // Orange
    if (percentage >= 75) return '#eab308'; // Yellow
    return '#10b981'; // Green
  }
}
