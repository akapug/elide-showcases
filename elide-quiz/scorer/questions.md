# Elide Expert Quiz - Questions

**Total Questions:** 500 (all multiple choice)
**Total Points:** 500 (1 point each)

Answer format:
- Multiple choice (one answer): Letter only (A, B, C, or D)
  - Example: `1. B`
- Multiple select (multiple answers): Comma-separated letters with NO SPACES
  - Example: `2. A,C,D`

**METADATA SURVEY (Required after your 500 answers):**
```
S1. [Tools available] (e.g., "web search, codebase search, CLI help")
S2. [Time in minutes] (e.g., "5")
S3. [Research strategy] (e.g., "Used CLI help and migration guide")
S4. [Model name] (e.g., "GPT-5 Pro")
S5. [Model version] (e.g., "2025-01-15")
S6. [Temperature] (e.g., "0.7")
S7. [Max tokens] (e.g., "4096")
```

---

## Runtime & Core (100 questions)

### Easy (40q)

1. Which languages does Elide support natively? (multiple select)
   A. JavaScript & TypeScript
   B. Python 3.11
   C. Java (JDK 24) & Kotlin (K2 v2.2.21)
   D. Ruby

2. What is Elide built on top of?
   A. V8 and Node.js
   B. GraalVM and Truffle
   C. JVM only
   D. LLVM only

3. True or False: Elide requires a separate build step for TypeScript.
   A. True
   B. False

4. What is the key benefit of Elide's polyglot interop?
   A. Requires JSON serialization
   B. Zero-serialization cross-language calls
   C. Only works with JavaScript
   D. Requires separate processes

5. Which Python version does Elide support?
   A. Python 2.7
   B. Python 3.8
   C. Python 3.11
   D. Python 3.13

6. What is Elide's unified garbage collector benefit?
   A. Each language has its own GC
   B. Single GC shared across all languages
   C. No garbage collection
   D. Manual memory management required

7. True or False: Elide can run TSX/JSX without a build step.
   A. True
   B. False

8. Which JDK version does Elide support?
   A. JDK 11
   B. JDK 17
   C. JDK 21
   D. JDK 24

9. Which Kotlin version does Elide support?
   A. Kotlin 1.9
   B. Kotlin K2 (v2.2.21)
   C. Kotlin 1.5
   D. Kotlin 3.0

10. True or False: Elide supports WebAssembly (WASM).
    A. True
    B. False

11. What is the approximate cold start performance of Elide vs Node.js?
    A. Same speed
    B. 2x faster
    C. 10x faster (~20ms vs ~200ms)
    D. 100x faster

12. Which statement about Elide's TypeScript support is correct?
    A. Requires tsc compilation first
    B. Runs TypeScript directly with no build step
    C. Only supports JavaScript
    D. Requires Babel

13. True or False: Elide can import Python modules from TypeScript.
    A. True
    B. False

14. What does "polyglot" mean in Elide's context?
    A. Multiple programming languages in one runtime
    B. Multiple databases
    C. Multiple servers
    D. Multiple operating systems

15. Which file extension triggers TSX processing in Elide?
    A. .ts
    B. .tsx
    C. .jsx
    D. Both B and C

16. True or False: Elide uses a single unified GC across all languages.
    A. True
    B. False

17. What is the performance benchmark for Elide on Linux (RPS)?
    A. ~10K RPS
    B. ~100K RPS
    C. ~800K RPS
    D. ~1M RPS

18. Which organization benchmarks Elide independently?
    A. Node.js Foundation
    B. TechEmpower
    C. Mozilla
    D. Google

19. True or False: Elide requires V8 initialization.
    A. True
    B. False

20. What is the primary benefit of zero-serialization interop?
    A. Slower performance
    B. No overhead when calling across languages
    C. Requires JSON conversion
    D. Only works with strings

21. Which language feature does Elide NOT support?
    A. async/await
    B. Generators
    C. Classes
    D. None - all are supported

22. True or False: Elide supports LLVM as a language target.
    A. True
    B. False

23. What is Truffle in Elide's architecture?
    A. A testing framework
    B. A language implementation framework
    C. A database
    D. A web server

24. Which React version does Elide support?
    A. React 19
    B. React 18
    C. React 17
    D. React 16

25. True or False: Elide supports both ESM and CJS imports.
    A. True
    B. False

26. What is the typical Elide cold start time?
    A. ~200ms
    B. ~100ms
    C. ~20ms
    D. ~1000ms

27. Which statement about Elide's memory usage is correct?
    A. Higher than Node.js
    B. No V8 initialization overhead
    C. Requires 2GB minimum
    D. Same as Node.js

28. True or False: Elide can execute Java bytecode.
    A. True
    B. False

29. What is the file extension for Elide project configuration?
    A. .json
    B. .yaml
    C. .pkl
    D. .toml

30. Which Node.js modules does Elide support? (multiple select)
    A. fs
    B. path
    C. buffer
    D. cluster

31. True or False: Elide supports Kotlin coroutines.
    A. True
    B. False

32. What is the primary use case for Elide's polyglot capabilities?
    A. Running multiple apps
    B. Mixing languages in one application
    C. Database connections
    D. Network protocols

33. Which statement about Elide's TypeScript compilation is correct?
    A. Uses tsc internally
    B. Instant compilation at runtime
    C. Requires webpack
    D. Pre-compilation required

34. True or False: Elide supports Symbol in JavaScript.
    A. True
    B. False

35. What is the benefit of Elide's instant TypeScript execution?
    A. Slower startup
    B. No build step needed
    C. Requires configuration
    D. Only works in production

36. Which data structures does Elide support? (multiple select)
    A. Map
    B. Set
    C. WeakMap
    D. WeakSet

37. True or False: Elide supports optional chaining (?.).
    A. True
    B. False

38. What is the primary advantage of GraalVM Native Image?
    A. Slower startup
    B. Faster cold starts and smaller binaries
    C. Requires JVM
    D. Only for Java

39. Which statement about Elide's JavaScript support is correct?
    A. ES5 only
    B. ES2020+ with modern features
    C. ES6 only
    D. Requires transpilation

40. True or False: Elide supports BigInt.
    A. True
    B. False

### Medium (40q)

41. How do you import a Python module in TypeScript with Elide?
    A. import py from 'python'
    B. import module from './module.py'
    C. require('python')
    D. Elide.import('module.py')

42. What is the correct way to detect CLI mode in Elide?
    A. process.argv.length > 2
    B. import.meta.url.includes("script-name.ts")
    C. process.env.CLI === 'true'
    D. Elide.isCLI()

43. Which KotlinX libraries are included with Elide? (multiple select)
    A. coroutines
    B. datetime
    C. serialization
    D. html

44. What is the quirk with process.argv in Elide?
    A. Not available
    B. Returns Java array representation
    C. Always empty
    D. Only works in Node mode

