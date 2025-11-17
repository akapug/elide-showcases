# ms Clone for Elide

Convert various time formats to milliseconds and vice versa.

## Features

- **Bidirectional**: String to milliseconds and back
- **Flexible**: Supports multiple time units
- **Compact**: Minimal bundle size
- **Type-Safe**: Full TypeScript support

## Installation

```bash
elide install ms-clone
```

## Quick Start

```typescript
import ms from './ms-clone.ts'

// String to milliseconds
ms('2 days')    // 172800000
ms('1d')        // 86400000
ms('10h')       // 36000000
ms('2.5 hrs')   // 9000000
ms('2h')        // 7200000
ms('1m')        // 60000
ms('5s')        // 5000
ms('1y')        // 31557600000
ms('100')       // 100

// Milliseconds to string
ms(60000)             // "1m"
ms(2 * 60000)         // "2m"
ms(ms('10 hours'))    // "10h"
ms(60000, { long: true })  // "1 minute"
ms(2 * 60000, { long: true })  // "2 minutes"
ms(ms('10 hours'), { long: true })  // "10 hours"
```

## API

### `ms(value, options?)`

Convert string to milliseconds or milliseconds to string.

#### String → Number
```typescript
ms('1s')   // 1000
ms('1m')   // 60000
ms('1h')   // 3600000
ms('1d')   // 86400000
ms('1w')   // 604800000
ms('1y')   // 31557600000
```

#### Number → String
```typescript
ms(1000)   // "1s"
ms(60000)  // "1m"
ms(3600000) // "1h"
```

#### Options
```typescript
interface Options {
  long?: boolean  // Use long format
}

ms(1000)                    // "1s"
ms(1000, { long: true })    // "1 second"
ms(60000, { long: true })   // "1 minute"
```

## Supported Units

- **Milliseconds**: `ms`, `millisecond`, `milliseconds`
- **Seconds**: `s`, `sec`, `second`, `seconds`
- **Minutes**: `m`, `min`, `minute`, `minutes`
- **Hours**: `h`, `hr`, `hour`, `hours`
- **Days**: `d`, `day`, `days`
- **Weeks**: `w`, `week`, `weeks`
- **Years**: `y`, `yr`, `year`, `years`

## Examples

```typescript
// Durations
ms('1h 30m')  // Not supported, use separate calls
ms('1.5h')    // 5400000

// Long format
ms(1000, { long: true })        // "1 second"
ms(60000, { long: true })       // "1 minute"
ms(3600000, { long: true })     // "1 hour"

// Use in code
const timeout = ms('5s')
setTimeout(() => {}, timeout)

const interval = ms('30m')
setInterval(() => {}, interval)
```

## License

MIT
