// Auto-generated from answers.md - DO NOT EDIT
// This file is server-side only and not exposed to web crawlers

export const answerKey = {
  "1": {
    "answer": "A,B,C,D",
    "explanation": "Elide supports JavaScript, TypeScript, Python 3.11, Java JDK 24, Kotlin K2 v2.2.21, Ruby, WebAssembly, and LLVM. (Source: elide help, README.md)"
  },
  "2": {
    "answer": "B",
    "explanation": "Elide is built on GraalVM v25.0.0 and Truffle. (Source: elide-core-knowledge.md, README.md)"
  },
  "3": {
    "answer": "B",
    "explanation": "False. Elide runs TypeScript directly with no build step. (Source: elide help typescript, GETTING_STARTED.md)"
  },
  "4": {
    "answer": "B",
    "explanation": "Zero-serialization cross-language calls with <1ms overhead. (Source: README.md, BETA11_MIGRATION_GUIDE.md)"
  },
  "5": {
    "answer": "C",
    "explanation": "Python 3.11 via GraalPy. (Source: elide help, elide-core-knowledge.md)"
  },
  "6": {
    "answer": "B",
    "explanation": "Single GC shared across all languages for zero cross-language GC overhead. (Source: README.md)"
  },
  "7": {
    "answer": "A",
    "explanation": "True. TSX/JSX work with .tsx/.jsx extensions, no build step. (Source: elide help typescript, react.md)"
  },
  "8": {
    "answer": "D",
    "explanation": "JDK 24. (Source: elide help jvm, elide-core-knowledge.md)"
  },
  "9": {
    "answer": "B",
    "explanation": "Kotlin K2 v2.2.21. (Source: elide help jvm, elide-core-knowledge.md)"
  },
  "10": {
    "answer": "A",
    "explanation": "True. Elide supports WebAssembly (WASM). (Source: elide-core-knowledge.md)"
  },
  "11": {
    "answer": "C",
    "explanation": "10x faster (~20ms vs ~200ms). (Source: README.md, GETTING_STARTED.md)"
  },
  "12": {
    "answer": "B",
    "explanation": "Runs TypeScript directly with no build step. (Source: elide help typescript)"
  },
  "13": {
    "answer": "A",
    "explanation": "True. `import module from \"./module.py\"` works. (Source: elide help polyglot, showcases)"
  },
  "14": {
    "answer": "A",
    "explanation": "Multiple programming languages in one runtime. (Source: elide help polyglot)"
  },
  "15": {
    "answer": "D",
    "explanation": "Both .tsx and .jsx trigger TSX/JSX processing. (Source: elide help typescript, react.md)"
  },
  "16": {
    "answer": "A",
    "explanation": "True. Unified GC across all languages. (Source: README.md)"
  },
  "17": {
    "answer": "C",
    "explanation": "~800K RPS on Linux. (Source: elide help servers, README.md)"
  },
  "18": {
    "answer": "B",
    "explanation": "TechEmpower. (Source: README.md, GETTING_STARTED.md)"
  },
  "19": {
    "answer": "B",
    "explanation": "False. Elide uses GraalVM, not V8. (Source: elide-core-knowledge.md)"
  },
  "20": {
    "answer": "B",
    "explanation": "No overhead when calling across languages (<1ms). (Source: README.md)"
  },
  "21": {
    "answer": "D",
    "explanation": "None - all modern JavaScript features are supported. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "22": {
    "answer": "A",
    "explanation": "True. LLVM is supported. (Source: elide-core-knowledge.md)"
  },
  "23": {
    "answer": "B",
    "explanation": "A language implementation framework. (Source: GraalVM docs, elide architecture)"
  },
  "24": {
    "answer": "B",
    "explanation": "React 18. React 19 not yet supported. (Source: elide help react)"
  },
  "25": {
    "answer": "A",
    "explanation": "True. Both ESM and CJS imports work. (Source: elide help typescript, nodeapi.md)"
  },
  "26": {
    "answer": "C",
    "explanation": "~20ms. (Source: README.md, GETTING_STARTED.md)"
  },
  "27": {
    "answer": "B",
    "explanation": "No V8 initialization overhead. (Source: README.md)"
  },
  "28": {
    "answer": "A",
    "explanation": "True. Elide can execute Java bytecode via GraalVM. (Source: elide help jvm)"
  },
  "29": {
    "answer": "C",
    "explanation": ".pkl (Pkl configuration language). (Source: elide help projects)"
  },
  "30": {
    "answer": "A,B,C",
    "explanation": "fs, path, buffer, stream, assert, zlib. Cluster is NOT supported. (Source: elide help nodeapi)"
  },
  "31": {
    "answer": "A",
    "explanation": "True. Kotlin coroutines are supported via kotlinx.coroutines. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)"
  },
  "32": {
    "answer": "B",
    "explanation": "Mixing languages in one application. (Source: elide help polyglot)"
  },
  "33": {
    "answer": "B",
    "explanation": "Instant compilation at runtime via GraalVM. (Source: elide help typescript)"
  },
  "34": {
    "answer": "A",
    "explanation": "True. Symbol is fully supported. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "35": {
    "answer": "B",
    "explanation": "No build step needed. (Source: elide help typescript)"
  },
  "36": {
    "answer": "A,B,C,D",
    "explanation": "All are supported: Map, Set, WeakMap, WeakSet. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "37": {
    "answer": "A",
    "explanation": "True. Optional chaining (?.) is supported. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "38": {
    "answer": "B",
    "explanation": "Faster cold starts and smaller binaries. (Source: GraalVM docs, elide help)"
  },
  "39": {
    "answer": "B",
    "explanation": "ES2020+ with modern features. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "40": {
    "answer": "A",
    "explanation": "True. BigInt is supported. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "41": {
    "answer": "B",
    "explanation": "`import module from './module.py'` - Standard ESM import syntax. (Source: elide help polyglot, showcases)"
  },
  "42": {
    "answer": "B",
    "explanation": "`import.meta.url.includes(\"script-name.ts\")` - Detects if running as script vs module. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "43": {
    "answer": "A,B,C,D",
    "explanation": "All are included: coroutines, datetime, serialization, html. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)"
  },
  "44": {
    "answer": "B",
    "explanation": "Returns Java array representation `[Ljava.lang.String;@...`. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "45": {
    "answer": "B",
    "explanation": "`kotlin { features { kotlinx = false } }` in elide.pkl. (Source: elide help projects, ELIDE_KNOWLEDGEBASE.md)"
  },
  "46": {
    "answer": "B",
    "explanation": "Python 3.11 with GraalPy. (Source: elide help, elide-core-knowledge.md)"
  },
  "47": {
    "answer": "D",
    "explanation": "Both A and B work. Prefer `node:` prefix for clarity. (Source: elide help nodeapi)"
  },
  "48": {
    "answer": "A,C",
    "explanation": "javac and jar. javadoc is available but not commonly embedded. (Source: elide help jvm)"
  },
  "49": {
    "answer": "B",
    "explanation": "Elide's root can be used as JAVA_HOME. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)"
  },
  "50": {
    "answer": "A",
    "explanation": "kotlinc. kapt and KSP are supported but separate. (Source: elide help jvm)"
  },
  "51": {
    "answer": "C",
    "explanation": "Compile-time type checking via GraalVM. (Source: elide help typescript)"
  },
  "52": {
    "answer": "B",
    "explanation": "Install react@18 and react-dom@18. (Source: elide help react)"
  },
  "53": {
    "answer": "C",
    "explanation": "React JSX only, other libraries not yet supported. (Source: elide help react)"
  },
  "54": {
    "answer": "B",
    "explanation": ".jsx or .tsx file extensions required. (Source: elide help react, typescript.md)"
  },
  "55": {
    "answer": "B",
    "explanation": "`elide run file.tsx` - Direct execution. (Source: elide help react)"
  },
  "56": {
    "answer": "B",
    "explanation": "Fully supported. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "57": {
    "answer": "B",
    "explanation": "Standard Promise API works. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "58": {
    "answer": "A,B,C,D",
    "explanation": "All modern JavaScript features are supported. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "59": {
    "answer": "B",
    "explanation": "<1ms overhead. (Source: README.md, BETA11_MIGRATION_GUIDE.md)"
  },
  "60": {
    "answer": "C",
    "explanation": "Erased at runtime (standard TypeScript behavior). (Source: TypeScript docs, elide behavior)"
  },
  "61": {
    "answer": "B",
    "explanation": "Full ES6+ class support with inheritance. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "62": {
    "answer": "B",
    "explanation": "Standard function* syntax works. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "63": {
    "answer": "B",
    "explanation": "Full iterator and generator support. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "64": {
    "answer": "B",
    "explanation": "Standard Symbol API works. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "65": {
    "answer": "A,B,C,D",
    "explanation": "All collection types supported. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "66": {
    "answer": "B",
    "explanation": "Standard Uint8Array, Int32Array, etc. work. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "67": {
    "answer": "B",
    "explanation": "Full regex with global, groups, etc. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "68": {
    "answer": "B",
    "explanation": "Full Unicode support. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "69": {
    "answer": "B",
    "explanation": "Full Math.* methods. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "70": {
    "answer": "B",
    "explanation": "Number.isFinite, Number.isInteger, etc. work. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "71": {
    "answer": "B",
    "explanation": "Object.keys, Object.values, Object.entries, Object.assign all work. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "72": {
    "answer": "B",
    "explanation": "Standard Object.defineProperty works. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "73": {
    "answer": "B",
    "explanation": "Fully supported in classes and objects. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "74": {
    "answer": "B",
    "explanation": "Full array API: map, filter, reduce, flat, etc. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "75": {
    "answer": "B",
    "explanation": "Full string API including template literals. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "76": {
    "answer": "B",
    "explanation": "Full bitwise support: <<, >>, &, |, ^. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "77": {
    "answer": "B",
    "explanation": "Standard parseFloat and parseInt work. (Source: ELIDE_KNOWLEDGEBASE.md)"
  },
  "78": {
    "answer": "C",
    "explanation": "GraalVM 25.x (specifically v25.0.0). (Source: elide-core-knowledge.md, README.md)"
  },
  "79": {
    "answer": "B",
    "explanation": "Node.js Buffer class available via node:buffer. (Source: elide help nodeapi)"
  },
  "80": {
    "answer": "B",
    "explanation": "Available as global function (Web Crypto API). (Source: Node.js compatibility, elide behavior)"
  },
  "81": {
    "answer": "B",
    "explanation": "Truffle language interoperability. (Source: GraalVM docs, elide architecture)"
  },
  "82": {
    "answer": "B",
    "explanation": "Can compile to native binaries with `elide native-image`. (Source: elide help, elide-advanced-techniques.md)"
  },
  "83": {
    "answer": "B",
    "explanation": "No cross-language GC overhead. (Source: README.md)"
  },
  "84": {
    "answer": "B",
    "explanation": "Types erased but checked at compile time. (Source: TypeScript behavior, GraalVM)"
  },
  "85": {
    "answer": "B",
    "explanation": "Supports both Node.js and ESM resolution. (Source: elide help typescript, nodeapi.md)"
  },
  "86": {
    "answer": "B",
    "explanation": "Elide is recognized as Oracle GraalVM instance at JDK 24. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)"
  },
  "87": {
    "answer": "B",
    "explanation": "Supports kapt and KSP. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)"
  },
  "88": {
    "answer": "B",
    "explanation": "Includes Kotlin Scripting compiler. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)"
  },
  "89": {
    "answer": "B",
    "explanation": "Elide's root can be used as KOTLIN_HOME. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)"
  },
  "90": {
    "answer": "B",
    "explanation": "Included in distribution with kotlinx.serialization and kotlinx.serialization.json. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)"
  },
  "91": {
    "answer": "B",
    "explanation": "kotlinx.html included in distribution. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)"
  },
  "92": {
    "answer": "B",
    "explanation": "Runtime compilation via GraalVM. (Source: elide help typescript, GraalVM architecture)"
  },
  "93": {
    "answer": "B",
    "explanation": "Experimental support. (Source: TypeScript/GraalVM limitations)"
  },
  "94": {
    "answer": "B",
    "explanation": "Generated for debugging. (Source: GraalVM behavior)"
  },
  "95": {
    "answer": "B",
    "explanation": "Faster cold start, similar warm performance. (Source: README.md, benchmarks)"
  },
  "96": {
    "answer": "B",
    "explanation": "Handled by Truffle. (Source: Truffle docs, GraalVM architecture)"
  },
  "97": {
    "answer": "B",
    "explanation": "Shared heap with unified GC. (Source: README.md, GraalVM architecture)"
  },
  "98": {
    "answer": "B",
    "explanation": "<1ms (zero-serialization). (Source: README.md, BETA11_MIGRATION_GUIDE.md)"
  },
  "99": {
    "answer": "B",
    "explanation": "No GIL in GraalPy. (Source: GraalPy docs, Python polyglot behavior)"
  },
  "100": {
    "answer": "B",
    "explanation": "Supports Chrome DevTools inspector. (Source: elide help, CLI options)"
  },
  "101": {
    "answer": "B",
    "explanation": "`elide run file.ts`"
  },
  "102": {
    "answer": "B",
    "explanation": "`elide serve file.ts`"
  },
  "103": {
    "answer": "B",
    "explanation": "`elide repl`"
  },
  "104": {
    "answer": "C",
    "explanation": "`elide init`"
  },
  "105": {
    "answer": "B",
    "explanation": "`elide install`"
  },
  "106": {
    "answer": "B",
    "explanation": "`elide add <package>`"
  },
  "107": {
    "answer": "C",
    "explanation": "`elide build`"
  },
  "108": {
    "answer": "B",
    "explanation": "`elide test`"
  },
  "109": {
    "answer": "D",
    "explanation": "All of the above: `-v`, `--version`, `version`"
  },
  "110": {
    "answer": "D",
    "explanation": "All of the above: `-h`, `--help`, `help`"
  },
  "111": {
    "answer": "A",
    "explanation": "`elide help servers`"
  },
  "112": {
    "answer": "B",
    "explanation": "`elide javac`"
  },
  "113": {
    "answer": "B",
    "explanation": "`elide kotlinc`"
  },
  "114": {
    "answer": "B",
    "explanation": "`elide jar`"
  },
  "115": {
    "answer": "B",
    "explanation": "`elide javadoc`"
  },
  "116": {
    "answer": "B",
    "explanation": "`elide native-image`"
  },
  "117": {
    "answer": "C",
    "explanation": "`elide jib`"
  },
  "118": {
    "answer": "B",
    "explanation": "`elide lsp`"
  },
  "119": {
    "answer": "B",
    "explanation": "`elide mcp`"
  },
  "120": {
    "answer": "B",
    "explanation": "`elide which esbuild`"
  },
  "121": {
    "answer": "B",
    "explanation": "`elide secrets`"
  },
  "122": {
    "answer": "A",
    "explanation": "`elide info`"
  },
  "123": {
    "answer": "B",
    "explanation": "`elide completions`"
  },
  "124": {
    "answer": "A",
    "explanation": "True. `elide run script.py` works."
  },
  "125": {
    "answer": "B",
    "explanation": "False. Default port is 8080, no flag required."
  },
  "126": {
    "answer": "B",
    "explanation": "8080 (Source: elide help servers)"
  },
  "127": {
    "answer": "A",
    "explanation": "True. `--coverage` flag available."
  },
  "128": {
    "answer": "B",
    "explanation": "False. Can build without explicit build file if tasks defined in elide.pkl."
  },
  "129": {
    "answer": "A",
    "explanation": "True. Interactive by default."
  },
  "130": {
    "answer": "A",
    "explanation": "True. Works with package.json, pyproject.toml, requirements.txt, etc."
  },
  "131": {
    "answer": "C",
    "explanation": "Both A and B work."
  },
  "132": {
    "answer": "B",
    "explanation": "`elide run --inspect file.ts`"
  },
  "133": {
    "answer": "B",
    "explanation": "`elide run --inspect:suspend file.ts`"
  },
  "134": {
    "answer": "A",
    "explanation": "`elide run --inspect:port=9229 file.ts`"
  },
  "135": {
    "answer": "D",
    "explanation": "Both B and C: `--debug` and `--verbose`"
  },
  "136": {
    "answer": "C",
    "explanation": "Both A and B: `-v` and `--verbose`"
  },
  "137": {
    "answer": "C",
    "explanation": "Both A and B: `-q` and `--quiet`"
  },
  "138": {
    "answer": "A",
    "explanation": "`elide run --no-telemetry file.ts`"
  },
  "139": {
    "answer": "B",
    "explanation": "`elide install --frozen`"
  },
  "140": {
    "answer": "B",
    "explanation": "`elide build --release`"
  },
  "141": {
    "answer": "B",
    "explanation": "`elide test --coverage --coverage-format=json`"
  },
  "142": {
    "answer": "B",
    "explanation": "`elide test --test-report=xml`"
  },
  "143": {
    "answer": "A",
    "explanation": "`elide test --coverage --coverage-format=json --test-report=xml`"
  },
  "144": {
    "answer": "B",
    "explanation": "`elide test --threaded --threads=4`"
  },
  "145": {
    "answer": "B",
    "explanation": "`elide run --host:allow-io file.ts`"
  },
  "146": {
    "answer": "B",
    "explanation": "`elide run --host:allow-io:read=/data file.ts`"
  },
  "147": {
    "answer": "B",
    "explanation": "`elide run --host:allow-io:write=/tmp file.ts`"
  },
  "148": {
    "answer": "B",
    "explanation": "`elide run --host:allow-io=/tmp,/data file.ts`"
  },
  "149": {
    "answer": "B",
    "explanation": "`elide run --host:allow-env file.ts`"
  },
  "150": {
    "answer": "B",
    "explanation": "`elide run --env:dotenv file.ts`"
  },
  "151": {
    "answer": "B",
    "explanation": "`elide install --lockfile-format=json`"
  },
  "152": {
    "answer": "B",
    "explanation": "`elide install --frozen --verify`"
  },
  "153": {
    "answer": "A",
    "explanation": "`elide build --dry`"
  },
  "154": {
    "answer": "A",
    "explanation": "`elide native-image -- -O3 -o myapp MyClass`"
  },
  "155": {
    "answer": "A",
    "explanation": "`elide native-image -- --no-fallback -o myapp MyClass`"
  },
  "156": {
    "answer": "A",
    "explanation": "`elide native-image -- --initialize-at-build-time -o myapp MyClass`"
  },
  "157": {
    "answer": "A",
    "explanation": "`elide native-image -- --pgo-instrument -o myapp MyClass`"
  },
  "158": {
    "answer": "A",
    "explanation": "`elide native-image -- --pgo=default.iprof -o myapp MyClass`"
  },
  "159": {
    "answer": "A",
    "explanation": "`elide jib build -- -t myapp:latest`"
  },
  "160": {
    "answer": "B",
    "explanation": "`elide secrets set API_KEY value`"
  },
  "161": {
    "answer": "B",
    "explanation": "`elide javac -- -d out src/*.java` - The `--` separator passes options to javac."
  },
  "162": {
    "answer": "B",
    "explanation": "`elide kotlinc -- -d out src/*.kt` - The `--` separator passes options to kotlinc."
  },
  "163": {
    "answer": "B",
    "explanation": "`elide native-image -- -O3 -o myapp MyClass` - The `--` separator passes options to native-image."
  },
  "164": {
    "answer": "D",
    "explanation": "Both A and B work for jib."
  },
  "165": {
    "answer": "B",
    "explanation": "`elide lsp --lsp:port=8080`"
  },
  "166": {
    "answer": "B",
    "explanation": "`elide lsp app.ts --lsp:port=8080`"
  },
  "167": {
    "answer": "B",
    "explanation": "Pass remaining args to underlying tool."
  },
  "168": {
    "answer": "A",
    "explanation": "`elide run --env A=1 --env B=2 file.ts` - Multiple `--env` flags."
  },
  "169": {
    "answer": "D",
    "explanation": "Both B and C: `elide run --wsgi app.py` or `elide serve --wsgi app.py`"
  },
  "170": {
    "answer": "D",
    "explanation": "Both A and C: `--port` flag or PORT environment variable."
  },
  "171": {
    "answer": "A",
    "explanation": "`elide run --host:allow-io:read=/data --host:allow-io:write=/tmp file.ts`"
  },
  "172": {
    "answer": "A",
    "explanation": "Not possible - all or nothing with `--no-telemetry`."
  },
  "173": {
    "answer": "B",
    "explanation": "`elide test --coverage --coverage-format=histogram`"
  },
  "174": {
    "answer": "D",
    "explanation": "Not supported directly; use shell piping."
  },
  "175": {
    "answer": "A",
    "explanation": "`elide test path/to/test.ts`"
  },
  "176": {
    "answer": "D",
    "explanation": "Not supported directly."
  },
  "177": {
    "answer": "A",
    "explanation": "`elide jib -- build -t myapp --to-username=user --to-password=pass`"
  },
  "178": {
    "answer": "A",
    "explanation": "`elide jib -- build --from=gcr.io/distroless/base -t myapp`"
  },
  "179": {
    "answer": "A",
    "explanation": "`elide jib -- build --app-root=/app -t myapp`"
  },
  "180": {
    "answer": "A",
    "explanation": "`elide jib -- build --entrypoint=/app/myapp -t myapp`"
  },
  "181": {
    "answer": "B",
    "explanation": "8080 (Source: elide help servers)"
  },
  "182": {
    "answer": "B",
    "explanation": "Netty + Micronaut (Source: elide help servers)"
  },
  "183": {
    "answer": "A",
    "explanation": "True"
  },
  "184": {
    "answer": "A",
    "explanation": "True"
  },
  "185": {
    "answer": "A",
    "explanation": "True"
  },
  "186": {
    "answer": "A",
    "explanation": "True"
  },
  "187": {
    "answer": "A,B",
    "explanation": "OpenSSL and BoringSSL (Source: elide help servers)"
  },
  "188": {
    "answer": "A",
    "explanation": "True. Non-blocking I/O by default."
  },
  "189": {
    "answer": "C",
    "explanation": "~800K RPS (Source: elide help servers, README.md)"
  },
  "190": {
    "answer": "A",
    "explanation": "True (Source: README.md)"
  },
  "191": {
    "answer": "C",
    "explanation": "beta11-rc1 (Source: BETA11_MIGRATION_GUIDE.md)"
  },
  "192": {
    "answer": "A",
    "explanation": "True (Source: BETA11_MIGRATION_GUIDE.md, elide-core-knowledge.md)"
  },
  "193": {
    "answer": "A",
    "explanation": "True (Source: BETA11_MIGRATION_GUIDE.md)"
  },
  "194": {
    "answer": "A,B,C",
    "explanation": "Fetch Handler, Node.js http.createServer, WSGI (Source: BETA11_MIGRATION_GUIDE.md)"
  },
  "195": {
    "answer": "B",
    "explanation": "False. No shim needed in beta11-rc1."
  },
  "196": {
    "answer": "B",
    "explanation": "Fetch Handler (declarative, modern) (Source: BETA11_MIGRATION_GUIDE.md)"
  },
  "197": {
    "answer": "A",
    "explanation": "True"
  },
  "198": {
    "answer": "A",
    "explanation": "True"
  },
  "199": {
    "answer": "A",
    "explanation": "True (Source: BETA11_MIGRATION_GUIDE.md)"
  },
  "200": {
    "answer": "A,B",
    "explanation": "Flask and Django (Source: BETA11_MIGRATION_GUIDE.md)"
  },
  "201": {
    "answer": "A",
    "explanation": "True (Source: BETA11_MIGRATION_GUIDE.md, flask-typescript-polyglot showcase)"
  },
  "202": {
    "answer": "B",
    "explanation": "`--wsgi` (Source: BETA11_MIGRATION_GUIDE.md)"
  },
  "203": {
    "answer": "A",
    "explanation": "True (Source: flask-typescript-polyglot showcase)"
  },
  "204": {
    "answer": "C",
    "explanation": "<1ms (Source: README.md)"
  },
  "205": {
    "answer": "A",
    "explanation": "True (streaming responses supported)"
  },
  "206": {
    "answer": "A",
    "explanation": "True"
  },
  "207": {
    "answer": "A",
    "explanation": "True"
  },
  "208": {
    "answer": "A",
    "explanation": "True"
  },
  "209": {
    "answer": "A",
    "explanation": "True"
  },
  "210": {
    "answer": "A",
    "explanation": "True"
  }
};