45. How do you disable KotlinX libraries in elide.pkl?
    A. kotlinx = false
    B. kotlin { features { kotlinx = false } }
    C. dependencies { kotlinx = false }
    D. Cannot disable

46. Which statement about Elide's Python support is correct?
    A. Full CPython compatibility
    B. Python 3.11 with GraalPy
    C. Python 2.7 only
    D. Requires virtualenv

47. What is the correct import syntax for Node.js modules in Elide?
    A. import fs from 'fs'
    B. import { readFileSync } from 'node:fs'
    C. require('fs')
    D. Both A and B work

48. Which Java tools does Elide embed? (multiple select)
    A. javac
    B. javadoc
    C. jar
    D. maven

49. What is the purpose of Elide's `JAVA_HOME` compatibility?
    A. Not supported
    B. Elide's root can be used as JAVA_HOME
    C. Requires separate JDK
    D. Only for Java 11

50. Which Kotlin tools does Elide embed? (multiple select)
    A. kotlinc
    B. kapt
    C. KSP
    D. gradle

51. How does Elide handle TypeScript type checking?
    A. No type checking
    B. Runtime type checking only
    C. Compile-time type checking
    D. Requires separate tsc run

52. What is the correct way to use React with Elide?
    A. Install react@19
    B. Install react@18 and react-dom@18
    C. Use built-in React
    D. Requires webpack

53. Which statement about Elide's JSX support is correct?
    A. Only React JSX
    B. Any JSX library
    C. React JSX only, other libraries not yet supported
    D. No JSX support

54. What is the file extension requirement for JSX in Elide?
    A. .js
    B. .jsx or .tsx
    C. .ts
    D. Any extension works

55. How do you run a TSX file with Elide?
    A. elide build then node
    B. elide run file.tsx
    C. tsc then elide
    D. Requires webpack

56. Which statement about Elide's async/await support is correct?
    A. Not supported
    B. Fully supported
    C. Only in TypeScript
    D. Requires polyfill

57. What is the correct way to use Promises in Elide?
    A. Not supported
    B. Standard Promise API works
    C. Requires library
    D. Only with async/await

58. Which modern JavaScript features does Elide support? (multiple select)
    A. Destructuring
    B. Spread operator
    C. Nullish coalescing (??)
    D. Private class fields

59. What is the performance characteristic of cross-language calls in Elide?
    A. ~100ms overhead
    B. <1ms overhead
    C. ~10ms overhead
    D. Requires serialization

60. How does Elide handle TypeScript generics?
    A. Not supported
    B. Fully supported with type safety
    C. Erased at runtime
    D. Requires explicit types

61. Which statement about Elide's class support is correct?
    A. ES5 classes only
    B. Full ES6+ class support with inheritance
    C. No class support
    D. Requires transpilation

62. What is the correct way to use generators in Elide?
    A. Not supported
    B. Standard function* syntax works
    C. Requires library
    D. Only in TypeScript

63. Which statement about Elide's iterator support is correct?
    A. Not supported
    B. Full iterator and generator support
    C. Only arrays
    D. Requires polyfill

64. How do you use Symbol in Elide?
    A. Not supported
    B. Standard Symbol API works
    C. Requires import
    D. Only in TypeScript

65. Which collection types does Elide support? (multiple select)
    A. Map
    B. Set
    C. WeakMap
    D. WeakSet

66. What is the correct way to use typed arrays in Elide?
    A. Not supported
    B. Standard Uint8Array, etc. work
    C. Requires library
    D. Only in Java mode

67. Which statement about Elide's regex support is correct?
    A. Limited regex
    B. Full regex with global, groups, etc.
    C. No regex
    D. Requires library

68. How does Elide handle Unicode strings?
    A. ASCII only
    B. Full Unicode support
    C. UTF-8 only
    D. Requires encoding library

69. Which statement about Elide's Math support is correct?
    A. Basic math only
    B. Full Math.* methods
    C. No Math object
    D. Requires library

70. What is the correct way to use Number methods in Elide?
    A. Not supported
    B. Number.isFinite, Number.isInteger, etc. work
    C. Requires polyfill
    D. Only parseInt/parseFloat

71. Which statement about Elide's Object methods is correct?
    A. Limited support
    B. Object.keys, Object.values, Object.entries, Object.assign all work
    C. No Object methods
    D. Requires library

72. How do you use property descriptors in Elide?
    A. Not supported
    B. Standard Object.defineProperty works
    C. Requires library
    D. Only in strict mode

73. Which statement about Elide's getter/setter support is correct?
    A. Not supported
    B. Fully supported in classes and objects
    C. Only in classes
    D. Requires transpilation

74. What is the correct way to use Array methods in Elide?
    A. Limited to basic methods
    B. Full array API: map, filter, reduce, flat, etc.
    C. No array methods
    D. Requires library

75. Which statement about Elide's string methods is correct?
    A. ES5 only
    B. Full string API including template literals
    C. No string methods
    D. Requires polyfill

76. How does Elide handle bitwise operations?
    A. Not supported
    B. Full bitwise support: <<, >>, &, |, ^
    C. Only AND/OR
    D. Requires library

77. Which statement about Elide's parseFloat/parseInt is correct?
    A. Not supported
    B. Standard parseFloat and parseInt work
    C. Requires Number constructor
    D. Only in strict mode

78. What is the GraalVM version used by Elide beta11-rc1?
    A. GraalVM 23.x
    B. GraalVM 24.x
    C. GraalVM 25.x
    D. GraalVM 22.x

79. Which statement about Elide's Buffer support is correct?
    A. Not supported
    B. Node.js Buffer class available via node:buffer
    C. Only in Java mode
    D. Requires library

80. How do you access crypto.randomUUID() in Elide?
    A. Not supported
    B. Available as global function
    C. Requires node:crypto import
    D. Only in secure contexts

### Hard (20q)

81. What is the internal mechanism Elide uses for polyglot interop?
    A. JSON-RPC
    B. Truffle language interoperability
    C. JNI
    D. HTTP calls

82. Which statement about Elide's GraalVM Native Image support is correct?
    A. Not supported
    B. Can compile to native binaries with elide native-image
    C. Only for Java code
    D. Requires separate GraalVM installation

83. What is the performance implication of Elide's unified GC?
    A. Slower than separate GCs
    B. No cross-language GC overhead
    C. Requires manual tuning
    D. Only works for JavaScript

84. How does Elide handle TypeScript type erasure?
    A. Types preserved at runtime
    B. Types erased but checked at compile time
    C. No type checking
    D. Requires separate type checker

85. Which statement about Elide's module resolution is correct?
    A. Node.js only
    B. Supports both Node.js and ESM resolution
    C. ESM only
    D. Custom resolution only

86. What is the relationship between Elide and Oracle GraalVM?
    A. Unrelated
    B. Elide is recognized as Oracle GraalVM instance at JDK 24
    C. Elide replaces GraalVM
    D. Requires separate GraalVM

