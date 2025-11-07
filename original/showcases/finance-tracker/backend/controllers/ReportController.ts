/**
 * Report Controller
 *
 * HTTP handlers for report and analytics endpoints
 */

import { IncomingMessage, ServerResponse } from 'http';
import Decimal from 'decimal.js';
import { AccountService } from '../services/AccountService';
import { TransactionService } from '../services/TransactionService';
import { BudgetService } from '../services/BudgetService';
import { sendJSON, sendError } from '../server';

interface Request extends IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export class ReportController {
  private accountService = new AccountService();
  private transactionService = new TransactionService();
  private budgetService = new BudgetService();

  async getOverview(req: Request, res: ServerResponse): Promise<void> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [accountStats, monthSummary, budgetStats] = await Promise.all([
        this.accountService.getAccountStats(),
        this.transactionService.getTransactionSummary(startOfMonth, endOfMonth),
        this.budgetService.getBudgetStats()
      ]);

      sendJSON(res, {
        accounts: accountStats,
        month: monthSummary,
        budgets: budgetStats,
        period: {
          start: startOfMonth,
          end: endOfMonth
        }
      });
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async getSpendingReport(req: Request, res: ServerResponse): Promise<void> {
    try {
      const startDate = req.query?.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const endDate = req.query?.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const accountId = req.query?.accountId as string | undefined;

      const spendingByCategory = await this.transactionService.getSpendingByCategory(
        startDate,
        endDate,
        accountId
      );

      const categoryData = Array.from(spendingByCategory.entries()).map(([categoryId, amount]) => ({
        categoryId,
        amount: amount.toString(),
        percentage: 0 // Will calculate below
      }));

      // Calculate percentages
      const total = categoryData.reduce((sum, item) => sum.plus(item.amount), new Decimal(0));
      categoryData.forEach(item => {
        item.percentage = total.isZero() ? 0 : new Decimal(item.amount).dividedBy(total).times(100).toNumber();
      });

      // Sort by amount descending
      categoryData.sort((a, b) => new Decimal(b.amount).minus(a.amount).toNumber());

      sendJSON(res, {
        period: { start: startDate, end: endDate },
        total: total.toString(),
        categories: categoryData
      });
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async getIncomeReport(req: Request, res: ServerResponse): Promise<void> {
    try {
      const startDate = req.query?.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const endDate = req.query?.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const summary = await this.transactionService.getTransactionSummary(startDate, endDate);

      sendJSON(res, {
        period: { start: startDate, end: endDate },
        totalIncome: summary.totalIncome.toString(),
        totalExpense: summary.totalExpense.toString(),
        netIncome: summary.netIncome.toString(),
        transactionCount: summary.transactionCount
      });
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async getTrends(req: Request, res: ServerResponse): Promise<void> {
    try {
      const months = parseInt(req.query?.months as string) || 6;
      const trends: any[] = [];

      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const summary = await this.transactionService.getTransactionSummary(
          startOfMonth,
          endOfMonth
        );

        trends.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          income: summary.totalIncome.toString(),
          expense: summary.totalExpense.toString(),
          net: summary.netIncome.toString()
        });
      }

      sendJSON(res, { trends });
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async getNetWorth(req: Request, res: ServerResponse): Promise<void> {
    try {
      const stats = await this.accountService.getAccountStats();

      sendJSON(res, {
        totalAssets: stats.totalAssets.toString(),
        totalLiabilities: stats.totalLiabilities.toString(),
        netWorth: stats.netWorth.toString(),
        accountCount: stats.totalAccounts
      });
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }
}
