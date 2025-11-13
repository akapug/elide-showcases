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

*[Answers 261-500 continue with same format and detail level]*

**Note:** This is a partial answer key. Full answer key with all 500 answers will be completed in subsequent edits. Each answer includes:
- Correct answer
- Brief explanation
- Source reference (help file, showcase, or documentation)


# Elide Expert Quiz - Answer Key (Continuation 261-500)

## Projects & Dependencies (60 questions)

### Easy (20q)

261. **B** - elide.pkl defines an Elide project. (Source: elide help projects)

262. **C** - Pkl (Apple's configuration language). (Source: elide help projects)

263. **A** - True. elide.pkl can declare npm dependencies in the dependencies.npm block. (Source: elide help projects)

264. **A** - True. elide.pkl can declare Maven dependencies in the dependencies.maven block. (Source: elide help projects)

265. **A** - True. elide.pkl can declare PyPI dependencies. (Source: elide help projects)

266. **A,B,C,D** - Elide supports npm, Maven, PyPI, Rubygems, and HuggingFace. (Source: elide help projects)

267. **A** - True. Elide can use existing package.json for dependencies and tasks. (Source: elide help projects)

268. **A** - True. Elide can use existing pyproject.toml for dependencies and tasks. (Source: elide help projects)

269. **A** - True. Elide can use existing requirements.txt for dependencies. (Source: elide help projects)

270. **B** - Binary (.lock.bin) is the default lockfile format. (Source: elide help lockfiles)

271. **B** - ./.dev/elide.lock.bin is the default location. (Source: elide help lockfiles)

272. **B** - False. Elide lockfiles are not machine-specific; paths are resolvable on any machine. (Source: elide help lockfiles)

273. **A** - True. Elide can read package-lock.json as a foreign lockfile. (Source: elide help lockfiles)

274. **B** - elide init creates a new project interactively. (Source: elide help projects)

275. **B** - amends "elide:project.pkl" is the first line. (Source: elide help projects)

276. **A** - True. Elide projects can have scripts defined in the scripts block. (Source: elide help projects)

277. **A** - elide install installs project dependencies. (Source: elide help projects)

278. **A** - elide build builds the project. (Source: elide help projects)

279. **A** - elide test runs project tests. (Source: elide help projects)

280. **B** - JSON lockfile format can be selected with format = "json" in the lockfile block. (Source: elide help lockfiles)

### Medium (20q)

281. **B** - Use dependencies { maven { packages { "group:artifact" } } } syntax. (Source: elide help projects)

282. **B** - Use dependencies { npm { packages { "package@version" } } } syntax. (Source: elide help projects)

283. **B** - Use dependencies { npm { devPackages { "package" } } } syntax. (Source: elide help projects)

284. **B** - Use scripts { ["name"] = "command" } syntax. (Source: elide help projects)

285. **A** - True. Elide automatically installs dependencies when needed. (Source: elide help projects)

286. **B** - Binary lockfiles are faster to parse. (Source: elide help lockfiles)

287. **A** - True. Lockfiles store fingerprints of foreign lockfiles, dependency manifests, and dependency inputs. (Source: elide help lockfiles)

288. **B** - Pass --lockfile-format=json to elide install. (Source: elide help lockfiles)

289. **A** - True. Elide caches dependencies for later use. (Source: elide help projects)

290. **B** - The dev root is typically ./.dev. (Source: elide help lockfiles)

291. **A** - True. Elide can organize source code and build tasks. (Source: elide help projects)

292. **A** - True. Elide can define and configure artifacts. (Source: elide help projects)

293. **A** - True. Elide can gather and run tests. (Source: elide help projects)

294. **B** - Lockfile content may change based on which ecosystems you use. (Source: elide help lockfiles)

295. **A** - True. Scripts work with package.json and other manifest types. (Source: elide help projects)

296. **B** - Use elide project to interact with your project. (Source: elide help projects)

297. **A** - True. Elide supports HuggingFace dependencies. (Source: elide help projects)

298. **B** - Lockfiles store paths that are resolvable on any machine using Elide. (Source: elide help lockfiles)

299. **A** - True. You can declare arbitrary tasks in the build graph. (Source: elide help projects)

300. **B** - JSON lockfiles are human-readable and easier to diff. (Source: elide help lockfiles)

### Hard (20q)

301. **Answer:** Create elide.pkl with amends "elide:project.pkl", add name and dependencies blocks. (Source: elide help projects)

302. **Answer:** Binary format is faster to parse, which matters because lockfiles are read on every Elide invocation. (Source: elide help lockfiles)

303. **Answer:** Foreign lockfiles (e.g., package-lock.json), dependency manifests (e.g., package.json), and dependency inputs (JARs, etc.). (Source: elide help lockfiles)

304. **Answer:** Delete current lockfile and run elide install --lockfile-format=json, or add lockfile { format = "json" } to elide.pkl. (Source: elide help lockfiles)

305. **Answer:** Use dependencies { maven { packages { "group:artifact:version" } } } in elide.pkl. (Source: elide help projects)

306. **Answer:** Use dependencies { npm { packages { "package@version" } devPackages { "dev-package" } } } in elide.pkl. (Source: elide help projects)

307. **Answer:** Use scripts { ["script-name"] = "command to run" } in elide.pkl. (Source: elide help projects)

308. **Answer:** Elide reads package.json for dependencies and scripts, making it compatible with existing Node projects. (Source: elide help projects)

309. **Answer:** Elide reads pyproject.toml for dependencies and tasks, making it compatible with existing Python projects. (Source: elide help projects)

310. **Answer:** Elide reads requirements.txt for Python dependencies. (Source: elide help projects)

311. **Answer:** Run elide init and follow the interactive prompts. (Source: elide help projects)

312. **Answer:** Lockfiles ensure reproducible builds by storing exact dependency versions and fingerprints. (Source: elide help lockfiles)

313. **Answer:** The dev root (typically ./.dev) stores lockfiles and other development artifacts. (Source: elide help lockfiles)

314. **Answer:** Elide automatically installs dependencies when running code, or manually with elide install. (Source: elide help projects)

315. **Answer:** Use elide build to build the project according to its configuration. (Source: elide help projects)

316. **Answer:** Use elide test to run tests defined in the project. (Source: elide help projects)

317. **Answer:** Elide caches dependencies in a shared cache for reuse across projects. (Source: elide help projects)

318. **Answer:** Lockfiles are not machine-specific; paths are portable across machines using Elide. (Source: elide help lockfiles)

319. **Answer:** Elide supports Maven, npm, PyPI, Rubygems, and HuggingFace ecosystems. (Source: elide help projects)

320. **Answer:** Use elide project to view and interact with project configuration. (Source: elide help projects)

## Testing & Quality (40 questions)

### Easy (15q)

321. **A** - elide test runs project tests. (Source: elide help projects)

322. **A** - True. Elide can gather and run tests. (Source: elide help projects)

323. **B** - Jacoco is included for JVM code coverage. (Source: elide help jvm)

324. **A** - True. Elide embeds testing tools. (Source: elide help jvm)

325. **B** - False. Tests are defined in the project configuration or test files. (Source: elide help projects)

326. **A** - True. Elide can run tests from package.json scripts. (Source: elide help projects)

327. **A** - True. Elide can run tests from pyproject.toml. (Source: elide help projects)

328. **B** - Use elide test to run all tests. (Source: elide help projects)

329. **A** - True. Elide supports test frameworks for multiple languages. (Source: elide help projects)

330. **B** - Jacoco provides code coverage for JVM languages. (Source: elide help jvm)

331. **A** - True. Elide can generate test reports. (Source: elide help projects)

332. **B** - Tests are organized according to the project structure. (Source: elide help projects)

333. **A** - True. Elide can run unit tests. (Source: elide help projects)

334. **A** - True. Elide can run integration tests. (Source: elide help projects)

335. **B** - Test configuration is defined in elide.pkl or project manifests. (Source: elide help projects)

### Medium (15q)

336. **B** - Use elide test with appropriate configuration in elide.pkl. (Source: elide help projects)

337. **A** - True. Jacoco is included with Elide for JVM code coverage. (Source: elide help jvm)

338. **B** - Configure tests in the project's test configuration block. (Source: elide help projects)

339. **A** - True. Elide can run tests defined in package.json scripts. (Source: elide help projects)

340. **B** - Use standard test frameworks for each language (JUnit for Java, pytest for Python, etc.). (Source: elide help projects)

341. **A** - True. Elide supports multiple test frameworks. (Source: elide help projects)

342. **B** - Test results are output according to the test framework's configuration. (Source: elide help projects)

343. **A** - True. Elide can generate coverage reports with Jacoco. (Source: elide help jvm)

344. **B** - Configure test paths in the project configuration. (Source: elide help projects)

345. **A** - True. Elide can run tests in parallel. (Source: elide help projects)

346. **B** - Use elide test with specific test selectors. (Source: elide help projects)

347. **A** - True. Elide supports test filtering. (Source: elide help projects)

348. **B** - Configure test timeouts in the test configuration. (Source: elide help projects)

349. **A** - True. Elide can watch for changes and re-run tests. (Source: elide help projects)

350. **B** - Use standard assertion libraries for each language. (Source: elide help projects)

### Hard (10q)

351. **Answer:** Configure test tasks in elide.pkl and run with elide test. (Source: elide help projects)

352. **Answer:** Jacoco provides instrumentation and reporting for JVM code coverage. (Source: elide help jvm)

353. **Answer:** Define test paths, frameworks, and configuration in elide.pkl's test block. (Source: elide help projects)

354. **Answer:** Elide runs tests defined in package.json scripts section. (Source: elide help projects)

355. **Answer:** Use JUnit for Java, pytest for Python, Jest for JavaScript, etc. (Source: elide help projects)

356. **Answer:** Configure parallel test execution in the test configuration block. (Source: elide help projects)

357. **Answer:** Use test selectors or filters to run specific tests. (Source: elide help projects)

358. **Answer:** Configure test timeouts in the test configuration to prevent hanging tests. (Source: elide help projects)

359. **Answer:** Use watch mode to automatically re-run tests on file changes. (Source: elide help projects)

360. **Answer:** Elide generates test reports in standard formats (JUnit XML, etc.). (Source: elide help projects)

## Beta11 Migration & Features (80 questions)

### Easy (30q)

361. **B** - 1.0.0-beta11-rc1 is the current version. (Source: elide --version)

362. **A** - True. Beta11-rc1 introduces native HTTP server support. (Source: BETA11_MIGRATION_GUIDE.md)

363. **B** - False. The elide/http/server shim is no longer needed in beta11. (Source: BETA11_MIGRATION_GUIDE.md)

364. **A** - export default async function fetch(req: Request): Promise<Response> (Source: BETA11_MIGRATION_GUIDE.md)

365. **B** - elide serve server.ts starts the server. (Source: BETA11_MIGRATION_GUIDE.md, elide help servers)

366. **A** - True. Beta11 has native HTTP server support via Netty and Micronaut. (Source: elide help servers)

367. **B** - False. No imports are needed for the fetch handler pattern. (Source: BETA11_MIGRATION_GUIDE.md)

368. **A** - True. Beta11 supports the Node.js http.createServer API. (Source: BETA11_MIGRATION_GUIDE.md)

369. **A** - True. Beta11 supports WSGI for Python Flask/Django with --wsgi flag. (Source: BETA11_MIGRATION_GUIDE.md)

370. **B** - Netty and Micronaut power the built-in server. (Source: elide help servers)

371. **A** - True. Beta11 eliminates shim overhead. (Source: BETA11_MIGRATION_GUIDE.md)

372. **B** - Faster startup times and better memory efficiency. (Source: BETA11_MIGRATION_GUIDE.md)

373. **A** - True. HTTP/2, HTTP/3, and WebSockets are supported. (Source: elide help servers)

374. **B** - TLS is supported via OpenSSL or BoringSSL. (Source: elide help servers)

375. **A** - True. Non-blocking I/O is used by default. (Source: elide help servers)

376. **B** - About 800K RPS on Linux with native transports. (Source: elide help servers)

377. **A** - True. Elide is benchmarked by TechEmpower. (Source: elide help servers)

378. **B** - Remove the import and use export default async function fetch. (Source: BETA11_MIGRATION_GUIDE.md)

379. **A** - True. The fetch handler pattern is the recommended approach. (Source: BETA11_MIGRATION_GUIDE.md)

380. **B** - Use --wsgi flag with elide serve. (Source: BETA11_MIGRATION_GUIDE.md)

381. **A** - True. Beta11 supports Python WSGI applications. (Source: BETA11_MIGRATION_GUIDE.md)

382. **B** - Use import.meta.url.includes("server.ts") to detect if running as server. (Source: BETA11_MIGRATION_GUIDE.md)

383. **A** - True. Beta11 has native HTTP support, no shims needed. (Source: BETA11_MIGRATION_GUIDE.md)

384. **B** - The native implementation eliminates shim overhead. (Source: BETA11_MIGRATION_GUIDE.md)

385. **A** - True. Beta11 has faster startup times than beta10. (Source: BETA11_MIGRATION_GUIDE.md)

386. **B** - Better memory efficiency due to native implementation. (Source: BETA11_MIGRATION_GUIDE.md)

387. **A** - True. Beta11 supports the full Node.js http.createServer API. (Source: BETA11_MIGRATION_GUIDE.md)

388. **B** - Use new Response(body, { status, headers }) pattern. (Source: BETA11_MIGRATION_GUIDE.md)

389. **A** - True. Request and Response are standard Web APIs. (Source: BETA11_MIGRATION_GUIDE.md)

390. **B** - Use elide serve with the entrypoint file. (Source: elide help servers, BETA11_MIGRATION_GUIDE.md)

### Medium (30q)

391. **Answer:** Remove import { serve } from "elide/http/server" and use export default async function fetch pattern. (Source: BETA11_MIGRATION_GUIDE.md)

392. **Answer:** export default async function fetch(req: Request): Promise<Response> { return new Response("Hello"); } (Source: BETA11_MIGRATION_GUIDE.md)

393. **Answer:** Use import http from "node:http"; http.createServer((req, res) => { res.end("Hello"); }).listen(3000); (Source: BETA11_MIGRATION_GUIDE.md)

394. **Answer:** Use --wsgi flag: elide serve --wsgi app.py (Source: BETA11_MIGRATION_GUIDE.md)

395. **Answer:** Netty provides non-blocking I/O and HTTP protocol support. (Source: elide help servers)

396. **Answer:** Micronaut provides dependency injection and application framework. (Source: elide help servers)

397. **Answer:** Native transports on Linux enable ~800K RPS performance. (Source: elide help servers)

398. **Answer:** TechEmpower benchmarks Elide's HTTP performance independently. (Source: elide help servers)

399. **Answer:** HTTP/2, HTTP/3, and WebSockets are supported. (Source: elide help servers)

400. **Answer:** OpenSSL or BoringSSL provide TLS support. (Source: elide help servers)

401. **Answer:** Non-blocking I/O is used by default for better performance. (Source: elide help servers)

402. **Answer:** The fetch handler pattern is simpler and more declarative. (Source: BETA11_MIGRATION_GUIDE.md)

403. **Answer:** No imports are needed; the fetch function is the entry point. (Source: BETA11_MIGRATION_GUIDE.md)

404. **Answer:** Use if (import.meta.url.includes("server.ts")) { console.log(...) } (Source: BETA11_MIGRATION_GUIDE.md)

405. **Answer:** Native implementation eliminates JavaScript shim overhead. (Source: BETA11_MIGRATION_GUIDE.md)

406. **Answer:** Faster startup, better memory efficiency, and higher throughput. (Source: BETA11_MIGRATION_GUIDE.md)

407. **Answer:** WSGI support enables running Flask and Django apps natively. (Source: BETA11_MIGRATION_GUIDE.md)

408. **Answer:** Use const url = new URL(req.url) to parse the request URL. (Source: BETA11_MIGRATION_GUIDE.md)

409. **Answer:** Use new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } }) (Source: BETA11_MIGRATION_GUIDE.md)

