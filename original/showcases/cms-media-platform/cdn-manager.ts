/**
 * CDN Manager
 *
 * Simulates CDN integration for content delivery:
 * - Asset distribution to edge locations
 * - Cache management and purging
 * - Geographic routing simulation
 * - Performance metrics
 * - Asset versioning
 * - Bandwidth optimization
 */

export interface CDNAsset {
  path: string;
  data: string | Buffer;
  contentType: string;
  size: number;
  etag: string;
  cacheControl: string;
  uploadedAt: Date;
  lastAccessed: Date;
  accessCount: number;
  regions: string[];
}

export interface EdgeLocation {
  id: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  capacity: number;
  currentLoad: number;
  assets: Set<string>;
}

export interface CDNStats {
  totalAssets: number;
  totalSize: number;
  totalBandwidth: number;
  hitRate: number;
  avgLatency: number;
  assetsByRegion: Record<string, number>;
  popularAssets: Array<{ path: string; hits: number }>;
}

export class CDNManager {
  private assets: Map<string, CDNAsset> = new Map();
  private edgeLocations: Map<string, EdgeLocation> = new Map();
  private stats: CDNStats = {
    totalAssets: 0,
    totalSize: 0,
    totalBandwidth: 0,
    hitRate: 0,
    avgLatency: 0,
    assetsByRegion: {},
    popularAssets: []
  };

  private hits = 0;
  private misses = 0;
  private latencies: number[] = [];

  constructor() {
    this.initializeEdgeLocations();
    this.startMaintenanceJobs();
    console.log('🌐 CDN Manager initialized');
  }

