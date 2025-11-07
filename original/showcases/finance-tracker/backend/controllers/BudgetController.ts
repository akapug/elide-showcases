/**
 * Budget Controller
 *
 * HTTP handlers for budget endpoints
 */

import { IncomingMessage, ServerResponse } from 'http';
import { BudgetService } from '../services/BudgetService';
import { sendJSON, sendError } from '../server';

interface Request extends IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export class BudgetController {
  private budgetService = new BudgetService();

  async getAll(req: Request, res: ServerResponse): Promise<void> {
    try {
      const budgets = await this.budgetService.getAllBudgets();
      sendJSON(res, budgets);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async getOne(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const budget = await this.budgetService.getBudgetById(id);

      if (!budget) {
        sendError(res, 404, 'Budget not found');
        return;
      }

      sendJSON(res, budget);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async create(req: Request, res: ServerResponse): Promise<void> {
    try {
      const budget = await this.budgetService.createBudget(req.body);
      sendJSON(res, budget, 201);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async update(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const budget = await this.budgetService.updateBudget(id, req.body);
      sendJSON(res, budget);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async delete(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      await this.budgetService.deleteBudget(id);
      sendJSON(res, { success: true });
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async getProgress(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const progress = await this.budgetService.getBudgetProgress(id);
      sendJSON(res, progress);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async getAllProgress(req: Request, res: ServerResponse): Promise<void> {
    try {
      const progress = await this.budgetService.getAllBudgetProgress();
      sendJSON(res, progress);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }
}
