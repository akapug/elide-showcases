# Elide Expert Quiz - Human Edition

**Total Questions:** 50 (all multiple choice)
**Total Points:** 50 (1 point each)
**Time:** ~15-30 minutes

A curated subset of the full 500-question quiz, designed for humans.

Answer format:
- Multiple choice (one answer): Letter only (A, B, C, or D)
  - Example: `1. B`
- Multiple select (multiple answers): Comma-separated letters with NO SPACES
  - Example: `2. A,C,D`

**SURVEY (Optional - helps us understand your background):**
```
S1. [Your background] (e.g., "Software engineer, 5 years experience")
S2. [Time spent] (e.g., "20 minutes")
S3. [Resources used] (e.g., "Memory only" or "Checked docs")
```

---

## Runtime & Core (10 questions)

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

3. What is the key benefit of Elide's polyglot interop?
A. Requires JSON serialization
B. Zero-serialization cross-language calls
C. Only works with JavaScript
D. Requires separate processes

4. What is the approximate cold start performance of Elide vs Node.js?
A. Same speed
B. 2x faster
C. 10x faster (~20ms vs ~200ms)
D. 100x faster

5. What is the performance benchmark for Elide on Linux (RPS)?
A. ~10K RPS
B. ~100K RPS
C. ~800K RPS
D. ~1M RPS

6. How do you import a Python module in TypeScript with Elide?
A. import py from 'python'
B. import module from './module.py'
C. require('python')
D. Elide.import('module.py')

7. What is the GraalVM version used by Elide beta11-rc1?
A. GraalVM 23.x
B. GraalVM 24.x
C. GraalVM 25.x
D. GraalVM 22.x

8. What is the internal mechanism Elide uses for polyglot interop?
A. JSON-RPC
B. Truffle language interoperability
C. JNI
D. HTTP calls

9. What is the overhead of calling Java from TypeScript in Elide?
A. ~100ms
B. <1ms (zero-serialization)
C. ~10ms
D. Requires IPC

10. True or False: Elide supports BigInt.
A. True
B. False

## CLI Commands (10 questions)

11. What command runs a TypeScript file with Elide?
A. elide execute file.ts
B. elide run file.ts
C. elide start file.ts
D. elide file.ts

12. What command starts an HTTP server with Elide?
A. elide server file.ts
B. elide serve file.ts
C. elide http file.ts
D. elide start file.ts

13. What is the default port for elide serve?
A. 3000
B. 8080
C. 8000
D. 5000

14. How do you enable the Chrome DevTools inspector?
A. elide run --debug file.ts
B. elide run --inspect file.ts
C. elide run --devtools file.ts
D. elide run --chrome file.ts

15. How do you grant file I/O permissions broadly?
A. elide run --allow-io file.ts
B. elide run --host:allow-io file.ts
C. elide run --fs:all file.ts
D. elide run --io file.ts

16. What is the correct syntax to pass options to javac via Elide?
A. elide javac -d out src/*.java
B. elide javac -- -d out src/*.java
C. elide javac --options="-d out" src/*.java
D. elide javac --javac-opts="-d out" src/*.java

17. What is the purpose of the -- separator in Elide commands?
A. End of options
B. Pass remaining args to underlying tool
C. Comment separator
D. Not used

18. How do you build a native image with Elide?
A. elide compile --native
B. elide native-image
C. elide build-native
D. elide image

19. How do you run tests with JSON coverage report?
A. elide test --coverage --format=json
B. elide test --coverage --coverage-format=json
C. elide test --json-coverage
D. elide test --coverage=json

20. What command initializes a new Elide project?
A. elide new
B. elide create
C. elide init
D. elide start

## HTTP & Servers (10 questions)

21. What is the major feature of beta11-rc1?
A. Python support
B. Native HTTP server support
C. WebAssembly
D. GraphQL

22. What was the old HTTP shim import in beta10?
A. import { serve } from "elide/http"
B. import { serve } from "elide/http/server"
C. import { createServer } from "http"
D. import { Server } from "elide"

23. What is the recommended pattern for new projects in beta11-rc1?
A. Express
B. Fetch Handler
C. Node.js http
D. WSGI

24. Write the minimal Fetch Handler pattern for beta11-rc1.

25. How do you return JSON in a Fetch Handler?

26. What flag enables WSGI mode in beta11-rc1?
A. --python
B. --wsgi
C. --flask
D. --web

27. True or False: Beta11-rc1 supports Flask natively.
A. True
B. False

28. Which HTTP server stack does Elide use?
A. Express + Node
B. Netty + Micronaut
C. Tomcat
D. Undertow

29. True or False: Elide supports HTTP/2.
A. True
B. False

30. How do you run a Flask app with Elide?

## Projects & Dependencies (5 questions)

31. What file defines an Elide project?
A. project.json
B. elide.pkl
C. elide.yaml
D. config.toml

32. What language is elide.pkl written in?
A. JSON
B. YAML
C. Pkl (Apple's configuration language)
D. TOML

33. What is the first line of an elide.pkl file?
A. import "elide:project.pkl"
B. amends "elide:project.pkl"
C. extends "elide:project.pkl"
D. include "elide:project.pkl"

34. Write the elide.pkl syntax to add React 18 as an npm dependency.

35. How do you add a new dependency to a project from CLI?
A. elide install <package>
B. elide add <package>
C. elide dep <package>
D. elide get <package>

## Polyglot (5 questions)

36. What is the overhead of cross-language calls in Elide?
A. ~100ms
B. ~10ms
C. <1ms
D. ~1s

37. True or False: Elide requires serialization for cross-language calls.
A. True
B. False

38. Write the TypeScript syntax to import a Python module named "math.py".

39. How does Elide handle Python GIL (Global Interpreter Lock)?
A. Standard GIL applies
B. No GIL in GraalPy
C. Requires threading library
D. Not applicable

40. What types can be shared across languages in Elide? (multiple select)
A. Primitives (numbers, strings, booleans)
B. Objects
C. Functions
D. Classes

## Testing & Build (5 questions)

41. What tool does Elide use for native image compilation?
A. LLVM
B. GraalVM Native Image
C. GCC
D. Clang

42. What is the benefit of native image compilation?
A. Slower startup
B. Faster cold starts and smaller binaries
C. Requires JVM
D. Only for Java

43. How do you enable PGO (Profile-Guided Optimization) instrumentation?
A. elide native-image -- --pgo-instrument -o myapp MyClass
B. elide native-image --profile -o myapp MyClass
C. elide native-image --instrument myapp MyClass
D. elide native-image --pgo myapp MyClass

44. What tool does Elide use for container building?
A. Docker
B. Podman
C. Jib
D. Buildah

45. True or False: Elide supports code coverage.
A. True
B. False

## Beta11 Features (3 questions)

46. True or False: Beta11-rc1 eliminates the need for HTTP shims.
A. True
B. False

47. How many showcases were converted to beta11-rc1?
A. 10
B. 15
C. 22
D. 30

48. What is the key benefit of native HTTP in beta11-rc1?

## Advanced Topics (2 questions)

49. What is Elide's cold start time vs Node.js?
A. Same
B. 2x faster
C. 10x faster
D. 100x faster

50. How do you manage secrets in Elide?
A. elide env
B. elide secrets
C. elide vault
D. elide config

---

**End of Human Edition**

Total: 50 questions
- Easy: 30 questions (1 point each) = 30 points
- Medium: 15 questions (2 points each) = 30 points
- Hard: 5 questions (3 points each) = 15 points
- **Total possible points: 75**

Scoring:
- Pass: 53+ (70%)
- Expert: 64+ (85%)
- Master: 71+ (95%)

