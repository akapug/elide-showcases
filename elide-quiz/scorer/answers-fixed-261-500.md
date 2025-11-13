# Fixed Answers for Questions 261-500

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

