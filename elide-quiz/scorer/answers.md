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

211. **Answer:** export default async function fetch(req: Request): Promise<Response> { return new Response("Hello!", { status: 200 }); } (Source: BETA11_MIGRATION_GUIDE.md)

212. **Answer:** import { createServer } from "http"; const server = createServer((req, res) => { res.writeHead(200); res.end("Hello!"); }); server.listen(3000); (Source: BETA11_MIGRATION_GUIDE.md)

213. **Answer:** return new Response(JSON.stringify({ key: "value" }), { headers: { "Content-Type": "application/json" } }); or use Response.json({ key: "value" })

214. **Answer:** const body = await req.json(); or await req.text() for text.

215. **Answer:** const url = new URL(req.url);

216. **Answer:** return new Response("...", { headers: { "X-Custom": "value" } });

217. **Answer:** return new Response("Not Found", { status: 404 });

218. **Answer:** if (req.method === "POST") { const body = await req.json(); /* handle POST */ }

219. **Answer:** const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("chunk")); controller.close(); } }); return new Response(stream);

220. **Answer:** elide run --wsgi app.py or elide serve --wsgi app.py

221. **Answer:** 8080 (default Elide port)

222. **Answer:** curl http://localhost:8080/health

223. **Answer:** Run Flask with `--wsgi`, import Python module from TypeScript, call Flask functions from TS orchestration layer. (Source: flask-typescript-polyglot showcase)

224. **Answer:** `import { serve } from "elide/http/server"` with callback pattern. (Source: BETA11_MIGRATION_GUIDE.md)

225. **Answer:** `import { serve } from "elide/http/server"` (Source: BETA11_MIGRATION_GUIDE.md)

226. **Answer:** Wrap in function to avoid top-level execution: export default async function fetch(req: Request): Promise<Response> { console.log("Request received"); return new Response("OK"); }

227. **Answer:** 50% faster cold start, 20% higher throughput, 10MB less memory. (Source: BETA11_MIGRATION_GUIDE.md)

228. **Answer:** 22 showcases (Source: BETA11_MIGRATION_GUIDE.md, README.md)

229. **Answer:** flask-typescript-polyglot (Source: showcases directory)

230. **Answer:** Run Python web frameworks (Flask, Django) natively with zero-serialization TypeScript interop. (Source: BETA11_MIGRATION_GUIDE.md)

231. **Answer:** let body = ''; req.on('data', chunk => { body += chunk; }); req.on('end', () => { /* process body */ });

232. **Answer:** res.writeHead(404);

233. **Answer:** server.listen(5000);

234. **Answer:** Fetch Handler is declarative (export function), Node.js http is imperative (createServer). (Source: BETA11_MIGRATION_GUIDE.md)

235. **Answer:** Node.js http (imperative, more control over server lifecycle)

236. **Answer:** Fetch Handler (declarative, less boilerplate)

237. **Answer:** Configure TLS cert and key in elide.pkl, Elide handles TLS automatically.

238. **Answer:** server { tls { cert = "/path/to/cert.pem" key = "/path/to/key.pem" } } in elide.pkl

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
## Projects & Dependencies (60 questions) - Questions 261-320

### Easy (20q) - 261-280

261. **B** - elide.pkl defines an Elide project. (Source: elide help projects)

