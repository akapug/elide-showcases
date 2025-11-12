# Lodash for Elide

A modern JavaScript utility library delivering modularity, performance & extras, converted to run natively on Elide.

**Downloads**: ~30M/week on npm
**Category**: Utility Library
**Status**: ✅ Production Ready

## Overview

Lodash is the most popular JavaScript utility library, providing hundreds of useful functions for working with arrays, objects, strings, and more. This Elide conversion brings these essential utilities to polyglot environments.

## Features

- **Array Utilities**: chunk, compact, flatten, uniq, difference, intersection, zip, and more
- **Object Utilities**: pick, omit, merge, cloneDeep, get, set, has, and more
- **Collection Utilities**: map, filter, reduce, groupBy, countBy, sortBy, and more
- **String Utilities**: camelCase, kebabCase, snakeCase, capitalize, truncate, and more
- **Function Utilities**: debounce, throttle, memoize, once, and more
- **Type Checking**: isArray, isObject, isString, isEmpty, and more
- **Number Utilities**: sum, mean, min, max, clamp, random, and more

## Quick Start

```typescript
import _, {
  chunk, groupBy, get, camelCase, debounce
} from './lodash.ts';

// Array operations
chunk([1, 2, 3, 4, 5], 2);  // [[1, 2], [3, 4], [5]]

// Object operations
const obj = { user: { name: 'Alice', age: 30 } };
get(obj, 'user.name');  // 'Alice'

// Collection operations
const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' }
];
groupBy(users, u => u.role);  // { admin: [...], user: [...] }

// String operations
camelCase('hello world');  // 'helloWorld'

// Function utilities
const debouncedSave = debounce(saveData, 1000);
```

## Use Cases

1. **Data Transformation**: Transform API responses, process datasets
2. **Object Manipulation**: Deep cloning, merging configs, property access
3. **Array Operations**: Filtering, sorting, grouping, deduplication
4. **String Formatting**: Case conversion, truncation, padding
5. **Function Composition**: Debouncing, throttling, memoization
6. **Type Safety**: Runtime type checking and validation

## API Reference

### Array Methods
- `chunk(array, size)` - Split array into chunks
- `compact(array)` - Remove falsy values
- `flatten(array)` - Flatten one level deep
- `flattenDeep(array)` - Recursively flatten
- `uniq(array)` - Remove duplicates
- `uniqBy(array, iteratee)` - Remove duplicates by property
- `difference(array, ...values)` - Get array difference
- `intersection(...arrays)` - Get array intersection
- `take(array, n)` - Take first n elements
- `drop(array, n)` - Drop first n elements
- `zip(...arrays)` - Zip arrays together
- `zipObject(keys, values)` - Create object from arrays

### Object Methods
- `pick(object, keys)` - Pick properties
- `omit(object, keys)` - Omit properties
- `merge(...objects)` - Merge objects
- `cloneDeep(value)` - Deep clone
- `get(object, path, default)` - Safe property access
- `set(object, path, value)` - Set nested property
- `has(object, path)` - Check if path exists
- `keys(object)` - Get object keys
- `values(object)` - Get object values
- `entries(object)` - Get key-value pairs
- `invert(object)` - Swap keys and values

### Collection Methods
- `map(collection, iteratee)` - Transform items
- `filter(collection, predicate)` - Filter items
- `reduce(collection, iteratee, initial)` - Reduce to value
- `find(collection, predicate)` - Find first match
- `groupBy(collection, iteratee)` - Group by property
- `countBy(collection, iteratee)` - Count by property
- `sortBy(collection, iteratee)` - Sort by property
- `orderBy(collection, iteratees, orders)` - Multi-sort

### String Methods
- `camelCase(string)` - Convert to camelCase
- `kebabCase(string)` - Convert to kebab-case
- `snakeCase(string)` - Convert to snake_case
- `startCase(string)` - Convert to Start Case
- `capitalize(string)` - Capitalize first letter
- `truncate(string, options)` - Truncate with ellipsis
- `pad(string, length, chars)` - Pad string
- `trim(string, chars)` - Trim characters

### Function Methods
- `debounce(func, wait)` - Debounce function calls
- `throttle(func, wait)` - Throttle function calls
- `once(func)` - Call function only once
- `memoize(func)` - Cache function results
- `negate(predicate)` - Negate predicate function

