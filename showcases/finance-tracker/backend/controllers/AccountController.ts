/**
 * Account Controller
 *
 * HTTP handlers for account endpoints
 */

import { IncomingMessage, ServerResponse } from 'http';
import { AccountService } from '../services/AccountService';
import { sendJSON, sendError } from '../server';

interface Request extends IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export class AccountController {
  private accountService = new AccountService();

  async getAll(req: Request, res: ServerResponse): Promise<void> {
    try {
      const accounts = await this.accountService.getAllAccounts();
      sendJSON(res, accounts);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async getOne(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const account = await this.accountService.getAccountById(id);

      if (!account) {
        sendError(res, 404, 'Account not found');
        return;
      }

      sendJSON(res, account);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async create(req: Request, res: ServerResponse): Promise<void> {
    try {
      const account = await this.accountService.createAccount(req.body);
      sendJSON(res, account, 201);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async update(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const account = await this.accountService.updateAccount(id, req.body);
      sendJSON(res, account);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async delete(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      await this.accountService.deleteAccount(id);
      sendJSON(res, { success: true });
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async getSummary(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const summary = await this.accountService.getAccountSummary(id);
      sendJSON(res, summary);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async reconcile(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { id } = req.params!;
      const account = await this.accountService.reconcileBalance(id);
      sendJSON(res, account);
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }
}
