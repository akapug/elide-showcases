# Ruby Capistrano Deployment + TypeScript

**Enterprise Pattern**: Ruby deployment automation with TypeScript API.

## 🎯 Use Case

Deployment automation with Capistrano, controlled via TypeScript.

## 💡 Solution

```typescript
import { $deployer } from "./capistrano_deploy.rb";
const deployment = $deployer.deploy("production", "v1.2.3");
```

## 🏃 Running

```bash
cd /home/user/elide-showcases/original/showcases/ruby-capistrano-deploy
elide serve server.ts
```

Perfect for deployment automation!
