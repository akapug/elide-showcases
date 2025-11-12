# Python Prefect Flows + TypeScript API

**Enterprise Pattern**: Prefect workflow orchestration with TypeScript API.

## 🎯 Use Case

Modern workflow orchestration with Prefect, API in TypeScript.

## 💡 Solution

```typescript
import { manager } from "./prefect_flows.py";
const run = manager.run_flow("data_pipeline");
```

## 🏃 Running

```bash
cd /home/user/elide-showcases/original/showcases/python-prefect-flows
elide serve server.ts
```

## 📡 Examples

### List Flows
```bash
curl http://localhost:3000/api/flows
```

### Run Flow
```bash
curl -X POST http://localhost:3000/api/run \
  -H "Content-Type: application/json" \
  -d '{"flow": "data_pipeline"}'
```

Perfect for modern workflow orchestration!