  /**
   * Initialize edge locations (simulated global CDN)
   */
  private initializeEdgeLocations(): void {
    const locations = [
      { id: 'us-east-1', region: 'North America', city: 'New York', lat: 40.7128, lon: -74.0060 },
      { id: 'us-west-1', region: 'North America', city: 'San Francisco', lat: 37.7749, lon: -122.4194 },
      { id: 'eu-west-1', region: 'Europe', city: 'London', lat: 51.5074, lon: -0.1278 },
      { id: 'eu-central-1', region: 'Europe', city: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
      { id: 'ap-southeast-1', region: 'Asia Pacific', city: 'Singapore', lat: 1.3521, lon: 103.8198 },
      { id: 'ap-northeast-1', region: 'Asia Pacific', city: 'Tokyo', lat: 35.6762, lon: 139.6503 },
      { id: 'sa-east-1', region: 'South America', city: 'São Paulo', lat: -23.5505, lon: -46.6333 }
    ];

    for (const loc of locations) {
      this.edgeLocations.set(loc.id, {
        id: loc.id,
        region: loc.region,
        city: loc.city,
        latitude: loc.lat,
        longitude: loc.lon,
        capacity: 1024 * 1024 * 1024 * 100, // 100GB per location
        currentLoad: 0,
        assets: new Set()
      });
    }
  }

  /**
   * Upload asset to CDN
   */
  async uploadAsset(asset: any): Promise<{ success: boolean; url: string; regions: string[] }> {
    const path = asset.url || asset.path;
    const data = asset.data || 'simulated-binary-data';
    const size = asset.size || this.calculateSize(data);

    // Generate ETag for caching
    const etag = this.generateETag(data);

    const cdnAsset: CDNAsset = {
      path,
      data,
      contentType: asset.contentType || asset.mimeType || 'application/octet-stream',
      size,
      etag,
      cacheControl: 'public, max-age=31536000, immutable',
      uploadedAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      regions: []
    };

    // Distribute to edge locations
    const regions = await this.distributeToEdges(path, size);
    cdnAsset.regions = regions;

    this.assets.set(path, cdnAsset);

    // Update stats
    this.stats.totalAssets++;
    this.stats.totalSize += size;

    for (const region of regions) {
      this.stats.assetsByRegion[region] = (this.stats.assetsByRegion[region] || 0) + 1;
    }

    return {
      success: true,
      url: `https://cdn.example.com${path}`,
      regions
    };
  }

  /**
   * Distribute asset to edge locations
   */
  private async distributeToEdges(path: string, size: number): Promise<string[]> {
    const regions: string[] = [];

    // Distribute to all edge locations with capacity
    for (const [locationId, location] of this.edgeLocations) {
      if (location.currentLoad + size <= location.capacity) {
        location.assets.add(path);
        location.currentLoad += size;
        regions.push(locationId);
      }
    }

    // If no locations have capacity, use primary locations
    if (regions.length === 0) {
      regions.push('us-east-1', 'eu-west-1', 'ap-southeast-1');
    }

    // Simulate network latency
    await this.simulateLatency(50);

    return regions;
  }

  /**
   * Get asset from CDN
   */
  getAsset(path: string): CDNAsset | null {
    const asset = this.assets.get(path);

    if (asset) {
      // Update access metrics
      asset.lastAccessed = new Date();
      asset.accessCount++;
      this.hits++;

      // Track latency (simulated)
      const latency = this.simulateLatencyValue();
      this.latencies.push(latency);

      // Update stats
      this.stats.totalBandwidth += asset.size;
      this.updateHitRate();

      return asset;
    }

    this.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Purge asset from CDN
   */
  async purgeAsset(path: string): Promise<boolean> {
    const asset = this.assets.get(path);
    if (!asset) return false;

    // Remove from all edge locations
    for (const [locationId, location] of this.edgeLocations) {
      if (location.assets.has(path)) {
        location.assets.delete(path);
        location.currentLoad -= asset.size;
      }
    }

    this.assets.delete(path);

    // Update stats
    this.stats.totalAssets--;
    this.stats.totalSize -= asset.size;

    await this.simulateLatency(30);

    return true;
  }

  /**
   * Purge by pattern (wildcard support)
   */
  async purgePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const paths = Array.from(this.assets.keys()).filter(path => regex.test(path));

    let purged = 0;
    for (const path of paths) {
      if (await this.purgeAsset(path)) {
        purged++;
      }
    }

    return purged;
  }

  /**
   * Purge all assets for a user
   */
  async purgeUserAssets(userId: string): Promise<number> {
    return await this.purgePattern(`/cdn/media/${userId}/.*`);
  }

  /**
   * Get closest edge location for client
   */
  getClosestEdge(clientLat: number, clientLon: number): EdgeLocation | null {
    let closest: EdgeLocation | null = null;
    let minDistance = Infinity;

    for (const location of this.edgeLocations.values()) {
      const distance = this.calculateDistance(
        clientLat,
        clientLon,
        location.latitude,
        location.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = location;
      }
    }

    return closest;
  }

  /**
   * Calculate geographic distance (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Sync content across all edge locations
   */
  async syncContent(): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    for (const asset of this.assets.values()) {
      try {
        // Ensure asset is in all primary locations
        const primaryLocations = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];

        for (const locationId of primaryLocations) {
          const location = this.edgeLocations.get(locationId);
          if (location && !location.assets.has(asset.path)) {
            if (location.currentLoad + asset.size <= location.capacity) {
              location.assets.add(asset.path);
              location.currentLoad += asset.size;
            }
          }
        }

        synced++;
      } catch (error) {
        failed++;
      }
    }

    await this.simulateLatency(100);

