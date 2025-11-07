/**
 * Accounts Component
 */

import { API } from '../utils/api';
import { Formatter } from '../utils/formatter';
import { Modal } from '../utils/modal';

export class AccountsComponent {
  async load(): Promise<void> {
    await this.loadAccounts();
    this.initEventListeners();
  }

  private async loadAccounts(): Promise<void> {
    try {
      const accounts = await API.getAccounts();
      const container = document.getElementById('accounts-list')!;

      if (accounts.length === 0) {
        container.innerHTML = '<p class="text-muted">No accounts yet. Add your first account to get started.</p>';
        return;
      }

      const html = accounts.map((account: any) => `
        <div class="account-item">
          <div class="item-main">
            <div class="item-title">
              ${account.getTypeIcon ? account.getTypeIcon() : '💳'} ${account.name}
            </div>
            <div class="item-subtitle">
              ${account.institution || 'No institution'} • ${account.type}
              ${account.accountNumber ? ` • ${Formatter.accountNumber(account.accountNumber)}` : ''}
            </div>
          </div>
          <div class="item-amount ${parseFloat(account.balance) >= 0 ? 'text-success' : 'text-danger'}">
            ${Formatter.currency(account.balance, account.currency)}
          </div>
          <div class="item-actions">
            <button class="btn btn-small btn-primary view-account" data-id="${account.id}">View</button>
            <button class="btn btn-small btn-danger delete-account" data-id="${account.id}">Delete</button>
          </div>
        </div>
      `).join('');

      container.innerHTML = html;

      this.attachAccountActions();
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  }

  private initEventListeners(): void {
    document.getElementById('add-account-btn')?.addEventListener('click', () => {
      this.showAccountForm();
    });
  }

  private attachAccountActions(): void {
    document.querySelectorAll('.delete-account').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id && confirm('Are you sure you want to delete this account?')) {
          try {
            await API.deleteAccount(id);
            await this.loadAccounts();
          } catch (error: any) {
            alert(`Failed to delete account: ${error.message}`);
          }
        }
      });
    });
  }

  private showAccountForm(account?: any): void {
    const modal = new Modal();

    const form = `
      <h3>${account ? 'Edit Account' : 'Add Account'}</h3>
      <form id="account-form">
        <div class="form-group">
          <label>Account Name</label>
          <input type="text" name="name" value="${account?.name || ''}" required>
        </div>
        <div class="form-group">
          <label>Type</label>
          <select name="type" required>
            <option value="checking" ${account?.type === 'checking' ? 'selected' : ''}>Checking</option>
            <option value="savings" ${account?.type === 'savings' ? 'selected' : ''}>Savings</option>
            <option value="credit_card" ${account?.type === 'credit_card' ? 'selected' : ''}>Credit Card</option>
            <option value="investment" ${account?.type === 'investment' ? 'selected' : ''}>Investment</option>
            <option value="cash" ${account?.type === 'cash' ? 'selected' : ''}>Cash</option>
          </select>
        </div>
        <div class="form-group">
          <label>Initial Balance</label>
          <input type="number" name="balance" value="${account?.balance || '0'}" step="0.01" required>
        </div>
        <div class="form-group">
          <label>Institution</label>
          <input type="text" name="institution" value="${account?.institution || ''}">
        </div>
        <div class="form-group">
          <label>Currency</label>
          <input type="text" name="currency" value="${account?.currency || 'USD'}" maxlength="3">
        </div>
        <div class="form-actions">
          <button type="button" class="btn" onclick="this.closest('.modal').classList.remove('active')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    `;

    modal.show(form);

    document.getElementById('account-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());

      try {
        if (account) {
          await API.updateAccount(account.id, data);
        } else {
          await API.createAccount(data);
        }
        modal.hide();
        await this.loadAccounts();
      } catch (error: any) {
        alert(`Failed to save account: ${error.message}`);
      }
    });
  }
}
