/**
 * Finance Tracker Frontend
 *
 * Main application entry point
 */

import { DashboardComponent } from './components/Dashboard';
import { AccountsComponent } from './components/Accounts';
import { TransactionsComponent } from './components/Transactions';
import { BudgetsComponent } from './components/Budgets';
import { ReportsComponent } from './components/Reports';
import { API } from './utils/api';

class App {
  private currentView: string = 'dashboard';
  private components: Map<string, any> = new Map();

  constructor() {
    this.initComponents();
    this.initNavigation();
    this.loadInitialView();
  }

  /**
   * Initialize components
   */
  private initComponents(): void {
    this.components.set('dashboard', new DashboardComponent());
    this.components.set('accounts', new AccountsComponent());
    this.components.set('transactions', new TransactionsComponent());
    this.components.set('budgets', new BudgetsComponent());
    this.components.set('reports', new ReportsComponent());
  }

  /**
   * Initialize navigation
   */
  private initNavigation(): void {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const view = (e.target as HTMLElement).getAttribute('data-view');
        if (view) {
          this.navigateTo(view);
        }
      });
    });
  }

  /**
   * Navigate to view
   */
  private navigateTo(view: string): void {
    // Hide all views
    document.querySelectorAll('.view').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });

    // Show selected view
    const viewEl = document.getElementById(`${view}-view`);
    if (viewEl) {
      viewEl.style.display = 'block';
    }

    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-view="${view}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    this.currentView = view;

    // Load component
    const component = this.components.get(view);
    if (component && component.load) {
      component.load();
    }
  }

  /**
   * Load initial view
   */
  private loadInitialView(): void {
    this.navigateTo('dashboard');
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new App();
  });
} else {
  new App();
}
