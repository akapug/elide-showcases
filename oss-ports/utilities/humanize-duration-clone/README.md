# Humanize Duration Clone for Elide

Convert millisecond durations to human-readable strings in multiple languages.

## Features

- **40+ Languages**: Extensive localization support
- **Customizable**: Configure units, rounding, separators
- **Flexible**: Multiple output formats
- **Type-Safe**: Full TypeScript support

## Installation

```bash
elide install humanize-duration-clone
```

## Quick Start

```typescript
import humanizeDuration from './humanize-duration-clone.ts'

humanizeDuration(97320000)
// => "1 day, 3 hours, 2 minutes"

humanizeDuration(3600000, { language: 'es' })
// => "1 hora"

humanizeDuration(3600000, { language: 'fr' })
// => "1 heure"

humanizeDuration(3000, { units: ['s'] })
// => "3 seconds"

humanizeDuration(97320000, { round: true })
// => "1 day"

humanizeDuration(3600000, { units: ['h', 'm'] })
// => "1 hour"
```

## API

### `humanizeDuration(duration, options?)`

#### Options

```typescript
interface Options {
  language?: string         // Language code (default: 'en')
  languages?: Languages     // Custom language definitions
  delimiter?: string        // Separator between units (default: ', ')
  spacer?: string          // Space between number and unit (default: ' ')
  largest?: number         // Max number of units to display
  units?: Unit[]           // Units to use
  round?: boolean          // Round to nearest unit
  decimal?: string         // Decimal separator (default: '.')
  conjunction?: string     // Conjunction for last unit
  serialComma?: boolean    // Use serial comma
  unitMeasures?: object    // Custom unit values
}
```

## Supported Languages

English (en), Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt), Russian (ru), Japanese (ja), Chinese (zh_CN, zh_TW), Korean (ko), Arabic (ar), Dutch (nl), Polish (pl), Turkish (tr), Swedish (sv), Danish (da), Norwegian (no), Finnish (fi), Czech (cs), Hungarian (hu), Greek (el), Hebrew (he), Thai (th), Vietnamese (vi), and 20+ more!

## Examples

```typescript
// Basic
humanizeDuration(1000)                    // "1 second"
humanizeDuration(60000)                   // "1 minute"
humanizeDuration(3600000)                 // "1 hour"

// Language
humanizeDuration(3600000, { language: 'es' })    // "1 hora"
humanizeDuration(3600000, { language: 'fr' })    // "1 heure"
humanizeDuration(3600000, { language: 'de' })    // "1 Stunde"

// Units
humanizeDuration(97320000, { units: ['d'] })     // "1 day"
humanizeDuration(97320000, { units: ['h'] })     // "27 hours"
humanizeDuration(97320000, { units: ['d', 'h'] }) // "1 day, 3 hours"

// Rounding
humanizeDuration(97320000, { round: true })      // "1 day"
humanizeDuration(97320000, { largest: 2 })       // "1 day, 3 hours"

// Delimiter
humanizeDuration(97320000, { delimiter: ' and ' })
// => "1 day and 3 hours and 2 minutes"

// Conjunction
humanizeDuration(97320000, { conjunction: ' and ' })
// => "1 day, 3 hours and 2 minutes"

// Spacer
humanizeDuration(3600000, { spacer: '' })        // "1hour"
```

## License

MIT
