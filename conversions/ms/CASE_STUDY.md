# Case Study: Unified Time Configuration Across Polyglot Stack

## The Problem

**FinServ Inc**, a financial services platform, runs services in multiple languages:
- **Node.js API** (customer-facing, handles requests)
- **Python workers** (data processing, background jobs)
- **Ruby services** (legacy Sidekiq job queue)
- **Java microservices** (core banking, payment processing)

Each service configured timeouts using its native format:
- Node.js: `setTimeout(fn, 30000)` (milliseconds)
- Python: `timedelta(seconds=30)` (seconds)
- Ruby: `sleep 30` (seconds)
- Java: `TimeUnit.SECONDS.toMillis(30)` (verbose)

### Issues Encountered

1. **Configuration Inconsistency**: Same timeout written 4 different ways led to copy-paste errors
2. **Human Errors**: Converting "30 seconds" to milliseconds manually caused bugs (30000 vs 3000)
3. **Deployment Issues**: Changing a timeout required updating 4 different config formats
4. **Debugging Nightmares**: "Why does Python timeout faster than Node.js?" → Different parsing
5. **Documentation Overhead**: Every config file needed comments explaining units

## The Elide Solution

Migrated all services to use a **single ms time parser**:

```
┌─────────────────────────────────────┐
│   Elide MS (TypeScript)            │
│   /shared/utils/ms.ts              │
│   - Parses: '30s', '5m', '2h'      │
│   - Returns: milliseconds          │
└─────────────────────────────────────┘
         ↓         ↓         ↓
    ┌────────┐┌────────┐┌────────┐
    │Node.js ││ Python ││  Ruby  │
    │  API   ││Workers ││Sidekiq │
    └────────┘└────────┘└────────┘
```

### Unified Configuration

**Before (Inconsistent)**:
```yaml
# config.yml - DIFFERENT FORMATS!
node_api:
  timeout: 30000              # milliseconds

python_worker:
  timeout: 30                 # seconds

ruby_sidekiq:
  retry_delay: 300            # seconds

java_service:
  connection_timeout: 30000   # milliseconds
```

**After (Consistent)**:
```yaml
# config.yml - SAME FORMAT EVERYWHERE!
node_api:
  timeout: '30s'              # ← Same format

python_worker:
  timeout: '30s'              # ← Same format

ruby_sidekiq:
  retry_delay: '5m'           # ← Same format

java_service:
  connection_timeout: '30s'   # ← Same format
```

### Implementation Examples

**Node.js API**:
```javascript
import ms from '@shared/utils/ms';

const timeout = ms(config.timeout);  // '30s' → 30000ms
setTimeout(fn, timeout);
```

**Python Worker**:
```python
from elide import require
ms = require('@shared/utils/ms.ts')

timeout = ms(config['timeout']) / 1000  # '30s' → 30 seconds
time.sleep(timeout)
```

**Ruby Sidekiq**:
```ruby
ms = Elide.require('@shared/utils/ms.ts')

retry_delay = ms(config['retry_delay']) / 1000  # '5m' → 300 seconds
self.class.perform_in(retry_delay, *args)
```

## Results

### Configuration Clarity

- **Before**: 4 different formats, constant conversion errors
- **After**: 1 format (`'30s'`, `'5m'`, `'2h'`), zero conversion errors

### Deployment Speed

- **Before**: 45 minutes to update timeouts across 12 services
- **After**: 5 minutes (single config change, same format everywhere)

### Bug Reduction

- **Configuration bugs**: 12 in 6 months → **0 in 6 months** after migration
- **Timeout-related incidents**: 8 → **0**
- **Production hotfixes for timeouts**: 5 → **0**

### Developer Experience

- **Onboarding time**: New engineers understand config immediately (no unit conversions)
- **Code reviews**: Reviewers can verify timeouts at a glance ('30s' vs 30000)
- **Documentation**: Eliminated per-service config documentation

### Performance

- **Parsing overhead**: Negligible (~0.01ms per parse)
- **Configuration load time**: Identical across all services
- **No runtime conversion errors**: All values parsed at startup

## Key Learnings

1. **Human-Readable Wins**: `'30s'` is clearer than `30000` or `timedelta(seconds=30)`
2. **Polyglot Configuration**: One format for all languages eliminates entire class of bugs
3. **Developer Productivity**: Engineers focus on logic, not unit conversions
4. **Maintenance Simplicity**: Changing timeouts is trivial when format is consistent

## Metrics (12 months post-migration)

- **Config formats**: 4 → 1 (75% reduction)
- **Conversion errors**: 12 → 0
- **Config-related incidents**: 8 → 0
- **Time to change timeouts**: 45min → 5min (9x faster)
- **Developer satisfaction**: ⭐⭐⭐⭐⭐ ("Finally, readable timeouts!")

## Challenges & Solutions

**Challenge**: Some services needed seconds, not milliseconds
**Solution**: Simple division (`ms('30s') / 1000`) at call site

**Challenge**: Existing hardcoded timeouts in code
**Solution**: Phased migration, replaced hardcoded values with config

**Challenge**: Team skepticism about "yet another dependency"
**Solution**: Showed identical npm package (40M downloads/week), proven reliability

## Conclusion

Using Elide to share a single time duration parser across Node.js, Python, Ruby, and Java eliminated configuration inconsistencies, reduced bugs to zero, and made timeouts human-readable. The polyglot approach proved its value immediately.

**"Never converting seconds to milliseconds again. This is how all config should work."**
— *Marcus Lee, Senior Engineer, FinServ Inc*

---

## Recommended Migration Path

1. **Start with new services**: Use ms format from day one
2. **Migrate high-risk configs**: Timeouts that caused production issues
3. **Update documentation**: Show before/after examples
4. **Deprecate old formats**: Phase out over 6 months
5. **Celebrate wins**: Share metrics showing zero bugs since migration
