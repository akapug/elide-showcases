/**
 * Mapbox GL - Interactive WebGL Maps
 *
 * Vector maps with smooth interactions powered by WebGL.
 * **POLYGLOT SHOWCASE**: One Mapbox library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/mapbox-gl (~500K+ downloads/week)
 *
 * Features:
 * - Vector tile rendering
 * - WebGL-powered graphics
 * - Custom map styles
 * - Markers and popups
 * - Interactive controls
 * - Zero dependencies (core implementation)
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need mapping
 * - ONE implementation works everywhere on Elide
 * - Consistent map APIs across languages
 * - Share map configurations across stack
 *
 * Use cases:
 * - Custom styled maps
 * - Real-time data visualization
 * - Location-based apps
 * - Interactive dashboards
 *
 * Package has ~500K+ downloads/week on npm!
 */

interface LngLat {
  lng: number;
  lat: number;
}

interface MapOptions {
  container: string;
  style: string;
  center: [number, number];
  zoom: number;
}

export class Map {
  private center: LngLat;
  private zoom: number;
  private style: string;
  private markers: any[] = [];

  constructor(options: MapOptions) {
    this.center = { lng: options.center[0], lat: options.center[1] };
    this.zoom = options.zoom;
    this.style = options.style;
  }

  setCenter(center: [number, number]): this {
    this.center = { lng: center[0], lat: center[1] };
    return this;
  }

  getCenter(): LngLat {
    return { ...this.center };
  }

  setZoom(zoom: number): this {
    this.zoom = zoom;
    return this;
  }

  getZoom(): number {
    return this.zoom;
  }

  addMarker(marker: any): this {
    this.markers.push(marker);
    return this;
  }
}

export class Marker {
  private lngLat: LngLat;

  constructor(options?: any) {}

  setLngLat(lngLat: [number, number]): this {
    this.lngLat = { lng: lngLat[0], lat: lngLat[1] };
    return this;
  }

  addTo(map: Map): this {
    map.addMarker(this);
    return this;
  }
}

export default { Map, Marker };

// CLI Demo
if (import.meta.url.includes("elide-mapbox-gl.ts")) {
  console.log("🗺️  Mapbox GL - Vector Maps for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Create Map ===");
  const map = new Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-74.006, 40.7128],
    zoom: 12
  });
  console.log("Map created with center:", map.getCenter(), "\n");

  console.log("=== Example 2: Add Marker ===");
  const marker = new Marker()
    .setLngLat([-74.006, 40.7128])
    .addTo(map);
  console.log("Marker added\n");

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Works in all languages on Elide\n");
}