262. **C** - Pkl (Apple's configuration language). (Source: elide help projects)

263. **A** - True. elide.pkl can declare npm dependencies in the dependencies block. (Source: elide help projects)

264. **A** - True. elide.pkl can declare Maven dependencies in the dependencies block. (Source: elide help projects)

265. **A** - True. elide.pkl can declare PyPI dependencies. (Source: elide help projects)

266. **A,B,C** - npm, Maven, and PyPI are supported. Rubygems not yet. (Source: elide help projects)

267. **A** - True. Elide can use existing package.json. (Source: elide help projects)

268. **A** - True. Elide can use existing pyproject.toml. (Source: elide help projects)

269. **A** - True. Elide can use existing requirements.txt. (Source: elide help projects)

270. **B** - Binary (.lock.bin) is the default lockfile format. (Source: elide help projects)

271. **B** - ./.dev/elide.lock.bin is the default location. (Source: elide help projects)

272. **A** - True. Binary lockfiles are faster to parse. (Source: elide help projects)

273. **A** - True. Use --lockfile-format=json flag. (Source: elide help install)

274. **B** - elide install installs dependencies. (Source: elide help install)

275. **A** - True. elide install reads elide.pkl and package.json. (Source: elide help install)

276. **A** - True. Elide caches dependencies in ./.dev/cache. (Source: elide help projects)

277. **B** - ./.dev/cache is the default cache location. (Source: elide help projects)

278. **A** - elide clean removes cached dependencies. (Source: elide help clean)

279. **A** - True. Use --force flag to force reinstall. (Source: elide help install)

280. **A** - True. Elide supports workspace/monorepo setups. (Source: elide help projects)

### Medium (20q) - 281-300

281. **B** - Use workspace { packages = ["packages/*"] } in elide.pkl. (Source: elide help projects)

282. **A** - True. Workspaces share a single lockfile. (Source: elide help projects)

283. **A** - True. Workspaces can reference each other. (Source: elide help projects)

284. **B** - elide install from workspace root installs all packages. (Source: elide help install)

285. **A,B,C** - package.json, package-lock.json, and node_modules are supported. (Source: elide help projects)

286. **A** - True. Elide can use existing package-lock.json. (Source: elide help install)

287. **A** - True. Elide can generate package-lock.json. (Source: elide help install)

288. **B** - Use --lockfile-format=npm flag. (Source: elide help install)

289. **A** - True. Elide supports pnpm-lock.yaml. (Source: elide help install)

290. **A** - True. Elide supports yarn.lock. (Source: elide help install)

291. **A,B,C,D** - Maven Central, npm registry, PyPI, and custom registries. (Source: elide help projects)

292. **B** - Configure in elide.pkl repositories block. (Source: elide help projects)

293. **A** - True. Use repositories { maven { url = "..." } }. (Source: elide help projects)

294. **A** - True. Use repositories { npm { url = "..." } }. (Source: elide help projects)

295. **A** - True. Set NPM_REGISTRY environment variable. (Source: elide help projects)

296. **A** - True. Set MAVEN_REPOSITORY environment variable. (Source: elide help projects)

297. **A** - True. Elide supports private registries with authentication. (Source: elide help projects)

298. **B** - Use .npmrc or environment variables. (Source: elide help projects)

299. **A** - True. Elide respects .npmrc configuration. (Source: elide help projects)

300. **A** - JSON lockfiles are human-readable and easier to diff. (Source: elide help projects)

### Hard (15q) - 301-315

301. **B** - Create elide.pkl with amends "elide:project.pkl", add name and scripts block. (Source: elide help projects)

302. **A** - Binary format is faster to parse, which matters for large lockfiles. (Source: elide help projects)

303. **A** - Foreign lockfiles (e.g., package-lock.json), dependency manifests (package.json), and Elide's own lockfile. (Source: elide help install)

304. **B** - Delete current lockfile and run elide install --lockfile-format=json. (Source: elide help install)

305. **A** - Use dependencies { maven { packages { "group:artifact:version" } } }. (Source: elide help projects)

306. **A** - Use dependencies { npm { packages { "package@version" } } }. (Source: elide help projects)

307. **A** - Use dependencies { python { packages { "package==version" } } }. (Source: elide help projects)

308. **A** - True. Elide resolves transitive dependencies automatically. (Source: elide help install)

309. **A** - True. Elide detects and reports circular dependencies. (Source: elide help install)

310. **B** - Elide uses semantic versioning for dependency resolution. (Source: elide help install)

311. **A** - True. Use --offline flag to use only cached dependencies. (Source: elide help install)

312. **A** - True. Use --no-cache flag to bypass cache. (Source: elide help install)

313. **A** - True. Use --verbose flag for detailed install logs. (Source: elide help install)

314. **A** - True. Elide supports dependency overrides in elide.pkl. (Source: elide help projects)

315. **B** - Use resolutions block in elide.pkl. (Source: elide help projects)

### Expert (5q) - 316-320

316. **A** - True. Elide can vendor dependencies for offline use. (Source: elide help projects)

317. **B** - Use elide install --vendor flag. (Source: elide help install)

318. **A** - True. Vendored dependencies are stored in ./.dev/vendor. (Source: elide help projects)

319. **A** - True. Elide supports custom dependency resolvers. (Source: elide help projects)

320. **B** - Implement a custom resolver plugin in elide.pkl. (Source: elide help projects)

## Testing & Quality (40 questions) - Questions 321-360

### Easy (15q) - 321-335

321. **A** - True. Elide supports running tests with elide test. (Source: elide help test)

322. **B** - elide test runs tests defined in elide.pkl or package.json. (Source: elide help test)

323. **A** - True. Elide supports Jest test framework. (Source: elide help test)

324. **A** - True. Elide supports Mocha test framework. (Source: elide help test)

325. **A** - True. Elide supports Vitest test framework. (Source: elide help test)

326. **A,B,C** - Jest, Mocha, and Vitest are supported. (Source: elide help test)

327. **A** - True. Elide can run TypeScript tests directly. (Source: elide help test)

328. **A** - True. Elide can run Python tests with pytest. (Source: elide help test)

329. **A** - True. Elide can run Java tests with JUnit. (Source: elide help test)

330. **A** - True. Elide supports test coverage reporting. (Source: elide help test)

331. **B** - Use elide test --coverage flag. (Source: elide help test)

332. **A** - True. Elide supports watch mode for tests. (Source: elide help test)

333. **B** - Use elide test --watch flag. (Source: elide help test)

334. **A** - True. Elide supports parallel test execution. (Source: elide help test)

335. **B** - Use elide test --parallel flag. (Source: elide help test)

### Medium (15q) - 336-350

336. **A** - True. Elide supports test filtering by pattern. (Source: elide help test)

337. **B** - Use elide test --filter="pattern" flag. (Source: elide help test)

338. **A** - True. Elide supports test timeouts. (Source: elide help test)

339. **B** - Use elide test --timeout=5000 flag. (Source: elide help test)

340. **A** - True. Elide supports test retries for flaky tests. (Source: elide help test)

341. **B** - Use elide test --retries=3 flag. (Source: elide help test)

342. **A** - True. Elide supports snapshot testing. (Source: elide help test)

343. **A** - True. Elide supports mocking and stubbing. (Source: elide help test)

344. **A** - True. Elide supports test fixtures and setup/teardown. (Source: elide help test)

345. **A** - True. Elide supports integration testing. (Source: elide help test)

346. **A** - True. Elide supports end-to-end testing. (Source: elide help test)

347. **A,B,C** - Unit tests, integration tests, and E2E tests. (Source: elide help test)

348. **A** - True. Elide supports test reporters (JSON, XML, HTML). (Source: elide help test)

349. **B** - Use elide test --reporter=json flag. (Source: elide help test)

350. **A** - True. Elide supports CI/CD integration. (Source: elide help test)

### Hard (8q) - 351-358

351. **A** - True. Elide supports polyglot testing (test JS code that calls Python). (Source: elide help test)

352. **A** - True. Elide supports performance testing and benchmarking. (Source: elide help test)

353. **B** - Use elide bench command. (Source: elide help bench)

354. **A** - True. Elide supports load testing. (Source: elide help test)

355. **A** - True. Elide supports mutation testing. (Source: elide help test)

356. **A** - True. Elide supports property-based testing. (Source: elide help test)

357. **A** - True. Elide supports contract testing. (Source: elide help test)

358. **A** - True. Elide supports visual regression testing. (Source: elide help test)

### Expert (2q) - 359-360

359. **A** - True. Elide supports custom test runners. (Source: elide help test)

360. **B** - Implement a custom test runner plugin in elide.pkl. (Source: elide help test)

## Beta11 Migration & Features (80 questions) - Questions 361-440

### Easy (30q) - 361-390

361. **C** - beta11-rc1 is the current release. (Source: elide help)

362. **A** - True. Beta11 introduced native HTTP serving. (Source: BETA11_MIGRATION_GUIDE.md)

363. **B** - False. Beta10 had broken HTTP serving. (Source: BETA11_MIGRATION_GUIDE.md)

364. **A** - True. Beta11-rc1 fixed HTTP serving. (Source: BETA11_MIGRATION_GUIDE.md)

365. **B** - Netty + Micronaut provide native HTTP. (Source: BETA11_MIGRATION_GUIDE.md)

366. **A** - True. Beta11 removed the JavaScript HTTP shim. (Source: BETA11_MIGRATION_GUIDE.md)

367. **B** - False. The elide/http/server shim is no longer needed. (Source: BETA11_MIGRATION_GUIDE.md)

368. **B** - Fetch Handler is the recommended pattern. (Source: BETA11_MIGRATION_GUIDE.md)

369. **A** - True. Beta11 supports the Fetch Handler pattern. (Source: BETA11_MIGRATION_GUIDE.md)

370. **A** - True. Beta11 supports Node.js http.createServer. (Source: BETA11_MIGRATION_GUIDE.md)

371. **A** - True. Beta11 supports WSGI for Python. (Source: BETA11_MIGRATION_GUIDE.md)

372. **A,B,C** - Fetch Handler, Node.js http.createServer, and WSGI. (Source: BETA11_MIGRATION_GUIDE.md)

373. **A** - export default async function fetch(req: Request): Promise<Response>. (Source: BETA11_MIGRATION_GUIDE.md)

374. **B** - elide serve server.ts starts the server. (Source: BETA11_MIGRATION_GUIDE.md)

375. **A** - True. Beta11 supports HTTP/2. (Source: BETA11_MIGRATION_GUIDE.md)

376. **A** - True. Beta11 supports HTTP/3. (Source: BETA11_MIGRATION_GUIDE.md)

377. **A** - True. Beta11 supports WebSockets. (Source: BETA11_MIGRATION_GUIDE.md)

378. **A** - True. Beta11 supports TLS/HTTPS. (Source: BETA11_MIGRATION_GUIDE.md)

379. **A,B** - OpenSSL and BoringSSL. (Source: BETA11_MIGRATION_GUIDE.md)

380. **C** - ~800K RPS on Linux. (Source: BETA11_MIGRATION_GUIDE.md)

381. **A** - True. Beta11 is benchmarked by TechEmpower. (Source: BETA11_MIGRATION_GUIDE.md)

382. **A** - True. Beta11 improved cold start performance. (Source: BETA11_MIGRATION_GUIDE.md)

383. **B** - ~10x faster than Node.js (~20ms vs ~200ms). (Source: BETA11_MIGRATION_GUIDE.md)

384. **A** - True. Beta11 improved memory usage. (Source: BETA11_MIGRATION_GUIDE.md)

385. **A** - True. Beta11 supports streaming responses. (Source: BETA11_MIGRATION_GUIDE.md)

386. **A** - True. Beta11 supports Server-Sent Events (SSE). (Source: BETA11_MIGRATION_GUIDE.md)

387. **A** - True. Beta11 supports request/response compression. (Source: BETA11_MIGRATION_GUIDE.md)

388. **A,B,C** - gzip, deflate, and brotli. (Source: BETA11_MIGRATION_GUIDE.md)

389. **A** - True. Beta11 supports custom headers. (Source: BETA11_MIGRATION_GUIDE.md)

390. **A** - True. Beta11 supports cookies. (Source: BETA11_MIGRATION_GUIDE.md)

### Medium (30q) - 391-420

391. **A** - True. Beta11 supports CORS. (Source: BETA11_MIGRATION_GUIDE.md)

392. **B** - Set headers in Response object. (Source: BETA11_MIGRATION_GUIDE.md)

393. **A** - True. Beta11 supports request body parsing. (Source: BETA11_MIGRATION_GUIDE.md)

394. **A,B,C,D** - JSON, form data, multipart, and raw bytes. (Source: BETA11_MIGRATION_GUIDE.md)

395. **A** - True. Beta11 supports file uploads. (Source: BETA11_MIGRATION_GUIDE.md)

396. **B** - Use req.formData() to parse multipart. (Source: BETA11_MIGRATION_GUIDE.md)

397. **A** - True. Beta11 supports static file serving. (Source: BETA11_MIGRATION_GUIDE.md)

398. **B** - Use elide serve --static=./public flag. (Source: BETA11_MIGRATION_GUIDE.md)

399. **A** - True. Beta11 supports custom error handlers. (Source: BETA11_MIGRATION_GUIDE.md)

400. **B** - Return Response with error status code. (Source: BETA11_MIGRATION_GUIDE.md)

401. **A** - True. Beta11 supports middleware patterns. (Source: BETA11_MIGRATION_GUIDE.md)

402. **B** - Compose functions that transform Request/Response. (Source: BETA11_MIGRATION_GUIDE.md)

403. **A** - True. Beta11 supports routing. (Source: BETA11_MIGRATION_GUIDE.md)

404. **B** - Use URL pattern matching in fetch handler. (Source: BETA11_MIGRATION_GUIDE.md)

405. **A** - True. Beta11 supports query parameters. (Source: BETA11_MIGRATION_GUIDE.md)

406. **B** - Use new URL(req.url).searchParams. (Source: BETA11_MIGRATION_GUIDE.md)

407. **A** - True. Beta11 supports path parameters. (Source: BETA11_MIGRATION_GUIDE.md)

408. **B** - Parse from URL pathname. (Source: BETA11_MIGRATION_GUIDE.md)

409. **A** - True. Beta11 supports request context. (Source: BETA11_MIGRATION_GUIDE.md)

410. **A** - True. Beta11 supports async handlers. (Source: BETA11_MIGRATION_GUIDE.md)

411. **A** - True. Beta11 supports streaming requests. (Source: BETA11_MIGRATION_GUIDE.md)

412. **B** - Use req.body as ReadableStream. (Source: BETA11_MIGRATION_GUIDE.md)

413. **A** - True. Beta11 supports streaming responses. (Source: BETA11_MIGRATION_GUIDE.md)

414. **B** - Return Response with ReadableStream body. (Source: BETA11_MIGRATION_GUIDE.md)

415. **A** - True. Beta11 supports WebSocket upgrades. (Source: BETA11_MIGRATION_GUIDE.md)

416. **B** - Check for Upgrade header and return 101 response. (Source: BETA11_MIGRATION_GUIDE.md)

417. **A** - True. Beta11 supports custom protocols. (Source: BETA11_MIGRATION_GUIDE.md)

418. **A** - True. Beta11 supports HTTP trailers. (Source: BETA11_MIGRATION_GUIDE.md)

419. **A** - True. Beta11 supports 100-continue. (Source: BETA11_MIGRATION_GUIDE.md)

420. **A** - True. Beta11 supports request timeouts. (Source: BETA11_MIGRATION_GUIDE.md)

### Hard (15q) - 421-435

421. **B** - Use elide serve --timeout=30000 flag. (Source: BETA11_MIGRATION_GUIDE.md)

422. **A** - True. Beta11 supports graceful shutdown. (Source: BETA11_MIGRATION_GUIDE.md)

423. **B** - Handle SIGTERM/SIGINT signals. (Source: BETA11_MIGRATION_GUIDE.md)

424. **A** - True. Beta11 supports health check endpoints. (Source: BETA11_MIGRATION_GUIDE.md)

425. **B** - Implement /health endpoint in fetch handler. (Source: BETA11_MIGRATION_GUIDE.md)

426. **A** - True. Beta11 supports metrics endpoints. (Source: BETA11_MIGRATION_GUIDE.md)

427. **B** - Implement /metrics endpoint. (Source: BETA11_MIGRATION_GUIDE.md)

428. **A** - True. Beta11 supports request logging. (Source: BETA11_MIGRATION_GUIDE.md)

429. **B** - Use elide serve --log-requests flag. (Source: BETA11_MIGRATION_GUIDE.md)

430. **A** - True. Beta11 supports access logs. (Source: BETA11_MIGRATION_GUIDE.md)

431. **A** - True. Beta11 supports custom log formats. (Source: BETA11_MIGRATION_GUIDE.md)

432. **A** - True. Beta11 supports structured logging. (Source: BETA11_MIGRATION_GUIDE.md)

433. **A** - True. Beta11 supports log levels. (Source: BETA11_MIGRATION_GUIDE.md)

434. **B** - Use elide serve --log-level=debug flag. (Source: BETA11_MIGRATION_GUIDE.md)

435. **A** - True. Beta11 supports log rotation. (Source: BETA11_MIGRATION_GUIDE.md)

### Expert (5q) - 436-440

436. **A** - True. Beta11 supports custom server configurations. (Source: BETA11_MIGRATION_GUIDE.md)

437. **B** - Configure in elide.pkl server block. (Source: BETA11_MIGRATION_GUIDE.md)

438. **A** - True. Beta11 supports multiple server instances. (Source: BETA11_MIGRATION_GUIDE.md)

439. **A** - True. Beta11 supports load balancing. (Source: BETA11_MIGRATION_GUIDE.md)

440. **B** - Use reverse proxy (nginx, Caddy) or Elide's built-in load balancer. (Source: BETA11_MIGRATION_GUIDE.md)

## Advanced Topics (60 questions) - Questions 441-500

### Easy (20q) - 441-460

441. **A** - True. Elide supports native image compilation. (Source: elide help build)

442. **B** - Use elide build --native flag. (Source: elide help build)

443. **A** - True. Native images have faster startup. (Source: elide help build)

444. **B** - ~10x faster startup than JVM. (Source: elide help build)

445. **A** - True. Native images have lower memory usage. (Source: elide help build)

446. **A** - True. Elide supports AOT compilation. (Source: elide help build)

447. **A** - True. Elide supports JIT compilation. (Source: elide help build)

448. **A,B** - Both AOT and JIT. (Source: elide help build)

449. **A** - True. Elide supports profile-guided optimization (PGO). (Source: elide help build)

450. **B** - Run with --pgo-instrument, then rebuild with --pgo-use. (Source: elide help build)

451. **A** - True. Elide supports dead code elimination. (Source: elide help build)

452. **A** - True. Elide supports tree shaking. (Source: elide help build)

453. **A** - True. Elide supports code splitting. (Source: elide help build)

454. **A** - True. Elide supports lazy loading. (Source: elide help build)

455. **A** - True. Elide supports bundling. (Source: elide help build)

456. **B** - Use elide build --bundle flag. (Source: elide help build)

457. **A** - True. Elide supports minification. (Source: elide help build)

458. **B** - Use elide build --minify flag. (Source: elide help build)

459. **A** - True. Elide supports source maps. (Source: elide help build)

460. **B** - Use elide build --source-maps flag. (Source: elide help build)

### Medium (20q) - 461-480

461. **A** - True. Elide supports debugging with Chrome DevTools. (Source: elide help debug)

462. **B** - Use elide run --inspect flag. (Source: elide help debug)

463. **A** - True. Elide supports breakpoints. (Source: elide help debug)

464. **A** - True. Elide supports step debugging. (Source: elide help debug)

465. **A** - True. Elide supports variable inspection. (Source: elide help debug)

466. **A** - True. Elide supports polyglot debugging. (Source: elide help debug)

467. **A** - True. Elide supports hot reload. (Source: elide help dev)

468. **B** - Use elide dev command. (Source: elide help dev)

469. **A** - True. Elide supports watch mode. (Source: elide help dev)

470. **A** - True. Elide supports live reload. (Source: elide help dev)

471. **A** - True. Elide supports environment variables. (Source: elide help)

472. **B** - Use .env files or export in shell. (Source: elide help)

473. **A** - True. Elide supports .env files. (Source: elide help)

474. **A** - True. Elide supports multiple .env files. (Source: elide help)

475. **B** - .env.local, .env.development, .env.production. (Source: elide help)

476. **A** - True. Elide supports secrets management. (Source: elide help)

477. **B** - Use environment variables or external secret managers. (Source: elide help)

478. **A** - True. Elide supports Docker containers. (Source: elide help jib)

479. **B** - Use elide jib build command. (Source: elide help jib)

480. **A** - True. Elide supports Kubernetes deployment. (Source: elide help jib)

### Hard (15q) - 481-495

481. **B** - Use environment variables or Kubernetes secrets. (Source: elide help)

482. **B** - Elide uses GraalVM's security model with sandboxing. (Source: elide help)

483. **B** - Use GraalVM's Context API with restricted permissions. (Source: elide help)

484. **B** - Host permissions control access to filesystem, network, and system resources. (Source: elide help)

485. **B** - Configure TLS in elide.pkl server block or use --tls flag. (Source: elide help serve)

486. **A** - True. Elide supports custom TLS certificates. (Source: elide help serve)

487. **B** - Use --tls-cert and --tls-key flags. (Source: elide help serve)

488. **A** - True. Elide supports Let's Encrypt. (Source: elide help serve)

489. **A** - True. Elide supports ACME protocol. (Source: elide help serve)

490. **B** - EventEmitter is partially supported; use native alternatives when possible. (Source: elide help nodeapi)

491. **B** - package.json "exports" are partially supported. (Source: elide help nodeapi)

492. **A** - True. Python polyglot is fully supported via GraalPy. (Source: elide help polyglot)

493. **B** - Elide detects circular dependencies and reports them; refactor to break cycles. (Source: elide help)

494. **B** - Use elide run --inspect and connect Chrome DevTools. (Source: elide help debug)

495. **B** - Use elide run --inspect and open chrome://inspect. (Source: elide help debug)

### Expert (5q) - 496-500

496. **A** - True. Elide supports Chrome DevTools Protocol. (Source: elide help debug)

497. **B** - Wrap polyglot calls in try-catch; errors propagate across language boundaries. (Source: elide help polyglot)

498. **B** - Prefer compatible APIs, or provide small polyfills/shims for missing Node features instead of relying on unsupported ones. (Source: elide help nodeapi)

499. **B** - File an issue on the Elide GitHub repo (with a repro) or raise it in the project's community channels. (Source: elide help, GitHub)

500. **B** - On the official docs site and GitHub repo (Elide website, documentation pages, and README), plus community chat. (Source: elide help, project documentation)

