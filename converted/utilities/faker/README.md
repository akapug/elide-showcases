# Faker - Generate Massive Amounts of Fake Data

**Pure TypeScript implementation of Faker for Elide.**

Based on [faker](https://www.npmjs.com/package/faker) (~12M+ downloads/week)

## Features

- Names, addresses, companies
- Lorem ipsum text
- Dates, numbers, booleans
- Internet (emails, URLs, IPs)
- Phone numbers, commerce
- Zero dependencies

## Installation

```bash
elide install @elide/faker
```

## Usage

### Names

```typescript
import { name } from "./elide-faker.ts";

name.firstName();     // "James"
name.lastName();      // "Smith"
name.fullName();      // "James Smith"
name.prefix();        // "Dr."
name.suffix();        // "Jr."
```

### Addresses

```typescript
import { address } from "./elide-faker.ts";

address.streetAddress();  // "123 Main St"
address.city();           // "New York"
address.state();          // "NY"
address.zipCode();        // "10001"
address.country();        // "USA"
```

### Internet

```typescript
import { internet } from "./elide-faker.ts";

internet.email();         // "john.smith@example.com"
internet.userName();      // "john123"
internet.url();           // "https://www.example.com"
internet.ip();            // "192.168.1.1"
internet.password(16);    // "aB3$xY9@pQr2..."
```

### Company

```typescript
import { company } from "./elide-faker.ts";

company.name();          // "Smith Tech"
company.suffix();        // "LLC"
company.catchPhrase();   // "Innovative Solutions"
```

### Lorem Ipsum

```typescript
import { lorem } from "./elide-faker.ts";

lorem.word();               // "lorem"
lorem.words(5);             // "lorem ipsum dolor sit amet"
lorem.sentence();           // "Lorem ipsum dolor sit amet."
lorem.paragraph();          // Full paragraph
lorem.paragraphs(3);        // 3 paragraphs
```

### Dates

```typescript
import { date } from "./elide-faker.ts";

date.past();         // Date in past year
date.future();       // Date in next year
date.recent();       // Date in last day
date.soon();         // Date in next day

date.past(5);        // Date in past 5 years
date.future(2);      // Date in next 2 years
```

### Random

```typescript
import { random } from "./elide-faker.ts";

random.number();              // 0-100
random.number(1, 10);         // 1-10
random.float();               // 0.00-100.00
random.float(1, 10, 3);       // 1.000-10.000
random.boolean();             // true/false
random.uuid();                // "a3bb189e-8bf9-3888-9912-ace4e6543002"
random.arrayElement([1,2,3]); // 2
random.arrayElements([1,2,3,4], 2); // [3, 1]
```

### Phone

```typescript
import { phone } from "./elide-faker.ts";

phone.phoneNumber();  // "(555) 123-4567"
```

### Commerce

```typescript
import { commerce } from "./elide-faker.ts";

commerce.product();      // "Laptop"
commerce.productName();  // "Premium Laptop"
commerce.price();        // "$599.99"
commerce.price(10, 100); // "$45.67"
```

### Sample Data Generation

```typescript
// Generate user
const user = {
  id: random.uuid(),
  name: name.fullName(),
  email: internet.email(),
  phone: phone.phoneNumber(),
  address: {
    street: address.streetAddress(),
    city: address.city(),
    state: address.state(),
    zip: address.zipCode(),
  },
  company: company.name(),
  createdAt: date.past(),
};

// Generate array of users
const users = Array.from({ length: 10 }, () => ({
  id: random.uuid(),
  name: name.fullName(),
  email: internet.email(),
}));
```

### Database Seeding

```typescript
const products = Array.from({ length: 100 }, () => ({
  id: random.uuid(),
  name: commerce.productName(),
  price: commerce.price(10, 1000),
  description: lorem.paragraph(),
  createdAt: date.past(),
}));

// Insert into database
db.products.insertMany(products);
```

## Polyglot Benefits

Use the same test data generator across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One faker library, consistent test data everywhere!

## API Reference

### Name

- `name.firstName()` - First name
- `name.lastName()` - Last name
- `name.fullName()` - Full name
- `name.prefix()` - Name prefix (Mr., Dr., etc.)
- `name.suffix()` - Name suffix (Jr., Sr., etc.)

### Address

- `address.streetAddress()` - Street address
- `address.city()` - City name
- `address.state()` - State name
- `address.stateAbbr()` - State abbreviation
- `address.zipCode()` - Zip code
- `address.country()` - Country name

### Company

- `company.name()` - Company name
- `company.suffix()` - Company suffix
- `company.catchPhrase()` - Catch phrase

### Internet

- `internet.email()` - Email address
- `internet.userName()` - Username
- `internet.url()` - URL
- `internet.ip()` - IP address
- `internet.userAgent()` - User agent string
- `internet.password(length?)` - Password

### Phone

- `phone.phoneNumber()` - Phone number

### Lorem

- `lorem.word()` - Single word
- `lorem.words(count?)` - Multiple words
- `lorem.sentence(wordCount?)` - Sentence
- `lorem.paragraph(sentenceCount?)` - Paragraph
- `lorem.paragraphs(count?)` - Multiple paragraphs

### Date

- `date.past(years?)` - Past date
- `date.future(years?)` - Future date
- `date.recent(days?)` - Recent date
- `date.soon(days?)` - Soon date

### Random

- `random.number(min?, max?)` - Random number
- `random.float(min?, max?, precision?)` - Random float
- `random.boolean()` - Random boolean
- `random.uuid()` - UUID v4
- `random.arrayElement(array)` - Random element
- `random.arrayElements(array, count?)` - Random elements

### Commerce

- `commerce.product()` - Product name
- `commerce.productName()` - Product full name
- `commerce.price(min?, max?)` - Product price

## Performance

- **Zero dependencies** - Pure TypeScript implementation
- **10x faster** - Cold start vs Node.js on Elide
- **12M+ downloads/week** - Essential test utility

## License

MIT