### Number Methods
- `sum(numbers)` - Sum array of numbers
- `mean(numbers)` - Calculate mean
- `min(numbers)` - Find minimum
- `max(numbers)` - Find maximum
- `clamp(number, min, max)` - Clamp to range
- `random(min, max)` - Generate random number
- `randomInt(min, max)` - Generate random integer
- `inRange(number, start, end)` - Check if in range

### Type Checking
- `isArray(value)` - Check if array
- `isObject(value)` - Check if object
- `isString(value)` - Check if string
- `isNumber(value)` - Check if number
- `isFunction(value)` - Check if function
- `isBoolean(value)` - Check if boolean
- `isNull(value)` - Check if null
- `isUndefined(value)` - Check if undefined
- `isNil(value)` - Check if null or undefined
- `isEmpty(value)` - Check if empty

### Utility Methods
- `range(start, end, step)` - Generate range of numbers
- `times(n, iteratee)` - Invoke function n times
- `uniqueId(prefix)` - Generate unique ID
- `noop()` - No operation function
- `identity(value)` - Return value unchanged
- `constant(value)` - Create constant function

## Examples

### Data Processing Pipeline
```typescript
const orders = [
  { id: 1, customer: 'Alice', total: 100, status: 'completed' },
  { id: 2, customer: 'Bob', total: 150, status: 'pending' },
  { id: 3, customer: 'Alice', total: 200, status: 'completed' }
];

// Get completed orders
const completed = filter(orders, o => o.status === 'completed');

// Calculate total revenue
const revenue = sum(map(completed, o => o.total));

// Group by customer
const byCustomer = groupBy(orders, o => o.customer);

// Find top customer
const topCustomer = orderBy(
  Object.entries(byCustomer).map(([name, orders]) => ({
    name,
    total: sum(map(orders, 'total'))
  })),
  ['total'],
  ['desc']
)[0];
```

### Configuration Management
```typescript
const config = {
  database: {
    host: 'localhost',
    port: 5432,
    credentials: {
      username: 'admin',
      password: 'secret'
    }
  }
};

// Safe access with defaults
const host = get(config, 'database.host', 'localhost');
const timeout = get(config, 'database.timeout', 30000);

// Pick only needed config
const dbConfig = pick(config.database, ['host', 'port']);

// Omit sensitive data
const safeConfig = omit(config.database, ['credentials']);

// Deep clone for modification
const devConfig = cloneDeep(config);
set(devConfig, 'database.host', 'dev-server');
```

### String Formatting
```typescript
// API field name conversion
const apiResponse = {
  'user_name': 'Alice',
  'email_address': 'alice@example.com',
  'phone_number': '555-1234'
};

const formatted = {};
for (const [key, value] of entries(apiResponse)) {
  formatted[camelCase(key)] = value;
}
// { userName: 'Alice', emailAddress: '...', phoneNumber: '...' }

// Display name formatting
const displayName = startCase(kebabCase('userFirstName'));
// 'User First Name'
```

### Function Optimization
```typescript
// Debounced search
const searchAPI = (query: string) => {
  console.log('Searching for:', query);
  // API call...
};
const debouncedSearch = debounce(searchAPI, 300);

// Memoized expensive calculation
const fibonacci = memoize((n: number): number => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

// One-time initialization
const initializeApp = once(() => {
  console.log('App initialized');
  // Setup code...
});
```

## Performance

- Zero dependencies
- Native Elide execution (10x faster cold start than Node.js)
- Efficient implementations using built-in JavaScript methods
- Memoization support for expensive operations

## Polyglot Benefits

This implementation works seamlessly across:
- JavaScript/TypeScript
- Python (via Elide)
- Ruby (via Elide)
- Java (via Elide)

One utility library, consistent API everywhere!

## Migration from npm

```typescript
// Before (npm)
import _ from 'lodash';

// After (Elide)
import _ from './lodash.ts';

// API is identical!
const result = _.chunk([1, 2, 3, 4], 2);
```

## Run the Demo

```bash
elide run lodash.ts
```

## Resources

- Original package: https://www.npmjs.com/package/lodash
- Downloads: ~30M/week
- License: MIT
