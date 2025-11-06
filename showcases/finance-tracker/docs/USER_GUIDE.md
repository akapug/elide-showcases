# User Guide

Complete guide to using the Personal Finance Tracker.

## Getting Started

### Installation

1. Ensure you have Elide installed
2. Clone or navigate to the finance-tracker directory
3. Run the application:

```bash
cd showcases/finance-tracker
elide run main.ts
```

4. Open your browser to `http://localhost:3000`

### First Time Setup

When you first run the application:

1. The system will create a `data/` directory
2. Optional: Seed with sample data by setting environment variable:
   ```bash
   export SEED_DATA=true
   elide run main.ts
   ```

## Core Features

### Dashboard

The dashboard provides an at-a-glance view of your finances:

- **Net Worth**: Total assets minus liabilities
- **Total Assets**: Sum of all positive account balances
- **Monthly Income**: Income for current month
- **Monthly Expenses**: Expenses for current month
- **Recent Transactions**: Last 5 transactions
- **Budget Overview**: Current budget status

### Managing Accounts

**Add an Account:**
1. Click "Accounts" in the navigation
2. Click "Add Account"
3. Fill in the details:
   - Account name (e.g., "Main Checking")
   - Type (checking, savings, credit card, etc.)
   - Initial balance
   - Institution (optional)
   - Currency (default: USD)
4. Click "Save"

**Account Types:**
- **Checking**: Day-to-day spending account
- **Savings**: Emergency fund, savings goals
- **Credit Card**: Track credit card spending
- **Investment**: Stocks, bonds, retirement accounts
- **Cash**: Physical cash
- **Loan**: Mortgages, car loans, etc.

**Reconcile Account:**
- Click "View" on an account
- The system calculates balance from transactions
- Compare with your actual bank balance
- Adjust if needed

### Managing Transactions

**Add a Transaction:**
1. Click "Transactions"
2. Click "Add Transaction"
3. Fill in:
   - Account
   - Type (income/expense)
   - Amount
   - Description
   - Category
   - Date
   - Payee (optional)
4. Click "Save"

**Transaction Types:**
- **Income**: Money coming in (salary, freelance, etc.)
- **Expense**: Money going out (bills, shopping, etc.)
- **Transfer**: Moving money between accounts

**Transaction Status:**
- **Pending**: Not yet cleared with bank
- **Cleared**: Confirmed by bank
- **Reconciled**: Verified and locked
- **Void**: Cancelled transaction

**Filter Transactions:**
- Use the search box to find transactions
- Filter by account
- Filter by category
- Filter by date range

### Creating Budgets

**Create a Budget:**
1. Click "Budgets"
2. Click "Add Budget"
3. Fill in:
   - Budget name (e.g., "Food Budget")
   - Amount (monthly limit)
   - Period (weekly, monthly, quarterly, yearly)
   - Categories (select one or more)
   - Alert threshold (% to trigger warning)
4. Click "Save"

**Monitor Budgets:**
- Green bar: Under 75% spent
- Yellow bar: 75-90% spent
- Red bar: Over 90% or exceeded

**Budget Alerts:**
The system will highlight budgets that:
- Reach the alert threshold
- Are exceeded

### Viewing Reports

**Overview Report:**
- Net worth breakdown
- Account summary
- Monthly income vs. expenses
- Budget statistics

**Spending Report:**
- Spending by category
- Top categories
- Percentage breakdown
- Custom date ranges

**Trends Report:**
- Last 6 months income/expense trends
- Identify patterns
- Track progress

## Advanced Features

### Split Transactions

For transactions that span multiple categories:

1. Create a transaction
2. Add splits:
   - Category 1: $30
   - Category 2: $20
   - Total must equal transaction amount

Example: $50 at grocery store
- Groceries: $40
- Household: $10

### Recurring Transactions

Set up recurring transactions for bills:

1. Create a recurring rule
2. System automatically creates transactions
3. Run scheduler periodically

### Import/Export

**Import CSV:**
1. Prepare CSV file:
   ```
   Date,Description,Amount,Payee,Category
   2024-01-15,Groceries,-45.50,Whole Foods,cat123
   ```
2. Click "Import CSV"
3. Select account
4. Upload file

**Export Data:**
- Export to CSV for spreadsheet analysis
- Export to JSON for backup
- Download from Reports section

### Analytics (Python)

Run analytics scripts for deeper insights:

```bash
# Spending analysis
python analytics/analyzer.py

# Forecasting
python analytics/forecasting.py

# Insights
python analytics/insights.py
```

### Automation (Ruby)

Run scheduled tasks:

```bash
# Process recurring transactions
ruby workers/scheduler.rb

# Send reminders
ruby workers/reminders.rb
```

## Tips & Best Practices

### 1. Regular Updates
- Add transactions daily or weekly
- Keep accounts reconciled
- Review budgets monthly

### 2. Categorize Everything
- Use categories consistently
- Create custom categories as needed
- Review uncategorized transactions

### 3. Set Realistic Budgets
- Base budgets on historical spending
- Start conservative, adjust as needed
- Don't forget irregular expenses

### 4. Track Net Worth
- Update all accounts monthly
- Include all assets and liabilities
- Monitor trends over time

### 5. Use Tags
- Tag transactions for easy filtering
- Examples: #vacation, #holiday, #business
- Search by tags

### 6. Regular Backups
- Export data monthly
- Save JSON backups
- Store securely

### 7. Privacy
- All data is local
- No cloud sync (by design)
- Your data stays on your machine

## Troubleshooting

### Balance Not Matching
1. Reconcile account
2. Check for missing transactions
3. Verify voided transactions

### Budget Not Updating
1. Check date range
2. Verify category assignments
3. Ensure transactions are cleared

### Import Failures
1. Check CSV format
2. Verify date format (YYYY-MM-DD)
3. Check for invalid characters

### Performance Issues
1. Export old data
2. Archive old transactions
3. Run cleanup tasks

## Keyboard Shortcuts

- `Ctrl/Cmd + N`: New transaction
- `Ctrl/Cmd + F`: Search
- `Escape`: Close modal

## Privacy & Security

### Local Storage
- All data stored locally in `data/` directory
- No cloud sync
- No third-party access

### Backup
```bash
# Manual backup
cp data/finance-data.json backups/finance-$(date +%Y%m%d).json

# Automated backup (cron)
0 0 * * * cp /path/to/data/finance-data.json /path/to/backups/finance-$(date +\%Y\%m\%d).json
```

### Data Location
Default: `./data/finance-data.json`

Change with environment variable:
```bash
export DATA_DIR=/secure/location
```

## FAQs

**Q: Can I use this for business finances?**
A: Yes! Create separate accounts for business income and expenses.

**Q: Does it support multiple currencies?**
A: Yes, each account can have its own currency.

**Q: Can I import from my bank?**
A: Currently supports CSV import. Check if your bank provides CSV export.

**Q: Is my data secure?**
A: Data is stored locally on your machine. Use file system encryption for additional security.

**Q: Can multiple people use it?**
A: Current version is single-user. For shared finances, use one account and categories to separate.

**Q: What about taxes?**
A: Export to CSV and provide to your accountant. Add tax-specific categories.

## Support

For issues or questions:
1. Check this user guide
2. Review API documentation
3. Check architecture docs
4. Examine code examples

## Version History

**v1.0.0** - Initial Release
- Account management
- Transaction tracking
- Budget monitoring
- Reports and analytics
- Python analytics engine
- Ruby automation workers
- CSV import/export