    return { synced, failed };
  }

  /**
   * Get asset distribution info
   */
  getAssetDistribution(path: string): {
    locations: Array<{ location: EdgeLocation; latency: number }>;
    replicationFactor: number;
  } {
    const asset = this.assets.get(path);
    if (!asset) {
      return { locations: [], replicationFactor: 0 };
    }

    const locations = Array.from(this.edgeLocations.values())
      .filter(loc => loc.assets.has(path))
      .map(loc => ({
        location: loc,
        latency: this.simulateLatencyValue()
      }));

    return {
      locations,
      replicationFactor: locations.length
    };
  }

  /**
   * Optimize asset delivery (prefetch, preload)
   */
  async optimizeDelivery(paths: string[]): Promise<void> {
    // Simulate warming up caches
    for (const path of paths) {
      const asset = this.assets.get(path);
      if (asset) {
        // Ensure it's in all edge locations
        await this.distributeToEdges(path, asset.size);
      }
    }
  }

  /**
   * Get CDN statistics
   */
  getStats(): CDNStats {
    // Calculate average latency
    if (this.latencies.length > 0) {
      const sum = this.latencies.reduce((a, b) => a + b, 0);
      this.stats.avgLatency = Math.round(sum / this.latencies.length);
    }

    // Get popular assets
    const assetsByHits = Array.from(this.assets.entries())
      .map(([path, asset]) => ({ path, hits: asset.accessCount }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    this.stats.popularAssets = assetsByHits;

    return {
      ...this.stats,
      totalSize: Math.round(this.stats.totalSize / 1024 / 1024), // Convert to MB
      totalBandwidth: Math.round(this.stats.totalBandwidth / 1024 / 1024) // Convert to MB
    };
  }

  /**
   * Get edge location stats
   */
  getEdgeStats(): Array<{
    location: EdgeLocation;
    utilizationPercent: number;
    assetCount: number;
  }> {
    return Array.from(this.edgeLocations.values()).map(location => ({
      location,
      utilizationPercent: Math.round((location.currentLoad / location.capacity) * 100),
      assetCount: location.assets.size
    }));
  }

  /**
   * Maintenance jobs
   */
  private startMaintenanceJobs(): void {
    // Cleanup old assets every hour
    setInterval(() => {
      this.cleanupOldAssets();
    }, 3600000);

    // Reset bandwidth stats daily
    setInterval(() => {
      this.stats.totalBandwidth = 0;
    }, 86400000);
  }

  /**
   * Cleanup assets not accessed in 30 days
   */
  private cleanupOldAssets(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDelete: string[] = [];

    for (const [path, asset] of this.assets) {
      if (asset.lastAccessed < thirtyDaysAgo && asset.accessCount < 10) {
        toDelete.push(path);
      }
    }

    for (const path of toDelete) {
      this.purgeAsset(path);
    }

    if (toDelete.length > 0) {
      console.log(`🧹 CDN: Cleaned up ${toDelete.length} old assets`);
    }
  }

  /**
   * Utility functions
   */

  private updateHitRate(): void {
    const total = this.hits + this.misses;
    if (total > 0) {
      this.stats.hitRate = Math.round((this.hits / total) * 100);
    }
  }

  private generateETag(data: any): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `"${Math.abs(hash).toString(36)}"`;
  }

  private calculateSize(data: any): number {
    if (typeof data === 'string') {
      return data.length;
    }
    return JSON.stringify(data).length;
  }

  private simulateLatencyValue(): number {
    // Simulate latency between 10-100ms
    return 10 + Math.floor(Math.random() * 90);
  }

  private async simulateLatency(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate signed URLs for secure access
   */
  generateSignedUrl(path: string, expiresIn = 3600): { url: string; expiresAt: Date } {
    const asset = this.assets.get(path);
    if (!asset) {
      throw new Error('Asset not found');
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const signature = this.generateETag(`${path}:${expiresAt.getTime()}`);

    return {
      url: `https://cdn.example.com${path}?signature=${signature}&expires=${expiresAt.getTime()}`,
      expiresAt
    };
  }

  /**
   * Validate signed URL
   */
  validateSignedUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const expires = parseInt(urlObj.searchParams.get('expires') || '0');
      const signature = urlObj.searchParams.get('signature');

      if (!expires || !signature) return false;

      // Check expiration
      if (Date.now() > expires) return false;

      // Verify signature (simplified)
      const path = urlObj.pathname;
      const expectedSignature = this.generateETag(`${path}:${expires}`);

      return signature === expectedSignature;
    } catch {
      return false;
    }
  }
}
