/**
 * Compatibility Matrix Server
 *
 * API server for testing and tracking package compatibility across ecosystems.
 * Supports npm, PyPI, Maven, and RubyGems package testing for Elide runtime.
 *
 * This service demonstrates Elide's ability to work with packages from multiple
 * language ecosystems and provides a comprehensive testing and reporting framework.
 *
 * Try running with: elide run server.ts
 */

import { serve } from "bun";
import { randomUUID } from "crypto";
import { PackageTester } from "./tester.ts";
import { MatrixGenerator } from "./matrix-generator.ts";

// ============================================================================
// Types and Interfaces
// ============================================================================

export type Ecosystem = "npm" | "pypi" | "maven" | "rubygems";
export type CompatibilityStatus = "compatible" | "partial" | "incompatible" | "untested" | "testing";
export type TestStatus = "pending" | "running" | "completed" | "failed";

export interface PackageInfo {
  name: string;
  version: string;
  ecosystem: Ecosystem;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
}

export interface CompatibilityTest {
  id: string;
  package: PackageInfo;
  status: TestStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  results?: TestResults;
  error?: string;
}

export interface TestResults {
  status: CompatibilityStatus;
  score: number; // 0-100
  tests: {
    import: TestResult;
    basic_api: TestResult;
    advanced_features: TestResult;
    performance: TestResult;
    edge_cases: TestResult;
  };
  issues: Issue[];
  recommendations: string[];
  metadata: {
    elideVersion: string;
    testDuration: number;
    timestamp: Date;
  };
}

export interface TestResult {
  passed: boolean;
  details: string;
  errors?: string[];
}

export interface Issue {
  severity: "critical" | "major" | "minor" | "info";
  category: "import" | "api" | "performance" | "compatibility" | "other";
  description: string;
  workaround?: string;
}

export interface PackageStats {
  ecosystem: Ecosystem;
  totalTested: number;
  compatible: number;
  partial: number;
  incompatible: number;
  untested: number;
  averageScore: number;
}

export interface CompatibilityMatrix {
  id: string;
  generatedAt: Date;
  ecosystemStats: Record<Ecosystem, PackageStats>;
  topPackages: {
    mostCompatible: Array<{ package: PackageInfo; score: number }>;
    needsWork: Array<{ package: PackageInfo; score: number; issues: number }>;
  };
  patterns: {
    whatWorks: string[];
    commonIssues: string[];
    recommendations: string[];
  };
  totalPackages: number;
  overallCompatibility: number;
}

// ============================================================================
// In-Memory Storage
// ============================================================================

