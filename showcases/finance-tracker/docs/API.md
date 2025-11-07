# API Documentation

Personal Finance Tracker API reference.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently no authentication required (self-hosted, local use).

## Endpoints

### Accounts

#### List Accounts
```
GET /api/accounts
```

**Response:**
```json
[
  {
    "id": "acc123",
    "name": "Main Checking",
    "type": "checking",
    "balance": "5432.10",
    "currency": "USD",
    "institution": "Chase Bank",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Account
```
POST /api/accounts
```

**Request Body:**
```json
{
  "name": "Savings Account",
  "type": "savings",
  "balance": "1000.00",
  "currency": "USD",
  "institution": "Bank of America"
}
```

#### Update Account
```
PUT /api/accounts/:id
```

#### Delete Account
```
DELETE /api/accounts/:id
```

#### Get Account Summary
```
GET /api/accounts/:id/summary
```

**Response:**
```json
{
  "account": { /* account object */ },
  "transactionCount": 150,
  "monthlyIncome": "4500.00",
  "monthlyExpense": "3200.00",
  "netChange": "1300.00"
}
```

### Transactions

#### List Transactions
```
GET /api/transactions?accountId=acc123&categoryId=cat123&startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**
- `accountId` (optional): Filter by account
- `categoryId` (optional): Filter by category
- `startDate` (optional): Filter by date range
- `endDate` (optional): Filter by date range
- `type` (optional): income, expense, transfer
- `status` (optional): pending, cleared, reconciled

#### Create Transaction
```
POST /api/transactions
```

**Request Body:**
```json
{
  "accountId": "acc123",
  "type": "expense",
  "amount": "45.50",
  "description": "Grocery shopping",
  "categoryId": "cat123",
  "payee": "Whole Foods",
  "date": "2024-01-15T10:30:00.000Z"
}
```

#### Update Transaction
```
PUT /api/transactions/:id
```

#### Delete Transaction
```
DELETE /api/transactions/:id
```

#### Clear Transaction
```
POST /api/transactions/:id/clear
```

Marks transaction as cleared/reconciled.

#### Void Transaction
```
POST /api/transactions/:id/void
```

Voids a transaction (reverses its effect on account balance).

#### Search Transactions
```
GET /api/transactions/search?q=grocery
```

### Budgets

#### List Budgets
```
GET /api/budgets
```

#### Create Budget
```
POST /api/budgets
```

**Request Body:**
```json
{
  "name": "Food Budget",
  "categoryIds": ["cat1", "cat2"],
  "amount": "600.00",
  "currency": "USD",
  "period": "monthly",
  "alertThreshold": 85
}
```

**Budget Periods:**
- `weekly`
- `monthly`
- `quarterly`
- `yearly`

#### Update Budget
```
PUT /api/budgets/:id
```

#### Delete Budget
```
DELETE /api/budgets/:id
```

#### Get Budget Progress
```
GET /api/budgets/:id/progress
```

**Response:**
```json
{
  "budget": { /* budget object */ },
  "spent": "425.50",
  "remaining": "174.50",
  "percentage": 70.9,
  "isExceeded": false,
  "shouldAlert": false
}
```

#### Get All Budget Progress
```
GET /api/budgets/progress/all
```

### Categories

#### List Categories
```
GET /api/categories
```

#### Create Category
```
POST /api/categories
```

**Request Body:**
```json
{
  "name": "Transportation",
  "type": "expense",
  "color": "#3b82f6",
  "icon": "🚗"
}
```

#### Update Category
```
PUT /api/categories/:id
```

#### Delete Category
```
DELETE /api/categories/:id
```

Note: System categories cannot be deleted.

### Reports

#### Overview Report
```
GET /api/reports/overview
```

**Response:**
```json
{
  "accounts": {
    "totalAccounts": 3,
    "activeAccounts": 3,
    "totalBalance": "12450.00",
    "totalAssets": "15000.00",
    "totalLiabilities": "2550.00",
    "netWorth": "12450.00"
  },
  "month": {
    "totalIncome": "4500.00",
    "totalExpense": "3200.00",
    "netIncome": "1300.00",
    "transactionCount": 45
  },
  "budgets": {
    "totalBudgets": 5,
    "activeBudgets": 5,
    "exceededBudgets": 1,
    "totalBudgeted": "3000.00",
    "totalSpent": "2450.00"
  }
}
```

#### Spending Report
```
GET /api/reports/spending?startDate=2024-01-01&endDate=2024-01-31&accountId=acc123
```

#### Income Report
```
GET /api/reports/income?startDate=2024-01-01&endDate=2024-01-31
```

#### Trends Report
```
GET /api/reports/trends?months=6
```

**Response:**
```json
{
  "trends": [
    {
      "month": "2024-01",
      "income": "4500.00",
      "expense": "3200.00",
      "net": "1300.00"
    }
  ]
}
```

#### Net Worth Report
```
GET /api/reports/net-worth
```

### Import/Export

#### Import CSV
```
POST /api/import/csv
```

**Request Body:**
```json
{
  "accountId": "acc123",
  "csv": "Date,Description,Amount,Payee\n2024-01-15,Groceries,-45.50,Whole Foods"
}
```

**CSV Format:**
```
Date,Description,Amount,Payee,Category
2024-01-15,Groceries,-45.50,Whole Foods,cat123
2024-01-16,Salary,4500.00,Employer Inc,cat456
```

#### Export CSV
```
GET /api/export/csv?accountId=acc123
```

Downloads transactions as CSV file.

#### Export JSON
```
GET /api/export/json
```

Downloads all data as JSON file.

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Data Types

### Account Types
- `checking`
- `savings`
- `credit_card`
- `investment`
- `cash`
- `loan`
- `other`

### Transaction Types
- `income`
- `expense`
- `transfer`

### Transaction Status
- `pending`
- `cleared`
- `reconciled`
- `void`

### Category Types
- `income`
- `expense`
- `transfer`