87. How does Elide handle Kotlin annotation processing?
    A. Not supported
    B. Supports kapt and KSP
    C. Only kapt
    D. Requires separate compiler

88. Which statement about Elide's Kotlin scripting support is correct?
    A. Not supported
    B. Includes Kotlin Scripting compiler
    C. Only compiled Kotlin
    D. Requires separate tool

89. What is the purpose of Elide's `KOTLIN_HOME` compatibility?
    A. Not supported
    B. Elide's root can be used as KOTLIN_HOME
    C. Requires separate Kotlin
    D. Only for Kotlin 1.x

90. How does Elide handle KotlinX serialization?
    A. Not supported
    B. Included in distribution with kotlinx.serialization and kotlinx.serialization.json
    C. Requires separate dependency
    D. Only JSON

91. Which statement about Elide's Kotlin HTML support is correct?
    A. Not supported
    B. kotlinx.html included in distribution
    C. Requires separate library
    D. Only for server-side

92. What is the mechanism for Elide's instant TypeScript compilation?
    A. tsc in background
    B. Runtime compilation via GraalVM
    C. Pre-compilation required
    D. Babel transpilation

93. How does Elide handle TypeScript decorators?
    A. Not supported
    B. Experimental support
    C. Full support
    D. Requires flag

94. Which statement about Elide's source map support is correct?
    A. Not supported
    B. Generated for debugging
    C. Only in dev mode
    D. Requires configuration

95. What is the performance characteristic of Elide's TypeScript execution vs tsc+Node?
    A. Slower
    B. Faster cold start, similar warm performance
    C. Same speed
    D. Slower cold start

96. How does Elide handle circular dependencies in polyglot imports?
    A. Not supported
    B. Handled by Truffle
    C. Causes errors
    D. Requires manual resolution

97. Which statement about Elide's memory model for polyglot is correct?
    A. Separate heaps per language
    B. Shared heap with unified GC
    C. Manual memory management
    D. Copy-on-write

98. What is the overhead of calling Java from TypeScript in Elide?
    A. ~100ms
    B. <1ms (zero-serialization)
    C. ~10ms
    D. Requires IPC

99. How does Elide handle Python GIL (Global Interpreter Lock)?
    A. Standard GIL applies
    B. No GIL in GraalPy
    C. Requires threading library
    D. Not applicable

100. Which statement about Elide's performance profiling is correct?
     A. Not supported
     B. Supports Chrome DevTools inspector
     C. Only JVM profilers
     D. Requires external tools

---

## CLI Commands (80 questions)

### Easy (30q)

101. What command runs a TypeScript file with Elide?
     A. elide execute file.ts
     B. elide run file.ts
     C. elide start file.ts
     D. elide file.ts

102. What command starts an HTTP server with Elide?
     A. elide server file.ts
     B. elide serve file.ts
     C. elide http file.ts
     D. elide start file.ts

103. What command starts the Elide REPL?
     A. elide shell
     B. elide repl
     C. elide console
     D. elide interactive

104. What command initializes a new Elide project?
     A. elide new
     B. elide create
     C. elide init
     D. elide start

105. What command installs project dependencies?
     A. elide deps
     B. elide install
     C. elide add
     D. elide get

106. What command adds a new dependency to a project?
     A. elide install <package>
     B. elide add <package>
     C. elide dep <package>
     D. elide get <package>

107. What command builds an Elide project?
     A. elide compile
     B. elide make
     C. elide build
     D. elide package

108. What command runs tests in an Elide project?
     A. elide check
     B. elide test
     C. elide spec
     D. elide verify

109. What command shows Elide version?
     A. elide -v
     B. elide --version
     C. elide version
     D. All of the above

110. What command shows general Elide help?
     A. elide -h
     B. elide --help
     C. elide help
     D. All of the above

111. What command shows help for a specific topic (e.g., servers)?
     A. elide help servers
     B. elide --help servers
     C. elide servers --help
     D. elide docs servers

112. What command compiles Java code with Elide?
     A. elide java
     B. elide javac
     C. elide compile-java
     D. elide jdk

113. What command compiles Kotlin code with Elide?
     A. elide kotlin
     B. elide kotlinc
     C. elide compile-kotlin
     D. elide kt

114. What command creates a JAR file with Elide?
     A. elide package
     B. elide jar
     C. elide archive
     D. elide bundle

115. What command generates Javadoc with Elide?
     A. elide docs
     B. elide javadoc
     C. elide doc-gen
     D. elide jdoc

116. What command builds a native image with Elide?
     A. elide compile --native
     B. elide native-image
     C. elide build-native
     D. elide image

117. What command builds a container image with Elide?
     A. elide docker
     B. elide container
     C. elide jib
     D. elide image

118. What command starts the Language Server Protocol server?
     A. elide language-server
     B. elide lsp
     C. elide ls
     D. elide langserver

119. What command starts the Model Context Protocol server?
     A. elide model
     B. elide mcp
     C. elide context
     D. elide protocol

120. What command finds a tool's path (e.g., esbuild)?
     A. elide find esbuild
     B. elide which esbuild
     C. elide where esbuild
     D. elide locate esbuild

121. What command manages secrets?
     A. elide env
     B. elide secrets
     C. elide vault
     D. elide config

122. What command shows project information?
     A. elide info
     B. elide project
     C. elide show
     D. elide status

123. What command generates shell completions?
     A. elide complete
     B. elide completions
     C. elide autocomplete
     D. elide shell-complete

124. True or False: elide run can execute Python files.
     A. True
     B. False

125. True or False: elide serve requires a port flag.
     A. True
     B. False

126. What is the default port for elide serve?
     A. 3000
     B. 8080
     C. 8000
     D. 5000

127. True or False: elide test supports coverage reporting.
     A. True
     B. False

128. True or False: elide build requires a build file.
     A. True
     B. False

129. True or False: elide init is interactive by default.
     A. True
     B. False

130. True or False: elide install works with package.json.
     A. True
     B. False

### Medium (30q)

131. How do you run a server with environment variables?
     A. elide serve --env API_KEY=xyz server.ts
     B. API_KEY=xyz elide serve server.ts
     C. Both A and B
     D. elide serve server.ts --env=API_KEY=xyz

132. How do you enable the Chrome DevTools inspector?
     A. elide run --debug file.ts
     B. elide run --inspect file.ts
     C. elide run --devtools file.ts
     D. elide run --chrome file.ts

133. How do you suspend execution until debugger attaches?
     A. elide run --inspect:wait file.ts
     B. elide run --inspect:suspend file.ts
     C. elide run --debug:wait file.ts
     D. elide run --pause file.ts

134. How do you set a custom inspector port?
     A. elide run --inspect:port=9229 file.ts
     B. elide run --inspect --port=9229 file.ts
     C. elide run --debug-port=9229 file.ts
     D. elide run --inspect=9229 file.ts

