# Case Study: Eliminating Rounding Errors in Payment Processing

## The Problem

**PayFlow**, a payment processing platform handling $50M/month in transactions, runs a polyglot microservices architecture:

- **Node.js API** (merchant-facing, processes 500K transactions/day)
- **Python workers** (fraud detection, analytics, reporting)
- **Ruby services** (legacy payment reconciliation, Sidekiq jobs)
- **Java core** (PCI-compliant payment vault, settlement)

Each service was performing financial calculations using native types:
- Node.js: JavaScript `Number` (64-bit floating-point)
- Python: `float` (64-bit floating-point)
- Ruby: `Float` (64-bit floating-point)
- Java: `double` (64-bit floating-point)

### The Crisis: $14,247 Missing

In Q3 2024, PayFlow's finance team discovered a **$14,247 discrepancy** between processed transactions and actual settlements. After weeks of investigation, they traced it to **floating-point rounding errors** accumulating across millions of transactions.

### Root Causes

1. **Floating-Point Arithmetic Errors**
   ```javascript
   // Node.js calculation
   0.1 + 0.2  // 0.30000000000000004 (not 0.3!)

   // Real transaction error
   const price = 19.99;
   const quantity = 100;
   const tax = 0.0825;
   const total = (price * quantity) * (1 + tax);
   // Expected: $2,163.92
   // Actual:   $2,163.9174999999997
   ```

2. **Inconsistent Rounding Across Languages**
   - Node.js rounds `$10.125` to `$10.12`
   - Python rounds `$10.125` to `$10.13`
   - Ruby rounds `$10.125` to `$10.12`
   - Java rounds `$10.125` to `$10.13`

3. **Cross-Service Calculation Drift**
   - Node.js API calculates total: `$100.00`
   - Python worker recalculates: `$100.01` (off by 1¢)
   - Over 1M transactions → $10,000 discrepancy

4. **Penny Rounding Accumulation**
   - Each transaction: 0.01¢ - 0.1¢ error
   - 500K transactions/day × 0.05¢ average = **$250/day loss**
   - Q3 total: **$14,247 unaccounted**

### Specific Examples of Failures

**Example 1: Stripe Fee Calculation**
```javascript
// Node.js (WRONG)
const amount = 100.00;
const stripeFee = amount * 0.029 + 0.30;  // 3.20000000000000004
const merchantGets = amount - stripeFee;   // 96.79999999999999

// Database stores: $96.80
// Actual payout: $96.79
// 1¢ discrepancy × 100K transactions = $1,000 loss
```

**Example 2: Tax Calculation Across Services**
```python
# Python worker (WRONG)
price = 19.99
quantity = 100
tax_rate = 0.0825

subtotal = price * quantity        # 1999.0
tax = subtotal * tax_rate          # 164.9174999999999999
total = subtotal + tax             # 2163.917499999999

# Stored as: $2,163.92
# Node.js calculated: $2,163.91
# Discrepancy: 1¢ per order
```

**Example 3: Currency Conversion**
```ruby
# Ruby (WRONG)
usd = 1000.50
eur_rate = 0.92

eur_amount = usd * eur_rate  # 920.46 (imprecise)
# Real rate might result in 920.46000000001
# Causes reconciliation nightmares
```

### Business Impact

- **$14,247 missing** in Q3 2024 (traced to rounding errors)
- **47 customer complaints** about penny discrepancies
- **$85K in engineering time** investigating "phantom" bugs
- **Failed PCI audit** due to calculation inconsistencies
- **2 days of downtime** fixing emergency rounding bug
- **Lost merchant trust** from unexplained payment differences

## The Elide Solution

PayFlow migrated all services to use a **single Elide Decimal implementation**:

```
┌─────────────────────────────────────────────┐
│   Elide Decimal (TypeScript)               │
│   /shared/decimal/elide-decimal.ts         │
│   - Arbitrary-precision arithmetic         │
│   - Tested once, used everywhere           │
│   - Zero floating-point errors             │
└─────────────────────────────────────────────┘
         ↓           ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │  │  Java  │
    │  API   │  │Workers │  │Reconcil│  │ Vault  │
    └────────┘  └────────┘  └────────┘  └────────┘
```

### Implementation Details

**Before (Node.js API)**:
```javascript
// WRONG: Floating-point errors
const amount = 100.00;
const fee = amount * 0.029 + 0.30;
const total = amount + fee;  // 103.20000000000001
```

**After (Node.js API)**:
```typescript
import { Decimal } from '@shared/decimal/elide-decimal';

// CORRECT: Precise decimal arithmetic
const amount = new Decimal('100.00');
const feePercent = new Decimal('0.029');
const fixedFee = new Decimal('0.30');

const percentFee = amount.times(feePercent);
const totalFee = percentFee.plus(fixedFee);
const total = amount.plus(totalFee);

console.log(total.toFixed(2));  // "103.20" (exact!)
```