class CompatibilityDatabase {
  private tests: Map<string, CompatibilityTest> = new Map();
  private results: Map<string, TestResults> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Add some sample test results for popular packages
    const samples: Array<{ pkg: PackageInfo; results: TestResults }> = [
      {
        pkg: { name: "lodash", version: "4.17.21", ecosystem: "npm" },
        results: {
          status: "compatible",
          score: 95,
          tests: {
            import: { passed: true, details: "Successfully imported all modules" },
            basic_api: { passed: true, details: "All basic functions work correctly" },
            advanced_features: { passed: true, details: "Advanced features like currying work" },
            performance: { passed: true, details: "Performance within expected range" },
            edge_cases: { passed: true, details: "Edge cases handled correctly" },
          },
          issues: [
            {
              severity: "minor",
              category: "performance",
              description: "Some functions slightly slower than native implementations",
              workaround: "Use native array methods where possible",
            },
          ],
          recommendations: [
            "Fully compatible with Elide",
            "Consider using native JavaScript alternatives for better performance",
          ],
          metadata: {
            elideVersion: "0.11.0-beta",
            testDuration: 1234,
            timestamp: new Date(),
          },
        },
      },
      {
        pkg: { name: "express", version: "4.18.2", ecosystem: "npm" },
        results: {
          status: "compatible",
          score: 92,
          tests: {
            import: { passed: true, details: "Express imported successfully" },
            basic_api: { passed: true, details: "Basic routing and middleware work" },
            advanced_features: { passed: true, details: "Advanced features operational" },
            performance: { passed: true, details: "Good performance on Elide" },
            edge_cases: { passed: true, details: "Edge cases handled" },
          },
          issues: [],
          recommendations: [
            "Fully compatible with Elide HTTP server",
            "Consider using native Bun serve API for better performance",
          ],
          metadata: {
            elideVersion: "0.11.0-beta",
            testDuration: 2156,
            timestamp: new Date(),
          },
        },
      },
      {
        pkg: { name: "axios", version: "1.6.0", ecosystem: "npm" },
        results: {
          status: "compatible",
          score: 88,
          tests: {
            import: { passed: true, details: "Axios imported successfully" },
            basic_api: { passed: true, details: "HTTP requests work" },
            advanced_features: { passed: true, details: "Interceptors and config work" },
            performance: { passed: false, details: "Some performance overhead", errors: ["Slower than fetch API"] },
            edge_cases: { passed: true, details: "Edge cases handled" },
          },
          issues: [
            {
              severity: "minor",
              category: "performance",
              description: "Axios adds some overhead compared to native fetch",
              workaround: "Use native fetch API for better performance",
            },
          ],
          recommendations: [
            "Compatible but consider native fetch API",
            "Interceptors and advanced features work well",
          ],
          metadata: {
            elideVersion: "0.11.0-beta",
            testDuration: 1876,
            timestamp: new Date(),
          },
        },
      },
      {
        pkg: { name: "chalk", version: "5.3.0", ecosystem: "npm" },
        results: {
          status: "partial",
          score: 65,
          tests: {
            import: { passed: true, details: "Chalk imported as ESM" },
            basic_api: { passed: true, details: "Basic coloring works" },
            advanced_features: { passed: false, details: "Some advanced features limited", errors: ["256 color support limited"] },
            performance: { passed: true, details: "Performance acceptable" },
            edge_cases: { passed: true, details: "Most edge cases handled" },
          },
          issues: [
            {
              severity: "major",
              category: "compatibility",
              description: "Limited 256-color and truecolor support",
              workaround: "Use basic 16 colors for better compatibility",
            },
          ],
          recommendations: [
            "Basic colors work, avoid advanced color modes",
            "Consider ANSI escape codes directly for more control",
          ],
          metadata: {
            elideVersion: "0.11.0-beta",
            testDuration: 892,
            timestamp: new Date(),
          },
        },
      },
      {
        pkg: { name: "requests", version: "2.31.0", ecosystem: "pypi" },
        results: {
          status: "compatible",
          score: 90,
          tests: {
            import: { passed: true, details: "Requests module imported via Elide polyglot" },
            basic_api: { passed: true, details: "GET/POST requests work" },
            advanced_features: { passed: true, details: "Sessions, auth work" },
            performance: { passed: true, details: "Performance good" },
            edge_cases: { passed: true, details: "Edge cases handled" },
          },
          issues: [],
          recommendations: [
            "Works well with Elide's Python polyglot support",
            "Full compatibility with standard requests API",
          ],
          metadata: {
            elideVersion: "0.11.0-beta",
            testDuration: 1654,
            timestamp: new Date(),
          },
        },
      },
      {
        pkg: { name: "flask", version: "3.0.0", ecosystem: "pypi" },
        results: {
          status: "partial",
          score: 75,
          tests: {
            import: { passed: true, details: "Flask imports successfully" },
            basic_api: { passed: true, details: "Basic routing works" },
            advanced_features: { passed: false, details: "Some extensions incompatible", errors: ["Some Flask extensions not supported"] },
            performance: { passed: true, details: "Adequate performance" },
            edge_cases: { passed: true, details: "Common cases work" },
          },
          issues: [
            {
              severity: "major",
              category: "compatibility",
              description: "Some Flask extensions rely on CPython-specific features",
              workaround: "Use core Flask without problematic extensions",
            },
          ],
          recommendations: [
            "Core Flask works, test extensions individually",
            "Consider FastAPI for better Elide compatibility",
          ],
          metadata: {
            elideVersion: "0.11.0-beta",
            testDuration: 2341,
            timestamp: new Date(),
          },
        },
      },
      {
        pkg: { name: "junit", version: "4.13.2", ecosystem: "maven", description: "Java testing framework" },
        results: {
          status: "compatible",
          score: 94,
          tests: {
            import: { passed: true, details: "JUnit classes load correctly" },
            basic_api: { passed: true, details: "Test execution works" },
            advanced_features: { passed: true, details: "Assertions, annotations work" },
            performance: { passed: true, details: "Fast test execution" },
            edge_cases: { passed: true, details: "Edge cases handled" },
          },
          issues: [],
          recommendations: [
            "Excellent compatibility with Elide Java runtime",
            "Full JUnit 4 API supported",
          ],
          metadata: {
            elideVersion: "0.11.0-beta",
            testDuration: 1123,
            timestamp: new Date(),
          },
        },
      },
      {
        pkg: { name: "sinatra", version: "3.1.0", ecosystem: "rubygems", description: "Ruby web framework" },
        results: {
          status: "partial",
          score: 70,
          tests: {
            import: { passed: true, details: "Sinatra loads via Elide Ruby support" },
            basic_api: { passed: true, details: "Basic routes work" },
            advanced_features: { passed: false, details: "Some features limited", errors: ["Streaming responses limited"] },
            performance: { passed: true, details: "Good performance" },
            edge_cases: { passed: true, details: "Most cases work" },
          },
          issues: [
            {
              severity: "major",
              category: "compatibility",
              description: "Streaming responses have limitations",
              workaround: "Use buffered responses",
            },
          ],
          recommendations: [
            "Basic Sinatra apps work well",
            "Test advanced features before production use",
          ],
          metadata: {
            elideVersion: "0.11.0-beta",
            testDuration: 1987,
            timestamp: new Date(),
          },
        },
      },
    ];

