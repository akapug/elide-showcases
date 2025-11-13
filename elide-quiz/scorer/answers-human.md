# Elide Expert Quiz - Human Edition Answer Key

Answers for the 50-question human-friendly version.

---

## Runtime & Core (10 answers)

1. **A,B,C** - JavaScript & TypeScript, Python 3.11, Java (JDK 24) & Kotlin (K2 v2.2.21). Ruby is NOT supported.

2. **B** - GraalVM and Truffle

3. **B** - Zero-serialization cross-language calls

4. **C** - 10x faster (~20ms vs ~200ms)

5. **C** - ~800K RPS

6. **B** - import module from './module.py'

7. **C** - GraalVM 25.x

8. **B** - Truffle language interoperability

9. **B** - <1ms (zero-serialization)

10. **A** - True

## CLI Commands (10 answers)

11. **B** - elide run file.ts

12. **B** - elide serve file.ts

13. **B** - 8080

14. **B** - elide run --inspect file.ts

15. **B** - elide run --host:allow-io file.ts

16. **B** - elide javac -- -d out src/*.java

17. **B** - Pass remaining args to underlying tool

18. **B** - elide native-image

19. **B** - elide test --coverage --coverage-format=json

20. **C** - elide init

## HTTP & Servers (10 answers)

21. **B** - Native HTTP server support

22. **B** - import { serve } from "elide/http/server"

23. **B** - Fetch Handler

24. **export default { async fetch(request: Request): Promise<Response> { return new Response("Hello!"); } }**

25. **Response.json({ key: "value" })** or **new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })**

26. **B** - --wsgi

27. **A** - True

28. **B** - Netty + Micronaut

29. **A** - True

30. **elide run --wsgi app.py** or **elide serve --wsgi app.py**

## Projects & Dependencies (5 answers)

31. **B** - elide.pkl

32. **C** - Pkl (Apple's configuration language)

33. **B** - amends "elide:project.pkl"

34. **dependencies { npm { packages { "react@18" } } }**

35. **B** - elide add <package>

## Polyglot (5 answers)

36. **C** - <1ms

37. **B** - False

38. **import math from "./math.py"**

39. **B** - No GIL in GraalPy

40. **A,B,C,D** - All types can be shared: Primitives, Objects, Functions, Classes

## Testing & Build (5 answers)

41. **B** - GraalVM Native Image

42. **B** - Faster cold starts and smaller binaries

43. **A** - elide native-image -- --pgo-instrument -o myapp MyClass

44. **C** - Jib

45. **A** - True

## Beta11 Features (3 answers)

46. **A** - True

47. **C** - 22

48. **No shims needed, faster startup, lower memory overhead, native performance** (accept variations mentioning performance/memory/no shims)

## Advanced Topics (2 answers)

49. **C** - 10x faster

50. **B** - elide secrets

---

**Total: 50 questions, 75 points**
- Easy (30q × 1pt = 30pts)
- Medium (15q × 2pts = 30pts)
- Hard (5q × 3pts = 15pts)

**Grading**:
- Pass: 53+ (70%)
- Expert: 64+ (85%)
- Master: 71+ (95%)