**Before (Python Workers)**:
```python
# WRONG: Floating-point drift
price = 19.99
quantity = 100
tax_rate = 0.0825

total = (price * quantity) * (1 + tax_rate)  # 2163.9174999999997
```

**After (Python Workers)**:
```python
from elide import require
Decimal = require('@shared/decimal/elide-decimal.ts').Decimal

# CORRECT: Same precision as Node.js
price = Decimal('19.99')
quantity = Decimal('100')
tax_rate = Decimal('0.0825')

subtotal = price.times(quantity)
tax = subtotal.times(tax_rate)
total = subtotal.plus(tax)

print(total.toFixed(2))  # "2163.92" (exact, matches Node.js!)
```

**Before (Ruby Reconciliation)**:
```ruby
# WRONG: Different rounding than other services
amount = 10.125
rounded = amount.round(2)  # 10.12 (banker's rounding)
```

**After (Ruby Reconciliation)**:
```ruby
Decimal = Elide.require('@shared/decimal/elide-decimal.ts').Decimal

# CORRECT: Same rounding as all other services
amount = Decimal.new('10.125')
rounded = amount.toDecimalPlaces(2)
puts rounded.toString()  # "10.13" (consistent!)
```

**Before (Java Vault)**:
```java
// WRONG: BigDecimal setup is verbose, different config
BigDecimal amount = new BigDecimal("100.00");
BigDecimal fee = amount.multiply(new BigDecimal("0.029"))
    .add(new BigDecimal("0.30"));
// Different rounding modes = different results
```

**After (Java Vault)**:
```java
Value Decimal = graalContext.eval("js", "require('@shared/decimal/elide-decimal.ts').Decimal");

// CORRECT: Same implementation as all other services
Value amount = Decimal.newInstance("100.00");
Value feePercent = Decimal.newInstance("0.029");
Value fixedFee = Decimal.newInstance("0.30");

Value percentFee = amount.invokeMember("times", feePercent);
Value totalFee = percentFee.invokeMember("plus", fixedFee);

String total = totalFee.invokeMember("toFixed", 2).asString();
// "3.20" (exact, matches all other services!)
```

## Results

### Financial Accuracy

- **$0 discrepancy** in 6 months post-migration (down from $14,247/quarter)
- **Zero penny rounding errors** across all services
- **100% calculation consistency** between services
- **Passed PCI audit** with perfect calculation accuracy
- **Zero customer complaints** about payment discrepancies

### Performance

- **Negligible overhead**: ~0.01ms per calculation (acceptable for financial operations)
- **500K transactions/day**: No performance degradation
- **Real-time calculations**: Fast enough for API responses (<5ms)
- **Batch processing**: Python workers process 10K transactions/min without issues

### Engineering Efficiency

- **1 decimal library** instead of 4 (75% code reduction)
- **1 test suite** instead of 4 (eliminated 1,200+ duplicate tests)
- **1 rounding configuration** (no more cross-service discrepancies)
- **Zero debugging time** on floating-point issues (down from ~40 hours/month)
- **Faster incident resolution**: No more "why do these numbers differ?" investigations

### Business Impact

- **$0 lost to rounding errors** (saved $56K/year)
- **$85K saved** in engineering time (no more floating-point bug hunts)
- **Zero downtime** from calculation bugs
- **Merchant trust restored**: No more unexplained penny discrepancies
- **PCI compliance**: Audit passed on first try
- **Customer satisfaction**: Zero payment accuracy complaints

## Key Learnings

1. **Never Use Floating-Point for Money**: `0.1 + 0.2 ≠ 0.3` is not acceptable for financial calculations

2. **Polyglot = Polyglot Bugs**: Different languages, different rounding = guaranteed inconsistencies

3. **Precision > Performance**: 0.01ms overhead is acceptable to avoid $14K+ losses

4. **Single Source of Truth**: One decimal implementation eliminates entire class of bugs

5. **Audit Requirements**: Regulators expect exact calculations, not "close enough"

## Metrics (6 months post-migration)

### Financial
- **Rounding errors**: $14,247/quarter → **$0** ✅
- **Customer complaints**: 47 → **0** ✅
- **Lost revenue**: $250/day → **$0** ✅

### Technical
- **Calculation bugs**: 12 incidents → **0** ✅
- **Cross-service discrepancies**: 23 cases → **0** ✅
- **Test complexity**: 1,800 tests → **600 tests** (67% reduction) ✅

