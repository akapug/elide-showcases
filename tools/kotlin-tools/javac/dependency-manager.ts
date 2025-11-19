/**
 * Maven/Gradle Dependency Manager for Elide
 *
 * Resolves and manages Java dependencies from Maven Central, JCenter, etc.
 * Provides a compatibility layer for Maven and Gradle dependency resolution
 * without requiring the full build tools.
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

/**
 * Maven dependency coordinates
 */
export interface MavenCoordinate {
  groupId: string;
  artifactId: string;
  version: string;
  classifier?: string;
  packaging?: string;
  scope?: 'compile' | 'runtime' | 'provided' | 'test';
}

/**
 * Repository configuration
 */
export interface Repository {
  id: string;
  url: string;
  username?: string;
  password?: string;
}

/**
 * Resolved dependency
 */
export interface ResolvedDependency {
  coordinate: MavenCoordinate;
  jarPath: string;
  pomPath?: string;
  dependencies: MavenCoordinate[];
  size: number;
  sha1?: string;
}

/**
 * Dependency resolution result
 */
export interface ResolutionResult {
  success: boolean;
  resolved: ResolvedDependency[];
  failed: MavenCoordinate[];
  errors?: string[];
  totalSize: number;
  executionTime: number;
}

/**
 * Dependency Manager
 */
export class DependencyManager {
  private repositories: Repository[];
  private cacheDir: string;
  private localRepo: string;

  constructor(cacheDir?: string) {
    this.repositories = [
      {
        id: 'maven-central',
        url: 'https://repo1.maven.org/maven2'
      },
      {
        id: 'google',
        url: 'https://maven.google.com'
      },
      {
        id: 'jcenter',
        url: 'https://jcenter.bintray.com'
      }
    ];

    this.cacheDir = cacheDir || join(process.env.HOME || '/tmp', '.elide', 'maven-cache');
    this.localRepo = join(this.cacheDir, 'repository');
  }

  /**
   * Initialize dependency manager
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
    await fs.mkdir(this.localRepo, { recursive: true });
  }

  /**
   * Add custom repository
   */
  addRepository(repo: Repository): void {
    this.repositories.push(repo);
  }

  /**
   * Resolve a single dependency
   */
  async resolve(coordinate: MavenCoordinate): Promise<ResolvedDependency | null> {
    const artifactPath = this.getArtifactPath(coordinate);
    const jarPath = join(this.localRepo, artifactPath);

    // Check if already cached
    if (await this.fileExists(jarPath)) {
      return this.loadCachedDependency(coordinate, jarPath);
    }

    // Try to download from repositories
    for (const repo of this.repositories) {
      try {
        const downloaded = await this.downloadArtifact(repo, coordinate, jarPath);
        if (downloaded) {
          return downloaded;
        }
      } catch (error) {
        // Try next repository
        continue;
      }
    }

    return null;
  }

