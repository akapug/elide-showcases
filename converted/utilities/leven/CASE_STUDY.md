# Case Study: Unified Fuzzy Search Across Polyglot E-Commerce Platform

## The Problem

**ShopLocal**, a fast-growing e-commerce marketplace, runs a polyglot architecture with services written in different languages:

- **Node.js API** (customer search, 2M queries/day)
- **Python ML service** (product recommendations, typo correction)
- **Ruby workers** (Sidekiq background jobs, catalog indexing)
- **Java analytics** (customer behavior analysis, data deduplication)

Each service needed Levenshtein distance for fuzzy matching but used different implementations:
- Node.js: `leven` npm package
- Python: `python-Levenshtein` library
- Ruby: `levenshtein-ffi` gem
- Java: Apache Commons Text `LevenshteinDistance`

### Issues Encountered

1. **Inconsistent Search Results**: A user searching for "ipone" (typo) would get "iPhone" from the Node.js API but different results from Python recommendations because the algorithms had subtle differences in handling edge cases.

2. **Deduplication Conflicts**: Java analytics marked "Jon Smith" and "John Smith" as duplicates (distance=1), but Python ML flagged them as different entities using slightly different thresholds, causing database inconsistencies.

3. **Performance Variance**: Python's Levenshtein was fast for short strings but 3x slower than Node.js for product names >50 characters. This caused recommendation latency spikes.

4. **Maintenance Nightmare**: 4 different libraries meant 4 different APIs, 4 security audits, 4 update cycles, and constant version drift. The team spent ~20 hours/month just keeping them in sync.

5. **Testing Complexity**: Integration tests had to mock fuzzy matching 4 different ways. When a test failed, engineers had to debug which implementation was the culprit.

6. **Autocomplete Discrepancies**: Node.js autocomplete suggested "typescript" for "typescrpit", but Python's spell-checker suggested "javascript" due to different distance calculation priorities.

## The Elide Solution

The engineering team migrated all services to use a **single Elide TypeScript Levenshtein implementation** running on the Elide polyglot runtime:

```
┌─────────────────────────────────────────────┐
│   Elide Leven (TypeScript)                 │
│   /shared/leven/elide-leven.ts             │
│   - Single source of truth                 │
│   - Optimized algorithm                    │
│   - Tested once, used everywhere           │
└─────────────────────────────────────────────┘
         ↓           ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │  │  Java  │
    │  API   │  │   ML   │  │Workers │  │Analytic│
    └────────┘  └────────┘  └────────┘  └────────┘
```

### Implementation Details

**Before (Node.js Search API)**:
```javascript
const leven = require('leven');
const searchQuery = 'ipone 15';
const products = ['iPhone 15', 'Samsung S24', 'Pixel 8'];
const distances = products.map(p => leven(searchQuery, p));
// Different implementation than other services
```

**After (Node.js Search API)**:
```typescript
import leven from '@shared/leven/elide-leven';
const searchQuery = 'ipone 15';
const products = ['iPhone 15', 'Samsung S24', 'Pixel 8'];
const distances = products.map(p => leven(searchQuery.toLowerCase(), p.toLowerCase()));
// Same implementation everywhere!
```

**Before (Python ML Service)**:
```python
import Levenshtein
distance = Levenshtein.distance('ipone', 'iphone')
# Different implementation, inconsistent with API
```

**After (Python ML Service)**:
```python
from elide import require
leven_module = require('@shared/leven/elide-leven.ts')
distance = leven_module.default('ipone', 'iphone')
# Same implementation, consistent with API!
```

**Before (Ruby Catalog Worker)**:
```ruby
require 'levenshtein-ffi'
distance = Levenshtein.distance('product 1', 'product 2')
# Different implementation, different performance
```

**After (Ruby Catalog Worker)**:
```ruby
leven_module = Elide.require('@shared/leven/elide-leven.ts')
distance = leven_module.default('product 1', 'product 2')
# Same implementation, predictable performance!
```

**Before (Java Analytics)**:
```java
import org.apache.commons.text.similarity.LevenshteinDistance;
LevenshteinDistance levenshtein = new LevenshteinDistance();
Integer distance = levenshtein.apply("customer1", "customer2");
// Different implementation, version conflicts
```

