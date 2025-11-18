# React Native In App Purchase - Elide Polyglot Showcase

> **One IAP library for ALL languages** - TypeScript, Python, Ruby, and Java

In-app purchase module for React Native.

## Features

- Product purchases
- Subscriptions
- Receipt validation
- Restore purchases
- iOS and Android support
- **~100K downloads/week on npm**

## Quick Start

```typescript
import { initConnection, getProducts, requestPurchase } from './elide-react-native-in-app-purchase.ts';

await initConnection();

const products = await getProducts(['com.example.product']);
const purchase = await requestPurchase('com.example.product');
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-in-app-purchase.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-iap)

---

**Built with ❤️ for the Elide Polyglot Runtime**
