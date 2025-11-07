/**
 * Dashboard Component
 */

import { API } from '../utils/api';
import { Formatter } from '../utils/formatter';

export class DashboardComponent {
  async load(): Promise<void> {
    await Promise.all([
      this.loadOverview(),
      this.loadRecentTransactions(),
      this.loadBudgetOverview()
    ]);
  }

  private async loadOverview(): Promise<void> {
    try {
      const overview = await API.getOverview();

      // Update stats
      document.getElementById('net-worth')!.textContent = Formatter.currency(overview.accounts.netWorth);
      document.getElementById('total-assets')!.textContent = Formatter.currency(overview.accounts.totalAssets);
      document.getElementById('month-income')!.textContent = Formatter.currency(overview.month.totalIncome);
      document.getElementById('month-expense')!.textContent = Formatter.currency(overview.month.totalExpense);
    } catch (error) {
      console.error('Failed to load overview:', error);
    }
  }

  private async loadRecentTransactions(): Promise<void> {
    try {
      const transactions = await API.getTransactions();
      const container = document.getElementById('recent-transactions')!;

      if (transactions.length === 0) {
        container.innerHTML = '<p class="text-muted">No transactions yet</p>';
        return;
      }

      const html = transactions.slice(0, 5).map((t: any) => `
        <div class="transaction-item">
          <div class="item-main">
            <div class="item-title">${t.description}</div>
            <div class="item-subtitle">${Formatter.date(t.date)}</div>
          </div>
          <div class="item-amount ${t.type === 'income' ? 'text-success' : 'text-danger'}">
            ${t.type === 'income' ? '+' : '-'}${Formatter.currency(t.amount)}
          </div>
        </div>
      `).join('');

      container.innerHTML = html;
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
    }
  }

  private async loadBudgetOverview(): Promise<void> {
    try {
      const budgets = await API.getAllBudgetProgress();
      const container = document.getElementById('budget-overview')!;

      if (budgets.length === 0) {
        container.innerHTML = '<p class="text-muted">No budgets set</p>';
        return;
      }

      const html = budgets.map((b: any) => {
        const percentage = Math.min(b.percentage, 100);
        const statusClass = percentage >= 100 ? 'danger' : percentage >= 90 ? 'warning' : '';

        return `
          <div class="budget-item">
            <div class="item-main">
              <div class="item-title">${b.budget.name}</div>
              <div class="progress-bar">
                <div class="progress-fill ${statusClass}" style="width: ${percentage}%"></div>
              </div>
              <div class="item-subtitle">
                ${Formatter.currency(b.spent)} of ${Formatter.currency(b.budget.amount)}
                (${Formatter.percentage(b.percentage)})
              </div>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = html;
    } catch (error) {
      console.error('Failed to load budget overview:', error);
    }
  }
}
