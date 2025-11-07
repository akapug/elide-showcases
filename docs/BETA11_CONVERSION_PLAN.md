# Beta11 Conversion Plan - Step-by-Step

**When**: Execute immediately upon beta11 release  
**Goal**: Convert 40-50 HTTP-dependent showcases to native Elide  
**Time**: 2-4 hours for all conversions

---

## Phase 1: Preparation (Before Beta11) ✅ DONE

### ✅ Repository Audit
- [x] Identified 7 broken showcases (wrong imports)
- [x] Cataloged all 251 projects  
- [x] Added reality check labels
- [x] Updated all documentation
- [x] Created gap analysis

### ✅ Conversion Strategy
- [x] Analyzed HTTP PR capabilities
- [x] Identified conversion patterns
- [x] Created test strategy
- [x] Documented known gaps

---

## Phase 2: Immediate Conversion (Day 1, Hours 1-4)

### Hour 1: Installation & Verification

**Step 1: Install Beta11**
```bash
curl -sSL https://elide.sh | bash -s -
elide --version  # Verify shows beta11
```

**Step 2: Verify HTTP Support**
```bash
# Create test file
cat > test-http.ts << 'EOF'
import { createServer } from "http";

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('HTTP works!\n');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
EOF

# Test it
elide run test-http.ts
curl http://localhost:3000  # Should show "HTTP works!"
```

**Step 3: Verify Features**
```bash
# Test TLS (if certificates available)
# Test HTTP/2 (if configured)
# Test fetch handler style
```

### Hours 2-4: Fix 7 Broken Showcases

**These currently have wrong imports - need immediate fixing:**

1. **blockchain-indexer**
2. **kubernetes-controller**
3. **defi-analytics**
4. **nft-marketplace-api**
5. **smart-contract-monitor**
6. **model-serving-tensorflow**
7. **image-generation-api**

**For each showcase:**

```bash
cd original/showcases/[showcase-name]

# 1. Back up current version
cp server.ts server.ts.backup

# 2. Edit server.ts
# Find the broken import/server pattern and replace with working code

# 3. Test it works
elide run server.ts

# 4. Verify endpoints
curl http://localhost:[PORT]/[endpoint]

# 5. Commit
git add server.ts
git commit -m "fix: convert [showcase] to use Elide beta11 native HTTP"
```

**Specific Patterns to Replace:**

**Pattern A: Remove Bun imports**
```typescript
// OLD (Bun-specific):
import { serve } from "bun";
serve({ port: 3000, fetch: handler });

// NEW (Elide beta11):
import { createServer } from "http";
const server = createServer((req, res) => {
  // Convert fetch handler logic to req/res style
});
server.listen(3000);
```

**Pattern B: Node.js imports (already work)**
```typescript
// These should already work in beta11:
import { createServer } from "http";
const server = createServer((req, res) => {
  // This code should work as-is!
});
server.listen(3000);
```

**Expected Results After Hour 4:**
- ✅ 7 showcases converted
- ✅ All tested and working
- ✅ Committed to git
- ✅ No more broken imports

---

## Phase 3: Systematic Conversion (Days 2-3)

### Find All HTTP Usage

```bash
cd /home/user/elide-showcases-reorg

# Find all http imports
grep -r "from ['\"]http['\"]" original/showcases/
grep -r "from ['\"]https['\"]" original/showcases/
grep -r "from ['\"]http2['\"]" original/showcases/
grep -r "import.*http" original/showcases/

# Find all Bun usage
grep -r "from ['\"]bun['\"]" original/showcases/

# Create list of files to convert
find original/showcases -name "server.ts" -o -name "*-server.ts" -o -name "api.ts"
```

### Conversion Template

For each showcase with HTTP server code:

**1. Read Current Implementation**
```bash
cat original/showcases/[name]/server.ts
```

**2. Identify Pattern**
- Node.js `http.createServer` → Already works, just test
- Bun `serve()` → Convert to `createServer`
- Custom server → Adapt to `createServer` or fetch handler

**3. Choose Conversion Style**

**Option A: Imperative (Node.js style)**
```typescript
import { createServer } from "http";

const server = createServer((req, res) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const path = url.pathname;
  
  if (path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
```

**Option B: Declarative (fetch handler)**
```typescript
export default async function fetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({ status: 'healthy' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}
```

**4. Test Conversion**
```bash
# Start server
elide run server.ts

# Test endpoints (in another terminal)
curl http://localhost:3000/api/health
curl http://localhost:3000/api/some-endpoint
curl -X POST http://localhost:3000/api/data -d '{"test": true}'

# Check logs for errors
```

**5. Update README**
```markdown
## Running

bash
elide run server.ts


The server will start on http://localhost:3000

## Requirements

- Elide beta11 or later
```