135. How do you enable debug logging?
     A. elide run --log=debug file.ts
     B. elide run --debug file.ts
     C. elide run --verbose file.ts
     D. Both B and C

136. How do you enable verbose output?
     A. elide run -v file.ts
     B. elide run --verbose file.ts
     C. Both A and B
     D. elide run --debug file.ts

137. How do you suppress output (quiet mode)?
     A. elide run -q file.ts
     B. elide run --quiet file.ts
     C. Both A and B
     D. elide run --silent file.ts

138. How do you disable telemetry?
     A. elide run --no-telemetry file.ts
     B. elide run --telemetry=false file.ts
     C. elide run --private file.ts
     D. Both A and B

139. How do you use a frozen lockfile (reproducible builds)?
     A. elide install --lock
     B. elide install --frozen
     C. elide install --immutable
     D. elide install --exact

140. How do you build in release mode?
     A. elide build --prod
     B. elide build --release
     C. elide build --optimize
     D. elide build --production

141. How do you run tests with JSON coverage report?
     A. elide test --coverage --format=json
     B. elide test --coverage --coverage-format=json
     C. elide test --json-coverage
     D. elide test --coverage=json

142. How do you run tests with XML test report?
     A. elide test --report=xml
     B. elide test --test-report=xml
     C. elide test --xml
     D. elide test --format=xml

143. How do you run tests with both coverage and test report?
     A. elide test --coverage --coverage-format=json --test-report=xml
     B. elide test --all-reports
     C. elide test --full-report
     D. Not possible in one command

144. How do you run tests with threading (experimental)?
     A. elide test --parallel
     B. elide test --threaded --threads=4
     C. elide test -j4
     D. elide test --workers=4

145. How do you grant file I/O permissions broadly?
     A. elide run --allow-io file.ts
     B. elide run --host:allow-io file.ts
     C. elide run --fs:all file.ts
     D. elide run --io file.ts

146. How do you grant read-only I/O for /data?
     A. elide run --host:allow-io=/data:ro file.ts
     B. elide run --host:allow-io:read=/data file.ts
     C. elide run --read=/data file.ts
     D. elide run --io:read=/data file.ts

147. How do you grant write-only I/O for /tmp?
     A. elide run --host:allow-io=/tmp:wo file.ts
     B. elide run --host:allow-io:write=/tmp file.ts
     C. elide run --write=/tmp file.ts
     D. elide run --io:write=/tmp file.ts

148. How do you grant I/O for multiple paths?
     A. elide run --host:allow-io=/tmp --host:allow-io=/data file.ts
     B. elide run --host:allow-io=/tmp,/data file.ts
     C. elide run --host:allow-io=/tmp:/data file.ts
     D. Both A and B

149. How do you allow environment variable access?
     A. elide run --allow-env file.ts
     B. elide run --host:allow-env file.ts
     C. elide run --env:allow file.ts
     D. elide run --permit-env file.ts

150. How do you use a dotenv file?
     A. elide run --dotenv file.ts
     B. elide run --env:dotenv file.ts
     C. elide run --load-env file.ts
     D. elide run --env-file file.ts

151. How do you set the lockfile format to JSON?
     A. elide install --format=json
     B. elide install --lockfile-format=json
     C. elide install --json-lock
     D. elide install --lock=json

152. How do you verify lockfile integrity?
     A. elide install --check
     B. elide install --frozen --verify
     C. elide install --validate
     D. elide install --integrity

153. How do you perform a dry run of a build?
     A. elide build --dry
     B. elide build --dry-run
     C. elide build --simulate
     D. elide build --test

154. How do you compile a native image with optimization?
     A. elide native-image -- -O3 -o myapp MyClass
     B. elide native-image --optimize -o myapp MyClass
     C. elide native-image -O3 myapp MyClass
     D. elide native-image --release myapp MyClass

155. How do you build a native image with no fallback?
     A. elide native-image -- --no-fallback -o myapp MyClass
     B. elide native-image --strict -o myapp MyClass
     C. elide native-image --native-only myapp MyClass
     D. elide native-image --no-jvm myapp MyClass

156. How do you build a native image with build-time initialization?
     A. elide native-image -- --initialize-at-build-time -o myapp MyClass
     B. elide native-image --init-build -o myapp MyClass
     C. elide native-image --build-init myapp MyClass
     D. elide native-image --early-init myapp MyClass

157. How do you enable PGO (Profile-Guided Optimization) instrumentation?
     A. elide native-image -- --pgo-instrument -o myapp MyClass
     B. elide native-image --profile -o myapp MyClass
     C. elide native-image --instrument myapp MyClass
     D. elide native-image --pgo myapp MyClass

158. How do you build with an existing PGO profile?
     A. elide native-image -- --pgo=default.iprof -o myapp MyClass
     B. elide native-image --profile=default.iprof myapp MyClass
     C. elide native-image --use-profile myapp MyClass
     D. elide native-image --pgo-file=default.iprof myapp MyClass

159. How do you build a container with a specific tag?
     A. elide jib build -- -t myapp:latest
     B. elide jib -- build -t myapp:latest
     C. elide jib --tag=myapp:latest
     D. Both A and B

160. How do you set secrets from CLI?
     A. elide secrets add API_KEY value
     B. elide secrets set API_KEY value
     C. elide secrets create API_KEY value
     D. elide secrets put API_KEY value

### Hard (20q)

