/**
 * Budget Service
 *
 * Business logic for budget management and monitoring
 */

import Decimal from 'decimal.js';
import { getStorage } from '../storage/storage';
import { Budget, BudgetStatus } from '../models/Budget';
import { TransactionType, TransactionStatus } from '../models/Transaction';

export interface BudgetProgress {
  budget: Budget;
  spent: Decimal;
  remaining: Decimal;
  percentage: number;
  isExceeded: boolean;
  shouldAlert: boolean;
}

export class BudgetService {
  private storage = getStorage();

  /**
   * Get all budgets
   */
  async getAllBudgets(): Promise<Budget[]> {
    return await this.storage.getBudgets();
  }

  /**
   * Get active budgets
   */
  async getActiveBudgets(): Promise<Budget[]> {
    const budgets = await this.storage.getBudgets();
    return budgets.filter(b => b.isActive());
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(id: string): Promise<Budget | null> {
    return await this.storage.getBudget(id);
  }

  /**
   * Create new budget
   */
  async createBudget(data: Partial<Budget>): Promise<Budget> {
    const budget = new Budget(data);

    const validation = budget.validate();
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    await this.storage.saveBudget(budget);
    return budget;
  }

  /**
   * Update budget
   */
  async updateBudget(id: string, data: Partial<Budget>): Promise<Budget> {
    const budget = await this.storage.getBudget(id);
    if (!budget) {
      throw new Error(`Budget not found: ${id}`);
    }

    Object.assign(budget, data);
    budget.updatedAt = new Date();

    const validation = budget.validate();
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    await this.storage.saveBudget(budget);
    return budget;
  }

  /**
   * Delete budget
   */
  async deleteBudget(id: string): Promise<void> {
    const budget = await this.storage.getBudget(id);
    if (!budget) {
      throw new Error(`Budget not found: ${id}`);
    }

    await this.storage.deleteBudget(id);
  }

  /**
   * Calculate budget progress
   */
  async getBudgetProgress(budgetId: string, referenceDate?: Date): Promise<BudgetProgress> {
    const budget = await this.storage.getBudget(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    const date = referenceDate || new Date();
    const period = budget.getCurrentPeriod(date);

    // Get transactions for this budget's categories in the current period
    const spent = await this.calculateSpentAmount(budget, period.start, period.end);

    return {
      budget,
      spent,
      remaining: budget.getRemaining(spent),
      percentage: budget.getSpentPercentage(spent),
      isExceeded: budget.isExceeded(spent),
      shouldAlert: budget.shouldAlert(spent)
    };
  }

  /**
   * Calculate spent amount for a budget
   */
  async calculateSpentAmount(
    budget: Budget,
    startDate: Date,
    endDate: Date
  ): Promise<Decimal> {
    let totalSpent = new Decimal(0);

    for (const categoryId of budget.categoryIds) {
      const transactions = await this.storage.getTransactions({
        categoryId,
        startDate,
        endDate,
        type: TransactionType.EXPENSE
      });

      for (const transaction of transactions) {
        if (transaction.status !== TransactionStatus.VOID) {
          totalSpent = totalSpent.plus(transaction.getAmount());
        }
      }
    }

    return totalSpent;
  }

  /**
   * Get all budget progress for current period
   */
  async getAllBudgetProgress(): Promise<BudgetProgress[]> {
    const budgets = await this.getActiveBudgets();
    const progressList: BudgetProgress[] = [];

    for (const budget of budgets) {
      const progress = await this.getBudgetProgress(budget.id);
      progressList.push(progress);
    }

    return progressList;
  }

  /**
   * Get budgets that need alerts
   */
  async getBudgetsNeedingAlerts(): Promise<BudgetProgress[]> {
    const allProgress = await this.getAllBudgetProgress();
    return allProgress.filter(p => p.shouldAlert || p.isExceeded);
  }

  /**
   * Get budget statistics
   */
  async getBudgetStats(): Promise<{
    totalBudgets: number;
    activeBudgets: number;
    exceededBudgets: number;
    totalBudgeted: Decimal;
    totalSpent: Decimal;
    totalRemaining: Decimal;
  }> {
    const allProgress = await this.getAllBudgetProgress();

    let totalBudgeted = new Decimal(0);
    let totalSpent = new Decimal(0);
    let exceededCount = 0;

    for (const progress of allProgress) {
      totalBudgeted = totalBudgeted.plus(progress.budget.getAmount());
      totalSpent = totalSpent.plus(progress.spent);
      if (progress.isExceeded) exceededCount++;
    }

    const totalRemaining = totalBudgeted.minus(totalSpent);

    return {
      totalBudgets: allProgress.length,
      activeBudgets: allProgress.length,
      exceededBudgets: exceededCount,
      totalBudgeted,
      totalSpent,
      totalRemaining
    };
  }

  /**
   * Get spending trends for budget
   */
  async getBudgetTrends(
    budgetId: string,
    periods: number = 6
  ): Promise<Array<{ period: string; spent: Decimal; budget: Decimal }>> {
    const budget = await this.storage.getBudget(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    const trends: Array<{ period: string; spent: Decimal; budget: Decimal }> = [];
    const now = new Date();

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      const period = budget.getCurrentPeriod(date);
      const spent = await this.calculateSpentAmount(budget, period.start, period.end);

      trends.push({
        period: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        spent,
        budget: budget.getAmount()
      });
    }

    return trends;
  }

  /**
   * Suggest budget adjustments based on spending patterns
   */
  async suggestBudgetAdjustments(budgetId: string): Promise<{
    currentAmount: Decimal;
    suggestedAmount: Decimal;
    reason: string;
  }> {
    const budget = await this.storage.getBudget(budgetId);
    if (!budget) {
      throw new Error(`Budget not found: ${budgetId}`);
    }

    // Get last 3 months of spending
    const trends = await this.getBudgetTrends(budgetId, 3);
    const avgSpent = trends.reduce((sum, t) => sum.plus(t.spent), new Decimal(0))
      .dividedBy(trends.length);

    const currentAmount = budget.getAmount();
    let suggestedAmount = avgSpent.times(1.1); // 10% buffer
    let reason = '';

    if (suggestedAmount.greaterThan(currentAmount.times(1.2))) {
      reason = 'Spending consistently exceeds budget. Consider increasing.';
    } else if (suggestedAmount.lessThan(currentAmount.times(0.8))) {
      reason = 'Spending consistently under budget. Consider decreasing.';
    } else {
      suggestedAmount = currentAmount;
      reason = 'Current budget is appropriate for spending patterns.';
    }

    return {
      currentAmount,
      suggestedAmount,
      reason
    };
  }
}
