/**
 * tzlookup - Timezone Lookup by Location
 * Based on https://www.npmjs.com/package/tzlookup (~300K downloads/week)
 */

interface Location {
  lat: number;
  lon: number;
}

const locationMap: Array<{ lat: number; lon: number; tz: string; range: number }> = [
  { lat: 40.7, lon: -74.0, tz: 'America/New_York', range: 5 },
  { lat: 41.9, lon: -87.6, tz: 'America/Chicago', range: 5 },
  { lat: 34.0, lon: -118.2, tz: 'America/Los_Angeles', range: 5 },
  { lat: 51.5, lon: -0.1, tz: 'Europe/London', range: 5 },
  { lat: 48.9, lon: 2.3, tz: 'Europe/Paris', range: 5 },
  { lat: 35.7, lon: 139.7, tz: 'Asia/Tokyo', range: 5 },
  { lat: -33.9, lon: 151.2, tz: 'Australia/Sydney', range: 5 }
];

function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

function tzlookup(lat: number, lon: number): string | null {
  let closest = { tz: null as string | null, dist: Infinity };

  for (const loc of locationMap) {
    const dist = distance(lat, lon, loc.lat, loc.lon);
    if (dist < loc.range && dist < closest.dist) {
      closest = { tz: loc.tz, dist };
    }
  }

  return closest.tz || 'UTC';
}

tzlookup.findTimezone = (location: Location): string | null => {
  return tzlookup(location.lat, location.lon);
};

export default tzlookup;

if (import.meta.url.includes("elide-tzlookup.ts")) {
  console.log("✅ tzlookup - Timezone Lookup by Location (POLYGLOT!)\n");

  console.log('New York (40.7, -74.0):', tzlookup(40.7, -74.0));
  console.log('Tokyo (35.7, 139.7):', tzlookup(35.7, 139.7));
  console.log('London (51.5, -0.1):', tzlookup(51.5, -0.1));
  console.log('Sydney (-33.9, 151.2):', tzlookup.findTimezone({ lat: -33.9, lon: 151.2 }));

  console.log("\n🚀 ~300K downloads/week | Lookup timezone by coordinates\n");
}