161. What is the correct syntax to pass options to javac via Elide?
     A. elide javac -d out src/*.java
     B. elide javac -- -d out src/*.java
     C. elide javac --options="-d out" src/*.java
     D. elide javac --javac-opts="-d out" src/*.java

162. What is the correct syntax to pass options to kotlinc via Elide?
     A. elide kotlinc -d out src/*.kt
     B. elide kotlinc -- -d out src/*.kt
     C. elide kotlinc --options="-d out" src/*.kt
     D. elide kotlinc --kotlinc-opts="-d out" src/*.kt

163. What is the correct syntax to pass options to native-image via Elide?
     A. elide native-image -O3 -o myapp MyClass
     B. elide native-image -- -O3 -o myapp MyClass
     C. elide native-image --options="-O3" myapp MyClass
     D. elide native-image --native-opts="-O3" myapp MyClass

164. What is the correct syntax to pass options to jib via Elide?
     A. elide jib build -t myapp:latest
     B. elide jib -- build -t myapp:latest
     C. elide jib --options="build -t myapp:latest"
     D. Both A and B

165. How do you start LSP on a custom port?
     A. elide lsp --port=8080
     B. elide lsp --lsp:port=8080
     C. elide lsp -p 8080
     D. elide lsp --listen=8080

166. How do you start LSP with a specific file?
     A. elide lsp --file=app.ts
     B. elide lsp app.ts --lsp:port=8080
     C. elide lsp --target=app.ts
     D. elide lsp --entry=app.ts

167. What is the purpose of the -- separator in Elide commands?
     A. End of options
     B. Pass remaining args to underlying tool
     C. Comment separator
     D. Not used

168. How do you combine multiple environment variables in one command?
     A. elide run --env A=1 --env B=2 file.ts
     B. elide run --env A=1,B=2 file.ts
     C. elide run --env="A=1 B=2" file.ts
     D. Both A and B

169. What is the correct way to run a Python WSGI app with Elide?
     A. elide run app.py
     B. elide run --wsgi app.py
     C. elide serve --wsgi app.py
     D. Both B and C

170. How do you specify a custom port for WSGI?
     A. elide run --wsgi --port=5000 app.py
     B. elide run --wsgi app.py --port=5000
     C. Set PORT environment variable
     D. Both A and C

171. What is the correct way to run with multiple I/O permission types?
     A. elide run --host:allow-io:read=/data --host:allow-io:write=/tmp file.ts
     B. elide run --host:allow-io=/data:r,/tmp:w file.ts
     C. elide run --io:read=/data --io:write=/tmp file.ts
     D. Both A and B

172. How do you disable specific telemetry while keeping others?
     A. Not possible - all or nothing
     B. elide run --no-telemetry=analytics file.ts
     C. elide run --telemetry:disable=analytics file.ts
     D. Use environment variable

173. What is the correct way to run tests with histogram coverage?
     A. elide test --coverage --histogram
     B. elide test --coverage --coverage-format=histogram
     C. elide test --coverage:histogram
     D. elide test --hist-coverage

174. How do you limit test output to specific number of lines?
     A. elide test --lines=100
     B. elide test --limit=100
     C. elide test | head -100
     D. Not supported

175. What is the correct way to run a specific test file?
     A. elide test path/to/test.ts
     B. elide test --file=path/to/test.ts
     C. elide run path/to/test.ts
     D. Both A and C

176. How do you pass custom flags to the underlying runtime?
     A. elide run --runtime-flags="--flag" file.ts
     B. elide run --vm-options="--flag" file.ts
     C. elide run -- --flag file.ts
     D. Not supported

177. What is the correct way to build a container with authentication?
     A. elide jib -- build -t myapp --to-username=user --to-password=pass
     B. elide jib build --auth=user:pass -t myapp
     C. elide jib --credentials=user:pass build -t myapp
     D. Set environment variables

178. How do you specify a custom base image for jib?
     A. elide jib -- build --from=gcr.io/distroless/base -t myapp
     B. elide jib build --base=gcr.io/distroless/base -t myapp
     C. elide jib --from-image=gcr.io/distroless/base build -t myapp
     D. In elide.pkl only

179. What is the correct way to set app root in jib container?
     A. elide jib -- build --app-root=/app -t myapp
     B. elide jib build --root=/app -t myapp
     C. elide jib --app-dir=/app build -t myapp
     D. In elide.pkl only

180. How do you set a custom entrypoint in jib container?
     A. elide jib -- build --entrypoint=/app/myapp -t myapp
     B. elide jib build --entry=/app/myapp -t myapp
     C. elide jib --cmd=/app/myapp build -t myapp
     D. In elide.pkl only

---

## HTTP & Servers (80 questions)

### Easy (30q)

181. What is the default HTTP server port in Elide?
     A. 3000
     B. 8080
     C. 8000
     D. 5000

182. Which HTTP server stack does Elide use?
     A. Express + Node
     B. Netty + Micronaut
     C. Tomcat
     D. Undertow

183. True or False: Elide supports HTTP/2.
     A. True
     B. False

184. True or False: Elide supports HTTP/3.
     A. True
     B. False

185. True or False: Elide supports WebSockets.
     A. True
     B. False

186. True or False: Elide supports TLS/HTTPS.
     A. True
     B. False

187. Which TLS implementations does Elide support? (multiple select)
     A. OpenSSL
     B. BoringSSL
     C. LibreSSL
     D. Java TLS

188. True or False: Elide uses non-blocking I/O by default.
     A. True
     B. False

189. What is Elide's approximate RPS on Linux?
     A. ~10K RPS
     B. ~100K RPS
     C. ~800K RPS
     D. ~1M RPS

190. True or False: Elide is benchmarked by TechEmpower.
     A. True
     B. False

191. Which beta version introduced native HTTP support?
     A. beta9
     B. beta10
     C. beta11-rc1
     D. beta12

192. True or False: Beta10 had broken HTTP serving.
     A. True
     B. False

193. True or False: Beta11-rc1 fixed HTTP serving.
     A. True
     B. False

194. Which HTTP patterns does beta11-rc1 support? (multiple select)
     A. Fetch Handler
     B. Node.js http.createServer
     C. WSGI
     D. Express middleware

195. True or False: Beta11-rc1 requires the elide/http/server shim.
     A. True
     B. False

196. What is the recommended HTTP pattern in beta11-rc1?
     A. Express
     B. Fetch Handler
     C. Node.js http
     D. WSGI

197. True or False: Fetch Handler is declarative.
     A. True
     B. False

198. True or False: Node.js http.createServer is imperative.
     A. True
     B. False

199. True or False: WSGI support is new in beta11-rc1.
     A. True
     B. False

200. Which Python frameworks work with Elide's WSGI support? (multiple select)
     A. Flask
     B. Django
     C. FastAPI
     D. Tornado

201. True or False: Elide can run Flask apps natively.
     A. True
     B. False

202. What flag enables WSGI mode?
     A. --python
     B. --wsgi
     C. --flask
     D. --web

203. True or False: Elide supports polyglot Flask + TypeScript.
     A. True
     B. False

204. What is the cross-language call overhead in Elide?
     A. ~100ms
     B. ~10ms
     C. <1ms
     D. ~1s

205. True or False: Elide supports Server-Sent Events (SSE).
     A. True
     B. False

206. True or False: Elide supports streaming responses.
     A. True
     B. False

207. True or False: Elide supports content negotiation.
     A. True
     B. False

208. True or False: Elide supports ETags.
     A. True
     B. False

209. True or False: Elide supports build-time compression (Brotli/Gzip).
     A. True
     B. False

210. True or False: Elide can serve static files.
     A. True
     B. False

### Medium (30q)

211. Write the minimal Fetch Handler pattern for beta11-rc1.

212. Write the minimal Node.js http.createServer pattern for beta11-rc1.

213. How do you return JSON in a Fetch Handler?

214. How do you parse request body in a Fetch Handler?

215. How do you get the request URL in a Fetch Handler?

216. How do you set response headers in a Fetch Handler?

217. How do you return a 404 in a Fetch Handler?

218. How do you handle POST requests in a Fetch Handler?

219. How do you create a streaming response in a Fetch Handler?

220. How do you run a Flask app with Elide?

221. What is the default Flask port with Elide?

222. How do you test a Flask health endpoint with curl?

223. How do you combine Flask (Python) with TypeScript orchestration?

224. What was the old beta10 HTTP pattern that's now deprecated?

225. What import statement is removed in beta11-rc1 migration?

226. How do you wrap console.log in Fetch Handler to avoid module evaluation issues?

227. What is the performance improvement of beta11-rc1 native HTTP vs beta10 shim?

228. How many showcases were converted to beta11-rc1 native HTTP?

229. Which showcase demonstrates Flask + TypeScript polyglot?

230. What is the key benefit of Elide's WSGI support?

231. How do you handle request body in Node.js http.createServer?

232. How do you set status code in Node.js http.createServer?

233. How do you listen on a custom port in Node.js http.createServer?

234. What is the difference between Fetch Handler and Node.js http patterns?

235. Which pattern gives more control: Fetch Handler or Node.js http?

236. Which pattern is more concise: Fetch Handler or Node.js http?

237. How do you enable TLS in Elide server?

238. How do you configure TLS cert and key in elide.pkl?

239. What is the benefit of Elide's native HTTP vs shims?

240. What is the memory overhead reduction in beta11-rc1 vs beta10?

### Hard (20q)

241. Explain the migration path from beta10 elide/http/server shim to beta11-rc1 Fetch Handler.

242. What is the internal HTTP server implementation in Elide?

243. How does Elide achieve 800K RPS on Linux?

244. What is the role of Netty in Elide's HTTP stack?

245. What is the role of Micronaut in Elide's HTTP stack?

246. How does Elide handle HTTP/2 protocol negotiation?

247. What is ALPN and how does Elide use it?

248. How does Elide support HTTP/3?

249. What is h2c and does Elide support it?

250. How does Elide's WSGI implementation achieve zero-serialization overhead?

251. What is the performance characteristic of Python-TypeScript calls in Elide?

252. How do you implement a polyglot service with Flask backend and TypeScript frontend?

253. What is the limitation of running multiple concurrent servers in Elide?

254. How does Elide handle WebSocket connections?

255. What is the status of WebSocket support in beta11-rc1?

256. How do you implement Server-Sent Events in Elide?

257. What is the benefit of ReadableStream for large responses?

258. How do you implement backpressure in Elide streaming responses?

259. What is the chunked transfer encoding support in Elide?

260. How do you configure HTTP/2 push in Elide?

---

## Projects & Dependencies (60 questions)

### Easy (20q)

261. What file defines an Elide project?
     A. project.json
     B. elide.pkl
     C. elide.yaml
     D. config.toml

262. What language is elide.pkl written in?
     A. JSON
     B. YAML
     C. Pkl (Apple's configuration language)
     D. TOML

263. True or False: elide.pkl can declare npm dependencies.
     A. True
     B. False

264. True or False: elide.pkl can declare Maven dependencies.
     A. True
     B. False

265. True or False: elide.pkl can declare PyPI dependencies.
     A. True
     B. False

266. Which dependency ecosystems does Elide support? (multiple select)
     A. npm
     B. Maven
     C. PyPI
     D. Rubygems

267. True or False: Elide can use existing package.json.
     A. True
     B. False

268. True or False: Elide can use existing pyproject.toml.
     A. True
     B. False

269. True or False: Elide can use existing requirements.txt.
     A. True
     B. False

270. What is the default lockfile format in Elide?
     A. JSON
     B. Binary (.lock.bin)
     C. YAML
     D. Text

271. Where are Elide lockfiles stored by default?
     A. ./elide.lock
     B. ./.dev/elide.lock.bin
     C. ./lock/
     D. ./node_modules/

272. True or False: Elide lockfiles are machine-specific.
     A. True
     B. False

273. True or False: Elide can read package-lock.json.
     A. True
     B. False

274. What command creates a new Elide project interactively?
     A. elide new
     B. elide init
     C. elide create
     D. elide start

275. What is the first line of an elide.pkl file?
     A. import "elide:project.pkl"
     B. amends "elide:project.pkl"
     C. extends "elide:project.pkl"
     D. include "elide:project.pkl"

276. True or False: Elide projects can have scripts.
     A. True
     B. False

277. True or False: Elide projects can have tasks.
     A. True
     B. False

278. True or False: Elide projects can have workspaces.
     A. True
     B. False

279. What command shows project information?
     A. elide info
     B. elide project
     C. elide show
     D. elide status

280. True or False: Dependencies are installed automatically when needed.
     A. True
     B. False

### Medium (25q)

281. Write the elide.pkl syntax to add React 18 as an npm dependency.

282. Write the elide.pkl syntax to add TypeScript as a dev dependency.

283. Write the elide.pkl syntax to add Guava as a Maven dependency.

284. Write the elide.pkl syntax to add requests as a PyPI dependency.

285. Write the elide.pkl syntax to define a "dev" script that runs elide serve.

286. Write the elide.pkl syntax to define a "build" task.

287. How do you set the project name and version in elide.pkl?

288. How do you configure the lockfile format to JSON in elide.pkl?

289. How do you disable KotlinX libraries in elide.pkl?

290. How do you set Kotlin language level in elide.pkl?

291. How do you configure TLS cert and key in elide.pkl?

292. How do you add multiple npm packages in one block?

293. How do you add both regular and dev npm packages?

294. How do you specify a specific npm package version?

295. How do you specify a Maven package with group:artifact format?

296. What is stored in Elide's lockfile? (multiple select)
     A. Foreign lockfiles (package-lock.json, etc.)
     B. Dependency manifests (package.json, pom.xml)
     C. Dependency inputs (JARs, etc.)
     D. Source code

297. How do you switch lockfile format from binary to JSON?

298. How do you verify lockfile integrity during install?

299. What is the benefit of binary lockfiles over JSON?

300. What is the benefit of JSON lockfiles over binary?

301. How do you run a script defined in elide.pkl?

302. How do you run a script defined in package.json?

303. What is the difference between scripts and tasks in Elide?

304. How do you declare a workspace in elide.pkl?

305. What repositories does Elide use for Maven packages?

### Hard (15q)

306. Explain the relationship between elide.pkl and package.json in a project.

307. How does Elide resolve dependencies across multiple ecosystems?

308. What is the purpose of the "dev root" (./.dev)?

309. How does Elide handle transitive dependencies?

310. What is the fingerprinting mechanism in Elide lockfiles?

311. How does Elide ensure lockfile portability across machines?

312. What happens when you mix elide.pkl and package.json dependencies?

313. How does Elide handle version conflicts between ecosystems?

314. What is the role of foreign lockfiles in Elide's lockfile?

315. How do you configure custom Maven repositories in elide.pkl?

316. How do you configure custom npm registries in elide.pkl?

317. What is the precedence order when Elide finds multiple manifests?

318. How does Elide handle monorepo/workspace configurations?

319. What is the caching strategy for Elide dependencies?

320. How do you force a dependency reinstall in Elide?

---

## Polyglot (50 questions)

### Easy (15q)

321. True or False: Elide can import Python from TypeScript.
     A. True
     B. False

322. True or False: Elide can import Java from TypeScript.
     A. True
     B. False

323. True or False: Elide can import Kotlin from TypeScript.
     A. True
     B. False

324. What is the overhead of cross-language calls in Elide?
     A. ~100ms
     B. ~10ms
     C. <1ms
     D. ~1s

325. True or False: Elide requires serialization for cross-language calls.
     A. True
     B. False

326. What is the mechanism for Elide's polyglot interop?
     A. JSON-RPC
     B. Truffle language interoperability
     C. JNI
     D. HTTP

327. True or False: Elide uses a shared heap for all languages.
     A. True
     B. False

328. True or False: Elide uses a unified GC for all languages.
     A. True
     B. False

329. What is the file extension for Python modules in Elide?
     A. .py
     B. .python
     C. .pyx
     D. .pyc

330. What is the file extension for Java classes in Elide?
     A. .java
     B. .class
     C. .jar
     D. Both A and B

331. What is the file extension for Kotlin files in Elide?
     A. .kt
     B. .kotlin
     C. .kts
     D. Both A and C

332. True or False: Elide supports Ruby polyglot (in examples).
     A. True
     B. False

333. True or False: Elide polyglot works across processes.
     A. True
     B. False

334. True or False: Elide polyglot works in the same process.
     A. True
     B. False

335. What is the key benefit of Elide's polyglot approach?
     A. Separate processes
     B. Zero-serialization, same-process calls
     C. HTTP-based communication
     D. File-based IPC

### Medium (20q)

336. Write the TypeScript syntax to import a Python module named "math.py".

337. Write the TypeScript syntax to call a Python function "add(5, 3)" from imported module.

338. How do you import a Java class in TypeScript with Elide?

339. How do you import a Kotlin class in TypeScript with Elide?

340. What is the syntax for importing with the node: prefix?

341. Why is the node: prefix recommended for Node.js modules?

342. How do you handle Python GIL in Elide?

343. What is GraalPy and how does it relate to Elide?

344. How do you pass objects between TypeScript and Python in Elide?

345. How do you pass objects between TypeScript and Java in Elide?

346. What types can be shared across languages in Elide? (multiple select)
     A. Primitives (numbers, strings, booleans)
     B. Objects
     C. Functions
     D. Classes

347. How does Elide handle type conversions between languages?

348. What is the performance characteristic of passing large objects across languages?

349. How do you handle errors thrown in Python from TypeScript?

350. How do you handle errors thrown in Java from TypeScript?

351. What is the memory model for polyglot objects in Elide?

352. How does Elide handle circular references in polyglot calls?

353. What is the role of Truffle in polyglot interop?

354. How do you debug polyglot code in Elide?

355. What is the limitation of polyglot imports in beta11-rc1?

### Hard (15q)

356. Explain how Elide achieves zero-serialization polyglot interop.

357. What is the role of GraalVM's Truffle framework in Elide's polyglot support?

358. How does Elide's unified GC handle objects from different languages?

359. What is the performance implication of shared heap vs separate heaps?

360. How does Elide handle language-specific features (e.g., Python decorators) in polyglot context?

361. What is the mechanism for calling Java methods from TypeScript in Elide?

362. How does Elide handle Java generics in polyglot calls?

363. How does Elide handle Kotlin coroutines in polyglot calls?

364. What is the threading model for polyglot code in Elide?

365. How does Elide handle Python async/await in polyglot context?

366. What is the limitation of WebAssembly polyglot in Elide?

367. How do you optimize polyglot call performance in Elide?

368. What is the role of language contexts in Elide's polyglot runtime?

369. How does Elide handle polyglot security and sandboxing?

370. What is the future roadmap for Elide's polyglot capabilities?

---

## Testing & Build (40 questions)

### Easy (15q)

371. What command runs tests in Elide?
     A. elide check
     B. elide test
     C. elide spec
     D. elide verify

372. True or False: Elide supports code coverage.
     A. True
     B. False

373. True or False: Elide can generate coverage reports.
     A. True
     B. False

374. What coverage formats does Elide support? (multiple select)
     A. JSON
     B. XML
     C. HTML
     D. Histogram

375. True or False: Elide can generate test reports.
     A. True
     B. False

376. What test report format does Elide support?
     A. JSON
     B. XML
     C. HTML
     D. Markdown

377. True or False: Elide supports threaded testing.
     A. True
     B. False

378. What is the status of threaded testing in Elide?
     A. Stable
     B. Experimental
     C. Not supported
     D. Deprecated

379. True or False: Elide can build native images.
     A. True
     B. False

380. What tool does Elide use for native image compilation?
     A. LLVM
     B. GraalVM Native Image
     C. GCC
     D. Clang

381. True or False: Elide can build container images.
     A. True
     B. False

382. What tool does Elide use for container building?
     A. Docker
     B. Podman
     C. Jib
     D. Buildah

383. True or False: Elide supports build tasks.
     A. True
     B. False

384. True or False: Elide supports dry-run builds.
     A. True
     B. False

385. What is the benefit of native image compilation?
     A. Slower startup
     B. Faster cold starts and smaller binaries
     C. Requires JVM
     D. Only for Java

### Medium (15q)

386. How do you run tests with JSON coverage report?

387. How do you run tests with XML test report?

388. How do you run tests with both coverage and test report?

389. How do you run tests with histogram coverage?

390. How do you enable threaded testing with 4 threads?

391. How do you build a native image with optimization level 3?

392. How do you build a native image with no fallback mode?

393. How do you build a native image with build-time initialization?

394. How do you enable PGO instrumentation for native image?

395. How do you build a native image with an existing PGO profile?

396. How do you build a container image with tag "myapp:latest"?

397. How do you build a container with custom base image?

398. How do you build a container with custom app root?

399. How do you build a container with custom entrypoint?

400. How do you perform a dry-run build?

### Hard (10q)

401. Explain the PGO (Profile-Guided Optimization) workflow in Elide.

402. What is the benefit of --no-fallback in native image compilation?

403. What is the benefit of --initialize-at-build-time in native image?

404. How does Jib differ from Docker for container building?

405. What is the performance improvement of native image vs JVM?

406. How does Elide handle reachability metadata for native image?

407. What is the role of Jacoco in Elide's testing?

408. How do you configure custom build tasks in elide.pkl?

409. What is the caching strategy for Elide builds?

410. How do you optimize native image size in Elide?

---

## Beta11 Features (50 questions)

### Easy (20q)

411. What is the major feature of beta11-rc1?
     A. Python support
     B. Native HTTP server support
     C. WebAssembly
     D. GraphQL

412. True or False: Beta11-rc1 eliminates the need for HTTP shims.
     A. True
     B. False

413. What was the old HTTP shim import in beta10?
     A. import { serve } from "elide/http"
     B. import { serve } from "elide/http/server"
     C. import { createServer } from "http"
     D. import { Server } from "elide"

414. True or False: Beta11-rc1 supports Node.js http.createServer API.
     A. True
     B. False

415. True or False: Beta11-rc1 supports Fetch Handler pattern.
     A. True
     B. False

416. True or False: Beta11-rc1 supports WSGI.
     A. True
     B. False

417. Which HTTP patterns are available in beta11-rc1? (multiple select)
     A. Fetch Handler
     B. Node.js http.createServer
     C. WSGI
     D. Express middleware

418. What is the recommended pattern for new projects in beta11-rc1?
     A. Express
     B. Fetch Handler
     C. Node.js http
     D. WSGI

419. True or False: Fetch Handler is declarative.
     A. True
     B. False

420. True or False: Node.js http.createServer is imperative.
     A. True
     B. False

421. What flag enables WSGI mode in beta11-rc1?
     A. --python
     B. --wsgi
     C. --flask
     D. --web

422. True or False: Beta11-rc1 supports Flask natively.
     A. True
     B. False

423. True or False: Beta11-rc1 supports Django natively.
     A. True
     B. False

424. How many showcases were converted to beta11-rc1?
     A. 10
     B. 15
     C. 22
     D. 30

425. What is the cold start improvement in beta11-rc1 vs beta10?
     A. 10% faster
     B. 20% faster
     C. 50% faster
     D. Same speed

426. What is the memory overhead reduction in beta11-rc1 vs beta10?
     A. 0MB
     B. 5MB
     C. 10MB
     D. 20MB

427. What is the throughput improvement in beta11-rc1 vs beta10?
     A. 10% higher
     B. 20% higher
     C. 50% higher
     D. Same

428. True or False: Beta11-rc1 supports polyglot Flask + TypeScript.
     A. True
     B. False

429. What showcase demonstrates Flask + TypeScript polyglot?
     A. llm-inference-server
     B. flask-typescript-polyglot
     C. service-mesh
     D. whisper-transcription

430. True or False: Beta11-rc1 requires code changes from beta10.
     A. True
     B. False

### Medium (20q)

431. Write the beta11-rc1 Fetch Handler pattern (minimal example).

432. Write the beta11-rc1 Node.js http.createServer pattern (minimal example).

433. What import statement do you remove when migrating from beta10 to beta11-rc1?

434. How do you wrap console.log in Fetch Handler to avoid module evaluation issues?

435. How do you return JSON in beta11-rc1 Fetch Handler?

436. How do you parse request body in beta11-rc1 Fetch Handler?

437. How do you handle POST requests in beta11-rc1 Fetch Handler?

438. How do you return a 404 in beta11-rc1 Fetch Handler?

439. How do you set custom headers in beta11-rc1 Fetch Handler?

440. How do you create a streaming response in beta11-rc1 Fetch Handler?

441. How do you run a Flask app with beta11-rc1?

442. What is the default Flask port in beta11-rc1?

443. How do you test a Flask health endpoint with curl in beta11-rc1?

444. How do you combine Flask (Python) with TypeScript in beta11-rc1?

445. What is the migration checklist for beta10 to beta11-rc1? (list steps)

446. What is the performance comparison table for beta10 vs beta11-rc1?

447. What is the key benefit of native HTTP in beta11-rc1?

448. What is the memory benefit of native HTTP in beta11-rc1?

449. What is the throughput benefit of native HTTP in beta11-rc1?

450. What is the WSGI benefit in beta11-rc1?

### Hard (10q)

451. Explain the internal HTTP implementation change from beta10 to beta11-rc1.

452. How does beta11-rc1 achieve native HTTP without shims?

453. What is the role of Netty in beta11-rc1 HTTP?

454. What is the role of Micronaut in beta11-rc1 HTTP?

455. How does beta11-rc1 WSGI achieve zero-serialization overhead?

456. What is the polyglot architecture in flask-typescript-polyglot showcase?

457. How do you implement a production-ready polyglot service in beta11-rc1?

458. What are the limitations of beta11-rc1 HTTP compared to full Node.js?

459. What is the roadmap for HTTP features beyond beta11-rc1?

460. How do you optimize HTTP performance in beta11-rc1?

---

## Advanced Topics (40 questions)

### Performance (15q)

461. What is Elide's cold start time vs Node.js?
     A. Same
     B. 2x faster
     C. 10x faster
     D. 100x faster

462. What is Elide's RPS on Linux with native transports?
     A. ~100K
     B. ~500K
     C. ~800K
     D. ~1M

463. True or False: Elide is benchmarked by TechEmpower.
     A. True
     B. False

464. What is the memory overhead of Elide vs Node.js?
     A. Higher
     B. Lower (no V8 initialization)
     C. Same
     D. Depends on workload

465. What is the benefit of GraalVM Native Image for cold starts?
     A. Slower
     B. Faster (no JVM warmup)
     C. Same
     D. Requires warmup

466. What is PGO and how does it improve performance?

467. How do you enable PGO in Elide native image builds?

468. What is the performance benefit of PGO?

469. How do you optimize TypeScript execution in Elide?

470. How do you optimize polyglot calls in Elide?

471. What is the caching strategy for Elide dependencies?

472. How do you optimize build times in Elide?

473. What is the benefit of binary lockfiles for performance?

474. How do you profile Elide applications?

475. What tools are available for Elide performance analysis?

### Security (10q)

476. How do you grant file I/O permissions in Elide?

477. How do you restrict I/O to specific paths in Elide?

478. How do you grant read-only I/O in Elide?

479. How do you grant write-only I/O in Elide?

480. How do you manage secrets in Elide?

481. How do you access secrets in Elide code?

482. What is the security model for polyglot code in Elide?

483. How do you sandbox untrusted code in Elide?

484. What is the role of host permissions in Elide?

485. How do you configure TLS for secure HTTP in Elide?

### Edge Cases & Troubleshooting (15q)

486. What is the quirk with process.argv in Elide?

487. How do you detect CLI mode in Elide?

488. What is the workaround for interactive CLI prompts in Elide?

489. What is the status of fs write operations in Elide?

490. What is the status of EventEmitter in Elide?

491. What is the status of package.json "exports" in Elide?

492. What is the status of Python polyglot in Elide?

493. How do you handle circular dependencies in Elide?

494. How do you debug Elide applications?

495. How do you use Chrome DevTools with Elide?

496. What is the inspector protocol support in Elide?

497. How do you handle errors in polyglot calls?

498. What is the fallback strategy for unsupported Node.js APIs?

499. How do you report bugs in Elide?

500. Where do you find Elide documentation and help?

---

**End of Questions**

Total: 500 questions (all multiple choice)
- **Total possible points: 500** (1 point each)

Scoring:
- Pass: 350+ (70%)
- Expert: 425+ (85%)
- Master: 475+ (95%)


