/**
 * iso-datestring-validator - ISO Date String Validation
 * Based on https://www.npmjs.com/package/iso-datestring-validator (~1M downloads/week)
 */

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/;
const isoTimeRegex = /^\d{2}:\d{2}:\d{2}(?:\.\d{3})?$/;

function isValidDate(dateString: string): boolean {
  if (!isoDateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function isValidDateTime(dateTimeString: string): boolean {
  if (!isoDateTimeRegex.test(dateTimeString)) {
    return false;
  }

  const date = new Date(dateTimeString);
  return !isNaN(date.getTime());
}

function isValidTime(timeString: string): boolean {
  if (!isoTimeRegex.test(timeString)) {
    return false;
  }

  const parts = timeString.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseFloat(parts[2]);

  return hours >= 0 && hours <= 23 &&
         minutes >= 0 && minutes <= 59 &&
         seconds >= 0 && seconds < 60;
}

function isValidISOString(str: string): boolean {
  return isValidDate(str) || isValidDateTime(str) || isValidTime(str);
}

const validator = {
  isValidDate,
  isValidDateTime,
  isValidTime,
  isValidISOString
};

export default validator;

if (import.meta.url.includes("elide-iso-datestring-validator.ts")) {
  console.log("✅ iso-datestring-validator - ISO Date Validation (POLYGLOT!)\n");

  console.log('Valid date:', validator.isValidDate('2025-11-18'));
  console.log('Invalid date:', validator.isValidDate('2025-13-45'));
  console.log('Valid datetime:', validator.isValidDateTime('2025-11-18T15:30:00Z'));
  console.log('Valid time:', validator.isValidTime('15:30:00'));
  console.log('Valid ISO:', validator.isValidISOString('2025-11-18'));

  console.log("\n🚀 ~1M downloads/week | Validate ISO date strings\n");
}
