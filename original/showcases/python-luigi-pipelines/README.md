# Python Luigi Pipelines + TypeScript

**Enterprise Pattern**: Luigi data pipelines with TypeScript API.

## 🎯 Use Case

Data pipeline orchestration with Luigi, API in TypeScript.

## 💡 Solution

```typescript
import { pipeline_manager } from "./luigi_pipelines.py";
const result = pipeline_manager.run_pipeline("etl_pipeline");
```

## 🏃 Running

```bash
cd /home/user/elide-showcases/original/showcases/python-luigi-pipelines
elide serve server.ts
```

Perfect for data pipelines!
