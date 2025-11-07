/**
 * Transactions Component
 */

import { API } from '../utils/api';
import { Formatter } from '../utils/formatter';
import { Modal } from '../utils/modal';

export class TransactionsComponent {
  private accounts: any[] = [];
  private categories: any[] = [];

  async load(): Promise<void> {
    await this.loadData();
    this.initEventListeners();
  }

  private async loadData(): Promise<void> {
    try {
      [this.accounts, this.categories] = await Promise.all([
        API.getAccounts(),
        API.getCategories()
      ]);

      await this.loadTransactions();
      this.populateFilters();
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  private async loadTransactions(filters?: any): Promise<void> {
    try {
      const transactions = await API.getTransactions(filters);
      const container = document.getElementById('transactions-list')!;

      if (transactions.length === 0) {
        container.innerHTML = '<p class="text-muted">No transactions found</p>';
        return;
      }

      const html = transactions.map((t: any) => {
        const account = this.accounts.find(a => a.id === t.accountId);
        const category = this.categories.find(c => c.id === t.categoryId);

        return `
          <div class="transaction-item">
            <div class="item-main">
              <div class="item-title">${t.description}</div>
              <div class="item-subtitle">
                ${Formatter.date(t.date)} • ${account?.name || 'Unknown Account'}
                ${category ? ` • ${category.name}` : ''}
                ${t.payee ? ` • ${t.payee}` : ''}
              </div>
            </div>
            <div class="item-amount ${t.type === 'income' ? 'text-success' : 'text-danger'}">
              ${t.type === 'income' ? '+' : '-'}${Formatter.currency(t.amount, t.currency)}
            </div>
            <div class="item-actions">
              <button class="btn btn-small btn-primary edit-transaction" data-id="${t.id}">Edit</button>
              <button class="btn btn-small btn-danger delete-transaction" data-id="${t.id}">Delete</button>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = html;

      this.attachTransactionActions();
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }

  private populateFilters(): void {
    const accountFilter = document.getElementById('account-filter') as HTMLSelectElement;
    const categoryFilter = document.getElementById('category-filter') as HTMLSelectElement;

    if (accountFilter) {
      accountFilter.innerHTML = '<option value="">All Accounts</option>' +
        this.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    }

    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="">All Categories</option>' +
        this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  }

  private initEventListeners(): void {
    document.getElementById('add-transaction-btn')?.addEventListener('click', () => {
      this.showTransactionForm();
    });

    document.getElementById('transaction-search')?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      if (query.length > 2) {
        this.searchTransactions(query);
      } else if (query.length === 0) {
        this.loadTransactions();
      }
    });

    document.getElementById('account-filter')?.addEventListener('change', () => {
      this.applyFilters();
    });

    document.getElementById('category-filter')?.addEventListener('change', () => {
      this.applyFilters();
    });
  }

  private async searchTransactions(query: string): Promise<void> {
    try {
      const transactions = await API.searchTransactions(query);
      const container = document.getElementById('transactions-list')!;
      // Render transactions (similar to loadTransactions)
    } catch (error) {
      console.error('Failed to search transactions:', error);
    }
  }

  private applyFilters(): void {
    const accountId = (document.getElementById('account-filter') as HTMLSelectElement).value;
    const categoryId = (document.getElementById('category-filter') as HTMLSelectElement).value;

    const filters: any = {};
    if (accountId) filters.accountId = accountId;
    if (categoryId) filters.categoryId = categoryId;

    this.loadTransactions(filters);
  }

  private attachTransactionActions(): void {
    document.querySelectorAll('.delete-transaction').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id && confirm('Are you sure you want to delete this transaction?')) {
          try {
            await API.deleteTransaction(id);
            await this.loadTransactions();
          } catch (error: any) {
            alert(`Failed to delete transaction: ${error.message}`);
          }
        }
      });
    });
  }

  private showTransactionForm(transaction?: any): void {
    const modal = new Modal();

    const form = `
      <h3>${transaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
      <form id="transaction-form">
        <div class="form-group">
          <label>Account</label>
          <select name="accountId" required>
            ${this.accounts.map(a => `
              <option value="${a.id}" ${transaction?.accountId === a.id ? 'selected' : ''}>
                ${a.name}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Type</label>
          <select name="type" required>
            <option value="income" ${transaction?.type === 'income' ? 'selected' : ''}>Income</option>
            <option value="expense" ${transaction?.type === 'expense' ? 'selected' : ''}>Expense</option>
          </select>
        </div>
        <div class="form-group">
          <label>Amount</label>
          <input type="number" name="amount" value="${transaction?.amount || ''}" step="0.01" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <input type="text" name="description" value="${transaction?.description || ''}" required>
        </div>
        <div class="form-group">
          <label>Category</label>
          <select name="categoryId">
            <option value="">None</option>
            ${this.categories.map(c => `
              <option value="${c.id}" ${transaction?.categoryId === c.id ? 'selected' : ''}>
                ${c.name}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Date</label>
          <input type="date" name="date" value="${transaction ? Formatter.dateInput(transaction.date) : Formatter.dateInput(new Date())}" required>
        </div>
        <div class="form-group">
          <label>Payee</label>
          <input type="text" name="payee" value="${transaction?.payee || ''}">
        </div>
        <div class="form-actions">
          <button type="button" class="btn" onclick="this.closest('.modal').classList.remove('active')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    `;

    modal.show(form);

    document.getElementById('transaction-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());

      try {
        if (transaction) {
          await API.updateTransaction(transaction.id, data);
        } else {
          await API.createTransaction(data);
        }
        modal.hide();
        await this.loadTransactions();
      } catch (error: any) {
        alert(`Failed to save transaction: ${error.message}`);
      }
    });
  }
}
