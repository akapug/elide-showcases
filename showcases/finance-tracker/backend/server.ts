/**
 * API Server
 *
 * RESTful API for personal finance tracker
 */

import * as http from 'http';
import * as url from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { AccountController } from './controllers/AccountController';
import { TransactionController } from './controllers/TransactionController';
import { BudgetController } from './controllers/BudgetController';
import { CategoryController } from './controllers/CategoryController';
import { ReportController } from './controllers/ReportController';
import { ImportExportController } from './controllers/ImportExportController';

interface Request extends http.IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

type Response = http.ServerResponse;
type Handler = (req: Request, res: Response) => Promise<void> | void;

export function createServer(): http.Server {
  const accountController = new AccountController();
  const transactionController = new TransactionController();
  const budgetController = new BudgetController();
  const categoryController = new CategoryController();
  const reportController = new ReportController();
  const importExportController = new ImportExportController();

  const routes = new Map<string, Map<string, Handler>>();

  // Helper to register routes
  function route(method: string, pattern: string, handler: Handler) {
    if (!routes.has(method)) {
      routes.set(method, new Map());
    }
    routes.get(method)!.set(pattern, handler);
  }

  // Account routes
  route('GET', '/api/accounts', accountController.getAll.bind(accountController));
  route('GET', '/api/accounts/:id', accountController.getOne.bind(accountController));
  route('POST', '/api/accounts', accountController.create.bind(accountController));
  route('PUT', '/api/accounts/:id', accountController.update.bind(accountController));
  route('DELETE', '/api/accounts/:id', accountController.delete.bind(accountController));
  route('GET', '/api/accounts/:id/summary', accountController.getSummary.bind(accountController));
  route('POST', '/api/accounts/:id/reconcile', accountController.reconcile.bind(accountController));

  // Transaction routes
  route('GET', '/api/transactions', transactionController.getAll.bind(transactionController));
  route('GET', '/api/transactions/:id', transactionController.getOne.bind(transactionController));
  route('POST', '/api/transactions', transactionController.create.bind(transactionController));
  route('PUT', '/api/transactions/:id', transactionController.update.bind(transactionController));
  route('DELETE', '/api/transactions/:id', transactionController.delete.bind(transactionController));
  route('POST', '/api/transactions/:id/clear', transactionController.clear.bind(transactionController));
  route('POST', '/api/transactions/:id/void', transactionController.void.bind(transactionController));
  route('GET', '/api/transactions/search', transactionController.search.bind(transactionController));

  // Budget routes
  route('GET', '/api/budgets', budgetController.getAll.bind(budgetController));
  route('GET', '/api/budgets/:id', budgetController.getOne.bind(budgetController));
  route('POST', '/api/budgets', budgetController.create.bind(budgetController));
  route('PUT', '/api/budgets/:id', budgetController.update.bind(budgetController));
  route('DELETE', '/api/budgets/:id', budgetController.delete.bind(budgetController));
  route('GET', '/api/budgets/:id/progress', budgetController.getProgress.bind(budgetController));
  route('GET', '/api/budgets/progress/all', budgetController.getAllProgress.bind(budgetController));

  // Category routes
  route('GET', '/api/categories', categoryController.getAll.bind(categoryController));
  route('GET', '/api/categories/:id', categoryController.getOne.bind(categoryController));
  route('POST', '/api/categories', categoryController.create.bind(categoryController));
  route('PUT', '/api/categories/:id', categoryController.update.bind(categoryController));
  route('DELETE', '/api/categories/:id', categoryController.delete.bind(categoryController));

  // Report routes
  route('GET', '/api/reports/overview', reportController.getOverview.bind(reportController));
  route('GET', '/api/reports/spending', reportController.getSpendingReport.bind(reportController));
  route('GET', '/api/reports/income', reportController.getIncomeReport.bind(reportController));
  route('GET', '/api/reports/trends', reportController.getTrends.bind(reportController));
  route('GET', '/api/reports/net-worth', reportController.getNetWorth.bind(reportController));

  // Import/Export routes
  route('POST', '/api/import/csv', importExportController.importCSV.bind(importExportController));
  route('GET', '/api/export/csv', importExportController.exportCSV.bind(importExportController));
  route('GET', '/api/export/json', importExportController.exportJSON.bind(importExportController));

  const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const parsedUrl = url.parse(req.url || '', true);
    const pathname = parsedUrl.pathname || '/';

    // Serve static files
    if (pathname.startsWith('/') && !pathname.startsWith('/api/')) {
      await serveStatic(pathname, res);
      return;
    }

    // Parse request body for POST/PUT
    if (req.method === 'POST' || req.method === 'PUT') {
      await parseBody(req);
    }

    // Parse query parameters
    (req as Request).query = parsedUrl.query as Record<string, string>;

    // Find matching route
    const methodRoutes = routes.get(req.method || 'GET');
    if (methodRoutes) {
      for (const [pattern, handler] of methodRoutes) {
        const match = matchRoute(pathname, pattern);
        if (match) {
          (req as Request).params = match;
          try {
            await handler(req as Request, res);
            return;
          } catch (error: any) {
            sendError(res, 500, error.message);
            return;
          }
        }
      }
    }

    // No route found
    sendError(res, 404, 'Not found');
  });

  return server;
}

/**
 * Parse request body
 */
async function parseBody(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
        resolve();
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Match route pattern
 */
function matchRoute(pathname: string, pattern: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

/**
 * Send JSON response
 */
export function sendJSON(res: Response, data: any, status: number = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Send error response
 */
export function sendError(res: Response, status: number, message: string): void {
  sendJSON(res, { error: message }, status);
}

/**
 * Serve static files
 */
async function serveStatic(pathname: string, res: Response): Promise<void> {
  const frontendDir = path.join(process.cwd(), 'frontend');
  let filePath = path.join(frontendDir, pathname);

  // Serve index.html for root
  if (pathname === '/') {
    filePath = path.join(frontendDir, 'index.html');
  }

  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const contentType = getContentType(ext);

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Try serving index.html for SPA routing
      try {
        const indexPath = path.join(frontendDir, 'index.html');
        const content = fs.readFileSync(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } catch {
        sendError(res, 404, 'Not found');
      }
    } else {
      sendError(res, 500, 'Internal server error');
    }
  }
}

/**
 * Get content type by extension
 */
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  return types[ext] || 'text/plain';
}
