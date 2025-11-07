# Case Study: URL Shortener with Consistent IDs Across Polyglot Stack

## The Problem

**ShortLink**, a high-traffic URL shortening service, runs a polyglot stack:
- **Node.js API** (main web service, handles link creation)
- **Python workers** (analytics, click tracking, data processing)
- **Ruby services** (admin dashboard, legacy code)
- **Java microservices** (link validation, security scanning)

Each service needed to generate and validate short URL codes, but they used different ID generators:
- Node.js: `nanoid` package (alphanumeric, 8 chars)
- Python: `uuid4().hex[:8]` (hex, 8 chars)
- Ruby: `SecureRandom.alphanumeric(8)` (alphanumeric, 8 chars)
- Java: `UUID.randomUUID().toString().substring(0, 8)` (hex with hyphens)

### Issues Encountered

1. **Inconsistent ID Formats**: Different character sets across services
   - Node.js: `aB3x9K1z` (alphanumeric)
   - Python: `7a3f2c1b` (hex only)
   - Ruby: `xK9mP2Qa` (alphanumeric)
   - Java: `3e4b-12d` (hex with hyphens - BROKE URLs!)

2. **Validation Hell**: Each service needed language-specific validation logic

3. **Database Conflicts**: Python hex codes collided with Node.js alphanumeric codes

4. **URL Encoding Issues**: Java's hyphenated codes required URL encoding

5. **Collision Risk**: Different entropy levels = different collision rates

6. **Code Duplication**: Same ID generation logic written 4 times, 4 different ways

## The Elide Solution

Migrated all services to use a **single nanoid implementation**:

```
┌─────────────────────────────────────────────┐
│   Elide Nanoid (TypeScript)                │
│   /shared/nanoid/elide-nanoid.ts           │
│   - Alphabet: 0-9a-zA-Z (62 chars)         │
│   - Length: 8 chars                        │
│   - URL-safe: Yes                          │
│   - Entropy: ~47.6 bits                    │
└─────────────────────────────────────────────┘
         ↓         ↓         ↓         ↓
    ┌────────┐┌────────┐┌────────┐┌────────┐
    │Node.js ││ Python ││  Ruby  ││  Java  │
    │  API   ││Workers ││Dashboard││Security│
    └────────┘└────────┘└────────┘└────────┘
```

### Unified ID Generation

**Before (Inconsistent)**:
```javascript
// Node.js
import { nanoid } from 'nanoid';
const shortCode = nanoid(8);  // 'aB3x9K1z'

# Python
import uuid
short_code = uuid.uuid4().hex[:8]  # '7a3f2c1b'

# Ruby
short_code = SecureRandom.alphanumeric(8)  # 'xK9mP2Qa'

// Java
String shortCode = UUID.randomUUID().toString().substring(0, 8);  // '3e4b-12d'
```

**After (Consistent)**:
```javascript
// Node.js
import { nanoid } from './elide-nanoid.ts';
const shortCode = nanoid(8);  // 'aB3x9K1z'

# Python
from elide import require
nanoid = require('./elide-nanoid.ts')
short_code = nanoid.nanoid(8)  # 'aB3x9K1z' ← SAME FORMAT!

# Ruby
nanoid = Elide.require('./elide-nanoid.ts')
short_code = nanoid.nanoid(8)  # 'aB3x9K1z' ← SAME FORMAT!

// Java
Value nanoid = context.eval("js", "require('./elide-nanoid.ts')");
String shortCode = nanoid.invokeMember("nanoid", 8).asString();  // 'aB3x9K1z' ← SAME FORMAT!
```

### Implementation Examples

**Node.js API (Link Creation)**:
```javascript
import { customAlphabet, alphabets } from './elide-nanoid.ts';

const generateShortCode = customAlphabet(alphabets.alphanumeric, 8);

app.post('/api/shorten', async (req, res) => {
  const { url } = req.body;
  const shortCode = generateShortCode();  // 'aB3x9K1z'

  await db.links.insert({
    short_code: shortCode,
    long_url: url,
    created_at: new Date()
  });

  res.json({
    short_url: `https://short.ly/${shortCode}`,
    short_code: shortCode
  });
});
```

**Python Worker (Analytics)**:
```python
from elide import require
nanoid = require('./elide-nanoid.ts')

