# Elide Expert Quiz - Answer Key

This file contains the correct answers and explanations for all 500 questions.

Format:
- Question number
- Correct answer
- Brief explanation with source reference

---

## Runtime & Core (100 answers)

### Easy (40a)

1. **A,B,C,D** - Elide supports JavaScript, TypeScript, Python 3.11, Java JDK 24, Kotlin K2 v2.2.21, Ruby, WebAssembly, and LLVM. (Source: elide help, README.md)

2. **B** - Elide is built on GraalVM v25.0.0 and Truffle. (Source: elide-core-knowledge.md, README.md)

3. **B** - False. Elide runs TypeScript directly with no build step. (Source: elide help typescript, GETTING_STARTED.md)

4. **B** - Zero-serialization cross-language calls with <1ms overhead. (Source: README.md, BETA11_MIGRATION_GUIDE.md)

5. **C** - Python 3.11 via GraalPy. (Source: elide help, elide-core-knowledge.md)

6. **B** - Single GC shared across all languages for zero cross-language GC overhead. (Source: README.md)

7. **A** - True. TSX/JSX work with .tsx/.jsx extensions, no build step. (Source: elide help typescript, react.md)

8. **D** - JDK 24. (Source: elide help jvm, elide-core-knowledge.md)

9. **B** - Kotlin K2 v2.2.21. (Source: elide help jvm, elide-core-knowledge.md)

10. **A** - True. Elide supports WebAssembly (WASM). (Source: elide-core-knowledge.md)

11. **C** - 10x faster (~20ms vs ~200ms). (Source: README.md, GETTING_STARTED.md)

12. **B** - Runs TypeScript directly with no build step. (Source: elide help typescript)

13. **A** - True. `import module from "./module.py"` works. (Source: elide help polyglot, showcases)

14. **A** - Multiple programming languages in one runtime. (Source: elide help polyglot)

15. **D** - Both .tsx and .jsx trigger TSX/JSX processing. (Source: elide help typescript, react.md)

16. **A** - True. Unified GC across all languages. (Source: README.md)

17. **C** - ~800K RPS on Linux. (Source: elide help servers, README.md)

18. **B** - TechEmpower. (Source: README.md, GETTING_STARTED.md)

19. **B** - False. Elide uses GraalVM, not V8. (Source: elide-core-knowledge.md)

20. **B** - No overhead when calling across languages (<1ms). (Source: README.md)

21. **D** - None - all modern JavaScript features are supported. (Source: ELIDE_KNOWLEDGEBASE.md)

22. **A** - True. LLVM is supported. (Source: elide-core-knowledge.md)

23. **B** - A language implementation framework. (Source: GraalVM docs, elide architecture)

24. **B** - React 18. React 19 not yet supported. (Source: elide help react)

25. **A** - True. Both ESM and CJS imports work. (Source: elide help typescript, nodeapi.md)

26. **C** - ~20ms. (Source: README.md, GETTING_STARTED.md)

27. **B** - No V8 initialization overhead. (Source: README.md)

28. **A** - True. Elide can execute Java bytecode via GraalVM. (Source: elide help jvm)

29. **C** - .pkl (Pkl configuration language). (Source: elide help projects)

30. **A,B,C** - fs, path, buffer, stream, assert, zlib. Cluster is NOT supported. (Source: elide help nodeapi)

31. **A** - True. Kotlin coroutines are supported via kotlinx.coroutines. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)

32. **B** - Mixing languages in one application. (Source: elide help polyglot)

33. **B** - Instant compilation at runtime via GraalVM. (Source: elide help typescript)

34. **A** - True. Symbol is fully supported. (Source: ELIDE_KNOWLEDGEBASE.md)

35. **B** - No build step needed. (Source: elide help typescript)

36. **A,B,C,D** - All are supported: Map, Set, WeakMap, WeakSet. (Source: ELIDE_KNOWLEDGEBASE.md)

37. **A** - True. Optional chaining (?.) is supported. (Source: ELIDE_KNOWLEDGEBASE.md)

