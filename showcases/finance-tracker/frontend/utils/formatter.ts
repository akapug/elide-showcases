/**
 * Formatter Utilities
 *
 * Format numbers, dates, and currencies
 */

import Decimal from 'decimal.js';

export class Formatter {
  /**
   * Format currency
   */
  static currency(amount: string | number, currency: string = 'USD'): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(num);
  }

  /**
   * Format decimal with precision
   */
  static decimal(amount: string | number, decimals: number = 2): string {
    const decimal = new Decimal(amount);
    return decimal.toFixed(decimals);
  }

  /**
   * Format date
   */
  static date(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  }

  /**
   * Format date for input
   */
  static dateInput(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  /**
   * Format percentage
   */
  static percentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Format number with commas
   */
  static number(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  /**
   * Format account number (mask)
   */
  static accountNumber(number: string): string {
    if (number.length <= 4) return number;
    return `****${number.slice(-4)}`;
  }

  /**
   * Get transaction type display
   */
  static transactionType(type: string): string {
    const types: Record<string, string> = {
      'income': '+ Income',
      'expense': '- Expense',
      'transfer': '↔ Transfer'
    };
    return types[type] || type;
  }

  /**
   * Get status badge color
   */
  static statusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'success',
      'pending': 'warning',
      'cleared': 'success',
      'reconciled': 'info',
      'void': 'danger',
      'closed': 'danger'
    };
    return colors[status] || 'secondary';
  }

  /**
   * Format relative time
   */
  static relativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  /**
   * Truncate text
   */
  static truncate(text: string, length: number = 50): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }
}
