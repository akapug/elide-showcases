# trace-agent - Elide Polyglot Showcase

> **Google Cloud Trace for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic request tracing
- Google Cloud integration
- Performance profiling
- Custom spans
- **~100K downloads/week on npm**

## Quick Start

```typescript
import traceAgent from './elide-trace-agent.ts';

traceAgent.start({
  projectId: 'my-gcp-project',
  serviceContext: {
    service: 'my-api',
    version: '1.0.0',
  },
});

const agent = traceAgent.get();
agent.runInRootSpan({ name: 'operation' }, (span) => {
  // Your code here
});
```

## Links

- [Google Cloud Trace](https://cloud.google.com/trace)

---

**Built with ❤️ for the Elide Polyglot Runtime**
