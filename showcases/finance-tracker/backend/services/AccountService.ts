/**
 * Account Service
 *
 * Business logic for account management
 */

import Decimal from 'decimal.js';
import { getStorage } from '../storage/storage';
import { Account } from '../models/Account';
import { Transaction, TransactionType } from '../models/Transaction';

export class AccountService {
  private storage = getStorage();

  /**
   * Get all accounts
   */
  async getAllAccounts(): Promise<Account[]> {
    return await this.storage.getAccounts();
  }

  /**
   * Get account by ID
   */
  async getAccountById(id: string): Promise<Account | null> {
    return await this.storage.getAccount(id);
  }

  /**
   * Create new account
   */
  async createAccount(data: Partial<Account>): Promise<Account> {
    const account = new Account(data);

    const validation = account.validate();
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    await this.storage.saveAccount(account);
    return account;
  }

  /**
   * Update account
   */
  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    const account = await this.storage.getAccount(id);
    if (!account) {
      throw new Error(`Account not found: ${id}`);
    }

    // Update fields
    Object.assign(account, data);
    account.updatedAt = new Date();

    const validation = account.validate();
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    await this.storage.saveAccount(account);
    return account;
  }

  /**
   * Delete account
   */
  async deleteAccount(id: string): Promise<void> {
    const account = await this.storage.getAccount(id);
    if (!account) {
      throw new Error(`Account not found: ${id}`);
    }

    // Check if account has transactions
    const transactions = await this.storage.getTransactions({ accountId: id });
    if (transactions.length > 0) {
      throw new Error('Cannot delete account with existing transactions');
    }

    await this.storage.deleteAccount(id);
  }

  /**
   * Close account
   */
  async closeAccount(id: string): Promise<Account> {
    const account = await this.storage.getAccount(id);
    if (!account) {
      throw new Error(`Account not found: ${id}`);
    }

    account.close();
    await this.storage.saveAccount(account);
    return account;
  }

  /**
   * Reopen account
   */
  async reopenAccount(id: string): Promise<Account> {
    const account = await this.storage.getAccount(id);
    if (!account) {
      throw new Error(`Account not found: ${id}`);
    }

    account.reopen();
    await this.storage.saveAccount(account);
    return account;
  }

  /**
   * Calculate account balance from transactions
   */
  async calculateBalance(accountId: string): Promise<Decimal> {
    const transactions = await this.storage.getTransactions({ accountId });

    let balance = new Decimal(0);

    for (const transaction of transactions) {
      if (transaction.status === 'void') continue;

      if (transaction.type === TransactionType.INCOME) {
        balance = balance.plus(transaction.getAmount());
      } else if (transaction.type === TransactionType.EXPENSE) {
        balance = balance.minus(transaction.getAmount());
      } else if (transaction.type === TransactionType.TRANSFER) {
        if (transaction.accountId === accountId) {
          // Outgoing transfer
          balance = balance.minus(transaction.getAmount());
        } else if (transaction.toAccountId === accountId) {
          // Incoming transfer
          balance = balance.plus(transaction.getAmount());
        }
      }
    }

    return balance;
  }

  /**
   * Reconcile account balance
   */
  async reconcileBalance(accountId: string): Promise<Account> {
    const account = await this.storage.getAccount(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const calculatedBalance = await this.calculateBalance(accountId);
    account.updateBalance(calculatedBalance);

    await this.storage.saveAccount(account);
    return account;
  }

  /**
   * Get account summary
   */
  async getAccountSummary(accountId: string): Promise<{
    account: Account;
    transactionCount: number;
    lastTransaction?: Transaction;
    monthlyIncome: Decimal;
    monthlyExpense: Decimal;
    netChange: Decimal;
  }> {
    const account = await this.storage.getAccount(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allTransactions = await this.storage.getTransactions({ accountId });
    const monthTransactions = await this.storage.getTransactions({
      accountId,
      startDate: startOfMonth
    });

    let monthlyIncome = new Decimal(0);
    let monthlyExpense = new Decimal(0);

    for (const transaction of monthTransactions) {
      if (transaction.status === 'void') continue;

      if (transaction.type === TransactionType.INCOME) {
        monthlyIncome = monthlyIncome.plus(transaction.getAmount());
      } else if (transaction.type === TransactionType.EXPENSE) {
        monthlyExpense = monthlyExpense.plus(transaction.getAmount());
      }
    }

    const netChange = monthlyIncome.minus(monthlyExpense);

    return {
      account,
      transactionCount: allTransactions.length,
      lastTransaction: allTransactions[0],
      monthlyIncome,
      monthlyExpense,
      netChange
    };
  }

  /**
   * Get account statistics
   */
  async getAccountStats(): Promise<{
    totalAccounts: number;
    activeAccounts: number;
    totalBalance: Decimal;
    totalAssets: Decimal;
    totalLiabilities: Decimal;
    netWorth: Decimal;
  }> {
    const accounts = await this.storage.getAccounts();

    let totalBalance = new Decimal(0);
    let totalAssets = new Decimal(0);
    let totalLiabilities = new Decimal(0);

    for (const account of accounts) {
      if (!account.isActive()) continue;

      const balance = account.getBalance();
      totalBalance = totalBalance.plus(balance);

      if (balance.isPositive()) {
        totalAssets = totalAssets.plus(balance);
      } else {
        totalLiabilities = totalLiabilities.plus(balance.abs());
      }
    }

    const netWorth = totalAssets.minus(totalLiabilities);

    return {
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter(a => a.isActive()).length,
      totalBalance,
      totalAssets,
      totalLiabilities,
      netWorth
    };
  }
}