    for (const { pkg, results } of samples) {
      const testId = randomUUID();
      const test: CompatibilityTest = {
        id: testId,
        package: pkg,
        status: "completed",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        completedAt: new Date(),
        results,
      };
      this.tests.set(testId, test);
      this.results.set(`${pkg.ecosystem}:${pkg.name}@${pkg.version}`, results);
    }
  }

  public addTest(test: CompatibilityTest): void {
    this.tests.set(test.id, test);
  }

  public getTest(id: string): CompatibilityTest | undefined {
    return this.tests.get(id);
  }

  public updateTest(id: string, updates: Partial<CompatibilityTest>): void {
    const test = this.tests.get(id);
    if (test) {
      Object.assign(test, updates);
    }
  }

  public addResults(packageKey: string, results: TestResults): void {
    this.results.set(packageKey, results);
  }

  public getResults(packageKey: string): TestResults | undefined {
    return this.results.get(packageKey);
  }

  public getAllTests(): CompatibilityTest[] {
    return Array.from(this.tests.values());
  }

  public getAllResults(): Array<{ key: string; results: TestResults }> {
    return Array.from(this.results.entries()).map(([key, results]) => ({ key, results }));
  }

  public getTestsByEcosystem(ecosystem: Ecosystem): CompatibilityTest[] {
    return this.getAllTests().filter(test => test.package.ecosystem === ecosystem);
  }

  public searchPackages(query: string): PackageInfo[] {
    const tests = this.getAllTests();
    const lowerQuery = query.toLowerCase();
    return tests
      .filter(test =>
        test.package.name.toLowerCase().includes(lowerQuery) ||
        test.package.description?.toLowerCase().includes(lowerQuery)
      )
      .map(test => test.package);
  }
}

// ============================================================================
// HTTP Server
// ============================================================================

const database = new CompatibilityDatabase();
const tester = new PackageTester(database);
const matrixGen = new MatrixGenerator(database);

