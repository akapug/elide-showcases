/**
 * API Utility
 *
 * HTTP client for backend API
 */

const API_BASE = 'http://localhost:3000/api';

export class API {
  /**
   * Make GET request
   */
  static async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    const url = new URL(`${API_BASE}${endpoint}`);

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }

    const response = await fetch(url.toString());
    return this.handleResponse(response);
  }

  /**
   * Make POST request
   */
  static async post(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return this.handleResponse(response);
  }

  /**
   * Make PUT request
   */
  static async put(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    return this.handleResponse(response);
  }

  /**
   * Make DELETE request
   */
  static async delete(endpoint: string): Promise<any> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE'
    });

    return this.handleResponse(response);
  }

  /**
   * Handle response
   */
  private static async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  }

  // Account endpoints
  static getAccounts = () => this.get('/accounts');
  static getAccount = (id: string) => this.get(`/accounts/${id}`);
  static createAccount = (data: any) => this.post('/accounts', data);
  static updateAccount = (id: string, data: any) => this.put(`/accounts/${id}`, data);
  static deleteAccount = (id: string) => this.delete(`/accounts/${id}`);
  static getAccountSummary = (id: string) => this.get(`/accounts/${id}/summary`);

  // Transaction endpoints
  static getTransactions = (filters?: any) => this.get('/transactions', filters);
  static getTransaction = (id: string) => this.get(`/transactions/${id}`);
  static createTransaction = (data: any) => this.post('/transactions', data);
  static updateTransaction = (id: string, data: any) => this.put(`/transactions/${id}`, data);
  static deleteTransaction = (id: string) => this.delete(`/transactions/${id}`);
  static searchTransactions = (query: string) => this.get('/transactions/search', { q: query });

  // Budget endpoints
  static getBudgets = () => this.get('/budgets');
  static getBudget = (id: string) => this.get(`/budgets/${id}`);
  static createBudget = (data: any) => this.post('/budgets', data);
  static updateBudget = (id: string, data: any) => this.put(`/budgets/${id}`, data);
  static deleteBudget = (id: string) => this.delete(`/budgets/${id}`);
  static getBudgetProgress = (id: string) => this.get(`/budgets/${id}/progress`);
  static getAllBudgetProgress = () => this.get('/budgets/progress/all');

  // Category endpoints
  static getCategories = () => this.get('/categories');

  // Report endpoints
  static getOverview = () => this.get('/reports/overview');
  static getSpendingReport = (params?: any) => this.get('/reports/spending', params);
  static getIncomeReport = (params?: any) => this.get('/reports/income', params);
  static getTrends = (params?: any) => this.get('/reports/trends', params);
  static getNetWorth = () => this.get('/reports/net-worth');

  // Import/Export endpoints
  static importCSV = (data: any) => this.post('/import/csv', data);
  static exportCSV = (accountId?: string) => {
    const params = accountId ? `?accountId=${accountId}` : '';
    window.open(`${API_BASE}/export/csv${params}`, '_blank');
  };
  static exportJSON = () => {
    window.open(`${API_BASE}/export/json`, '_blank');
  };
}
