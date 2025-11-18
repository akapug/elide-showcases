# Project Types & Sources

**Understanding what's what in this repository**

This document clarifies the different types of projects, their sources, and what they represent.

---

## 📦 Project Categories

### 1. **Conversions** (79 projects)

**What they are**: npm packages converted from Node.js to run on Elide

**Source**: Each is based on a real npm package from the JavaScript ecosystem

**Location**: `/converted/utilities/`

**Process**:
1. Start with popular npm package (documented download counts)
2. Strip out Node.js-specific dependencies
3. Inline any small dependencies to make it zero-dependency
4. Add TypeScript types if not already typed
5. Test on Elide runtime
6. Add comprehensive CLI demos

**Examples**:
- `uuid` - Based on https://www.npmjs.com/package/uuid (~15M downloads/week)
- `ms` - Based on https://www.npmjs.com/package/ms (~42M downloads/week)
- `validator` - Based on https://www.npmjs.com/package/validator (~9M downloads/week)
- `marked` - Based on https://www.npmjs.com/package/marked (~10M downloads/week)

**Honesty**: These are NOT original packages. They are adaptations/conversions of existing MIT-licensed npm packages, modified to:
- Work on Elide (remove Node.js-specific APIs)
- Be zero-dependency (inline dependencies)
- Have better demos (comprehensive CLI examples)

**Attribution**: Each conversion directory should reference the original package. We're working on adding/improving attribution in every README.

---

### 2. **Categories** (95 utilities)

**What they are**: Collections organized by type

**Location**: `/original/utilities/`

**Breakdown**:

#### a) **Algorithms** (31 files)
- **Source**: Classic computer science algorithms
- **Originality**: Implemented from scratch based on textbook algorithms
- **Examples**: Dijkstra's algorithm, QuickSort, AVL tree, Binary Search
- **Note**: These are NOT conversions - they're fresh TypeScript implementations of well-known algorithms

#### b) **CLI Tools** (20 files)
- **Source**: Mix of conversions and original implementations
- **Examples**:
  - `base64-codec.ts` - Original implementation of Base64 RFC 4648
  - `password-generator.ts` - Original secure password generator
  - `csv-parser.ts` - Inspired by common CSV libraries, custom implementation
  - `color-converter.ts` - Original color space conversion
- **Note**: Most are original implementations, some inspired by existing tools

#### c) **Data Processing** (16 files)
- **Source**: Mix of conversions and original utilities
- **Examples**: JSON processors, data validators, transformation utilities
- **Note**: Common patterns from multiple sources, adapted and combined

#### d) **Advanced TypeScript** (11 files)
- **Source**: Original examples demonstrating TypeScript features
- **Originality**: 100% original - these showcase Elide's TypeScript support
- **Examples**: Generics, decorators, advanced types

#### e) **Parsers** (8 files)
- **Source**: Mix of conversions and original implementations
- **Examples**: CSV, JSON, YAML, XML, INI, Markdown parsers
- **Note**: Parser implementations follow standard specifications (CSV RFC, JSON spec, etc.)

#### f) **Edge Computing** (5 files)
- **Source**: Original implementations for edge environments
- **Originality**: Custom-built for Elide edge deployment
- **Examples**: Edge routers, auth handlers, caching utilities

#### g) **Encoding** (5 files)
- **Source**: Original implementations of standard encoding schemes
- **Examples**: Base64 (RFC 4648), URL encoding, HTML entities, Hex
- **Note**: Based on published standards, not specific libraries

#### h) **HTTP** (5 files)
- **Source**: Original implementations following HTTP specs
- **Examples**: URL parser, query string, headers, cookies, MIME types
- **Note**: Follow W3C/IETF standards, not conversions

#### i) **Data Structures** (5 files)
- **Source**: Classic CS data structures, implemented from scratch
- **Examples**: Stack, Queue, LinkedList, Tree, Graph
- **Note**: Textbook implementations, not conversions