**6. Commit**
```bash
git add original/showcases/[name]/
git commit -m "feat: convert [name] to Elide beta11 native HTTP

- Remove Bun/shim dependencies
- Use native http.createServer
- Tested all endpoints
- Updated documentation"
```

### Batch Conversion Script

```bash
#!/bin/bash
# convert-showcases.sh

SHOWCASES=(
  "llm-inference-server"
  "whisper-transcription"
  "vector-search-service"
  "rag-service"
  "prompt-engineering-toolkit"
  "service-mesh"
  "api-gateway-advanced"
  "event-sourcing"
  "distributed-tracing"
  "workflow-orchestrator"
  "stream-processor"
  "etl-pipeline"
  "change-data-capture"
  "analytics-engine"
  "data-quality-checker"
  "graphql-federation"
  "grpc-service-mesh"
  "websocket-scaling"
  "oauth2-provider"
  "multi-tenant-saas"
  "video-streaming-platform"
  "iot-device-manager"
  "payment-processor"
  "notification-hub"
  "serverless-orchestrator"
  "container-registry"
  "secrets-manager"
  "backup-restore-service"
  "wallet-service"
  "edge-cdn"
  "edge-authentication"
  "edge-image-optimizer"
  "edge-api-proxy"
  "edge-analytics"
  "threat-detection"
  "compliance-monitor"
  "vulnerability-scanner"
  "access-control-service"
  "encryption-service"
)

for showcase in "${SHOWCASES[@]}"; do
  echo "Processing $showcase..."
  cd "original/showcases/$showcase"
  
  # Check if it has http server
  if grep -q "createServer\|serve(" server.ts 2>/dev/null; then
    echo "  Found HTTP server code"
    
    # Test if it runs
    timeout 5 elide run server.ts &
    PID=$!
    sleep 2
    
    # Test health endpoint
    if curl -s http://localhost:3000/health > /dev/null; then
      echo "  ✓ Server works!"
      kill $PID 2>/dev/null
    else
      echo "  ✗ Server needs manual conversion"
      kill $PID 2>/dev/null
    fi
  else
    echo "  No HTTP server found, skipping"
  fi
  
  cd ../../..
done
```

**Expected Results After Days 2-3:**
- ✅ 40-50 showcases converted
- ✅ All tested  
- ✅ Documentation updated
- ✅ Committed to git

---

## Phase 4: Testing & Documentation (Week 1)

### Full Test Suite

```bash
# Test each showcase category
for category in llm microservices data backend apps cloud blockchain edge security; do
  echo "Testing $category showcases..."
  # Run tests for each category
done

# Test conversions
find original/showcases -name "server.ts" | while read file; do
  dir=$(dirname "$file")
  echo "Testing $dir..."
  cd "$dir"
  timeout 10 elide run server.ts &
  sleep 2
  # Test basic endpoints
  curl -s http://localhost:3000/ || echo "Failed: $dir"
  pkill -P $$
  cd -
done
```

### Performance Benchmarks

```bash
# Create benchmark script
cat > benchmark-beta11.ts << 'EOF'
import { createServer } from "http";

const server = createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
});

server.listen(3000);
console.log('Benchmark server ready');
EOF

# Run benchmarks
elide run benchmark-beta11.ts &
sleep 2

# Use wrk or similar
wrk -t4 -c100 -d30s http://localhost:3000/

# Compare to Node.js baseline
node benchmark-node.js &
wrk -t4 -c100 -d30s http://localhost:3000/

# Document results
```

### Update Documentation

**Files to Update:**
1. `README.md` - Update "What Works" section
2. `GETTING_STARTED.md` - Remove HTTP shim warnings
3. `docs/SHIMS.md` - Mark HTTP as ✅ SOLVED
4. `docs/REALITY_CHECK_LABELS.md` - Update status counts
5. `original/showcases/*/README.md` - Remove "requires shims" notes

**Template for Showcase READMEs:**
```markdown
## Requirements

- Elide beta11 or later (for native HTTP support)

## Running

bash
elide run server.ts


Server starts on http://localhost:3000

## What Changed in Beta11

✅ Now uses native Elide HTTP server (no more shims!)
✅ Supports TLS/HTTPS
✅ HTTP/2 and HTTP/3 ready
✅ Production-ready performance
```

---

## Phase 5: Known Issues & Edge Cases

### WebSocket Showcases (5-10 projects)

**These need WebSocket support (not in beta11):**
- nanochat-lite
- realtime-dashboard
- real-time-collaboration
- websocket-scaling
- (any others using WebSocket)

