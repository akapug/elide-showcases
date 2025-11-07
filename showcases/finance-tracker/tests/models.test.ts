/**
 * Model Tests
 *
 * Test cases for data models
 */

import Decimal from 'decimal.js';
import { Account, AccountType, AccountStatus } from '../backend/models/Account';
import { Transaction, TransactionType, TransactionStatus } from '../backend/models/Transaction';
import { Budget, BudgetPeriod } from '../backend/models/Budget';
import { Category, CategoryType } from '../backend/models/Category';

// Simple test framework
class TestSuite {
  private passed: number = 0;
  private failed: number = 0;

  test(name: string, fn: () => void): void {
    try {
      fn();
      this.passed++;
      console.log(`✅ ${name}`);
    } catch (error: any) {
      this.failed++;
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEquals(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected} but got ${actual}`);
    }
  }

  summary(): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log('='.repeat(60));
  }
}

// Run tests
const suite = new TestSuite();

console.log('Running Model Tests...\n');

// Account tests
suite.test('Account creation', () => {
  const account = new Account({
    name: 'Test Account',
    type: AccountType.CHECKING,
    balance: '1000.00'
  });

  suite.assertEquals(account.name, 'Test Account');
  suite.assertEquals(account.type, AccountType.CHECKING);
  suite.assertEquals(account.balance, '1000.00');
});

suite.test('Account balance operations', () => {
  const account = new Account({ balance: '100.00' });

  account.addToBalance(new Decimal('50.50'));
  suite.assertEquals(account.balance, '150.50');

  account.subtractFromBalance(new Decimal('25.25'));
  suite.assertEquals(account.balance, '125.25');
});

suite.test('Account validation', () => {
  const account = new Account({
    name: 'Valid Account',
    type: AccountType.SAVINGS,
    balance: '500.00',
    currency: 'USD'
  });

  const validation = account.validate();
  suite.assert(validation.valid, 'Account should be valid');
  suite.assertEquals(validation.errors.length, 0);
});

suite.test('Account invalid name', () => {
  const account = new Account({
    name: '',
    type: AccountType.CHECKING
  });

  const validation = account.validate();
  suite.assert(!validation.valid, 'Account should be invalid');
  suite.assert(validation.errors.length > 0, 'Should have errors');
});

// Transaction tests
suite.test('Transaction creation', () => {
  const transaction = new Transaction({
    accountId: 'acc123',
    type: TransactionType.EXPENSE,
    amount: '50.00',
    description: 'Test expense'
  });

  suite.assertEquals(transaction.accountId, 'acc123');
  suite.assertEquals(transaction.type, TransactionType.EXPENSE);
  suite.assertEquals(transaction.amount, '50.00');
});

suite.test('Transaction decimal precision', () => {
  const transaction = new Transaction({
    amount: '123.456789'
  });

  const amount = transaction.getAmount();
  suite.assert(amount instanceof Decimal, 'Should return Decimal');
  suite.assertEquals(amount.toString(), '123.456789');
});

suite.test('Transaction validation', () => {
  const transaction = new Transaction({
    accountId: 'acc123',
    type: TransactionType.INCOME,
    amount: '100.00',
    description: 'Salary',
    date: new Date()
  });

  const validation = transaction.validate();
  suite.assert(validation.valid, 'Transaction should be valid');
});

suite.test('Transaction split validation', () => {
  const transaction = new Transaction({
    accountId: 'acc123',
    type: TransactionType.EXPENSE,
    amount: '100.00',
    description: 'Test',
    splits: [
      { categoryId: 'cat1', amount: '60.00' },
      { categoryId: 'cat2', amount: '40.00' }
    ]
  });

  const validation = transaction.validate();
  suite.assert(validation.valid, 'Split transaction should be valid');
});

// Budget tests
suite.test('Budget creation', () => {
  const budget = new Budget({
    name: 'Food Budget',
    categoryIds: ['cat1', 'cat2'],
    amount: '500.00',
    period: BudgetPeriod.MONTHLY
  });

  suite.assertEquals(budget.name, 'Food Budget');
  suite.assertEquals(budget.amount, '500.00');
  suite.assertEquals(budget.period, BudgetPeriod.MONTHLY);
});

suite.test('Budget spent percentage', () => {
  const budget = new Budget({
    amount: '1000.00'
  });

  const spent = new Decimal('250.00');
  const percentage = budget.getSpentPercentage(spent);
  suite.assertEquals(percentage, 25);
});

suite.test('Budget exceeded check', () => {
  const budget = new Budget({
    amount: '100.00'
  });

  suite.assert(!budget.isExceeded(new Decimal('50')), 'Should not be exceeded');
  suite.assert(!budget.isExceeded(new Decimal('100')), 'Should not be exceeded at limit');
  suite.assert(budget.isExceeded(new Decimal('150')), 'Should be exceeded');
});

// Category tests
suite.test('Category creation', () => {
  const category = new Category({
    name: 'Groceries',
    type: CategoryType.EXPENSE,
    color: '#10b981',
    icon: '🛒'
  });

  suite.assertEquals(category.name, 'Groceries');
  suite.assertEquals(category.type, CategoryType.EXPENSE);
  suite.assertEquals(category.color, '#10b981');
});

suite.test('Default categories', () => {
  const categories = Category.getAllDefaultCategories();
  suite.assert(categories.length > 0, 'Should have default categories');

  const hasExpense = categories.some(c => c.type === CategoryType.EXPENSE);
  const hasIncome = categories.some(c => c.type === CategoryType.INCOME);

  suite.assert(hasExpense, 'Should have expense categories');
  suite.assert(hasIncome, 'Should have income categories');
});

// Decimal precision tests
suite.test('Decimal precision - no floating point errors', () => {
  const a = new Decimal('0.1');
  const b = new Decimal('0.2');
  const sum = a.plus(b);

  suite.assertEquals(sum.toString(), '0.3', 'Should handle decimal precision correctly');
});

suite.test('Decimal precision - currency calculations', () => {
  const price = new Decimal('19.99');
  const quantity = new Decimal('3');
  const total = price.times(quantity);

  suite.assertEquals(total.toString(), '59.97', 'Should calculate correctly');
});

suite.summary();
