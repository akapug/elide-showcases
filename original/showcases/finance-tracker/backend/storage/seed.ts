/**
 * Database Seeding
 *
 * Populate database with sample data for demonstration
 */

import Decimal from 'decimal.js';
import { getStorage } from './storage';
import { Account, AccountType } from '../models/Account';
import { Transaction, TransactionType, TransactionStatus } from '../models/Transaction';
import { Budget, BudgetPeriod } from '../models/Budget';
import { Category } from '../models/Category';

export async function seedDatabase(): Promise<void> {
  const storage = getStorage();

  console.log('🌱 Seeding database with sample data...');

  // Create default categories
  const categories = Category.getAllDefaultCategories();
  const categoryObjects: Category[] = [];

  for (const categoryData of categories) {
    const category = new Category(categoryData);
    await storage.saveCategory(category);
    categoryObjects.push(category);
  }

  console.log(`✅ Created ${categoryObjects.length} categories`);

  // Create sample accounts
  const checkingAccount = new Account({
    name: 'Main Checking',
    type: AccountType.CHECKING,
    balance: '5432.10',
    currency: 'USD',
    institution: 'Chase Bank',
    accountNumber: '****1234',
    color: '#3b82f6'
  });

  const savingsAccount = new Account({
    name: 'Emergency Fund',
    type: AccountType.SAVINGS,
    balance: '15000.00',
    currency: 'USD',
    institution: 'Chase Bank',
    accountNumber: '****5678',
    color: '#10b981'
  });

  const creditCard = new Account({
    name: 'Rewards Card',
    type: AccountType.CREDIT_CARD,
    balance: '-850.25',
    currency: 'USD',
    institution: 'American Express',
    accountNumber: '****9012',
    color: '#ef4444'
  });

  await storage.saveAccount(checkingAccount);
  await storage.saveAccount(savingsAccount);
  await storage.saveAccount(creditCard);

  console.log('✅ Created 3 sample accounts');

  // Create sample transactions
  const now = new Date();
  const transactions: Transaction[] = [];

  // Income
  const salaryCategory = categoryObjects.find(c => c.name === 'Salary');
  if (salaryCategory) {
    transactions.push(new Transaction({
      accountId: checkingAccount.id,
      type: TransactionType.INCOME,
      amount: '4500.00',
      categoryId: salaryCategory.id,
      payee: 'Employer Inc.',
      description: 'Monthly Salary',
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      status: TransactionStatus.CLEARED
    }));
  }

  // Expenses
  const expenseData = [
    { category: 'Housing', amount: '1500.00', payee: 'Landlord', description: 'Rent Payment', days: 2 },
    { category: 'Utilities', amount: '120.50', payee: 'Electric Company', description: 'Electricity Bill', days: 3 },
    { category: 'Groceries', amount: '85.30', payee: 'Whole Foods', description: 'Weekly Groceries', days: 4 },
    { category: 'Food & Dining', amount: '45.00', payee: 'Pizza Place', description: 'Dinner', days: 5 },
    { category: 'Transportation', amount: '60.00', payee: 'Gas Station', description: 'Fuel', days: 6 },
    { category: 'Entertainment', amount: '15.99', payee: 'Netflix', description: 'Subscription', days: 7 },
    { category: 'Groceries', amount: '92.15', payee: 'Trader Joes', description: 'Weekly Groceries', days: 10 },
    { category: 'Healthcare', amount: '30.00', payee: 'Pharmacy', description: 'Prescription', days: 11 },
    { category: 'Shopping', amount: '75.50', payee: 'Amazon', description: 'Household Items', days: 12 },
    { category: 'Food & Dining', amount: '38.75', payee: 'Coffee Shop', description: 'Coffee & Breakfast', days: 13 }
  ];

  for (const expense of expenseData) {
    const category = categoryObjects.find(c => c.name === expense.category);
    if (category) {
      transactions.push(new Transaction({
        accountId: checkingAccount.id,
        type: TransactionType.EXPENSE,
        amount: expense.amount,
        categoryId: category.id,
        payee: expense.payee,
        description: expense.description,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - expense.days),
        status: TransactionStatus.CLEARED
      }));
    }
  }

  // Save transactions
  for (const transaction of transactions) {
    await storage.saveTransaction(transaction);
  }

  console.log(`✅ Created ${transactions.length} sample transactions`);

  // Create sample budgets
  const budgets: Budget[] = [];

  const housingCategory = categoryObjects.find(c => c.name === 'Housing');
  if (housingCategory) {
    budgets.push(new Budget({
      name: 'Housing Budget',
      categoryIds: [housingCategory.id],
      amount: '1600.00',
      currency: 'USD',
      period: BudgetPeriod.MONTHLY,
      alertThreshold: 90
    }));
  }

  const foodCategories = categoryObjects.filter(c =>
    c.name === 'Food & Dining' || c.name === 'Groceries'
  );
  if (foodCategories.length > 0) {
    budgets.push(new Budget({
      name: 'Food Budget',
      categoryIds: foodCategories.map(c => c.id),
      amount: '600.00',
      currency: 'USD',
      period: BudgetPeriod.MONTHLY,
      alertThreshold: 85
    }));
  }

  const entertainmentCategory = categoryObjects.find(c => c.name === 'Entertainment');
  if (entertainmentCategory) {
    budgets.push(new Budget({
      name: 'Entertainment Budget',
      categoryIds: [entertainmentCategory.id],
      amount: '150.00',
      currency: 'USD',
      period: BudgetPeriod.MONTHLY,
      alertThreshold: 80
    }));
  }

  for (const budget of budgets) {
    await storage.saveBudget(budget);
  }

  console.log(`✅ Created ${budgets.length} sample budgets`);
  console.log('✅ Database seeding complete!');
}
