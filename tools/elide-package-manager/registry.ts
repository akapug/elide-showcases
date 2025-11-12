/**
 * Multi-Ecosystem Registry Client
 *
 * Unified client for npm, PyPI, Maven, and RubyGems registries.
 * Provides searching, package info, and version resolution across all ecosystems.
 */

export interface SearchResult {
  name: string;
  version: string;
  ecosystem: "npm" | "pypi" | "maven" | "rubygems";
  description?: string;
  author?: string;
  downloads?: number;
  repository?: string;
  license?: string;
}

export interface PackageInfo {
  name: string;
  version: string;
  ecosystem: string;
  description?: string;
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  versions?: string[];
}

export class RegistryClient {
  private npmRegistry = "https://registry.npmjs.org";
  private pypiRegistry = "https://pypi.org/pypi";
  private mavenCentral = "https://search.maven.org/solrsearch/select";
  private rubygemsRegistry = "https://rubygems.org/api/v1";

  /**
   * Search for packages across multiple ecosystems
   */
  async search(
    query: string,
    ecosystems: string[] = ["npm", "pypi", "maven", "rubygems"]
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    const searches = ecosystems.map(async (ecosystem) => {
      try {
        switch (ecosystem) {
          case "npm":
            return await this.searchNpm(query);
          case "pypi":
            return await this.searchPyPI(query);
          case "maven":
            return await this.searchMaven(query);
          case "rubygems":
            return await this.searchRubyGems(query);
          default:
            return [];
        }
      } catch (error) {
        console.warn(`Warning: Failed to search ${ecosystem}: ${error.message}`);
        return [];
      }
    });

    const allResults = await Promise.all(searches);

    for (const ecosystemResults of allResults) {
      results.push(...ecosystemResults);
    }

    return results;
  }

  /**
   * Get detailed package information
   */
  async getPackageInfo(packageName: string, ecosystem: string): Promise<PackageInfo> {
    switch (ecosystem) {
      case "npm":
        return await this.getNpmPackageInfo(packageName);
      case "pypi":
        return await this.getPyPIPackageInfo(packageName);
      case "maven":
        return await this.getMavenPackageInfo(packageName);
      case "rubygems":
        return await this.getRubyGemsPackageInfo(packageName);
      default:
        throw new Error(`Unknown ecosystem: ${ecosystem}`);
    }
  }

  /**
   * Get the latest version of a package
   */
  async getLatestVersion(packageName: string, ecosystem: string): Promise<string> {
    const info = await this.getPackageInfo(packageName, ecosystem);
    return info.version;
  }

