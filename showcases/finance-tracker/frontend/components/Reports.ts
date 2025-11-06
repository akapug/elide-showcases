/**
 * Reports Component
 */

import { API } from '../utils/api';
import { Formatter } from '../utils/formatter';

export class ReportsComponent {
  private currentTab: string = 'overview';

  async load(): Promise<void> {
    this.initTabs();
    await this.loadReport('overview');
  }

  private initTabs(): void {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = (e.target as HTMLElement).getAttribute('data-tab');
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  private switchTab(tab: string): void {
    this.currentTab = tab;

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    this.loadReport(tab);
  }

  private async loadReport(type: string): Promise<void> {
    const container = document.getElementById('report-content')!;

    try {
      switch (type) {
        case 'overview':
          await this.loadOverviewReport(container);
          break;
        case 'spending':
          await this.loadSpendingReport(container);
          break;
        case 'trends':
          await this.loadTrendsReport(container);
          break;
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      container.innerHTML = '<p class="text-danger">Failed to load report</p>';
    }
  }

  private async loadOverviewReport(container: HTMLElement): Promise<void> {
    const [netWorth, overview] = await Promise.all([
      API.getNetWorth(),
      API.getOverview()
    ]);

    const html = `
      <div class="card">
        <h3>Financial Overview</h3>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Net Worth</div>
            <div class="stat-value">${Formatter.currency(netWorth.netWorth)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Assets</div>
            <div class="stat-value text-success">${Formatter.currency(netWorth.totalAssets)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Liabilities</div>
            <div class="stat-value text-danger">${Formatter.currency(netWorth.totalLiabilities)}</div>
          </div>
        </div>

        <h4 class="mt-2">This Month</h4>
        <table>
          <tr>
            <td>Total Income</td>
            <td class="text-right text-success">${Formatter.currency(overview.month.totalIncome)}</td>
          </tr>
          <tr>
            <td>Total Expenses</td>
            <td class="text-right text-danger">${Formatter.currency(overview.month.totalExpense)}</td>
          </tr>
          <tr>
            <td><strong>Net Income</strong></td>
            <td class="text-right"><strong>${Formatter.currency(overview.month.netIncome)}</strong></td>
          </tr>
          <tr>
            <td>Transactions</td>
            <td class="text-right">${overview.month.transactionCount}</td>
          </tr>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  private async loadSpendingReport(container: HTMLElement): Promise<void> {
    const report = await API.getSpendingReport();
    const categories = await API.getCategories();

    let html = `
      <div class="card">
        <h3>Spending by Category</h3>
        <p class="text-muted">
          ${Formatter.date(report.period.start)} - ${Formatter.date(report.period.end)}
        </p>

        <div class="mb-2">
          <strong>Total Spending:</strong> ${Formatter.currency(report.total)}
        </div>

        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Percentage</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const item of report.categories) {
      const category = categories.find((c: any) => c.id === item.categoryId);
      html += `
        <tr>
          <td>${category ? category.name : 'Unknown'}</td>
          <td class="text-right">${Formatter.currency(item.amount)}</td>
          <td class="text-right">${Formatter.percentage(item.percentage)}</td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  private async loadTrendsReport(container: HTMLElement): Promise<void> {
    const trends = await API.getTrends({ months: 6 });

    let html = `
      <div class="card">
        <h3>Income & Expense Trends</h3>
        <p class="text-muted">Last 6 months</p>

        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th class="text-right">Income</th>
              <th class="text-right">Expenses</th>
              <th class="text-right">Net</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const trend of trends.trends) {
      const netClass = parseFloat(trend.net) >= 0 ? 'text-success' : 'text-danger';
      html += `
        <tr>
          <td>${trend.month}</td>
          <td class="text-right text-success">${Formatter.currency(trend.income)}</td>
          <td class="text-right text-danger">${Formatter.currency(trend.expense)}</td>
          <td class="text-right ${netClass}">${Formatter.currency(trend.net)}</td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }
}