410. **Answer:** Use req.method to check the HTTP method (GET, POST, etc.). (Source: BETA11_MIGRATION_GUIDE.md)

411. **Answer:** Use req.headers.get("header-name") to access request headers. (Source: BETA11_MIGRATION_GUIDE.md)

412. **Answer:** Use new Response(body, { status: 404 }) to set status codes. (Source: BETA11_MIGRATION_GUIDE.md)

413. **Answer:** Use new Response(body, { headers: { "Key": "Value" } }) to set response headers. (Source: BETA11_MIGRATION_GUIDE.md)

414. **Answer:** Use await req.json() to parse JSON request bodies. (Source: BETA11_MIGRATION_GUIDE.md)

415. **Answer:** Use await req.text() to read text request bodies. (Source: BETA11_MIGRATION_GUIDE.md)

416. **Answer:** Use await req.formData() to parse form data. (Source: BETA11_MIGRATION_GUIDE.md)

417. **Answer:** Use req.url to get the full request URL. (Source: BETA11_MIGRATION_GUIDE.md)

418. **Answer:** Use new URL(req.url).pathname to get the path. (Source: BETA11_MIGRATION_GUIDE.md)

419. **Answer:** Use new URL(req.url).searchParams to access query parameters. (Source: BETA11_MIGRATION_GUIDE.md)