---

### 3. **Showcases** (18 projects)

**What they are**: Full-stack applications demonstrating Elide capabilities

**Source**: Original applications built specifically for this repository

**Location**: `/original/showcases/`

**Examples**:
- `nanochat-lite/` - Real-time chat application
- `cms-platform/` - Content management system
- More...

**Honesty**: These are ORIGINAL applications. They're not conversions - they're built from scratch to showcase what you can build with Elide.

**Status**: Many were added in recent sessions. **We haven't verified all of them work yet.** User testing needed!

---

### 4. **Applications** (4 standalone apps)

**What they are**: Standalone command-line applications

**Source**: Original applications

**Location**: `/original/utilities/`

**Files**:
- `markdown-cli.ts` - Markdown converter
- `json-formatter.ts` - JSON pretty-printer
- `code-generator.ts` - Code generation tool
- `markdown-converter.ts` - Another markdown tool

**Note**: Built specifically for this repository, not conversions

---

### 5. **Examples** (2 educational projects)

**What they are**: Educational examples for learning

**Source**: Original code written to teach patterns

**Location**: `/original/examples/`

**Projects**:
- `modern-typescript/` - TypeScript features showcase
- `real-world/` - Production-ready API example

**Note**: 100% original, created for educational purposes

---

## 🎯 What's Converted vs Original?

### Conversions from npm (79):
**All in `/converted/utilities/` directory**

Every project here is based on a real npm package:
- We list the original package name
- We note download counts to show popularity
- We link to npm package (or should - working on this!)
- We follow the original's MIT license (most npm packages are MIT)

**Clear about changes**:
- Removed Node.js-specific code
- Inlined dependencies
- Added TypeScript types
- Added comprehensive examples
- Some simplified APIs to work around Elide limitations

### Original Implementations (107):
**In `/original/utilities/`, `/original/showcases/`, `/original/examples/`**

- **Algorithms** (31) - Classic CS algorithms from textbooks
- **Data Structures** (5) - Standard CS data structures
- **CLI Tools** (20) - Mix of original and inspired-by
- **Showcases** (18) - Full original applications
- **Applications** (4) - Standalone original tools
- **Examples** (2) - Educational originals
- **Edge/Encoding/HTTP** (15) - Standard protocol implementations
- **Data Processing/Advanced/Parsers** (35) - Mix of original and standard implementations

---

## 📊 Total Breakdown

| Type | Count | Source | Verified Working? |
|------|-------|--------|------------------|
| **npm Conversions** | 79 | Based on real npm packages | ✅ Top 10 verified, rest need testing |
| **Algorithms** | 31 | Original implementations | ✅ Verified |
| **CLI Tools** | 20 | Mostly original | ⚠️ Need verification |
| **Data Processing** | 16 | Mix | ⚠️ Need verification |
| **Showcases** | 18 | Original full apps | ❌ **Not verified - needs testing!** |
| **Advanced TypeScript** | 11 | Original examples | ⚠️ Need verification |
| **Parsers** | 8 | Standard implementations | ⚠️ Need verification |
| **Edge** | 5 | Original | ⚠️ Need verification |
| **Encoding** | 5 | Standard implementations | ⚠️ Need verification |
| **HTTP** | 5 | Standard implementations | ⚠️ Need verification |
| **Data Structures** | 5 | Original implementations | ⚠️ Need verification |
| **Applications** | 4 | Original | ⚠️ Need verification |
| **Examples** | 2 | Original educational | ⚠️ Need verification |

**Total: 251 projects**

**Fully Verified: ~40 projects** (Top conversions + some algorithms)
**Need User Testing: ~211 projects** (Recent additions, showcases, utilities)

---

## 🚨 Honesty About Status

### What's Production-Ready:
✅ Top 10 polyglot showcases (uuid, ms, base64, validator, etc.)
✅ Core algorithms (tested and working)
✅ Documentation infrastructure