const server = serve({
  port: 3010,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === "/health") {
        return Response.json(
          { status: "healthy", timestamp: new Date(), service: "compatibility-matrix" },
          { headers: corsHeaders }
        );
      }

      // Test a package
      if (path === "/api/test" && req.method === "POST") {
        const body = await req.json();
        const { name, version, ecosystem } = body;

        if (!name || !version || !ecosystem) {
          return Response.json(
            { error: "Missing required fields: name, version, ecosystem" },
            { status: 400, headers: corsHeaders }
          );
        }

        const test = await tester.testPackage({ name, version, ecosystem });
        return Response.json({ test }, { headers: corsHeaders });
      }

      // Get test status
      if (path.startsWith("/api/test/") && req.method === "GET") {
        const testId = path.split("/").pop()!;
        const test = database.getTest(testId);

        if (!test) {
          return Response.json(
            { error: "Test not found" },
            { status: 404, headers: corsHeaders }
          );
        }

        return Response.json({ test }, { headers: corsHeaders });
      }

      // List tested packages
      if (path === "/api/packages" && req.method === "GET") {
        const ecosystem = url.searchParams.get("ecosystem") as Ecosystem | null;
        const status = url.searchParams.get("status") as CompatibilityStatus | null;
        const search = url.searchParams.get("search");

        let tests = database.getAllTests();

        if (ecosystem) {
          tests = tests.filter(t => t.package.ecosystem === ecosystem);
        }

        if (status && status !== "untested") {
          tests = tests.filter(t => t.results?.status === status);
        }

        if (search) {
          const lowerSearch = search.toLowerCase();
          tests = tests.filter(t =>
            t.package.name.toLowerCase().includes(lowerSearch) ||
            t.package.description?.toLowerCase().includes(lowerSearch)
          );
        }

        const packages = tests.map(t => ({
          package: t.package,
          status: t.results?.status || "untested",
          score: t.results?.score,
          lastTested: t.completedAt,
        }));

        return Response.json(
          { packages, count: packages.length },
          { headers: corsHeaders }
        );
      }

      // Get package compatibility details
      if (path.startsWith("/api/packages/") && req.method === "GET") {
        const parts = path.split("/");
        const pkgName = parts[parts.length - 1];
        const ecosystem = url.searchParams.get("ecosystem") as Ecosystem;

        if (!ecosystem) {
          return Response.json(
            { error: "ecosystem parameter required" },
            { status: 400, headers: corsHeaders }
          );
        }

        // Find the most recent test for this package
        const tests = database.getAllTests()
          .filter(t => t.package.name === pkgName && t.package.ecosystem === ecosystem)
          .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));

        if (tests.length === 0) {
          return Response.json(
            { error: "Package not found" },
            { status: 404, headers: corsHeaders }
          );
        }

        return Response.json({ test: tests[0] }, { headers: corsHeaders });
      }

      // Get ecosystem statistics
      if (path === "/api/stats" && req.method === "GET") {
        const ecosystem = url.searchParams.get("ecosystem") as Ecosystem | null;

        const stats = matrixGen.getEcosystemStats(ecosystem || undefined);
        return Response.json({ stats }, { headers: corsHeaders });
      }

      // Generate compatibility matrix
      if (path === "/api/matrix" && req.method === "GET") {
        const matrix = matrixGen.generateMatrix();
        return Response.json({ matrix }, { headers: corsHeaders });
      }

      // Search packages
      if (path === "/api/search" && req.method === "GET") {
        const query = url.searchParams.get("q");

        if (!query) {
          return Response.json(
            { error: "Query parameter 'q' required" },
            { status: 400, headers: corsHeaders }
          );
        }

        const packages = database.searchPackages(query);
        return Response.json(
          { packages, count: packages.length },
          { headers: corsHeaders }
        );
      }

      // Serve web UI
      if (path === "/" || path === "/index.html") {
        // In a real implementation, serve the HTML file
        return new Response(
          "Compatibility Matrix Web UI - See /api for API endpoints",
          { headers: { ...corsHeaders, "Content-Type": "text/plain" } }
        );
      }

      return Response.json(
        { error: "Not Found" },
        { status: 404, headers: corsHeaders }
      );

    } catch (error) {
      console.error("Server error:", error);
      return Response.json(
        { error: "Internal Server Error", message: error instanceof Error ? error.message : String(error) },
        { status: 500, headers: corsHeaders }
      );
    }
  },
});

console.log("╔════════════════════════════════════════════════════════╗");
console.log("║   Compatibility Matrix - Package Testing for Elide    ║");
console.log("╚════════════════════════════════════════════════════════╝");
console.log();
console.log(`Server running on http://localhost:${server.port}`);
console.log();
console.log("API Endpoints:");
console.log("  POST   /api/test                    - Test a package for compatibility");
console.log("  GET    /api/test/:id                - Get test status");
console.log("  GET    /api/packages                - List tested packages (filter: ?ecosystem=npm&status=compatible&search=lodash)");
console.log("  GET    /api/packages/:name          - Get package compatibility details (?ecosystem=npm)");
console.log("  GET    /api/stats                   - Get ecosystem statistics (?ecosystem=npm)");
console.log("  GET    /api/matrix                  - Generate full compatibility matrix");
console.log("  GET    /api/search                  - Search packages (?q=query)");
console.log();
console.log("Supported Ecosystems:");
console.log("  - npm       (Node.js/JavaScript packages)");
console.log("  - pypi      (Python packages)");
console.log("  - maven     (Java packages)");
console.log("  - rubygems  (Ruby packages)");
console.log();
