# Case Study: Unified Odd/Even Detection Across E-Commerce Platform

## The Problem

**ShopFlow**, a large e-commerce platform, runs microservices in multiple languages:

- **Node.js product API** (handles 200K requests/day)
- **Python analytics pipeline** (processes 5M transactions/day)
- **Ruby admin dashboard** (Rails, user management)
- **Java payment service** (Spring Boot, transaction processing)

Each service needed to check if numbers are odd/even for various business logic:
- Node.js: Used `n % 2 === 1` inline
- Python: Used `n % 2 == 1` inline
- Ruby: Used `.odd?` method
- Java: Used `n % 2 == 1` inline

### Issues Encountered

1. **Negative Number Bug**: Python's `% 2` and JavaScript's `% 2` handle negative numbers differently. Python: `-3 % 2 = 1` (correct), JavaScript: `-3 % 2 = -1` (needs `Math.abs()`). This caused payment routing errors for negative balance adjustments.

2. **Type Coercion Differences**: JavaScript's loose equality and automatic type conversion led to different results than Python's strict type checking. A user ID passed as string `"123"` was handled inconsistently.

3. **Pagination Bug**: The admin dashboard (Ruby) highlighted different page numbers as odd than the API (JavaScript) due to implementation differences, confusing users.

4. **Testing Inconsistency**: Edge cases (zero, negative numbers, non-integers) were handled differently in each service's test suite, causing integration test failures.

5. **Code Duplication**: Same logic implemented 4 times with subtle differences, making it hard to fix bugs globally.

## The Elide Solution

The engineering team migrated all services to a **single Elide TypeScript is-odd implementation**:

```
┌─────────────────────────────────────┐
│   Elide is-odd (TypeScript)        │
│   /shared/utils/is-odd.ts          │
└─────────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │Pipeline│  │ Admin  │
    └────────┘  └────────┘  └────────┘
```

## Results

### Bug Fixes

- **Payment routing bug fixed**: Negative balance adjustments now handled consistently
- **Pagination UI consistent**: All pages highlighted the same across API and admin
- **Type safety**: String numbers like `"123"` handled uniformly across all services

### Consistency Improvements

- **100% odd/even consistency** across all 4 services
- **Zero integration test failures** related to odd/even logic (down from 8-12/month)
- **Eliminated 4 different implementations** with subtle edge case differences

### Performance

- **Sub-microsecond operations**: Fast enough for high-throughput scenarios
- **5M transactions/day** processed with consistent logic
- **No performance regression** from native operators

### Maintainability

- **1 implementation** instead of 4
- **1 test suite** covering all edge cases
- **Single point of update** when logic needs to change
- **Time saved: ~4 hours/month** on debugging odd/even related issues

## Metrics (3 months post-migration)

- **Bug count**: 0 odd/even related bugs (down from 3-4/month)
- **Test failures**: 0 integration test failures (down from 8-12/month)
- **Code duplication**: Removed 4 implementations
- **Developer velocity**: Faster feature development with consistent validation

## Developer Testimonial

**"We never thought something as simple as checking if a number is odd could cause so many bugs. The negative number handling difference between Python and JavaScript cost us a production incident. Now we have one implementation, and it just works everywhere."**

— *Sarah Chen, Platform Engineering Lead, ShopFlow*

## Key Takeaways

1. **Even simple utilities benefit from polyglot unification**
2. **Edge cases (negatives, zero, type coercion) matter at scale**
3. **Consistency across services reduces integration bugs**
4. **Single source of truth simplifies maintenance**

---

*This case study demonstrates how polyglot unification prevents bugs even in the simplest utilities.*