  /**
   * Resolve multiple dependencies with transitive resolution
   */
  async resolveAll(
    coordinates: MavenCoordinate[],
    transitive: boolean = true
  ): Promise<ResolutionResult> {
    const startTime = Date.now();
    const resolved: ResolvedDependency[] = [];
    const failed: MavenCoordinate[] = [];
    const seen = new Set<string>();
    const queue = [...coordinates];

    while (queue.length > 0) {
      const coordinate = queue.shift()!;
      const key = this.coordinateKey(coordinate);

      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const dependency = await this.resolve(coordinate);

      if (dependency) {
        resolved.push(dependency);

        // Add transitive dependencies
        if (transitive) {
          queue.push(...dependency.dependencies);
        }
      } else {
        failed.push(coordinate);
      }
    }

    const totalSize = resolved.reduce((sum, dep) => sum + dep.size, 0);

    return {
      success: failed.length === 0,
      resolved,
      failed,
      totalSize,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * Parse Maven POM file
   */
  async parsePom(pomPath: string): Promise<MavenCoordinate[]> {
    const content = await fs.readFile(pomPath, 'utf-8');
    const dependencies: MavenCoordinate[] = [];

    // Simple XML parsing (in production, use a proper XML parser)
    const dependencyRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
    let match;

    while ((match = dependencyRegex.exec(content)) !== null) {
      const depXml = match[1];
      const groupId = this.extractXmlTag(depXml, 'groupId');
      const artifactId = this.extractXmlTag(depXml, 'artifactId');
      const version = this.extractXmlTag(depXml, 'version');
      const scope = this.extractXmlTag(depXml, 'scope') || 'compile';

      if (groupId && artifactId && version) {
        dependencies.push({
          groupId,
          artifactId,
          version,
          scope: scope as any
        });
      }
    }

    return dependencies;
  }

  /**
   * Generate classpath from resolved dependencies
   */
  generateClasspath(resolved: ResolvedDependency[]): string {
    return resolved.map(dep => dep.jarPath).join(':');
  }

  /**
   * Parse Gradle dependency notation
   */
  parseGradleDependency(notation: string): MavenCoordinate | null {
    // Format: group:artifact:version or group:artifact:version:classifier
    const parts = notation.split(':');

    if (parts.length < 3) {
      return null;
    }

    return {
      groupId: parts[0],
      artifactId: parts[1],
      version: parts[2],
      classifier: parts[3],
      packaging: 'jar',
      scope: 'compile'
    };
  }

  /**
   * Parse Maven XML dependency notation
   */
  parseMavenDependency(xml: string): MavenCoordinate | null {
    const groupId = this.extractXmlTag(xml, 'groupId');
    const artifactId = this.extractXmlTag(xml, 'artifactId');
    const version = this.extractXmlTag(xml, 'version');

    if (!groupId || !artifactId || !version) {
      return null;
    }

    return {
      groupId,
      artifactId,
      version,
      classifier: this.extractXmlTag(xml, 'classifier'),
      packaging: this.extractXmlTag(xml, 'packaging') || 'jar',
      scope: (this.extractXmlTag(xml, 'scope') || 'compile') as any
    };
  }

  /**
   * Get artifact path in repository
   */
  private getArtifactPath(coordinate: MavenCoordinate): string {
    const groupPath = coordinate.groupId.replace(/\./g, '/');
    const fileName = this.getArtifactFileName(coordinate);
    return join(groupPath, coordinate.artifactId, coordinate.version, fileName);
  }

  /**
   * Get artifact file name
   */
  private getArtifactFileName(coordinate: MavenCoordinate): string {
    let fileName = `${coordinate.artifactId}-${coordinate.version}`;

    if (coordinate.classifier) {
      fileName += `-${coordinate.classifier}`;
    }

    fileName += `.${coordinate.packaging || 'jar'}`;

    return fileName;
  }

  /**
   * Download artifact from repository
   */
  private async downloadArtifact(
    repo: Repository,
    coordinate: MavenCoordinate,
    localPath: string
  ): Promise<ResolvedDependency | null> {
    const artifactPath = this.getArtifactPath(coordinate);
    const url = `${repo.url}/${artifactPath}`;

    try {
      // Create directory
      await fs.mkdir(join(this.localRepo, artifactPath, '..'), { recursive: true });

      // Download JAR
      await this.downloadFile(url, localPath, repo.username, repo.password);

      // Download POM
      const pomFileName = `${coordinate.artifactId}-${coordinate.version}.pom`;
      const pomPath = join(join(localPath, '..'), pomFileName);
      const pomUrl = url.replace(/\.(jar|war|aar)$/, '.pom');

      let dependencies: MavenCoordinate[] = [];
      try {
        await this.downloadFile(pomUrl, pomPath, repo.username, repo.password);
        dependencies = await this.parsePom(pomPath);
      } catch (error) {
        // POM might not exist
      }

      const stats = await fs.stat(localPath);
      const sha1 = await this.calculateSha1(localPath);

      return {
        coordinate,
        jarPath: localPath,
        pomPath,
        dependencies,
        size: stats.size,
        sha1
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(
    url: string,
    dest: string,
    username?: string,
    password?: string
  ): Promise<void> {
    let curlCommand = `curl -fsSL "${url}" -o "${dest}"`;

    if (username && password) {
      curlCommand = `curl -fsSL -u ${username}:${password} "${url}" -o "${dest}"`;
    }

    await execAsync(curlCommand);
  }

  /**
   * Load cached dependency
   */
  private async loadCachedDependency(
    coordinate: MavenCoordinate,
    jarPath: string
  ): Promise<ResolvedDependency> {
    const stats = await fs.stat(jarPath);
    const sha1 = await this.calculateSha1(jarPath);

    // Try to load POM
    const pomFileName = `${coordinate.artifactId}-${coordinate.version}.pom`;
    const pomPath = join(join(jarPath, '..'), pomFileName);

    let dependencies: MavenCoordinate[] = [];
    if (await this.fileExists(pomPath)) {
      dependencies = await this.parsePom(pomPath);
    }

    return {
      coordinate,
      jarPath,
      pomPath,
      dependencies,
      size: stats.size,
      sha1
    };
  }

  /**
   * Calculate SHA1 hash of file
   */
  private async calculateSha1(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha1').update(content).digest('hex');
  }

  /**
   * Check if file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract XML tag value
   */
  private extractXmlTag(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Generate coordinate key
   */
  private coordinateKey(coordinate: MavenCoordinate): string {
    return `${coordinate.groupId}:${coordinate.artifactId}:${coordinate.version}`;
  }

  /**
   * Clear dependency cache
   */
  async clearCache(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await this.initialize();
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize(): Promise<number> {
    let totalSize = 0;

    async function calculateDirSize(dir: string): Promise<number> {
      let size = 0;
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            size += await calculateDirSize(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            size += stats.size;
          }
        }
      } catch (error) {
        // Ignore errors
      }
      return size;
    }

    return calculateDirSize(this.cacheDir);
  }
}

/**
 * Convenience function to resolve dependencies
 */
export async function resolveDependencies(
  coordinates: MavenCoordinate[]
): Promise<ResolutionResult> {
  const manager = new DependencyManager();
  await manager.initialize();
  return manager.resolveAll(coordinates);
}

/**
 * Convenience function to parse Gradle notation
 */
export function parseGradle(notation: string): MavenCoordinate | null {
  const manager = new DependencyManager();
  return manager.parseGradleDependency(notation);
}

export default DependencyManager;