def process_analytics(short_code):
    # Validate short code format (same as Node.js!)
    if len(short_code) == 8 and short_code.isalnum():
        clicks = db.query(f"SELECT COUNT(*) FROM clicks WHERE code = '{short_code}'")
        return clicks
    return 0
```

**Ruby Dashboard (Admin)**:
```ruby
class LinksController < ApplicationController
  def create
    nanoid = Elide.require('./elide-nanoid.ts')
    gen = nanoid.customAlphabet(nanoid.alphabets[:alphanumeric], 8)

    @link = Link.new(
      short_code: gen.call(),  # Same format as Node.js API
      long_url: params[:url]
    )

    if @link.save
      render json: { short_url: "https://short.ly/#{@link.short_code}" }
    end
  end
end
```

**Java Security Service (Link Validation)**:
```java
@Service
public class LinkSecurityService {
    private final Value nanoidModule;

    public boolean isValidShortCode(String code) {
        // Same validation logic as all other services
        return code.length() == 8 && code.matches("^[0-9a-zA-Z]+$");
    }

    public String generateSecureCode() {
        Value alphabets = nanoidModule.getMember("alphabets");
        String alphanum = alphabets.getMember("alphanumeric").asString();
        Value generator = nanoidModule.invokeMember("customAlphabet", alphanum, 8);
        return generator.execute().asString();  // Same as Node.js!
    }
}
```

## Results

### ID Consistency

- **Before**: 4 different formats, constant validation errors
- **After**: 1 format (alphanumeric, 8 chars), zero format errors

### Database Performance

- **Before**: Mixed character sets caused indexing inefficiencies
- **After**: Uniform alphanumeric IDs = 15% faster index queries

### Collision Rate

- **Before**: Unknown (different entropy across services)
- **After**: 47.6 bits entropy, ~1 in 218 trillion chance per ID

### URL Encoding

- **Before**: Java service required URL encoding (hyphens)
- **After**: All IDs URL-safe by default, no encoding needed

### Code Reduction

- **ID generation code**: 4 implementations → 1 (75% reduction)
- **Validation code**: 4 implementations → 1 (75% reduction)
- **Unit tests**: 4 test suites → 1 (shared correctness tests)

### Bug Reduction

- **Format-related bugs**: 15 in 6 months → **0 in 6 months** after migration
- **Validation errors**: 23 → **0**
- **Collision incidents**: 3 (false positives) → **0**
- **URL encoding bugs**: 8 → **0**

### Performance

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| ID generation time | Mixed | ~0.02ms | Consistent |
| Database query time | 45ms | 38ms | 15% faster |
| Validation logic | 4 implementations | 1 implementation | 75% simpler |
| Short code conflicts | 3 false positives | 0 | 100% fixed |

### Developer Experience

- **Onboarding time**: New engineers see same ID format everywhere (no confusion)
- **Code reviews**: Reviewers can verify ID format at a glance
- **Debugging**: All logs show consistent ID format, easy to trace across services
- **Testing**: One set of unit tests validates all services

## Real-World Impact

### Traffic Stats (12 months post-migration)

- **Links shortened**: 150M+
- **Short codes generated**: 150M+
- **ID collisions**: **0** (perfect uniqueness)
- **Format errors**: **0** (perfect consistency)
- **URL encoding issues**: **0** (perfect URL safety)

### Incident Response

**Before**: "Why is this short code invalid in Python but valid in Node.js?"
- 2 hours to identify: different character sets
- 1 hour to fix: manually convert between formats
- **Total: 3 hours downtime**

**After**: All services use same nanoid → **0 format-related incidents**

### Cost Savings

- **Engineering time**: 15 hours/month debugging ID issues → **0 hours/month**
- **Infrastructure**: Database index optimizations = $200/month savings
- **Support tickets**: "Link not working" tickets down 40% (format errors eliminated)

## Key Learnings

1. **Consistent IDs Matter**: Same format across services eliminates entire class of bugs

2. **URL Safety First**: Alphanumeric only = no encoding headaches

3. **Polyglot Configuration**: One implementation for all languages eliminates drift

4. **Entropy Calculation**: 62^8 = 218 trillion possibilities = low collision risk

5. **Developer Productivity**: Engineers focus on features, not ID format conversions

6. **Database Performance**: Uniform IDs = better index performance

## Metrics (12 months post-migration)

- **ID formats**: 4 → 1 (75% reduction)
- **Format bugs**: 15 → 0 (100% elimination)
- **Collision incidents**: 3 → 0
- **Code duplication**: 4x → 1x (75% reduction)
- **Database query time**: 45ms → 38ms (15% faster)
- **Engineering time saved**: 15 hours/month → 180 hours/year
- **Developer satisfaction**: ⭐⭐⭐⭐⭐ ("Finally, IDs that just work!")

## Challenges & Solutions

**Challenge**: Existing short codes in database had mixed formats
**Solution**: One-time migration script normalized all codes to new format

**Challenge**: Python workers needed integer representation
**Solution**: Simple base62 encoding: `int(short_code, 62)`

**Challenge**: Team concerned about single point of failure
**Solution**: Showed nanoid is battle-tested (10M+ downloads/week on npm)

**Challenge**: Java team wanted UUID for compatibility
**Solution**: Demonstrated nanoid is 60% smaller, faster, and more URL-safe

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              ShortLink Platform                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Shared: /shared/nanoid/elide-nanoid.ts            │
│  - customAlphabet(alphabets.alphanumeric, 8)       │
│  - Returns: 'aB3x9K1z' (8 chars, URL-safe)         │
│                                                     │
├────────────┬─────────────┬─────────────┬───────────┤
│            │             │             │           │
│  Node.js   │   Python    │    Ruby     │   Java    │
│            │             │             │           │
│  API       │   Workers   │  Dashboard  │  Security │
│  (Express) │  (Celery)   │  (Rails)    │  (Spring) │
│            │             │             │           │
│  Creates   │  Tracks     │  Manages    │  Validates│
│  Links     │  Analytics  │  Links      │  Safety   │
│            │             │             │           │
└────────────┴─────────────┴─────────────┴───────────┘
          ↓
    PostgreSQL Database
    - short_code VARCHAR(8) PRIMARY KEY
    - long_url TEXT
    - clicks INTEGER
    - created_at TIMESTAMP
```

## Conclusion

Using Elide to share a single nanoid implementation across Node.js, Python, Ruby, and Java eliminated ID format inconsistencies, reduced bugs to zero, and made short URLs truly URL-safe. The polyglot approach proved its value immediately, with zero format-related incidents in 12 months.

**"We went from four different ID generators to one. Now our short codes just work, everywhere, every time."**
— *Sarah Chen, Lead Engineer, ShortLink*

---

## Recommended Migration Path

1. **Audit existing IDs**: Identify all services generating short codes
2. **Standardize format**: Pick one format (alphanumeric, 8 chars) for all new codes
3. **Deploy Elide nanoid**: Replace language-specific generators with shared implementation
4. **Migrate database**: One-time script to normalize existing codes (optional)
5. **Update validation**: Use shared validation logic across all services
6. **Monitor collisions**: Track uniqueness (should be zero)
7. **Celebrate**: Share metrics showing zero format bugs since migration

## Related Links

- [Elide Documentation](https://docs.elide.dev)
- [npm nanoid package](https://www.npmjs.com/package/nanoid) (10M+ downloads/week)
- [Collision Calculator](https://zelark.github.io/nano-id-cc/) - Calculate collision probability
