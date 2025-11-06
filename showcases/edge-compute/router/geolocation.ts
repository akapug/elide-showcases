/**
 * Geolocation Service - Determines user location and routes to nearest edge
 *
 * Provides IP geolocation and region-based routing.
 */

export interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp?: string;
}

export interface EdgeLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  active: boolean;
  capacity: number;
}

export class GeolocationService {
  private edgeLocations: Map<string, EdgeLocation>;
  private geoCache: Map<string, GeoLocation>;

  constructor() {
    this.edgeLocations = new Map();
    this.geoCache = new Map();

    // Initialize with default edge locations
    this.initializeDefaultLocations();
  }

  /**
   * Get geolocation for an IP address
   */
  async getLocation(ip: string): Promise<GeoLocation | null> {
    // Check cache
    if (this.geoCache.has(ip)) {
      return this.geoCache.get(ip)!;
    }

    // In production, use a real geolocation service (MaxMind, IPStack, etc.)
    // For now, use a simple mock based on IP patterns
    const location = this.mockGeolocate(ip);

    if (location) {
      // Cache the result
      this.geoCache.set(ip, location);
    }

    return location;
  }

  /**
   * Find nearest edge location
   */
  findNearest(
    location: GeoLocation,
    options?: { minCapacity?: number; region?: string }
  ): EdgeLocation | null {
    const candidates = Array.from(this.edgeLocations.values()).filter(
      (edge) =>
        edge.active &&
        (!options?.minCapacity || edge.capacity >= options.minCapacity) &&
        (!options?.region || edge.region === options.region)
    );

    if (candidates.length === 0) return null;

    // Calculate distances
    const withDistances = candidates.map((edge) => ({
      edge,
      distance: this.calculateDistance(
        location.latitude,
        location.longitude,
        edge.latitude,
        edge.longitude
      ),
    }));

    // Sort by distance
    withDistances.sort((a, b) => a.distance - b.distance);

    return withDistances[0].edge;
  }

  /**
   * Register an edge location
   */
  registerEdge(location: EdgeLocation): void {
    this.edgeLocations.set(location.id, location);
  }

  /**
   * Unregister an edge location
   */
  unregisterEdge(locationId: string): boolean {
    return this.edgeLocations.delete(locationId);
  }

  /**
   * Get all edge locations
   */
  getEdgeLocations(filter?: { region?: string; country?: string }): EdgeLocation[] {
    let locations = Array.from(this.edgeLocations.values());

    if (filter?.region) {
      locations = locations.filter((l) => l.region === filter.region);
    }

    if (filter?.country) {
      locations = locations.filter((l) => l.country === filter.country);
    }

    return locations;
  }

  /**
   * Get edge location by ID
   */
  getEdgeLocation(locationId: string): EdgeLocation | undefined {
    return this.edgeLocations.get(locationId);
  }

  /**
   * Get routing recommendation
   */
  async getRoutingRecommendation(ip: string): Promise<{
    location: GeoLocation;
    edge: EdgeLocation;
    distance: number;
    region: string;
  } | null> {
    const location = await this.getLocation(ip);
    if (!location) return null;

    const edge = this.findNearest(location);
    if (!edge) return null;

    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      edge.latitude,
      edge.longitude
    );

    return {
      location,
      edge,
      distance,
      region: edge.region,
    };
  }

  /**
   * Clear geolocation cache
   */
  clearCache(): void {
    this.geoCache.clear();
  }

  // Private helper methods

  private initializeDefaultLocations(): void {
    // North America
    this.registerEdge({
      id: 'us-east-1',
      name: 'US East (Virginia)',
      region: 'us-east',
      country: 'US',
      latitude: 37.4316,
      longitude: -78.6569,
      active: true,
      capacity: 1000,
    });

    this.registerEdge({
      id: 'us-west-1',
      name: 'US West (California)',
      region: 'us-west',
      country: 'US',
      latitude: 37.3861,
      longitude: -122.0839,
      active: true,
      capacity: 1000,
    });

    // Europe
    this.registerEdge({
      id: 'eu-west-1',
      name: 'EU West (Ireland)',
      region: 'eu-west',
      country: 'IE',
      latitude: 53.3498,
      longitude: -6.2603,
      active: true,
      capacity: 1000,
    });

    this.registerEdge({
      id: 'eu-central-1',
      name: 'EU Central (Frankfurt)',
      region: 'eu-central',
      country: 'DE',
      latitude: 50.1109,
      longitude: 8.6821,
      active: true,
      capacity: 1000,
    });

    // Asia Pacific
    this.registerEdge({
      id: 'ap-southeast-1',
      name: 'Asia Pacific (Singapore)',
      region: 'ap-southeast',
      country: 'SG',
      latitude: 1.3521,
      longitude: 103.8198,
      active: true,
      capacity: 1000,
    });

    this.registerEdge({
      id: 'ap-northeast-1',
      name: 'Asia Pacific (Tokyo)',
      region: 'ap-northeast',
      country: 'JP',
      latitude: 35.6762,
      longitude: 139.6503,
      active: true,
      capacity: 1000,
    });
  }

  private mockGeolocate(ip: string): GeoLocation | null {
    // Simple mock based on IP patterns
    // In production, use a real geolocation service

    const parts = ip.split('.');
    if (parts.length !== 4) return null;

    const firstOctet = parseInt(parts[0]);

    // US IPs (simplified)
    if (firstOctet >= 1 && firstOctet <= 126) {
      return {
        ip,
        country: 'United States',
        countryCode: 'US',
        region: 'California',
        regionCode: 'CA',
        city: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: 'America/Los_Angeles',
        isp: 'Example ISP',
      };
    }

    // Europe IPs (simplified)
    if (firstOctet >= 127 && firstOctet <= 191) {
      return {
        ip,
        country: 'United Kingdom',
        countryCode: 'GB',
        region: 'England',
        regionCode: 'ENG',
        city: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        timezone: 'Europe/London',
        isp: 'Example ISP',
      };
    }

    // Asia IPs (simplified)
    return {
      ip,
      country: 'Singapore',
      countryCode: 'SG',
      region: 'Central',
      regionCode: 'CEN',
      city: 'Singapore',
      latitude: 1.3521,
      longitude: 103.8198,
      timezone: 'Asia/Singapore',
      isp: 'Example ISP',
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula
    const R = 6371; // Earth's radius in km

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

export default GeolocationService;
