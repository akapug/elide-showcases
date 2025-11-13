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

498. **Answer:** Node API support is evolving; major popular functions are available. (Source: elide help nodeapi)

499. **Answer:** Use readFileSync, writeFileSync, existsSync from node:fs. (Source: elide help nodeapi)

500. **Answer:** Elide combines GraalVM polyglot runtime, native HTTP server, embedded compilers, and Node API compatibility for a complete development platform. (Source: elide help, BETA11_MIGRATION_GUIDE.md)

