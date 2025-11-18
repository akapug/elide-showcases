# Prom Client - Prometheus Client - Elide Polyglot Showcase

> **Prometheus for ALL languages** - TypeScript, Python, Ruby, and Java

A Prometheus metrics client with counters, gauges, histograms, and summaries.

## ✨ Features

- ✅ Counter metrics
- ✅ Gauge metrics
- ✅ Histogram metrics
- ✅ Labels support
- ✅ Prometheus format
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { Counter, Gauge, register } from './elide-prom-client.ts';

const httpRequests = new Counter('http_requests_total', 'Total HTTP requests');
const activeConnections = new Gauge('active_connections', 'Active connections');

register.registerMetric(httpRequests);
httpRequests.inc();

console.log(register.metrics());
```

## 📝 Package Stats

- **npm downloads**: ~8M/week
- **Use case**: Prometheus metrics
- **Polyglot score**: 50/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
