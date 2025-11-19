# Elide Utility Libraries

Production-ready ports of popular JavaScript utility libraries to Elide.

## Libraries

### 1. date-fns-clone
Modern JavaScript date utility library with 200+ pure, immutable functions.
- **Lines**: 4000+
- **Features**: Date manipulation, formatting, i18n, timezone support
- **Location**: `/date-fns-clone/`

### 2. dayjs-clone
Lightweight date library with Moment.js-compatible API (only 2KB!).
- **Lines**: 2000+
- **Features**: Immutable, chainable API, plugin system, i18n
- **Location**: `/dayjs-clone/`

### 3. zod-clone
TypeScript-first schema validation with static type inference.
- **Lines**: 3000+
- **Features**: Type-safe schemas, parsing, transformations, composable
- **Location**: `/zod-clone/`

### 4. yup-clone
Dead simple object schema validation.
- **Lines**: 2500+
- **Features**: Schema composition, async validation, custom validators
- **Location**: `/yup-clone/`

### 5. class-validator-clone
Decorator-based validation for TypeScript classes.
- **Lines**: 2000+
- **Features**: Validation decorators, nested validation, custom validators
- **Location**: `/class-validator-clone/`

### 6. nanoid-clone
Tiny, secure, URL-friendly unique ID generator.
- **Lines**: 500+
- **Features**: Secure IDs, custom alphabets, fast performance
- **Location**: `/nanoid-clone/`

### 7. pretty-ms-clone
Convert milliseconds to human-readable strings.
- **Lines**: 400+
- **Features**: Compact/verbose modes, localization, custom output
- **Location**: `/pretty-ms-clone/`

### 8. humanize-duration-clone
Convert durations to human-readable strings in 40+ languages.
- **Lines**: 600+
- **Features**: Multi-language support, customizable units, flexible formatting
- **Location**: `/humanize-duration-clone/`

### 9. filesize-clone
Convert file sizes to human-readable strings.
- **Lines**: 500+
- **Features**: Binary/decimal units, localization, custom output
- **Location**: `/filesize-clone/`

### 10. ms-clone
Convert time strings to milliseconds and vice versa.
- **Lines**: 400+
- **Features**: Bidirectional conversion, multiple time units, compact
- **Location**: `/ms-clone/`

## Total: 15,900+ Lines

## Usage

Each library is self-contained with:
- Complete README with API documentation
- Full TypeScript implementation
- Comprehensive examples
- Performance notes
- Migration guides

## Quick Examples

### Date Manipulation
```typescript
import { format, addDays } from './date-fns-clone/date-fns-clone.ts'
format(addDays(new Date(), 7), 'yyyy-MM-dd')
```

### Schema Validation
```typescript
import { z } from './zod-clone/zod-clone.ts'
const User = z.object({
  name: z.string(),
  age: z.number().positive(),
})
```

### ID Generation
```typescript
import { nanoid } from './nanoid-clone/nanoid-clone.ts'
const id = nanoid()  // => "V1StGXR8_Z5jdHi6B-myT"
```

### Time Formatting
```typescript
import prettyMs from './pretty-ms-clone/pretty-ms-clone.ts'
prettyMs(1337000000)  // => "15d 11h 23m 20s"
```

## License

MIT - All libraries based on their respective open-source originals, ported to Elide with full JavaScript runtime compatibility.
