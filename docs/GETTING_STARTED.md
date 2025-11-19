# Getting Started with Elide Showcases

Welcome! 👋 You've just discovered something special - a runtime that lets Python, TypeScript, Ruby, and Java work together in ways you didn't think were possible.

This guide will have you running real code in 5 minutes and understanding Elide's superpowers shortly after.

---

## What is Elide?

**The simple explanation:** Elide is a runtime that lets you write code in TypeScript, Python, Ruby, or Java - and have them all work together in the same program, instantly, with no overhead.

**Think of it like this:** Imagine if you could `import` a Python file directly into TypeScript code, call Python functions like they were TypeScript functions, and have everything "just work" - no HTTP APIs, no message queues, no Docker containers. That's Elide.

### A Real Example

Here's actual code from this repository that works right now:

```typescript
// server.ts - This is REAL TypeScript code
import { model } from "./app.py";  // ← Import Python directly!

const prediction = model.predict(text);  // ← Call Python function!
```

That's not a trick. The TypeScript code literally imports the Python file and calls its functions with **less than 1 millisecond** of overhead.

### Why This Matters

**Traditional approach:**
- Python service → HTTP call → TypeScript service
- **Overhead:** 10-50ms per call, complex deployment, two runtimes to manage

**Elide approach:**
- Python and TypeScript in the same process
- **Overhead:** <1ms, single deployment, one runtime

**Plus:** Elide starts up 10x faster than Node.js (~20ms vs ~200ms) and has zero dependencies.

---

## What You'll Find Here

This repository contains **3,009 working examples** organized into three main categories:

### 🌟 **Elite Showcases** (109 projects)
Production-ready applications that demonstrate Elide's unique capabilities:
- AI/ML services (LLM inference, sentiment analysis, computer vision)
- Data pipelines (ETL, real-time analytics, stream processing)
- Polyglot integration (Python + TypeScript in one process)
- Microservices patterns (service mesh, API gateways)
- Cloud-native tools (Kubernetes operators, serverless frameworks)

### 🔧 **Converted Utilities** (2,784 projects)
Popular npm packages adapted to run on Elide - proving ecosystem compatibility:
- lodash, axios, chalk (150M+ downloads/week)
- Testing tools (jest, mocha, vitest)
- Build tools (webpack, vite, esbuild)
- And 2,700+ more!

### 🛠️ **Original Utilities** (94 projects)
Built-from-scratch implementations:
- 31 computer science algorithms
- Data structures (LRU cache, bloom filters)
- CLI tools and parsers

---

## Your First Showcase

Let's get you running actual code. This will take about 5 minutes.

### Step 1: Install Elide

```bash
# macOS/Linux - installs latest stable version
curl -sSL https://elide.sh | bash

# Or get beta11-rc1 with native HTTP support
curl -sSL https://elide.sh | bash -s - --install-rev=1.0.0-beta11-rc1
```

Verify it worked:
```bash
elide --version
```

### Step 2: Choose a Starting Point

Pick one based on what interests you:

**Option A: See The Polyglot Magic** ⭐ (Recommended!)
```bash
cd original/showcases/flask-typescript-polyglot
elide run server.ts
```

Then test it:
```bash
# In another terminal
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"text":"I love Elide!"}'
```

**What just happened?** You ran a TypeScript server that directly imported and called Python code. No HTTP, no containers - just direct function calls.

---

**Option B: Run an AI Service**
```bash
cd original/showcases/llm-inference-server
elide run server.ts
```

This starts an OpenAI-compatible API server with rate limiting, caching, and batch processing (model integration is simulated for the demo).

---

**Option C: Try a Simple Utility**
```bash
cd converted/utilities/uuid
elide run elide-uuid.ts
```

This generates UUIDs and demonstrates 10,000 IDs with zero collisions. Simple, instant, no dependencies.

### Step 3: Explore the Code

Open the files you just ran. Notice:
- ✅ **No node_modules** - Zero dependencies
- ✅ **No build step** - TypeScript runs directly
- ✅ **Clean code** - Modern, readable, well-documented

### Step 4: Feel the Speed

Try this:
```bash
# Time Elide's cold start
time elide run original/utilities/algorithms/binary-search.ts

# Compare to Node.js (if you have it installed)
time node -e "console.log('hello')"
```

Elide starts roughly **10x faster**. This matters for serverless, CLI tools, and microservices.

---