38. **B** - Faster cold starts and smaller binaries. (Source: GraalVM docs, elide help)

39. **B** - ES2020+ with modern features. (Source: ELIDE_KNOWLEDGEBASE.md)

40. **A** - True. BigInt is supported. (Source: ELIDE_KNOWLEDGEBASE.md)

### Medium (40a)

41. **B** - `import module from './module.py'` - Standard ESM import syntax. (Source: elide help polyglot, showcases)

42. **B** - `import.meta.url.includes("script-name.ts")` - Detects if running as script vs module. (Source: ELIDE_KNOWLEDGEBASE.md)

43. **A,B,C,D** - All are included: coroutines, datetime, serialization, html. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)

44. **B** - Returns Java array representation `[Ljava.lang.String;@...`. (Source: ELIDE_KNOWLEDGEBASE.md)

45. **B** - `kotlin { features { kotlinx = false } }` in elide.pkl. (Source: elide help projects, ELIDE_KNOWLEDGEBASE.md)

46. **B** - Python 3.11 with GraalPy. (Source: elide help, elide-core-knowledge.md)

47. **D** - Both A and B work. Prefer `node:` prefix for clarity. (Source: elide help nodeapi)

48. **A,C** - javac and jar. javadoc is available but not commonly embedded. (Source: elide help jvm)

49. **B** - Elide's root can be used as JAVA_HOME. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)

50. **A** - kotlinc. kapt and KSP are supported but separate. (Source: elide help jvm)

51. **C** - Compile-time type checking via GraalVM. (Source: elide help typescript)

52. **B** - Install react@18 and react-dom@18. (Source: elide help react)

53. **C** - React JSX only, other libraries not yet supported. (Source: elide help react)

54. **B** - .jsx or .tsx file extensions required. (Source: elide help react, typescript.md)

55. **B** - `elide run file.tsx` - Direct execution. (Source: elide help react)

56. **B** - Fully supported. (Source: ELIDE_KNOWLEDGEBASE.md)

57. **B** - Standard Promise API works. (Source: ELIDE_KNOWLEDGEBASE.md)

58. **A,B,C,D** - All modern JavaScript features are supported. (Source: ELIDE_KNOWLEDGEBASE.md)

59. **B** - <1ms overhead. (Source: README.md, BETA11_MIGRATION_GUIDE.md)

60. **C** - Erased at runtime (standard TypeScript behavior). (Source: TypeScript docs, elide behavior)

61. **B** - Full ES6+ class support with inheritance. (Source: ELIDE_KNOWLEDGEBASE.md)

62. **B** - Standard function* syntax works. (Source: ELIDE_KNOWLEDGEBASE.md)

63. **B** - Full iterator and generator support. (Source: ELIDE_KNOWLEDGEBASE.md)

64. **B** - Standard Symbol API works. (Source: ELIDE_KNOWLEDGEBASE.md)

65. **A,B,C,D** - All collection types supported. (Source: ELIDE_KNOWLEDGEBASE.md)

66. **B** - Standard Uint8Array, Int32Array, etc. work. (Source: ELIDE_KNOWLEDGEBASE.md)

67. **B** - Full regex with global, groups, etc. (Source: ELIDE_KNOWLEDGEBASE.md)

68. **B** - Full Unicode support. (Source: ELIDE_KNOWLEDGEBASE.md)

69. **B** - Full Math.* methods. (Source: ELIDE_KNOWLEDGEBASE.md)

70. **B** - Number.isFinite, Number.isInteger, etc. work. (Source: ELIDE_KNOWLEDGEBASE.md)

71. **B** - Object.keys, Object.values, Object.entries, Object.assign all work. (Source: ELIDE_KNOWLEDGEBASE.md)

72. **B** - Standard Object.defineProperty works. (Source: ELIDE_KNOWLEDGEBASE.md)

73. **B** - Fully supported in classes and objects. (Source: ELIDE_KNOWLEDGEBASE.md)

74. **B** - Full array API: map, filter, reduce, flat, etc. (Source: ELIDE_KNOWLEDGEBASE.md)

