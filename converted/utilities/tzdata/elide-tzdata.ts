/**
 * tzdata - Timezone Database
 * Based on https://www.npmjs.com/package/tzdata (~3M downloads/week)
 */

interface TimezoneData {
  name: string;
  abbr: string;
  offset: number;
  dst: boolean;
  utc: string[];
}

const timezoneDatabase: Record<string, TimezoneData> = {
  'America/New_York': {
    name: 'Eastern Time',
    abbr: 'EST/EDT',
    offset: -5,
    dst: true,
    utc: ['America/New_York', 'America/Detroit', 'America/Kentucky/Louisville']
  },
  'America/Chicago': {
    name: 'Central Time',
    abbr: 'CST/CDT',
    offset: -6,
    dst: true,
    utc: ['America/Chicago', 'America/Indiana/Knox', 'America/Menominee']
  },
  'America/Denver': {
    name: 'Mountain Time',
    abbr: 'MST/MDT',
    offset: -7,
    dst: true,
    utc: ['America/Denver', 'America/Boise', 'America/Phoenix']
  },
  'America/Los_Angeles': {
    name: 'Pacific Time',
    abbr: 'PST/PDT',
    offset: -8,
    dst: true,
    utc: ['America/Los_Angeles', 'America/Tijuana']
  },
  'Europe/London': {
    name: 'Greenwich Mean Time',
    abbr: 'GMT/BST',
    offset: 0,
    dst: true,
    utc: ['Europe/London', 'Europe/Dublin', 'Europe/Lisbon']
  },
  'Asia/Tokyo': {
    name: 'Japan Standard Time',
    abbr: 'JST',
    offset: 9,
    dst: false,
    utc: ['Asia/Tokyo']
  },
  'Australia/Sydney': {
    name: 'Australian Eastern Time',
    abbr: 'AEST/AEDT',
    offset: 10,
    dst: true,
    utc: ['Australia/Sydney', 'Australia/Melbourne']
  }
};

const tzdata = {
  zones: timezoneDatabase,

  getZone(name: string): TimezoneData | null {
    return timezoneDatabase[name] || null;
  },

  getAllZones(): string[] {
    return Object.keys(timezoneDatabase);
  },

  getOffset(name: string): number | null {
    const zone = timezoneDatabase[name];
    return zone ? zone.offset : null;
  },

  hasDST(name: string): boolean {
    const zone = timezoneDatabase[name];
    return zone ? zone.dst : false;
  }
};

export default tzdata;

if (import.meta.url.includes("elide-tzdata.ts")) {
  console.log("✅ tzdata - Timezone Database (POLYGLOT!)\n");

  const nyZone = tzdata.getZone('America/New_York');
  console.log('New York:', nyZone?.name, nyZone?.abbr);
  console.log('Offset:', tzdata.getOffset('America/New_York'), 'hours');
  console.log('Has DST:', tzdata.hasDST('Asia/Tokyo'));
  console.log('All zones:', tzdata.getAllZones().length);

  console.log("\n🚀 ~3M downloads/week | Timezone database\n");
}