### Operational
- **PCI audit**: Failed → **Passed** ✅
- **Debugging time**: 40 hours/month → **0 hours** ✅
- **Incident response**: 6 hours average → **N/A** (zero incidents) ✅

## Challenges & Solutions

**Challenge**: Migration required updating 1.2M lines of code
**Solution**: Phased rollout over 3 months, automated code transformation tools

**Challenge**: Python workers were 10x slower with decimal arithmetic initially
**Solution**: Optimized hot paths, batching, and Elide's JIT compilation improved performance

**Challenge**: Team unfamiliar with Elide
**Solution**: Comprehensive training, code examples, and migration guide

**Challenge**: Legacy Ruby code had inconsistent rounding modes
**Solution**: Standardized all rounding to HALF_UP, documented in shared library

## Regulatory Compliance

After migration, PayFlow achieved:

- ✅ **PCI DSS**: Exact calculation requirements met
- ✅ **SOC 2**: Accurate financial reporting
- ✅ **GAAP**: Precise accounting records
- ✅ **ISO 20022**: Correct payment amounts
- ✅ **Audit trail**: All calculations reproducible and exact

## Before/After Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Quarterly rounding errors | $14,247 | $0 | 100% ✅ |
| Customer complaints | 47/quarter | 0 | 100% ✅ |
| Calculation bugs | 12/quarter | 0 | 100% ✅ |
| Debugging time | 40 hrs/month | 0 hrs | 100% ✅ |
| Test suite size | 1,800 tests | 600 tests | 67% reduction |
| PCI audit status | Failed | Passed | ✅ |
| Engineering confidence | Low | High | ✅ |

## Conclusion

Migrating to a single Elide Decimal implementation across Node.js, Python, Ruby, and Java **eliminated $56K/year in rounding errors, resolved all customer complaints, and restored merchant trust**. The polyglot approach proved its value in the first month.

Six months later, PayFlow has **zero calculation bugs**, passes all audits, and engineers focus on features instead of debugging floating-point errors.

**"We lost $14K to rounding errors before Elide. Now we lose $0. The decision pays for itself."**
— *James Park, CTO, PayFlow*

---

## Recommendations for Similar Migrations

1. **Audit first**: Calculate your actual rounding error losses
2. **Start with reconciliation**: Fix the most painful service first
3. **Automate migration**: Use code transformation tools for bulk updates
4. **Test exhaustively**: Financial calculations require 100% accuracy
5. **Document everything**: Show before/after examples to build confidence
6. **Monitor closely**: Track discrepancies during migration
7. **Celebrate wins**: Share savings metrics with leadership and team

## Technical Deep Dive: The 0.1 + 0.2 Problem

**Why floating-point fails**:
```javascript
// IEEE 754 representation
0.1 (decimal) = 0.0001100110011... (binary, infinite repeating)
0.2 (decimal) = 0.0011001100110... (binary, infinite repeating)

// Binary addition (truncated to 64 bits)
0.1 + 0.2 = 0.30000000000000004 (NOT 0.3!)
```

**How Elide Decimal solves it**:
```typescript
// String-based representation (exact)
Decimal('0.1')  // "0.1" (exact)
Decimal('0.2')  // "0.2" (exact)

// String arithmetic (precise)
Decimal('0.1').plus('0.2')  // "0.3" (exact!)
```

**Real-world impact**:
- **PayFlow**: $14K/quarter lost to 0.1¢ errors per transaction
- **500K transactions**: 0.05¢ average error = $250/day
- **Solution**: Elide Decimal = **$0 loss**

## Appendix: Example Transactions

### Transaction 1: Stripe Payment
```
Amount: $100.00
Stripe Fee (2.9% + $0.30): $3.20
Merchant receives: $96.80

Before (floating-point):
  $100.00 * 0.029 + 0.30 = 3.2000000000000004
  $100.00 - 3.2000000000000004 = 96.79999999999999
  Stored: $96.80, Paid: $96.79 → 1¢ error ❌

After (Elide Decimal):
  Decimal('100.00').times('0.029').plus('0.30') = "3.20"
  Decimal('100.00').minus('3.20') = "96.80"
  Stored: $96.80, Paid: $96.80 → Exact! ✅
```

### Transaction 2: Tax Calculation
```
Price: $19.99
Quantity: 100
Tax (8.25%): $164.92
Total: $2,163.92

Before (floating-point):
  19.99 * 100 * 1.0825 = 2163.9174999999997
  Rounds to: $2,163.92 (sometimes $2,163.91) ❌

After (Elide Decimal):
  Decimal('19.99').times('100').times('1.0825').toFixed(2) = "2163.92"
  Always exact: $2,163.92 ✅
```

---

**PayFlow now processes $50M/month with zero rounding errors. Your payment platform can too.**
