/**
 * Production Builder
 *
 * Optimized production builds with:
 * - Content hashing for caching
 * - Asset manifest generation
 * - Build reports and analysis
 * - Environment variable injection
 * - Multi-target builds
 * - Bundle size analysis
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { Bundler, BundlerOptions } from "../bundler/index";
import { Optimizer } from "../optimizer/index";
import { Compiler } from "../compiler/index";

export interface ProductionOptions extends BundlerOptions {
  clean?: boolean;
  analyze?: boolean;
  report?: boolean;
  env?: Record<string, string>;
  targets?: BuildTarget[];
  contentHash?: boolean;
  chunkHash?: boolean;
  publicPath?: string;
  manifest?: boolean;
  stats?: boolean;
}

export interface BuildTarget {
  name: string;
  outDir: string;
  format: "esm" | "cjs" | "iife" | "umd";
  minify?: boolean;
}

export interface BuildManifest {
  files: Record<string, ManifestEntry>;
  entryPoints: Record<string, string>;
  version: string;
  timestamp: number;
}

export interface ManifestEntry {
  file: string;
  hash: string;
  size: number;
  gzipSize?: number;
  brotliSize?: number;
  imports?: string[];
}

export interface BuildReport {
  duration: number;
  targets: number;
  files: number;
  totalSize: number;
  gzipSize: number;
  brotliSize: number;
  warnings: number;
  errors: number;
  assets: AssetReport[];
  chunks: ChunkReport[];
}

export interface AssetReport {
  name: string;
  size: number;
  gzipSize?: number;
  type: string;
}

export interface ChunkReport {
  name: string;
  size: number;
  modules: number;
  imports: string[];
}

export class ProductionBuilder {
  private options: ProductionOptions;
  private bundler: Bundler;
  private optimizer: Optimizer;
  private compiler: Compiler;

  constructor(options: ProductionOptions) {
    this.options = {
      clean: options.clean ?? true,
      analyze: options.analyze ?? false,
      report: options.report ?? true,
      env: options.env || {},
      targets: options.targets || [{ name: "default", outDir: options.outDir || "dist", format: "esm" }],
      contentHash: options.contentHash ?? true,
      chunkHash: options.chunkHash ?? true,
      publicPath: options.publicPath || "/",
      manifest: options.manifest ?? true,
      stats: options.stats ?? true,
      ...options,
    };

    this.bundler = new Bundler(this.options);
    this.optimizer = new Optimizer({
      minify: this.options.minify,
      compress: true,
    });
    this.compiler = new Compiler({
      target: this.options.target,
      sourceMap: this.options.sourcemap,
    });
  }

  /**
   * Build for production
   */
  async build(): Promise<BuildReport> {
    const startTime = performance.now();

    console.log("🏗️  Starting production build...\n");

    // Clean output directories
    if (this.options.clean) {
      this.cleanOutputDirs();
    }

    // Inject environment variables
    this.injectEnvVariables();

    const allAssets: AssetReport[] = [];
    const allChunks: ChunkReport[] = [];
    let totalSize = 0;
    let gzipSize = 0;
    let brotliSize = 0;
    let warnings = 0;
    let errors = 0;

    // Build for each target
    for (const target of this.options.targets!) {
      console.log(`📦 Building target: ${target.name}`);

      const targetOptions = {
        ...this.options,
        outDir: target.outDir,
        format: target.format,
        minify: target.minify ?? this.options.minify,
      };

      this.bundler = new Bundler(targetOptions);

      const result = await this.bundler.build();

      if (!result.success) {
        errors += result.errors.length;
        console.error(`❌ Build failed for target ${target.name}`);
        continue;
      }

      warnings += result.warnings.length;

      // Process output files
      for (const file of result.outputFiles) {
        // Add content hash if enabled
        let outputPath = file.path;
        if (this.options.contentHash) {
          outputPath = this.addContentHash(file.path, file.hash);
        }

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Write file
        fs.writeFileSync(outputPath, file.contents);

        // Collect stats
        totalSize += file.size;

        const asset: AssetReport = {
          name: path.basename(outputPath),
          size: file.size,
          type: path.extname(outputPath).substring(1),
        };

        // Calculate compressed sizes
        if (this.options.compress) {
          const gzipped = await this.optimizer["compressor"].compress(file.contents, {
            algorithm: "gzip",
          });
          const brotlied = await this.optimizer["compressor"].compress(file.contents, {
            algorithm: "brotli",
          });

          asset.gzipSize = gzipped.length;
          gzipSize += gzipped.length;
          brotliSize += brotlied.length;
        }

        allAssets.push(asset);

        console.log(
          `  ✓ ${path.basename(outputPath)} (${this.formatSize(file.size)}${asset.gzipSize ? ` / ${this.formatSize(asset.gzipSize)} gzip` : ""})`
        );
      }

      console.log();
    }

    // Generate manifest
    if (this.options.manifest) {
      this.generateManifest(allAssets);
    }

    // Generate build report
    if (this.options.report) {
      this.generateReport({
        duration: performance.now() - startTime,
        targets: this.options.targets!.length,
        files: allAssets.length,
        totalSize,
        gzipSize,
        brotliSize,
        warnings,
        errors,
        assets: allAssets,
        chunks: allChunks,
      });
    }

    // Bundle analysis
    if (this.options.analyze) {
      this.generateBundleAnalysis(allAssets, allChunks);
    }

    const duration = performance.now() - startTime;

    console.log(`\n✅ Build completed in ${(duration / 1000).toFixed(2)}s`);
    console.log(`   Total size: ${this.formatSize(totalSize)}`);
    console.log(`   Gzip size: ${this.formatSize(gzipSize)}`);
    console.log(`   Brotli size: ${this.formatSize(brotliSize)}\n`);

    return {
      duration,
      targets: this.options.targets!.length,
      files: allAssets.length,
      totalSize,
      gzipSize,
      brotliSize,
      warnings,
      errors,
      assets: allAssets,
      chunks: allChunks,
    };
  }

  /**
   * Clean output directories
   */
  private cleanOutputDirs(): void {
    for (const target of this.options.targets!) {
      if (fs.existsSync(target.outDir)) {
        fs.rmSync(target.outDir, { recursive: true, force: true });
        console.log(`🗑️  Cleaned ${target.outDir}`);
      }
    }
  }

  /**
   * Inject environment variables
   */
  private injectEnvVariables(): void {
    if (this.options.env && Object.keys(this.options.env).length > 0) {
      const define = this.options.define || {};

      for (const [key, value] of Object.entries(this.options.env)) {
        define[`process.env.${key}`] = JSON.stringify(value);
      }

      this.options.define = define;
    }
  }

  /**
   * Add content hash to filename
   */
  private addContentHash(filePath: string, hash: string): string {
    const ext = path.extname(filePath);
    const base = filePath.substring(0, filePath.length - ext.length);
    const shortHash = hash.substring(0, 8);

    return `${base}.${shortHash}${ext}`;
  }

  /**
   * Generate manifest
   */
  private generateManifest(assets: AssetReport[]): void {
    const manifest: BuildManifest = {
      files: {},
      entryPoints: {},
      version: "1.0.0",
      timestamp: Date.now(),
    };

    for (const asset of assets) {
      const hash = crypto.createHash("sha256").update(asset.name).digest("hex").substring(0, 8);

      manifest.files[asset.name] = {
        file: asset.name,
        hash,
        size: asset.size,
        gzipSize: asset.gzipSize,
      };
    }

    const manifestPath = path.join(this.options.targets![0].outDir, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`📋 Generated manifest: ${manifestPath}`);
  }

  /**
   * Generate build report
   */
  private generateReport(report: BuildReport): void {
    const reportPath = path.join(this.options.targets![0].outDir, "build-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Generated build report: ${reportPath}`);

    // Generate HTML report
    const htmlPath = path.join(this.options.targets![0].outDir, "build-report.html");
    fs.writeFileSync(htmlPath, this.generateHTMLReport(report));

    console.log(`📊 Generated HTML report: ${htmlPath}`);
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: BuildReport): string {
    const assets = report.assets.sort((a, b) => b.size - a.size);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Build Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 50px auto; padding: 20px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
    .stat { padding: 20px; background: #f5f5f5; border-radius: 8px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #2563eb; }
    .stat-label { color: #6b7280; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; }
    .size-bar { height: 20px; background: #3b82f6; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>📊 Build Report</h1>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${(report.duration / 1000).toFixed(2)}s</div>
      <div class="stat-label">Build Time</div>
    </div>
    <div class="stat">
      <div class="stat-value">${report.files}</div>
      <div class="stat-label">Files</div>
    </div>
    <div class="stat">
      <div class="stat-value">${this.formatSize(report.totalSize)}</div>
      <div class="stat-label">Total Size</div>
    </div>
    <div class="stat">
      <div class="stat-value">${this.formatSize(report.gzipSize)}</div>
      <div class="stat-label">Gzip Size</div>
    </div>
    <div class="stat">
      <div class="stat-value">${this.formatSize(report.brotliSize)}</div>
      <div class="stat-label">Brotli Size</div>
    </div>
  </div>

  <h2>Assets</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Size</th>
        <th>Gzip Size</th>
        <th>Type</th>
        <th>Size Distribution</th>
      </tr>
    </thead>
    <tbody>
      ${assets
        .map(
          (asset) => `
        <tr>
          <td>${asset.name}</td>
          <td>${this.formatSize(asset.size)}</td>
          <td>${asset.gzipSize ? this.formatSize(asset.gzipSize) : "—"}</td>
          <td>${asset.type}</td>
          <td>
            <div class="size-bar" style="width: ${(asset.size / report.totalSize) * 100}%"></div>
          </td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <p>Generated at ${new Date().toLocaleString()}</p>
</body>
</html>
    `.trim();
  }

  /**
   * Generate bundle analysis
   */
  private generateBundleAnalysis(assets: AssetReport[], chunks: ChunkReport[]): void {
    console.log("\n📈 Bundle Analysis:\n");

    // Asset type breakdown
    const typeBreakdown = new Map<string, number>();
    for (const asset of assets) {
      const current = typeBreakdown.get(asset.type) || 0;
      typeBreakdown.set(asset.type, current + asset.size);
    }

    console.log("By type:");
    for (const [type, size] of typeBreakdown) {
      console.log(`  ${type}: ${this.formatSize(size)}`);
    }

    console.log();
  }

  /**
   * Format size
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
