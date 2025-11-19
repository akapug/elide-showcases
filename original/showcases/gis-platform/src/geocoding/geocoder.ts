/**
 * Geocoder
 *
 * Address resolution and reverse geocoding using python:geopy
 * with support for multiple providers and batch processing.
 */

// @ts-ignore
import geopy from 'python:geopy';
// @ts-ignore
import time from 'python:time';

import {
  GeocodingProvider,
  GeocodedLocation,
  ParsedAddress,
  GeocodingOptions,
  GeometryError,
} from '../types';

/**
 * Geocoder class for address resolution
 */
export class Geocoder {
  private geocoder: any;
  private cache: Map<string, GeocodedLocation> = new Map();
  private provider: GeocodingProvider;

  constructor(options?: {
    provider?: GeocodingProvider;
    apiKey?: string;
    userAgent?: string;
    timeout?: number;
  }) {
    this.provider = options?.provider || GeocodingProvider.Nominatim;
    this.geocoder = this.createGeocoder(options);
  }

  /**
   * Geocode an address to coordinates
   */
  async geocode(address: string, options?: GeocodingOptions): Promise<GeocodedLocation> {
    try {
      // Check cache
      const cacheKey = `geocode:${address}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      const location = this.geocoder.geocode(
        address,
        exactly_one=true,
        timeout=options?.timeout || 10
      );

      if (!location) {
        throw new Error(`Address not found: ${address}`);
      }

      const result: GeocodedLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        displayName: location.raw.display_name,
        importance: location.raw.importance,
        placeId: location.raw.place_id,
        type: location.raw.type,
        bbox: location.raw.boundingbox
          ? [
              parseFloat(location.raw.boundingbox[2]),
              parseFloat(location.raw.boundingbox[0]),
              parseFloat(location.raw.boundingbox[3]),
              parseFloat(location.raw.boundingbox[1]),
            ]
          : undefined,
        raw: location.raw,
      };

      // Cache result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      throw new GeometryError(`Geocoding failed: ${error}`);
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number, options?: GeocodingOptions): Promise<GeocodedLocation> {
    try {
      // Check cache
      const cacheKey = `reverse:${latitude},${longitude}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      const location = this.geocoder.reverse(
        `${latitude}, ${longitude}`,
        exactly_one=true,
        timeout=options?.timeout || 10
      );

      if (!location) {
        throw new Error(`Location not found: ${latitude}, ${longitude}`);
      }

      const result: GeocodedLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        displayName: location.raw.display_name,
        importance: location.raw.importance,
        placeId: location.raw.place_id,
        type: location.raw.type,
        raw: location.raw,
      };

      // Cache result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      throw new GeometryError(`Reverse geocoding failed: ${error}`);
    }
  }

  /**
   * Batch geocode multiple addresses
   */
  async batchGeocode(
    addresses: string[],
    options?: {
      maxConcurrent?: number;
      retryFailed?: boolean;
      rateLimit?: number;
    }
  ): Promise<Array<GeocodedLocation | null>> {
    const results: Array<GeocodedLocation | null> = [];
    const maxConcurrent = options?.maxConcurrent || 10;
    const rateLimit = options?.rateLimit || 1; // seconds between requests

    for (let i = 0; i < addresses.length; i += maxConcurrent) {
      const batch = addresses.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (address) => {
        try {
          // Rate limiting
          if (rateLimit > 0) {
            time.sleep(rateLimit);
          }

          return await this.geocode(address);
        } catch (error) {
          if (options?.retryFailed) {
            try {
              time.sleep(2); // Wait before retry
              return await this.geocode(address);
            } catch {
              return null;
            }
          }
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Batch reverse geocode multiple coordinates
   */
  async batchReverseGeocode(
    coordinates: Array<[number, number]>,
    options?: {
      maxConcurrent?: number;
      retryFailed?: boolean;
      rateLimit?: number;
    }
  ): Promise<Array<GeocodedLocation | null>> {
    const results: Array<GeocodedLocation | null> = [];
    const maxConcurrent = options?.maxConcurrent || 10;
    const rateLimit = options?.rateLimit || 1;

    for (let i = 0; i < coordinates.length; i += maxConcurrent) {
      const batch = coordinates.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async ([lat, lon]) => {
        try {
          if (rateLimit > 0) {
            time.sleep(rateLimit);
          }

          return await this.reverseGeocode(lat, lon);
        } catch (error) {
          if (options?.retryFailed) {
            try {
              time.sleep(2);
              return await this.reverseGeocode(lat, lon);
            } catch {
              return null;
            }
          }
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Parse address into components
   */
  async parseAddress(address: string): Promise<ParsedAddress> {
    try {
      // First geocode to get structured data
      const location = await this.geocode(address);

      const parsed: ParsedAddress = {};

      if (location.raw.address) {
        const addr = location.raw.address;
        parsed.streetNumber = addr.house_number;
        parsed.street = addr.road || addr.street;
        parsed.city = addr.city || addr.town || addr.village;
        parsed.county = addr.county;
        parsed.state = addr.state;
        parsed.postalCode = addr.postcode;
        parsed.country = addr.country;
      }

      return parsed;
    } catch (error) {
      throw new GeometryError(`Address parsing failed: ${error}`);
    }
  }

  /**
   * Suggest addresses based on partial input
   */
  async suggest(
    query: string,
    options?: {
      maxResults?: number;
      minScore?: number;
      bounds?: [number, number, number, number];
    }
  ): Promise<GeocodedLocation[]> {
    try {
      const maxResults = options?.maxResults || 5;

      const locations = this.geocoder.geocode(
        query,
        exactly_one=false,
        limit=maxResults,
        timeout=10
      );

      const suggestions: GeocodedLocation[] = [];

      for (const location of Array.from(locations)) {
        const importance = (location as any).raw.importance || 0;

        if (options?.minScore && importance < options.minScore) {
          continue;
        }

        suggestions.push({
          latitude: (location as any).latitude,
          longitude: (location as any).longitude,
          address: (location as any).address,
          displayName: (location as any).raw.display_name,
          importance,
          placeId: (location as any).raw.place_id,
          type: (location as any).raw.type,
          raw: (location as any).raw,
        });
      }

      return suggestions;
    } catch (error) {
      throw new GeometryError(`Suggestion failed: ${error}`);
    }
  }

  /**
   * Calculate match score between input and result
   */
  calculateMatchScore(input: string, result: GeocodedLocation): number {
    const inputLower = input.toLowerCase();
    const addressLower = result.address.toLowerCase();

    // Simple fuzzy matching based on common words
    const inputWords = new Set(inputLower.split(/\s+/));
    const addressWords = new Set(addressLower.split(/\s+/));

    let matches = 0;
    for (const word of inputWords) {
      if (addressWords.has(word)) {
        matches++;
      }
    }

    const score = matches / Math.max(inputWords.size, addressWords.size);
    return score;
  }

  /**
   * Normalize address format
   */
  normalizeAddress(address: string): string {
    // Remove extra whitespace
    let normalized = address.trim().replace(/\s+/g, ' ');

    // Standardize abbreviations
    const replacements: Record<string, string> = {
      'St.': 'Street',
      'Ave.': 'Avenue',
      'Blvd.': 'Boulevard',
      'Rd.': 'Road',
      'Dr.': 'Drive',
      'Ln.': 'Lane',
      'Ct.': 'Court',
      'Pl.': 'Place',
      'Apt.': 'Apartment',
      '#': 'Apartment',
    };

    for (const [abbr, full] of Object.entries(replacements)) {
      normalized = normalized.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
    }

    return normalized;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createGeocoder(options?: any): any {
    const timeout = options?.timeout || 10;
    const userAgent = options?.userAgent || 'elide-gis-platform/1.0';

    switch (this.provider) {
      case GeocodingProvider.Nominatim:
        return geopy.geocoders.Nominatim(user_agent=userAgent, timeout=timeout);

      case GeocodingProvider.Google:
        if (!options?.apiKey) {
          throw new Error('Google geocoder requires API key');
        }
        return geopy.geocoders.GoogleV3(api_key=options.apiKey, timeout=timeout);

      case GeocodingProvider.Bing:
        if (!options?.apiKey) {
          throw new Error('Bing geocoder requires API key');
        }
        return geopy.geocoders.Bing(api_key=options.apiKey, timeout=timeout);

      case GeocodingProvider.Here:
        if (!options?.apiKey) {
          throw new Error('Here geocoder requires API key');
        }
        return geopy.geocoders.Here(apikey=options.apiKey, timeout=timeout);

      case GeocodingProvider.MapBox:
        if (!options?.apiKey) {
          throw new Error('MapBox geocoder requires API key');
        }
        return geopy.geocoders.MapBox(api_key=options.apiKey, timeout=timeout);

      default:
        return geopy.geocoders.Nominatim(user_agent=userAgent, timeout=timeout);
    }
  }
}

export default Geocoder;