420. **Answer:** Return new Response(null, { status: 204 }) for no content. (Source: BETA11_MIGRATION_GUIDE.md)

### Hard (20q)

421. **Answer:** Create export default async function fetch(req: Request): Promise<Response>, parse URL, route based on pathname, return appropriate Response. (Source: BETA11_MIGRATION_GUIDE.md)

422. **Answer:** Use http.createServer((req, res) => { /* handle */ }).listen(port) with import http from "node:http". (Source: BETA11_MIGRATION_GUIDE.md)

423. **Answer:** Create Flask app, run with elide serve --wsgi app.py where app.py contains the WSGI application. (Source: BETA11_MIGRATION_GUIDE.md)

424. **Answer:** Netty provides the underlying non-blocking I/O and protocol implementation; Micronaut provides the application framework and DI. (Source: elide help servers)

425. **Answer:** Native transports use OS-specific optimizations (epoll on Linux) for maximum performance. (Source: elide help servers)

426. **Answer:** TechEmpower runs standardized benchmarks across frameworks; Elide achieves ~800K RPS on Linux. (Source: elide help servers)

427. **Answer:** HTTP/2 multiplexing, HTTP/3 QUIC transport, WebSocket bidirectional communication. (Source: elide help servers)

428. **Answer:** OpenSSL is the standard; BoringSSL is Google's fork with additional optimizations. (Source: elide help servers)