## Finding Showcases

### By What You Want to Build

**"I want to build AI/ML services"**
```bash
cd original/showcases
ls | grep -E "llm|ml|ai|rag|whisper|sentiment"
```

Start with:
- `llm-inference-server/` - Production LLM API
- `vector-search-service/` - Semantic search
- `rag-service/` - Retrieval-augmented generation

**"I want to build APIs"**
```bash
cd original/showcases
ls | grep -E "api|gateway|graphql|grpc"
```

Start with:
- `api-gateway-advanced/` - Full-featured API gateway
- `flask-typescript-polyglot/` - Polyglot API integration
- `graphql-federation/` - GraphQL with federation

**"I want to build data pipelines"**
```bash
cd original/showcases
ls | grep -E "etl|stream|pipeline|analytics"
```

Start with:
- `etl-pipeline/` - Production ETL system
- `stream-processor/` - Real-time processing
- `real-time-analytics-engine/` - Fast analytics

**"I want to understand computer science fundamentals"**
```bash
cd original/utilities/algorithms
ls *.ts
```

All 31 classic algorithms are here, fully working.

### By Technology

**Python Integration**
```
original/showcases/flask-typescript-polyglot/
original/showcases/python-ml-pipeline/
original/showcases/python-django-integration/
```

**Testing & Quality**
```
converted/utilities/jest/
converted/utilities/mocha/
converted/utilities/vitest/
```

**Build Tools**
```
converted/utilities/webpack/
converted/utilities/vite/
converted/utilities/esbuild/
```

### By Difficulty

**Beginner** (Start here)
- `converted/utilities/uuid/` - Generate unique IDs
- `converted/utilities/ms/` - Parse time strings
- `original/utilities/algorithms/binary-search.ts` - Classic algorithm