### What Needs Testing:
⚠️ Many CLI tools from recent sessions
⚠️ Data processing utilities
⚠️ Parsers and encoders
⚠️ HTTP utilities

### What's Completely Unverified:
❌ **18 showcases** - Added by previous agent, haven't been run yet
❌ Many category utilities
❌ Some advanced TypeScript examples

### Known to Not Work:
Some conversions have known limitations due to missing Elide APIs:
- Anything needing `crypto.createHash` (not yet implemented)
- Anything needing `URL.searchParams` (not yet implemented)
- Some HTTP server features (http.createServer being fixed)

See [docs/current/ELIDE_BUG_TRACKER.md](docs/current/ELIDE_BUG_TRACKER.md) for details.

---

## 🎯 User Expectations

### If you're trying a **Conversion** (`/converted/utilities/`):
1. Expect it to work MOSTLY like the npm version
2. Some features may be simplified (documented in README)
3. Top 10 are thoroughly tested, others less so
4. Check ELIDE_CONVERSION.md in each directory for details

### If you're trying a **Category utility** (`/original/utilities/`):
1. Many are new and lightly tested
2. Follow instructions in category README
3. Report issues if something doesn't work
4. Algorithms are most reliable, others vary

### If you're trying a **Showcase** (`/original/showcases/`):
1. **WARNING**: Most haven't been verified to work!
2. These are ambitious full-stack apps
3. May require features not yet in Elide
4. Consider them "aspirational" until tested
5. We'd LOVE help testing these!

### If you're trying **Examples** (`/original/examples/`):
1. Should work, but haven't been re-verified post-reorganization
2. Educational code, not production apps
3. Good starting point for learning

---

## 📜 Licenses & Attribution

### npm Conversions:
- Each is based on MIT-licensed npm package (we need to add LICENSE files)
- Original authors deserve credit
- We're working on improving attribution in every conversion

### Original Work:
- Original implementations are MIT licensed
- Algorithms are public domain (textbook algorithms)
- Standard protocol implementations (Base64, HTTP, etc.) based on public RFCs

### TODO:
- [ ] Add LICENSE file to each conversion (copy from original npm package)
- [ ] Add "Based on" links in each conversion README
- [ ] Improve attribution throughout
- [ ] Clarify which showcases work vs aspirational

---

## 🚀 What You Should Do

### As a User:
1. **Start with verified conversions** (Top 10 in main README)
2. **Test and report issues** for other projects
3. **Contribute fixes** if something doesn't work
4. **Share successes** when things DO work!

### As a Contributor:
1. **Read [CONTRIBUTING.md](CONTRIBUTING.md)**
2. **Always attribute sources** if converting from npm
3. **Test thoroughly** before submitting
4. **Document limitations** honestly
5. **Add verification instructions**

---

## ❓ Still Have Questions?

**"What's the difference between conversions, showcases, and applications?"**
- **Conversions**: npm packages adapted for Elide (based on existing code)
- **Showcases**: Full-stack apps built from scratch to demonstrate Elide
- **Applications**: Standalone CLI tools (original, not conversions)
- **Categories**: Organized utilities (mix of conversions and originals)

**"Can I trust the download counts?"**
- Yes! For conversions, they're from npmjs.com (as of late 2024)
- They represent the ORIGINAL package's popularity
- Shows why we chose to convert that package

**"How do I know if something will work?"**
- Check ✅ status in this document
- Read the project's README for known limitations
- Try it yourself and report back!
- See [GETTING_STARTED.md](GETTING_STARTED.md) for verification instructions

**"Why so many unverified projects?"**
- This repo has had 3 agent sessions contributing
- Recent sessions added MANY projects rapidly
- We're being honest: we don't know if everything works
- **We need YOUR help testing!**

---

**Bottom line: We're honest about what's what. Some projects are rock-solid and verified. Others are newer and need testing. We'd love your help making ALL 251 projects production-ready!**