429. **Answer:** Non-blocking I/O allows handling many concurrent connections without thread-per-connection overhead. (Source: elide help servers)

430. **Answer:** Fetch handler is declarative and simple; Node.js API provides more control and compatibility. (Source: BETA11_MIGRATION_GUIDE.md)

431. **Answer:** Parse URL, check pathname, switch on routes, return appropriate Response with status and headers. (Source: BETA11_MIGRATION_GUIDE.md)

432. **Answer:** Use try/catch around await req.json(), return 400 Bad Request on parse errors. (Source: BETA11_MIGRATION_GUIDE.md)

433. **Answer:** Check req.method, return 405 Method Not Allowed for unsupported methods. (Source: BETA11_MIGRATION_GUIDE.md)

434. **Answer:** Use req.headers.get("Authorization"), validate token, return 401 Unauthorized if invalid. (Source: BETA11_MIGRATION_GUIDE.md)

435. **Answer:** Set CORS headers: Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers. (Source: BETA11_MIGRATION_GUIDE.md)

436. **Answer:** Handle OPTIONS preflight requests, return 200 with CORS headers. (Source: BETA11_MIGRATION_GUIDE.md)

437. **Answer:** Use ReadableStream for response body to stream data incrementally. (Source: BETA11_MIGRATION_GUIDE.md)

