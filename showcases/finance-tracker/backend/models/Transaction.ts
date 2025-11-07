/**
 * Transaction Model
 *
 * Represents a financial transaction (income, expense, transfer)
 */

import Decimal from 'decimal.js';
import { nanoid } from 'nanoid';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export enum TransactionStatus {
  PENDING = 'pending',
  CLEARED = 'cleared',
  RECONCILED = 'reconciled',
  VOID = 'void'
}

export interface SplitTransaction {
  categoryId: string;
  amount: string;
  notes?: string;
}

export interface ITransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: string;
  currency: string;
  categoryId?: string;
  payee?: string;
  description: string;
  date: Date;
  status: TransactionStatus;
  tags: string[];
  notes?: string;
  isRecurring: boolean;
  recurringId?: string;
  splits?: SplitTransaction[];
  toAccountId?: string; // For transfers
  attachments?: string[];
  location?: string;
  checkNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  clearedAt?: Date;
  reconciledAt?: Date;
  metadata?: Record<string, any>;
}

export class Transaction implements ITransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: string;
  currency: string;
  categoryId?: string;
  payee?: string;
  description: string;
  date: Date;
  status: TransactionStatus;
  tags: string[];
  notes?: string;
  isRecurring: boolean;
  recurringId?: string;
  splits?: SplitTransaction[];
  toAccountId?: string;
  attachments?: string[];
  location?: string;
  checkNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  clearedAt?: Date;
  reconciledAt?: Date;
  metadata?: Record<string, any>;

  constructor(data: Partial<ITransaction>) {
    this.id = data.id || nanoid();
    this.accountId = data.accountId || '';
    this.type = data.type || TransactionType.EXPENSE;
    this.amount = data.amount || '0';
    this.currency = data.currency || 'USD';
    this.categoryId = data.categoryId;
    this.payee = data.payee;
    this.description = data.description || '';
    this.date = data.date || new Date();
    this.status = data.status || TransactionStatus.PENDING;
    this.tags = data.tags || [];
    this.notes = data.notes;
    this.isRecurring = data.isRecurring || false;
    this.recurringId = data.recurringId;
    this.splits = data.splits;
    this.toAccountId = data.toAccountId;
    this.attachments = data.attachments || [];
    this.location = data.location;
    this.checkNumber = data.checkNumber;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.clearedAt = data.clearedAt;
    this.reconciledAt = data.reconciledAt;
    this.metadata = data.metadata || {};
  }

  /**
   * Get amount as Decimal
   */
  getAmount(): Decimal {
    return new Decimal(this.amount);
  }

  /**
   * Get absolute amount (always positive)
   */
  getAbsoluteAmount(): Decimal {
    return this.getAmount().abs();
  }

  /**
   * Is this a split transaction?
   */
  isSplit(): boolean {
    return !!this.splits && this.splits.length > 0;
  }

  /**
   * Is this a transfer?
   */
  isTransfer(): boolean {
    return this.type === TransactionType.TRANSFER;
  }

  /**
   * Clear transaction
   */
  clear(): void {
    this.status = TransactionStatus.CLEARED;
    this.clearedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Reconcile transaction
   */
  reconcile(): void {
    this.status = TransactionStatus.RECONCILED;
    this.reconciledAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Void transaction
   */
  void(): void {
    this.status = TransactionStatus.VOID;
    this.updatedAt = new Date();
  }

  /**
   * Add tag
   */
  addTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove tag
   */
  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  /**
   * Validate transaction
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.accountId) {
      errors.push('Account ID is required');
    }

    if (!this.type || !Object.values(TransactionType).includes(this.type)) {
      errors.push('Valid transaction type is required');
    }

    try {
      const amount = new Decimal(this.amount);
      if (amount.isZero()) {
        errors.push('Amount cannot be zero');
      }
    } catch {
      errors.push('Invalid amount value');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!this.date) {
      errors.push('Date is required');
    }

    if (this.type === TransactionType.TRANSFER && !this.toAccountId) {
      errors.push('Transfer requires destination account');
    }

    if (this.isSplit()) {
      const totalSplitAmount = this.splits!.reduce((sum, split) => {
        return sum.plus(new Decimal(split.amount));
      }, new Decimal(0));

      if (!totalSplitAmount.equals(this.getAbsoluteAmount())) {
        errors.push('Split amounts must equal transaction amount');
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
  toJSON(): ITransaction {
    return {
      id: this.id,
      accountId: this.accountId,
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      categoryId: this.categoryId,
      payee: this.payee,
      description: this.description,
      date: this.date,
      status: this.status,
      tags: this.tags,
      notes: this.notes,
      isRecurring: this.isRecurring,
      recurringId: this.recurringId,
      splits: this.splits,
      toAccountId: this.toAccountId,
      attachments: this.attachments,
      location: this.location,
      checkNumber: this.checkNumber,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      clearedAt: this.clearedAt,
      reconciledAt: this.reconciledAt,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: any): Transaction {
    return new Transaction({
      ...json,
      date: new Date(json.date),
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      clearedAt: json.clearedAt ? new Date(json.clearedAt) : undefined,
      reconciledAt: json.reconciledAt ? new Date(json.reconciledAt) : undefined
    });
  }

  /**
   * Get display amount (with sign)
   */
  getDisplayAmount(): string {
    const amount = this.getAmount();
    const sign = this.type === TransactionType.INCOME ? '+' : '-';
    return `${sign}${amount.abs().toFixed(2)}`;
  }

  /**
   * Get impact on account balance
   */
  getBalanceImpact(): Decimal {
    if (this.type === TransactionType.INCOME) {
      return this.getAmount();
    } else if (this.type === TransactionType.EXPENSE) {
      return this.getAmount().negated();
    }
    // For transfers, impact depends on which account perspective
    return new Decimal(0);
  }

  /**
   * Clone transaction
   */
  clone(): Transaction {
    return new Transaction({
      ...this.toJSON(),
      id: nanoid(), // New ID
      createdAt: new Date(),
      updatedAt: new Date(),
      status: TransactionStatus.PENDING,
      clearedAt: undefined,
      reconciledAt: undefined
    });
  }
}
