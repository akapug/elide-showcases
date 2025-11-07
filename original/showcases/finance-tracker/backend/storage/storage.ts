/**
 * Storage Layer
 *
 * Simple file-based storage for personal finance data.
 * In production, this would be replaced with a proper database.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { Category } from '../models/Category';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

interface StorageData {
  accounts: any[];
  transactions: any[];
  budgets: any[];
  categories: any[];
  metadata: {
    version: string;
    lastModified: string;
  };
}

class Storage {
  private dataPath: string;
  private data: StorageData;
  private initialized: boolean = false;

  constructor() {
    this.dataPath = path.join(DATA_DIR, 'finance-data.json');
    this.data = this.getEmptyData();
  }

  /**
   * Initialize storage
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      try {
        const fileData = await fs.readFile(this.dataPath, 'utf-8');
        this.data = JSON.parse(fileData);
        console.log('✅ Loaded existing data from storage');
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, initialize with empty data
          await this.save();
          console.log('✅ Initialized new storage');
        } else {
          throw error;
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error);
      throw error;
    }
  }

  /**
   * Get empty data structure
   */
  private getEmptyData(): StorageData {
    return {
      accounts: [],
      transactions: [],
      budgets: [],
      categories: [],
      metadata: {
        version: '1.0.0',
        lastModified: new Date().toISOString()
      }
    };
  }

  /**
   * Save data to disk
   */
  private async save(): Promise<void> {
    this.data.metadata.lastModified = new Date().toISOString();
    await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // Account operations
  async getAccounts(): Promise<Account[]> {
    return this.data.accounts.map(a => Account.fromJSON(a));
  }

  async getAccount(id: string): Promise<Account | null> {
    const account = this.data.accounts.find(a => a.id === id);
    return account ? Account.fromJSON(account) : null;
  }

  async saveAccount(account: Account): Promise<void> {
    const index = this.data.accounts.findIndex(a => a.id === account.id);
    const accountData = account.toJSON();

    if (index >= 0) {
      this.data.accounts[index] = accountData;
    } else {
      this.data.accounts.push(accountData);
    }

    await this.save();
  }

  async deleteAccount(id: string): Promise<void> {
    this.data.accounts = this.data.accounts.filter(a => a.id !== id);
    await this.save();
  }

  // Transaction operations
  async getTransactions(filters?: {
    accountId?: string;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    type?: string;
    status?: string;
  }): Promise<Transaction[]> {
    let transactions = this.data.transactions.map(t => Transaction.fromJSON(t));

    if (filters) {
      if (filters.accountId) {
        transactions = transactions.filter(t => t.accountId === filters.accountId);
      }
      if (filters.categoryId) {
        transactions = transactions.filter(t => t.categoryId === filters.categoryId);
      }
      if (filters.startDate) {
        transactions = transactions.filter(t => t.date >= filters.startDate!);
      }
      if (filters.endDate) {
        transactions = transactions.filter(t => t.date <= filters.endDate!);
      }
      if (filters.type) {
        transactions = transactions.filter(t => t.type === filters.type);
      }
      if (filters.status) {
        transactions = transactions.filter(t => t.status === filters.status);
      }
    }

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    const transaction = this.data.transactions.find(t => t.id === id);
    return transaction ? Transaction.fromJSON(transaction) : null;
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    const index = this.data.transactions.findIndex(t => t.id === transaction.id);
    const transactionData = transaction.toJSON();

    if (index >= 0) {
      this.data.transactions[index] = transactionData;
    } else {
      this.data.transactions.push(transactionData);
    }

    await this.save();
  }

  async deleteTransaction(id: string): Promise<void> {
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    await this.save();
  }

  // Budget operations
  async getBudgets(): Promise<Budget[]> {
    return this.data.budgets.map(b => Budget.fromJSON(b));
  }

  async getBudget(id: string): Promise<Budget | null> {
    const budget = this.data.budgets.find(b => b.id === id);
    return budget ? Budget.fromJSON(budget) : null;
  }

  async saveBudget(budget: Budget): Promise<void> {
    const index = this.data.budgets.findIndex(b => b.id === budget.id);
    const budgetData = budget.toJSON();

    if (index >= 0) {
      this.data.budgets[index] = budgetData;
    } else {
      this.data.budgets.push(budgetData);
    }

    await this.save();
  }

  async deleteBudget(id: string): Promise<void> {
    this.data.budgets = this.data.budgets.filter(b => b.id !== id);
    await this.save();
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return this.data.categories.map(c => Category.fromJSON(c));
  }

  async getCategory(id: string): Promise<Category | null> {
    const category = this.data.categories.find(c => c.id === id);
    return category ? Category.fromJSON(category) : null;
  }

  async saveCategory(category: Category): Promise<void> {
    const index = this.data.categories.findIndex(c => c.id === category.id);
    const categoryData = category.toJSON();

    if (index >= 0) {
      this.data.categories[index] = categoryData;
    } else {
      this.data.categories.push(categoryData);
    }

    await this.save();
  }

  async deleteCategory(id: string): Promise<void> {
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    await this.save();
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    this.data = this.getEmptyData();
    await this.save();
  }

  /**
   * Export all data
   */
  async exportData(): Promise<StorageData> {
    return JSON.parse(JSON.stringify(this.data));
  }

  /**
   * Import data
   */
  async importData(data: Partial<StorageData>): Promise<void> {
    if (data.accounts) {
      this.data.accounts = data.accounts;
    }
    if (data.transactions) {
      this.data.transactions = data.transactions;
    }
    if (data.budgets) {
      this.data.budgets = data.budgets;
    }
    if (data.categories) {
      this.data.categories = data.categories;
    }

    await this.save();
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    accountCount: number;
    transactionCount: number;
    budgetCount: number;
    categoryCount: number;
  }> {
    return {
      accountCount: this.data.accounts.length,
      transactionCount: this.data.transactions.length,
      budgetCount: this.data.budgets.length,
      categoryCount: this.data.categories.length
    };
  }
}

// Singleton instance
const storage = new Storage();

export async function initializeStorage(): Promise<void> {
  await storage.initialize();
}

export function getStorage(): Storage {
  return storage;
}

export { Storage };