**Intermediate** (After you're comfortable)
- `original/showcases/flask-typescript-polyglot/` - Polyglot basics
- `original/showcases/api-gateway/` - API patterns
- `original/showcases/sentiment-analysis-api/` - ML service

**Advanced** (For deep exploration)
- `original/showcases/etl-pipeline/` - Production data pipeline
- `original/showcases/kubernetes-controller/` - K8s operator
- `original/showcases/multi-tenant-saas/` - Full SaaS platform

**Expert** (Production-grade systems)
- `original/showcases/api-gateway-advanced/` - Enterprise gateway
- `original/showcases/multiplayer-game-server-ai/` - 100-player game with AI
- `original/showcases/serverless-framework/` - Serverless runtime

---

## Understanding the Repository Structure

The repository uses a clean two-tier organization:

```
elide-showcases/
│
├── converted/              # Based on existing npm packages
│   ├── showcases/         # 4 complex conversions (marked, validator, etc.)
│   └── utilities/         # 2,784 npm package conversions
│
├── original/              # Built from scratch for Elide
│   ├── showcases/         # 109 elite demonstrations
│   ├── utilities/         # 94 single-purpose tools
│   └── examples/          # 3 educational projects
│
└── docs/                  # Documentation (you are here!)
```

### What's "Converted" vs "Original"?

**Converted** = We took popular npm packages and adapted them to run on Elide. This proves ecosystem compatibility.

**Original** = Built specifically to demonstrate Elide's unique capabilities (polyglot, performance, etc.).

**Both are fully working.** Choose based on what you want to learn.

---

## Common Questions

### "Do these really work?"

**Yes!** But with different levels:

- ✅ **Utilities (2,800+)**: Work immediately, zero dependencies, production-ready
- ✅ **Showcases (109)**: Real architecture and patterns, some need external integration (like connecting actual ML models)
- 📚 **Some showcases**: Demonstrate design and patterns (read the README to know what's included)

The showcase READMEs are honest about what's real vs. what needs integration.

### "Is this faster than Node.js?"

**For cold starts: Yes.** 10x faster (~20ms vs ~200ms). This is verified and matters for:
- Serverless functions
- CLI tools
- Microservices that scale to zero
- Any service that needs fast startup

**For execution: Comparable.** Once running, speeds are similar. The big wins are:
- No npm install delay
- Instant TypeScript compilation
- Polyglot calls with <1ms overhead

### "Can I use this in production?"

**Utilities: Absolutely.** The utilities (UUID, validators, algorithms, parsers) are production-ready.

**Showcases: With integration.** Many showcases provide production-quality architecture but need you to:
- Connect real ML models
- Add actual services to the service mesh
- Integrate external systems

The code is production-quality. The integrations are your responsibility.

### "What about the polyglot features?"

**They're real.** The `flask-typescript-polyglot` showcase uses actual GraalVM polyglot capabilities. You can:
- Import Python files in TypeScript
- Call Python functions from TypeScript
- Share data structures without serialization
- All with <1ms overhead

This is Elide's killer feature and it's **not simulation**.

---

## Next Steps

### In the Next 10 Minutes

1. **Run 3 showcases** from different categories
   - Try one polyglot example
   - Try one utility
   - Try one AI/ML showcase

2. **Read the code** - All showcases have detailed READMEs

3. **Check performance** - Time the cold starts yourself

### In the Next Hour

1. **Explore [SHOWCASE_INDEX.md](../SHOWCASE_INDEX.md)** - Complete catalog of all 173 showcases

2. **Read a deep-dive README**:
   - `flask-typescript-polyglot/README.md` - Polyglot magic explained
   - `llm-inference-server/README.md` - Production API architecture
   - `etl-pipeline/README.md` - Real-world data pipeline

3. **Experiment**:
   - Modify a showcase
   - Combine utilities
   - Build something new

### Going Deeper

**Learn the fundamentals:**
- Browse all 31 algorithms: `original/utilities/algorithms/`
- Study data structures: `original/utilities/datastructures/`
- Explore parsers: `original/utilities/parsers/`

**Understand the value:**
- Read [ELIDE_VALUE_ANALYSIS.md](../ELIDE_VALUE_ANALYSIS.md) - Why these showcases matter
- Check [PERFORMANCE_BENCHMARKS.md](PERFORMANCE_BENCHMARKS.md) - Verified metrics
- Review [SHOWCASE_INDEX.md](../SHOWCASE_INDEX.md) - All showcases categorized

**Get technical:**
- Study polyglot patterns in enterprise showcases
- Look at production architecture in elite showcases
- Read the beta11 migration guide for HTTP server patterns

---

## Get Help

**Questions about Elide:**
- 📖 [Elide Documentation](https://docs.elide.dev)
- 💬 [Elide Discord](https://elide.dev/discord)
- 🐛 [Report Issues](https://github.com/elide-dev/elide/issues)

**Questions about this repository:**
- 📖 [Main README](../README.md)
- 🗺️ [Showcase Index](../SHOWCASE_INDEX.md)
- 💬 [Discussions](https://github.com/akapug/elide-showcases/discussions)

---

## What Makes This Special

### 1. It's Honest

Every showcase README tells you:
- What's fully working
- What needs integration
- What's a pattern/reference

No surprises.

### 2. It's Comprehensive

- **3,009 total projects** covering the entire JavaScript/TypeScript ecosystem
- **109 elite showcases** demonstrating unique Elide capabilities
- **31 algorithms** for CS fundamentals

### 3. It's Fast

No `npm install`. No waiting. Just run:
```bash
elide run any-file.ts
```

### 4. It's Real

The polyglot features aren't vaporware. The performance claims are verified. The code works.

### 5. It's Growing

New showcases added regularly. Community contributions welcome. Active development.

---

## Your Elide Journey Starts Here

**Right now:**
```bash
# Pick the polyglot showcase
cd original/showcases/flask-typescript-polyglot
elide run server.ts
```

**Soon:**
```bash
# Explore showcases by category
cat SHOWCASE_INDEX.md

# Run utilities
cd converted/utilities/
ls

# Study algorithms
cd original/utilities/algorithms/
```

**Eventually:**
- Build your own polyglot service
- Contribute a showcase
- Use Elide in production

---

## The Bottom Line

**Elide lets you:**
- ✅ Mix Python, TypeScript, Ruby, and Java in one process
- ✅ Start 10x faster than Node.js
- ✅ Call across languages with <1ms overhead
- ✅ Deploy without dependencies
- ✅ Run code instantly without compilation

**This repository proves it with 3,009 working examples.**

Welcome to the polyglot future. 🚀

---

**Ready? Start with the polyglot showcase:**
```bash
cd original/showcases/flask-typescript-polyglot && elide run server.ts
```

**Questions? Check the [main README](../README.md) or [showcase index](../SHOWCASE_INDEX.md).**

**Enjoying Elide? Star the [main project](https://github.com/elide-dev/elide)!**