**After (Java Analytics)**:
```java
Value levenModule = graalContext.eval("js", "require('@shared/leven/elide-leven.ts')");
int distance = levenModule.getMember("default")
    .execute("customer1", "customer2")
    .asInt();
// Same implementation, no version conflicts!
```

## Results

### Performance Improvements

- **25% faster** than Node.js leven package (optimized algorithm with early termination)
- **50% faster** than Python Levenshtein for long strings
- **Zero cold start** overhead in serverless functions (8-12x improvement)
- **Consistent 0.3µs** per distance calculation across all languages
- **Eliminated performance spikes** in Python recommendations (no more 3x slowdowns)

### Search Quality Improvements

- **100% consistency** in search results across all services
- **Zero autocomplete discrepancies** (all services now suggest the same corrections)
- **Unified fuzzy matching** - "ipone" → "iPhone" everywhere (was returning different results before)
- **Improved conversion rate** - Search-to-purchase increased 3.2% due to better typo handling

### Maintainability Wins

- **1 implementation** instead of 4 (75% code reduction)
- **1 security audit** instead of 4 (saved 3 security review cycles = ~$15K)
- **1 test suite** instead of 4 (consolidated 1,247 tests into 89)
- **1 update schedule** (no more coordinating updates across 4 repos)
- **1 bug tracker** (centralized issue management)
- **Time saved: ~20 hours/month** on library maintenance

### Reliability Improvements

- **100% distance consistency** across all services (zero edge cases)
- **Zero fuzzy-match bugs** since migration (down from 4-7/month)
- **Improved debugging** - all distances calculated identically
- **Predictable performance** - no more language-specific quirks
- **Deduplication accuracy** - Java and Python now agree 100% on duplicates

### Business Impact

- **Search conversion +3.2%** - Better typo handling led to more purchases (estimated $340K annual revenue increase)
- **Customer satisfaction +8%** - Users found products faster with better fuzzy search
- **Reduced P2 incidents** from 4-7/month to 0 related to fuzzy matching
- **Faster incident resolution** - Distance debugging now takes minutes instead of hours
- **Developer productivity** - Engineers spend less time on cross-service fuzzy-match issues
- **Cost savings: ~$18K/year** - Reduced security audits, maintenance time, incident costs

## Key Use Cases

### 1. Product Search with Typo Tolerance

**Challenge**: Users frequently mistype product names ("ipone", "galxy", "macbok")

**Solution**: Node.js API uses Elide leven for fuzzy matching, Python ML uses same implementation for recommendations.

**Result**: Consistent search results, 3.2% conversion improvement.

### 2. Customer Deduplication

**Challenge**: Identifying duplicate customers ("Jon Smith" vs "John Smith", "Bob's Shop" vs "Bobs Shop")

**Solution**: Java analytics and Python ML use identical Levenshtein distance for deduplication.

**Result**: Zero conflicts in duplicate detection, improved data quality.

### 3. Autocomplete with Spell Check

**Challenge**: Real-time autocomplete needed to handle typos in sub-10ms

**Solution**: Elide leven with `maxDistance` option provides fast early-termination for suggestions.

**Result**: <5ms autocomplete latency, consistent suggestions across all frontends.

### 4. Catalog Indexing Worker

**Challenge**: Ruby Sidekiq workers needed to match product variations ("iPhone 15 Pro Max" vs "Iphone 15 pro max")

**Solution**: Workers use Elide leven for case-insensitive fuzzy matching during catalog indexing.

**Result**: Better product grouping, reduced duplicate listings by 23%.

## Metrics (6 months post-migration)

- **Libraries removed**: 4 Levenshtein implementations
- **Code reduction**: 1,842 lines of fuzzy-match code deleted
- **Test reduction**: 1,247 fuzzy-match tests consolidated into 89
- **Performance improvement**: 25-50% faster, 10x faster cold start
- **Incidents**: 0 fuzzy-match bugs (down from 28 in previous 6 months)
- **Search conversion**: +3.2% (est. $340K annual revenue increase)
- **Customer satisfaction**: +8% in search experience surveys
- **Developer time saved**: ~20 hours/month (maintenance, debugging, updates)
- **Cost savings**: ~$18K/year (security audits, incident costs, developer time)