75. **B** - Full string API including template literals. (Source: ELIDE_KNOWLEDGEBASE.md)

76. **B** - Full bitwise support: <<, >>, &, |, ^. (Source: ELIDE_KNOWLEDGEBASE.md)

77. **B** - Standard parseFloat and parseInt work. (Source: ELIDE_KNOWLEDGEBASE.md)

78. **C** - GraalVM 25.x (specifically v25.0.0). (Source: elide-core-knowledge.md, README.md)

79. **B** - Node.js Buffer class available via node:buffer. (Source: elide help nodeapi)

80. **B** - Available as global function (Web Crypto API). (Source: Node.js compatibility, elide behavior)

### Hard (20a)

81. **B** - Truffle language interoperability. (Source: GraalVM docs, elide architecture)

82. **B** - Can compile to native binaries with `elide native-image`. (Source: elide help, elide-advanced-techniques.md)

83. **B** - No cross-language GC overhead. (Source: README.md)

84. **B** - Types erased but checked at compile time. (Source: TypeScript behavior, GraalVM)

85. **B** - Supports both Node.js and ESM resolution. (Source: elide help typescript, nodeapi.md)

86. **B** - Elide is recognized as Oracle GraalVM instance at JDK 24. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)

87. **B** - Supports kapt and KSP. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)

88. **B** - Includes Kotlin Scripting compiler. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)

89. **B** - Elide's root can be used as KOTLIN_HOME. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)

90. **B** - Included in distribution with kotlinx.serialization and kotlinx.serialization.json. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)

91. **B** - kotlinx.html included in distribution. (Source: elide help jvm, ELIDE_KNOWLEDGEBASE.md)

92. **B** - Runtime compilation via GraalVM. (Source: elide help typescript, GraalVM architecture)

93. **B** - Experimental support. (Source: TypeScript/GraalVM limitations)

94. **B** - Generated for debugging. (Source: GraalVM behavior)

95. **B** - Faster cold start, similar warm performance. (Source: README.md, benchmarks)

96. **B** - Handled by Truffle. (Source: Truffle docs, GraalVM architecture)

97. **B** - Shared heap with unified GC. (Source: README.md, GraalVM architecture)

98. **B** - <1ms (zero-serialization). (Source: README.md, BETA11_MIGRATION_GUIDE.md)

99. **B** - No GIL in GraalPy. (Source: GraalPy docs, Python polyglot behavior)

100. **B** - Supports Chrome DevTools inspector. (Source: elide help, CLI options)

---

## CLI Commands (80 answers)

### Easy (30a)

101. **B** - `elide run file.ts`

102. **B** - `elide serve file.ts`

103. **B** - `elide repl`

104. **C** - `elide init`

105. **B** - `elide install`

106. **B** - `elide add <package>`

107. **C** - `elide build`

108. **B** - `elide test`

109. **D** - All of the above: `-v`, `--version`, `version`

110. **D** - All of the above: `-h`, `--help`, `help`

111. **A** - `elide help servers`

112. **B** - `elide javac`

113. **B** - `elide kotlinc`

114. **B** - `elide jar`

115. **B** - `elide javadoc`

116. **B** - `elide native-image`

117. **C** - `elide jib`

118. **B** - `elide lsp`

119. **B** - `elide mcp`

120. **B** - `elide which esbuild`

121. **B** - `elide secrets`

122. **A** - `elide info`

123. **B** - `elide completions`

124. **A** - True. `elide run script.py` works.

125. **B** - False. Default port is 8080, no flag required.

126. **B** - 8080 (Source: elide help servers)

127. **A** - True. `--coverage` flag available.

128. **B** - False. Can build without explicit build file if tasks defined in elide.pkl.

129. **A** - True. Interactive by default.

130. **A** - True. Works with package.json, pyproject.toml, requirements.txt, etc.

### Medium (30a)

131. **C** - Both A and B work.

132. **B** - `elide run --inspect file.ts`

133. **B** - `elide run --inspect:suspend file.ts`

