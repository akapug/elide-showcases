# Architecture Documentation

## Overview

Personal Finance Tracker is a polyglot application built with Elide, demonstrating seamless integration of TypeScript, Python, and Ruby for different concerns.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (TypeScript)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │Accounts  │  │Transactions│ │Reports  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP/REST API
┌───────────────────────▼─────────────────────────────────┐
│                  Backend (TypeScript)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Controllers  │  │  Services    │  │   Models     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Storage Layer (JSON)                 │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼──────────┐           ┌────────▼────────┐
│  Analytics       │           │   Workers       │
│  (Python)        │           │   (Ruby)        │
│  - Forecasting   │           │   - Scheduler   │
│  - Insights      │           │   - Reminders   │
│  - ML Models     │           │   - Cleanup     │
└──────────────────┘           └─────────────────┘
```

## Component Details

### Frontend (TypeScript)

**Location:** `/frontend/`

**Purpose:** User interface and interaction

**Key Components:**
- `Dashboard.ts` - Overview and summary
- `Accounts.ts` - Account management
- `Transactions.ts` - Transaction CRUD
- `Budgets.ts` - Budget creation and monitoring
- `Reports.ts` - Analytics and reports

**Libraries:**
- decimal.js - Precise currency calculations
- Native fetch API - HTTP requests
- Vanilla TypeScript - No frameworks (lightweight)

### Backend (TypeScript)

**Location:** `/backend/`

**Purpose:** API server and business logic

**Architecture:**
```
Controllers → Services → Models → Storage
```

**Layers:**

1. **Controllers** (`/controllers/`)
   - Handle HTTP requests/responses
   - Input validation
   - Route handling

2. **Services** (`/services/`)
   - Business logic
   - Data aggregation
   - Complex operations

3. **Models** (`/models/`)
   - Data structures
   - Validation
   - Business rules

4. **Storage** (`/storage/`)
   - Data persistence
   - File-based JSON storage
   - CRUD operations

**Key Features:**
- Decimal precision for all currency calculations
- Transaction atomicity
- Account balance reconciliation
- Budget progress tracking

### Analytics (Python)

**Location:** `/analytics/`

**Purpose:** Data analysis and forecasting

**Modules:**

1. **analyzer.py**
   - Spending pattern analysis
   - Anomaly detection
   - Savings rate calculation
   - Actionable insights

2. **forecasting.py**
   - Future spending prediction
   - Seasonal pattern detection
   - Budget adherence prediction
   - Trend analysis

**Why Python?**
- Rich data science ecosystem
- Simple statistics and ML
- Easy to extend with pandas, numpy, scikit-learn

### Workers (Ruby)

**Location:** `/workers/`

**Purpose:** Scheduled tasks and automation

**Modules:**

1. **scheduler.rb**
   - Process recurring transactions
   - Execute scheduled tasks
   - Data cleanup

2. **reminders.rb**
   - Bill reminders
   - Budget alerts
   - Low balance notifications
   - Daily summaries

**Why Ruby?**
- Elegant syntax for scripting
- Excellent for automation
- Strong date/time handling

## Data Flow

### Transaction Creation

```
1. Frontend form submission
   ↓
2. POST /api/transactions
   ↓
3. TransactionController.create()
   ↓
4. TransactionService.createTransaction()
   ↓
5. Transaction model validation
   ↓
6. Update account balance
   ↓
7. Storage.saveTransaction()
   ↓
8. Return transaction to frontend
```

### Budget Monitoring

```
1. User views budgets
   ↓
2. GET /api/budgets/progress/all
   ↓
3. BudgetController.getAllProgress()
   ↓
4. BudgetService.getAllBudgetProgress()
   ↓
5. For each budget:
   - Get period dates
   - Query transactions
   - Calculate spent amount
   - Calculate percentage
   ↓
6. Return progress array
```

## Data Model

### Core Entities

**Account**
- Financial account (bank, credit card, etc.)
- Tracks balance
- Has type and status

**Transaction**
- Income, expense, or transfer
- Belongs to account
- Can be split across categories
- Has status (pending, cleared, reconciled)

**Budget**
- Spending limit for categories
- Has period (weekly, monthly, etc.)
- Tracks progress
- Can alert at threshold

**Category**
- Organizes transactions
- Income or expense type
- Can have parent/child hierarchy

### Relationships

```
Account 1───N Transaction
Category 1───N Transaction
Budget 1───N Category
Transaction 1───N Split
```

## Security Considerations

**Current Implementation:**
- Local-only (no authentication)
- File-based storage
- No cloud sync

**Production Enhancements:**
- Add user authentication (JWT)
- Encrypt sensitive data
- Use proper database (PostgreSQL)
- Add rate limiting
- Input sanitization (already using validator)

## Performance

**Optimizations:**
- Decimal.js for precision without overhead
- Simple file-based storage (fast for single user)
- Efficient filtering in queries
- Minimal dependencies

**Scalability:**
- Single-user design (no concurrent access needed)
- Can migrate to database for multi-user
- API is stateless (easy to scale)

## Testing

**Test Coverage:**
- Model validation
- Business logic
- Decimal precision
- API endpoints (manual testing)

**Test File:** `/tests/models.test.ts`

## Deployment

**Development:**
```bash
elide run main.ts
```

**Production:**
```bash
# Set environment variables
export PORT=3000
export DATA_DIR=/path/to/data

# Seed initial data
export SEED_DATA=true

# Run
elide run main.ts
```

## Future Enhancements

1. **Multi-currency Support**
   - Exchange rate API integration
   - Currency conversion

2. **Import Integrations**
   - Plaid API for bank connections
   - OFX file support

3. **Visualization**
   - Charts and graphs
   - Spending trends visualization

4. **Mobile App**
   - React Native or Flutter
   - Same backend API

5. **AI Features**
   - Smart categorization
   - Spending predictions
   - Financial advice

## Technology Stack

- **Runtime:** Elide
- **Frontend:** TypeScript, HTML5, CSS3
- **Backend:** TypeScript, Node.js
- **Analytics:** Python 3
- **Workers:** Ruby
- **Libraries:**
  - decimal.js - Precise math
  - validator - Input validation
  - nanoid - ID generation
  - marked - Markdown rendering

## File Structure

```
finance-tracker/
├── main.ts              # Entry point
├── package.json         # Dependencies
├── frontend/            # UI
│   ├── index.html
│   ├── app.ts
│   ├── styles.css
│   ├── components/
│   └── utils/
├── backend/             # API server
│   ├── server.ts
│   ├── models/
│   ├── services/
│   ├── controllers/
│   └── storage/
├── analytics/           # Python analytics
│   ├── analyzer.py
│   └── forecasting.py
├── workers/             # Ruby automation
│   ├── scheduler.rb
│   └── reminders.rb
├── tests/               # Test suite
└── docs/                # Documentation
```