## Challenges & Solutions

**Challenge**: Migration coordination across 4 teams
**Solution**: Phased rollout starting with Ruby workers (low risk), then Python ML, Node.js API, finally Java analytics

**Challenge**: Convincing team to add "yet another runtime"
**Solution**: Proof-of-concept benchmark showing 25% performance improvement + consistency guarantees won stakeholders

**Challenge**: Different APIs across libraries (leven, Levenshtein, LevenshteinDistance)
**Solution**: Created thin wrapper adapters during migration, then removed after full adoption

**Challenge**: Some services needed case-insensitive matching, others case-sensitive
**Solution**: Standardized on case-insensitive via `.toLowerCase()` in caller code, documented in shared guidelines

## Conclusion

Migrating to a single Elide Levenshtein implementation across Node.js, Python, Ruby, and Java services **simplified our architecture, improved search quality, and increased revenue by 3.2%**. The polyglot approach proved its value immediately.

Six months later, the team has migrated 7 other string utilities to shared Elide implementations (camelCase, kebab-case, slug generation, etc.). The pattern has become our standard for cross-language consistency.

**"The 3.2% search conversion improvement alone paid for the entire migration effort 10x over. Consistent fuzzy matching was a game-changer for our business."**
— *Alex Martinez, VP Engineering, ShopLocal*

**"Before Elide: debugging why Node.js and Python gave different search results took hours. After Elide: we know they'll always match. Life-changing."**
— *Sarah Kim, Senior Backend Engineer*

---

## Recommendations for Similar Migrations

1. **Start with non-critical service**: Ruby workers were perfect - high value, low risk
2. **Benchmark with real data**: Used production search logs to prove performance gains
3. **Document edge cases**: Created runbook for case-sensitivity, maxDistance usage, etc.
4. **Show business value**: The +3.2% conversion rate was more convincing than technical benefits
5. **Celebrate wins**: Shared metrics to build momentum for future Elide migrations
6. **Train the team**: Hands-on workshop with Elide reduced adoption friction significantly

## Technical Deep Dive

### Algorithm Optimizations That Made It Fast

1. **Prefix/Suffix Trimming**: Skips common prefixes/suffixes ("international" vs "interpolation" → only compare middle parts)
2. **Early Termination**: `maxDistance` option stops calculation when threshold exceeded
3. **String Length Swap**: Always processes shorter string as reference for memory efficiency
4. **Character Code Caching**: Pre-computes char codes to avoid repeated calls
5. **Reusable Arrays**: Single allocation reduces GC pressure

### Performance Comparison (Real Production Data)

| Operation | Elide | Node.js | Python | Ruby | Java |
|-----------|-------|---------|--------|------|------|
| Short strings (<10 chars) | 0.3µs | 0.4µs | 0.6µs | 0.7µs | 0.4µs |
| Medium strings (10-50 chars) | 1.2µs | 1.8µs | 2.4µs | 2.8µs | 1.7µs |
| Long strings (50-200 chars) | 8.5µs | 12.1µs | 25.3µs | 29.6µs | 11.2µs |
| With maxDistance=3 | 0.9µs | N/A* | 1.8µs | N/A* | 1.3µs |

*Not all libraries support early termination

### Correctness Verification

Tested against reference implementation with 10,000+ random string pairs:
- ✅ 100% match with standard Levenshtein distance
- ✅ Symmetric: `leven(a, b) === leven(b, a)` for all pairs
- ✅ Triangle inequality: `leven(a, c) <= leven(a, b) + leven(b, c)`
- ✅ Edge cases: empty strings, Unicode, long strings (10,000+ chars)

## Future Plans

1. **Extend to more algorithms**: Looking at Damerau-Levenshtein (transpositions), Jaro-Winkler distance
2. **GPU acceleration**: Exploring GraalVM native image with GPU-accelerated batch distance calculation
3. **Polyglot benchmarking suite**: Automated performance testing across all languages
4. **Open source contribution**: Planning to contribute Elide leven back to the community

---

*This case study demonstrates how Elide's polyglot runtime can unify utility implementations across an entire microservices stack, leading to better performance, consistency, and business outcomes.*
