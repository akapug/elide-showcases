/**
 * Category Model
 *
 * Represents a transaction category for organizing expenses and income
 */

import { nanoid } from 'nanoid';

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export interface ICategory {
  id: string;
  name: string;
  type: CategoryType;
  parentId?: string;
  color?: string;
  icon?: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export class Category implements ICategory {
  id: string;
  name: string;
  type: CategoryType;
  parentId?: string;
  color?: string;
  icon?: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;

  constructor(data: Partial<ICategory>) {
    this.id = data.id || nanoid();
    this.name = data.name || '';
    this.type = data.type || CategoryType.EXPENSE;
    this.parentId = data.parentId;
    this.color = data.color;
    this.icon = data.icon;
    this.description = data.description;
    this.isSystem = data.isSystem ?? false;
    this.isActive = data.isActive ?? true;
    this.order = data.order ?? 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.metadata = data.metadata || {};
  }

  /**
   * Is this a parent category?
   */
  isParent(): boolean {
    return !this.parentId;
  }

  /**
   * Is this a subcategory?
   */
  isSubcategory(): boolean {
    return !!this.parentId;
  }

  /**
   * Validate category
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Category name is required');
    }

    if (!this.type || !Object.values(CategoryType).includes(this.type)) {
      errors.push('Valid category type is required');
    }

    if (this.color && !/^#[0-9A-F]{6}$/i.test(this.color)) {
      errors.push('Color must be a valid hex code');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert to JSON
   */
  toJSON(): ICategory {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      parentId: this.parentId,
      color: this.color,
      icon: this.icon,
      description: this.description,
      isSystem: this.isSystem,
      isActive: this.isActive,
      order: this.order,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(json: any): Category {
    return new Category({
      ...json,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    });
  }

  /**
   * Get default expense categories
   */
  static getDefaultExpenseCategories(): Partial<ICategory>[] {
    return [
      { name: 'Housing', icon: '🏠', color: '#3b82f6', type: CategoryType.EXPENSE, order: 1, isSystem: true },
      { name: 'Transportation', icon: '🚗', color: '#8b5cf6', type: CategoryType.EXPENSE, order: 2, isSystem: true },
      { name: 'Food & Dining', icon: '🍔', color: '#ef4444', type: CategoryType.EXPENSE, order: 3, isSystem: true },
      { name: 'Groceries', icon: '🛒', color: '#10b981', type: CategoryType.EXPENSE, order: 4, isSystem: true },
      { name: 'Utilities', icon: '💡', color: '#f59e0b', type: CategoryType.EXPENSE, order: 5, isSystem: true },
      { name: 'Healthcare', icon: '🏥', color: '#ec4899', type: CategoryType.EXPENSE, order: 6, isSystem: true },
      { name: 'Entertainment', icon: '🎬', color: '#14b8a6', type: CategoryType.EXPENSE, order: 7, isSystem: true },
      { name: 'Shopping', icon: '🛍️', color: '#f43f5e', type: CategoryType.EXPENSE, order: 8, isSystem: true },
      { name: 'Insurance', icon: '🛡️', color: '#6366f1', type: CategoryType.EXPENSE, order: 9, isSystem: true },
      { name: 'Education', icon: '📚', color: '#8b5cf6', type: CategoryType.EXPENSE, order: 10, isSystem: true },
      { name: 'Personal Care', icon: '💇', color: '#ec4899', type: CategoryType.EXPENSE, order: 11, isSystem: true },
      { name: 'Travel', icon: '✈️', color: '#06b6d4', type: CategoryType.EXPENSE, order: 12, isSystem: true },
      { name: 'Subscriptions', icon: '📱', color: '#a855f7', type: CategoryType.EXPENSE, order: 13, isSystem: true },
      { name: 'Gifts & Donations', icon: '🎁', color: '#f59e0b', type: CategoryType.EXPENSE, order: 14, isSystem: true },
      { name: 'Other Expenses', icon: '📊', color: '#6b7280', type: CategoryType.EXPENSE, order: 15, isSystem: true }
    ];
  }

  /**
   * Get default income categories
   */
  static getDefaultIncomeCategories(): Partial<ICategory>[] {
    return [
      { name: 'Salary', icon: '💰', color: '#10b981', type: CategoryType.INCOME, order: 1, isSystem: true },
      { name: 'Freelance', icon: '💼', color: '#3b82f6', type: CategoryType.INCOME, order: 2, isSystem: true },
      { name: 'Investments', icon: '📈', color: '#8b5cf6', type: CategoryType.INCOME, order: 3, isSystem: true },
      { name: 'Rental Income', icon: '🏘️', color: '#f59e0b', type: CategoryType.INCOME, order: 4, isSystem: true },
      { name: 'Business Income', icon: '🏢', color: '#06b6d4', type: CategoryType.INCOME, order: 5, isSystem: true },
      { name: 'Other Income', icon: '💵', color: '#6b7280', type: CategoryType.INCOME, order: 6, isSystem: true }
    ];
  }

  /**
   * Get all default categories
   */
  static getAllDefaultCategories(): Partial<ICategory>[] {
    return [
      ...Category.getDefaultExpenseCategories(),
      ...Category.getDefaultIncomeCategories(),
      { name: 'Transfer', icon: '🔄', color: '#6b7280', type: CategoryType.TRANSFER, order: 100, isSystem: true }
    ];
  }
}
