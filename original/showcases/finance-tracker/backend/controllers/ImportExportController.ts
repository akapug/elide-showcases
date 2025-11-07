/**
 * Import/Export Controller
 *
 * HTTP handlers for data import/export
 */

import { IncomingMessage, ServerResponse } from 'http';
import { getStorage } from '../storage/storage';
import { Transaction, TransactionType } from '../models/Transaction';
import { sendJSON, sendError } from '../server';

interface Request extends IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export class ImportExportController {
  private storage = getStorage();

  async importCSV(req: Request, res: ServerResponse): Promise<void> {
    try {
      const { csv, accountId } = req.body;

      if (!csv || !accountId) {
        sendError(res, 400, 'CSV data and account ID required');
        return;
      }

      const lines = csv.split('\n').filter((line: string) => line.trim());
      const imported: Transaction[] = [];
      const errors: string[] = [];

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        try {
          const parts = lines[i].split(',').map((p: string) => p.trim());

          if (parts.length < 3) continue;

          const [date, description, amount, ...rest] = parts;
          const parsedAmount = parseFloat(amount);

          if (isNaN(parsedAmount)) {
            errors.push(`Line ${i + 1}: Invalid amount`);
            continue;
          }

          const transaction = new Transaction({
            accountId,
            type: parsedAmount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
            amount: Math.abs(parsedAmount).toString(),
            description: description || 'Imported transaction',
            date: new Date(date),
            payee: rest[0] || undefined,
            categoryId: rest[1] || undefined
          });

          const validation = transaction.validate();
          if (!validation.valid) {
            errors.push(`Line ${i + 1}: ${validation.errors.join(', ')}`);
            continue;
          }

          await this.storage.saveTransaction(transaction);
          imported.push(transaction);
        } catch (error: any) {
          errors.push(`Line ${i + 1}: ${error.message}`);
        }
      }

      sendJSON(res, {
        imported: imported.length,
        errors,
        transactions: imported
      });
    } catch (error: any) {
      sendError(res, 400, error.message);
    }
  }

  async exportCSV(req: Request, res: ServerResponse): Promise<void> {
    try {
      const accountId = req.query?.accountId as string | undefined;
      const transactions = await this.storage.getTransactions({ accountId });

      let csv = 'Date,Description,Amount,Payee,Category,Status\n';

      for (const transaction of transactions) {
        const amount = transaction.type === TransactionType.INCOME
          ? transaction.amount
          : `-${transaction.amount}`;

        csv += `${transaction.date.toISOString().split('T')[0]},`;
        csv += `"${transaction.description}",`;
        csv += `${amount},`;
        csv += `"${transaction.payee || ''}",`;
        csv += `${transaction.categoryId || ''},`;
        csv += `${transaction.status}\n`;
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="transactions.csv"'
      });
      res.end(csv);
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }

  async exportJSON(req: Request, res: ServerResponse): Promise<void> {
    try {
      const data = await this.storage.exportData();

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="finance-data.json"'
      });
      res.end(JSON.stringify(data, null, 2));
    } catch (error: any) {
      sendError(res, 500, error.message);
    }
  }
}
