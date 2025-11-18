# Unleash Client - Feature Flag Management - Elide Polyglot Showcase

> **One feature flag system for ALL languages** - TypeScript, Python, Ruby, and Java

Manage feature toggles, gradual rollouts, and A/B testing with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

Feature flags are **essential for modern deployment**:
- Roll out features gradually (reduce risk)
- A/B test new features (data-driven decisions)
- Kill switches for emergency shutdowns
- User segmentation (premium vs free)

**Elide Unleash solves this** with ONE system that works in ALL languages.

## ✨ Features

- ✅ Feature toggles with gradual rollout
- ✅ User segmentation and targeting
- ✅ A/B testing with variants
- ✅ Percentage-based rollouts
- ✅ Custom activation strategies
- ✅ Constraint-based targeting
- ✅ Offline mode with bootstrap
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import { initialize } from './elide-unleash-client.ts';

const unleash = initialize({
  appName: 'my-app',
  environment: 'production',
  bootstrap: [
    {
      name: 'new-checkout',
      enabled: true,
      strategies: [
        {
          name: 'gradualRolloutUserId',
          parameters: { percentage: '50', groupId: 'checkout' },
        },
      ],
    },
  ],
});

// Check if feature is enabled
if (unleash.isEnabled('new-checkout', { userId: 'user123' })) {
  // Show new checkout flow
}

// Get A/B test variant
const variant = unleash.getVariant('dark-mode', { userId: 'user123' });
if (variant?.name === 'variant-a') {
  // Show variant A
}
```

### Python
```python
from elide import require
unleash_module = require('./elide-unleash-client.ts')

unleash = unleash_module.initialize({
    'appName': 'my-app',
    'environment': 'production',
    'bootstrap': [
        {
            'name': 'new-checkout',
            'enabled': True,
            'strategies': [
                {
                    'name': 'gradualRolloutUserId',
                    'parameters': { 'percentage': '50', 'groupId': 'checkout' }
                }
            ]
        }
    ]
})

# Check feature
if unleash.isEnabled('new-checkout', {'userId': 'user123'}):
    # Show new checkout
    pass
```

### Ruby
```ruby
unleash_module = Elide.require('./elide-unleash-client.ts')

unleash = unleash_module.initialize({
  appName: 'my-app',
  environment: 'production',
  bootstrap: [
    {
      name: 'new-checkout',
      enabled: true,
      strategies: [
        {
          name: 'gradualRolloutUserId',
          parameters: { percentage: '50', groupId: 'checkout' }
        }
      ]
    }
  ]
})

# Check feature
if unleash.isEnabled('new-checkout', { userId: 'user123' })
  # Show new checkout
end
```

### Java
```java
Value unleashModule = context.eval("js", "require('./elide-unleash-client.ts')");

Value config = context.eval("js", "({ appName: 'my-app', environment: 'production' })");
Value unleash = unleashModule.invokeMember("initialize", config);

Value ctx = context.eval("js", "({ userId: 'user123' })");
boolean enabled = unleash.invokeMember("isEnabled", "new-checkout", ctx).asBoolean();
```

## 📖 API Reference

### `initialize(config: UnleashConfig): UnleashClient`

Create an Unleash client.

```typescript
const unleash = initialize({
  appName: 'my-app',
  environment: 'production',
  bootstrap: [...],
});
```

### `isEnabled(name: string, context?: UnleashContext, fallback?: boolean): boolean`

Check if feature is enabled.

```typescript
unleash.isEnabled('feature-name', { userId: 'user123' })
unleash.isEnabled('feature-name', {}, false) // with fallback
```

### `getVariant(name: string, context?: UnleashContext): Variant | null`

Get A/B test variant.

```typescript
const variant = unleash.getVariant('feature-name', { userId: 'user123' });
if (variant?.name === 'variant-a') {
  // Handle variant A
}
```

## 💡 Real-World Use Cases

### 1. Gradual Rollout
```typescript
unleash.addToggle({
  name: 'new-ui',
  enabled: true,
  strategies: [
    {
      name: 'gradualRolloutUserId',
      parameters: { percentage: '10', groupId: 'ui' }, // 10% of users
    },
  ],
});
```

### 2. Premium Features
```typescript
unleash.addToggle({
  name: 'premium-export',
  enabled: true,
  strategies: [
    {
      name: 'userWithId',
      parameters: { userIds: 'premium-user-1,premium-user-2' },
    },
  ],
});
```

### 3. A/B Testing
```typescript
unleash.addToggle({
  name: 'checkout-flow',
  enabled: true,
  strategies: [{ name: 'default' }],
  variants: [
    { name: 'control', weight: 50 },
    { name: 'variant-a', weight: 50 },
  ],
});

const variant = unleash.getVariant('checkout-flow', { userId: 'user123' });
```

### 4. Kill Switch
```typescript
unleash.addToggle({
  name: 'payment-processing',
  enabled: false, // Emergency shutdown
  strategies: [{ name: 'default' }],
});
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm unleash-client](https://www.npmjs.com/package/unleash-client) (~100K+ downloads/week)
- [Unleash Official Docs](https://docs.getunleash.io/)

## 📝 Package Stats

- **npm downloads**: ~100K+/week
- **Use case**: Feature flag management across all services
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Making feature flags work everywhere.*