438. **Answer:** Set Content-Type: text/event-stream, send SSE-formatted chunks. (Source: BETA11_MIGRATION_GUIDE.md)

439. **Answer:** Use Response.redirect(url, status) or new Response(null, { status: 302, headers: { Location: url } }). (Source: BETA11_MIGRATION_GUIDE.md)

440. **Answer:** Set Set-Cookie header in response headers with appropriate attributes (HttpOnly, Secure, SameSite). (Source: BETA11_MIGRATION_GUIDE.md)

## Advanced Topics (60 questions)

### Easy (20q)

441. **A** - True. Elide is built on GraalVM v25.0.0. (Source: elide help polyglot)

442. **B** - Truffle is the language implementation framework. (Source: elide help polyglot)

443. **A** - True. Languages can interoperate with zero serialization. (Source: elide help polyglot)

444. **B** - Less than 1ms overhead for cross-language calls. (Source: elide help polyglot)

445. **A** - True. Inlining and JIT work across languages. (Source: elide help polyglot)

446. **B** - One garbage collector is shared across all languages. (Source: elide help polyglot)

447. **A** - True. You can import Python modules from JavaScript. (Source: elide help polyglot)

448. **B** - Use import module from "./file.py" syntax. (Source: elide help polyglot)

449. **A** - True. Elide supports JDK 24. (Source: elide help jvm)

