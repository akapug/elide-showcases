/**
 * Budgets Component
 */

import { API } from '../utils/api';
import { Formatter } from '../utils/formatter';
import { Modal } from '../utils/modal';

export class BudgetsComponent {
  private categories: any[] = [];

  async load(): Promise<void> {
    this.categories = await API.getCategories();
    await this.loadBudgets();
    this.initEventListeners();
  }

  private async loadBudgets(): Promise<void> {
    try {
      const budgets = await API.getAllBudgetProgress();
      const container = document.getElementById('budgets-list')!;

      if (budgets.length === 0) {
        container.innerHTML = '<p class="text-muted">No budgets yet. Create your first budget to start tracking spending.</p>';
        return;
      }

      const html = budgets.map((b: any) => {
        const percentage = Math.min(b.percentage, 100);
        const statusClass = percentage >= 100 ? 'danger' : percentage >= 90 ? 'warning' : '';
        const statusText = b.isExceeded ? 'Exceeded' : b.shouldAlert ? 'Warning' : 'On Track';

        return `
          <div class="budget-item card">
            <div class="item-main">
              <div class="item-title">${b.budget.name}</div>
              <div class="item-subtitle">
                ${b.budget.getPeriodDisplayName ? b.budget.getPeriodDisplayName() : b.budget.period}
                • ${statusText}
              </div>
              <div class="progress-bar mt-2">
                <div class="progress-fill ${statusClass}" style="width: ${percentage}%"></div>
              </div>
              <div class="item-subtitle mt-2">
                ${Formatter.currency(b.spent)} of ${Formatter.currency(b.budget.amount)}
                (${Formatter.percentage(b.percentage)})
                • Remaining: ${Formatter.currency(b.remaining)}
              </div>
            </div>
            <div class="item-actions">
              <button class="btn btn-small btn-primary edit-budget" data-id="${b.budget.id}">Edit</button>
              <button class="btn btn-small btn-danger delete-budget" data-id="${b.budget.id}">Delete</button>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = html;

      this.attachBudgetActions();
    } catch (error) {
      console.error('Failed to load budgets:', error);
    }
  }

  private initEventListeners(): void {
    document.getElementById('add-budget-btn')?.addEventListener('click', () => {
      this.showBudgetForm();
    });
  }

  private attachBudgetActions(): void {
    document.querySelectorAll('.delete-budget').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.target as HTMLElement).getAttribute('data-id');
        if (id && confirm('Are you sure you want to delete this budget?')) {
          try {
            await API.deleteBudget(id);
            await this.loadBudgets();
          } catch (error: any) {
            alert(`Failed to delete budget: ${error.message}`);
          }
        }
      });
    });
  }

  private showBudgetForm(budget?: any): void {
    const modal = new Modal();

    const form = `
      <h3>${budget ? 'Edit Budget' : 'Create Budget'}</h3>
      <form id="budget-form">
        <div class="form-group">
          <label>Budget Name</label>
          <input type="text" name="name" value="${budget?.name || ''}" required>
        </div>
        <div class="form-group">
          <label>Amount</label>
          <input type="number" name="amount" value="${budget?.amount || ''}" step="0.01" required>
        </div>
        <div class="form-group">
          <label>Period</label>
          <select name="period" required>
            <option value="weekly" ${budget?.period === 'weekly' ? 'selected' : ''}>Weekly</option>
            <option value="monthly" ${budget?.period === 'monthly' ? 'selected' : ''}>Monthly</option>
            <option value="quarterly" ${budget?.period === 'quarterly' ? 'selected' : ''}>Quarterly</option>
            <option value="yearly" ${budget?.period === 'yearly' ? 'selected' : ''}>Yearly</option>
          </select>
        </div>
        <div class="form-group">
          <label>Categories</label>
          <select name="categoryIds" multiple style="height: 120px;">
            ${this.categories.filter(c => c.type === 'expense').map(c => `
              <option value="${c.id}">${c.name}</option>
            `).join('')}
          </select>
          <small class="text-muted">Hold Ctrl/Cmd to select multiple</small>
        </div>
        <div class="form-group">
          <label>Alert Threshold (%)</label>
          <input type="number" name="alertThreshold" value="${budget?.alertThreshold || 85}" min="0" max="100">
        </div>
        <div class="form-actions">
          <button type="button" class="btn" onclick="this.closest('.modal').classList.remove('active')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    `;

    modal.show(form);

    document.getElementById('budget-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);

      const categoryIds = Array.from((e.target as HTMLFormElement).elements.namedItem('categoryIds') as HTMLSelectElement)
        .filter((opt: any) => opt.selected)
        .map((opt: any) => opt.value);

      const data: any = {
        name: formData.get('name'),
        amount: formData.get('amount'),
        period: formData.get('period'),
        categoryIds,
        alertThreshold: parseInt(formData.get('alertThreshold') as string)
      };

      try {
        if (budget) {
          await API.updateBudget(budget.id, data);
        } else {
          await API.createBudget(data);
        }
        modal.hide();
        await this.loadBudgets();
      } catch (error: any) {
        alert(`Failed to save budget: ${error.message}`);
      }
    });
  }
}
