# Ruby Redis Queue (Resque) + TypeScript

**Enterprise Pattern**: Ruby background job queue with TypeScript API.

## 🎯 Use Case

Background job processing with Ruby's Resque-style queues, exposed via TypeScript.

## 💡 Solution

```typescript
import { $redis_worker } from "./redis_queue.rb";
const jobId = $redis_worker.enqueue("default", "EmailJob", args);
```

## 🏃 Running

```bash
cd /home/user/elide-showcases/original/showcases/ruby-redis-queue
elide serve server.ts
```

## 📡 Examples

### Enqueue Job
```bash
curl -X POST http://localhost:3000/api/enqueue \
  -H "Content-Type: application/json" \
  -d '{"queue": "default", "jobClass": "EmailJob", "args": ["user@example.com"]}'
```

### Process Job
```bash
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{"queue": "default"}'
```

Perfect for Ruby-style background jobs!
