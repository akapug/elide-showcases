# Email Deliverability Checker - Email Deliverability Analysis

Check email deliverability with comprehensive analysis.

## Quick Start

```typescript
import { checkDeliverability } from './elide-email-deliverability-checker.ts';

const result = await checkDeliverability("user@example.com");
console.log(result.score);
console.log(result.recommendation);
```