  /**
   * Check if a package exists in an ecosystem
   */
  async exists(packageName: string, ecosystem: string): Promise<boolean> {
    try {
      await this.getPackageInfo(packageName, ecosystem);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all available versions of a package
   */
  async getVersions(packageName: string, ecosystem: string): Promise<string[]> {
    const info = await this.getPackageInfo(packageName, ecosystem);
    return info.versions || [info.version];
  }

  /**
   * Get package download URL
   */
  async getDownloadUrl(packageName: string, version: string, ecosystem: string): Promise<string> {
    switch (ecosystem) {
      case "npm":
        return `${this.npmRegistry}/${packageName}/-/${packageName}-${version}.tgz`;
      case "pypi":
        // PyPI URLs are more complex, need to fetch from API
        const pypiInfo: any = await this.fetchJson(`${this.pypiRegistry}/${packageName}/${version}/json`);
        return pypiInfo.urls[0]?.url || "";
      case "maven":
        // Maven coordinates: groupId:artifactId:version
        const [groupId, artifactId] = packageName.split(":");
        const groupPath = groupId.replace(/\./g, "/");
        return `https://repo1.maven.org/maven2/${groupPath}/${artifactId}/${version}/${artifactId}-${version}.jar`;
      case "rubygems":
        return `https://rubygems.org/downloads/${packageName}-${version}.gem`;
      default:
        throw new Error(`Unknown ecosystem: ${ecosystem}`);
    }
  }

  // NPM Registry Methods

  private async searchNpm(query: string): Promise<SearchResult[]> {
    try {
      const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=20`;
      const response: any = await this.fetchJson(url);

      return response.objects.map((obj: any) => ({
        name: obj.package.name,
        version: obj.package.version,
        ecosystem: "npm" as const,
        description: obj.package.description,
        author: obj.package.author?.name,
        downloads: obj.downloads,
        repository: obj.package.links?.repository,
        license: obj.package.license,
      }));
    } catch (error) {
      console.warn(`NPM search failed: ${error.message}`);
      return [];
    }
  }

  private async getNpmPackageInfo(packageName: string): Promise<PackageInfo> {
    const url = `${this.npmRegistry}/${packageName}`;
    const data: any = await this.fetchJson(url);

    const latestVersion = data["dist-tags"].latest;
    const versionData = data.versions[latestVersion];

    return {
      name: data.name,
      version: latestVersion,
      ecosystem: "npm",
      description: versionData.description,
      author: versionData.author?.name || versionData.author,
      license: versionData.license,
      repository: versionData.repository?.url,
      homepage: versionData.homepage,
      keywords: versionData.keywords,
      dependencies: versionData.dependencies,
      devDependencies: versionData.devDependencies,
      versions: Object.keys(data.versions),
    };
  }

  // PyPI Registry Methods

  private async searchPyPI(query: string): Promise<SearchResult[]> {
    try {
      // PyPI doesn't have a search API, so we use the JSON API
      // This is a simplified search - in production, use a proper search service
      const url = `https://pypi.org/pypi/${query}/json`;
      const data: any = await this.fetchJson(url);

      return [{
        name: data.info.name,
        version: data.info.version,
        ecosystem: "pypi" as const,
        description: data.info.summary,
        author: data.info.author,
        downloads: 0, // PyPI doesn't provide download counts in this API
        repository: data.info.project_urls?.Repository,
        license: data.info.license,
      }];
    } catch {
      return [];
    }
  }

  private async getPyPIPackageInfo(packageName: string): Promise<PackageInfo> {
    const url = `${this.pypiRegistry}/${packageName}/json`;
    const data: any = await this.fetchJson(url);

    return {
      name: data.info.name,
      version: data.info.version,
      ecosystem: "pypi",
      description: data.info.summary,
      author: data.info.author,
      license: data.info.license,
      repository: data.info.project_urls?.Repository,
      homepage: data.info.home_page,
      keywords: data.info.keywords?.split(",").map((k: string) => k.trim()),
      dependencies: this.extractPyPIDependencies(data.info.requires_dist),
      versions: Object.keys(data.releases),
    };
  }

  private extractPyPIDependencies(requiresDist: string[] | null): Record<string, string> {
    if (!requiresDist) return {};

    const deps: Record<string, string> = {};

    for (const req of requiresDist) {
      // Parse requirements like "package (>=1.0.0)"
      const match = req.match(/^([a-zA-Z0-9_-]+)\s*(\(.*\))?/);
      if (match) {
        const [, name, version] = match;
        deps[name] = version ? version.replace(/[()]/g, "").trim() : "*";
      }
    }

    return deps;
  }

  // Maven Registry Methods

  private async searchMaven(query: string): Promise<SearchResult[]> {
    try {
      const url = `${this.mavenCentral}?q=${encodeURIComponent(query)}&rows=20&wt=json`;
      const response: any = await this.fetchJson(url);

      return response.response.docs.map((doc: any) => ({
        name: `${doc.g}:${doc.a}`,
        version: doc.latestVersion,
        ecosystem: "maven" as const,
        description: doc.description,
        repository: doc.repositoryId,
      }));
    } catch (error) {
      console.warn(`Maven search failed: ${error.message}`);
      return [];
    }
  }

  private async getMavenPackageInfo(packageName: string): Promise<PackageInfo> {
    // Maven packages are identified as groupId:artifactId
    const [groupId, artifactId] = packageName.split(":");

    const url = `${this.mavenCentral}?q=g:"${groupId}"+AND+a:"${artifactId}"&rows=1&wt=json`;
    const response: any = await this.fetchJson(url);

    if (response.response.docs.length === 0) {
      throw new Error(`Package not found: ${packageName}`);
    }

    const doc = response.response.docs[0];

    return {
      name: packageName,
      version: doc.latestVersion,
      ecosystem: "maven",
      description: doc.description,
      repository: doc.repositoryId,
      versions: [doc.latestVersion], // Maven API doesn't provide all versions easily
    };
  }

  // RubyGems Registry Methods

  private async searchRubyGems(query: string): Promise<SearchResult[]> {
    try {
      const url = `${this.rubygemsRegistry}/search.json?query=${encodeURIComponent(query)}`;
      const results: any = await this.fetchJson(url);

      return results.slice(0, 20).map((gem: any) => ({
        name: gem.name,
        version: gem.version,
        ecosystem: "rubygems" as const,
        description: gem.info,
        author: gem.authors,
        downloads: gem.downloads,
        repository: gem.source_code_uri,
        license: gem.licenses?.join(", "),
      }));
    } catch (error) {
      console.warn(`RubyGems search failed: ${error.message}`);
      return [];
    }
  }

  private async getRubyGemsPackageInfo(packageName: string): Promise<PackageInfo> {
    const url = `${this.rubygemsRegistry}/gems/${packageName}.json`;
    const data: any = await this.fetchJson(url);

    // Get versions
    const versionsUrl = `${this.rubygemsRegistry}/versions/${packageName}.json`;
    const versions: any = await this.fetchJson(versionsUrl);

    return {
      name: data.name,
      version: data.version,
      ecosystem: "rubygems",
      description: data.info,
      author: data.authors,
      license: data.licenses?.join(", "),
      repository: data.source_code_uri,
      homepage: data.homepage_uri,
      dependencies: this.convertRubyDeps(data.dependencies?.runtime || []),
      devDependencies: this.convertRubyDeps(data.dependencies?.development || []),
      versions: versions.map((v: any) => v.number),
    };
  }

  private convertRubyDeps(deps: any[]): Record<string, string> {
    const result: Record<string, string> = {};

    for (const dep of deps) {
      result[dep.name] = dep.requirements;
    }

    return result;
  }

  // Utility Methods

  private async fetchJson(url: string): Promise<any> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get registry URL for an ecosystem
   */
  getRegistryUrl(ecosystem: string): string {
    switch (ecosystem) {
      case "npm":
        return this.npmRegistry;
      case "pypi":
        return this.pypiRegistry;
      case "maven":
        return this.mavenCentral;
      case "rubygems":
        return this.rubygemsRegistry;
      default:
        throw new Error(`Unknown ecosystem: ${ecosystem}`);
    }
  }

  /**
   * Set custom registry URL
   */
  setRegistryUrl(ecosystem: string, url: string): void {
    switch (ecosystem) {
      case "npm":
        this.npmRegistry = url;
        break;
      case "pypi":
        this.pypiRegistry = url;
        break;
      case "maven":
        this.mavenCentral = url;
        break;
      case "rubygems":
        this.rubygemsRegistry = url;
        break;
      default:
        throw new Error(`Unknown ecosystem: ${ecosystem}`);
    }
  }
}
