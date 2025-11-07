/**
 * Transaction Controller
 *
 * HTTP handlers for transaction endpoints
 */

import { IncomingMessage, ServerResponse } from 'http';
import { TransactionService } from '../services/TransactionService';
import { sendJSON, sendError } from '../server';

interface Request extends IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export class TransactionController {
  private transactionService = new TransactionService();

  async getAll(req: Request, res: ServerResponse): Promise<void> {
    try {
      const filters: any = {};

      if (req.query?.accountId) filters.accountId = req.query.accountId;
      if (req.query?.categoryId) filters.categoryId = req.query.categoryId;
      if (req.query?.type) filters.type = req.query.type;
      if (req.query?.status) filters.status = req.query.status;
      if (req.query?.startDate) filters.startDate = new Date(req.query.startDate);
      if (req.query?.endDate) filters.endDate = new Date(req.query.endDate);

      const transactions = await this.transactionService.getAllTransactions(filters);
      sendJSON(res, transactions);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async getOne(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const transaction = await this.transactionService.getTransactionById(id);

      if (!transaction) {
        sendError(res, 404, 'Transaction not found');
        return;
      }

      sendJSON(res, transaction);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async create(req: Request, res: ServerResponse): Promise<void> {
    try {
      const transaction = await this.transactionService.createTransaction(req.body);
      sendJSON(res, transaction, 201);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async update(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const transaction = await this.transactionService.updateTransaction(id, req.body);
      sendJSON(res, transaction);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async delete(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      await this.transactionService.deleteTransaction(id);
      sendJSON(res, { success: true });
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async clear(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const transaction = await this.transactionService.clearTransaction(id);
      sendJSON(res, transaction);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async void(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const transaction = await this.transactionService.voidTransaction(id);
      sendJSON(res, transaction);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async search(req: Request, res: ServerResponse): Promise<void> {
    try {
      const query = req.query?.q || '';
      const transactions = await this.transactionService.searchTransactions(query as string);
      sendJSON(res, transactions);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }
}