450. **B** - Kotlin K2 v2.2.21 is supported. (Source: elide help jvm)

451. **A** - True. javac is embedded in Elide. (Source: elide help jvm)

452. **B** - kotlinc is the Kotlin compiler. (Source: elide help jvm)

453. **A** - True. Elide can be used as JAVA_HOME. (Source: elide help jvm)

454. **B** - Point JAVA_HOME to the folder containing elide. (Source: elide help jvm)

455. **A** - True. Gradle and Maven recognize Elide as Oracle GraalVM at JDK 24. (Source: elide help jvm)

456. **B** - javadoc generates Java documentation. (Source: elide help jvm)

457. **A** - True. jar tool is included for creating Java archives. (Source: elide help jvm)

458. **B** - Jacoco provides JVM code coverage. (Source: elide help jvm)

459. **A** - True. KotlinX libraries are included. (Source: elide help jvm)

460. **B** - coroutines, datetime, html, serialization, serialization.json. (Source: elide help jvm)

### Medium (20q)

461. **Answer:** GraalVM provides the polyglot runtime foundation; Truffle provides the language implementation framework. (Source: elide help polyglot)

462. **Answer:** No serialization occurs; objects are passed directly between languages. (Source: elide help polyglot)

463. **Answer:** JIT compilation and inlining can optimize across language boundaries. (Source: elide help polyglot)

464. **Answer:** One shared garbage collector manages memory for all languages. (Source: elide help polyglot)

465. **Answer:** Use import module from "./file.py" to import Python from JavaScript. (Source: elide help polyglot)

466. **Answer:** Call Python functions directly from JavaScript: module.functionName(args). (Source: elide help polyglot)

467. **Answer:** Point JAVA_HOME to Elide's installation directory. (Source: elide help jvm)

468. **Answer:** Point KOTLIN_HOME to <elide>/resources/kotlin/<version>. (Source: elide help jvm)

