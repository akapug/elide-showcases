/**
 * Account Model
 *
 * Represents a financial account (checking, savings, credit card, etc.)
 */

import Decimal from 'decimal.js';
import { nanoid } from 'nanoid';

export enum AccountType {
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  CASH = 'cash',
  LOAN = 'loan',
  OTHER = 'other'
}

export enum AccountStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  FROZEN = 'frozen'
}

export interface IAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: string; // Stored as string for decimal precision
  currency: string;
  institution?: string;
  accountNumber?: string;
  status: AccountStatus;
  color?: string;
  icon?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  metadata?: Record<string, any>;
}

export class Account implements IAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: string;
  currency: string;
  institution?: string;
  accountNumber?: string;
  status: AccountStatus;
  color?: string;
  icon?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  metadata?: Record<string, any>;

  constructor(data: Partial<IAccount>) {
    this.id = data.id || nanoid();
    this.name = data.name || '';
    this.type = data.type || AccountType.CHECKING;
    this.balance = data.balance || '0';
    this.currency = data.currency || 'USD';
    this.institution = data.institution;
    this.accountNumber = data.accountNumber;
    this.status = data.status || AccountStatus.ACTIVE;
    this.color = data.color;
    this.icon = data.icon;
    this.notes = data.notes;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.closedAt = data.closedAt;
    this.metadata = data.metadata || {};
  }

  /**
   * Get balance as Decimal for calculations
   */
  getBalance(): Decimal {
    return new Decimal(this.balance);
  }

  /**
   * Update balance
   */
  updateBalance(amount: Decimal): void {
    this.balance = amount.toString();
    this.updatedAt = new Date();
  }

  /**
   * Add to balance
   */
  addToBalance(amount: Decimal): void {
    const currentBalance = this.getBalance();
    this.balance = currentBalance.plus(amount).toString();
    this.updatedAt = new Date();
  }

  /**
   * Subtract from balance
   */
  subtractFromBalance(amount: Decimal): void {
    const currentBalance = this.getBalance();
    this.balance = currentBalance.minus(amount).toString();
    this.updatedAt = new Date();
  }

  /**
   * Close account
   */
  close(): void {
    this.status = AccountStatus.CLOSED;
    this.closedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Reopen account
   */
  reopen(): void {
    this.status = AccountStatus.ACTIVE;
    this.closedAt = undefined;
    this.updatedAt = new Date();
  }

  /**
   * Validate account data
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Account name is required');
    }

    if (!this.type || !Object.values(AccountType).includes(this.type)) {
      errors.push('Valid account type is required');
    }

    if (!this.currency || this.currency.length !== 3) {
      errors.push('Valid currency code is required (e.g., USD, EUR)');
    }

    try {
      new Decimal(this.balance);
    } catch {
      errors.push('Invalid balance value');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to JSON
   */
  toJSON(): IAccount {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      balance: this.balance,
      currency: this.currency,
      institution: this.institution,
      accountNumber: this.accountNumber,
      status: this.status,
      color: this.color,
      icon: this.icon,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      closedAt: this.closedAt,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: any): Account {
    return new Account({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      closedAt: json.closedAt ? new Date(json.closedAt) : undefined
    });
  }

  /**
   * Get display name with institution
   */
  getDisplayName(): string {
    if (this.institution) {
      return `${this.name} (${this.institution})`;
    }
    return this.name;
  }

  /**
   * Get masked account number
   */
  getMaskedAccountNumber(): string | undefined {
    if (!this.accountNumber) return undefined;

    if (this.accountNumber.length <= 4) {
      return this.accountNumber;
    }

    const lastFour = this.accountNumber.slice(-4);
    return `****${lastFour}`;
  }

  /**
   * Is account active?
   */
  isActive(): boolean {
    return this.status === AccountStatus.ACTIVE;
  }

  /**
   * Is account closed?
   */
  isClosed(): boolean {
    return this.status === AccountStatus.CLOSED;
  }

  /**
   * Get account type icon
   */
  getTypeIcon(): string {
    if (this.icon) return this.icon;

    const iconMap: Record<AccountType, string> = {
      [AccountType.CHECKING]: '💳',
      [AccountType.SAVINGS]: '🏦',
      [AccountType.CREDIT_CARD]: '💎',
      [AccountType.INVESTMENT]: '📈',
      [AccountType.CASH]: '💵',
      [AccountType.LOAN]: '🏠',
      [AccountType.OTHER]: '📊'
    };

    return iconMap[this.type] || '📊';
  }
}
