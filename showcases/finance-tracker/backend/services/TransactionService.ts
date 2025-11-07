/**
 * Transaction Service
 *
 * Business logic for transaction management
 */

import Decimal from 'decimal.js';
import { getStorage } from '../storage/storage';
import { Transaction, TransactionType, TransactionStatus } from '../models/Transaction';
import { Account } from '../models/Account';

export class TransactionService {
  private storage = getStorage();

  /**
   * Get all transactions
   */
  async getAllTransactions(filters?: {
    accountId?: string;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    type?: string;
    status?: string;
  }): Promise<Transaction[]> {
    return await this.storage.getTransactions(filters);
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction | null> {
    return await this.storage.getTransaction(id);
  }

  /**
   * Create new transaction
   */
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const transaction = new Transaction(data);

    const validation = transaction.validate();
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Update account balance
    const account = await this.storage.getAccount(transaction.accountId);
    if (!account) {
      throw new Error(`Account not found: ${transaction.accountId}`);
    }

    this.updateAccountBalance(account, transaction, 'add');
    await this.storage.saveAccount(account);

    // If transfer, update destination account
    if (transaction.isTransfer() && transaction.toAccountId) {
      const toAccount = await this.storage.getAccount(transaction.toAccountId);
      if (!toAccount) {
        throw new Error(`Destination account not found: ${transaction.toAccountId}`);
      }

      toAccount.addToBalance(transaction.getAmount());
      await this.storage.saveAccount(toAccount);
    }

    await this.storage.saveTransaction(transaction);
    return transaction;
  }

  /**
   * Update transaction
   */
  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const oldTransaction = await this.storage.getTransaction(id);
    if (!oldTransaction) {
      throw new Error(`Transaction not found: ${id}`);
    }

    // Revert old transaction's impact on account
    const account = await this.storage.getAccount(oldTransaction.accountId);
    if (account) {
      this.updateAccountBalance(account, oldTransaction, 'remove');
      await this.storage.saveAccount(account);
    }

    // Update transaction
    Object.assign(oldTransaction, data);
    oldTransaction.updatedAt = new Date();

    const validation = oldTransaction.validate();
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Apply new transaction's impact
    const newAccount = await this.storage.getAccount(oldTransaction.accountId);
    if (newAccount) {
      this.updateAccountBalance(newAccount, oldTransaction, 'add');
      await this.storage.saveAccount(newAccount);
    }

    await this.storage.saveTransaction(oldTransaction);
    return oldTransaction;
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.storage.getTransaction(id);
    if (!transaction) {
      throw new Error(`Transaction not found: ${id}`);
    }

    // Revert transaction's impact on account
    const account = await this.storage.getAccount(transaction.accountId);
    if (account) {
      this.updateAccountBalance(account, transaction, 'remove');
      await this.storage.saveAccount(account);
    }

    await this.storage.deleteTransaction(id);
  }

  /**
   * Clear transaction
   */
  async clearTransaction(id: string): Promise<Transaction> {
    const transaction = await this.storage.getTransaction(id);
    if (!transaction) {
      throw new Error(`Transaction not found: ${id}`);
    }

    transaction.clear();
    await this.storage.saveTransaction(transaction);
    return transaction;
  }

  /**
   * Reconcile transaction
   */
  async reconcileTransaction(id: string): Promise<Transaction> {
    const transaction = await this.storage.getTransaction(id);
    if (!transaction) {
      throw new Error(`Transaction not found: ${id}`);
    }

    transaction.reconcile();
    await this.storage.saveTransaction(transaction);
    return transaction;
  }

  /**
   * Void transaction
   */
  async voidTransaction(id: string): Promise<Transaction> {
    const transaction = await this.storage.getTransaction(id);
    if (!transaction) {
      throw new Error(`Transaction not found: ${id}`);
    }

    // Revert transaction's impact on account
    const account = await this.storage.getAccount(transaction.accountId);
    if (account) {
      this.updateAccountBalance(account, transaction, 'remove');
      await this.storage.saveAccount(account);
    }

    transaction.void();
    await this.storage.saveTransaction(transaction);
    return transaction;
  }

  /**
   * Update account balance based on transaction
   */
  private updateAccountBalance(
    account: Account,
    transaction: Transaction,
    operation: 'add' | 'remove'
  ): void {
    if (transaction.status === TransactionStatus.VOID) return;

    const amount = transaction.getAmount();
    const multiplier = operation === 'add' ? 1 : -1;

    if (transaction.type === TransactionType.INCOME) {
      account.addToBalance(amount.times(multiplier));
    } else if (transaction.type === TransactionType.EXPENSE) {
      account.subtractFromBalance(amount.times(multiplier));
    } else if (transaction.type === TransactionType.TRANSFER) {
      account.subtractFromBalance(amount.times(multiplier));
    }
  }

  /**
   * Get transaction summary by period
   */
  async getTransactionSummary(
    startDate: Date,
    endDate: Date,
    accountId?: string
  ): Promise<{
    totalIncome: Decimal;
    totalExpense: Decimal;
    netIncome: Decimal;
    transactionCount: number;
    avgTransactionAmount: Decimal;
  }> {
    const transactions = await this.storage.getTransactions({
      startDate,
      endDate,
      accountId
    });

    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);
    let count = 0;

    for (const transaction of transactions) {
      if (transaction.status === TransactionStatus.VOID) continue;

      if (transaction.type === TransactionType.INCOME) {
        totalIncome = totalIncome.plus(transaction.getAmount());
        count++;
      } else if (transaction.type === TransactionType.EXPENSE) {
        totalExpense = totalExpense.plus(transaction.getAmount());
        count++;
      }
    }

    const netIncome = totalIncome.minus(totalExpense);
    const avgTransactionAmount = count > 0
      ? totalIncome.plus(totalExpense).dividedBy(count)
      : new Decimal(0);

    return {
      totalIncome,
      totalExpense,
      netIncome,
      transactionCount: count,
      avgTransactionAmount
    };
  }

  /**
   * Get spending by category
   */
  async getSpendingByCategory(
    startDate: Date,
    endDate: Date,
    accountId?: string
  ): Promise<Map<string, Decimal>> {
    const transactions = await this.storage.getTransactions({
      startDate,
      endDate,
      accountId,
      type: TransactionType.EXPENSE
    });

    const spendingByCategory = new Map<string, Decimal>();

    for (const transaction of transactions) {
      if (transaction.status === TransactionStatus.VOID) continue;
      if (!transaction.categoryId) continue;

      const categoryId = transaction.categoryId;
      const currentAmount = spendingByCategory.get(categoryId) || new Decimal(0);
      spendingByCategory.set(categoryId, currentAmount.plus(transaction.getAmount()));
    }

    return spendingByCategory;
  }

  /**
   * Search transactions
   */
  async searchTransactions(query: string): Promise<Transaction[]> {
    const allTransactions = await this.storage.getTransactions();
    const lowerQuery = query.toLowerCase();

    return allTransactions.filter(transaction => {
      return (
        transaction.description.toLowerCase().includes(lowerQuery) ||
        transaction.payee?.toLowerCase().includes(lowerQuery) ||
        transaction.notes?.toLowerCase().includes(lowerQuery) ||
        transaction.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }
}