134. **A** - `elide run --inspect:port=9229 file.ts`

135. **D** - Both B and C: `--debug` and `--verbose`

136. **C** - Both A and B: `-v` and `--verbose`

137. **C** - Both A and B: `-q` and `--quiet`

138. **A** - `elide run --no-telemetry file.ts`

139. **B** - `elide install --frozen`

140. **B** - `elide build --release`

141. **B** - `elide test --coverage --coverage-format=json`

142. **B** - `elide test --test-report=xml`

143. **A** - `elide test --coverage --coverage-format=json --test-report=xml`

144. **B** - `elide test --threaded --threads=4`

145. **B** - `elide run --host:allow-io file.ts`

146. **B** - `elide run --host:allow-io:read=/data file.ts`

147. **B** - `elide run --host:allow-io:write=/tmp file.ts`

148. **B** - `elide run --host:allow-io=/tmp,/data file.ts`

149. **B** - `elide run --host:allow-env file.ts`

150. **B** - `elide run --env:dotenv file.ts`

151. **B** - `elide install --lockfile-format=json`

152. **B** - `elide install --frozen --verify`

153. **A** - `elide build --dry`

154. **A** - `elide native-image -- -O3 -o myapp MyClass`

155. **A** - `elide native-image -- --no-fallback -o myapp MyClass`

156. **A** - `elide native-image -- --initialize-at-build-time -o myapp MyClass`

157. **A** - `elide native-image -- --pgo-instrument -o myapp MyClass`

158. **A** - `elide native-image -- --pgo=default.iprof -o myapp MyClass`

159. **A** - `elide jib build -- -t myapp:latest`

160. **B** - `elide secrets set API_KEY value`

### Hard (20a)

161. **B** - `elide javac -- -d out src/*.java` - The `--` separator passes options to javac.

162. **B** - `elide kotlinc -- -d out src/*.kt` - The `--` separator passes options to kotlinc.

163. **B** - `elide native-image -- -O3 -o myapp MyClass` - The `--` separator passes options to native-image.

164. **D** - Both A and B work for jib.

165. **B** - `elide lsp --lsp:port=8080`

166. **B** - `elide lsp app.ts --lsp:port=8080`

167. **B** - Pass remaining args to underlying tool.

168. **A** - `elide run --env A=1 --env B=2 file.ts` - Multiple `--env` flags.

169. **D** - Both B and C: `elide run --wsgi app.py` or `elide serve --wsgi app.py`

170. **D** - Both A and C: `--port` flag or PORT environment variable.

171. **A** - `elide run --host:allow-io:read=/data --host:allow-io:write=/tmp file.ts`

172. **A** - Not possible - all or nothing with `--no-telemetry`.

173. **B** - `elide test --coverage --coverage-format=histogram`

174. **D** - Not supported directly; use shell piping.

175. **A** - `elide test path/to/test.ts`

176. **D** - Not supported directly.

177. **A** - `elide jib -- build -t myapp --to-username=user --to-password=pass`

178. **A** - `elide jib -- build --from=gcr.io/distroless/base -t myapp`

179. **A** - `elide jib -- build --app-root=/app -t myapp`

180. **A** - `elide jib -- build --entrypoint=/app/myapp -t myapp`

---

## HTTP & Servers (80 answers)

### Easy (30a)

181. **B** - 8080 (Source: elide help servers)

182. **B** - Netty + Micronaut (Source: elide help servers)

183. **A** - True

184. **A** - True

185. **A** - True

186. **A** - True

187. **A,B** - OpenSSL and BoringSSL (Source: elide help servers)

188. **A** - True. Non-blocking I/O by default.

189. **C** - ~800K RPS (Source: elide help servers, README.md)

190. **A** - True (Source: README.md)

191. **C** - beta11-rc1 (Source: BETA11_MIGRATION_GUIDE.md)

192. **A** - True (Source: BETA11_MIGRATION_GUIDE.md, elide-core-knowledge.md)

193. **A** - True (Source: BETA11_MIGRATION_GUIDE.md)

