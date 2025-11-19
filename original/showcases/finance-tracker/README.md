# Personal Finance Tracker

A self-hosted, privacy-first personal finance and budgeting application built with Elide.

## Features

- **Account Management**: Track checking, savings, credit cards, and investment accounts
- **Transaction Tracking**: Categorize transactions with tags and notes
- **Budget Creation**: Set monthly budgets and monitor spending
- **Reports & Charts**: Visualize spending patterns and trends
- **CSV Import**: Import bank statements
- **Export Data**: Export to CSV, JSON, or PDF
- **Multi-Currency**: Support for multiple currencies with real-time conversion
- **Recurring Transactions**: Automate recurring bills and income
- **Split Transactions**: Split transactions across multiple categories
- **Decimal Precision**: No rounding errors with decimal.js

## Why Choose This?

- **Privacy-First**: Self-hosted, your data never leaves your machine
- **Fast**: Instant startup with Elide's polyglot runtime
- **Accurate**: Uses decimal.js for currency calculations - no floating point errors
- **Simple**: One command to run, no complex setup
- **Powerful**: Python-powered analytics and Ruby-based automation

## Architecture

```
finance-tracker/
├── frontend/          # TypeScript UI (dashboard, transactions, budgets)
├── backend/           # TypeScript API server
├── analytics/         # Python data analysis and forecasting
├── workers/           # Ruby scheduled tasks
├── tests/             # Test suite
└── docs/              # Documentation
```

## Quick Start

```bash
# Run the application
elide serve main.ts

# Access at http://localhost:3000
```

## Technology Stack

- **Frontend**: TypeScript, HTML5, CSS3
- **Backend**: TypeScript, Node.js API
- **Analytics**: Python (pandas, numpy, scikit-learn)
- **Workers**: Ruby (scheduled tasks, automation)
- **Libraries**: decimal.js, validator, nanoid, marked

## Use Cases

- Track personal expenses and income
- Create and monitor monthly budgets
- Analyze spending patterns
- Forecast future expenses
- Generate financial reports
- Import bank statements
- Manage multiple accounts and currencies

## Data Privacy

All data is stored locally. No cloud sync, no tracking, no data sharing.
Your financial data stays on your machine.

## API Endpoints

- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create new account
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `GET /api/reports/:type` - Generate report
- `POST /api/import/csv` - Import CSV data
- `GET /api/export/:format` - Export data

## Contributing

This is a showcase project demonstrating Elide's polyglot capabilities.

## License

MIT License