469. **Answer:** javac compiles Java, kotlinc compiles Kotlin, both are embedded. (Source: elide help jvm)

470. **Answer:** Use javadoc to generate documentation, jar to create archives. (Source: elide help jvm)

471. **Answer:** Jacoco instruments bytecode and generates coverage reports. (Source: elide help jvm)

472. **Answer:** coroutines, datetime, html, serialization, serialization.json are included. (Source: elide help jvm)

473. **Answer:** KotlinX libraries are automatically included in the classpath. (Source: elide help jvm)

474. **Answer:** Use kotlin { features { kotlinx = false } } in elide.pkl. (Source: elide help jvm)

475. **Answer:** kapt is the Kotlin annotation processor. (Source: elide help jvm)

476. **Answer:** KSP (Kotlin Symbol Processing) is supported. (Source: elide help jvm)

477. **Answer:** Kotlin Scripting compiler is included. (Source: elide help jvm)

478. **Answer:** TypeScript runs directly without a build step. (Source: elide help typescript)

479. **Answer:** Use TypeScript's type system for compile-time checking. (Source: elide help typescript)

480. **Answer:** TSX components can be pre-processed by Elide. (Source: elide help typescript)

### Hard (20q)

481. **Answer:** GraalVM v25.0.0 provides the polyglot runtime; Truffle provides language interop; zero-serialization enables <1ms cross-language calls. (Source: elide help polyglot)

482. **Answer:** Create Python module with functions, import in JavaScript with import module from "./file.py", call functions directly. (Source: elide help polyglot)

483. **Answer:** Objects are passed by reference across languages; no serialization overhead; JIT can inline across boundaries. (Source: elide help polyglot)

484. **Answer:** One GC manages all languages; no per-language GC overhead; cohesive memory management. (Source: elide help polyglot)

485. **Answer:** Point JAVA_HOME to Elide directory; Gradle/Maven recognize it as Oracle GraalVM JDK 24. (Source: elide help jvm)

486. **Answer:** Point KOTLIN_HOME to <elide>/resources/kotlin/<version>; use kotlinc, kapt, KSP. (Source: elide help jvm)

487. **Answer:** javac compiles .java to .class; kotlinc compiles .kt to .class; both target JVM bytecode. (Source: elide help jvm)

488. **Answer:** Jacoco instruments bytecode, tracks execution, generates HTML/XML coverage reports. (Source: elide help jvm)

489. **Answer:** coroutines (concurrency), datetime (date/time), html (rendering), serialization (data), serialization.json (JSON). (Source: elide help jvm)

490. **Answer:** KotlinX libraries are auto-included in classpath; opt out with kotlin { features { kotlinx = false } }. (Source: elide help jvm)

491. **Answer:** kapt processes annotations at compile time; KSP is the modern alternative. (Source: elide help jvm)

492. **Answer:** Write .ts files, run directly with elide; types are checked at compile time. (Source: elide help typescript)

493. **Answer:** Write .tsx with JSX syntax, import React, use renderToString, run with elide. (Source: elide help typescript)

494. **Answer:** assert, buffer, fs, path, stream, zlib are available. (Source: elide help nodeapi)

495. **Answer:** Use import { func } from "node:fs" or import { func } from "fs". (Source: elide help nodeapi)

496. **Answer:** node: prefix reduces ambiguity and enables cross-runtime compatibility. (Source: elide help nodeapi)

497. **Answer:** Elide targets Node.js 22 or greater for API compatibility. (Source: elide help nodeapi)

498. **Answer:** Prefer compatible APIs, or provide small polyfills/shims for missing Node features instead of relying on unsupported ones. (Source: elide help nodeapi, best practices)

499. **Answer:** Use readFileSync, writeFileSync, existsSync from node:fs. (Source: elide help nodeapi)

500. **Answer:** On the official docs site and GitHub repo (Elide website, documentation pages, and README), plus community chat. (Source: elide help, project documentation)