**Action:**
1. Add note to README:
   ```markdown
   ## ⚠️ WebSocket Support
   
   This showcase requires WebSocket support, which is coming in a future Elide release.
   
   **Current Status**: Educational/Reference - Shows architecture
   **When Available**: Elide beta12+ (est.)
   
   **Alternative**: Use polling or Server-Sent Events when available
   ```

2. Keep in repository with clear labeling
3. Monitor WebSocket PR progress
4. Convert when available

### Stream-Heavy Showcases

**These may need refactoring for Web Streams:**
- data-pipeline showcases
- video-streaming-platform
- real-time-collaboration

**Action:**
1. Test with current code
2. If issues, refactor to use Web Streams API
3. Document any breaking changes
4. Provide migration guide

### Multi-Server Showcases

**These may need architectural changes:**
- (identify any showcases running multiple servers)

**Action:**
1. Check if really needs multiple servers
2. If yes, use single server with routing
3. Document the limitation
4. Consider future enhancement

---

## Phase 6: Announcement (Week 2)

### Blog Post Draft

**Title**: "Elide Beta11: Native HTTP Server Support - 40+ Showcases Now Production-Ready"

**Outline:**
1. Introduction
   - What was missing (HTTP server API)
   - What beta11 adds
   - Impact on ecosystem

2. What's New
   - HTTP server (`http.createServer`)
   - TLS/HTTPS support
   - HTTP/2 and HTTP/3
   - Python/WSGI support
   - Performance benchmarks

3. Showcase Conversions
   - 40+ showcases now native
   - Migration examples
   - Before/after code
   - Performance improvements

4. What's Next
   - WebSocket support coming
   - Crypto API
   - File System API
   - Community contributions

5. Get Started
   - Installation
   - Quick start
   - Link to showcases repo

### Demo Videos

**Record 3-5 minute demos:**
1. "Hello World HTTP Server" (30 seconds)
2. "Full-Stack App with TLS" (2 minutes)
3. "Microservices Pattern" (2 minutes)
4. "Python Flask Integration" (1 minute)
5. "Performance Comparison" (1 minute)

### Social Media

**Twitter Thread:**
```
🚀 Elide beta11 is here with native HTTP server support!

40+ showcases now run without shims:
✅ HTTP/HTTPS/HTTP2/HTTP3
✅ Python Flask apps
✅ Microservices patterns
✅ 10x faster cold start than Node

Thread 🧵👇
```

**HackerNews Post:**
```
Title: Elide Beta11: Native HTTP Server Support

Body:
We're excited to announce Elide beta11 with full HTTP server support.

Key features:
- Native http.createServer (Node.js compatible)
- TLS/HTTPS with automatic certificate handling
- HTTP/2 and HTTP/3 support
- Python/WSGI integration (Flask works!)
- 10x faster cold start vs Node.js

We've converted 40+ showcases to run natively, including:
- LLM inference servers
- Microservices patterns
- Data pipelines
- Real-world applications

Repo: https://github.com/akapug/elide-showcases
Docs: https://docs.elide.dev

Happy to answer questions!
```

---

## Success Criteria

After complete conversion:

### Technical
- [ ] 0 showcases using http shims
- [ ] 40-50 showcases running natively
- [ ] All tests passing
- [ ] Performance benchmarks documented
- [ ] Known issues documented

### Documentation
- [ ] README updated
- [ ] SHIMS.md updated
- [ ] GETTING_STARTED.md updated
- [ ] All showcase READMEs updated
- [ ] Migration guide published

### Community
- [ ] Blog post published
- [ ] Demo videos uploaded
- [ ] Twitter thread posted
- [ ] HN post submitted
- [ ] Discord announcement

---

## Rollback Plan

If critical issues found:

1. **Tag current state**
   ```bash
   git tag pre-beta11-conversion
   git push origin pre-beta11-conversion
   ```

2. **Document issues**
   - Create GitHub issues
   - Notify Elide team
   - Update SHIMS.md

3. **Partial rollback**
   - Revert problematic showcases only
   - Keep working conversions
   - Update documentation

4. **Full rollback**
   ```bash
   git revert [commit-range]
   git push origin master
   ```

5. **Communicate**
   - Update blog post
   - Tweet status update
   - Update README

---

## Estimated Timeline

**Immediate (Day 1):**
- 1 hour: Install & verify
- 3 hours: Fix 7 broken showcases

**Short-term (Days 2-3):**
- 8 hours: Convert 40+ showcases
- 4 hours: Testing

**Medium-term (Week 1):**
- 8 hours: Full test suite
- 8 hours: Documentation
- 4 hours: Performance benchmarks

**Announcement (Week 2):**
- 4 hours: Blog post
- 4 hours: Demo videos
- 2 hours: Social media

**Total: ~50 hours (1-2 weeks with one person)**

---

## Ready to GO! 🚀

Just say the word when beta11 drops and we'll execute this plan!