194. **A,B,C** - Fetch Handler, Node.js http.createServer, WSGI (Source: BETA11_MIGRATION_GUIDE.md)

195. **B** - False. No shim needed in beta11-rc1.

196. **B** - Fetch Handler (declarative, modern) (Source: BETA11_MIGRATION_GUIDE.md)

197. **A** - True

198. **A** - True

199. **A** - True (Source: BETA11_MIGRATION_GUIDE.md)

200. **A,B** - Flask and Django (Source: BETA11_MIGRATION_GUIDE.md)

201. **A** - True (Source: BETA11_MIGRATION_GUIDE.md, flask-typescript-polyglot showcase)

202. **B** - `--wsgi` (Source: BETA11_MIGRATION_GUIDE.md)

203. **A** - True (Source: flask-typescript-polyglot showcase)

204. **C** - <1ms (Source: README.md)

205. **A** - True (streaming responses supported)

206. **A** - True

207. **A** - True

208. **A** - True

209. **A** - True

210. **A** - True

### Medium (30a)

211. **Answer:**
```typescript
export default async function fetch(req: Request): Promise<Response> {
  return new Response("Hello!", { status: 200 });
}
```
(Source: BETA11_MIGRATION_GUIDE.md)

212. **Answer:**
```typescript
import { createServer } from "http";
const server = createServer((req, res) => {
  res.writeHead(200);
  res.end("Hello!");
});
server.listen(3000);
```
(Source: BETA11_MIGRATION_GUIDE.md)

213. **Answer:**
```typescript
return new Response(JSON.stringify({ key: "value" }), {
  headers: { "Content-Type": "application/json" }
});
```
Or use `Response.json({ key: "value" })`

214. **Answer:**
```typescript
const body = await req.json();
```
Or `await req.text()` for text.

215. **Answer:**
```typescript
const url = new URL(req.url);
```

216. **Answer:**
```typescript
return new Response("...", {
  headers: { "X-Custom": "value" }
});
```

217. **Answer:**
```typescript
return new Response("Not Found", { status: 404 });
```

218. **Answer:**
```typescript
if (req.method === "POST") {
  const body = await req.json();
  // handle POST
}
```

219. **Answer:**
```typescript
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode("chunk"));
    controller.close();
  }
});
return new Response(stream);
```

220. **Answer:**
```bash
elide run --wsgi app.py
```
Or `elide serve --wsgi app.py`

221. **Answer:** 8080 (default Elide port)

222. **Answer:**
```bash
curl http://localhost:8080/health
```

223. **Answer:** Run Flask with `--wsgi`, import Python module from TypeScript, call Flask functions from TS orchestration layer. (Source: flask-typescript-polyglot showcase)

224. **Answer:** `import { serve } from "elide/http/server"` with callback pattern. (Source: BETA11_MIGRATION_GUIDE.md)

225. **Answer:** `import { serve } from "elide/http/server"` (Source: BETA11_MIGRATION_GUIDE.md)

226. **Answer:** Wrap in function to avoid top-level execution:
```typescript
export default async function fetch(req: Request): Promise<Response> {
  console.log("Request received"); // Safe inside function
  return new Response("OK");
}
```

227. **Answer:** 50% faster cold start, 20% higher throughput, 10MB less memory. (Source: BETA11_MIGRATION_GUIDE.md)

228. **Answer:** 22 showcases (Source: BETA11_MIGRATION_GUIDE.md, README.md)

229. **Answer:** flask-typescript-polyglot (Source: showcases directory)

230. **Answer:** Run Python web frameworks (Flask, Django) natively with zero-serialization TypeScript interop. (Source: BETA11_MIGRATION_GUIDE.md)

231. **Answer:**
```typescript
let body = '';
req.on('data', chunk => { body += chunk; });
req.on('end', () => { /* process body */ });
```

232. **Answer:**
```typescript
res.writeHead(404);
```

233. **Answer:**
```typescript
server.listen(5000);
```

234. **Answer:** Fetch Handler is declarative (export function), Node.js http is imperative (createServer). (Source: BETA11_MIGRATION_GUIDE.md)

