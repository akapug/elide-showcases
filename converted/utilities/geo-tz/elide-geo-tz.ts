/**
 * geo-tz - Geographic Timezone Lookup
 * Based on https://www.npmjs.com/package/geo-tz (~500K downloads/week)
 */

interface Coordinates {
  lat: number;
  lng: number;
}

const geoData: Array<{ minLat: number; maxLat: number; minLng: number; maxLng: number; tz: string }> = [
  { minLat: 38, maxLat: 43, minLng: -76, maxLng: -72, tz: 'America/New_York' },
  { minLat: 40, maxLat: 44, minLng: -90, maxLng: -85, tz: 'America/Chicago' },
  { minLat: 32, maxLat: 36, minLng: -120, maxLng: -116, tz: 'America/Los_Angeles' },
  { minLat: 50, maxLat: 53, minLng: -2, maxLng: 2, tz: 'Europe/London' },
  { minLat: 34, maxLat: 37, minLng: 138, maxLng: 141, tz: 'Asia/Tokyo' },
  { minLat: -35, maxLat: -32, minLng: 150, maxLng: 153, tz: 'Australia/Sydney' }
];

function geoTz(lat: number, lng: number): string[] {
  const results: string[] = [];

  for (const region of geoData) {
    if (lat >= region.minLat && lat <= region.maxLat &&
        lng >= region.minLng && lng <= region.maxLng) {
      results.push(region.tz);
    }
  }

  return results.length > 0 ? results : ['UTC'];
}

geoTz.find = (lat: number, lng: number): string[] => {
  return geoTz(lat, lng);
};

geoTz.findFromCoords = (coords: Coordinates): string[] => {
  return geoTz(coords.lat, coords.lng);
};

export default geoTz;

if (import.meta.url.includes("elide-geo-tz.ts")) {
  console.log("✅ geo-tz - Geographic Timezone Lookup (POLYGLOT!)\n");

  console.log('New York (40.7, -74.0):', geoTz(40.7, -74.0));
  console.log('Tokyo (35.7, 139.7):', geoTz(35.7, 139.7));
  console.log('London (51.5, -0.1):', geoTz.find(51.5, -0.1));
  console.log('Sydney (-33.9, 151.2):', geoTz.findFromCoords({ lat: -33.9, lng: 151.2 }));

  console.log("\n🚀 ~500K downloads/week | Geographic timezone lookup\n");
}