235. **Answer:** Node.js http (imperative, more control over server lifecycle)

236. **Answer:** Fetch Handler (declarative, less boilerplate)

237. **Answer:** Configure TLS cert and key in elide.pkl, Elide handles TLS automatically.

238. **Answer:**
```pkl
server {
  tls {
    cert = "/path/to/cert.pem"
    key = "/path/to/key.pem"
  }
}
```

239. **Answer:** No shim overhead, faster cold start, lower memory, higher throughput. (Source: BETA11_MIGRATION_GUIDE.md)

240. **Answer:** 10MB reduction (Source: BETA11_MIGRATION_GUIDE.md)

### Hard (20a)

241. **Answer:** Remove `import { serve } from "elide/http/server"`, replace callback pattern with `export default async function fetch(req: Request): Promise<Response>`, update request/response handling to use Web APIs. (Source: BETA11_MIGRATION_GUIDE.md)

242. **Answer:** Netty for I/O, Micronaut for HTTP protocol handling, GraalVM for runtime. (Source: elide help servers)

243. **Answer:** Non-blocking I/O via Netty, native transports (epoll on Linux), zero-copy buffers, GraalVM optimizations. (Source: elide help servers, benchmarks)

244. **Answer:** Netty provides high-performance non-blocking I/O and native transports. (Source: elide help servers)

245. **Answer:** Micronaut provides HTTP protocol handling, routing, and server lifecycle. (Source: elide help servers)

246. **Answer:** ALPN (Application-Layer Protocol Negotiation) during TLS handshake. (Source: HTTP/2 spec, Netty docs)

247. **Answer:** ALPN is TLS extension for protocol negotiation; Elide uses it to negotiate HTTP/2 vs HTTP/1.1. (Source: TLS/HTTP/2 specs)

248. **Answer:** HTTP/3 over QUIC protocol, using Netty's QUIC support. (Source: elide help servers)

249. **Answer:** h2c is HTTP/2 over cleartext (no TLS); Elide supports it. (Source: HTTP/2 spec, Netty capabilities)

250. **Answer:** Python WSGI app runs in same GraalVM process as TypeScript, shared heap, Truffle interop for zero-serialization calls. (Source: BETA11_MIGRATION_GUIDE.md, GraalVM architecture)

251. **Answer:** <1ms overhead, zero serialization. (Source: README.md, BETA11_MIGRATION_GUIDE.md)

252. **Answer:** Create Flask app in Python, run with `--wsgi`, import Flask module from TypeScript, call Flask functions for orchestration, use Fetch Handler or Node.js http for TypeScript endpoints. (Source: flask-typescript-polyglot showcase)

253. **Answer:** Only one server can bind to a port at a time; use different ports or single server with routing. (Source: OS networking limitations)

254. **Answer:** WebSocket upgrade via HTTP, Netty handles WebSocket frames, bidirectional communication. (Source: elide help servers, WebSocket spec)

255. **Answer:** Supported via Netty/Micronaut. (Source: elide help servers)

256. **Answer:** Use streaming Response with `Content-Type: text/event-stream`, send SSE-formatted chunks. (Source: SSE spec, streaming response pattern)

257. **Answer:** Avoids loading entire response in memory, enables backpressure, reduces memory footprint. (Source: Streams API spec)

258. **Answer:** ReadableStream controller provides backpressure signals; pause enqueue when consumer is slow. (Source: Streams API spec)

259. **Answer:** Automatic with `Transfer-Encoding: chunked` header for streaming responses. (Source: HTTP spec, Netty behavior)

260. **Answer:** HTTP/2 push is deprecated in browsers; not recommended. Use preload links instead. (Source: HTTP/2 spec, browser deprecations)

---

*[Answers 261-500 continue with same format and detail level]*

**Note:** This is a partial answer key. Full answer key with all 500 answers will be completed in subsequent edits. Each answer includes:
- Correct answer
- Brief explanation
- Source reference (help file, showcase, or documentation)


